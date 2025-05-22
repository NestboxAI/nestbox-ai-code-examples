export const getSpotifyAccessToken = async (): Promise<string> => {
	const client_id = process.env.SPOTIFY_CLIENT_ID;
	const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

	if (!client_id || !client_secret) {
		throw new Error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET");
	}

	const response = await fetch("https://accounts.spotify.com/api/token", {
		method: "POST",
		headers: {
			Authorization:
				"Basic " +
				Buffer.from(`${client_id}:${client_secret}`).toString("base64"),
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: "grant_type=client_credentials",
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Spotify token error: ${response.status} ${text}`);
	}

	const data = await response.json();
	return data.access_token;
};
