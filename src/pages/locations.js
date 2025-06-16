// Locations page functionality
class LocationsPage {
    constructor() {
        this.api = new RickAndMortyAPI();
        this.currentPage = 1;
        this.currentFilters = {};
        this.isLoading = false;
        this.hasMorePages = true;
        this.locations = [];
        this.filterModal = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showInitialLoader();
        this.loadLocations();
        this.setupFilters();
    }

    setupEventListeners() {
        const searchInput = document.getElementById('search');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.currentFilters.name = e.target.value;
                    this.resetAndSearch();
                }, 500);
            });
        }

        const filterSelects = ['type', 'dimension'];
        filterSelects.forEach(filterId => {
            const select = document.getElementById(filterId);
            if (select) {
                select.addEventListener('change', (e) => {
                    this.currentFilters[filterId] = e.target.value;
                    this.resetAndSearch();
                });
            }
        });

        const loadMoreBtn = document.querySelector('.load-more__button');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadMoreLocations();
            });
        }

        const filtersButton = document.querySelector('.filters__button');
        if (filtersButton) {
            filtersButton.addEventListener('click', () => {
                this.showAdvancedFilters();
            });
        }
    }

    async setupFilters() {
        this.filterOptions = {
            type: ["Acid Plant", "Arcade", "Artificially generated world", "Asteroid", "Base", "Box", "Cluster", "Consciousness", "Convention", "Country", "Customs", "Daycare", "Death Star", "Diegesis", "Dimension", "Dream", "Dwarf planet (Celestial Dwarf)", "Elemental Rings", "Fantasy town", "Game", "Hell", "Human", "Liquid", "Machine", "Memory", "Menagerie", "Microverse", "Miniverse", "Mount", "Nightmare", "Non-Diegetic Alternative Reality", "Planet", "Police Department", "Quadrant", "Quasar", "Reality", "Resort", "Spa", "Space", "Space station", "Spacecraft", "TV", "Teenyverse", "Woods", "unknown"],
            dimension: ["Chair Dimension", "Cromulon Dimension", "Cronenberg Dimension", "Dimension 5-126", "Dimension C-137", "Dimension C-35", "Dimension C-500A", "Dimension D-99", "Dimension D716", "Dimension D716-B", "Dimension D716-C", "Dimension J-22", "Dimension J19ζ7", "Dimension K-22", "Dimension K-83", "Eric Stoltz Mask Dimension", "Evil Rick's Target Dimension", "Fantasy Dimension", "Fascist Dimension", "Fascist Shrimp Dimension", "Fascist Teddy Bear Dimension", "Giant Telepathic Spiders Dimension", "Magic Dimension", "Merged Dimension", "Phone Dimension", "Pizza Dimension", "Post-Apocalyptic Dimension", "Replacement Dimension", "Testicle Monster Dimension", "Tusk Dimension", "Unknown dimension", "Wasp Dimension", "unknown"]
        };

        Object.entries(this.filterOptions).forEach(([filterId, options]) => {
            const select = document.getElementById(filterId);
            if (select) {
                options.forEach(option => {
                    const optionElement = document.createElement('option');
                    optionElement.value = option;
                    optionElement.textContent = option;
                    select.appendChild(optionElement);
                });
            }
        });

        this.filterModal = new FilterModal(this.filterOptions, this.currentFilters);
        this.filterModal.setOnApply((newFilters) => {
            this.currentFilters = {...newFilters};
            this.updateDesktopSelects();
            this.resetAndSearch();
        });
    }

    showAdvancedFilters() {
        this.filterModal.open();
    }

    updateDesktopSelects() {
        Object.entries(this.currentFilters).forEach(([filterId, value]) => {
            const select = document.getElementById(filterId);
            if (select) {
                select.value = value || '';
            }
        });
    }

    async loadLocations() {
        if (this.isLoading || !this.hasMorePages) return;

        this.isLoading = true;
        if (this.currentPage === 1) {
            this.showInitialLoader();
        } else {
            this.showLoadingState();
        }

        try {
            const data = await this.api.getLocations(this.currentPage, this.currentFilters);

            if (this.currentPage === 1) {
                this.locations = data.results;
                this.clearLocationContainer();
                this.hideInitialLoader();
            } else {
                this.locations.push(...data.results);
            }

            if (data.results.length === 0) {
                this.showNoResultsState();
            } else {
                this.renderLocations(data.results);
            }

            this.updatePaginationInfo(data.info);

        } catch (error) {
            console.error('Error loading locations:', error);
            this.hideInitialLoader();
            this.showErrorState();
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    async loadMoreLocations() {
        if (this.hasMorePages) {
            this.currentPage++;
            await this.loadLocations();
        }
    }

    async resetAndSearch() {
        this.currentPage = 1;
        this.hasMorePages = true;
        await this.loadLocations();
    }

    renderLocations(locations) {
        const container = document.querySelector('.main__content');
        if (!container) return;

        const newCards = [];
        locations.forEach(location => {
            const locationCard = this.createLocationCard(location);
            container.appendChild(locationCard);
            newCards.push(locationCard);
        });

        GhostLoaderUtils.staggerCardAnimation(newCards);
    }

    createLocationCard(location) {
        const card = document.createElement('div');
        card.className = 'location__card';
        card.innerHTML = `
            <div class="location-card__content">
                <p class="location-card__title">${location.name}</p>
                <p class="location-card__desc">${location.type}</p>
            </div>
        `;

        card.addEventListener('click', () => {
            console.log('Location clicked:', location);
            window.location.href = `location.html?id=${location.id}`;
        });

        return card;
    }

    clearLocationContainer() {
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

        console.log(`Page ${this.currentPage} of ${info.pages}, Total: ${info.count} locations`);
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
        if (container && this.locations.length === 0) {
            container.innerHTML = `
                <div class="error-state">
                    <p>Oops! Something went wrong while loading locations.</p>
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
                    <p>No locations found matching your criteria.</p>
                    <p>Try adjusting your filters or search terms.</p>
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
            GhostLoaderUtils.showGhostLoaders(container, 'location', 8);
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
    new LocationsPage();
});
