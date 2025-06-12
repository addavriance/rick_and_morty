class CharactersPage {
    constructor() {
        this.api = new RickAndMortyAPI();
        this.currentPage = 1;
        this.currentFilters = {};
        this.isLoading = false;
        this.hasMorePages = true;
        this.characters = [];

        this.init();
    }

    init() {
        this.setupEventListeners();
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
                this.toggleAdvancedFilters();
            });
        }
    }

    async setupFilters() {
        const filterOptions = {
            species: ['Human', 'Alien', 'Humanoid', 'Poopybutthole', 'Mythological Creature', 'Robot', 'Animal', 'Cronenberg', 'Disease'],
            gender: ['Female', 'Male', 'Genderless', 'unknown'],
            status: ['Alive', 'Dead', 'unknown']
        };

        Object.entries(filterOptions).forEach(([filterId, options]) => {
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
    }

    toggleAdvancedFilters() {
    }

    async loadCharacters() {
        if (this.isLoading || !this.hasMorePages) return;

        this.isLoading = true;
        this.showLoadingState();

        try {
            const data = await this.api.getCharacters(this.currentPage, this.currentFilters);

            if (this.currentPage === 1) {
                this.characters = data.results;
                this.clearCharacterContainer();
            } else {
                this.characters.push(...data.results);
            }

            this.renderCharacters(data.results);
            this.updatePaginationInfo(data.info);

        } catch (error) {
            console.error('Error loading characters:', error);
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

        characters.forEach(character => {
            const characterCard = this.createCharacterCard(character);
            container.appendChild(characterCard);
        });
    }

    createCharacterCard(character) {
        const card = document.createElement('div');
        card.className = 'character__card';
        card.innerHTML = `
            <div class="card__image-box">
                <img src="${character.image}" alt="${character.name}" loading="lazy">
            </div>
            <div class="character-card__content">
                <p class="character-card__title">${character.name}</p>
                <p class="character-card__desc">${character.species}</p>
            </div>
        `;

        card.addEventListener('click', () => {
            console.log('Character clicked:', character);
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
}

document.addEventListener('DOMContentLoaded', () => {
    new CharactersPage();
});
