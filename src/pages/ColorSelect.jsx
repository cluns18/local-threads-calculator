import React, { useState, useEffect } from 'react';
import NavBtn from '../components/NavBtn';

export default function ColorSelect({ onNext, onPrevious, selectedGarment, selectedColor, setSelectedColor }) {
    if (!selectedGarment || !selectedGarment.colors || selectedGarment.colors.length === 0) {
        return <div className='headingColor text-center p-6'>No garment selected.</div>;
    }

    const heroSrc = (c) => c?.previewImage || c?.image;
    const [selectedImage, setSelectedImage] = useState(heroSrc(selectedColor) || heroSrc(selectedGarment.colors[0]));

    // Fall back to the first swatch whenever the held color does not belong to this
    // garment. Going back and picking a different style used to keep the old color,
    // which showed the wrong photo and, worse, priced off the old light/dark flag.
    const colorBelongs = selectedColor
        && selectedGarment.colors.some((c) => c.name === selectedColor.name);

    useEffect(() => {
        if (!colorBelongs && selectedGarment.colors.length > 0) {
            setSelectedColor(selectedGarment.colors[0]);
            setSelectedImage(heroSrc(selectedGarment.colors[0]));
        }
    }, [selectedGarment, colorBelongs]);

    const handleColorSelect = (color) => {
        setSelectedColor(color);
        setSelectedImage(heroSrc(color));
    };

    return (
        <>
            <div className='slide-header' style={{ padding: '16px 24px 4px' }}>
                <h1 className='text-2xl font-bold headingColor'>Pick Your Color</h1>
                <p className='bodyColor' style={{ fontSize: '0.8rem', marginTop: '2px' }}>
                    {selectedColor ? selectedColor.name : 'Tap a swatch to preview.'}
                </p>
            </div>
            <div className='slide-content' style={{ justifyContent: 'flex-start', gap: '8px', padding: '0 20px' }}>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <img
                        src={selectedImage}
                        alt={selectedColor?.name || 'Selected Color'}
                        className='color-img'
                        style={{ maxHeight: '200px', margin: '0 auto' }}
                    />
                </div>

                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    alignContent: 'flex-start',
                    gap: '5px',
                    padding: '4px 0',
                    overflowY: 'auto',
                    flex: '1 1 auto',
                    minHeight: 0,
                }}>
                    {selectedGarment.colors.map((color) => {
                        const isSelected = selectedColor?.name === color.name;
                        return (
                            <button
                                key={color.name}
                                onClick={() => handleColorSelect(color)}
                                title={color.name}
                                style={{
                                    width: '34px',
                                    height: '34px',
                                    borderRadius: '50%',
                                    border: isSelected ? '3px solid #B85A36' : '2px solid rgba(255,255,255,0.15)',
                                    padding: '2px',
                                    cursor: 'pointer',
                                    background: 'transparent',
                                    transition: 'all 0.15s ease',
                                    outline: isSelected ? '2px solid rgba(37,115,241,0.4)' : 'none',
                                    outlineOffset: '2px',
                                    flexShrink: 0,
                                }}
                            >
                                <img
                                    src={color.image}
                                    alt={color.name}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                    }}
                                />
                            </button>
                        );
                    })}
                </div>
            </div>
            <div className='slide-nav'>
                <NavBtn onClick={onPrevious} direction='prev'>&larr; Prev</NavBtn>
                <NavBtn onClick={onNext}>Next &rarr;</NavBtn>
            </div>
        </>
    );
}
