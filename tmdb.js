/* ========================================
   TMDB API Integration
   ======================================== */

const TMDB_CONFIG = {
    apiKey: 'b4af5099702fcbb9399acab109ee3c50', // ⚠️ Remplace par ta clé API TMDB (gratuite sur themoviedb.org)
    baseUrl: 'https://api.themoviedb.org/3',
    imageUrl: 'https://image.tmdb.org/t/p/w500',
    backdropUrl: 'https://image.tmdb.org/t/p/original',
    language: 'fr-FR'
};

// Instructions pour obtenir une clé API
console.log('%c🎬 TMDB API Integration', 'color: #00d4ff; font-size: 16px; font-weight: bold;');
console.log('%cPour activer les données TMDB:', 'color: #f72585; font-size: 12px;');
console.log('1. Crée un compte sur https://www.themoviedb.org/');
console.log('2. Va dans Paramètres > API > Créer une clé');
console.log('3. Copie ta clé API et remplace "YOUR_TMDB_API_KEY" dans tmdb.js');
console.log('%cLes films seront automatiquement enrichis avec:', 'color: #7b2cbf; font-size: 12px;');
console.log('- Notes et votes TMDB');
console.log('- Casting et réalisateur');
console.log('- Bandes-annonces YouTube');
console.log('- Films similaires');
console.log('- Mots-clés et genres');

// Cache pour éviter les appels API répétés
const TMDB_CACHE = new Map();

/* ========================================
   API Functions
   ======================================== */

/**
 * Recherche un film sur TMDB
 * @param {string} query - Titre du film à rechercher
 * @returns {Promise<Array>} - Résultats de la recherche
 */
async function searchTMDB(query) {
    if (!query || query.trim() === '') return [];
    
    const cacheKey = `search_${query}`;
    if (TMDB_CACHE.has(cacheKey)) {
        return TMDB_CACHE.get(cacheKey);
    }
    
    try {
        const response = await fetch(
            `${TMDB_CONFIG.baseUrl}/search/movie?api_key=${TMDB_CONFIG.apiKey}&query=${encodeURIComponent(query)}&language=${TMDB_CONFIG.language}&include_adult=true`
        );
        
        if (!response.ok) throw new Error('Erreur API TMDB');
        
        const data = await response.json();
        TMDB_CACHE.set(cacheKey, data.results);
        
        return data.results.slice(0, 10); // Limite à 10 résultats
    } catch (error) {
        console.error('Erreur recherche TMDB:', error);
        return [];
    }
}

/**
 * Récupère les détails d'un film
 * @param {number} movieId - ID TMDB du film
 * @returns {Promise<Object>} - Détails du film
 */
async function getMovieDetails(movieId) {
    if (!movieId) return null;
    
    const cacheKey = `details_${movieId}`;
    if (TMDB_CACHE.has(cacheKey)) {
        return TMDB_CACHE.get(cacheKey);
    }
    
    try {
        const response = await fetch(
            `${TMDB_CONFIG.baseUrl}/movie/${movieId}?api_key=${TMDB_CONFIG.apiKey}&language=${TMDB_CONFIG.language}&append_to_response=credits,videos,keywords,recommendations,similar`
        );
        
        if (!response.ok) throw new Error('Erreur API TMDB');
        
        const data = await response.json();
        TMDB_CACHE.set(cacheKey, data);
        
        return data;
    } catch (error) {
        console.error('Erreur détails film TMDB:', error);
        return null;
    }
}

/**
 * Récupère les films populaires
 * @returns {Promise<Array>} - Liste des films populaires
 */
async function getPopularMovies() {
    const cacheKey = 'popular_movies';
    if (TMDB_CACHE.has(cacheKey)) {
        return TMDB_CACHE.get(cacheKey);
    }
    
    try {
        const response = await fetch(
            `${TMDB_CONFIG.baseUrl}/movie/popular?api_key=${TMDB_CONFIG.apiKey}&language=${TMDB_CONFIG.language}&page=1`
        );
        
        if (!response.ok) throw new Error('Erreur API TMDB');
        
        const data = await response.json();
        TMDB_CACHE.set(cacheKey, data.results);
        
        return data.results;
    } catch (error) {
        console.error('Erreur films populaires TMDB:', error);
        return [];
    }
}

/**
 * Récupère les films les mieux notés
 * @returns {Promise<Array>} - Liste des films top rated
 */
async function getTopRatedMovies() {
    const cacheKey = 'top_rated_movies';
    if (TMDB_CACHE.has(cacheKey)) {
        return TMDB_CACHE.get(cacheKey);
    }
    
    try {
        const response = await fetch(
            `${TMDB_CONFIG.baseUrl}/movie/top_rated?api_key=${TMDB_CONFIG.apiKey}&language=${TMDB_CONFIG.language}&page=1`
        );
        
        if (!response.ok) throw new Error('Erreur API TMDB');
        
        const data = await response.json();
        TMDB_CACHE.set(cacheKey, data.results);
        
        return data.results;
    } catch (error) {
        console.error('Erreur films top rated TMDB:', error);
        return [];
    }
}

/**
 * Récupère les films en salle
 * @returns {Promise<Array>} - Liste des films now playing
 */
async function getNowPlayingMovies() {
    const cacheKey = 'now_playing_movies';
    if (TMDB_CACHE.has(cacheKey)) {
        return TMDB_CACHE.get(cacheKey);
    }
    
    try {
        const response = await fetch(
            `${TMDB_CONFIG.baseUrl}/movie/now_playing?api_key=${TMDB_CONFIG.apiKey}&language=${TMDB_CONFIG.language}&page=1`
        );
        
        if (!response.ok) throw new Error('Erreur API TMDB');
        
        const data = await response.json();
        TMDB_CACHE.set(cacheKey, data.results);
        
        return data.results;
    } catch (error) {
        console.error('Erreur films now playing TMDB:', error);
        return [];
    }
}

/**
 * Récupère les films à venir
 * @returns {Promise<Array>} - Liste des films upcoming
 */
async function getUpcomingMovies() {
    const cacheKey = 'upcoming_movies';
    if (TMDB_CACHE.has(cacheKey)) {
        return TMDB_CACHE.get(cacheKey);
    }
    
    try {
        const response = await fetch(
            `${TMDB_CONFIG.baseUrl}/movie/upcoming?api_key=${TMDB_CONFIG.apiKey}&language=${TMDB_CONFIG.language}&page=1`
        );
        
        if (!response.ok) throw new Error('Erreur API TMDB');
        
        const data = await response.json();
        TMDB_CACHE.set(cacheKey, data.results);
        
        return data.results;
    } catch (error) {
        console.error('Erreur films upcoming TMDB:', error);
        return [];
    }
}

/**
 * Récupère les séries TV populaires
 * @returns {Promise<Array>} - Liste des séries populaires
 */
async function getPopularTVShows() {
    const cacheKey = 'popular_tv_shows';
    if (TMDB_CACHE.has(cacheKey)) {
        return TMDB_CACHE.get(cacheKey);
    }
    
    try {
        const response = await fetch(
            `${TMDB_CONFIG.baseUrl}/tv/popular?api_key=${TMDB_CONFIG.apiKey}&language=${TMDB_CONFIG.language}&page=1`
        );
        
        if (!response.ok) throw new Error('Erreur API TMDB');
        
        const data = await response.json();
        TMDB_CACHE.set(cacheKey, data.results);
        
        return data.results;
    } catch (error) {
        console.error('Erreur séries TV populaires TMDB:', error);
        return [];
    }
}

/* ========================================
   Helper Functions
   ======================================== */

/**
 * Formate la durée en heures et minutes
 * @param {number} minutes - Durée en minutes
 * @returns {string} - Durée formatée
 */
function formatRuntime(minutes) {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins > 0 ? mins + 'm' : ''}`;
}

/**
 * Formate la note sur 10
 * @param {number} voteAverage - Note moyenne TMDB (sur 10)
 * @returns {string} - Pourcentage de recommandation
 */
function formatMatchScore(voteAverage) {
    if (!voteAverage) return 'N/A';
    const percentage = Math.round(voteAverage * 10);
    return `Recommandé à ${percentage}%`;
}

/**
 * Extrait les noms des acteurs principaux
 * @param {Array} credits - Crédits du film
 * @returns {string} - Noms des acteurs séparés par des virgules
 */
function getTopCast(credits) {
    if (!credits || !credits.cast || credits.cast.length === 0) return 'Casting inconnu';
    return credits.cast.slice(0, 5).map(actor => actor.name).join(', ');
}

/**
 * Extrait le réalisateur
 * @param {Array} credits - Crédits du film
 * @returns {string} - Nom du réalisateur
 */
function getDirector(credits) {
    if (!credits || !credits.crew || credits.crew.length === 0) return 'Inconnu';
    const director = credits.crew.find(person => person.job === 'Director');
    return director ? director.name : 'Inconnu';
}

/**
 * Récupère la bande-annonce YouTube
 * @param {Array} videos - Vidéos du film
 * @returns {string|null} - ID de la vidéo YouTube
 */
function getYouTubeTrailer(videos) {
    if (!videos || !videos.results || videos.results.length === 0) return null;
    const trailer = videos.results.find(video => 
        video.type === 'Trailer' && video.site === 'YouTube'
    );
    return trailer ? trailer.key : null;
}

/**
 * Formate la date de sortie
 * @param {string} date - Date au format YYYY-MM-DD
 * @returns {string} - Date formatée en français
 */
function formatReleaseDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function normalizeMovieTitle(title) {
    if (!title) return '';
    return title
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function buildTMDBImageUrl(path, type = 'poster') {
    if (!path) return null;
    const baseUrl = type === 'backdrop' ? TMDB_CONFIG.backdropUrl : TMDB_CONFIG.imageUrl;
    return `${baseUrl}${path}`;
}

function getBestPosterUrl(details, fallbackMovie = {}) {
    return (
        buildTMDBImageUrl(details?.poster_path, 'poster') ||
        buildTMDBImageUrl(details?.backdrop_path, 'poster') ||
        fallbackMovie.image ||
        null
    );
}

function getBestBackdropUrl(details, fallbackMovie = {}) {
    return (
        buildTMDBImageUrl(details?.backdrop_path, 'backdrop') ||
        buildTMDBImageUrl(details?.poster_path, 'backdrop') ||
        fallbackMovie.backdrop ||
        fallbackMovie.image ||
        null
    );
}

/* ========================================
   Enhanced Movie Data Integration
   ======================================== */

/**
 * Enrichit les données d'un film avec les informations TMDB
 * @param {Object} movie - Objet film actuel
 * @returns {Promise<Object>} - Film enrichi avec données TMDB
 */
async function enrichMovieData(movie) {
    if (!movie || !movie.title) return movie;

    let tmdbMovie = null;

    if (movie.tmdb_id) {
        tmdbMovie = { id: movie.tmdb_id };
    } else {
        // Recherche le film sur TMDB
        const searchResults = await searchTMDB(movie.title);

        if (!searchResults || searchResults.length === 0) {
            return movie;
        }

        // Trouve le film le plus pertinent
        const normalizedMovieTitle = normalizeMovieTitle(movie.title);
        const movieYear = parseInt(movie.year, 10);
        const scoredResults = searchResults.map(result => {
            const normalizedResultTitle = normalizeMovieTitle(result.title || result.original_title);
            const tmdbYear = result.release_date ? parseInt(result.release_date.split('-')[0], 10) : null;
            const yearScore = !movieYear || !tmdbYear ? 1 : (Math.abs(movieYear - tmdbYear) <= 1 ? 3 : 0);
            const exactTitleScore = normalizedResultTitle === normalizedMovieTitle ? 6 : 0;
            const containsTitleScore =
                normalizedResultTitle.includes(normalizedMovieTitle) || normalizedMovieTitle.includes(normalizedResultTitle)
                    ? 2
                    : 0;
            const imageScore = result.poster_path || result.backdrop_path ? 2 : 0;
            const popularityScore = Math.min((result.popularity || 0) / 100, 1);

            return {
                result,
                score: yearScore + exactTitleScore + containsTitleScore + imageScore + popularityScore
            };
        });

        tmdbMovie = scoredResults
            .sort((a, b) => b.score - a.score)
            .map(entry => entry.result)[0];
    }

    // Récupère les détails complets
    const details = await getMovieDetails(tmdbMovie.id);

    if (details) {
        return {
            ...movie,
            tmdb_id: details.id,
            imdb_id: details.imdb_id,
            note: details.vote_average ? parseFloat(details.vote_average.toFixed(1)) : movie.note,
            vote_count: details.vote_count || 0,
            runtime: details.runtime || null,
            release_date: details.release_date || movie.year,
            description: details.overview || movie.description,
            image: getBestPosterUrl(details, movie),
            backdrop: getBestBackdropUrl(details, movie),
            cast: getTopCast(details.credits),
            director: getDirector(details.credits),
            trailer: getYouTubeTrailer(details.videos),
            keywords: details.keywords?.keywords?.map(k => k.name).slice(0, 5) || [],
            recommendations: details.recommendations?.results?.slice(0, 6) || [],
            similar: details.similar?.results?.slice(0, 6) || []
        };
    }
    
    return movie;
}

/**
 * Enrichit tous les films de la bibliothèque
 * @param {Array} movies - Liste des films
 * @returns {Promise<Array>} - Liste des films enrichis
 */
async function enrichAllMovies(movies) {
    const enrichedMovies = [];
    
    for (const movie of movies) {
        try {
            const enriched = await enrichMovieData(movie);
            enrichedMovies.push(enriched);
            
            // Petite pause pour éviter de rate-limiter l'API
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            console.error(`Erreur enrichissement ${movie.title}:`, error);
            enrichedMovies.push(movie);
        }
    }
    
    return enrichedMovies;
}

/* ========================================
   Search Enhancement
   ======================================== */

/**
 * Recherche étendue avec TMDB
 * @param {string} query - Terme de recherche
 * @returns {Promise<Array>} - Résultats combinés locaux + TMDB
 */
async function enhancedSearch(query) {
    // Helper to get all movies from categorized data
    function getAllMovies() {
        if (Array.isArray(FLK_MOVIES_DATA)) {
            return FLK_MOVIES_DATA;
        }
        let allMovies = [];
        for (const genre in FLK_MOVIES_DATA) {
            if (Array.isArray(FLK_MOVIES_DATA[genre])) {
                allMovies = allMovies.concat(FLK_MOVIES_DATA[genre]);
            }
        }
        return allMovies;
    }

    const allMovies = getAllMovies();
    const localResults = allMovies.filter(movie =>
        movie.title.toLowerCase().includes(query.toLowerCase()) ||
        movie.genre.toLowerCase().includes(query.toLowerCase())
    );

    const tmdbResults = await searchTMDB(query);

    // Combine et déduplique les résultats
    const combined = [...localResults];

    tmdbResults.forEach(tmdbMovie => {
        const exists = combined.some(m => m.title === tmdbMovie.title);
        if (!exists) {
            combined.push({
                title: tmdbMovie.title,
                genre: 'Inconnu',
                year: tmdbMovie.release_date ? tmdbMovie.release_date.split('-')[0] : 'N/A',
                note: tmdbMovie.vote_average ? parseFloat(tmdbMovie.vote_average.toFixed(1)) : 0,
                image: buildTMDBImageUrl(tmdbMovie.poster_path, 'poster') || buildTMDBImageUrl(tmdbMovie.backdrop_path, 'poster'),
                description: tmdbMovie.overview || 'Aucune description disponible',
                tmdb_id: tmdbMovie.id,
                fromTMDB: true
            });
        }
    });

    return combined.slice(0, 20);
}

/* ========================================
   Auto-Initialization
   ======================================== */

// Helper to get all movies from categorized data
function getAllMoviesFromTMDB() {
    if (Array.isArray(FLK_MOVIES_DATA)) {
        return FLK_MOVIES_DATA;
    }
    let allMovies = [];
    for (const genre in FLK_MOVIES_DATA) {
        if (Array.isArray(FLK_MOVIES_DATA[genre])) {
            allMovies = allMovies.concat(FLK_MOVIES_DATA[genre]);
        }
    }
    return allMovies;
}

// Enrichit automatiquement les données au chargement
(async function initTMDB() {
    if (typeof FLK_MOVIES_DATA !== 'undefined' && TMDB_CONFIG.apiKey !== 'YOUR_TMDB_API_KEY') {
        console.log('TMDB: Initialisation...');

        // Enrichit les 5 premiers films pour commencer rapidement
        try {
            const allMovies = getAllMoviesFromTMDB();
            for (let i = 0; i < Math.min(5, allMovies.length); i++) {
                const enriched = await enrichMovieData(allMovies[i]);
                // Update the movie in the categorized structure
                for (const genre in FLK_MOVIES_DATA) {
                    const idx = FLK_MOVIES_DATA[genre].findIndex(m => m.title === allMovies[i].title);
                    if (idx !== -1) {
                        FLK_MOVIES_DATA[genre][idx] = enriched;
                        break;
                    }
                }
            }
            console.log('TMDB: Premiers films enrichis');
        } catch (error) {
            console.error('TMDB: Erreur initialisation:', error);
        }
    }
})();
