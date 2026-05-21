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

export function lookupGarment(garmentTypeId, label) {
    const skuId = LABEL_TO_SKU[label];
    if (!skuId) return null;
    const cat = BY_CAT[garmentTypeId];
    if (!cat) return null;
    return cat[skuId] || null;
}

export function getTagline(label) {
    return TAGLINES[label] || '';
}

export { BY_CAT, LABEL_TO_SKU, TAGLINES };
