// --- User Data (Local Only) ---
let userData = {
    watchlist: [],
    likes: [],
    continueWatching: []
};

// Default avatar
const DEFAULT_AVATAR = 'https://api.dicebear.com/9.x/avataaars/svg?seed=Default';

// Helper to flatten categorized movies data
function getAllMovies() {
    if (Array.isArray(FLK_MOVIES_DATA)) {
        return FLK_MOVIES_DATA;
    }
    // If FLK_MOVIES_DATA is categorized by genre
    let allMovies = [];
    for (const genre in FLK_MOVIES_DATA) {
        if (Array.isArray(FLK_MOVIES_DATA[genre])) {
            allMovies = allMovies.concat(FLK_MOVIES_DATA[genre]);
        }
    }
    return allMovies;
}

function loadUserData() {
    try {
        const savedData = localStorage.getItem('flk_user_data_v3');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            userData = { ...userData, ...parsed };
            if (!userData.continueWatching) userData.continueWatching = [];
            if (!userData.watchlist) userData.watchlist = [];
            if (!userData.likes) userData.likes = [];
        }
    } catch (e) {
        console.warn("localStorage non disponible", e);
    }
}

function syncData() {
    try {
        localStorage.setItem('flk_user_data_v3', JSON.stringify(userData));
    } catch (e) { }
}

// --- Parental Control System ---
function getCurrentProfile() {
    try {
        const profile = localStorage.getItem('flk_current_profile');
        return profile ? JSON.parse(profile) : null;
    } catch (e) {
        return null;
    }
}

function getProfileAge() {
    const profile = getCurrentProfile();
    return profile ? (profile.age || 18) : 18;
}

function isAgeAllowed(movieAgeRating) {
    const profileAge = getProfileAge();
    
    // Parse age rating (e.g., "+13", "+16", "+18", "Tous publics")
    if (!movieAgeRating || movieAgeRating === 'Tous publics') return true;
    
    const ratingMatch = movieAgeRating.match(/\+(\d+)/);
    if (ratingMatch) {
        const minAge = parseInt(ratingMatch[1]);
        return profileAge >= minAge;
    }
    
    return true;
}

function filterMoviesByAge(movies) {
    return movies.filter(movie => {
        // Check if movie has age restriction
        const ageRating = movie.ageRating || movie.age || null;
        return isAgeAllowed(ageRating);
    });
}

function getParentalControlInfo() {
    const profile = getCurrentProfile();
    if (!profile) return null;
    
    const age = profile.age || 18;
    let maxRating, description;
    
    if (age < 13) {
        maxRating = '+13';
        description = 'Contenu adapté aux enfants (-13 ans)';
    } else if (age < 16) {
        maxRating = '+16';
        description = 'Contenu adapté aux adolescents (-16 ans)';
    } else if (age < 18) {
        maxRating = '+18';
        description = 'Contenu adapté aux jeunes adultes (-18 ans)';
    } else {
        maxRating = 'Tous publics';
        description = 'Accès à tout le contenu';
    }
    
    return { age, maxRating, description };
}

// --- Interaction UI (Like, Watchlist) ---
function toggleLike(movieTitle) {
    const index = userData.likes.indexOf(movieTitle);
    if (index === -1) {
        userData.likes.push(movieTitle);
    } else {
        userData.likes.splice(index, 1);
    }
    syncData();
    updateModalButtons(movieTitle);
}

function toggleWatchlist(movieTitle) {
    const index = userData.watchlist.indexOf(movieTitle);
    if (index === -1) {
        userData.watchlist.push(movieTitle);
    } else {
        userData.watchlist.splice(index, 1);
    }
    syncData();
    updateModalButtons(movieTitle);
}

function updateModalButtons(movieTitle) {
    const likeBtn = document.getElementById('like-btn');
    const watchBtn = document.getElementById('add-to-list-btn');
    if (!likeBtn || !watchBtn) return;

    if (userData.likes.includes(movieTitle)) {
        likeBtn.classList.add('active');
        likeBtn.querySelector('.tooltip-text').innerText = "Je n'aime plus";
    } else {
        likeBtn.classList.remove('active');
        likeBtn.querySelector('.tooltip-text').innerText = "J'aime";
    }

    if (userData.watchlist.includes(movieTitle)) {
        watchBtn.classList.add('active');
        watchBtn.querySelector('.tooltip-text').innerText = "Retirer de ma liste";
        watchBtn.querySelector('svg').innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
    } else {
        watchBtn.classList.remove('active');
        watchBtn.querySelector('.tooltip-text').innerText = "Ajouter à ma liste";
        watchBtn.querySelector('svg').innerHTML = '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>';
    }
}

function saveProgress(movieTitle) {
    const index = userData.continueWatching.indexOf(movieTitle);
    if (index !== -1) {
        userData.continueWatching.splice(index, 1);
    }
    userData.continueWatching.unshift(movieTitle);
    if (userData.continueWatching.length > 10) {
        userData.continueWatching.pop();
    }
    syncData();
    renderContinueWatching();
}

function buildPlaceholderGradient() {
    return `linear-gradient(${45 + Math.random() * 90}deg, #1a1a1c, #333, #1a1a1c)`;
}

function applyBackgroundWithFallback(element, primaryUrl, fallbackUrl, placeholder) {
    if (!element) return;

    const finalPlaceholder = placeholder || 'linear-gradient(135deg, #1a1a1c, #333, #1a1a1c)';
    const candidates = [primaryUrl, fallbackUrl].filter(Boolean);

    if (candidates.length === 0) {
        element.style.background = finalPlaceholder;
        element.style.backgroundImage = 'none';
        return;
    }

    const tryLoad = (index) => {
        if (index >= candidates.length) {
            element.style.background = finalPlaceholder;
            element.style.backgroundImage = 'none';
            return;
        }

        const img = new Image();
        img.onload = () => {
            element.style.background = '';
            element.style.backgroundImage = `url("${candidates[index]}")`;
            element.style.backgroundSize = 'cover';
            element.style.backgroundPosition = 'center center';
        };
        img.onerror = () => tryLoad(index + 1);
        img.src = candidates[index];
    };

    tryLoad(0);
}

// --- Rendering Cards ---
function createCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';

    const placeholderGradient = buildPlaceholderGradient();

    // Inject custom property for dynamic glow effect
    card.style.setProperty('--card-bg-img', movie.image ? `url('${movie.image}')` : placeholderGradient);

    card.innerHTML = `
        <div class="placeholder-img"></div>
        <div class="card-overlay">
            <h3 class="card-title">${movie.title}</h3>
            <p class="card-info">${movie.genre} • ${movie.year}</p>
        </div>
    `;

    const imageElement = card.querySelector('.placeholder-img');
    applyBackgroundWithFallback(imageElement, movie.image, movie.backdrop, placeholderGradient);

    card.addEventListener('click', () => {
        openModal(movie);
        saveProgress(movie.title);
    });
    return card;
}


// --- Specific Rows Rendering ---
function renderContinueWatching() {
    const section = document.getElementById('continue-watching-section');
    const container = document.getElementById('continue-row');
    if (!container || !section) return;

    if (userData.continueWatching.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    container.innerHTML = '';

    const allMovies = getAllMovies();
    userData.continueWatching.forEach(title => {
        const movie = allMovies.find(m => m.title === title);
        if (movie) container.appendChild(createCard(movie));
    });
    setupSliders();
}

function renderWatchlist() {
    const container = document.getElementById('watchlist-grid');
    const emptyMsg = document.getElementById('watchlist-empty');
    if (!container || !emptyMsg) return;

    container.innerHTML = '';

    if (userData.watchlist.length === 0) {
        emptyMsg.style.display = 'block';
    } else {
        emptyMsg.style.display = 'none';
        const allMovies = getAllMovies();
        userData.watchlist.forEach(title => {
            const movie = allMovies.find(m => m.title === title);
            if (movie) container.appendChild(createCard(movie));
        });
    }
}

// --- Catalogue Rendering ---
function renderCatalogue(movies) {
    const container = document.getElementById('catalogue-grid');
    const emptyMsg = document.getElementById('catalogue-empty');
    const countMsg = document.getElementById('catalogue-count');
    if (!container) return;

    container.innerHTML = '';

    if (!movies || movies.length === 0) {
        emptyMsg.style.display = 'block';
        if (countMsg) countMsg.innerText = '';
    } else {
        emptyMsg.style.display = 'none';
        movies.forEach(movie => {
            container.appendChild(createCard(movie));
        });
        if (countMsg) {
            countMsg.innerText = `${movies.length} film${movies.length > 1 ? 's' : ''} trouvé${movies.length > 1 ? 's' : ''}`;
        }
    }
}

function filterCatalogue() {
    const allMovies = getAllMovies();
    const searchTerm = document.getElementById('catalogue-search')?.value?.toLowerCase() || '';
    const selectedGenre = document.getElementById('catalogue-genre')?.value || '';
    const selectedYear = document.getElementById('catalogue-year')?.value || '';
    const sortBy = document.getElementById('catalogue-sort')?.value || 'note';

    let filtered = allMovies.filter(movie => {
        // Search filter
        const matchesSearch = !searchTerm || 
            movie.title.toLowerCase().includes(searchTerm) ||
            movie.description?.toLowerCase().includes(searchTerm);
        
        // Genre filter
        const matchesGenre = !selectedGenre || 
            movie.genre?.toLowerCase().includes(selectedGenre.toLowerCase());
        
        // Year filter
        const matchesYear = !selectedYear || movie.year === selectedYear;

        return matchesSearch && matchesGenre && matchesYear;
    });

    // Sorting
    switch (sortBy) {
        case 'note':
            filtered.sort((a, b) => (b.note || 0) - (a.note || 0));
            break;
        case 'recent':
            filtered.sort((a, b) => parseInt(b.year || 0) - parseInt(a.year || 0));
            break;
        case 'alpha':
            filtered.sort((a, b) => a.title.localeCompare(b.title));
            break;
    }

    renderCatalogue(filtered);
}

function setupCatalogueListeners() {
    const searchInput = document.getElementById('catalogue-search');
    const genreSelect = document.getElementById('catalogue-genre');
    const yearSelect = document.getElementById('catalogue-year');
    const sortSelect = document.getElementById('catalogue-sort');

    if (searchInput) {
        searchInput.addEventListener('input', filterCatalogue);
    }
    if (genreSelect) {
        genreSelect.addEventListener('change', filterCatalogue);
    }
    if (yearSelect) {
        yearSelect.addEventListener('change', filterCatalogue);
    }
    if (sortSelect) {
        sortSelect.addEventListener('change', filterCatalogue);
    }
}

function renderTop10() {
    const container = document.getElementById('top-10-row');
    if (!container) return;

    container.innerHTML = '';
    const allMovies = getAllMovies();
    const sortedMovies = [...allMovies].sort((a, b) => (b.note || 0) - (a.note || 0));

    sortedMovies.slice(0, 10).forEach((movie, index) => {
        const card = createCard(movie);
        card.classList.add('top-10-card');
        const number = document.createElement('div');
        number.className = 'rank-number';
        number.innerText = index + 1;
        card.appendChild(number);
        container.appendChild(card);
    });
}

function populateRows() {
    const trendingRow = document.getElementById('trending-row');
    const actionRow = document.getElementById('action-row');
    const horrorRow = document.getElementById('horror-row');
    const comedyRow = document.getElementById('comedy-row');
    const animationRow = document.getElementById('animation-row');
    const adventureRow = document.getElementById('adventure-row');

    const allMovies = getAllMovies();

    renderContinueWatching();
    renderTop10();

    // Trending: show first 15 movies
    const trendingMovies = allMovies.slice(0, 15);
    trendingMovies.forEach(movie => {
        if (trendingRow) trendingRow.appendChild(createCard(movie));
    });

    // Populate genre-specific rows from categorized data
    if (typeof FLK_MOVIES_DATA === 'object' && !Array.isArray(FLK_MOVIES_DATA)) {
        // Action movies
        if (FLK_MOVIES_DATA.Action && actionRow) {
            FLK_MOVIES_DATA.Action.forEach(movie => {
                actionRow.appendChild(createCard(movie));
            });
        }
        // Horror movies
        if (FLK_MOVIES_DATA.Horreur && horrorRow) {
            FLK_MOVIES_DATA.Horreur.forEach(movie => {
                horrorRow.appendChild(createCard(movie));
            });
        }
        // Comedy movies
        if (FLK_MOVIES_DATA.Comédie && comedyRow) {
            FLK_MOVIES_DATA.Comédie.forEach(movie => {
                comedyRow.appendChild(createCard(movie));
            });
        }
        // Animation movies
        if (FLK_MOVIES_DATA.Animation && animationRow) {
            FLK_MOVIES_DATA.Animation.forEach(movie => {
                animationRow.appendChild(createCard(movie));
            });
        }
        // Adventure movies: ALL movies with "aventure" in genre (superhero, Jurassic World, etc.)
        if (adventureRow) {
            const adventureMovies = allMovies.filter(m => 
                m.genre && m.genre.toLowerCase().includes('aventure')
            );
            adventureMovies.forEach(movie => {
                adventureRow.appendChild(createCard(movie));
            });
        }
    }

    setupSliders();
    initHeroCarousel();
}

// --- Sliders Logic ---
function setupSliders() {
    const wrappers = document.querySelectorAll('.slider-wrapper');
    wrappers.forEach(wrapper => {
        const container = wrapper.querySelector('.row-container');
        const leftBtn = wrapper.querySelector('.left-btn');
        const rightBtn = wrapper.querySelector('.right-btn');
        if (!container || !leftBtn || !rightBtn) return;

        // Ensure left button states correctly on resize etc.
        const updateButtons = () => {
            leftBtn.style.visibility = container.scrollLeft > 0 ? 'visible' : 'hidden';
            rightBtn.style.visibility = container.scrollLeft >= (container.scrollWidth - container.clientWidth - 10) ? 'hidden' : 'visible';
        };

        // Delay slighty to let layout process
        setTimeout(updateButtons, 100);
        container.addEventListener('scroll', updateButtons);

        leftBtn.onclick = () => {
            container.scrollBy({ left: -(container.clientWidth * 0.8), behavior: 'smooth' });
        };
        rightBtn.onclick = () => {
            container.scrollBy({ left: container.clientWidth * 0.8, behavior: 'smooth' });
        };
    });
}

// --- Hero Banner Logic ---
let heroInterval;
let currentHeroIndex = 0;

function initHeroCarousel() {
    const allMovies = getAllMovies();
    if (allMovies.length === 0) return;

    // Select top 5 best-rated movies for the hero carousel
    const topMovies = [...allMovies]
        .sort((a, b) => (b.note || 0) - (a.note || 0))
        .slice(0, 5);
    
    if (topMovies.length === 0) return;

    updateHero(topMovies[0]);

    if (heroInterval) clearInterval(heroInterval);

    heroInterval = setInterval(() => {
        // Prevent errors if the view changes
        if (document.getElementById('hero-title')) {
            currentHeroIndex = (currentHeroIndex + 1) % topMovies.length;
            updateHero(topMovies[currentHeroIndex]);
        }
    }, 10000);
}

function updateHero(movie) {
    if (!movie) return;

    const heroTitle = document.getElementById('hero-title');
    const heroDesc = document.getElementById('hero-description');
    const heroBg = document.getElementById('hero-bg');
    const heroPlayLink = document.getElementById('hero-play-link');
    const heroYear = document.getElementById('hero-year');
    const heroInfoBtn = document.getElementById('hero-info-btn');
    const heroMeta = document.getElementById('hero-meta');

    heroBg.style.opacity = '0';
    heroTitle.style.opacity = '0';
    heroDesc.style.opacity = '0';

    setTimeout(() => {
        heroTitle.innerText = movie.title;
        heroDesc.innerText = movie.description || "";

        if (movie.playLink) {
            heroPlayLink.href = "#";
            heroPlayLink.removeAttribute('target');
            heroPlayLink.onclick = (e) => {
                e.preventDefault();
                playVideo(movie.playLink);
            };
        } else {
            heroPlayLink.href = "#";
            heroPlayLink.onclick = (e) => e.preventDefault();
        }

        if (heroYear) heroYear.innerText = movie.year;

        if (heroInfoBtn) {
            heroInfoBtn.onclick = () => openModal(movie);
        }

        // Update match score with movie rating
        if (heroMeta && movie.note) {
            const matchScore = Math.round(movie.note * 10);
            const scoreEl = heroMeta.querySelector('.match-score');
            if (scoreEl) {
                scoreEl.innerText = `Recommandé à ${matchScore}%`;
            }
        }

        const placeholderGradient = 'linear-gradient(135deg, #1a1a1c, #333, #1a1a1c)';
        applyBackgroundWithFallback(heroBg, movie.backdrop, movie.image, placeholderGradient);

        heroBg.style.opacity = '1';
        heroTitle.style.opacity = '1';
        heroDesc.style.opacity = '1';

        heroTitle.style.transition = 'opacity 0.8s ease-in-out';
        heroDesc.style.transition = 'opacity 0.8s ease-in-out';
    }, 500);
}

// --- Modal Logic ---
async function openModal(movie) {
    const modal = document.getElementById('movie-modal');
    const modalBg = document.getElementById('modal-bg');

    // Enrichit avec les données TMDB si disponibles
    let enrichedMovie = movie;
    if (typeof enrichMovieData === 'function' && TMDB_CONFIG && TMDB_CONFIG.apiKey !== 'YOUR_TMDB_API_KEY') {
        try {
            enrichedMovie = await enrichMovieData(movie);
        } catch (error) {
            console.error('Erreur enrichissement TMDB:', error);
        }
    }

    // Basic info
    document.getElementById('modal-title').innerText = enrichedMovie.title;
    document.getElementById('modal-year').innerText = enrichedMovie.year;
    document.getElementById('modal-genre').innerText = enrichedMovie.genre;
    document.getElementById('modal-description').innerText = enrichedMovie.description || "Aucune description disponible.";

    // TMDB enhanced info
    if (enrichedMovie.note) {
        const matchScore = Math.round(enrichedMovie.note * 10);
        document.getElementById('modal-match-score').innerText = `Recommandé à ${matchScore}%`;
    }
    
    if (enrichedMovie.runtime) {
        document.getElementById('modal-duration').innerText = formatRuntime(enrichedMovie.runtime);
    }
    
    if (enrichedMovie.director) {
        document.getElementById('modal-director').innerText = enrichedMovie.director;
    }
    
    if (enrichedMovie.cast) {
        document.getElementById('modal-cast').innerText = enrichedMovie.cast;
    }
    
    if (enrichedMovie.vote_count) {
        document.getElementById('modal-vote-count').innerText = `${enrichedMovie.vote_count.toLocaleString()} votes sur TMDB`;
    }
    
    // Keywords
    const keywordsContainer = document.getElementById('modal-keywords-container');
    const keywordsDiv = document.getElementById('modal-keywords');
    if (enrichedMovie.keywords && enrichedMovie.keywords.length > 0) {
        keywordsContainer.style.display = 'block';
        keywordsDiv.innerHTML = enrichedMovie.keywords.map(k => 
            `<span style="background: var(--glass-bg); padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; border: 1px solid var(--glass-border);">${k}</span>`
        ).join('');
    } else {
        keywordsContainer.style.display = 'none';
    }
    
    // Trailer
    const trailerContainer = document.getElementById('modal-trailer-container');
    const trailerLink = document.getElementById('modal-trailer-link');
    if (enrichedMovie.trailer) {
        trailerContainer.style.display = 'block';
        trailerLink.href = `https://www.youtube.com/watch?v=${enrichedMovie.trailer}`;
    } else {
        trailerContainer.style.display = 'none';
    }

    // Play button
    const playBtn = document.getElementById('play-button');
    if (enrichedMovie.playLink) {
        playBtn.href = "#";
        playBtn.removeAttribute('target');
        playBtn.onclick = (e) => {
            e.preventDefault();
            playVideo(enrichedMovie.playLink);
        };
    } else {
        playBtn.href = "#";
        playBtn.onclick = (e) => e.preventDefault();
    }

    updateModalButtons(enrichedMovie.title);

    const likeBtn = document.getElementById('like-btn');
    const watchBtn = document.getElementById('add-to-list-btn');

    if (likeBtn) likeBtn.onclick = () => toggleLike(enrichedMovie.title);
    if (watchBtn) watchBtn.onclick = () => toggleWatchlist(enrichedMovie.title);

    const placeholderGradient = 'linear-gradient(135deg, #1a1a1c, #333, #1a1a1c)';
    applyBackgroundWithFallback(modalBg, enrichedMovie.backdrop, enrichedMovie.image, placeholderGradient);

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('movie-modal');
    modal.classList.remove('active');

    if (!document.getElementById('verification-overlay').classList.contains('active') && !document.getElementById('search-overlay').classList.contains('active')) {
        document.body.style.overflow = 'auto';
    }
}


// --- Setup Navigation ---
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-item[data-target]');
    const views = {
        'home-view': document.getElementById('home-view'),
        'requests-view': document.getElementById('requests-view'),
        'watchlist-view': document.getElementById('watchlist-view'),
        'catalogue-view': document.getElementById('catalogue-view')
    };

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-target');

            Object.keys(views).forEach(key => {
                if (views[key]) {
                    views[key].style.display = (key === target) ? 'block' : 'none';
                }
            });

            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.mobile-nav-item').forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            if (target === 'requests-view') {
                fetchPublicRequests();
            } else if (target === 'watchlist-view') {
                renderWatchlist();
            } else if (target === 'catalogue-view') {
                renderCatalogue(getAllMovies());
                setupCatalogueListeners();
            }

            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 10) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// Touch-friendly slider swipe gestures
function setupTouchSliders() {
    const sliders = document.querySelectorAll('.row-container');
    
    sliders.forEach(slider => {
        let touchStartX = 0;
        let touchEndX = 0;
        let scrollLeft = 0;
        let isDown = false;
        let startX;
        
        // Mouse/touch events for smooth dragging
        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            slider.style.cursor = 'grabbing';
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        });
        
        slider.addEventListener('mouseleave', () => {
            isDown = false;
            slider.style.cursor = 'grab';
        });
        
        slider.addEventListener('mouseup', () => {
            isDown = false;
            slider.style.cursor = 'grab';
        });
        
        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 2;
            slider.scrollLeft = scrollLeft - walk;
        });
        
        // Touch events for mobile
        slider.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            scrollLeft = slider.scrollLeft;
            slider.style.scrollBehavior = 'auto';
        }, { passive: true });
        
        slider.addEventListener('touchmove', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            // Allow natural scroll but enhance it
            slider.style.scrollBehavior = 'auto';
        }, { passive: true });
        
        slider.addEventListener('touchend', () => {
            slider.style.scrollBehavior = 'smooth';
            const diff = touchStartX - touchEndX;
            const threshold = 30;
            const swipeWidth = slider.clientWidth * 0.8;
            
            if (Math.abs(diff) > threshold) {
                if (diff > 0) {
                    // Swipe left - scroll right
                    slider.scrollBy({ left: swipeWidth, behavior: 'smooth' });
                } else {
                    // Swipe right - scroll left
                    slider.scrollBy({ left: -swipeWidth, behavior: 'smooth' });
                }
            }
        }, { passive: true });
    });
}

// Enhanced touch feedback with haptic feedback
function setupTouchFeedback() {
    // Only on mobile devices
    if (window.innerWidth <= 768) {
        document.querySelectorAll('.mobile-nav-item, .btn, .icon-btn, .movie-card, .mobile-menu-link, .mobile-sheet-item').forEach(el => {
            el.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.96)';
                this.style.transition = 'transform 0.1s ease';
            }, { passive: true });
            
            el.addEventListener('touchend', function() {
                this.style.transform = '';
                if (navigator.vibrate) navigator.vibrate(8);
            }, { passive: true });
        });
    }
}

// --- Requests (Mocked if local) ---
async function fetchPublicRequests() {
    try {
        const response = await fetch('api.php?action=get');
        if (response.ok) {
            const requests = await response.json();
            renderRequests(requests);
        }
    } catch (error) {
        console.log("PHP Backend not available, showing mock requests.");
        renderRequests([
            { username: "Admin", movieTitle: "Avatar 3", date: new Date().toISOString() },
            { username: "User1", movieTitle: "Inception 2", date: new Date().toISOString() }
        ]);
    }
}

function renderRequests(requests) {
    const requestsList = document.getElementById('requests-list');
    if (!requestsList) return;

    requestsList.innerHTML = '';
    const sorted = [...requests].reverse();

    sorted.forEach(req => {
        const date = new Date(req.date).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'short', year: 'numeric'
        });

        const card = document.createElement('div');
        card.className = 'request-card';
        card.innerHTML = `
            <div class="req-user">Demande de : ${req.username}</div>
            <div class="req-movie">${req.movieTitle}</div>
            <div class="req-date">Ajouté le : ${date}</div>
        `;
        requestsList.appendChild(card);
    });
}

// --- Main Init ---
let appInitialized = false;

function initApp() {
    if (appInitialized) return;

    if (typeof FLK_MOVIES_DATA === 'undefined') {
        setTimeout(initApp, 50);
        return;
    }

    const allMovies = getAllMovies();
    if (allMovies.length === 0) {
        setTimeout(initApp, 50);
        return;
    }

    console.log("FLK: Initialization started...");
    appInitialized = true;

    // --- DOM Elements Cache ---
    // Moved up to avoid TDZ (temporal dead zone) errors
    const authOverlay = document.getElementById('auth-overlay');
    const profilesOverlay = document.getElementById('profiles-overlay');
    const discordOverlay = document.getElementById('verification-overlay');
    const searchOverlay = document.getElementById('search-overlay');
    const movieModal = document.getElementById('movie-modal');

    const navLoginBtn = document.getElementById('nav-login-btn');
    const navProfileGroup = document.getElementById('nav-profile-group');

    // --- Sub-initialization steps (wrapped in try-catch to avoid blocking discord verification) ---
    try { loadUserData(); } catch (e) { console.error("FLK Init Error [loadUserData]:", e); }
    
    // Load current profile and update display
    try {
        const currentProfile = getCurrentProfile();
        if (currentProfile) {
            updateProfileDisplay(currentProfile);
            // Update avatar in navbar
            document.querySelectorAll('.profile-circle, .mobile-profile-circle').forEach(circle => {
                circle.style.backgroundImage = `url('${currentProfile.avatar}')`;
            });
            console.log(`FLK: Profile "${currentProfile.name}" loaded`);
        }
    } catch (e) { console.error("FLK Init Error [loadProfile]:", e); }
    
    try { populateRows(); } catch (e) { console.error("FLK Init Error [populateRows]:", e); }
    try { setupNavigation(); } catch (e) { console.error("FLK Init Error [setupNavigation]:", e); }
    
    // Mobile-specific initialization
    try { setupTouchSliders(); } catch (e) { console.error("FLK Init Error [setupTouchSliders]:", e); }
    try { setupTouchFeedback(); } catch (e) { console.error("FLK Init Error [setupTouchFeedback]:", e); }

    // --- Discord Verification System ---
    if (discordOverlay) {
        console.log("FLK: Attaching Discord verification listeners...");
        const verifyBtn = document.getElementById('verify-access-btn');
        const discordLink = discordOverlay.querySelector('.discord-btn');

        if (discordLink) {
            discordLink.addEventListener('click', () => {
                console.log("FLK: Discord button clicked.");
                try {
                    localStorage.setItem('discord_clicked', 'true');
                } catch (e) {
                    console.warn("FLK LocalStorage Error [discordLink]:", e);
                    // Fallback for file:// or restricted environments
                    window.lastDiscordClick = Date.now();
                }
            });
        }

        if (verifyBtn) {
            verifyBtn.addEventListener('click', () => {
                console.log("FLK: Verify button clicked.");
                let hasClickedDiscord = false;
                try {
                    hasClickedDiscord = localStorage.getItem('discord_clicked') === 'true';
                } catch (e) {
                    console.warn("FLK LocalStorage Error [verifyBtn]:", e);
                    // Fallback check
                    if (window.lastDiscordClick && (Date.now() - window.lastDiscordClick < 3600000)) {
                        hasClickedDiscord = true;
                    }
                }

                if (!hasClickedDiscord) {
                    alert("Erreur : Veuillez cliquer sur 'Rejoindre Discord' en premier.");
                    return;
                }

                if (confirm("Valider l'accès ? (Assurez-vous d'avoir complété la procédure Discord)")) {
                    console.log("FLK: Verification successful.");
                    try {
                        localStorage.setItem('flk_verified_v3', 'true');
                    } catch (e) {
                        console.warn("FLK LocalStorage Error [verifyConfirm]:", e);
                        window.isVerifiedOverride = true;
                    }
                    discordOverlay.classList.remove('active');
                    document.body.style.overflow = 'auto';
                }
            });
        }
    }

    // Modal Events
    const closeModalBtn = document.querySelector('.close-modal-netflix');
    const modalBackdrop = document.querySelector('.modal-backdrop-netflix');
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

    // Header Login Button
    if (navLoginBtn && authOverlay) {
        navLoginBtn.addEventListener('click', () => {
            localStorage.removeItem('flk_auth_skipped');
            authOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    if (navProfileGroup) {
        // Dropdown handled by CSS hover
    }


    // --- Profiles System ---
    if (profilesOverlay) {
        const profilesContainer = profilesOverlay.querySelector('.profiles-container');
        const profilesTitle = profilesOverlay.querySelector('.profiles-title');
        const profilesList = document.getElementById('profiles-list');
        const addProfileBtn = document.getElementById('add-profile-btn');
        const manageProfilesBtn = document.getElementById('manage-profiles-btn');
        const doneProfilesBtn = document.getElementById('done-profiles-btn');
        const switchProfileNav = document.getElementById('switch-profile-btn');
        const manageProfilesNav = document.getElementById('manage-profiles-nav');
        const logoutBtn = document.getElementById('logout-btn');

        let isManagementMode = false;
        let editingProfile = null;
        
        // Default profiles with age
        let profiles = [
            { id: 1, name: 'Arthur', avatar: DEFAULT_AVATAR, age: 25 }
        ];

        function getAgeRating(age) {
            if (!age || age < 13) return '+13';
            if (age < 16) return '+16';
            if (age < 18) return '+18';
            return 'Tous publics';
        }

        function renderProfiles() {
            const savedProfiles = JSON.parse(localStorage.getItem('flk_profiles') || JSON.stringify(profiles));
            profiles = savedProfiles;

            // Clear all except add button
            const items = profilesList.querySelectorAll('.profile-item:not(.add-profile)');
            items.forEach(i => i.remove());

            profiles.forEach(p => {
                const div = document.createElement('div');
                div.className = 'profile-item';
                div.innerHTML = `
                    <div class="profile-avatar-box" style="background-image: url('${p.avatar}')"></div>
                    <span class="profile-name">${p.name}</span>
                    <span class="profile-age">${getAgeRating(p.age)}</span>
                `;
                div.onclick = () => {
                    if (isManagementMode) {
                        editProfile(p);
                    } else {
                        selectProfile(p);
                    }
                };
                profilesList.insertBefore(div, addProfileBtn);
            });

            profilesTitle.innerText = isManagementMode ? "Gérer les profils" : "Qui regarde ?";
        }

        function selectProfile(p) {
            localStorage.setItem('flk_current_profile', JSON.stringify(p));
            profilesOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';

            // Update avatars in navbar and mobile
            document.querySelectorAll('.profile-circle, .mobile-profile-circle').forEach(circle => {
                circle.style.backgroundImage = `url('${p.avatar}')`;
            });
            
            // Update profile info display
            updateProfileDisplay(p);
        }
        
        function updateProfileDisplay(profile) {
            const profileGroup = document.getElementById('nav-profile-group');
            if (profileGroup) {
                const avatarBox = profileGroup.querySelector('.profile-circle');
                if (avatarBox) {
                    avatarBox.style.backgroundImage = `url('${profile.avatar}')`;
                }
            }

            // Update dropdown menu with profile info
            const dropdown = document.querySelector('.profile-dropdown ul');
            if (dropdown) {
                // Remove existing profile info if present
                const existingInfo = dropdown.querySelector('.profile-info-display');
                if (existingInfo) existingInfo.remove();

                // Create profile info display
                const profileInfo = document.createElement('li');
                profileInfo.className = 'profile-info-display';
                profileInfo.style.cssText = `
                    padding: 12px 16px;
                    border-bottom: 1px solid var(--glass-border);
                    margin-bottom: 8px;
                `;
                profileInfo.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                        <div class="profile-circle" style="background-image: url('${profile.avatar}'); width: 48px; height: 48px; background-size: cover; background-position: center; border-radius: 50%;"></div>
                        <div>
                            <div style="font-weight: 600; color: var(--text-primary);">${profile.name}</div>
                            <div style="font-size: 0.75rem; color: var(--text-tertiary);">${getParentalControlInfo()?.description || 'Profil'}</div>
                        </div>
                    </div>
                `;

                const firstItem = dropdown.querySelector('li');
                if (firstItem) {
                    dropdown.insertBefore(profileInfo, firstItem);
                } else {
                    dropdown.appendChild(profileInfo);
                }
            }
        }

        function selectAvatar(profile, avatarUrl) {
            profile.avatar = avatarUrl;
            saveProfiles();
            renderProfiles();
            document.body.style.overflow = 'auto';
        }

        function editProfile(p) {
            const action = prompt(
                `Modifier le profil "${p.name}" :\n\n` +
                `Tapez le nouveau nom pour modifier le nom,\n` +
                `Tapez l'âge (ex: 25) pour modifier l'âge,\n` +
                `Tapez "supprimer" pour supprimer le profil.`
            );

            if (action === null) return; // Cancelled

            if (action.toLowerCase() === 'supprimer') {
                if (confirm(`Voulez-vous vraiment supprimer le profil "${p.name}" ?`)) {
                    profiles = profiles.filter(item => item.id !== p.id);
                    saveProfiles();
                    renderProfiles();
                }
            } else if (!isNaN(parseInt(action))) {
                // Age input
                const age = parseInt(action);
                if (age >= 3 && age <= 120) {
                    p.age = age;
                    saveProfiles();
                    renderProfiles();
                } else {
                    alert('Veuillez entrer un âge valide (entre 3 et 120 ans)');
                }
            } else {
                // Name input
                if (action.trim().length > 0) {
                    p.name = action.trim();
                    saveProfiles();
                    renderProfiles();
                }
            }
        }
        
        function saveProfiles() {
            localStorage.setItem('flk_profiles', JSON.stringify(profiles));
        }

        if (manageProfilesBtn) {
            manageProfilesBtn.addEventListener('click', () => {
                isManagementMode = true;
                profilesContainer.classList.add('manage-mode');
                renderProfiles();
            });
        }

        if (doneProfilesBtn) {
            doneProfilesBtn.addEventListener('click', () => {
                isManagementMode = false;
                profilesContainer.classList.remove('manage-mode');
                profilesOverlay.classList.remove('active');
                document.body.style.overflow = 'auto';
                renderProfiles();
            });
        }

        if (switchProfileNav) {
            switchProfileNav.addEventListener('click', () => {
                isManagementMode = false;
                profilesContainer.classList.remove('manage-mode');
                renderProfiles();
                profilesOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        }

        if (manageProfilesNav) {
            manageProfilesNav.addEventListener('click', () => {
                isManagementMode = true;
                profilesContainer.classList.add('manage-mode');
                renderProfiles();
                profilesOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('flk_user');
                localStorage.removeItem('flk_auth_skipped');
                localStorage.removeItem('flk_current_profile');
                location.reload();
            });
        }

        if (addProfileBtn) {
            addProfileBtn.addEventListener('click', () => {
                const name = prompt("Nom du nouveau profil :");
                if (name && name.trim()) {
                    const ageInput = prompt("Âge du profil (optionnel, appuyez sur Entrée pour passer) :");
                    let age = 18; // default
                    if (ageInput && ageInput.trim()) {
                        age = parseInt(ageInput);
                        if (isNaN(age) || age < 3 || age > 120) {
                            age = 18;
                        }
                    }
                    
                    const newP = {
                        id: Date.now(),
                        name: name.trim(),
                        avatar: DEFAULT_AVATAR,
                        age: age
                    };
                    profiles.push(newP);
                    saveProfiles();
                    renderProfiles();
                }
            });
        }

        // --- Mobile Profile Bottom Sheet ---
        const mobileProfileBtn = document.getElementById('mobile-profile-btn');
        const mobileSheet = document.getElementById('mobile-profile-sheet');
        const sheetLoggedIn = document.getElementById('mobile-sheet-logged-in');
        const sheetLoggedOut = document.getElementById('mobile-sheet-logged-out');
        const sheetUsername = document.getElementById('mobile-sheet-username');

        function openMobileSheet() {
            if (!sheetLoggedIn || !sheetLoggedOut) return;
            const userRaw = localStorage.getItem('flk_user');
            const skipped = localStorage.getItem('flk_auth_skipped');
            const isLoggedIn = userRaw || skipped;

            if (isLoggedIn) {
                sheetLoggedIn.style.display = 'block';
                sheetLoggedOut.style.display = 'none';
                if (userRaw) {
                    try {
                        const u = JSON.parse(userRaw);
                        if (sheetUsername) sheetUsername.textContent = 'Connecté en tant que : ' + (u.email || 'utilisateur');
                    } catch (e) { if (sheetUsername) sheetUsername.textContent = 'Connecté'; }
                } else {
                    if (sheetUsername) sheetUsername.textContent = 'Navigation sans compte';
                }
            } else {
                sheetLoggedIn.style.display = 'none';
                sheetLoggedOut.style.display = 'block';
            }

            mobileSheet.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeMobileSheet() {
            mobileSheet.classList.remove('active');
            document.body.style.overflow = 'auto';
        }

        if (mobileProfileBtn) {
            mobileProfileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                openMobileSheet();
            });
        }

        // Close when clicking backdrop
        if (mobileSheet) {
            mobileSheet.addEventListener('click', (e) => {
                if (e.target === mobileSheet) closeMobileSheet();
            });
        }

        // Sheet: Switch profile
        const sheetSwitch = document.getElementById('mobile-sheet-switch');
        if (sheetSwitch) {
            sheetSwitch.addEventListener('click', () => {
                closeMobileSheet();
                isManagementMode = false;
                profilesContainer.classList.remove('manage-mode');
                renderProfiles();
                profilesOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        }

        // Sheet: Manage profiles
        const sheetManage = document.getElementById('mobile-sheet-manage');
        if (sheetManage) {
            sheetManage.addEventListener('click', () => {
                closeMobileSheet();
                isManagementMode = true;
                profilesContainer.classList.add('manage-mode');
                renderProfiles();
                profilesOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        }

        // Sheet: Logout
        const sheetLogout = document.getElementById('mobile-sheet-logout');
        if (sheetLogout) {
            sheetLogout.addEventListener('click', () => {
                closeMobileSheet();
                localStorage.removeItem('flk_user');
                localStorage.removeItem('flk_auth_skipped');
                localStorage.removeItem('flk_current_profile');
                location.reload();
            });
        }

        // Sheet: Login
        const sheetLogin = document.getElementById('mobile-sheet-login');
        if (sheetLogin) {
            sheetLogin.addEventListener('click', () => {
                closeMobileSheet();
                const authOverlay = document.getElementById('auth-overlay');
                if (authOverlay) {
                    authOverlay.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            });
        }
    }

    // --- Authentication System ---
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    const toRegisterBtn = document.getElementById('to-register');
    const toLoginBtn = document.getElementById('to-login');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');

    function checkAuth() {
        // Check if user is logged in or if they chose to skip
        let currentUser = null;
        let isSkipped = false;
        try {
            currentUser = JSON.parse(localStorage.getItem('flk_user'));
            isSkipped = localStorage.getItem('flk_auth_skipped') === 'true';
        } catch (e) { }

        if (!currentUser && !isSkipped) {
            authOverlay.classList.add('active');
            profilesOverlay.classList.remove('active');
            document.body.style.overflow = 'hidden';
            if (discordOverlay) discordOverlay.classList.remove('active'); // Hide discord verification if auth is shown

            if (navLoginBtn) navLoginBtn.style.display = 'block';
            if (navProfileGroup) navProfileGroup.style.display = 'none';
        } else {
            authOverlay.classList.remove('active');

            if (currentUser) {
                if (navLoginBtn) navLoginBtn.style.display = 'none';
                if (navProfileGroup) navProfileGroup.style.display = 'flex';

                // Check for profile selection
                const currentProfile = localStorage.getItem('flk_current_profile');
                if (!currentProfile) {
                    renderProfiles();
                    profilesOverlay.classList.add('active');
                    document.body.style.overflow = 'hidden';
                } else {
                    selectProfile(JSON.parse(currentProfile));
                }
            } else {
                // Skipped mode
                if (navLoginBtn) navLoginBtn.style.display = 'block';
                if (navProfileGroup) navProfileGroup.style.display = 'none';
                profilesOverlay.classList.remove('active');
            }

            // If we have discord verification overlay, we show it after auth
            if (discordOverlay && !localStorage.getItem('flk_verified_v3')) {
                discordOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = 'auto';
            }
        }
    }

    function skipAuth() {
        localStorage.setItem('flk_auth_skipped', 'true');
        checkAuth();
    }

    const skipLoginBtn = document.getElementById('skip-auth-login');
    const skipRegisterBtn = document.getElementById('skip-auth-register');

    if (skipLoginBtn) skipLoginBtn.addEventListener('click', skipAuth);
    if (skipRegisterBtn) skipRegisterBtn.addEventListener('click', skipAuth);

    // Toggle Views
    if (toRegisterBtn) {
        toRegisterBtn.addEventListener('click', () => {
            loginView.style.display = 'none';
            registerView.style.display = 'block';
            registerError.style.display = 'none';
        });
    }

    if (toLoginBtn) {
        toLoginBtn.addEventListener('click', () => {
            registerView.style.display = 'none';
            loginView.style.display = 'block';
            loginError.style.display = 'none';
        });
    }

    async function handleAuth(action, email, password, errorElement) {
        errorElement.style.display = 'none';

        try {
            const response = await fetch(`auth.php?action=${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    if (action === 'login') {
                        localStorage.setItem('flk_user', JSON.stringify(result.user));
                        checkAuth();
                    } else if (action === 'register') {
                        alert("Compte créé avec succès ! Connectez-vous maintenant.");
                        toLoginBtn.click();
                    }
                } else {
                    errorElement.innerText = result.message || "Erreur d'authentification.";
                    errorElement.style.display = 'block';
                }
            } else {
                throw new Error("Erreur serveur");
            }
        } catch (error) {
            console.error(error);
            // Local Fallback System (if PHP is not running / opening local file)
            if (action === 'register') {
                const simulatedDb = JSON.parse(localStorage.getItem('flk_mock_users') || '[]');
                if (simulatedDb.find(u => u.email === email)) {
                    errorElement.innerText = "Simulé : Cet email existe déjà.";
                    errorElement.style.display = 'block';
                    return;
                }
                simulatedDb.push({ id: Date.now(), email, password }); // Password plain text ONLY for mock local fallback
                localStorage.setItem('flk_mock_users', JSON.stringify(simulatedDb));
                alert("Simulé en local : Compte créé avec succès ! Connectez-vous.");
                toLoginBtn.click();
            } else if (action === 'login') {
                const simulatedDb = JSON.parse(localStorage.getItem('flk_mock_users') || '[]');
                const user = simulatedDb.find(u => u.email === email && u.password === password);
                if (user) {
                    localStorage.setItem('flk_user', JSON.stringify({ id: user.id, email: user.email }));
                    checkAuth();
                } else {
                    errorElement.innerText = "Simulé : Email ou mot de passe incorrect.";
                    errorElement.style.display = 'block';
                }
            }
        }
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;
            handleAuth('login', email, pass, loginError);
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('register-email').value;
            const pass = document.getElementById('register-password').value;
            handleAuth('register', email, pass, registerError);
        });
    }

    // Call checkAuth on init
    checkAuth();

    // Search Events
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const searchEmpty = document.getElementById('search-empty');
    const openSearchBtns = document.querySelectorAll('.search-btn, .search-btn-mobile');
    const closeSearchBtn = document.querySelector('.close-search');

    function openSearch() {
        searchOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        setTimeout(() => searchInput.focus(), 300);
    }

    function closeSearch() {
        searchOverlay.classList.remove('active');
        if (!movieModal.classList.contains('active') && (!discordOverlay || !discordOverlay.classList.contains('active'))) {
            document.body.style.overflow = 'auto';
        }
        searchInput.value = '';
        searchResults.innerHTML = '';
        if (searchEmpty) searchEmpty.style.display = 'none';
    }

    openSearchBtns.forEach(btn => btn.addEventListener('click', openSearch));
    if (closeSearchBtn) closeSearchBtn.addEventListener('click', closeSearch);

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            searchResults.innerHTML = '';

            if (query.length < 2) {
                searchEmpty.style.display = 'none';
                return;
            }

            const allMovies = getAllMovies();
            const filteredMovies = allMovies.filter(movie =>
                movie.title.toLowerCase().includes(query) ||
                movie.genre.toLowerCase().includes(query)
            );

            if (filteredMovies.length > 0) {
                searchEmpty.style.display = 'none';
                filteredMovies.forEach(movie => {
                    searchResults.appendChild(createCard(movie));
                });
            } else {
                searchEmpty.style.display = 'block';
            }
        });
    }

    // Requests Form logic
    const requestForm = document.getElementById('movie-request-form');
    if (requestForm) {
        requestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('request-username').value;
            const movieTitle = document.getElementById('request-movie-title').value;

            try {
                const response = await fetch('api.php?action=add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, movieTitle })
                });

                if (response.ok) {
                    alert("Demande enregistrée.");
                    requestForm.reset();
                    fetchPublicRequests();
                }
            } catch (error) {
                alert("Simulé : Demande enregistrée localement.");
                requestForm.reset();
                fetchPublicRequests();
            }
        });
    }
}

// --- Video Player Logic ---
function playVideo(url) {
    const overlay = document.getElementById('video-player-overlay');
    const iframe = document.getElementById('video-iframe');
    if (!overlay || !iframe) return;
    
    iframe.src = url;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeVideo() {
    const overlay = document.getElementById('video-player-overlay');
    const iframe = document.getElementById('video-iframe');
    if (!overlay || !iframe) return;
    
    overlay.classList.remove('active');
    iframe.src = ""; // Stop video playback
    
    // Only restore scroll if no other modals are active
    const modalActive = document.getElementById('movie-modal')?.classList.contains('active');
    const searchActive = document.getElementById('search-overlay')?.classList.contains('active');
    const authActive = document.getElementById('auth-overlay')?.classList.contains('active');
    const verificationActive = document.getElementById('verification-overlay')?.classList.contains('active');
    const profilesActive = document.getElementById('profiles-overlay')?.classList.contains('active');
    
    if (!modalActive && !searchActive && !authActive && !verificationActive && !profilesActive) {
        document.body.style.overflow = 'auto';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('video-player-overlay');
    const closeBtn = document.getElementById('close-video-btn');

    if (overlay) {
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                closeVideo();
            }
        });
    }

    if (closeBtn) {
        ['click', 'touchstart', 'pointerup'].forEach((eventName) => {
            closeBtn.addEventListener(eventName, (event) => {
                event.preventDefault();
                event.stopPropagation();
                closeVideo();
            }, { passive: false });
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeVideo();
        }
    });
});

// End of file (removed TV mode)
// End of file (removed TV mode)

document.addEventListener('DOMContentLoaded', initApp);
window.addEventListener('load', initApp);
