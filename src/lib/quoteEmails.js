// Email HTML builders for the Local Threads pricing calculator.
// Produces inline-styled HTML strings safe for Gmail / Apple Mail / Outlook.
// Pulls every token from src/App.css + src/config/shop.js so the emails read
// as a direct extension of the calc's own UI.

import SHOP_CONFIG from '../config/shop.js';

// Color + font tokens mirror src/App.css (the calc's own design system) so
// emails feel like a native extension of the brand rather than a separate
// template.
const ACCENT = SHOP_CONFIG.accent_color;       // #B85A36 LT clay, reserved for buttons + accents
const ACCENT_SOFT = SHOP_CONFIG.price_color;   // #D67E4E lighter clay, readable on dark for text/numbers
const BG = SHOP_CONFIG.bg_color;               // #14110E LT charcoal
const CARD = SHOP_CONFIG.card_color;           // #1F1B16 LT surface
const TEXT = SHOP_CONFIG.text_color;           // #F2EBDF LT cream
const TEXT_MUTED = '#C8BFAE';                  // solid muted, matches v6 cream-muted
const TEXT_DIM = '#9B9588';                    // dim labels / metadata
const SUBTLE_LINE = 'rgba(242,235,223,0.08)';  // matches v6 border tokens
const HIGHLIGHT_BG = 'rgba(184,90,54,0.12)';   // clay tint for highlight boxes
const HIGHLIGHT_BORDER = 'rgba(184,90,54,0.32)'; // clay tint for highlight borders
const CARD_RADIUS = '10px';
const BTN_RADIUS = '999px';                    // pill buttons per v6 frontend-design
// Email clients strip <link> tags and most ignore web fonts entirely. The site
// sets headings in Gogh, which is self-hosted and cannot load here at all, so
// headings fall back to the brand body face at heavy weight rather than to a
// serif that belongs to no other Local Threads surface.
const HEADING_FONT = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Helvetica, sans-serif";
const BODY_FONT = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Helvetica, sans-serif";
const LABEL_FONT = BODY_FONT;

const escapeHtml = (s) =>
    String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const formatMoney = (n) => `$${Number(n).toFixed(2)}`;

const sectionLabel = (text) =>
    `<p style="font-family:${LABEL_FONT}; font-size:11px; letter-spacing:0.20em; text-transform:uppercase; color:${ACCENT_SOFT}; margin:0 0 14px; font-weight:700;">${escapeHtml(text)}</p>`;

const fieldRow = (label, value) => `
    <tr>
        <td style="padding:10px 0; font-family:${LABEL_FONT}; font-size:11px; color:${TEXT_MUTED}; width:38%; vertical-align:top; font-weight:600; text-transform:uppercase; letter-spacing:0.14em;">${escapeHtml(label)}</td>
        <td style="padding:10px 0; font-family:${BODY_FONT}; font-size:15px; color:${TEXT}; font-weight:500; vertical-align:top;">${value}</td>
    </tr>
`;

const card = (innerHTML) => `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${CARD}; border:1px solid ${SUBTLE_LINE}; border-radius:${CARD_RADIUS}; margin-bottom:16px;">
        <tr><td style="padding:24px 26px;">${innerHTML}</td></tr>
    </table>
`;

const emailShell = (innerHTML, preheader = '') => `
<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Local Threads</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0; padding:0; background:${BG}; -webkit-text-size-adjust:100%;">
<div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">${escapeHtml(preheader)}</div>
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${BG}; padding:36px 16px;">
    <tr><td align="center">
        <table width="620" cellpadding="0" cellspacing="0" role="presentation" style="max-width:620px; width:100%;">
            <tr><td style="padding:8px 0 28px; text-align:center;">
                <span style="font-family:${HEADING_FONT}; font-weight:900; font-size:30px; letter-spacing:0.02em; color:${TEXT}; text-transform:uppercase;">Local<span style="color:${ACCENT_SOFT};">threads</span></span>
            </td></tr>
            ${innerHTML}
            <tr><td style="padding:28px 8px 0; text-align:center; border-top:1px solid ${SUBTLE_LINE};">
                <p style="font-family:${BODY_FONT}; font-size:12px; color:${TEXT_MUTED}; margin:20px 0 6px; line-height:1.7;">${escapeHtml(SHOP_CONFIG.shop_name)} &middot; 955 Checkrein Ave, Columbus, OH 43229</p>
                <p style="font-family:${BODY_FONT}; font-size:12px; color:${TEXT_MUTED}; margin:0; line-height:1.7;"><a href="tel:${escapeHtml(SHOP_CONFIG.shop_phone)}" style="color:${TEXT_MUTED}; text-decoration:none;">${escapeHtml(SHOP_CONFIG.shop_phone)}</a> &middot; <a href="mailto:${escapeHtml(SHOP_CONFIG.shop_email)}" style="color:${ACCENT_SOFT}; text-decoration:none;">${escapeHtml(SHOP_CONFIG.shop_email)}</a> &middot; <a href="https://www.localthreadsohio.com" style="color:${ACCENT_SOFT}; text-decoration:none;">localthreadsohio.com</a></p>
            </td></tr>
        </table>
    </td></tr>
</table>
</body></html>
`;

// Render the size breakdown either as a table (if structured) or a sentence.
function renderSizeBreakdown(sizeBreakdown) {
    if (!sizeBreakdown || typeof sizeBreakdown !== 'object') return null;
    const entries = Object.entries(sizeBreakdown).filter(([, qty]) => Number(qty) > 0);
    if (entries.length === 0) return null;
    const cells = entries
        .map(
            ([size, qty]) => `
        <td align="center" style="padding:10px 4px; background:rgba(184,90,54,0.10); border:1px solid rgba(184,90,54,0.25); border-radius:8px;">
            <div style="font-family:${HEADING_FONT}; font-size:10px; letter-spacing:0.1em; text-transform:uppercase; color:${TEXT_DIM}; font-weight:700;">${escapeHtml(size)}</div>
            <div style="font-family:${HEADING_FONT}; font-size:18px; color:${TEXT}; font-weight:800; margin-top:2px;">${escapeHtml(qty)}</div>
        </td>`
        )
        .join('<td style="width:6px;">&nbsp;</td>');
    return `<table cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr>${cells}</tr></table>`;
}

function renderLocationCounts(map, suffix) {
    if (!map || typeof map !== 'object') return null;
    const entries = Object.entries(map);
    if (entries.length === 0) return null;
    return entries
        .map(
            ([loc, val]) =>
                `<div style="font-family:${BODY_FONT}; font-size:14px; color:${TEXT}; margin:0 0 4px;"><strong style="color:${ACCENT_SOFT};">${escapeHtml(loc)}:</strong> ${escapeHtml(val)} ${escapeHtml(suffix)}</div>`
        )
        .join('');
}

// ---------- MERCHANT EMAIL (to orders@localthreadsohio.com) ----------
export function buildMerchantHTML(data) {
    const {
        name, company, email, phone,
        selectedProject, selectedGarment, selectedModel, selectedColor, garmentShade,
        selectedLocations,
        locationColorCounts, locationThreadCounts,
        patchType, patchSize,
        sizeBreakdown,
        quantity, pricePerItem, totalQuote,
        uploadedArtwork, artworkDescription,
        submittedAtISO,
    } = data;

    const submittedAt = submittedAtISO
        ? new Date(submittedAtISO).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
        : new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

    // Hero summary card
    const heroCard = card(`
        ${sectionLabel('New Quote Request')}
        <p style="font-family:${HEADING_FONT}; font-size:24px; color:${TEXT}; margin:0 0 4px; font-weight:800; line-height:1.2;">${escapeHtml(name)}${company && company !== 'N/A' ? ` <span style="color:${TEXT_DIM}; font-weight:500; font-size:18px;">(${escapeHtml(company)})</span>` : ''}</p>
        <p style="font-family:${BODY_FONT}; font-size:13px; color:${TEXT_DIM}; margin:0 0 16px;">Submitted ${escapeHtml(submittedAt)}</p>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
                <td style="padding:14px 16px; background:rgba(184,90,54,0.15); border:1px solid rgba(184,90,54,0.35); border-radius:10px; width:50%;">
                    <div style="font-family:${HEADING_FONT}; font-size:10px; letter-spacing:0.14em; text-transform:uppercase; color:${TEXT_DIM}; font-weight:700;">Total Quote</div>
                    <div style="font-family:${HEADING_FONT}; font-size:28px; color:${ACCENT_SOFT}; font-weight:800; margin-top:2px;">${escapeHtml(formatMoney(totalQuote))}</div>
                </td>
                <td style="width:8px;"></td>
                <td style="padding:14px 16px; background:rgba(255,255,255,0.05); border:1px solid ${SUBTLE_LINE}; border-radius:10px; width:50%;">
                    <div style="font-family:${HEADING_FONT}; font-size:10px; letter-spacing:0.14em; text-transform:uppercase; color:${TEXT_DIM}; font-weight:700;">Per Item · Qty</div>
                    <div style="font-family:${HEADING_FONT}; font-size:18px; color:${TEXT}; font-weight:700; margin-top:2px;">${escapeHtml(formatMoney(pricePerItem))} <span style="color:${TEXT_DIM}; font-weight:500;">x ${escapeHtml(quantity)}</span></div>
                </td>
            </tr>
        </table>
    `);

    // Contact card
    const contactCard = card(`
        ${sectionLabel('Contact')}
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            ${fieldRow('Name', escapeHtml(name))}
            ${company && company !== 'N/A' ? fieldRow('Company', escapeHtml(company)) : ''}
            ${fieldRow('Email', `<a href="mailto:${escapeHtml(email)}" style="color:${ACCENT_SOFT}; text-decoration:none;">${escapeHtml(email)}</a>`)}
            ${fieldRow('Phone', `<a href="tel:${escapeHtml(phone)}" style="color:${ACCENT_SOFT}; text-decoration:none;">${escapeHtml(phone)}</a>`)}
        </table>
    `);

    // Project card. For screen printing, surface the underbase flag
    // (derived from selectedColor.underbase: 0 = light = no underbase,
    // anything else = dark = needs a white underbase layer). The pricing
    // function already shifts the row index by +1 for dark garments, so
    // the price reflects the extra screen / setup; this just makes it
    // legible for the print team rather than buried in the color label.
    const isPatch = selectedProject === 'patches';
    const isScreenPrint = selectedProject === 'screenPrinting';
    const underbaseRequired = garmentShade === 'Dark';
    const underbaseValue = underbaseRequired
        ? `<span style="color:${ACCENT_SOFT}; font-weight:700;">Yes</span> <span style="color:${TEXT_DIM}; font-weight:500;">(white underbase layer, priced in)</span>`
        : `<span style="color:${TEXT}; font-weight:700;">No</span> <span style="color:${TEXT_DIM}; font-weight:500;">(light garment)</span>`;

    const projectFields = isPatch
        ? `
            ${fieldRow('Project Type', 'Patches')}
            ${fieldRow('Patch Type', escapeHtml(patchType || 'N/A'))}
            ${fieldRow('Patch Size', escapeHtml(patchSize || 'N/A'))}
        `
        : `
            ${fieldRow('Project Type', escapeHtml((selectedProject || 'N/A').toString().replace(/^./, (c) => c.toUpperCase())))}
            ${fieldRow('Garment Style', escapeHtml(selectedGarment || 'N/A'))}
            ${fieldRow('Model #', escapeHtml(selectedModel || 'N/A'))}
            ${fieldRow('Color', `${escapeHtml(selectedColor || 'N/A')}${garmentShade && garmentShade !== 'N/A' ? ` <span style="color:${TEXT_DIM}; font-weight:500;">(${escapeHtml(garmentShade)})</span>` : ''}`)}
            ${isScreenPrint ? fieldRow('Underbase', underbaseValue) : ''}
            ${selectedLocations && selectedLocations !== 'None' ? fieldRow('Print Locations', escapeHtml(selectedLocations)) : ''}
        `;
    const projectCard = card(`${sectionLabel('Project')}<table width="100%" cellpadding="0" cellspacing="0" role="presentation">${projectFields}</table>`);

    // Sizes card
    const sizeTable = renderSizeBreakdown(sizeBreakdown);
    const sizesCard = sizeTable
        ? card(`
            ${sectionLabel('Size Breakdown')}
            ${sizeTable}
            <p style="font-family:${BODY_FONT}; font-size:13px; color:${TEXT_DIM}; margin:14px 0 0;">Total quantity: <strong style="color:${TEXT};">${escapeHtml(quantity)}</strong></p>
        `)
        : null;

    // Print details (ink colors / stitch counts) per location
    const colorCountsHTML = renderLocationCounts(locationColorCounts, 'colors');
    const threadCountsHTML = renderLocationCounts(locationThreadCounts, 'stitches');
    const printDetailsCard = (colorCountsHTML || threadCountsHTML)
        ? card(`
            ${sectionLabel(selectedProject === 'embroidery' ? 'Stitch Counts' : 'Ink Colors Per Location')}
            ${colorCountsHTML || threadCountsHTML || ''}
        `)
        : null;

    // Artwork card with prominent button to open file
    const artworkIsURL = uploadedArtwork && /^https?:\/\//i.test(uploadedArtwork);
    const artworkCard = card(`
        ${sectionLabel('Artwork')}
        ${
            artworkIsURL
                ? `
                <a href="${escapeHtml(uploadedArtwork)}" style="display:inline-block; background:${ACCENT}; color:${TEXT}; font-family:${HEADING_FONT}; font-size:14px; font-weight:600; padding:12px 26px; border-radius:${BTN_RADIUS}; text-decoration:none; letter-spacing:0.04em;">Open Artwork File &rarr;</a>
                <p style="font-family:${BODY_FONT}; font-size:12px; color:${TEXT_DIM}; margin:12px 0 0; word-break:break-all;"><a href="${escapeHtml(uploadedArtwork)}" style="color:${TEXT_DIM}; text-decoration:underline;">${escapeHtml(uploadedArtwork)}</a></p>
            `
                : `
                <p style="font-family:${BODY_FONT}; font-size:14px; color:${TEXT}; margin:0; font-weight:600;">${escapeHtml(uploadedArtwork || 'No file uploaded')}</p>
            `
        }
        ${
            artworkDescription && artworkDescription !== 'No description provided'
                ? `<p style="font-family:${BODY_FONT}; font-size:13px; color:${TEXT_DIM}; margin:14px 0 0; padding:12px 14px; background:rgba(255,255,255,0.05); border-radius:8px; border-left:3px solid ${ACCENT};"><strong style="color:${TEXT};">Notes:</strong> ${escapeHtml(artworkDescription)}</p>`
                : ''
        }
    `);

    const replyHint = card(`
        <p style="font-family:${BODY_FONT}; font-size:13px; color:${TEXT}; margin:0; line-height:1.6;">
            Hit reply on this email to message <strong style="color:${ACCENT_SOFT};">${escapeHtml(name)}</strong> directly. Their email is set as the reply-to.
        </p>
    `);

    const body = `
        <tr><td>${heroCard}${contactCard}${projectCard}${sizesCard || ''}${printDetailsCard || ''}${artworkCard}${replyHint}</td></tr>
    `;

    return emailShell(body, `${name} · ${selectedGarment || selectedProject} · ${formatMoney(totalQuote)} (${quantity} qty)`);
}

// ---------- CUSTOMER EMAIL (to the buyer) ----------
export function buildCustomerHTML(data) {
    const {
        name, email, garmentLabel, selectedColor, garmentShade,
        selectedLocations, inkDetails,
        sizeBreakdown, quantity, pricePerItem, totalQuote,
        uploadedArtwork,
    } = data;

    const artworkIsURL = uploadedArtwork && /^https?:\/\//i.test(uploadedArtwork);

    const artworkBlock = artworkIsURL
        ? `
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:rgba(184,90,54,0.10); border:1px solid rgba(184,90,54,0.30); border-radius:12px; margin-bottom:16px;">
            <tr><td style="padding:16px 20px;">
                <p style="font-family:${HEADING_FONT}; font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:${ACCENT_SOFT}; margin:0 0 6px; font-weight:700;">Free Mockup Included</p>
                <p style="font-family:${BODY_FONT}; font-size:14px; color:${TEXT}; line-height:1.6; margin:0;">We've got your file. We'll send back a free mockup so you can see exactly how it looks on the ${escapeHtml(garmentLabel)} before anything goes to production.</p>
            </td></tr>
        </table>`
        : `
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:rgba(255,255,255,0.04); border:1px solid ${SUBTLE_LINE}; border-radius:12px; margin-bottom:16px;">
            <tr><td style="padding:16px 20px;">
                <p style="font-family:${HEADING_FONT}; font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:${ACCENT_SOFT}; margin:0 0 6px; font-weight:700;">Need Help With Artwork?</p>
                <p style="font-family:${BODY_FONT}; font-size:14px; color:${TEXT}; line-height:1.6; margin:0;">Reply to this email with a sketch, a logo, or even just the idea in your head. We'll figure out the best path forward together.</p>
            </td></tr>
        </table>`;

    const sizeTable = renderSizeBreakdown(sizeBreakdown);

    const projectCard = card(`
        ${sectionLabel('Your Project')}
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            ${fieldRow('Garment', escapeHtml(garmentLabel))}
            ${selectedColor ? fieldRow('Color', `${escapeHtml(selectedColor)}${garmentShade ? ` <span style="color:${TEXT_DIM}; font-weight:500;">(${escapeHtml(garmentShade)})</span>` : ''}`) : ''}
            ${selectedLocations && selectedLocations !== 'None' ? fieldRow('Print Locations', escapeHtml(selectedLocations)) : ''}
            ${inkDetails ? fieldRow('Ink / Thread', escapeHtml(inkDetails)) : ''}
        </table>
        ${sizeTable ? `<div style="margin-top:16px;">${sizeTable}</div>` : ''}
    `);

    const pricingCard = card(`
        ${sectionLabel('Your Pricing')}
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
                <td style="padding:6px 0; font-family:${BODY_FONT}; font-size:14px; color:${TEXT_DIM};">Quantity</td>
                <td align="right" style="padding:6px 0; font-family:${HEADING_FONT}; font-size:16px; color:${TEXT}; font-weight:700;">${escapeHtml(quantity)}</td>
            </tr>
            <tr>
                <td style="padding:6px 0; font-family:${BODY_FONT}; font-size:14px; color:${TEXT_DIM};">Price Per Item</td>
                <td align="right" style="padding:6px 0; font-family:${HEADING_FONT}; font-size:16px; color:${TEXT}; font-weight:700;">${escapeHtml(formatMoney(pricePerItem))}</td>
            </tr>
            <tr><td colspan="2" style="padding:8px 0;"><div style="height:1px; background:${SUBTLE_LINE};"></div></td></tr>
            <tr>
                <td style="padding:6px 0; font-family:${HEADING_FONT}; font-size:14px; color:${TEXT}; font-weight:700; text-transform:uppercase; letter-spacing:0.08em;">Total</td>
                <td align="right" style="padding:6px 0; font-family:${HEADING_FONT}; font-size:24px; color:${ACCENT_SOFT}; font-weight:800;">${escapeHtml(formatMoney(totalQuote))}</td>
            </tr>
        </table>
    `);

    const ctaCard = card(`
        <p style="font-family:${HEADING_FONT}; font-size:18px; color:${TEXT}; margin:0 0 10px; font-weight:700;">What Happens Next</p>
        <p style="font-family:${BODY_FONT}; font-size:14px; color:${TEXT}; line-height:1.7; margin:0 0 14px;">A real person on our team is reviewing your quote right now. You'll hear back from us within one business day with your mockup, a confirmed timeline, and anything we need to lock it in.</p>
        <p style="font-family:${BODY_FONT}; font-size:14px; color:${TEXT}; line-height:1.7; margin:0;">Need it sooner? Reply to this email or call <a href="tel:${escapeHtml(SHOP_CONFIG.shop_phone)}" style="color:${ACCENT_SOFT}; text-decoration:none; font-weight:600;">${escapeHtml(SHOP_CONFIG.shop_phone)}</a>.</p>
    `);

    const intro = `
        <tr><td style="padding:0 4px 16px;">
            <p style="font-family:${HEADING_FONT}; font-size:26px; color:${TEXT}; margin:0 0 6px; font-weight:800; line-height:1.2;">Hey ${escapeHtml(name)},</p>
            <p style="font-family:${HEADING_FONT}; font-size:16px; color:${ACCENT_SOFT}; margin:0; font-weight:600;">Your Quote Is Ready.</p>
        </td></tr>
    `;

    const body = `${intro}<tr><td>${projectCard}${sizeTable ? '' : ''}${pricingCard}${artworkBlock}${ctaCard}</td></tr>`;

    return emailShell(body, `Your Local Threads quote: ${quantity} ${garmentLabel} for ${formatMoney(totalQuote)}`);
}

export function buildCustomerSubject(garmentLabel, quantity) {
    return `Your Local Threads Quote: ${quantity} ${garmentLabel}`;
}

export function buildMerchantSubject(name, garmentLabel, totalQuote) {
    return `New Quote: ${name} · ${garmentLabel} (${formatMoney(totalQuote)})`;
}
