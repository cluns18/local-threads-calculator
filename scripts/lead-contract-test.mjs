// Proves the calculator's REAL lead emails reach the LIVE send-quote function, and that the
// shop notification goes to everyone who answers Local Threads' leads.
// Builds both payloads exactly the way src/pages/FinalQuote.jsx does, from the shipped
// SHOP_CONFIG and email builders, then posts them to the live Netlify function with every
// recipient rerouted to OBG's canary inbox, so Local Threads never gets a test.
// The function sends from olivebranchgrowth@gmail.com, so no client mailbox or CRM is touched.
// Exit 1 on a wrong recipient list or anything but a 2xx with ok:true. Run before every merge:
//   npm run test:lead
import SHOP_CONFIG from '../src/config/shop.js';
import {
  buildMerchantHTML, buildCustomerHTML, buildCustomerSubject, buildMerchantSubject,
} from '../src/lib/quoteEmails.js';

// Who answers Local Threads' leads. One list for every app, the same as the quote form
// (obg-mail-api shops/localthreads.json, To Candice, Cc Ryan).
const LEAD_RECIPIENTS = ['candice@localthreadsohio.com', 'ryan@localthreadsohio.com'];
const ENDPOINT = process.env.SEND_QUOTE_URL
  || 'https://local-threads-calculator.netlify.app/.netlify/functions/send-quote';
const ORIGIN = 'https://local-threads-calculator.netlify.app';
const CANARY = 'olivebranchgrowth+canary@gmail.com';

const list = (v) => (Array.isArray(v) ? v : String(v || '').split(',')).map((s) => s.trim().toLowerCase()).filter(Boolean);
const stamp = `OBG CONTRACT TEST ${new Date().toISOString()}`;
let failed = false;
const fail = (msg) => { console.error('FAIL', msg); failed = true; };

// 1. The shop notification must reach everyone on the lead list.
const merchantTo = [...list(SHOP_CONFIG.shop_email), ...list(SHOP_CONFIG.shop_email_cc)];
for (const r of LEAD_RECIPIENTS) if (!merchantTo.includes(r)) fail(`shop notification misses ${r} (sends to ${merchantTo.join(', ') || 'nobody'})`);

// 2. Both real payloads, as FinalQuote.jsx builds them.
// Field names match the objects FinalQuote.jsx hands buildMerchantHTML and buildCustomerHTML.
const data = {
  name: stamp, email: CANARY, phone: '9705550100', company: 'Olive Branch Growth (test, ignore)',
  selectedProject: 'Screen printing', selectedGarment: 'T-Shirt', selectedModel: 'Contract test tee',
  garmentLabel: 'Contract test tee', selectedColor: 'Black', garmentShade: 'dark',
  selectedLocations: 'Front', locationColorCounts: { Front: 1 }, locationThreadCounts: {},
  inkDetails: 'Front: 1 color', sizeBreakdown: 'L x 24', quantity: 24, pricePerItem: '10.00',
  totalQuote: '240.00', uploadedArtwork: 'None', artworkDescription: 'No description provided',
  artworkByLocation: {}, submittedAtISO: new Date().toISOString(),
};
const merchant = {
  to: SHOP_CONFIG.shop_email,
  ...(SHOP_CONFIG.shop_email_cc ? { cc: SHOP_CONFIG.shop_email_cc } : {}),
  bcc: SHOP_CONFIG.shop_email_bcc,
  subject: buildMerchantSubject(stamp, 'Contract test tee', '240.00'),
  html: buildMerchantHTML(data), fromName: 'Local Threads Calculator', replyTo: CANARY,
};
const customer = {
  to: CANARY, subject: `${buildCustomerSubject('Contract test tee', 24)} | ${stamp}`,
  html: buildCustomerHTML(data), fromName: SHOP_CONFIG.shop_name, replyTo: SHOP_CONFIG.shop_email,
};

// 3. Reroute every recipient to the canary inbox and post to the live function.
const reroute = (p) => { const q = { ...p, to: CANARY }; delete q.cc; delete q.bcc; return q; };
for (const [label, payload] of [['shop notification', merchant], ['customer quote', customer]]) {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
      body: JSON.stringify(reroute(payload)),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.ok !== true) fail(`${label}: ${res.status} ${JSON.stringify(body)}`);
    else console.log(`sent ${label}, message ${body.messageId}`);
  } catch (err) { fail(`${label}: ${err.message}`); }
}

if (failed) process.exit(1);
console.log(`PASS  ${stamp}\nNow find both emails in Gmail Sent by that stamp.`);
