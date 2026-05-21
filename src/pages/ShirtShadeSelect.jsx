import React from 'react';
import NavBtn from '../components/NavBtn';

export default function ShirtShadeSelect({ selectedShade, setSelectedShade, onNext, onPrevious }) {
    return (
        <>
            <div className='slide-header'>
                <h1 className='text-3xl font-bold headingColor'>Light or Dark Garment?</h1>
                <p className='mt-1 text-sm bodyColor'>
                    Dark garments require an extra base layer of ink, which factors into pricing.
                </p>
            </div>
            <div className='slide-content'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-3' style={{ maxWidth: '400px', margin: '0 auto' }}>
                    <button
                        className={`w-full py-4 px-5 rounded-xl cursor-pointer text-base font-semibold transition duration-300 ${
                            selectedShade === 'light' ? 'btnColor' : 'btnInactive'
                        }`}
                        onClick={() => setSelectedShade('light')}
                    >
                        Light
                    </button>
                    <button
                        className={`w-full py-4 px-5 rounded-xl cursor-pointer text-base font-semibold transition duration-300 ${
                            selectedShade === 'dark' ? 'btnColor' : 'btnInactive'
                        }`}
                        onClick={() => setSelectedShade('dark')}
                    >
                        Dark
                    </button>
                </div>
                <p className='text-xs bodyColor text-center mt-4' style={{ opacity: 0.6 }}>
                    Light = white, cream, pastels. Dark = black, navy, charcoal, etc.
                </p>
            </div>
            <div className='slide-nav'>
                <NavBtn onClick={onPrevious} direction='prev'>&larr; Prev</NavBtn>
                <NavBtn onClick={onNext}>Next &rarr;</NavBtn>
            </div>
        </>
    );
}
