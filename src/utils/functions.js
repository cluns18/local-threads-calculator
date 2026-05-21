import { lookupPrice, getScreenPrintingRow } from './fetchPricing';

const calculateFinalQuote = (pricingData, {
    selectedProject,
    selectedGarmentType,
    selectedModel,
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
        // Screen Printing or Embroidery: garment blank + decoration
        const garmentSection = pricingData[selectedGarmentType];
        let garmentCost = 0;
        if (garmentSection && selectedModel) {
            garmentCost = lookupPrice(garmentSection, selectedModel, quantity);
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

        pricePerItem = garmentCost + decorationCost;
    }

    return {
        pricePerItem: parseFloat(pricePerItem.toFixed(2)),
        totalQuote: parseFloat((pricePerItem * quantity).toFixed(2)),
    };
};

export default calculateFinalQuote;
