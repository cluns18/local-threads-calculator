import { lookupPrice, garmentRetail, getScreenPrintingRow, SCREEN_FEE_PER_COLOR, EMBROIDERY_SETUP_FEE } from './fetchPricing';

// Per-item price is always shown as a whole dollar. Cents of .45 or less round down,
// anything above rounds up, so $12.45 lands on $12 and $12.46 lands on $13.
const roundPerItem = (value) => {
    const cents = Math.round(value * 100);
    const dollars = Math.floor(cents / 100);
    return cents % 100 <= 45 ? dollars : dollars + 1;
};

const calculateFinalQuote = (pricingData, {
    selectedProject,
    selectedGarmentType,
    selectedModel,
    selectedGarment,
    selectedColor,
    locationColorCounts,
    locationThreadCounts,
    selectedPatchType,
    selectedPatchSize,
    quantity,
}) => {
    if (!pricingData || !quantity || quantity <= 0) return { totalQuote: 0, pricePerItem: 0 };

    let pricePerItem = 0;

    if (selectedProject === 'patches') {
        const sectionMap = {
            embroidered: 'embroideredPatches',
            printed: 'printedPatches',
            leather: 'leatherPatches',
            leatherette: 'leatherettePatches',
        };
        const section = pricingData[sectionMap[selectedPatchType]];
        if (section && selectedPatchSize) {
            const row = section.rows.find(r => r.label.startsWith(selectedPatchSize));
            if (row) {
                let tierIndex = 0;
                for (let i = section.tiers.length - 1; i >= 0; i--) {
                    if (quantity >= section.tiers[i]) { tierIndex = i; break; }
                }
                pricePerItem = row.prices[tierIndex] || 0;
            }
        }
    } else {
        // Screen Printing or Embroidery: garment blank + decoration.
        // Styles picked out of the live S&S catalog carry their own wholesale
        // cost and have no row in the pricing sheet, so price them from the cost
        // directly. Everything else falls back to the curated pricing rows.
        let garmentCost = 0;
        if (selectedGarment?.fromCatalog && selectedGarment.cost) {
            garmentCost = garmentRetail(selectedGarment.cost, quantity);
        } else {
            const garmentSection = pricingData[selectedGarmentType];
            if (garmentSection && selectedModel) {
                garmentCost = lookupPrice(garmentSection, selectedModel, quantity);
            }
        }

        let decorationCost = 0;

        if (selectedProject === 'screenPrinting') {
            const spSection = pricingData.screenPrinting;
            if (spSection) {
                const numColorsPerLocation = Object.values(locationColorCounts || {});
                // Derived from the selected color's underbase flag (0 = light garment, no underbase)
                const isLight = selectedColor?.underbase === 0;
                numColorsPerLocation.forEach(colorCount => {
                    const rowIndex = getScreenPrintingRow(colorCount, isLight);
                    const row = spSection.rows[rowIndex];
                    if (row) {
                        let tierIndex = 0;
                        for (let i = spSection.tiers.length - 1; i >= 0; i--) {
                            if (quantity >= spSection.tiers[i]) { tierIndex = i; break; }
                        }
                        decorationCost += row.prices[tierIndex] || 0;
                    }
                });
            }
        }

        if (selectedProject === 'embroidery') {
            const embSection = pricingData.embroidery;
            if (embSection) {
                const totalThreadCount = Object.values(locationThreadCounts || {}).reduce((sum, c) => sum + c, 0);
                // 0-10K = row 0, 10-20K = row 1
                const rowIndex = totalThreadCount > 10000 ? 1 : 0;
                const row = embSection.rows[rowIndex];
                if (row) {
                    let tierIndex = 0;
                    for (let i = embSection.tiers.length - 1; i >= 0; i--) {
                        if (quantity >= embSection.tiers[i]) { tierIndex = i; break; }
                    }
                    decorationCost = row.prices[tierIndex] || 0;
                }
            }
        }

        // Setup fees (screen burn / embroidery setup) are folded into the per-item price and
        // amortized across the run. They are NEVER surfaced to the customer as a separate line,
        // in the calculator or the design lab. The customer only ever sees per-item and total.
        let setupFees = 0;
        if (selectedProject === 'screenPrinting') {
            // One screen per ink color, per print location. Dark garments add an underbase screen.
            const isLight = selectedColor?.underbase === 0;
            const totalScreens = Object.values(locationColorCounts || {})
                .reduce((sum, c) => sum + (isLight ? c : c + 1), 0);
            setupFees = totalScreens * SCREEN_FEE_PER_COLOR;
        } else if (selectedProject === 'embroidery') {
            setupFees = EMBROIDERY_SETUP_FEE;
        }
        const feePerItem = quantity > 0 ? setupFees / quantity : 0;

        pricePerItem = garmentCost + decorationCost + feePerItem;
    }

    // Round the per-item price first, then derive the total from it, so the total always
    // equals what the customer sees x quantity.
    const roundedPerItem = roundPerItem(pricePerItem);

    return {
        pricePerItem: roundedPerItem,
        totalQuote: parseFloat((roundedPerItem * quantity).toFixed(2)),
    };
};

export default calculateFinalQuote;
