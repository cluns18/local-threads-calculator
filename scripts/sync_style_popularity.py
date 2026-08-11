#!/usr/bin/env python3
"""Sync a popularity signal for every garment style into Supabase.

S&S stocks deep on the blanks that actually sell, so the number of units they
currently hold across every SKU of a style is a usable proxy for popularity.
Gildan 5000 sits around 2.3M units, Next Level 3600 around 900K, and a niche
style lands in the low thousands. That ordering is what the calculator's
"browse all styles" search sorts by.

Writes to `style_popularity`, keyed on ss_style_id. It is a project-owned table
on purpose: `garments` and `garment_colors` are rebuilt by the OBG catalog
syncs, and those syncs null any column they do not know about.

Usage:
    python3 scripts/sync_style_popularity.py            # full sync
    python3 scripts/sync_style_popularity.py --report   # dry run, no writes
    python3 scripts/sync_style_popularity.py --limit 50 # first 50 styles only
"""

import argparse
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request
from collections import defaultdict

SUPABASE_PROJECT = os.environ.get("SUPABASE_PROJECT_REF", "ydwzfnawueliuvywedla")
SUPABASE_PAT = os.environ.get("SUPABASE_PAT")
SS_ACCOUNT = os.environ.get("SS_ACCOUNT")
SS_API_KEY = os.environ.get("SS_API_KEY")

# The Supabase Management API 403s urllib's default User-Agent.
USER_AGENT = "obg-popularity-sync/1.0"

# S&S returns every SKU of every requested style, so a batch of 25 styles is
# already ~13K rows. Bigger batches start timing out.
SS_BATCH = 25
# Statements bigger than ~40 rows fail against the Management API (silently,
# with an HTTP 200 and an error body), so keep the upsert chunks small.
UPSERT_CHUNK = 40


def die(msg):
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def run_sql(query):
    """Execute SQL via the Supabase Management API.

    The API answers HTTP 200 with an `error` key when a statement fails, so the
    status code alone is not proof the write landed. Always inspect the body.
    """
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{SUPABASE_PROJECT}/database/query",
        data=json.dumps({"query": query}).encode(),
        headers={
            "Authorization": f"Bearer {SUPABASE_PAT}",
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT,
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        body = json.loads(resp.read().decode())
    if isinstance(body, dict) and "error" in body:
        die(f"SQL failed: {body['error']}\nquery: {query[:400]}")
    return body


def ss_products(style_ids):
    """Return the raw product rows for a batch of S&S style IDs."""
    auth = base64.b64encode(f"{SS_ACCOUNT}:{SS_API_KEY}".encode()).decode()
    ids = ",".join(str(s) for s in style_ids)
    req = urllib.request.Request(
        f"https://api.ssactivewear.com/v2/products/?style={ids}&mediatype=json",
        headers={"Authorization": f"Basic {auth}", "User-Agent": USER_AGENT},
    )
    with urllib.request.urlopen(req, timeout=180) as resp:
        body = json.loads(resp.read().decode())
    # S&S answers with an `errors` object when none of the styles resolve.
    if isinstance(body, dict):
        return []
    return body


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--report", action="store_true", help="dry run, no writes")
    ap.add_argument("--limit", type=int, help="only sync the first N styles")
    args = ap.parse_args()

    for name, val in (("SUPABASE_PAT", SUPABASE_PAT), ("SS_ACCOUNT", SS_ACCOUNT),
                      ("SS_API_KEY", SS_API_KEY)):
        if not val:
            die(f"{name} is not set")

    rows = run_sql(
        "select distinct ss_style_id from garments "
        "where ss_style_id is not null and coalesce(discontinued,false)=false "
        "order by ss_style_id"
    )
    style_ids = [r["ss_style_id"] for r in rows]
    if args.limit:
        style_ids = style_ids[: args.limit]
    print(f"{len(style_ids)} styles to sync", flush=True)

    totals = defaultdict(int)
    counts = defaultdict(int)
    missing = 0

    for i in range(0, len(style_ids), SS_BATCH):
        batch = style_ids[i : i + SS_BATCH]
        for attempt in range(3):
            try:
                products = ss_products(batch)
                break
            except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
                if attempt == 2:
                    print(f"  batch {i} failed after 3 tries: {e}", flush=True)
                    products = []
                else:
                    time.sleep(2 * (attempt + 1))
        for p in products:
            sid = p.get("styleID")
            if sid is None:
                continue
            totals[sid] += int(p.get("qty") or 0)
            counts[sid] += 1
        seen = {p.get("styleID") for p in products}
        missing += len([s for s in batch if s not in seen])
        # stdout is buffered when redirected, so flush or a long run looks dead.
        print(f"  {min(i + SS_BATCH, len(style_ids))}/{len(style_ids)} styles, "
              f"{len(totals)} with stock", flush=True)

    print(f"\n{len(totals)} styles returned inventory, {missing} returned nothing")
    if totals:
        top = sorted(totals.items(), key=lambda kv: -kv[1])[:10]
        print("Top 10 by stocked units:")
        for sid, qty in top:
            print(f"  styleID {sid:>6}  {qty:>10,} units  ({counts[sid]} skus)")

    if args.report:
        print("\n--report: no writes made")
        return

    written = 0
    items = list(totals.items())
    for i in range(0, len(items), UPSERT_CHUNK):
        chunk = items[i : i + UPSERT_CHUNK]
        values = ",".join(
            f"({sid},{qty},{counts[sid]},now())" for sid, qty in chunk
        )
        run_sql(
            "insert into style_popularity (ss_style_id, total_qty, sku_count, synced_at) "
            f"values {values} "
            "on conflict (ss_style_id) do update set "
            "total_qty=excluded.total_qty, sku_count=excluded.sku_count, "
            "synced_at=excluded.synced_at"
        )
        written += len(chunk)
        print(f"  wrote {written}/{len(items)}", flush=True)

    # Verify from the database, never from what the API returned.
    check = run_sql(
        "select count(*) n, sum(total_qty) q from style_popularity where total_qty > 0"
    )
    print(f"\nVERIFIED in db: {check[0]['n']} styles, {int(check[0]['q']):,} total units")


if __name__ == "__main__":
    main()
