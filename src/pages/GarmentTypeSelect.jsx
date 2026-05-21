import React, { useEffect } from 'react';
import NavBtn from '../components/NavBtn';
import tshirtImage from '/assets/tshirtspgarment.png';
import longSleeveImage from '/assets/longsleevespgarment.png';
import hoodieImage from '/assets/hoodiespgarment.png';
import poloImage from '/assets/polospgarment.png';
import hatImage from '/assets/hatembgarment.png';

const spOptions = [
    { id: 'tshirts', name: 'T-Shirt', image: tshirtImage },
    { id: 'longsleeves', name: 'Long Sleeve', image: longSleeveImage },
    { id: 'hoodies', name: 'Hoodie', image: hoodieImage },
    { id: 'polos', name: 'Polo', image: poloImage },
];

const embOptions = [
    { id: 'tshirts', name: 'T-Shirt', image: tshirtImage },
    { id: 'longsleeves', name: 'Long Sleeve', image: longSleeveImage },
    { id: 'hoodies', name: 'Hoodie', image: hoodieImage },
    { id: 'polos', name: 'Polo', image: poloImage },
    { id: 'hats', name: 'Hat', image: hatImage },
];

export default function GarmentTypeSelect({ selectedProject, selectedGarmentType, setSelectedGarmentType, onNext, onPrevious }) {
    const options = selectedProject === 'embroidery' ? embOptions : spOptions;

    useEffect(() => {
        if (!selectedGarmentType) setSelectedGarmentType(options[0]);
    }, []);

    const displayImage = selectedGarmentType ? selectedGarmentType.image : options[0].image;
    const displayAlt = selectedGarmentType ? selectedGarmentType.name : options[0].name;
    const heading = selectedProject === 'embroidery' ? 'What Are We Embroidering?' : 'What Are We Printing On?';

    return (
        <>
            <div className='slide-header'>
                <h1 className='text-3xl font-bold headingColor'>{heading}</h1>
                <p className='mt-1 text-sm bodyColor'>Choose your garment type and we'll show you the options.</p>
            </div>
            <div className='slide-content'>
                <div className='flex items-center gap-6 garment-layout'>
                    <div className='w-1/2 flex items-center justify-center garment-preview'>
                        <img src={displayImage} alt={displayAlt} className='garment-img' />
                    </div>
                    <div className='w-1/2 grid grid-cols-1 gap-3 garment-buttons'>
                        {options.map((garment) => (
                            <button
                                key={garment.id}
                                className={`w-full py-3 px-5 rounded-lg cursor-pointer text-base font-semibold transition duration-300 ${
                                    selectedGarmentType && selectedGarmentType.id === garment.id ? 'btnColor' : 'btnInactive'
                                }`}
                                onClick={() => setSelectedGarmentType(garment)}
                            >
                                {garment.name}
                            </button>
                        ))}
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
