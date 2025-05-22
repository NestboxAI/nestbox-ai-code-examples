import { useAgent, AgentContext, AgentEvents } from "@nestbox-ai/functions";
import { getSpotifyAccessToken } from "./services/getSpotifyAccessToken.js";
import { searchSongs } from "./services/searchSongs.js";
import { explainSongs } from "./services/explainSongs.js";
import { Ollama } from "ollama";

const ollama = new Ollama();

export const agent = useAgent(
	async (context: AgentContext, events: AgentEvents) => {
		try {
			const vibe = context.params.vibe?.trim();
			if (!vibe) {
				events.emitQueryCompleted({
					data: { error: "Missing 'vibe' parameter." },
				});
				return;
			}

			const vibeQueryResponse = await ollama.generate({
				model: "gemma3:27b",
				prompt: `Return a short, comma-separated list (max 5 items) of music keywords, genres, or moods to search Spotify for the vibe: "${vibe}". Do not explain.`,
			});

			let searchQuery = vibeQueryResponse.response.trim();
			if (searchQuery.length > 100) {
				searchQuery = searchQuery.split(/\s+/).slice(0, 10).join(" ");
			}

			const token = await getSpotifyAccessToken();
			const songs = await searchSongs(searchQuery, token);
			const explainedSongs = await explainSongs(ollama, vibe, songs);

			events.emitQueryCompleted({
				data: {
					title: `Playlist for: ${vibe}`,
					vibe,
					songs: explainedSongs,
				},
			});
		} catch (err: any) {
			events.emitQueryCompleted({
				data: {
					error: "Something went wrong while generating the playlist.",
					details: err.message,
				},
			});
		}
	}
);
