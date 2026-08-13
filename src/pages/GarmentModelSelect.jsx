import React, { useEffect, useState } from 'react';
import NavBtn from '../components/NavBtn';
import { lookupGarment, getCardFields } from '../garments/skuByLabel';
import { searchCatalog, countCatalog, catalogEnabled, PAGE_SIZE } from '../utils/catalog';

// How expensive this blank is relative to others of the same garment type, the
// way Yelp rates a restaurant. The customer needs to tell a cheap tee from a
// pricey one without us publishing what the garment itself costs.
function PriceTier({ tier }) {
    if (!tier) return null;
    const level = Math.min(4, Math.max(1, tier));
    return (
        <div className='price-tier' aria-label={`${level} out of 4 on price`}>
            {[1, 2, 3, 4].map((i) => (
                <span key={i} className={i <= level ? 'price-tier-on' : 'price-tier-off'}>$</span>
            ))}
        </div>
    );
}

// One card shape for both the shortlist and the browse-all grid. The two used to
// drift apart, which is why the recommended styles read as a bare text list next
// to a catalog full of photographed cards.
function GarmentCard({ fields, active, onClick }) {
    const { brand, styleName, title, blurb, priceTier, stockImage } = fields;
    return (
        <button
            onClick={onClick}
            className={`catalog-card ${active ? 'catalog-card-active' : ''}`}
            aria-pressed={active}
        >
            {stockImage ? (
                <img src={stockImage} alt={`${brand} ${styleName}`.trim()} loading='lazy' />
            ) : (
                <div className='catalog-card-noimg'>No photo</div>
            )}
            <div className='catalog-card-text'>
                {brand && <div className='catalog-card-brand'>{brand}</div>}
                <div className='catalog-card-style'>{styleName}</div>
                {title && <div className='catalog-card-title'>{title}</div>}
                {blurb && <div className='catalog-card-blurb'>{blurb}</div>}
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

const SHORTLIST_LEAD = {
    tshirts: 'Our go-to tees.',
    longsleeves: 'Our go-to long sleeves.',
    hoodies: 'Our go-to fleece.',
    polos: 'Our go-to polos.',
    hats: 'Our go-to caps.',
};

// The shortlist is the client's own priced sheet, so it stays in their order and
// only the first few show up front. Anything past this is one tap away rather
// than dropped, because a sheet row prices off their matrix and the same style
// pulled from the catalog would price off blank cost instead.
const SHORTLIST_VISIBLE = 5;

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

    useEffect(() => {
        if (!selectedModel && models.length > 0) {
            const first = models[0];
            setSelectedModel(first.label);
            const g = lookupGarment(typeId, first.label);
            setSelectedGarment(g);
        }
    }, [models]);

    // Collapse the shortlist again when the customer switches garment type.
    useEffect(() => { setShowAll(false); }, [typeId]);

    // How many styles sit behind the "browse all" prompt.
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

    const handleSelect = (label) => {
        setSelectedModel(label);
        const g = lookupGarment(typeId, label);
        setSelectedGarment(g);
    };

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
                        <div className='catalog-grid'>
                            {results.map((g) => (
                                <GarmentCard
                                    key={g.id}
                                    fields={g}
                                    active={selectedGarment?.id === g.id}
                                    onClick={() => handleCatalogSelect(g)}
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

    const hidden = Math.max(0, models.length - SHORTLIST_VISIBLE);
    const visibleModels = showAll ? models : models.slice(0, SHORTLIST_VISIBLE);
    const pickedFromCatalog = selectedGarment?.fromCatalog ? selectedGarment : null;

    return (
        <>
            <div className='slide-header'>
                <h1 className='text-3xl font-bold headingColor'>Pick Your {garmentTypeName}</h1>
                <p className='mt-1 text-sm bodyColor'>
                    {SHORTLIST_LEAD[typeId] || 'Our go-to blanks.'} The $ band shows how the blank prices
                    compare inside this category.
                </p>
            </div>
            <div className='slide-content' style={{ justifyContent: 'flex-start', gap: '8px' }}>
                <div className='catalog-grid shortlist-grid'>
                    {/* A catalog pick is not one of the sheet rows, so it rides along at the
                        front of the grid instead of leaving nothing on the page looking chosen. */}
                    {pickedFromCatalog && (
                        <GarmentCard fields={pickedFromCatalog} active onClick={() => {}} />
                    )}
                    {visibleModels.map((m) => {
                        const fields = getCardFields(typeId, m.label);
                        if (!fields) return null;
                        return (
                            <GarmentCard
                                key={m.label}
                                fields={fields}
                                active={!pickedFromCatalog && selectedModel === m.label}
                                onClick={() => handleSelect(m.label)}
                            />
                        );
                    })}
                </div>

                <div className='shortlist-actions'>
                    {hidden > 0 && !showAll && (
                        <button className='catalog-open' onClick={() => setShowAll(true)}>
                            Show {hidden} more {garmentTypeName.toLowerCase()}{hidden === 1 ? '' : 's'}
                        </button>
                    )}
                    {catalogEnabled && catalogTotal > 0 && (
                        <button className='catalog-open' onClick={() => { setSearchInput(''); setSearch(''); setPage(0); setBrowsing(true); }}>
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
