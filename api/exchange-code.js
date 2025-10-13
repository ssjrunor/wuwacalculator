import fetch from 'node-fetch';

export default async function handler(req, res) {
    try {
        const { code } = req.body;
        const isProd = process.env.NODE_ENV === 'production';

        const data = {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: isProd
                ? process.env.GOOGLE_REDIRECT_URI
                : 'http://localhost:5173',
            grant_type: 'authorization_code',
        };

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(data),
        });

        const tokens = await tokenRes.json();

        if (!tokenRes.ok) {
            console.error('Google token error:', tokens);
            return res.status(400).json({ error: 'Failed to exchange token', details: tokens });
        }

        const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const user = await userRes.json();

        return res.status(200).json({ ...tokens, user });
    } catch (err) {
        console.error('Token exchange failed:', err);
        return res.status(500).json({ error: 'Token exchange failed' });
    }
}