// Vercel serverless function: send Local Threads calc submission emails
// via the Gmail API. Replaces the old EmailJS browser-side flow.
//
// Required Vercel env vars (set in Vercel project → Settings → Environment Variables):
//   GOOGLE_OAUTH_CLIENT_ID
//   GOOGLE_OAUTH_CLIENT_SECRET
//   GOOGLE_OAUTH_REFRESH_TOKEN
//
// Optional:
//   ALLOWED_ORIGIN  (comma-separated allowlist; if unset, defaults to *)
//
// Request body (POST JSON):
//   {
//     to: "recipient@example.com",
//     subject: "string",
//     html: "<html>...</html>",
//     fromName: "Local Threads" (optional, defaults to "Local Threads"),
//     replyTo: "reply@example.com" (optional)
//   }

const GOOGLE_OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID || '';
const GOOGLE_OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';
const GOOGLE_OAUTH_REFRESH_TOKEN = process.env.GOOGLE_OAUTH_REFRESH_TOKEN || '';

const SEND_ADDRESS = 'olivebranchgrowth@gmail.com';
const DEFAULT_FROM_NAME = 'Local Threads';

let cachedAccessToken = null;
let cachedAccessTokenExpiresAt = 0;

async function getAccessToken() {
    if (cachedAccessToken && Date.now() < cachedAccessTokenExpiresAt - 60_000) return cachedAccessToken;
    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: GOOGLE_OAUTH_CLIENT_ID,
            client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
            refresh_token: GOOGLE_OAUTH_REFRESH_TOKEN,
            grant_type: 'refresh_token',
        }).toString(),
    });
    if (!res.ok) throw new Error(`OAuth refresh failed (${res.status}): ${await res.text()}`);
    const data = await res.json();
    cachedAccessToken = data.access_token;
    cachedAccessTokenExpiresAt = Date.now() + data.expires_in * 1000;
    return cachedAccessToken;
}

// Strip CR/LF (header injection vectors) from any single-line header value.
function sanitizeHeader(value) {
    return String(value || '').replace(/[\r\n]+/g, ' ').trim();
}

// Encode any non-ASCII characters in a header value per RFC 2047.
function encodeHeader(value) {
    const s = sanitizeHeader(value);
    if (/^[\x20-\x7E]*$/.test(s)) return s;
    return `=?UTF-8?B?${Buffer.from(s, 'utf8').toString('base64')}?=`;
}

// Email address validator. Strict enough to refuse anything with
// header-injection chars while still allowing typical valid addresses.
function isValidEmail(addr) {
    const s = String(addr || '');
    if (s.length > 254) return false;
    if (/[\r\n,<>]/.test(s)) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

async function sendGmail({ to, subject, html, fromName, replyTo }) {
    const token = await getAccessToken();
    const fromHeader = `${encodeHeader(fromName || DEFAULT_FROM_NAME)} <${SEND_ADDRESS}>`;
    const headers = [
        `From: ${fromHeader}`,
        `To: ${to}`,
        `Subject: ${encodeHeader(subject)}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
    ];
    if (replyTo) headers.push(`Reply-To: ${replyTo}`);
    const message = headers.join('\r\n') + '\r\n\r\n' + (html || '');
    const raw = Buffer.from(message, 'utf8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw }),
    });
    if (!res.ok) throw new Error(`Gmail send failed (${res.status}): ${await res.text()}`);
    return res.json();
}

function pickCorsOrigin(reqOrigin) {
    const allowed = (process.env.ALLOWED_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (allowed.length === 0) return '*';
    if (reqOrigin && allowed.includes(reqOrigin)) return reqOrigin;
    return allowed[0];
}

export default async function handler(req, res) {
    const origin = pickCorsOrigin(req.headers?.origin);
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
        const { to, subject, html, fromName, replyTo } = body;

        if (!to || !subject || !html) {
            res.status(400).json({ error: 'Missing required fields: to, subject, html' });
            return;
        }
        if (!isValidEmail(to)) {
            res.status(400).json({ error: 'Invalid "to" address' });
            return;
        }
        if (replyTo && !isValidEmail(replyTo)) {
            res.status(400).json({ error: 'Invalid "replyTo" address' });
            return;
        }

        const result = await sendGmail({
            to: sanitizeHeader(to),
            subject: sanitizeHeader(subject),
            html,
            fromName: sanitizeHeader(fromName),
            replyTo: replyTo ? sanitizeHeader(replyTo) : undefined,
        });
        res.status(200).json({ ok: true, messageId: result.id });
    } catch (err) {
        console.error('send-quote error:', err);
        res.status(500).json({ error: String(err.message || err) });
    }
}
