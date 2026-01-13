export interface OMDbResponse {
    Title: string;
    Year: string;
    Rated: string;
    Released: string;
    Runtime: string;
    Genre: string;
    Director: string;
    Writer: string;
    Actors: string;
    Plot: string;
    Language: string;
    Country: string;
    Awards: string;
    Poster: string;
    Ratings: { Source: string; Value: string }[];
    Metascore: string;
    imdbRating: string;
    imdbVotes: string;
    imdbID: string;
    Type: string;
    totalSeasons?: string;
    Response: string;
    Error?: string;
}

const OMDB_API_KEY = "9a761ab6";
const BASE_URL = "https://www.omdbapi.com/";

export async function fetchOmdbData(imdbId: string): Promise<OMDbResponse | null> {
    if (!imdbId) return null;

    try {
        const response = await fetch(`${BASE_URL}?i=${imdbId}&apikey=${OMDB_API_KEY}`);
        const data = await response.json();

        if (data.Response === "False") {
            console.warn("OMDb API Error:", data.Error);
            return null;
        }

        return data as OMDbResponse;
    } catch (error) {
        console.error("Failed to fetch OMDb data:", error);
        return null;
    }
}
