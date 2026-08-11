import React, { useEffect } from 'react';
import NavBtn from '../components/NavBtn';

const TIERS = [
    {
        id: 'simple',
        label: 'Simple',
        description: 'Left-chest logos, hats, and simple names.',
        range: '1k – 10K stitches',
        threadCount: 6000,
    },
    {
        id: 'detailed',
        label: 'Detailed',
        description: 'Large jacket patches, solid-fill circles/shields, and highly detailed artwork.',
        range: '10k – 25K stitches',
        threadCount: 18000,
    },
];

export default function ThreadCount({ onNext, onPrevious, selectedLocations, locationThreadCounts, setLocationThreadCounts }) {
    // Default each location to "Simple" (6000 stitches) on mount
    useEffect(() => {
        const defaults = {};
        selectedLocations.forEach((loc) => {
            if (!locationThreadCounts[loc]) defaults[loc] = TIERS[0].threadCount;
        });
        if (Object.keys(defaults).length > 0) {
            setLocationThreadCounts((prev) => ({ ...prev, ...defaults }));
        }
    }, [selectedLocations, setLocationThreadCounts, locationThreadCounts]);

    const handleSelect = (location, threadCount) => {
        setLocationThreadCounts((prev) => ({ ...prev, [location]: threadCount }));
    };

    return (
        <>
            <div className='slide-header'>
                <h1 className='text-3xl font-bold headingColor'>How Detailed Is Your Design?</h1>
                <p className='mt-1 text-sm bodyColor'>
                    Pick the option that best matches your artwork. We'll match the right stitch count.
                </p>
            </div>
            <div className='slide-content'>
                <div className='flex flex-col gap-4 w-full'>
                    {selectedLocations.map((location) => {
                        const current = locationThreadCounts[location] || TIERS[0].threadCount;
                        return (
                            <div key={location} className='text-left'>
                                <label className='text-base font-semibold headingColor block mb-2'>{location}</label>
                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                                    {TIERS.map((tier) => {
                                        const active = current === tier.threadCount;
                                        return (
                                            <button
                                                key={tier.id}
                                                onClick={() => handleSelect(location, tier.threadCount)}
                                                className={`text-left p-3 rounded-lg border-2 transition duration-200 ${active ? 'btnColor' : 'btnInactive'}`}
                                                style={{
                                                    borderColor: active ? 'var(--lt-rust)' : 'rgba(255,255,255,0.12)',
                                                    background: active ? 'rgba(37,115,241,0.18)' : 'rgba(255,255,255,0.04)',
                                                }}
                                            >
                                                <div style={{ fontFamily: 'var(--lt-font-body)', fontWeight: 700, fontSize: '0.95rem', color: '#F5F0E8', marginBottom: '4px' }}>
                                                    {tier.label}
                                                </div>
                                                <div style={{ fontFamily: 'var(--lt-font-body)', fontSize: '0.78rem', color: 'rgba(245,240,232,0.75)', lineHeight: 1.45, marginBottom: '6px' }}>
                                                    {tier.description}
                                                </div>
                                                <div style={{ fontFamily: 'var(--lt-font-body)', fontSize: '0.7rem', color: 'var(--lt-rust-light)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                                    {tier.range}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
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
