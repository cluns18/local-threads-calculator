#!/usr/bin/env python3
"""Sync the human-readable name and a short spec line for every S&S style.

The picker used to show only "Gildan 5000", which means nothing to a customer
who does not already know the blank. S&S carries a real product name in `title`
("Unisex Heavy Cotton(TM) T-Shirt") and a spec bullet list in `description`,
neither of which the shared garment DB stored in a usable form. This pulls both
and writes a display-ready pair:

    title   Unisex Heavy Cotton(TM) T-Shirt
    blurb   5.3 oz - 100% U.S. cotton

`garments.description` already holds the raw S&S HTML, but it is a full bullet
list with entities and inline styles in it, far too heavy to render on a card.
The blurb is cooked here, once, rather than parsed in the browser on every page
of results.

Writes to `style_details`, keyed on ss_style_id. Project-owned table, same
reasoning as style_popularity: the OBG catalog syncs rebuild `garments` and null
any column they do not recognize.

The whole S&S style catalog comes back in ONE request (~5,600 styles), so this
is much cheaper than the popularity sync. Re-run it on any catalog refresh.

Usage:
    python3 scripts/sync_style_details.py            # full sync
    python3 scripts/sync_style_details.py --report   # dry run, no writes
"""

import argparse
import base64
import html
import json
import os
import re
import sys
import urllib.request

SUPABASE_PROJECT = os.environ.get("SUPABASE_PROJECT_REF", "ydwzfnawueliuvywedla")
SUPABASE_PAT = os.environ.get("SUPABASE_PAT")
SS_ACCOUNT = os.environ.get("SS_ACCOUNT")
SS_API_KEY = os.environ.get("SS_API_KEY")

# The Supabase Management API 403s urllib's default User-Agent.
USER_AGENT = "obg-details-sync/1.0"

# Statements bigger than ~40 rows fail against the Management API (silently,
# with an HTTP 200 and an error body), so keep the upsert chunks small.
UPSERT_CHUNK = 40

# A fiber content reads either as a percentage or as a blend ratio.
FIBER = re.compile(r"(\d+%|\d+/\d+)")


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


def ss_styles():
    """Every style S&S publishes, in one request."""
    auth = base64.b64encode(f"{SS_ACCOUNT}:{SS_API_KEY}".encode()).decode()
    req = urllib.request.Request(
        "https://api.ssactivewear.com/v2/styles/?mediatype=json",
        headers={"Authorization": f"Basic {auth}", "User-Agent": USER_AGENT},
    )
    with urllib.request.urlopen(req, timeout=180) as resp:
        return json.loads(resp.read().decode())


def bullets(desc):
    """Flatten the S&S description HTML into plain-text bullets."""
    if not desc:
        return []
    items = re.findall(r"<li[^>]*>(.*?)</li>", desc, re.S | re.I)
    if not items:
        items = re.split(r"<br\s*/?>|</p>", desc, flags=re.I)
    out = []
    for item in items:
        text = html.unescape(re.sub(r"<[^>]+>", "", item)).replace("\xa0", " ")
        text = re.sub(r"\s+", " ", text).strip(" .;,")
        if text:
            out.append(text)
    return out


def make_blurb(desc):
    """Pull a garment weight and a fiber content out of the spec bullets.

    Those two facts are what a customer actually compares blanks on. Everything
    else in the list is closure hardware and care instructions.
    """
    weight = fabric = None
    for bullet in bullets(desc)[:3]:
        # S&S doubles up US and metric weights in one segment:
        # "6 oz./yd² (US) 10 oz./L yd (CA)". Keep the US figure, drop the other.
        bullet = re.sub(r"\s*\(US\).*?\(CA\)", " (US)", bullet)
        for part in re.split(r",(?![^(]*\))", bullet):
            part = re.sub(r"^\s*(fabric|body|shell)\s*:\s*", "", part.strip(), flags=re.I)
            part = part.strip(" .;,")
            if not part or "/L yd" in part:
                continue
            match = re.match(r"([\d.]+)\s*oz", part, re.I)
            if match:
                if weight is None:
                    weight = f"{match.group(1)} oz"
                continue
            # "Grey Heather is 75/25 cotton/polyester" and "Neon colors are
            # 55/45 cotton/polyester" are per-color caveats, not the fabric of
            # the garment itself. They all read as "<color> is/are <blend>".
            if re.search(r"\b(is|are)\b", part, re.I):
                continue
            if fabric is None and FIBER.search(part) and len(part) < 55:
                fabric = part
        if weight and fabric:
            break

    if weight and fabric:
        return f"{weight} · {fabric}"
    if fabric or weight:
        return fabric or weight
    first = bullets(desc)
    return first[0][:70] if first else None


def sql_str(value):
    if value is None:
        return "null"
    return "'" + value.replace("'", "''") + "'"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--report", action="store_true", help="dry run, no writes")
    args = ap.parse_args()

    for name, val in (("SUPABASE_PAT", SUPABASE_PAT), ("SS_ACCOUNT", SS_ACCOUNT),
                      ("SS_API_KEY", SS_API_KEY)):
        if not val:
            die(f"{name} is not set")

    # Only bother with styles the DB actually carries.
    rows = run_sql(
        "select distinct ss_style_id from garments "
        "where ss_style_id is not null and coalesce(discontinued,false)=false"
    )
    wanted = {r["ss_style_id"] for r in rows}
    print(f"{len(wanted)} styles in the garment DB", flush=True)

    styles = ss_styles()
    print(f"{len(styles)} styles returned by S&S", flush=True)

    details = []
    for s in styles:
        sid = s.get("styleID")
        if sid not in wanted:
            continue
        title = (s.get("title") or "").strip() or None
        blurb = make_blurb(s.get("description"))
        if title or blurb:
            details.append((sid, title, blurb))

    with_both = sum(1 for _, t, b in details if t and b)
    print(f"{len(details)} matched, {with_both} with both a title and a blurb")
    print("\nSamples:")
    for sid, title, blurb in details[:8]:
        print(f"  {sid:>6}  {title}\n          {blurb}")

    if args.report:
        print("\n--report: no writes made")
        return

    written = 0
    for i in range(0, len(details), UPSERT_CHUNK):
        chunk = details[i : i + UPSERT_CHUNK]
        values = ",".join(
            f"({sid},{sql_str(title)},{sql_str(blurb)},now())" for sid, title, blurb in chunk
        )
        run_sql(
            "insert into style_details (ss_style_id, title, blurb, synced_at) "
            f"values {values} "
            "on conflict (ss_style_id) do update set "
            "title=excluded.title, blurb=excluded.blurb, synced_at=excluded.synced_at"
        )
        written += len(chunk)
        print(f"  wrote {written}/{len(details)}", flush=True)

    # Verify from the database, never from what the API returned.
    check = run_sql(
        "select count(*) n, count(title) t, count(blurb) b from style_details"
    )[0]
    print(f"\nVERIFIED in db: {check['n']} rows, {check['t']} titles, {check['b']} blurbs")


if __name__ == "__main__":
    main()
