import { Song } from "../types/Song";

export const searchSongs = async (
	query: string,
	token: string
): Promise<Song[]> => {
	const res = await fetch(
		`https://api.spotify.com/v1/search?q=${encodeURIComponent(
			query
		)}&type=track&limit=15`,
		{
			headers: { Authorization: `Bearer ${token}` },
		}
	);

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Spotify search error: ${res.status} ${text}`);
	}

	const data = await res.json();
	return data.tracks.items.map((track: any) => ({
		title: track.name,
		artist: track.artists[0]?.name || "Unknown",
		url: track.external_urls.spotify,
	}));
};
