const { useState, useEffect } = React;

// Star emoji helper
function RatingEmoji({ rating }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 !== 0;
  const emojis = "⭐".repeat(fullStars) + (hasHalf ? "½" : "");
  return (
    <span className="rating-emojis" title={`${rating} stars`}>
      {emojis}
    </span>
  );
}

// Interactive star rating picker
function StarPicker({ value, onChange }) {
  const starValues = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

  return (
    <div className="star-picker">
      {starValues.map((val) => (
        <button
          key={val}
          type="button"
          className={`star-pill ${value === val ? "active" : ""}`}
          onClick={() => onChange(val)}
        >
          {val} ⭐
        </button>
      ))}
    </div>
  );
}

// Minimal header
function Header({ totalFilms, avgRating, onToggleForm, isFormOpen, onResetDefaults }) {
  return (
    <header className="header">
      <div className="header-container">
        <div className="brand-section">
          <div className="letterboxd-dots">
            <span className="dot dot-orange"></span>
            <span className="dot dot-green"></span>
            <span className="dot dot-blue"></span>
          </div>
          <h1 className="brand-title">WATCHLIST</h1>
        </div>

        <div className="header-actions">
          <div className="stats-bar">
            <span className="stat-item">
              <strong className="stat-number">{totalFilms}</strong> FILMS
            </span>
            <span className="stat-divider">/</span>
            <span className="stat-item">
              AVG <strong className="stat-number">{avgRating}</strong> ⭐
            </span>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onResetDefaults}
          >
            Reset Defaults
          </button>

          <button
            type="button"
            className={`btn ${isFormOpen ? "btn-secondary" : "btn-primary"}`}
            onClick={onToggleForm}
          >
            {isFormOpen ? "Close" : "+ Log Film"}
          </button>
        </div>
      </div>
    </header>
  );
}

// Movie logging form
function MovieForm({ onAddMovie, onClose }) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchError("");
    try {
      const res = await fetch(`/api/movies/search?query=${encodeURIComponent(query.trim())}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setSearchResults(data.results || []);
      if (!data.results || data.results.length === 0) {
        setSearchError("No movies found.");
      }
    } catch (err) {
      setSearchError("Search request failed.");
    } finally {
      setIsSearching(false);
    }
  }

  function handleSelectMovie(m) {
    setSelectedMovie(m);
    setSearchResults([]);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!selectedMovie) return;

    const newMovie = {
      id: `${selectedMovie.id}-${Date.now()}`,
      tmdbId: selectedMovie.id,
      title: selectedMovie.title,
      year: selectedMovie.year,
      overview: selectedMovie.overview,
      poster_path: selectedMovie.poster_path,
      rating: Number(rating),
      review: review.trim() || "Comment",
      dateAdded: new Date().toISOString()
    };

    onAddMovie(newMovie);
    setSelectedMovie(null);
    setQuery("");
    setReview("");
    setRating(5);
    onClose();
  }

  return (
    <section className="form-panel">
      <div className="form-header">
        <h2>Log a Movie</h2>
        <button type="button" className="btn-close" onClick={onClose}>
          &times;
        </button>
      </div>

      {!selectedMovie ? (
        <div>
          <form className="search-box" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search movie title..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input-text"
            />
            <button type="submit" className="btn btn-primary" disabled={isSearching}>
              {isSearching ? "Searching..." : "Search"}
            </button>
          </form>

          {searchError && <p className="error-message">{searchError}</p>}

          {searchResults.length > 0 && (
            <div className="search-dropdown">
              {searchResults.map((m) => (
                <div
                  key={m.id}
                  className="search-item"
                  onClick={() => handleSelectMovie(m)}
                >
                  {m.poster_path ? (
                    <img src={m.poster_path} alt={m.title} className="thumb-img" />
                  ) : (
                    <div className="thumb-placeholder">🎬</div>
                  )}
                  <div className="search-item-info">
                    <strong>{m.title}</strong>
                    <span className="search-item-year">({m.year})</span>
                    <p className="search-item-overview">{m.overview.slice(0, 110)}...</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="selected-movie-form">
          <div className="selected-preview">
            {selectedMovie.poster_path ? (
              <img
                src={selectedMovie.poster_path}
                alt={selectedMovie.title}
                className="selected-poster"
              />
            ) : (
              <div className="selected-placeholder">🎬</div>
            )}
            <div className="selected-details">
              <h3>
                {selectedMovie.title} <span className="text-muted">({selectedMovie.year})</span>
              </h3>
              <p className="selected-synopsis">{selectedMovie.overview}</p>
              <button
                type="button"
                className="btn-link"
                onClick={() => setSelectedMovie(null)}
              >
                Change Movie
              </button>
            </div>
          </div>

          <div className="form-field">
            <label className="field-label">
              Rating: <RatingEmoji rating={rating} /> ({rating} / 5)
            </label>
            <StarPicker value={rating} onChange={setRating} />
          </div>

          <div className="form-field">
            <label className="field-label">Comment / Review:</label>
            <textarea
              rows="3"
              className="input-textarea"
              placeholder="Write a comment..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
            />
          </div>

          <div className="form-footer">
            <button type="submit" className="btn btn-primary">
              Save to Watchlist
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

// Individual movie card
function MovieCard({ movie, onRemove, onUpdateReview }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editRating, setEditRating] = useState(movie.rating);
  const [editReview, setEditReview] = useState(movie.review || "");
  const [imageError, setImageError] = useState(false);

  function handleSaveEdit(e) {
    e.preventDefault();
    onUpdateReview(movie.id, editRating, editReview.trim());
    setIsEditing(false);
  }

  return (
    <article className="movie-card">
      <div className="poster-container">
        {movie.poster_path && !imageError ? (
          <img
            src={movie.poster_path}
            alt={movie.title}
            className="poster-image"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="poster-fallback">
            <span className="fallback-icon">🎬</span>
            <span className="fallback-title">{movie.title}</span>
          </div>
        )}
        <div className="rating-badge">
          <RatingEmoji rating={movie.rating} />
        </div>
      </div>

      <div className="card-body">
        <div className="movie-meta">
          <h3 className="movie-title">{movie.title}</h3>
          <span className="movie-year">{movie.year}</span>
        </div>

        <div className="rating-row">
          <RatingEmoji rating={movie.rating} />
          <span className="rating-score-num">({movie.rating.toFixed(1)} / 5)</span>
        </div>

        {isEditing ? (
          <form className="edit-box" onSubmit={handleSaveEdit}>
            <StarPicker value={editRating} onChange={setEditRating} />
            <textarea
              rows="2"
              className="input-textarea input-small"
              value={editReview}
              onChange={(e) => setEditReview(e.target.value)}
            />
            <div className="edit-actions">
              <button type="submit" className="btn btn-primary btn-sm">
                Save
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="review-box">
            <p className="review-text">{movie.review || "No comment."}</p>
          </div>
        )}

        <div className="card-actions">
          {!isEditing && (
            <button
              type="button"
              className="btn-card-action"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </button>
          )}
          <button
            type="button"
            className="btn-card-action btn-danger"
            onClick={() => onRemove(movie.id)}
          >
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}

// Main application component
function App() {
  const [movies, setMovies] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Load movies on mount
  useEffect(() => {
    const saved = localStorage.getItem("lab5_movies");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMovies(parsed);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        // Fall back to server defaults
      }
    }
    loadDefaultMovies();
  }, []);

  // Save to localStorage
  function saveMovies(updated) {
    setMovies(updated);
    localStorage.setItem("lab5_movies", JSON.stringify(updated));
  }

  // Fetch preloaded default test movies
  async function loadDefaultMovies() {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/movies/default");
      if (!res.ok) throw new Error("Could not load default movies");
      const data = await res.json();
      saveMovies(data.movies || []);
    } catch (err) {
      setErrorMessage("Failed to load initial movies from TMDB API.");
    } finally {
      setIsLoading(false);
    }
  }

  // Add a new movie
  function handleAddMovie(newMovie) {
    saveMovies([newMovie, ...movies]);
  }

  // Remove a movie
  function handleRemoveMovie(id) {
    saveMovies(movies.filter((m) => m.id !== id));
  }

  // Update movie review and rating
  function handleUpdateReview(id, newRating, newReview) {
    saveMovies(
      movies.map((m) =>
        m.id === id ? { ...m, rating: newRating, review: newReview } : m
      )
    );
  }

  // Calculate average rating
  const avgRating =
    movies.length > 0
      ? (movies.reduce((acc, m) => acc + m.rating, 0) / movies.length).toFixed(1)
      : "0.0";

  return (
    <div className="app-layout">
      <Header
        totalFilms={movies.length}
        avgRating={avgRating}
        isFormOpen={isFormOpen}
        onToggleForm={() => setIsFormOpen(!isFormOpen)}
        onResetDefaults={loadDefaultMovies}
      />

      <main className="main-content">
        {isFormOpen && (
          <MovieForm
            onAddMovie={handleAddMovie}
            onClose={() => setIsFormOpen(false)}
          />
        )}

        {errorMessage && (
          <div className="alert-bar error">{errorMessage}</div>
        )}

        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Fetching movies from TMDB...</p>
          </div>
        ) : (
          <section className="watchlist-section">
            <div className="section-header">
              <h2 className="section-title">WATCHLIST LOG</h2>
              <span className="section-badge">{movies.length} Films</span>
            </div>

            {movies.length === 0 ? (
              <div className="empty-state">
                <p>Your watchlist is currently empty.</p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={loadDefaultMovies}
                >
                  Load Default Movies
                </button>
              </div>
            ) : (
              <div className="movie-grid">
                {movies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onRemove={handleRemoveMovie}
                    onUpdateReview={handleUpdateReview}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

// Render root component
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
