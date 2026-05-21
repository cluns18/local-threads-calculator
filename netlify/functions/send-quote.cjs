// Netlify Function: send Local Threads calc submission emails via the Gmail API.
// Ported from Blink's Vercel api/send-quote.js to run on Chris's Netlify.
//
// Required Netlify env vars (Site settings -> Environment variables):
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
//     cc: "optional@example.com",            (string or array)
//     bcc: "optional@example.com",           (string or array)
//     subject: "string",
//     html: "<html>...</html>",
//     fromName: "Local Threads" (optional),
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

function sanitizeHeader(value) {
    return String(value || '').replace(/[\r\n]+/g, ' ').trim();
}

function encodeHeader(value) {
    const s = sanitizeHeader(value);
    if (/^[\x20-\x7E]*$/.test(s)) return s;
    return `=?UTF-8?B?${Buffer.from(s, 'utf8').toString('base64')}?=`;
}

function isValidEmail(addr) {
    const s = String(addr || '');
    if (s.length > 254) return false;
    if (/[\r\n,<>]/.test(s)) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

// Accept string or array; return a comma-joined string of validated addresses.
function normalizeAddrList(input) {
    if (!input) return '';
    const arr = Array.isArray(input) ? input : String(input).split(',');
    const cleaned = arr
        .map((s) => sanitizeHeader(s))
        .filter(Boolean)
        .filter((s) => isValidEmail(s));
    return cleaned.join(', ');
}

async function sendGmail({ to, cc, bcc, subject, html, fromName, replyTo }) {
    const token = await getAccessToken();
    const fromHeader = `${encodeHeader(fromName || DEFAULT_FROM_NAME)} <${SEND_ADDRESS}>`;
    const headers = [
        `From: ${fromHeader}`,
        `To: ${to}`,
        `Subject: ${encodeHeader(subject)}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
    ];
    if (cc) headers.splice(2, 0, `Cc: ${cc}`);
    if (bcc) headers.splice(cc ? 3 : 2, 0, `Bcc: ${bcc}`);
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

exports.handler = async (event) => {
    const origin = pickCorsOrigin(event.headers?.origin || event.headers?.Origin);
    const baseHeaders = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: baseHeaders, body: '' };
    }
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers: baseHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
        const { to, cc, bcc, subject, html, fromName, replyTo } = body;

        if (!to || !subject || !html) {
            return { statusCode: 400, headers: baseHeaders, body: JSON.stringify({ error: 'Missing required fields: to, subject, html' }) };
        }
        if (!isValidEmail(sanitizeHeader(to))) {
            return { statusCode: 400, headers: baseHeaders, body: JSON.stringify({ error: 'Invalid "to" address' }) };
        }
        if (replyTo && !isValidEmail(sanitizeHeader(replyTo))) {
            return { statusCode: 400, headers: baseHeaders, body: JSON.stringify({ error: 'Invalid "replyTo" address' }) };
        }

        const result = await sendGmail({
            to: sanitizeHeader(to),
            cc: normalizeAddrList(cc),
            bcc: normalizeAddrList(bcc),
            subject: sanitizeHeader(subject),
            html,
            fromName: sanitizeHeader(fromName),
            replyTo: replyTo ? sanitizeHeader(replyTo) : undefined,
        });

        return {
            statusCode: 200,
            headers: { ...baseHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ ok: true, messageId: result.id }),
        };
    } catch (err) {
        console.error('send-quote error:', err);
        return {
            statusCode: 500,
            headers: { ...baseHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: String(err.message || err) }),
        };
    }
};
