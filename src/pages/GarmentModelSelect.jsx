import React, { useEffect, useState } from 'react';
import NavBtn from '../components/NavBtn';
import { lookupGarment, getTagline } from '../garments/skuByLabel';
import { searchCatalog, countCatalog, catalogEnabled, PAGE_SIZE } from '../utils/catalog';
import { garmentRetail } from '../utils/fetchPricing';

// Shown next to a catalog style so the customer can tell a $4 blank from a $20
// one. Priced at the smallest tier since they have not picked a quantity yet.
const blankPrice = (cost) => garmentRetail(cost, 0).toFixed(2);

// A real brand and a real style number for the type being browsed, so the hint
// is something the customer could actually type. Hats do not sell Comfort Colors.
const SEARCH_HINT = {
    tshirts: 'Try "Comfort Colors" or "3001"',
    longsleeves: 'Try "Gildan" or "2400"',
    hoodies: 'Try "Independent" or "18500"',
    polos: 'Try "CORE365" or "8800"',
    hats: 'Try "Richardson" or "112"',
};

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

    useEffect(() => {
        if (!selectedModel && models.length > 0) {
            const first = models[0];
            setSelectedModel(first.label);
            const g = lookupGarment(typeId, first.label);
            setSelectedGarment(g);
        }
    }, [models]);

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
    const displayImage = selectedGarment?.stockImage;
    const displayAlt = selectedGarment?.label || selectedGarment?.name || selectedModel;
    const lastPage = Math.max(0, Math.ceil(resultTotal / PAGE_SIZE) - 1);

    if (browsing) {
        return (
            <>
                <div className='slide-header' style={{ padding: '16px 24px 4px' }}>
                    <h1 className='text-2xl font-bold headingColor'>All {garmentTypeName}s</h1>
                    <p className='bodyColor' style={{ fontSize: '0.78rem', marginTop: '2px' }}>
                        Search by brand or style number. Most popular first.
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
                            {results.map((g) => {
                                const active = selectedGarment?.id === g.id;
                                return (
                                    <button
                                        key={g.id}
                                        onClick={() => handleCatalogSelect(g)}
                                        className={`catalog-card ${active ? 'catalog-card-active' : ''}`}
                                    >
                                        {g.stockImage ? (
                                            <img src={g.stockImage} alt={g.label} loading='lazy' />
                                        ) : (
                                            <div className='catalog-card-noimg'>No photo</div>
                                        )}
                                        <div className='catalog-card-text'>
                                            <div className='catalog-card-brand'>{g.brand}</div>
                                            <div className='catalog-card-style'>{g.styleName}</div>
                                            {g.title && <div className='catalog-card-title'>{g.title}</div>}
                                            {g.blurb && <div className='catalog-card-blurb'>{g.blurb}</div>}
                                            <div className='catalog-card-price'>garment ${blankPrice(g.cost)}</div>
                                        </div>
                                    </button>
                                );
                            })}
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
                    <NavBtn onClick={() => setBrowsing(false)} direction='prev'>&larr; Our regulars</NavBtn>
                    <NavBtn onClick={() => onNext()}>Next &rarr;</NavBtn>
                </div>
            </>
        );
    }

    return (
        <>
            <div className='slide-header'>
                <h1 className='text-3xl font-bold headingColor'>Pick Your {garmentTypeName}</h1>
                <p className='mt-1 text-sm bodyColor'>Different weights, fits, and price points. Choose the one that works best.</p>
            </div>
            <div className='slide-content'>
                <div className='flex items-center gap-6 garment-layout'>
                    <div className='w-1/2 flex items-center justify-center garment-preview'>
                        {displayImage ? (
                            <img src={displayImage} alt={displayAlt} className='garment-img' style={{ maxHeight: '240px', width: 'auto', objectFit: 'contain' }} />
                        ) : (
                            <div className='bodyColor' style={{ opacity: 0.5, fontSize: '0.8rem', textAlign: 'center', padding: '20px' }}>
                                Image coming soon
                            </div>
                        )}
                    </div>
                    <div className='w-1/2 grid grid-cols-1 gap-2 garment-buttons'>
                        {selectedGarment?.fromCatalog && (
                            <div className='catalog-picked'>
                                <div className='catalog-picked-label'>{selectedGarment.label}</div>
                                {selectedGarment.title && (
                                    <div className='catalog-picked-title'>{selectedGarment.title}</div>
                                )}
                                <div className='catalog-picked-sub'>
                                    {selectedGarment.blurb ? `${selectedGarment.blurb} · ` : ''}
                                    garment ${blankPrice(selectedGarment.cost)}
                                </div>
                            </div>
                        )}
                        {models.map((m) => {
                            const tagline = getTagline(typeId, m.label);
                            const active = selectedModel === m.label;
                            return (
                                <button
                                    key={m.label}
                                    className={`w-full rounded-lg cursor-pointer transition duration-300 garment-btn ${active ? 'btnColor' : 'btnInactive'}`}
                                    style={{ padding: '8px 12px', textAlign: 'left', lineHeight: 1.25 }}
                                    onClick={() => handleSelect(m.label)}
                                >
                                    <div style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.01em' }}>{m.label}</div>
                                    {tagline && (
                                        <div style={{ fontSize: '0.66rem', fontWeight: 500, opacity: active ? 0.92 : 0.65, marginTop: '1px' }}>
                                            {tagline}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                        {catalogEnabled && catalogTotal > 0 && (
                            <button className='catalog-open' onClick={() => { setSearchInput(''); setSearch(''); setPage(0); setBrowsing(true); }}>
                                Looking for something else? Browse all {catalogTotal} styles &rarr;
                            </button>
                        )}
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
