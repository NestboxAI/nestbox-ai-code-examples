import { Song } from "../types/Song";
import { Ollama } from "ollama";

export const explainSongs = async (
	ollama: Ollama,
	vibe: string,
	songs: Song[]
): Promise<Song[]> => {
	const songList = songs
		.map((s, i) => `${i + 1}. "${s.title}" – ${s.artist}`)
		.join("\n");

	const prompt = `
		You are a music curator. For each of the songs below, explain in 1–2 sentences why it fits the mood: "${vibe}".

		Songs:
		${songList}

		Return exactly ${songs.length} lines. Each line must start with a number (e.g., "1. ...") and be a standalone reason. Do not include any introduction, summary, or commentary. Only the numbered reasons.
	`;

	const response = await ollama.generate({
		model: "gemma3:27b",
		prompt,
	});

	const lines = response.response
		.split("\n")
		.map(line => line.trim())
		.filter(line => /^\d+\.\s+/.test(line));

	while (lines.length < songs.length) {
		lines.push("No explanation provided.");
	}

	return songs.map((song, i) => ({
		...song,
		reason: lines[i]?.replace(/^\d+\.\s*/, "") || "No explanation provided",
	}));
};
