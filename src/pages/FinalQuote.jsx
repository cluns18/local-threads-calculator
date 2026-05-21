import React, { useState, useEffect, useCallback } from 'react';
import NavBtn from '../components/NavBtn';
import calculateFinalQuote from '../utils/functions';
import { throttle } from 'lodash';
import SHOP_CONFIG from '../config/shop';
import {
    buildMerchantHTML,
    buildCustomerHTML,
    buildMerchantSubject,
    buildCustomerSubject,
} from '../lib/quoteEmails';

const GARMENT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
const HAT_TYPES = ['hats'];

export default function FinalQuote({
    onNext, onPrevious, pricingData,
    selectedProject, selectedGarmentType, selectedModel,
    selectedGarment, selectedColor, selectedArtwork, artworkDescription,
    selectedLocation, locationColorCounts, locationThreadCounts,
    selectedPatchType, selectedPatchSize, setFinalQuote
}) {
    const isHat = selectedGarmentType?.id && HAT_TYPES.includes(selectedGarmentType.id);
    const isPatch = selectedProject === 'patches';
    const sizes = (isHat || isPatch) ? null : GARMENT_SIZES;
    const MOQ = 24;

    const garmentLabel = selectedModel || selectedGarmentType?.name || '';
    const locationList = selectedLocation?.length > 0 ? selectedLocation.join(', ') : '';

    const [sizeBreakdown, setSizeBreakdown] = useState(
        (isHat || isPatch) ? null : Object.fromEntries(GARMENT_SIZES.map(s => [s, 0]))
    );
    const [quantity, setQuantity] = useState(MOQ);
    const [pricePerItem, setPricePerItem] = useState(0);
    const [totalPrice, setTotalPrice] = useState(0);
    const [formData, setFormData] = useState({ name: '', company: '', email: '', phone: '' });
    const [isFormValid, setIsFormValid] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [pricingRevealed, setPricingRevealed] = useState(false);

    const handleSizeChange = (size, delta) => {
        const current = sizeBreakdown[size] || 0;
        const val = Math.max(0, current + delta);
        const updated = { ...sizeBreakdown, [size]: val };
        setSizeBreakdown(updated);
        const total = Object.values(updated).reduce((sum, v) => sum + v, 0);
        if (total > 0) setQuantity(total);
    };

    const fetchQuote = useCallback(throttle((qty) => {
        const { totalQuote, pricePerItem } = calculateFinalQuote(pricingData, {
            selectedProject,
            selectedGarmentType: selectedGarmentType?.id,
            selectedModel,
            selectedColor,
            locationColorCounts,
            locationThreadCounts,
            selectedPatchType,
            selectedPatchSize,
            quantity: qty,
        });
        setPricePerItem(pricePerItem);
        setTotalPrice(totalQuote);
        setFinalQuote({ pricePerItem, totalPrice: totalQuote, quantity: qty });
    }, 200), [pricingData, selectedProject, selectedGarmentType, selectedModel, selectedColor, locationColorCounts, locationThreadCounts, selectedPatchType, selectedPatchSize, setFinalQuote]);

    useEffect(() => { fetchQuote(quantity); }, [quantity, fetchQuote]);

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validatePhone = (phone) => /^\d{10}$|^\d{3}-\d{3}-\d{4}$|^\(\d{3}\)\s\d{3}-\d{4}$|^\+\d{1,3}\d{7,14}$/.test(phone.replace(/\s/g, ''));

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (formErrors[name]) setFormErrors({ ...formErrors, [name]: '' });
    };

    useEffect(() => {
        const errors = {};
        if (formData.name.trim() === '') errors.name = 'Name is required';
        if (formData.email.trim() === '') errors.email = 'Email is required';
        else if (!validateEmail(formData.email)) errors.email = 'Please enter a valid email address';
        if (formData.phone.trim() === '') errors.phone = 'Phone number is required';
        else if (!validatePhone(formData.phone)) errors.phone = 'Please enter a valid phone number';
        setFormErrors(errors);
        setIsFormValid(Object.keys(errors).length === 0);
    }, [formData]);

    const handleSubmit = async () => {
        if (!isFormValid) return;
        setIsSubmitting(true);

        const inkDetails = selectedProject === 'screenPrinting'
            ? Object.entries(locationColorCounts || {})
                .map(([loc, count]) => `${loc}: ${count} color${count !== 1 ? 's' : ''}`)
                .join(', ') || 'Standard'
            : selectedProject === 'embroidery'
            ? Object.entries(locationThreadCounts || {})
                .map(([loc, count]) => `${loc}: ${count.toLocaleString()} stitches`)
                .join(', ') || 'Standard'
            : `${selectedPatchType} - ${selectedPatchSize}`;

        const artworkUploaded = selectedArtwork && !selectedArtwork.startsWith('pending:');
        const pendingFilename = selectedArtwork && selectedArtwork.startsWith('pending:')
            ? selectedArtwork.slice('pending:'.length)
            : null;

        const uploadedArtworkValue = artworkUploaded
            ? selectedArtwork
            : pendingFilename
                ? `Upload did not complete. User selected file: ${pendingFilename}`
                : 'No file uploaded';

        const garmentShade = selectedColor
            ? (selectedColor.underbase === 0 ? 'Light' : 'Dark')
            : null;

        const merchantHTML = buildMerchantHTML({
            name: formData.name,
            company: formData.company || 'N/A',
            email: formData.email,
            phone: formData.phone,
            selectedProject,
            selectedGarment: selectedGarmentType?.name || 'N/A',
            selectedModel: selectedModel || 'N/A',
            selectedColor: selectedColor?.name || 'N/A',
            garmentShade,
            selectedLocations: locationList || 'None',
            locationColorCounts,
            locationThreadCounts,
            patchType: selectedPatchType,
            patchSize: selectedPatchSize,
            sizeBreakdown,
            quantity,
            pricePerItem: pricePerItem.toFixed(2),
            totalQuote: totalPrice.toFixed(2),
            uploadedArtwork: uploadedArtworkValue,
            artworkDescription: artworkDescription || 'No description provided',
            submittedAtISO: new Date().toISOString(),
        });

        const customerHTML = buildCustomerHTML({
            name: formData.name,
            email: formData.email,
            garmentLabel,
            selectedColor: selectedColor?.name || null,
            garmentShade,
            selectedLocations: locationList || 'None',
            inkDetails,
            sizeBreakdown,
            quantity,
            pricePerItem: pricePerItem.toFixed(2),
            totalQuote: totalPrice.toFixed(2),
            uploadedArtwork: uploadedArtworkValue,
        });

        const merchantSubject = buildMerchantSubject(
            formData.name,
            selectedGarmentType?.name || selectedModel || 'Quote',
            totalPrice.toFixed(2)
        );
        const customerSubject = buildCustomerSubject(garmentLabel || 'Project', quantity);

        const endpoint = import.meta.env.VITE_SEND_QUOTE_ENDPOINT || '/api/send-quote';

        const postEmail = (payload) =>
            fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }).then(async (r) => {
                if (!r.ok) throw new Error(`send-quote ${r.status}: ${await r.text()}`);
                return r.json();
            });

        try {
            await Promise.all([
                // Merchant notification: customer email as Reply-To so Noah can hit Reply
                postEmail({
                    to: SHOP_CONFIG.shop_email,
                    subject: merchantSubject,
                    html: merchantHTML,
                    fromName: 'Local Threads Calculator',
                    replyTo: formData.email,
                }),
                // Customer quote: Blink as Reply-To so replies route to orders@localthreadsohio.com
                postEmail({
                    to: formData.email,
                    subject: customerSubject,
                    html: customerHTML,
                    fromName: SHOP_CONFIG.shop_name,
                    replyTo: SHOP_CONFIG.shop_email,
                }),
            ]);

            window.parent.postMessage(
                { event: 'calculator_submission', totalQuote: totalPrice.toFixed(2), pricePerItem: pricePerItem.toFixed(2), quantity },
                '*'
            );
            onNext();
        } catch (error) {
            console.error('Email submission failed:', error);
            alert('Error submitting project. Please try again.');
        }

        setIsSubmitting(false);
    };

    const belowMOQ = quantity < MOQ;

    return (
        <>
            <div className='slide-header' style={{ padding: '8px 24px 2px' }}>
                <h1 className='text-2xl font-bold headingColor' style={{ marginBottom: '1px', fontSize: '1.15rem' }}>Finalize Your Order</h1>
                <p className='bodyColor' style={{ fontSize: '0.7rem', color: 'rgba(240,237,228,0.7)' }}>
                    {garmentLabel}{isPatch ? ` - ${selectedPatchSize}` : ''}
                </p>
            </div>
            <div className='slide-content final-quote-content'>
                {/* Running counter pill + MOQ */}
                <div className='text-center mb-1'>
                    <div className='counter-pill' style={{
                        display: 'inline-flex', alignItems: 'center', gap: '12px',
                        background: 'rgba(37,115,241,0.15)', border: '1px solid rgba(37,115,241,0.3)',
                        borderRadius: '999px', padding: '5px 16px',
                    }}>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', color: '#f0ede4', fontWeight: 600 }}>{quantity} Items</span>
                        <span style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.15)' }}></span>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1.05rem', color: '#D67E4E', fontWeight: 700 }}>${pricePerItem.toFixed(2)}/ea</span>
                    </div>
                    {/* Reserve space so the MOQ warning doesn't bounce content when it toggles */}
                    <p style={{ color: '#c4a24e', fontSize: '0.7rem', fontFamily: "'DM Sans', sans-serif", marginTop: '4px', visibility: belowMOQ ? 'visible' : 'hidden', minHeight: '1em' }}>
                        Minimum order: {MOQ} units
                    </p>
                </div>

                {/* Size selectors */}
                {sizes ? (
                    <div style={{ marginBottom: '10px', display: pricingRevealed ? 'none' : 'block' }}>
                        <div className='size-grid' style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                            {sizes.map((size) => {
                                const qty = sizeBreakdown[size] || 0;
                                const isActive = qty > 0;
                                return (
                                    <div key={size} className='text-center size-cell' style={{
                                        background: isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                                        borderRadius: '6px', padding: '6px 2px 4px',
                                        border: isActive ? '2px solid #B85A36' : '2px solid rgba(255,255,255,0.08)',
                                        transition: 'all 0.2s ease',
                                    }}>
                                        <div className='size-label' style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.6rem', color: '#f0ede4', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{size}</div>
                                        <div className='flex items-center justify-center gap-0.5'>
                                            <button className='size-btn' onClick={() => handleSizeChange(size, -1)} style={{ width: '16px', height: '16px', borderRadius: '3px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.7rem', color: '#f0ede4', padding: 0, lineHeight: 1 }}>-</button>
                                            <input className='size-input' type='number' style={{ width: '38px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '3px', padding: '1px 2px', fontSize: '0.7rem', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, background: 'rgba(255,255,255,0.06)', color: '#f0ede4' }} value={qty} onChange={(e) => { const v = parseInt(e.target.value) || 0; setSizeBreakdown(prev => { const u = { ...prev, [size]: Math.max(0, v) }; const t = Object.values(u).reduce((s, x) => s + x, 0); if (t > 0) setQuantity(t); return u; }); }} min='0' max='1000' />
                                            <button className='size-btn' onClick={() => handleSizeChange(size, 1)} style={{ width: '16px', height: '16px', borderRadius: '3px', border: '1px solid rgba(37,115,241,0.3)', background: 'rgba(37,115,241,0.25)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.7rem', color: '#f0ede4', padding: 0, lineHeight: 1 }}>+</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className='mb-4 text-center'>
                        <label className='text-lg font-semibold headingColor block mb-3'>Quantity</label>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                style={{
                                    width: '32px', height: '32px', borderRadius: '6px',
                                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245,240,232,0.12)',
                                    color: '#f0ede4', cursor: 'pointer', fontSize: '18px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >-</button>
                            <input
                                type='number'
                                min='1'
                                max='5000'
                                value={quantity}
                                onChange={(e) => {
                                    const v = parseInt(e.target.value, 10);
                                    if (Number.isNaN(v)) { setQuantity(1); return; }
                                    setQuantity(Math.min(Math.max(v, 1), 5000));
                                }}
                                onFocus={(e) => e.target.select()}
                                className='headingColor'
                                style={{
                                    width: '96px',
                                    minWidth: '64px',
                                    textAlign: 'center',
                                    fontSize: '1.6rem',
                                    fontWeight: 700,
                                    fontFamily: "'DM Sans', sans-serif",
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    borderRadius: '8px',
                                    padding: '4px 6px',
                                    color: '#f0ede4',
                                    outline: 'none',
                                }}
                            />
                            <button
                                onClick={() => setQuantity(Math.min(5000, quantity + 1))}
                                style={{
                                    width: '32px', height: '32px', borderRadius: '6px',
                                    background: 'rgba(37,115,241,0.25)', border: '1px solid rgba(37,115,241,0.3)',
                                    color: '#f0ede4', cursor: 'pointer', fontSize: '18px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >+</button>
                        </div>
                    </div>
                )}

                {/* Light contrast breakdown card */}
                {!pricingRevealed ? (
                    <div className='light-card' style={{
                        background: '#e8f0fe', borderRadius: '10px', padding: '10px 12px', textAlign: 'center',
                    }}>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.55rem', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#B85A36', marginBottom: '2px' }}>Almost There</p>
                        <h3 style={{ color: '#0f1b33', fontSize: '0.9rem', fontWeight: '700', fontFamily: "'DM Sans', sans-serif", marginBottom: '2px' }}>
                            See Your Full Breakdown
                        </h3>
                        <p style={{ color: '#4a5d80', fontSize: '0.65rem', fontFamily: "'DM Sans', sans-serif", marginBottom: '8px', lineHeight: 1.35 }}>
                            Drop your info to see the full size-by-size breakdown and total.
                        </p>

                        <div className='form-grid' style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '6px' }}>
                            <input type='text' name='name' placeholder='Your Name *' value={formData.name} onChange={handleChange} style={inputStyle} />
                            <input type='text' name='company' placeholder='Company (optional)' value={formData.company} onChange={handleChange} style={inputStyle} />
                            <input type='email' name='email' placeholder='Your Best Email *' value={formData.email} onChange={handleChange} style={inputStyle} />
                            <input type='tel' name='phone' placeholder='Phone Number *' value={formData.phone} onChange={handleChange} style={inputStyle} />
                        </div>

                        <button
                            onClick={() => { if (isFormValid && !belowMOQ) setPricingRevealed(true); }}
                            style={{
                                background: isFormValid && !belowMOQ ? '#B85A36' : '#4a5d80',
                                color: '#f0ede4', border: 'none', borderRadius: '999px',
                                padding: '7px 22px', fontSize: '0.72rem', fontWeight: '600',
                                fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.06em', textTransform: 'uppercase',
                                cursor: isFormValid && !belowMOQ ? 'pointer' : 'not-allowed',
                                transition: 'all 0.25s ease',
                                opacity: isFormValid && !belowMOQ ? 1 : 0.5,
                            }}
                            onMouseEnter={(e) => { if (isFormValid && !belowMOQ) { e.target.style.background = '#D67E4E'; e.target.style.transform = 'translateY(-1px)'; } }}
                            onMouseLeave={(e) => { e.target.style.background = '#B85A36'; e.target.style.transform = 'translateY(0)'; }}
                        >
                            See Your Full Breakdown
                        </button>
                    </div>
                ) : (
                    <div className='light-card' style={{ background: '#e8f0fe', borderRadius: '10px', padding: '14px', animation: 'fadeIn 0.4s ease' }}>
                        {/* Price highlights */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <div className='text-center'>
                                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#4a5d80', marginBottom: '1px' }}>Per Item</div>
                                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1.7rem', fontWeight: 700, color: '#0f1b33', lineHeight: 1.1 }}>${pricePerItem.toFixed(2)}</div>
                            </div>
                            <div style={{ width: '1px', background: 'rgba(15,27,51,0.1)', alignSelf: 'stretch' }} />
                            <div className='text-center'>
                                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#4a5d80', marginBottom: '1px' }}>Total Quote</div>
                                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: '#D67E4E' }}>${totalPrice.toFixed(2)}</div>
                            </div>
                            <div style={{ width: '1px', background: 'rgba(15,27,51,0.1)', alignSelf: 'stretch' }} />
                            <div className='text-center'>
                                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#4a5d80', marginBottom: '1px' }}>Total Items</div>
                                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: '#0f1b33' }}>{quantity}</div>
                            </div>
                        </div>

                        {/* Breakdown table with inline +/- */}
                        {sizes && sizeBreakdown && (
                            <div style={{ marginBottom: '8px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid rgba(15,27,51,0.1)' }}>
                                            <th style={{ padding: '3px 0', textAlign: 'left', color: '#4a5d80', fontWeight: 500, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Size</th>
                                            <th style={{ padding: '3px 0', textAlign: 'center', color: '#4a5d80', fontWeight: 500, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Qty</th>
                                            <th style={{ padding: '3px 0', textAlign: 'right', color: '#4a5d80', fontWeight: 500, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sizes.map(size => {
                                            const qty = sizeBreakdown[size] || 0;
                                            return (
                                                <tr key={size} style={{ borderBottom: '1px solid rgba(15,27,51,0.06)' }}>
                                                    <td style={{ padding: '4px 0', color: '#0f1b33', fontWeight: 500 }}>{size}</td>
                                                    <td style={{ padding: '4px 0', textAlign: 'center' }}>
                                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                            <button onClick={() => handleSizeChange(size, -1)} style={{ width: '18px', height: '18px', borderRadius: '3px', border: '1px solid rgba(15,27,51,0.15)', background: 'rgba(15,27,51,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.7rem', color: '#0f1b33', padding: 0, lineHeight: 1 }}>-</button>
                                                            <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 600, color: qty > 0 ? '#0f1b33' : '#4a5d80' }}>{qty}</span>
                                                            <button onClick={() => handleSizeChange(size, 1)} style={{ width: '18px', height: '18px', borderRadius: '3px', border: '1px solid rgba(37,115,241,0.3)', background: 'rgba(37,115,241,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.7rem', color: '#D67E4E', padding: 0, lineHeight: 1 }}>+</button>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '4px 0', textAlign: 'right', color: qty > 0 ? '#0f1b33' : '#4a5d80', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>${(qty * pricePerItem).toFixed(2)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.6rem', color: '#4a5d80', textAlign: 'center', lineHeight: 1.4, marginBottom: '8px' }}>
                            Local pickup price. Submit to inquire about shipping. Estimate may vary slightly on final approval.
                        </p>

                        <div className='text-center'>
                            <button
                                onClick={handleSubmit}
                                disabled={!isFormValid || isSubmitting || belowMOQ}
                                style={{
                                    background: (isFormValid && !belowMOQ) ? '#B85A36' : '#4a5d80',
                                    color: '#f0ede4', border: 'none', padding: '8px 28px', borderRadius: '999px',
                                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', fontWeight: 600,
                                    letterSpacing: '0.06em', textTransform: 'uppercase',
                                    cursor: (isFormValid && !belowMOQ) ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.25s ease',
                                    opacity: (isFormValid && !belowMOQ) ? 1 : 0.5,
                                }}
                                onMouseEnter={(e) => { if (isFormValid && !belowMOQ) { e.target.style.background = '#D67E4E'; e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 20px rgba(37,115,241,0.3)'; } }}
                                onMouseLeave={(e) => { e.target.style.background = '#B85A36'; e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}
                            >
                                {isSubmitting ? 'Sending...' : 'Save & Send to Me'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <div className='slide-nav'>
                <NavBtn onClick={onPrevious} direction='prev'>&larr; Prev</NavBtn>
                <div></div>
            </div>
        </>
    );
}

const inputStyle = {
    width: '100%',
    background: '#fff',
    border: '1px solid rgba(15,27,51,0.2)',
    borderRadius: '6px',
    padding: '6px 9px',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.7rem',
    fontWeight: 400,
    color: '#0f1b33',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
};
