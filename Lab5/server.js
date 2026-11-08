// Server for Movie Watchlist with TMDB API proxy
require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Search movies via TMDB API
app.get("/api/movies/search", async (req, res) => {
  const query = req.query.query;
  if (!query || !query.trim()) {
    return res.status(400).json({ error: "Search query is required" });
  }

  if (!TMDB_API_KEY || TMDB_API_KEY === "your_tmdb_api_key_here") {
    return res.status(500).json({ error: "TMDB API key is not configured" });
  }

  try {
    const encoded = encodeURIComponent(query.trim());
    const tmdbUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encoded}&include_adult=false`;
    const response = await fetch(tmdbUrl);

    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch from TMDB API" });
    }

    const data = await response.json();
    const results = (data.results || []).map((m) => ({
      id: m.id,
      title: m.title,
      release_date: m.release_date || "",
      year: m.release_date ? m.release_date.slice(0, 4) : "N/A",
      overview: m.overview || "No description available.",
      poster_path: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
      vote_average: m.vote_average || 0
    }));

    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: "Internal server error while searching movies" });
  }
});

// Preloaded default test movies
app.get("/api/movies/default", async (req, res) => {
  if (!TMDB_API_KEY || TMDB_API_KEY === "your_tmdb_api_key_here") {
    return res.status(500).json({ error: "TMDB API key is not configured" });
  }

  const defaultList = [
    {
      query: "Manchester by the Sea",
      rating: 5,
      review: "Comment #1"
    },
    {
      query: "The Secret Life of Walter Mitty",
      rating: 5,
      review: "Comment #2"
    },
    {
      query: "Easy A",
      rating: 3.5,
      review: "Comment #3"
    },
    {
      query: "Lost in Translation",
      rating: 4,
      review: "Comment #4"
    }
  ];

  try {
    const movies = await Promise.all(
      defaultList.map(async (item) => {
        const encoded = encodeURIComponent(item.query);
        const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encoded}`;
        const resp = await fetch(url);
        if (!resp.ok) return null;
        const data = await resp.json();
        const top = (data.results || [])[0];
        if (!top) return null;
        return {
          id: top.id,
          title: top.title,
          year: top.release_date ? top.release_date.slice(0, 4) : "N/A",
          overview: top.overview || "",
          poster_path: top.poster_path ? `https://image.tmdb.org/t/p/w500${top.poster_path}` : null,
          rating: item.rating,
          review: item.review,
          dateAdded: new Date().toISOString()
        };
      })
    );

    res.json({ movies: movies.filter(Boolean) });
  } catch (err) {
    res.status(500).json({ error: "Failed to preload default movies" });
  }
});

// Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "page.html"));
});

app.listen(PORT, () => {
  console.log(`Movie Watchlist server running at http://localhost:${PORT}`);
});
