import React, { useEffect } from 'react';
import NavBtn from '../components/NavBtn';
import { lookupGarment, getTagline } from '../garments/skuByLabel';

export default function GarmentModelSelect({ pricingData, selectedGarmentType, selectedModel, setSelectedModel, selectedGarment, setSelectedGarment, onNext, onPrevious }) {
    const section = pricingData?.[selectedGarmentType?.id];
    const models = section?.rows || [];

    useEffect(() => {
        if (!selectedModel && models.length > 0) {
            const first = models[0];
            setSelectedModel(first.label);
            const g = lookupGarment(selectedGarmentType?.id, first.label);
            setSelectedGarment(g);
        }
    }, [models]);

    const handleSelect = (label) => {
        setSelectedModel(label);
        const g = lookupGarment(selectedGarmentType?.id, label);
        setSelectedGarment(g);
    };

    const garmentTypeName = selectedGarmentType?.name || 'Garment';
    const displayImage = selectedGarment?.stockImage;
    const displayAlt = selectedGarment?.label || selectedGarment?.name || selectedModel;

    return (
        <>
            <div className='slide-header'>
                <h1 className='text-3xl font-bold headingColor'>Pick Your {garmentTypeName}</h1>
                <p className='mt-1 text-sm bodyColor'>Different weights, fits, and price points. Choose the one that works best.</p>
            </div>
            <div className='slide-content'>
                <div className='flex items-center gap-6 garment-layout'>
                    <div className='w-1/2 flex items-center justify-center garment-preview'>
                        {displayImage ? (
                            <img src={displayImage} alt={displayAlt} className='garment-img' style={{ maxHeight: '240px', width: 'auto', objectFit: 'contain' }} />
                        ) : (
                            <div className='bodyColor' style={{ opacity: 0.5, fontSize: '0.8rem', textAlign: 'center', padding: '20px' }}>
                                Image coming soon
                            </div>
                        )}
                    </div>
                    <div className='w-1/2 grid grid-cols-1 gap-2 garment-buttons'>
                        {models.map((m) => {
                            const tagline = getTagline(m.label);
                            const active = selectedModel === m.label;
                            return (
                                <button
                                    key={m.label}
                                    className={`w-full rounded-lg cursor-pointer transition duration-300 garment-btn ${active ? 'btnColor' : 'btnInactive'}`}
                                    style={{ padding: '8px 12px', textAlign: 'left', lineHeight: 1.25 }}
                                    onClick={() => handleSelect(m.label)}
                                >
                                    <div style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.01em' }}>{m.label}</div>
                                    {tagline && (
                                        <div style={{ fontSize: '0.66rem', fontWeight: 500, opacity: active ? 0.92 : 0.65, marginTop: '1px' }}>
                                            {tagline}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
            <div className='slide-nav'>
                <NavBtn onClick={onPrevious} direction='prev'>&larr; Prev</NavBtn>
                <NavBtn onClick={() => onNext()}>Next &rarr;</NavBtn>
            </div>
        </>
    );
}
