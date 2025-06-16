class EpisodesPage {
    constructor() {
        this.api = new RickAndMortyAPI();
        this.currentPage = 1;
        this.currentFilters = {};
        this.isLoading = false;
        this.hasMorePages = true;
        this.episodes = [];

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showInitialLoader();
        this.loadEpisodes();
    }

    setupEventListeners() {
        const searchInput = document.getElementById('search');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    const searchValue = e.target.value;
                    this.handleSearch(searchValue);
                }, 500);
            });
        }

        const loadMoreBtn = document.querySelector('.load-more__button');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadMoreEpisodes();
            });
        }
    }

    handleSearch(searchValue) {
        if (searchValue.match(/^S\d{2}E\d{2}$/i)) {
            this.currentFilters.episode = searchValue;
            delete this.currentFilters.name;
        } else if (searchValue.match(/^S\d{2}$/i)) {
            this.currentFilters.episode = searchValue;
            delete this.currentFilters.name;
        } else {
            this.currentFilters.name = searchValue;
            delete this.currentFilters.episode;
        }

        this.resetAndSearch();
    }

    async loadEpisodes() {
        if (this.isLoading || !this.hasMorePages) return;

        this.isLoading = true;
        if (this.currentPage === 1) {
            this.showInitialLoader();
        } else {
            this.showLoadingState();
        }

        try {
            const data = await this.api.getEpisodes(this.currentPage, this.currentFilters);

            if (this.currentPage === 1) {
                this.episodes = data.results;
                this.clearEpisodeContainer();
                this.hideInitialLoader();
            } else {
                this.episodes.push(...data.results);
            }

            if (data.results.length === 0) {
                this.showNoResultsState();
            } else {
                this.renderEpisodes(data.results);
            }

            this.updatePaginationInfo(data.info);

        } catch (error) {
            console.error('Error loading episodes:', error);
            this.hideInitialLoader();
            this.showErrorState();
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    async loadMoreEpisodes() {
        if (this.hasMorePages) {
            this.currentPage++;
            await this.loadEpisodes();
        }
    }

    async resetAndSearch() {
        this.currentPage = 1;
        this.hasMorePages = true;
        await this.loadEpisodes();
    }

    renderEpisodes(episodes) {
        const container = document.querySelector('.main__content');
        if (!container) return;

        const newCards = [];
        episodes.forEach(episode => {
            const episodeCard = this.createEpisodeCard(episode);
            container.appendChild(episodeCard);
            newCards.push(episodeCard);
        });

        GhostLoaderUtils.staggerCardAnimation(newCards);
    }

    createEpisodeCard(episode) {
        const card = document.createElement('div');
        card.className = 'episode__card';
        card.innerHTML = `
            <div class="episode-card__content">
                <p class="episode-card__title">${episode.name}</p>
                <p class="episode-card__desc">${episode.air_date}</p>
                <p class="episode-card__index">${episode.episode}</p>
            </div>
        `;

        card.addEventListener('click', () => {
            console.log('Episode clicked:', episode);
            // TODO: Navigate to episode details page
            window.location.href = `episode.html?id=${episode.id}`;
        });

        return card;
    }

    clearEpisodeContainer() {
        const container = document.querySelector('.main__content');
        if (container) {
            container.innerHTML = '';
        }
    }

    updatePaginationInfo(info) {
        this.hasMorePages = !!info.next;

        const loadMoreBtn = document.querySelector('.load-more__button');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = this.hasMorePages ? 'block' : 'none';
            loadMoreBtn.textContent = this.isLoading ? 'Loading...' : 'Load more';
            loadMoreBtn.disabled = this.isLoading;
        }

        console.log(`Page ${this.currentPage} of ${info.pages}, Total: ${info.count} episodes`);
    }

    showLoadingState() {
        const loadMoreBtn = document.querySelector('.load-more__button');
        if (loadMoreBtn) {
            loadMoreBtn.textContent = 'Loading...';
            loadMoreBtn.disabled = true;
        }
    }

    hideLoadingState() {
        const loadMoreBtn = document.querySelector('.load-more__button');
        if (loadMoreBtn) {
            loadMoreBtn.textContent = 'Load more';
            loadMoreBtn.disabled = false;
        }
    }

    showErrorState() {
        const container = document.querySelector('.main__content');
        if (container && this.episodes.length === 0) {
            container.innerHTML = `
                <div class="error-state">
                    <p>Oops! Something went wrong while loading episodes.</p>
                    <button onclick="location.reload()">Try again</button>
                </div>
            `;
        }
    }

    showNoResultsState() {
        const container = document.querySelector('.main__content');
        if (container) {
            container.innerHTML = `
                <div class="no-results-state">
                    <p>No episodes found matching your criteria.</p>
                    <p>Try adjusting your search terms.</p>
                </div>
            `;
        }

        const loadMoreBtn = document.querySelector('.load-more__button');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = 'none';
        }
    }

    showInitialLoader() {
        const container = document.querySelector('.main__content');
        if (container) {
            GhostLoaderUtils.showGhostLoaders(container, 'episode', 8);
        }
    }

    hideInitialLoader() {
        const container = document.querySelector('.main__content');
        if (container) {
            GhostLoaderUtils.removeGhostLoaders(container);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new EpisodesPage();
});
