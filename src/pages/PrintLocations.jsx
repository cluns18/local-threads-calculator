import React, { useEffect, useState } from 'react';
import NavBtn from '../components/NavBtn';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebaseConfig';

// One tab per print location, and each location carries its own artwork and its
// own ink colours (or stitch level), because that is how the job prices.
//
// Ryan, 2026-10-09: "A customer recently mentioned that there isn't an option to
// get pricing for both the front and back of a product on our site. I checked,
// and they are correct. Is it possible to add front and back tabs so customers
// can upload artwork and enter the number of colors per location". The price
// engine already summed every location, but the flow took ONE artwork file, then
// showed the placements as a list that read as pick-one, then asked colours on a
// third slide. Front and back now sit side by side from the first moment.

// The names are what the quote emails print and what the price is keyed on.
export const PLACEMENTS = {
    tshirts: ['Front & Center', 'Left Chest', 'Right Chest', 'Pocket', 'Full Back'],
    longsleeves: ['Front & Center', 'Left Chest', 'Right Chest', 'Pocket', 'Full Back', 'One Sleeve', 'Both Sleeves'],
    hoodies: ['Front & Center', 'Left Chest', 'Right Chest', 'Full Back', 'One Sleeve', 'Both Sleeves'],
    polos: ['Front & Center', 'Left Chest', 'Right Chest', 'Full Back'],
    hats: ['Front & Center', 'Back', 'Over Left Ear', 'Over Right Ear'],
};

const BACK_NAMES = ['Full Back', 'Back'];
const TAB_LABELS = { 'Front & Center': 'Front', 'Full Back': 'Back' };
const tabLabel = (name) => TAB_LABELS[name] || name;

export const STITCH_TIERS = [
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

const MAX_COLORS = 6;

let nextId = 1;
export const newLocation = (name) => ({
    id: nextId++,
    name,
    artwork: null,          // Firebase URL, or `pending:<file>` while or after a failed upload
    fileName: null,
    status: 'idle',         // 'idle' | 'uploading' | 'success' | 'error'
    description: '',
    colors: 1,
    threads: STITCH_TIERS[0].threadCount,
});

export const hasArtwork = (loc) => Boolean(loc.artwork || loc.description.trim());

export default function PrintLocations({ onNext, onPrevious, selectedGarmentType, selectedProject, printLocations, setPrintLocations }) {
    const placements = PLACEMENTS[selectedGarmentType?.id] || [];
    const isEmbroidery = selectedProject === 'embroidery';
    const [activeId, setActiveId] = useState(printLocations[0]?.id ?? null);
    const [showHint, setShowHint] = useState(false);

    // Start with the front. Also start over if the garment changed underneath a
    // placement the new garment does not have (a sleeve on a tee).
    useEffect(() => {
        if (placements.length === 0) return;
        const stale = printLocations.length === 0 || printLocations.some((l) => !placements.includes(l.name));
        if (stale) {
            const first = newLocation(placements[0]);
            setPrintLocations([first]);
            setActiveId(first.id);
        } else if (!printLocations.some((l) => l.id === activeId)) {
            setActiveId(printLocations[0].id);
        }
    }, [placements, printLocations, activeId, setPrintLocations]);

    const active = printLocations.find((l) => l.id === activeId) || printLocations[0];
    const used = printLocations.map((l) => l.name);
    const unused = placements.filter((p) => !used.includes(p));
    const backName = unused.find((p) => BACK_NAMES.includes(p));
    const otherUnused = unused.filter((p) => p !== backName);

    const update = (id, patch) =>
        setPrintLocations((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

    const add = (name) => {
        const loc = newLocation(name);
        setPrintLocations((prev) => [...prev, loc]);
        setActiveId(loc.id);
        setShowHint(false);
    };

    const remove = (id) => {
        const rest = printLocations.filter((l) => l.id !== id);
        setPrintLocations(rest);
        setActiveId(rest[0]?.id ?? null);
    };

    const handleFile = async (id, file) => {
        if (!file) return;
        update(id, { fileName: file.name, status: 'uploading', artwork: `pending:${file.name}` });
        setShowHint(false);

        // Unique key so two customers uploading e.g. "logo.png" never overwrite
        // each other, which would send the shop the wrong artwork.
        //
        // Must stay FLAT under uploads/. The bucket's rules are
        // `match /uploads/{fileName}`, a single path segment, so a nested key
        // falls through to the catch-all deny and 403s.
        const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, '_');
        const storageRef = ref(storage, `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`);
        try {
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            update(id, { artwork: downloadURL, status: 'success' });
        } catch (error) {
            // Leave the `pending:` marker so the shop's quote email still flags
            // the incomplete upload, and tell the customer plainly so the art
            // is never silently lost.
            console.error('Error uploading file:', error);
            update(id, { status: 'error' });
        }
    };

    const uploading = printLocations.some((l) => l.status === 'uploading');

    const handleNext = () => {
        // Don't let the customer advance (and submit) mid-upload, or the quote
        // would send before the art lands.
        if (uploading) return;
        if (!printLocations.some(hasArtwork)) {
            setShowHint(true);
            return;
        }
        onNext();
    };

    const detail = (loc) =>
        isEmbroidery
            ? (STITCH_TIERS.find((t) => t.threadCount === loc.threads) || STITCH_TIERS[0]).label.toLowerCase()
            : `${loc.colors} ${loc.colors === 1 ? 'color' : 'colors'}`;

    if (!active) return null;

    return (
        <>
            <div className='slide-header'>
                <h1 className='text-3xl font-bold headingColor'>Add Your Artwork</h1>
                <p className='mt-1 text-sm bodyColor'>
                    {isEmbroidery
                        ? 'Each spot we stitch gets its own tab with its own artwork. Add the back and it prices right in.'
                        : 'Each spot we print gets its own tab with its own artwork and ink colors. Add the back and it prices right in.'}
                </p>
            </div>
            <div className='slide-content final-quote-content'>
                <div className='loc-tabs' role='tablist' aria-label='Print locations'>
                    {printLocations.map((loc) => (
                        <button
                            key={loc.id}
                            type='button'
                            role='tab'
                            aria-selected={loc.id === active.id}
                            className={`loc-tab ${loc.id === active.id ? 'btnColor' : 'btnInactive'}`}
                            onClick={() => setActiveId(loc.id)}
                        >
                            {tabLabel(loc.name)}
                        </button>
                    ))}
                    {backName && (
                        <button type='button' className='loc-tab loc-tab-add' onClick={() => add(backName)}>
                            + Back
                        </button>
                    )}
                    {otherUnused.length > 0 && (
                        <button type='button' className='loc-tab loc-tab-add' onClick={() => add(otherUnused[0])}>
                            + Another Spot
                        </button>
                    )}
                </div>

                <div className='loc-panel text-left' role='tabpanel'>
                    <label className='block text-sm font-semibold headingColor mb-2'>Where does this one go?</label>
                    <div className='flex flex-wrap gap-2 mb-4'>
                        {placements.filter((p) => p === active.name || !used.includes(p)).map((p) => (
                            <button
                                key={p}
                                type='button'
                                aria-pressed={p === active.name}
                                className={`loc-chip ${p === active.name ? 'btnColor' : 'btnInactive'}`}
                                onClick={() => update(active.id, { name: p })}
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                            <label className='block text-sm font-semibold headingColor mb-1'>Upload the {tabLabel(active.name)} Design</label>
                            <p className='text-xs bodyColor mb-2'>JPG, PNG, PDF, AI, EPS or SVG</p>
                            <label className='loc-file btnInactive'>
                                {active.fileName ? 'Replace File' : 'Choose File'}
                                <input
                                    key={active.id}
                                    type='file'
                                    accept='image/*,.pdf,.ai,.eps,.svg'
                                    onChange={(e) => handleFile(active.id, e.target.files[0])}
                                    className='sr-only'
                                />
                            </label>
                            {active.status === 'uploading' && (
                                <p className='text-xs mt-2 bodyColor' style={{ fontWeight: 600 }}>
                                    Uploading {active.fileName}...
                                </p>
                            )}
                            {active.status === 'success' && (
                                <p className='text-xs mt-2' style={{ color: '#7FD7A3', fontWeight: 600 }}>
                                    Uploaded: {active.fileName}
                                </p>
                            )}
                            {active.status === 'error' && (
                                <div className='mt-2 p-3 rounded-lg' style={{ background: '#FDE8E8', border: '1px solid #F5B5B5' }}>
                                    <p className='text-xs' style={{ color: '#B42318', fontWeight: 700 }}>
                                        Your file didn't finish uploading.
                                    </p>
                                    <p className='text-xs mt-1' style={{ color: '#7A1B12' }}>
                                        Please try again, or just describe your design below and we'll
                                        follow up by email to collect the artwork. Your quote will still go through.
                                    </p>
                                </div>
                            )}
                            <label htmlFor={`loc-desc-${active.id}`} className='block text-sm font-semibold headingColor mt-4 mb-1'>
                                Or Describe the {tabLabel(active.name)} Design
                            </label>
                            <textarea
                                key={`d-${active.id}`}
                                id={`loc-desc-${active.id}`}
                                placeholder='Wording, colors, layout...'
                                value={active.description}
                                onChange={(e) => { update(active.id, { description: e.target.value }); setShowHint(false); }}
                                className='w-full p-3 border-2 rounded-lg h-20 resize-none transition text-sm'
                                style={{ fontFamily: 'var(--lt-font-body)' }}
                            />
                        </div>

                        <div>
                            {isEmbroidery ? (
                                <>
                                    <label className='block text-sm font-semibold headingColor mb-2'>How Detailed Is It?</label>
                                    <div className='grid grid-cols-1 gap-2'>
                                        {STITCH_TIERS.map((tier) => {
                                            const on = active.threads === tier.threadCount;
                                            return (
                                                <button
                                                    key={tier.id}
                                                    type='button'
                                                    aria-pressed={on}
                                                    onClick={() => update(active.id, { threads: tier.threadCount })}
                                                    className={`text-left p-3 rounded-lg ${on ? 'btnColor' : 'btnInactive'}`}
                                                >
                                                    <span className='block text-sm font-bold'>{tier.label}</span>
                                                    <span className='block text-xs mt-1' style={{ lineHeight: 1.45 }}>{tier.description}</span>
                                                    <span className='block text-xs mt-1 font-semibold uppercase' style={{ letterSpacing: '0.04em' }}>{tier.range}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <label className='block text-sm font-semibold headingColor mb-1'>Ink Colors on the {tabLabel(active.name)}</label>
                                    <p className='text-xs bodyColor mb-2'>Each color is its own screen, so it changes the price.</p>
                                    <div className='loc-stepper'>
                                        <button
                                            type='button'
                                            className='loc-step btnInactive'
                                            aria-label='Fewer ink colors'
                                            disabled={active.colors <= 1}
                                            onClick={() => update(active.id, { colors: Math.max(1, active.colors - 1) })}
                                        >
                                            -
                                        </button>
                                        <span className='loc-count headingColor' aria-live='polite'>{active.colors}</span>
                                        <button
                                            type='button'
                                            className='loc-step btnInactive'
                                            aria-label='More ink colors'
                                            disabled={active.colors >= MAX_COLORS}
                                            onClick={() => update(active.id, { colors: Math.min(MAX_COLORS, active.colors + 1) })}
                                        >
                                            +
                                        </button>
                                        <span className='text-sm bodyColor'>{active.colors === 1 ? 'color' : 'colors'}</span>
                                    </div>
                                </>
                            )}
                            {printLocations.length > 1 && (
                                <button type='button' className='loc-remove' onClick={() => remove(active.id)}>
                                    Remove the {tabLabel(active.name)} {isEmbroidery ? 'Stitch' : 'Print'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <p className='text-sm bodyColor mt-4 mb-3 text-center'>
                    {printLocations.length} {isEmbroidery ? 'stitch' : 'print'} {printLocations.length === 1 ? 'location' : 'locations'} on your quote:{' '}
                    {printLocations.map((l) => `${tabLabel(l.name)} (${detail(l)})`).join(', ')}
                </p>
                {showHint && (
                    <p className='text-sm mb-3 text-center' role='alert' style={{ color: '#FFB4A8', fontWeight: 600 }}>
                        Upload a file or describe your design for at least one location.
                    </p>
                )}
            </div>
            <div className='slide-nav'>
                <NavBtn onClick={onPrevious} direction='prev'>&larr; Prev</NavBtn>
                <NavBtn onClick={handleNext}>{uploading ? 'Uploading…' : <>Next &rarr;</>}</NavBtn>
            </div>
        </>
    );
}
