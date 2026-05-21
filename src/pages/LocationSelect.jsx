import React, { useState, useEffect } from 'react';
import NavBtn from '../components/NavBtn';

export default function LocationSelect({ onNext, onPrevious, selectedGarmentType, selectedProject, setSelectedLocation }) {
    const [selectedLocations, setSelectedLocations] = useState([]);

    const locationOptions = {
        tshirts: ['Front & Center', 'Left Chest', 'Right Chest', 'Pocket', 'Full Back'],
        longsleeves: ['Front & Center', 'Left Chest', 'Right Chest', 'Pocket', 'Full Back', 'One Sleeve', 'Both Sleeves'],
        hoodies: ['Front & Center', 'Left Chest', 'Right Chest', 'Full Back', 'One Sleeve', 'Both Sleeves'],
        polos: ['Front & Center', 'Left Chest', 'Right Chest', 'Full Back'],
        hats: ['Front & Center', 'Back', 'Over Left Ear', 'Over Right Ear'],
    };

    const availableLocations = locationOptions[selectedGarmentType?.id] || [];

    const toggleLocation = (location) => {
        setSelectedLocations((prev) =>
            prev.includes(location) ? prev.filter((loc) => loc !== location) : [...prev, location]
        );
    };

    useEffect(() => { setSelectedLocation(selectedLocations); }, [selectedLocations, setSelectedLocation]);

    return (
        <>
            <div className='slide-header'>
                <h1 className='text-3xl font-bold headingColor'>Where Should Your Design Go?</h1>
                <p className='mt-1 text-sm bodyColor'>Select each placement for your design.</p>
            </div>
            <div className='slide-content'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                    {availableLocations.map((location) => (
                        <button
                            key={location}
                            className={`w-full py-3 px-5 rounded-lg cursor-pointer text-base font-semibold transition duration-300 ${
                                selectedLocations.includes(location) ? 'btnColor' : 'btnInactive'
                            }`}
                            onClick={() => toggleLocation(location)}
                        >
                            {location}
                        </button>
                    ))}
                </div>
            </div>
            <div className='slide-nav'>
                <NavBtn onClick={onPrevious} direction='prev'>&larr; Prev</NavBtn>
                <NavBtn onClick={() => { if (selectedLocations.length > 0) onNext(); }}>Next &rarr;</NavBtn>
            </div>
        </>
    );
}
