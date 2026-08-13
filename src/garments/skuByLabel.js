import tshirts from './tshirts';
import longsleeves from './longsleeves';
import hoodies from './hoodies';
import polos from './polos';
import hats from './hats';

const BY_CAT = {
    tshirts,
    longsleeves,
    hoodies,
    polos,
    hats,
};

const LABEL_TO_SKU = {
    'PC54': 'PC54',
    'NL6210 - 60/40': 'NL6210',
    '1717 Comfort Colors Cotton': 'CC1717',
    '5080 Heavyweight As Colour': '5080',
    'PC54LS': 'PC54LS',
    'NL6211': 'NL6211',
    '6014 Comfort Colors': 'CC6014',
    '5081 As Colour': '5081',
    'DT6100': 'DT6100',
    'IND4000': 'IND4000',
    '5161 AS Colour': '5161',
    'HF09GD LA Apparel': 'HF09GD',
    'IND4000Z': 'IND4000Z',
    'DT6102': 'DT6102',
    'ST640': 'ST640',
    'NKDC1963': 'NKDC1963',
    'OG101': 'OG101',
    'LOG101': 'LOG101',
    'CS420': 'CS420',
    'Richardson 112': 'R112',
    'Otto 39-165': '39-165',
    'Cleanup Cap 4700': '4700',
    'YP Classic 6006': 'YP6006',
    'CP90': 'CP90',
};

// Short tagline per sheet label — 3-5 words describing why someone picks it.
// Pattern mirrors OBG calc labels (e.g., "Next Level 3600 - Most Popular").
const TAGLINES = {
    // T-shirts
    'PC54': 'Best bang for the buck',
    'NL6210 - 60/40': 'Soft retail fit',
    '1717 Comfort Colors Cotton': 'Vintage garment-dyed feel',
    '5080 Heavyweight As Colour': 'Heavyweight streetwear tee',
    // Longsleeves
    'PC54LS': 'Reliable everyday long sleeve',
    'NL6211': 'Soft, slim fit',
    '6014 Comfort Colors': 'Pigment-dyed, lived-in look',
    '5081 As Colour': 'Heavyweight, boxy streetwear',
    // Hoodies
    'DT6100': 'Premium tri-blend soft hand',
    'IND4000': 'Popular midweight fleece',
    '5161 AS Colour': 'Premium heavyweight pullover',
    'HF09GD LA Apparel': '14 oz. garment-dyed premium',
    'IND4000Z': 'Full-zip midweight fleece',
    'DT6102': 'Premium tri-blend full-zip',
    // Polos
    'ST640': 'Moisture-wicking athletic polo',
    'NKDC1963': 'Nike Dri-FIT premium brand',
    'OG101': 'OGIO Caliber crisp performance',
    'LOG101': "Women's OGIO Jewel polo",
    'CS420': 'Durable workwear polo',
    // Hats
    'Richardson 112': 'Classic foam trucker snapback',
    'Otto 39-165': 'Budget-friendly mesh trucker',
    'Cleanup Cap 4700': 'Relaxed unstructured dad cap',
    'YP Classic 6006': 'Yupoong retro trucker',
    'CP90': 'Classic knit winter beanie',
};

/**
 * Everything the shortlist card prints, keyed by garment id.
 *
 * It lives here rather than on the garment modules because those were written
 * for the colour picker and are uneven about display data. Ten of them carry no
 * `brand` at all, and their `name` sometimes leads with the brand ("Comfort
 * Colors 1717") and sometimes does not ("Heavy Cotton Tee"), so a card built
 * straight off the module either loses the brand line or prints it twice.
 *
 * - `style` is the brand's own code. Several module ids carry a prefix we added
 *   to keep filenames unique, so CC1717 shows as Comfort Colors' 1717.
 * - `title` is the product name with the brand removed, and is deliberately null
 *   where the source data has no name beyond brand plus code. The card drops the
 *   line rather than us inventing a product name for it.
 * - `tier` is where the blank sits on price against every other style of the
 *   same garment type, on the same 1-4 quartile scale the full catalog uses.
 *   Read out of the `calculator_catalog` view on 2026-08-13 by style code so the
 *   shortlist and the browse-all grid rank a blank identically. PC54LS, OG101,
 *   LOG101 and CS420 are SanMar styles the view does not carry; those four are
 *   placed by their own wholesale cost against the same view's quartile
 *   boundaries (longsleeve t1 ends $7.35, polo t2 spans $10.20-$16.87).
 * - `tagline` is the 3-5 word reason to pick this blank.
 */
const CARD_META = {
    // T-shirts
    PC54: { brand: 'Port & Company', style: 'PC54', title: 'Core Cotton Tee', tier: 2, tagline: 'Best bang for the buck' },
    NL6210: { brand: 'Next Level', style: '6210', title: null, tier: 2, tagline: 'Soft retail fit' },
    CC1717: { brand: 'Comfort Colors', style: '1717', title: null, tier: 3, tagline: 'Vintage garment-dyed feel' },
    5080: { brand: 'AS Colour', style: '5080', title: 'Heavy Cotton Tee', tier: 4, tagline: 'Heavyweight streetwear tee' },

    // Long sleeves
    PC54LS: { brand: 'Port & Company', style: 'PC54LS', title: null, tier: 1, tagline: 'Reliable everyday long sleeve' },
    NL6211: { brand: 'Next Level', style: '6211', title: null, tier: 1, tagline: 'Soft, slim fit' },
    CC6014: { brand: 'Comfort Colors', style: '6014', title: null, tier: 2, tagline: 'Pigment-dyed, lived-in look' },
    5081: { brand: 'AS Colour', style: '5081', title: 'Heavy Cotton Long Sleeve Tee', tier: 3, tagline: 'Heavyweight, boxy streetwear' },

    // Hoodies
    DT6100: { brand: 'District', style: 'DT6100', title: 'V.I.T. Fleece Hoodie', tier: 2, tagline: 'Premium tri-blend soft hand' },
    IND4000: { brand: 'Independent Trading Co.', style: 'IND4000', title: null, tier: 2, tagline: 'Popular midweight fleece' },
    5161: { brand: 'AS Colour', style: '5161', title: 'Premium Hood', tier: 3, tagline: 'Premium heavyweight pullover' },
    HF09GD: { brand: 'LA Apparel', style: 'HF09GD', title: '14 oz. Heavy Fleece Pullover Hoodie', tier: 4, tagline: '14 oz. garment-dyed premium' },
    IND4000Z: { brand: 'Independent Trading Co.', style: 'IND4000Z', title: null, tier: 3, tagline: 'Full-zip midweight fleece' },
    DT6102: { brand: 'District', style: 'DT6102', title: 'V.I.T. Fleece Full-Zip Hoodie', tier: 2, tagline: 'Premium tri-blend full-zip' },

    // Polos
    ST640: { brand: 'Sport-Tek', style: 'ST640', title: 'PosiCharge RacerMesh Polo', tier: 2, tagline: 'Moisture-wicking athletic polo' },
    NKDC1963: { brand: 'Nike', style: 'NKDC1963', title: 'Dri-FIT Micro Pique 2.0 Polo', tier: 4, tagline: 'Nike Dri-FIT premium brand' },
    OG101: { brand: 'OGIO', style: 'OG101', title: null, tier: 2, tagline: 'OGIO Caliber crisp performance' },
    LOG101: { brand: 'OGIO', style: 'LOG101', title: null, tier: 2, tagline: "Women's OGIO Jewel polo" },
    CS420: { brand: 'CornerStone', style: 'CS420', title: null, tier: 2, tagline: 'Durable workwear polo' },

    // Hats
    R112: { brand: 'Richardson', style: '112', title: null, tier: 3, tagline: 'Classic foam trucker snapback' },
    '39-165': { brand: 'Otto Cap', style: '39-165', title: '5 Panel High Crown Mesh Back Trucker', tier: 1, tagline: 'Budget-friendly mesh trucker' },
    4700: { brand: "'47 Brand", style: '4700', title: 'Clean Up Cap', tier: 3, tagline: 'Relaxed unstructured dad cap' },
    YP6006: { brand: 'YP Classics', style: '6006', title: null, tier: 2, tagline: 'Yupoong retro trucker' },
    CP90: { brand: 'Port & Company', style: 'CP90', title: 'Knit Cap', tier: 1, tagline: 'Classic knit winter beanie' },
};

/**
 * Card fields for a shortlist garment, shaped like the catalog rows in
 * utils/catalog.js so GarmentModelSelect can render both through one card.
 */
export function getCardFields(garmentTypeId, label) {
    const g = lookupGarment(garmentTypeId, label);
    if (!g) return null;
    const meta = CARD_META[g.id] || {};
    return {
        brand: meta.brand || g.brand || null,
        styleName: meta.style || g.id,
        title: meta.title || null,
        blurb: meta.tagline || getTagline(garmentTypeId, label),
        priceTier: meta.tier || null,
        stockImage: g.stockImage || null,
    };
}

export function lookupGarment(garmentTypeId, label) {
    const cat = BY_CAT[garmentTypeId];
    if (!cat) return null;
    // 1) Direct map from a sheet/SKU-style label (e.g. "CS420", "NL6210 - 60/40").
    const skuId = LABEL_TO_SKU[label];
    if (skuId && cat[skuId]) return cat[skuId];
    // 2) Fallback: the pricing rows use each garment's full retail name
    //    (e.g. "CornerStone 420 Polo"), so match on the garment's own fields.
    const match = Object.values(cat).find(
        (g) => g.label === label || g.name === label || g.id === label
    );
    return match || null;
}

export function getTagline(garmentTypeId, label) {
    // Resolve the garment first so taglines work whether the label is a
    // SKU code or the full retail name fed in by the pricing sheet.
    const g = lookupGarment(garmentTypeId, label);
    if (g && TAGLINES[g.id]) return TAGLINES[g.id];
    return TAGLINES[label] || '';
}

export { BY_CAT, LABEL_TO_SKU, TAGLINES };
