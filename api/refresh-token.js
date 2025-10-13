export default async function handler(req, res) {
    try {
        const { refresh_token } = req.body;

        const data = {
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            refresh_token,
            grant_type: 'refresh_token',
        };

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(data),
        });

        const tokens = await tokenRes.json();
        res.status(200).json(tokens);
    } catch (err) {
        res.status(500).json({ error: 'Token refresh failed' });
    }
}