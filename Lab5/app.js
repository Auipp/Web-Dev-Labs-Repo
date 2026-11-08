const {
  useState,
  useEffect
} = React;

// Star emoji helper
function RatingEmoji({
  rating
}) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 !== 0;
  const emojis = "⭐".repeat(fullStars) + (hasHalf ? "½" : "");
  return /*#__PURE__*/React.createElement("span", {
    className: "rating-emojis",
    title: `${rating} stars`
  }, emojis);
}

// Interactive star rating picker
function StarPicker({
  value,
  onChange
}) {
  const starValues = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
  return /*#__PURE__*/React.createElement("div", {
    className: "star-picker"
  }, starValues.map(val => /*#__PURE__*/React.createElement("button", {
    key: val,
    type: "button",
    className: `star-pill ${value === val ? "active" : ""}`,
    onClick: () => onChange(val)
  }, val, " ⭐")));
}

// Minimal header
function Header({
  totalFilms,
  avgRating,
  onToggleForm,
  isFormOpen,
  onResetDefaults
}) {
  return /*#__PURE__*/React.createElement("header", {
    className: "header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "header-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "brand-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "letterboxd-dots"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot dot-orange"
  }), /*#__PURE__*/React.createElement("span", {
    className: "dot dot-green"
  }), /*#__PURE__*/React.createElement("span", {
    className: "dot dot-blue"
  })), /*#__PURE__*/React.createElement("h1", {
    className: "brand-title"
  }, "WATCHLIST")), /*#__PURE__*/React.createElement("div", {
    className: "header-actions"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stats-bar"
  }, /*#__PURE__*/React.createElement("span", {
    className: "stat-item"
  }, /*#__PURE__*/React.createElement("strong", {
    className: "stat-number"
  }, totalFilms), " FILMS"), /*#__PURE__*/React.createElement("span", {
    className: "stat-divider"
  }, "/"), /*#__PURE__*/React.createElement("span", {
    className: "stat-item"
  }, "AVG ", /*#__PURE__*/React.createElement("strong", {
    className: "stat-number"
  }, avgRating), " ⭐")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-secondary",
    onClick: onResetDefaults
  }, "Reset Defaults"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `btn ${isFormOpen ? "btn-secondary" : "btn-primary"}`,
    onClick: onToggleForm
  }, isFormOpen ? "Close" : "+ Log Film"))));
}

// Movie logging form
function MovieForm({
  onAddMovie,
  onClose
}) {
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
  return /*#__PURE__*/React.createElement("section", {
    className: "form-panel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-header"
  }, /*#__PURE__*/React.createElement("h2", null, "Log a Movie"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-close",
    onClick: onClose
  }, "×")), !selectedMovie ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("form", {
    className: "search-box",
    onSubmit: handleSearch
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "Search movie title...",
    value: query,
    onChange: e => setQuery(e.target.value),
    className: "input-text"
  }), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-primary",
    disabled: isSearching
  }, isSearching ? "Searching..." : "Search")), searchError && /*#__PURE__*/React.createElement("p", {
    className: "error-message"
  }, searchError), searchResults.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "search-dropdown"
  }, searchResults.map(m => /*#__PURE__*/React.createElement("div", {
    key: m.id,
    className: "search-item",
    onClick: () => handleSelectMovie(m)
  }, m.poster_path ? /*#__PURE__*/React.createElement("img", {
    src: m.poster_path,
    alt: m.title,
    className: "thumb-img"
  }) : /*#__PURE__*/React.createElement("div", {
    className: "thumb-placeholder"
  }, "🎬"), /*#__PURE__*/React.createElement("div", {
    className: "search-item-info"
  }, /*#__PURE__*/React.createElement("strong", null, m.title), /*#__PURE__*/React.createElement("span", {
    className: "search-item-year"
  }, "(", m.year, ")"), /*#__PURE__*/React.createElement("p", {
    className: "search-item-overview"
  }, m.overview.slice(0, 110), "...")))))) : /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSubmit,
    className: "selected-movie-form"
  }, /*#__PURE__*/React.createElement("div", {
    className: "selected-preview"
  }, selectedMovie.poster_path ? /*#__PURE__*/React.createElement("img", {
    src: selectedMovie.poster_path,
    alt: selectedMovie.title,
    className: "selected-poster"
  }) : /*#__PURE__*/React.createElement("div", {
    className: "selected-placeholder"
  }, "🎬"), /*#__PURE__*/React.createElement("div", {
    className: "selected-details"
  }, /*#__PURE__*/React.createElement("h3", null, selectedMovie.title, " ", /*#__PURE__*/React.createElement("span", {
    className: "text-muted"
  }, "(", selectedMovie.year, ")")), /*#__PURE__*/React.createElement("p", {
    className: "selected-synopsis"
  }, selectedMovie.overview), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-link",
    onClick: () => setSelectedMovie(null)
  }, "Change Movie"))), /*#__PURE__*/React.createElement("div", {
    className: "form-field"
  }, /*#__PURE__*/React.createElement("label", {
    className: "field-label"
  }, "Rating: ", /*#__PURE__*/React.createElement(RatingEmoji, {
    rating: rating
  }), " (", rating, " / 5)"), /*#__PURE__*/React.createElement(StarPicker, {
    value: rating,
    onChange: setRating
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-field"
  }, /*#__PURE__*/React.createElement("label", {
    className: "field-label"
  }, "Comment / Review:"), /*#__PURE__*/React.createElement("textarea", {
    rows: "3",
    className: "input-textarea",
    placeholder: "Write a comment...",
    value: review,
    onChange: e => setReview(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-footer"
  }, /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-primary"
  }, "Save to Watchlist"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-secondary",
    onClick: onClose
  }, "Cancel"))));
}

// Individual movie card
function MovieCard({
  movie,
  onRemove,
  onUpdateReview
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editRating, setEditRating] = useState(movie.rating);
  const [editReview, setEditReview] = useState(movie.review || "");
  const [imageError, setImageError] = useState(false);
  function handleSaveEdit(e) {
    e.preventDefault();
    onUpdateReview(movie.id, editRating, editReview.trim());
    setIsEditing(false);
  }
  return /*#__PURE__*/React.createElement("article", {
    className: "movie-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "poster-container"
  }, movie.poster_path && !imageError ? /*#__PURE__*/React.createElement("img", {
    src: movie.poster_path,
    alt: movie.title,
    className: "poster-image",
    onError: () => setImageError(true)
  }) : /*#__PURE__*/React.createElement("div", {
    className: "poster-fallback"
  }, /*#__PURE__*/React.createElement("span", {
    className: "fallback-icon"
  }, "🎬"), /*#__PURE__*/React.createElement("span", {
    className: "fallback-title"
  }, movie.title)), /*#__PURE__*/React.createElement("div", {
    className: "rating-badge"
  }, /*#__PURE__*/React.createElement(RatingEmoji, {
    rating: movie.rating
  }))), /*#__PURE__*/React.createElement("div", {
    className: "card-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "movie-meta"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "movie-title"
  }, movie.title), /*#__PURE__*/React.createElement("span", {
    className: "movie-year"
  }, movie.year)), /*#__PURE__*/React.createElement("div", {
    className: "rating-row"
  }, /*#__PURE__*/React.createElement(RatingEmoji, {
    rating: movie.rating
  }), /*#__PURE__*/React.createElement("span", {
    className: "rating-score-num"
  }, "(", movie.rating.toFixed(1), " / 5)")), isEditing ? /*#__PURE__*/React.createElement("form", {
    className: "edit-box",
    onSubmit: handleSaveEdit
  }, /*#__PURE__*/React.createElement(StarPicker, {
    value: editRating,
    onChange: setEditRating
  }), /*#__PURE__*/React.createElement("textarea", {
    rows: "2",
    className: "input-textarea input-small",
    value: editReview,
    onChange: e => setEditReview(e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    className: "edit-actions"
  }, /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-primary btn-sm"
  }, "Save"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-secondary btn-sm",
    onClick: () => setIsEditing(false)
  }, "Cancel"))) : /*#__PURE__*/React.createElement("div", {
    className: "review-box"
  }, /*#__PURE__*/React.createElement("p", {
    className: "review-text"
  }, movie.review || "No comment.")), /*#__PURE__*/React.createElement("div", {
    className: "card-actions"
  }, !isEditing && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-card-action",
    onClick: () => setIsEditing(true)
  }, "Edit"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-card-action btn-danger",
    onClick: () => onRemove(movie.id)
  }, "Remove"))));
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
    saveMovies(movies.filter(m => m.id !== id));
  }

  // Update movie review and rating
  function handleUpdateReview(id, newRating, newReview) {
    saveMovies(movies.map(m => m.id === id ? {
      ...m,
      rating: newRating,
      review: newReview
    } : m));
  }

  // Calculate average rating
  const avgRating = movies.length > 0 ? (movies.reduce((acc, m) => acc + m.rating, 0) / movies.length).toFixed(1) : "0.0";
  return /*#__PURE__*/React.createElement("div", {
    className: "app-layout"
  }, /*#__PURE__*/React.createElement(Header, {
    totalFilms: movies.length,
    avgRating: avgRating,
    isFormOpen: isFormOpen,
    onToggleForm: () => setIsFormOpen(!isFormOpen),
    onResetDefaults: loadDefaultMovies
  }), /*#__PURE__*/React.createElement("main", {
    className: "main-content"
  }, isFormOpen && /*#__PURE__*/React.createElement(MovieForm, {
    onAddMovie: handleAddMovie,
    onClose: () => setIsFormOpen(false)
  }), errorMessage && /*#__PURE__*/React.createElement("div", {
    className: "alert-bar error"
  }, errorMessage), isLoading ? /*#__PURE__*/React.createElement("div", {
    className: "loading-state"
  }, /*#__PURE__*/React.createElement("div", {
    className: "spinner"
  }), /*#__PURE__*/React.createElement("p", null, "Fetching movies from TMDB...")) : /*#__PURE__*/React.createElement("section", {
    className: "watchlist-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-header"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "section-title"
  }, "WATCHLIST LOG"), /*#__PURE__*/React.createElement("span", {
    className: "section-badge"
  }, movies.length, " Films")), movies.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement("p", null, "Your watchlist is currently empty."), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-primary",
    onClick: loadDefaultMovies
  }, "Load Default Movies")) : /*#__PURE__*/React.createElement("div", {
    className: "movie-grid"
  }, movies.map(movie => /*#__PURE__*/React.createElement(MovieCard, {
    key: movie.id,
    movie: movie,
    onRemove: handleRemoveMovie,
    onUpdateReview: handleUpdateReview
  }))))));
}

// Render root component
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(/*#__PURE__*/React.createElement(App, null));