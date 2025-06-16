class CharactersPage {
    constructor() {
        this.api = new RickAndMortyAPI();
        this.currentPage = 1;
        this.currentFilters = {};
        this.isLoading = false;
        this.hasMorePages = true;
        this.characters = [];
        this.filterModal = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showInitialLoader();
        this.loadCharacters();
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

        const filterSelects = ['species', 'gender', 'status'];
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
                this.loadMoreCharacters();
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
            species: ['Human', 'Alien', 'Humanoid', 'Poopybutthole', 'Mythological Creature', 'Robot', 'Animal', 'Cronenberg', 'Disease'],
            gender: ['Female', 'Male', 'Genderless', 'unknown'],
            status: ['Alive', 'Dead', 'unknown']
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
            this.currentFilters = { ...newFilters };
            this.updateDesktopSelects();
            this.resetAndSearch();
        });
    }

    showAdvancedFilters() {
        this.filterModal.open()
    }

    updateDesktopSelects() {
        Object.entries(this.currentFilters).forEach(([filterId, value]) => {
            const select = document.getElementById(filterId);
            if (select) {
                select.value = value || '';
            }
        });
    }

    async loadCharacters() {
        if (this.isLoading || !this.hasMorePages) return;

        this.isLoading = true;
        if (this.currentPage === 1) {
            this.showInitialLoader();
        } else {
            this.showLoadingState();
        }

        try {
            const data = await this.api.getCharacters(this.currentPage, this.currentFilters);

            if (this.currentPage === 1) {
                this.characters = data.results;
                this.clearCharacterContainer();
                this.hideInitialLoader();
            } else {
                this.characters.push(...data.results);
            }

            if (data.results.length === 0) {
                this.showNoResultsState();
            } else {
                this.renderCharacters(data.results);
            }

            this.updatePaginationInfo(data.info);

        } catch (error) {
            console.error('Error loading characters:', error);
            this.hideInitialLoader();
            this.showErrorState();
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    async loadMoreCharacters() {
        if (this.hasMorePages) {
            this.currentPage++;
            await this.loadCharacters();
        }
    }

    async resetAndSearch() {
        this.currentPage = 1;
        this.hasMorePages = true;
        await this.loadCharacters();
    }

    renderCharacters(characters) {
        const container = document.querySelector('.main__content');
        if (!container) return;

        const newCards = [];
        characters.forEach(character => {
            const characterCard = this.createCharacterCard(character);
            container.appendChild(characterCard);
            newCards.push(characterCard);
        });

        GhostLoaderUtils.staggerCardAnimation(newCards);
    }

    createCharacterCard(character) {
        const card = document.createElement('div');
        card.className = 'character__card';

        const imageBox = document.createElement('div');
        imageBox.className = 'card__image-box';
        imageBox.style.position = 'relative';
        imageBox.style.height = '168px'; // Set explicit height
        imageBox.style.overflow = 'hidden';

        const ghost = document.createElement('div');
        ghost.className = 'image-ghost-loader';

        const img = document.createElement('img');
        img.alt = character.name;
        img.loading = 'lazy';
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease-in-out';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.position = 'absolute';
        img.style.top = '0';
        img.style.left = '0';

        const tempImg = new Image();
        tempImg.onload = () => {
            ghost.style.opacity = '0';
            img.style.opacity = '1';
            setTimeout(() => {
                if (ghost.parentNode) {
                    ghost.remove();
                }
            }, 300);
        };

        tempImg.onerror = () => {
            ghost.style.opacity = '0';
            img.style.opacity = '1';
            img.style.backgroundColor = '#f0f0f0';
            img.alt = 'Image not available';
            setTimeout(() => {
                if (ghost.parentNode) {
                    ghost.remove();
                }
            }, 300);
        };

        tempImg.src = character.image;
        img.src = character.image;

        imageBox.appendChild(ghost);
        imageBox.appendChild(img);

        const content = document.createElement('div');
        content.className = 'character-card__content';
        content.innerHTML = `
            <p class="character-card__title">${character.name}</p>
            <p class="character-card__desc">${character.species}</p>
        `;

        card.appendChild(imageBox);
        card.appendChild(content);

        card.addEventListener('click', () => {
            console.log('Character clicked:', character);
            window.location.href = `character.html?id=${character.id}&ref=characters`;
        });

        return card;
    }

    clearCharacterContainer() {
        const container = document.querySelector('.main__content');
        if (container) {
            const characterCards = container.querySelectorAll('.character__card');
            characterCards.forEach((card, index) => {
                if (index >= 2) card.remove();
            });

            // Actually, let's remove all and start fresh lol
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

        console.log(`Page ${this.currentPage} of ${info.pages}, Total: ${info.count} characters`);
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
        if (container && this.characters.length === 0) {
            container.innerHTML = `
                <div class="error-state">
                    <p>Oops! Something went wrong while loading characters.</p>
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
                    <p>No characters found matching your criteria.</p>
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
            GhostLoaderUtils.showGhostLoaders(container, 'character', 8);
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
    new CharactersPage();
});
