class LocationDetailPage {
    constructor() {
        this.api = new RickAndMortyAPI();
        this.locationId = null;
        this.location = null;
        this.residents = [];
        this.isLoading = false;

        this.init();
    }

    init() {
        this.setupBackButton();
        this.getLocationIdFromURL();
        if (this.locationId) {
            this.showInitialLoader();
            this.loadLocationData();
        } else {
            this.show404();
        }
    }

    setupBackButton() {
        const urlParams = new URLSearchParams(window.location.search);
        const ref = urlParams.get('ref') || 'locations';
        const backButton = document.getElementById('back-button');

        if (backButton) {
            const [referrer, id] = ref.split("_");

            const backUrl = id ? `${referrer}.html?id=${id}` : `${referrer}.html`;
            backButton.href = backUrl;
        }
    }

    getLocationIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');

        if (id && !isNaN(id) && parseInt(id) > 0) {
            this.locationId = parseInt(id);
        }
    }

    async loadLocationData() {
        if (this.isLoading) return;

        this.isLoading = true;

        try {
            this.location = await this.api.getLocation(this.locationId);

            if (!this.location.id) {
                throw new Error('Location not found')
            }

            if (this.location.residents && this.location.residents.length > 0) {
                await this.loadResidentsData();
            }

            this.hideInitialLoader();
            this.renderLocationData();

        } catch (error) {
            console.error('Error loading location:', error);
            this.hideInitialLoader();
            this.show404();
        } finally {
            this.isLoading = false;
        }
    }

    async loadResidentsData() {
        try {
            const residentIds = this.location.residents.map(url => {
                const parts = url.split('/');
                return parts[parts.length - 1];
            });

            if (residentIds.length === 1) {
                const character = await this.api.getCharacter(residentIds[0]);
                this.residents = [character];
            } else {
                this.residents = await this.api.getMultipleCharacters(residentIds);
            }

        } catch (error) {
            console.error('Error loading residents:', error);
            this.residents = [];
        }
    }

    renderLocationData() {
        if (!this.location) return;

        this.renderLocationInfo();
        this.renderResidents();
        this.renderBasicInfo();
    }

    renderLocationInfo() {
        const nameElement = document.querySelector('.location__name');
        if (nameElement) {
            const nameGhost = document.querySelector('.location-name-ghost');

            nameElement.textContent = this.location.name;
            nameElement.style.transition = 'opacity 0.3s ease';
            nameElement.style.opacity = '1';

            if (nameGhost) {
                nameGhost.style.opacity = '0';
                setTimeout(() => nameGhost.remove(), 300);
            }
        }

        const typeElements = document.querySelectorAll('.location__info > div');
        if (typeElements.length >= 2) {
            const typeValueEl = typeElements[0].querySelector('.column__item-value');
            const typeGhost = typeElements[0].querySelector('.location-info-ghost');

            if (typeValueEl) {
                typeValueEl.textContent = this.location.type;
                typeValueEl.style.transition = 'opacity 0.3s ease';
                typeValueEl.style.opacity = '1';

                if (typeGhost) {
                    typeGhost.style.opacity = '0';
                    setTimeout(() => typeGhost.remove(), 300);
                }
            }

            const dimensionValueEl = typeElements[1].querySelector('.column__item-value');
            const dimensionGhost = typeElements[1].querySelector('.location-info-ghost');

            if (dimensionValueEl) {
                dimensionValueEl.textContent = this.location.dimension;
                dimensionValueEl.style.transition = 'opacity 0.3s ease';
                dimensionValueEl.style.opacity = '1';

                if (dimensionGhost) {
                    dimensionGhost.style.opacity = '0';
                    setTimeout(() => dimensionGhost.remove(), 300);
                }
            }
        }
    }

    renderResidents() {
        const container = document.querySelector('.main__content');
        if (!container) return;

        GhostLoaderUtils.removeGhostLoaders(container);

        if (this.residents.length === 0) {
            container.innerHTML = `
                <div class="no-residents-state" style="
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 60px 20px;
                    color: var(--text-secondary);
                ">
                    <p style="font-size: 18px; margin-bottom: 8px;">No residents found</p>
                    <p style="font-size: 14px;">This location doesn't have any known residents.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';

        const newCards = [];
        this.residents.forEach(resident => {
            const characterCard = this.createCharacterCard(resident);
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
        imageBox.style.height = '168px';
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
            window.location.href = `character.html?id=${character.id}&ref=location_${this.locationId}`;
        });

        return card;
    }

    renderBasicInfo() {
        document.title = `${this.location.name} - Rick and Morty`;
    }

    showInitialLoader() {
        const nameElement = document.querySelector('.location__name');
        if (nameElement) {
            const nameGhost = document.createElement('div');
            nameGhost.className = 'location-name-ghost';
            nameGhost.style.cssText = `
                position: absolute;
                left: 0;
                right: 0;
                height: 43px;
                width: 350px;
                margin: 0 auto;
                background: linear-gradient(90deg, #f8f8f8 25%, #eaeaea 50%, #f8f8f8 75%);
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
                border-radius: 6px;
            `;

            nameElement.style.opacity = '0';
            nameElement.parentElement.appendChild(nameGhost);
        }

        const infoElements = document.querySelectorAll('.location__info > div');
        infoElements.forEach(infoDiv => {
            const valueElement = infoDiv.querySelector('.column__item-value');
            if (valueElement) {
                const infoGhost = document.createElement('div');
                infoGhost.className = 'location-info-ghost';
                infoGhost.style.cssText = `
                    position: absolute;
                    margin-top: -17px;
                    height: 17px;
                    width: 60px;
                    background: linear-gradient(90deg, #f8f8f8 25%, #eaeaea 50%, #f8f8f8 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                    border-radius: 4px;
                `;

                valueElement.style.opacity = '0';
                infoDiv.appendChild(infoGhost);
            }
        });

        const container = document.querySelector('.main__content');
        if (container) {
            GhostLoaderUtils.showGhostLoaders(container, 'character', 6);
        }
    }

    hideInitialLoader() {
    }

    show404() {
        const container = document.querySelector('.main__container');
        if (container) {
            container.innerHTML = `
                <div class="location-404">
                    <div style="text-align: center; padding: 60px 20px;">
                        <h1 style="font-size: 48px; margin-bottom: 16px; color: #081F32;">404</h1>
                        <p style="font-size: 20px; margin-bottom: 24px; color: #6E798C;">Location not found</p>
                        <p style="font-size: 16px; margin-bottom: 32px; color: #8E8E93;">
                            The location you're looking for doesn't exist or may have been removed.
                        </p>
                        <a href="locations.html" style="
                            padding: 12px 24px;
                            background-color: var(--primary);
                            color: var(--primary-500);
                            text-decoration: none;
                            border-radius: 4px;
                            font-weight: 500;
                            text-transform: uppercase;
                            letter-spacing: 1.25px;
                            font-size: 14px;
                            box-shadow: 0 3px 4px 0 rgba(34, 60, 80, 0.3);
                            transition: all 0.3s ease;
                        ">
                            Back to Locations
                        </a>
                    </div>
                </div>
            `;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LocationDetailPage();
});
