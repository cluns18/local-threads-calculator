// Why you would pick one blank over another, for Local Threads' OWN pricing sheet.
//
// The garment step used to list every sheet row as a card with a brand, a style
// code and a five-word tagline. Four or five near-identical cards and no basis
// for choosing between them is how a buyer stalls on step three, and Brian's
// read of it was "garment codes being thrown at people".
//
// So: three featured rows per garment type, in budget -> bang-for-buck -> premium
// order, each with a badge, a headline and three reasons taken from the mill's
// own spec sheet (weight, blend, yarn, fit, construction) rather than sales copy.
// Same shape and register as the design studio's src/lib/garment-notes.ts, and
// where the studio already has a note for the same style the text is copied
// verbatim so both paths recommend a blank in the same words.
//
// Keyed by the garment MODULE id (src/garments/<type>/<id>.js), never by the
// sheet label, because the label is what prices the row and must stay untouched.
// The rest of the sheet stays one tap away behind "Show N more from our sheet",
// and a row without a note here falls back to its TAGLINES line.

export const FEATURED = {
    tshirts: ['PC54', 'NL6210', 'CC1717'],
    longsleeves: ['PC54LS', 'NL6211', 'CC6014'],
    hoodies: ['IND4000', 'DT6100', '5161'],
    polos: ['ST640', 'CS420', 'NKDC1963'],
    hats: ['R112', '39-165', '4700'],
};

export const GARMENT_NOTES = {
    // ── T-shirts ──
    PC54: {
        badge: 'Most affordable',
        headline: 'The budget workhorse',
        bullets: [
            '5.4 oz of 100% cotton, the weight most people picture when they say t-shirt',
            'Shoulder-to-shoulder taping and a coverseamed neck, built to be washed a lot',
            'Lowest cost tee on our sheet, so the money goes into the print',
        ],
    },
    NL6210: {
        badge: 'Softest',
        headline: 'The one that feels like retail',
        bullets: [
            '4.3 oz 60/40 combed ring-spun cotton and polyester at 32 singles, the softest hand here',
            'Retail fit with side seams, so it follows the body instead of hanging square',
            'The CVC blend takes a print cleanly and stays soft after washing',
        ],
    },
    CC1717: {
        badge: 'Heaviest',
        headline: 'Heavy, soft, already broken in',
        bullets: [
            '6.1 oz ring-spun cotton, the heaviest tee here and it hangs like it',
            'Garment dyed for a lived-in feel straight out of the bag, with minimal shrinkage',
            'Relaxed fit, the cut people keep wearing after the event is over',
        ],
    },

    // ── Long sleeves ──
    PC54LS: {
        badge: 'Most affordable',
        headline: 'The long sleeve workhorse',
        bullets: [
            '5.4 oz of 100% cotton, the same fabric as the PC54 with sleeves',
            'Rib knit cuffs hold their shape wash after wash',
            'Lowest cost long sleeve on our sheet',
        ],
    },
    NL6211: {
        badge: 'Softest',
        headline: 'Retail feel with sleeves',
        bullets: [
            '4.3 oz 60/40 combed ring-spun cotton and polyester, light and soft',
            'Fitted retail cut with side seams and a tear-away label',
            'Pre-shrunk, so the size someone orders is the size they keep',
        ],
    },
    CC6014: {
        badge: 'Heaviest',
        headline: 'Heavyweight and lived-in',
        bullets: [
            '6.1 oz ring-spun cotton, the heaviest long sleeve on this page',
            'Garment dyed for a worn-in feel from day one, with minimal shrinkage',
            'Relaxed fit that hangs loose through the body and layers well',
        ],
    },

    // ── Hoodies ──
    IND4000: {
        badge: 'Heaviest',
        headline: 'The one people keep',
        bullets: [
            '10 oz 70/30 ring-spun fleece, a full two ounces over a standard pullover',
            '32 singles with a 100% cotton face, so the print sits on smooth ground',
            'Heavy enough to read as retail rather than as a giveaway',
        ],
    },
    DT6100: {
        badge: 'Softest',
        headline: 'Retail feel for less',
        bullets: [
            '70/30 ring-spun combed cotton and polyester fleece, brushed soft inside',
            'Jersey-lined hood and a tailored fit, built the way retail builds them',
            'Lighter and softer than the heavyweights at a lower price',
        ],
    },
    5161: {
        badge: 'Most premium',
        headline: 'The heavyweight that reads as retail',
        bullets: [
            '350 gsm brushed fleece, 80/20 combed cotton and polyester',
            'Regular fit with a double-layer hood and a flat drawcord',
            'The hood people pay retail for, at a bulk price',
        ],
    },

    // ── Polos ──
    ST640: {
        badge: 'Moisture wicking',
        headline: 'The one that stays dry',
        bullets: [
            '3.8 oz 100% polyester mesh that wicks sweat off the skin and dries fast',
            'PosiCharge technology locks in the colour so the logo stays sharp',
            'Lowest cost polo on our sheet, so a whole staff fits the budget',
        ],
    },
    CS420: {
        badge: 'Toughest',
        headline: 'Built for the job site',
        bullets: [
            '100% polyester snag-proof knit that shrugs off tool belts and truck seats',
            'Moisture wicking with a tear-away label, ready for a long shift',
            'Light enough for summer, tough enough for the whole crew',
        ],
    },
    NKDC1963: {
        badge: 'Most premium',
        headline: 'The front-desk polo',
        bullets: [
            '4.4 oz 100% polyester Dri-FIT micro pique that moves sweat away from the skin',
            'Self-fabric collar and a tailored fit that reads as management',
            'The Swoosh on the sleeve, the polo for the people customers meet first',
        ],
    },

    // ── Hats ──
    R112: {
        badge: 'Classic trucker',
        headline: 'The trucker everyone knows',
        bullets: [
            'Structured six-panel mid profile, the shape people already own',
            '60/40 cotton-poly front with a polyester mesh back that breathes',
            'Snapback closure and a pre-curved bill, one size fits most',
        ],
    },
    '39-165': {
        badge: 'Most affordable',
        headline: 'The budget trucker',
        bullets: [
            'Five-panel high crown with a polyester mesh back',
            'Adjustable snapback, one size fits most',
            'Lowest cost cap on our sheet, so the money goes into the stitch',
        ],
    },
    4700: {
        badge: 'Dad cap',
        headline: 'The relaxed everyday cap',
        bullets: [
            'Unstructured six-panel crown in garment-washed 100% cotton twill',
            'Relaxed low profile with a pre-curved bill, the cap people wear off the clock',
            'Self-fabric strap with a metal buckle, adjustable to any head',
        ],
    },
};
