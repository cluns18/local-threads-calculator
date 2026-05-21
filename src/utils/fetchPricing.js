// Local Threads calculator pricing data (static).
// Decoration values seeded from 456 Print Co's matrix.
// Garment blank rows generated from per-garment modules with a 1.4x markup.
// Replace these values with Local Threads' actual rates once Candice sends the matrix.

import tshirts from '../garments/tshirts';
import longsleeves from '../garments/longsleeves';
import hoodies from '../garments/hoodies';
import polos from '../garments/polos';
import hats from '../garments/hats';

const GARMENT_TIERS = [24, 48, 72, 144, 288, 500];
const GARMENT_MARKUP_BY_TIER = [1.50, 1.45, 1.40, 1.35, 1.30, 1.25];

function buildGarmentSection(garmentMap) {
    const rows = Object.values(garmentMap).map(g => ({
        label: g.label || g.name || g.id,
        prices: GARMENT_MARKUP_BY_TIER.map(m => parseFloat((g.cost * m).toFixed(2))),
    }));
    return { tiers: GARMENT_TIERS, rows };
}

// Screen printing: rows = color count + underbase, columns = qty tier.
// Sourced from 456's screenPrintingMatrix (transposed).
const SCREEN_PRINTING = {
    tiers: [50, 100, 200, 500, 2000, 4000],
    rows: [
        { label: '1 Color Light Shirt',           prices: [1.89, 1.80, 1.62, 1.35, 1.17, 0.90] },
        { label: '2 Color Light/1 Color Dark',    prices: [2.25, 2.07, 1.80, 1.44, 1.35, 0.99] },
        { label: '3 Color Light/2 Color Dark',    prices: [2.70, 2.34, 1.98, 1.53, 1.44, 1.08] },
        { label: '4 Color Light/3 Color Dark',    prices: [3.15, 2.61, 2.16, 1.62, 1.53, 1.17] },
        { label: '5 Color Light/4 Color Dark',    prices: [3.60, 2.88, 2.52, 1.71, 1.62, 1.26] },
        { label: '6 Color Light/5 Color Dark',    prices: [4.05, 3.15, 2.97, 1.80, 1.71, 1.35] },
        { label: '7 Color Light/6 Color Dark',    prices: [4.50, 3.42, 3.24, 1.89, 1.80, 1.44] },
        { label: '8 Color Light/7 Color Dark',    prices: [5.40, 3.69, 3.60, 1.98, 1.89, 1.53] },
        { label: '9 Color Light/8 Color Dark',    prices: [6.30, 4.14, 3.96, 2.07, 1.98, 1.62] },
        { label: '10 Color Light/9 Color Dark',   prices: [7.20, 4.50, 4.32, 2.16, 2.07, 1.71] },
    ],
};

// Embroidery: rows = stitch count tier, columns = qty tier.
// 0-10K base from 456's embroideryMatrix. 10K+ adds ~$1.50/piece per 456's stitchPrice formula.
const EMBROIDERY = {
    tiers: [12, 18, 24, 36, 50, 72],
    rows: [
        { label: '0-10K stitches',  prices: [10.00, 9.50, 8.00, 7.70, 7.40, 7.00] },
        { label: '10-20K stitches', prices: [11.50, 11.00, 9.50, 9.20, 8.90, 8.50] },
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
