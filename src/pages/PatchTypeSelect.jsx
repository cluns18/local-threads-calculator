import React from 'react';
import NavBtn from '../components/NavBtn';

const patchOptions = [
    { id: 'embroidered', name: 'Embroidered Patches' },
    { id: 'printed', name: 'Printed Patches' },
    { id: 'leather', name: 'Leather Patches' },
    { id: 'leatherette', name: 'Leatherette Patches (Faux Leather)' },
];

export default function PatchTypeSelect({ selectedPatchType, setSelectedPatchType, onNext, onPrevious }) {
    return (
        <>
            <div className='slide-header'>
                <h1 className='text-3xl font-bold headingColor'>What Type of Patch?</h1>
                <p className='mt-1 text-sm bodyColor'>Each type has a different look, feel, and price point.</p>
            </div>
            <div className='slide-content'>
                <div className='grid grid-cols-1 gap-3' style={{ maxWidth: '420px', margin: '0 auto' }}>
                    {patchOptions.map((patch) => (
                        <button
                            key={patch.id}
                            className={`w-full py-3 px-5 rounded-lg cursor-pointer text-base font-semibold transition duration-300 ${
                                selectedPatchType === patch.id ? 'btnColor' : 'btnInactive'
                            }`}
                            onClick={() => setSelectedPatchType(patch.id)}
                        >
                            {patch.name}
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
