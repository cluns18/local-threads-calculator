import React, { useEffect, useState } from 'react';
import NavBtn from '../components/NavBtn';
import { lookupGarment, getCardFields } from '../garments/skuByLabel';
import { searchCatalog, countCatalog, catalogEnabled, PAGE_SIZE } from '../utils/catalog';
import { FEATURED, GARMENT_NOTES } from '../utils/garmentNotes';

// The individual garment step, built to look and feel like the garment step in
// the Olive Branch Apparel Design Studio: three featured blanks per type, each
// with a badge, a tall photo, a headline and three reasons from the mill's spec
// sheet, then the rest of Local Threads' sheet one tap away, and the full S&S
// catalog behind that.
//
// PRICING INVARIANT, do not touch: a sheet row prices off Local Threads' own
// matrix through `selectedModel` (the row label) and `lookupGarment`, while a
// catalog pick carries `fromCatalog` + `cost` and prices off blank cost. The
// featured cards are always sheet rows, and the two select handlers below are
// the same ones the old list used.

// How expensive this blank is relative to others of the same garment type, the
// way Yelp rates a restaurant. The customer needs to tell a cheap tee from a
// pricey one without us publishing what the garment itself costs.
function PriceTier({ tier }) {
    if (!tier) return null;
    const level = Math.min(4, Math.max(1, tier));
    return (
        <div className='price-tier' role='img' aria-label={`${level} out of 4 on price`}>
            {[1, 2, 3, 4].map((i) => (
                <span key={i} aria-hidden='true' className={i <= level ? 'price-tier-on' : 'price-tier-off'}>$</span>
            ))}
        </div>
    );
}

// A row of colour dots so nobody thinks the blank only comes in white.
function Swatches({ colors, max = 8 }) {
    if (!colors?.length) return null;
    const shown = colors.slice(0, max);
    const more = colors.length - shown.length;
    return (
        <div className='pick-swatches' role='img' aria-label={`${colors.length} colors available`}>
            {shown.map((c) => (
                <span
                    key={c.name}
                    title={c.name}
                    className='pick-swatch'
                    style={c.hex ? { backgroundColor: c.hex } : { backgroundImage: `url(${c.image})`, backgroundSize: 'cover' }}
                />
            ))}
            {more > 0 && <span className='pick-swatch-more'>+{more}</span>}
        </div>
    );
}

function CheckIcon() {
    return (
        <svg viewBox='0 0 16 16' fill='none' aria-hidden='true' className='pick-check'>
            <path d='M3 8.5L6.5 12L13 4' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' />
        </svg>
    );
}

// One card shape for the featured three, the rest of the sheet, and the catalog
// grid, so nothing on this step reads as a bare text list next to photographed
// cards. `note` (badge + headline + bullets) is what makes a featured card.
function PickCard({ fields, note, colors, active, onClick, index = 0, compact = false }) {
    const { brand, styleName, title, blurb, priceTier, stockImage } = fields;
    const headline = note ? note.headline : blurb;
    return (
        <button
            type='button'
            onClick={onClick}
            className={`pick-card ${active ? 'is-active' : ''} ${compact ? 'pick-card--compact' : ''}`}
            aria-pressed={active}
            style={{ animation: `fadeSlideUp 0.45s ease-out ${index * 80}ms both` }}
        >
            {note?.badge && <span className='pick-badge'>{note.badge}</span>}
            {active && (
                <span className='pick-selected' aria-hidden='true'>
                    <CheckIcon />
                </span>
            )}
            <div className='pick-card-img'>
                {stockImage ? (
                    <img src={stockImage} alt={`${brand || ''} ${styleName}`.trim()} loading='lazy' />
                ) : (
                    <span className='pick-card-noimg'>No photo</span>
                )}
            </div>
            {brand && <div className='pick-card-brand'>{brand}</div>}
            <div className='pick-card-style'>{styleName}</div>
            {title && <div className='pick-card-title'>{title}</div>}
            {headline && <div className='pick-card-head'>{headline}</div>}
            {note?.bullets?.length > 0 && (
                <ul className='pick-card-bullets'>
                    {note.bullets.map((b) => (
                        <li key={b}><CheckIcon /><span>{b}</span></li>
                    ))}
                </ul>
            )}
            <div className='pick-card-foot'>
                <Swatches colors={colors} />
                {colors?.length > 0 && (
                    <div className='pick-card-count'>{colors.length} {colors.length === 1 ? 'color' : 'colors'}</div>
                )}
                <PriceTier tier={priceTier} />
            </div>
        </button>
    );
}

// A real brand and a real style number for the type being browsed, so the hint
// is something the customer could actually type. Hats do not sell Comfort Colors.
const SEARCH_HINT = {
    tshirts: 'Try "Comfort Colors" or "3001"',
    longsleeves: 'Try "Gildan" or "2400"',
    hoodies: 'Try "Independent" or "18500"',
    polos: 'Try "CORE365" or "8800"',
    hats: 'Try "Richardson" or "112"',
};

const STEP_LEAD = {
    tshirts: 'Three tees we recommend most, then the rest of our sheet and the whole catalog.',
    longsleeves: 'Three long sleeves we recommend most, then the rest of our sheet and the whole catalog.',
    hoodies: 'Three hoodies we recommend most, then the rest of our sheet and the whole catalog.',
    polos: 'Three polos we recommend most, then the rest of our sheet and the whole catalog.',
    hats: 'Three caps we recommend most, then the rest of our sheet and the whole catalog.',
};

// Split the sheet rows into the featured three (in FEATURED order) and everything
// else (in sheet order). A featured id that is missing from the sheet is simply
// skipped, and if fewer than two survive the step falls back to the first three
// rows so there is always something to pick.
function splitRows(typeId, models) {
    const byId = new Map();
    models.forEach((m) => {
        const g = lookupGarment(typeId, m.label);
        if (g) byId.set(g.id, m);
    });
    const featuredIds = FEATURED[typeId] || [];
    let featured = featuredIds.map((id) => byId.get(id)).filter(Boolean);
    if (featured.length < 2) featured = models.slice(0, 3);
    const featuredLabels = new Set(featured.map((m) => m.label));
    const rest = models.filter((m) => !featuredLabels.has(m.label));
    return { featured, rest };
}

export default function GarmentModelSelect({ pricingData, selectedGarmentType, selectedModel, setSelectedModel, selectedGarment, setSelectedGarment, onNext, onPrevious }) {
    const typeId = selectedGarmentType?.id;
    const section = pricingData?.[typeId];
    const models = section?.rows || [];

    // Full-catalog browser
    const [browsing, setBrowsing] = useState(false);
    const [catalogTotal, setCatalogTotal] = useState(0);
    const [results, setResults] = useState([]);
    const [resultTotal, setResultTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showAll, setShowAll] = useState(false);

    const { featured, rest } = splitRows(typeId, models);

    // Default to the first featured row (the budget pick), exactly as the old
    // list defaulted to the first sheet row: label into selectedModel, module
    // into selectedGarment, so pricing sees a sheet row.
    useEffect(() => {
        if (!selectedModel && models.length > 0) {
            const first = featured[0] || models[0];
            setSelectedModel(first.label);
            const g = lookupGarment(typeId, first.label);
            setSelectedGarment(g);
        }
    }, [models]);

    // Collapse the rest of the sheet again when the customer switches garment type.
    useEffect(() => { setShowAll(false); }, [typeId]);

    // How many styles sit behind the "explore all" prompt.
    useEffect(() => {
        if (!catalogEnabled || !typeId) return;
        let cancelled = false;
        countCatalog(typeId).then(n => { if (!cancelled) setCatalogTotal(n); });
        return () => { cancelled = true; };
    }, [typeId]);

    // Debounce typing so we are not firing a query per keystroke.
    useEffect(() => {
        const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(0); }, 250);
        return () => clearTimeout(t);
    }, [searchInput]);

    useEffect(() => {
        if (!browsing || !typeId) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        searchCatalog({ garmentTypeId: typeId, search, page })
            .then(({ garments, total }) => {
                if (cancelled) return;
                setResults(garments);
                setResultTotal(total);
                setLoading(false);
            })
            .catch((e) => {
                if (cancelled) return;
                setError(e.message);
                setResults([]);
                setResultTotal(0);
                setLoading(false);
            });
        return () => { cancelled = true; };
    }, [browsing, typeId, search, page]);

    // Sheet row: prices off Local Threads' matrix by label.
    const handleSelect = (label) => {
        setSelectedModel(label);
        const g = lookupGarment(typeId, label);
        setSelectedGarment(g);
    };

    // Catalog row: prices off blank cost via fromCatalog + cost.
    const handleCatalogSelect = (garment) => {
        setSelectedGarment(garment);
        setSelectedModel(garment.label);
        setBrowsing(false);
    };

    const garmentTypeName = selectedGarmentType?.name || 'Garment';
    const lastPage = Math.max(0, Math.ceil(resultTotal / PAGE_SIZE) - 1);

    if (browsing) {
        return (
            <>
                <div className='slide-header' style={{ padding: '16px 24px 4px' }}>
                    <h1 className='text-2xl font-bold headingColor'>Full catalog</h1>
                    <p className='bodyColor' style={{ fontSize: '0.78rem', marginTop: '2px' }}>
                        {resultTotal || catalogTotal} {garmentTypeName.toLowerCase()} options, most popular first.
                        Search by brand or style number.
                    </p>
                </div>
                <div className='slide-content' style={{ justifyContent: 'flex-start', gap: '8px', padding: '0 20px' }}>
                    <input
                        type='text'
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder={SEARCH_HINT[typeId] || 'Search by brand or style number'}
                        className='catalog-search'
                        autoFocus
                    />

                    {error && (
                        <p className='bodyColor catalog-msg'>
                            We could not load the full catalog right now. Pick one of our regulars and we will sort the rest out on the quote.
                        </p>
                    )}

                    {!error && loading && (
                        <p className='bodyColor catalog-msg'>Loading styles...</p>
                    )}

                    {!error && !loading && results.length === 0 && (
                        <p className='bodyColor catalog-msg'>
                            Nothing matched that. Try a brand name or a style number.
                        </p>
                    )}

                    {!error && !loading && results.length > 0 && (
                        <div className='pick-grid pick-grid--catalog'>
                            {results.map((g, i) => (
                                <PickCard
                                    key={g.id}
                                    fields={g}
                                    colors={g.colors}
                                    active={selectedGarment?.id === g.id}
                                    onClick={() => handleCatalogSelect(g)}
                                    index={i}
                                    compact
                                />
                            ))}
                        </div>
                    )}

                    {!error && resultTotal > PAGE_SIZE && (
                        <div className='catalog-pager'>
                            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>&larr; Back</button>
                            <span className='bodyColor'>{page + 1} of {lastPage + 1}</span>
                            <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={page >= lastPage}>Next &rarr;</button>
                        </div>
                    )}
                </div>
                <div className='slide-nav'>
                    <NavBtn onClick={() => setBrowsing(false)} direction='prev'>&larr; Recommended</NavBtn>
                    <NavBtn onClick={() => onNext()}>Next &rarr;</NavBtn>
                </div>
            </>
        );
    }

    const pickedFromCatalog = selectedGarment?.fromCatalog ? selectedGarment : null;

    const renderSheetCard = (m, i, withNote) => {
        const fields = getCardFields(typeId, m.label);
        if (!fields) return null;
        const g = lookupGarment(typeId, m.label);
        const note = withNote && g ? GARMENT_NOTES[g.id] : null;
        return (
            <PickCard
                key={m.label}
                fields={fields}
                note={note}
                colors={g?.colors}
                active={!pickedFromCatalog && selectedModel === m.label}
                onClick={() => handleSelect(m.label)}
                index={i}
                compact={!withNote}
            />
        );
    };

    return (
        <>
            <div className='slide-header'>
                <h1 className='text-3xl font-bold headingColor'>Pick Your {garmentTypeName}</h1>
                <p className='mt-1 text-sm bodyColor'>
                    {STEP_LEAD[typeId] || 'Three blanks we recommend most, then the rest of our sheet and the whole catalog.'}
                </p>
            </div>
            <div className='slide-content pick-content'>
                {/* A catalog pick is not one of the sheet rows, so it rides along at the
                    front of the grid instead of leaving nothing on the page looking chosen. */}
                {pickedFromCatalog && (
                    <div className='pick-grid pick-grid--picked'>
                        <PickCard fields={pickedFromCatalog} colors={pickedFromCatalog.colors} active onClick={() => {}} compact />
                    </div>
                )}

                <div className='pick-grid pick-grid--featured'>
                    {featured.map((m, i) => renderSheetCard(m, i, true))}
                </div>

                {showAll && rest.length > 0 && (
                    <div className='pick-grid pick-grid--more'>
                        {rest.map((m, i) => renderSheetCard(m, i, false))}
                    </div>
                )}

                <div className='pick-actions'>
                    {rest.length > 0 && !showAll && (
                        <button type='button' className='catalog-open' onClick={() => setShowAll(true)}>
                            Show {rest.length} more from our sheet
                        </button>
                    )}
                    {catalogEnabled && catalogTotal > 0 && (
                        <button type='button' className='catalog-open' onClick={() => { setSearchInput(''); setSearch(''); setPage(0); setBrowsing(true); }}>
                            Explore all {catalogTotal} options &rarr;
                        </button>
                    )}
                </div>
            </div>
            <div className='slide-nav'>
                <NavBtn onClick={onPrevious} direction='prev'>&larr; Prev</NavBtn>
                <NavBtn onClick={() => onNext()}>Next &rarr;</NavBtn>
            </div>
        </>
    );
}
