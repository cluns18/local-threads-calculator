// Standalone test renderer: builds the merchant + customer email HTML
// using the same helpers the app uses, with a realistic test payload.
// Writes /tmp/blink_merchant_test.html and /tmp/blink_customer_test.html
// so they can be sent to Brian via gmail_send.py for review.

import { writeFileSync } from 'node:fs';
import {
    buildMerchantHTML,
    buildCustomerHTML,
    buildMerchantSubject,
    buildCustomerSubject,
} from '../src/lib/quoteEmails.js';

// Dark-garment payload (underbase = Yes path, mirrors Taylor's submission)
const merchantPayload = {
    name: 'Test Customer (Brian preview)',
    company: 'Acme Roofing Co.',
    email: 'test.customer@example.com',
    phone: '801-555-0142',
    selectedProject: 'screenPrinting',
    selectedGarment: '60/40 Blend Tee',
    selectedModel: 'NL6210',
    selectedColor: 'Heather Black',
    garmentShade: 'Dark',
    selectedLocations: 'Front Center, Back Center',
    locationColorCounts: { 'Front Center': 2, 'Back Center': 1 },
    locationThreadCounts: null,
    patchType: null,
    patchSize: null,
    sizeBreakdown: { XS: 0, S: 4, M: 8, L: 10, XL: 4, '2XL': 2, '3XL': 0 },
    quantity: 28,
    pricePerItem: '14.85',
    totalQuote: '415.80',
    uploadedArtwork: 'https://firebasestorage.googleapis.com/v0/b/local-threads-calc.firebasestorage.app/o/test%2Facme-roofing-logo.png?alt=media&token=demo',
    artworkDescription: 'White ink on front, single color back. Logo should be centered and roughly 9 inches wide on the front.',
    submittedAtISO: new Date().toISOString(),
};

const customerPayload = {
    name: 'Test Customer (Brian preview)',
    email: 'test.customer@example.com',
    garmentLabel: 'NL6210 - 60/40 Blend Tee',
    selectedColor: 'Heather Black',
    garmentShade: 'Dark',
    selectedLocations: 'Front Center, Back Center',
    inkDetails: 'Front Center: 2 colors, Back Center: 1 color',
    sizeBreakdown: { XS: 0, S: 4, M: 8, L: 10, XL: 4, '2XL': 2, '3XL': 0 },
    quantity: 28,
    pricePerItem: '14.85',
    totalQuote: '415.80',
    uploadedArtwork: 'https://firebasestorage.googleapis.com/v0/b/local-threads-calc.firebasestorage.app/o/test%2Facme-roofing-logo.png?alt=media&token=demo',
};

const merchantHTML = buildMerchantHTML(merchantPayload);
const customerHTML = buildCustomerHTML(customerPayload);

const merchantSubject = buildMerchantSubject(
    merchantPayload.name,
    merchantPayload.selectedGarment,
    merchantPayload.totalQuote
);
const customerSubject = buildCustomerSubject(customerPayload.garmentLabel, customerPayload.quantity);

writeFileSync('/tmp/blink_merchant_test.html', merchantHTML);
writeFileSync('/tmp/blink_customer_test.html', customerHTML);

console.log('MERCHANT_SUBJECT:', merchantSubject);
console.log('CUSTOMER_SUBJECT:', customerSubject);
console.log('Wrote /tmp/blink_merchant_test.html');
console.log('Wrote /tmp/blink_customer_test.html');
