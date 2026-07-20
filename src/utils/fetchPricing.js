// Local Threads calculator pricing data (static).
// Real Local Threads rates, from Candice's "Updated Pricing Matrix" (xlsx), received 2026-07-16.
// Screen printing, embroidery base, and the flat 40% garment markup are their confirmed numbers.
// OPEN ITEMS (see PR notes): their embroidery model is base (<=5,000 stitches) + a per-stitch
// surcharge, and their sheet lists a $25/color screen fee and a $50 embroidery setup fee. The
// 2-row embroidery engine and per-order setup fees are not yet wired to match.

import tshirts from '../garments/tshirts';
import longsleeves from '../garments/longsleeves';
import hoodies from '../garments/hoodies';
import polos from '../garments/polos';
import hats from '../garments/hats';

// Behind-the-scenes setup fees, from Local Threads' sheet. Folded into per-item price by
// calculateFinalQuote and amortized across the order. Never shown to the customer as a line item.
export const SCREEN_FEE_PER_COLOR = 25;   // one-time screen burn fee, per ink color
export const EMBROIDERY_SETUP_FEE = 50;   // one-time embroidery setup fee, per order

const GARMENT_TIERS = [24, 48, 72, 144, 288, 500];
// Local Threads: flat 40% markup across all tiers (wholesale cost x 1.4). Confirmed by Candice.
const GARMENT_MARKUP_BY_TIER = [1.40, 1.40, 1.40, 1.40, 1.40, 1.40];

function buildGarmentSection(garmentMap) {
    const rows = Object.values(garmentMap).map(g => ({
        label: g.label || g.name || g.id,
        prices: GARMENT_MARKUP_BY_TIER.map(m => parseFloat((g.cost * m).toFixed(2))),
    }));
    return { tiers: GARMENT_TIERS, rows };
}

// Screen printing: rows = color count + underbase, columns = qty tier.
// Local Threads' numbers (their sheet is qty x colors; transposed here to colors x qty).
const SCREEN_PRINTING = {
    tiers: [24, 100, 200, 500, 2000, 4000],
    rows: [
        { label: '1 Color Light Shirt',           prices: [2.40, 2.30, 2.15, 1.85, 1.65, 1.40] },
        { label: '2 Color Light/1 Color Dark',    prices: [2.75, 2.60, 2.30, 1.95, 1.85, 1.50] },
        { label: '3 Color Light/2 Color Dark',    prices: [3.20, 2.85, 2.50, 2.00, 1.75, 1.55] },
        { label: '4 Color Light/3 Color Dark',    prices: [3.65, 3.10, 2.45, 2.10, 2.00, 1.65] },
        { label: '5 Color Light/4 Color Dark',    prices: [4.10, 3.40, 3.00, 2.20, 2.10, 1.75] },
        { label: '6 Color Light/5 Color Dark',    prices: [4.50, 4.00, 3.50, 2.30, 2.15, 1.85] },
        { label: '7 Color Light/6 Color Dark',    prices: [5.00, 4.10, 3.75, 2.40, 2.20, 2.00] },
        { label: '8 Color Light/7 Color Dark',    prices: [6.00, 4.20, 4.00, 2.50, 2.40, 2.05] },
        { label: '9 Color Light/8 Color Dark',    prices: [6.50, 4.60, 4.50, 2.60, 2.50, 2.10] },
        { label: '10 Color Light/9 Color Dark',   prices: [8.00, 5.00, 4.75, 2.75, 2.60, 2.25] },
    ],
};

// Embroidery: rows = stitch count tier, columns = qty tier.
// Row 0 = Local Threads' real base table (up to 5,000 stitches), by quantity.
// Row 1 (higher stitch) is PROVISIONAL: base + ~$8 surcharge, my read of their formula
// "$6 + $1.50 per 5K stitches over 5K." Their sheet only gives the base table, so these
// upper-stitch numbers need Candice's confirmation before we treat them as final.
const EMBROIDERY = {
    tiers: [12, 24, 50, 100, 150, 200],
    rows: [
        { label: '0-10K stitches',  prices: [10.00, 8.00, 7.75, 7.50, 7.00, 6.50] },
        { label: '10-20K stitches', prices: [18.00, 16.00, 15.75, 15.50, 15.00, 14.50] },
    ],
};

// Patches placeholders (disabled in v0.1 until Candice confirms patch program)
const EMPTY_SECTION = { tiers: [], rows: [] };

const STATIC_PRICING = {
    screenPrinting: SCREEN_PRINTING,
    embroidery: EMBROIDERY,
    embroideredPatches: EMPTY_SECTION,
    printedPatches: EMPTY_SECTION,
    leatherPatches: EMPTY_SECTION,
    leatherettePatches: EMPTY_SECTION,
    tshirts: buildGarmentSection(tshirts),
    longsleeves: buildGarmentSection(longsleeves),
    hoodies: buildGarmentSection(hoodies),
    polos: buildGarmentSection(polos),
    hats: buildGarmentSection(hats),
};

let cachedPricing = null;

export async function fetchPricing() {
    if (!cachedPricing) cachedPricing = STATIC_PRICING;
    return cachedPricing;
}

export function lookupPrice(section, rowLabel, quantity) {
    if (!section || !section.tiers || section.tiers.length === 0) return 0;
    const row = section.rows.find(r => r.label === rowLabel);
    if (!row) return 0;
    let tierIndex = 0;
    for (let i = section.tiers.length - 1; i >= 0; i--) {
        if (quantity >= section.tiers[i]) { tierIndex = i; break; }
    }
    return row.prices[tierIndex] || 0;
}

export function getScreenPrintingRow(colorCount, isLight) {
    const effectiveRow = isLight ? colorCount : colorCount + 1;
    return effectiveRow - 1;
}

export function getGarmentModels(pricingData, garmentType) {
    const section = pricingData[garmentType];
    if (!section) return [];
    return section.rows.map(r => ({
        id: r.label.split(' ')[0].replace(/ /g, ''),
        label: r.label,
        rawLabel: r.label,
    }));
}
