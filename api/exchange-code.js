import fetch from 'node-fetch';

console.log('env check:', {
    id: process.env.GOOGLE_CLIENT_ID,
    secret: process.env.GOOGLE_CLIENT_SECRET ? '✅ exists' : '❌ missing',
    redirect: process.env.GOOGLE_REDIRECT_URI
});

export default async function handler(req, res) {
    try {
        const { code } = req.body;

        const data = {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI,
            grant_type: 'authorization_code',
        };

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(data),
        });

        const tokens = await tokenRes.json();

        const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const user = await userRes.json();

        res.status(200).json({ ...tokens, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Token exchange failed' });
    }
}