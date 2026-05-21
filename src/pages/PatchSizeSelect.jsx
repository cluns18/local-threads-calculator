import React from 'react';
import NavBtn from '../components/NavBtn';

const sizesMap = {
    embroidered: ['1"', '2"', '3"', '4"', '5"'],
    printed: ['1"', '2"', '3"', '4"'],
    leather: ['1"', '2"', '3"', '4"'],
    leatherette: ['1"', '2"', '3"', '4"'],
};

export default function PatchSizeSelect({ selectedPatchType, selectedPatchSize, setSelectedPatchSize, onNext, onPrevious }) {
    const sizes = sizesMap[selectedPatchType] || [];

    return (
        <>
            <div className='slide-header'>
                <h1 className='text-3xl font-bold headingColor'>What Size Patch?</h1>
                <p className='mt-1 text-sm bodyColor'>All patches include sewing.</p>
            </div>
            <div className='slide-content'>
                <div className='grid grid-cols-2 md:grid-cols-3 gap-3' style={{ maxWidth: '400px', margin: '0 auto' }}>
                    {sizes.map((size) => (
                        <button
                            key={size}
                            className={`w-full py-3 px-5 rounded-lg cursor-pointer text-base font-semibold transition duration-300 ${
                                selectedPatchSize === size ? 'btnColor' : 'btnInactive'
                            }`}
                            onClick={() => setSelectedPatchSize(size)}
                        >
                            {size}
                        </button>
                    ))}
                </div>
            </div>
            <div className='slide-nav'>
                <NavBtn onClick={onPrevious} direction='prev'>&larr; Prev</NavBtn>
                <NavBtn onClick={onNext}>Next &rarr;</NavBtn>
            </div>
        </>
    );
}
