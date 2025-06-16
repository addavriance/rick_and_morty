class CharacterDetailPage {
    constructor() {
        this.api = new RickAndMortyAPI();
        this.characterId = null;
        this.character = null;
        this.episodes = [];
        this.isLoading = false;

        this.init();
    }

    init() {
        this.setupBackButton();
        this.getCharacterIdFromURL();
        if (this.characterId) {
            this.showInitialLoader();
            this.loadCharacterData();
        } else {
            this.show404();
        }
    }

    setupBackButton() {
        const urlParams = new URLSearchParams(window.location.search);
        const ref = urlParams.get('ref') || 'index';
        const backButton = document.getElementById('back-button');

        if (backButton) {
            const [referrer, id] = ref.split("_");

            const backUrl = ref === 'characters' ? 'index.html' : id ? `${referrer}.html?id=${id}` : `${referrer}.html`;
            backButton.href = backUrl;
        }
    }

    getCharacterIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');

        if (id && !isNaN(id) && parseInt(id) > 0) {
            this.characterId = parseInt(id);
        }
    }

    async loadCharacterData() {
        if (this.isLoading) return;

        this.isLoading = true;

        try {

            this.character = await this.api.getCharacter(this.characterId);

            if (!this.character.id) {
                throw new Error('Character not found')
            }

            if (this.character.episode && this.character.episode.length > 0) {
                await this.loadEpisodesData();
            }

            this.hideInitialLoader();
            this.renderCharacterData();

        } catch (error) {
            console.error('Error loading character:', error);
            this.hideInitialLoader();
            this.show404();
        } finally {
            this.isLoading = false;
        }
    }

    async loadEpisodesData() {
        try {

            const episodeIds = this.character.episode.map(url => {
                const parts = url.split('/');
                return parts[parts.length - 1];
            });

            if (episodeIds.length === 1) {
                const episode = await this.api.getEpisode(episodeIds[0]);
                this.episodes = [episode];
            } else {
                this.episodes = await this.api.getMultipleEpisodes(episodeIds);
            }

        } catch (error) {
            console.error('Error loading episodes:', error);
            this.episodes = [];
        }
    }

    renderCharacterData() {
        if (!this.character) return;

        this.renderAvatar();
        this.renderBasicInfo();
        this.renderInformation();
        this.renderEpisodes();
    }

    renderAvatar() {
        const avatarImg = document.querySelector('.character__avatar');
        const nameElement = document.querySelector('.character__name');

        if (avatarImg) {

            const avatarGhost = document.querySelector('.avatar-ghost-loader');

            const tempImg = new Image();
            tempImg.onload = () => {
                avatarImg.src = this.character.image;
                if (avatarGhost) {
                    avatarGhost.style.opacity = '0';
                    setTimeout(() => avatarGhost.remove(), 300);
                    setTimeout(() => avatarImg.style.opacity = '1', 200)
                }
            };

            tempImg.onerror = () => {
                avatarImg.style.backgroundColor = '#f0f0f0';
                avatarImg.style.opacity = '1';
                if (avatarGhost) {
                    avatarGhost.style.opacity = '0';
                    setTimeout(() => avatarGhost.remove(), 300);
                }
            };

            avatarImg.style.transition = 'opacity 0.3s ease';
            tempImg.src = this.character.image;
        }

        if (nameElement) {
            const nameGhost = document.querySelector('.name-ghost-loader');

            nameElement.textContent = this.character.name;
            nameElement.style.transition = 'opacity 0.3s ease';
            nameElement.style.opacity = '1';

            if (nameGhost) {
                nameGhost.style.opacity = '0';
                setTimeout(() => nameGhost.remove(), 300);
            }
        }
    }

    renderBasicInfo() {
        document.title = `${this.character.name} - Rick and Morty`;
    }

    renderInformation() {
        const informationItems = [
            { title: 'Gender', value: this.character.gender },
            { title: 'Status', value: this.character.status },
            { title: 'Specie', value: this.character.species },
            { title: 'Origin', value: this.character.origin?.name || 'Unknown' },
            { title: 'Type', value: this.character.type || 'Unknown' },
            { title: 'Location', value: this.character.location?.name || 'Unknown', hasLink: true }
        ];

        const informationColumn = document.querySelector('.character-column__information .column__content');
        if (informationColumn) {
            informationColumn.innerHTML = '';

            informationItems.forEach((item, index) => {
                const itemElement = this.createInformationItem(item, index === informationItems.length - 1);
                informationColumn.appendChild(itemElement);
            });
        }
    }

    createInformationItem(item, hasLink = false) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'column__item';

        const wrapperDiv = document.createElement('div');
        wrapperDiv.className = 'column__item-wrapper';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'column__item-title';
        titleDiv.textContent = item.title;

        const valueDiv = document.createElement('div');
        valueDiv.className = 'column__item-value';
        valueDiv.textContent = item.value;

        wrapperDiv.appendChild(titleDiv);
        wrapperDiv.appendChild(valueDiv);
        itemDiv.appendChild(wrapperDiv);

        if (hasLink && item.hasLink && this.character.location?.url) {
            const linkButton = document.createElement('a');
            linkButton.className = 'go-to__button';
            linkButton.style.cursor = 'pointer';
            linkButton.innerHTML = `
                <svg class="go-to__icon" width="8" height="12">
                    <use xlink:href="assets/icons/chevron-right.svg#icon"></use>
                </svg>
            `;

            const locationId = this.character.location.url.split('/').pop();
            linkButton.addEventListener('click', () => {
                console.log('Navigate to location:', locationId);
                window.location.href = `location.html?id=${locationId}&ref=character_${this.characterId}`;
            });

            itemDiv.appendChild(linkButton);
        }

        return itemDiv;
    }

    renderEpisodes() {
        const episodesColumn = document.querySelector('.character-column__episodes .column__content');
        if (!episodesColumn) return;

        if (this.episodes.length === 0) {
            episodesColumn.innerHTML = `
                <div class="column__item">
                    <div class="column__item-wrapper">
                        <div class="column__item-title">No episodes found</div>
                        <div class="column__item-value">This character doesn't appear in any episodes</div>
                    </div>
                </div>
            `;
            return;
        }

        episodesColumn.innerHTML = '';

        this.episodes.forEach(episode => {
            const episodeItem = this.createEpisodeItem(episode);
            episodesColumn.appendChild(episodeItem);
        });
    }

    createEpisodeItem(episode) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'column__item';

        const wrapperDiv = document.createElement('div');
        wrapperDiv.className = 'column__item-wrapper';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'column__item-title';
        titleDiv.textContent = episode.episode;

        const valueDiv = document.createElement('div');
        valueDiv.className = 'column__item-value';
        valueDiv.textContent = episode.name;

        const dateDiv = document.createElement('div');
        dateDiv.className = 'column__item-date';
        dateDiv.textContent = episode.air_date;

        wrapperDiv.appendChild(titleDiv);
        wrapperDiv.appendChild(valueDiv);
        wrapperDiv.appendChild(dateDiv);
        itemDiv.appendChild(wrapperDiv);

        const linkButton = document.createElement('a');
        linkButton.className = 'go-to__button';
        linkButton.style.cursor = 'pointer';
        linkButton.innerHTML = `
            <svg class="go-to__icon" width="8" height="12">
                <use xlink:href="assets/icons/chevron-right.svg#icon"></use>
            </svg>
        `;

        linkButton.addEventListener('click', () => {
            console.log('Navigate to episode:', episode.id);
            // TODO: Navigate to episode details
            window.location.href = `episode.html?id=${episode.id}&ref=character_${this.characterId}`;
        });

        itemDiv.appendChild(linkButton);

        return itemDiv;
    }

    showInitialLoader() {
        const avatarImg = document.querySelector('.character__avatar');
        if (avatarImg) {
            const avatarContainer = avatarImg.parentElement;
            const ghost = document.createElement('div');
            ghost.className = 'avatar-ghost-loader';
            ghost.style.cssText = `
                position: absolute;
                top: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 300px;
                height: 300px;
                border-radius: 50%;
                background: linear-gradient(90deg, #f8f8f8 25%, #eaeaea 50%, #f8f8f8 75%);
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
                border: 5px solid #F2F2F7;
                z-index: 1;
            `;

            avatarContainer.style.position = 'relative';
            avatarContainer.appendChild(ghost);
            avatarImg.style.opacity = '0';
        }

        const nameElement = document.querySelector('.character__name');
        if (nameElement) {
            const nameGhost = document.createElement('div');
            nameGhost.className = 'name-ghost-loader';
            nameGhost.style.cssText = `
                height: 58px;
                width: 400px;
                background: linear-gradient(90deg, #f8f8f8 25%, #eaeaea 50%, #f8f8f8 75%);
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
                border-radius: 8px;
            `;

            nameElement.style.opacity = '0';
            nameElement.parentElement.appendChild(nameGhost);
        }

        this.showInformationLoader();

        this.showEpisodesLoader();
    }

    hideInitialLoader() {
        // Ghosts will be removed when data is rendered
        // This method is kept for consistency but logic moved to render methods
    }

    showInformationLoader(count = 6) {
        const informationColumn = document.querySelector('.character-column__information .column__content');
        if (informationColumn) {
            informationColumn.innerHTML = '';

            for (let i = 0; i < count; i++) {
                const ghostItem = this.createInformationGhostItem();
                informationColumn.appendChild(ghostItem);
            }
        }
    }

    showEpisodesLoader(count = 3) {
        const episodesColumn = document.querySelector('.character-column__episodes .column__content');
        if (episodesColumn) {
            episodesColumn.innerHTML = '';

            for (let i = 0; i < count; i++) {
                const ghostItem = this.createEpisodeGhostItem();
                episodesColumn.appendChild(ghostItem);
            }
        }
    }

    createInformationGhostItem() {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'column__item information-ghost-item';

        const wrapperDiv = document.createElement('div');
        wrapperDiv.className = 'column__item-wrapper';

        const titleGhost = document.createElement('div');
        titleGhost.style.cssText = `
            height: 18px;
            width: 80px;
            background: linear-gradient(90deg, #f8f8f8 25%, #eaeaea 50%, #f8f8f8 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 4px;
            margin-bottom: 4px;
        `;

        const valueGhost = document.createElement('div');
        valueGhost.style.cssText = `
            height: 16px;
            width: 120px;
            background: linear-gradient(90deg, #f8f8f8 25%, #eaeaea 50%, #f8f8f8 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 4px;
        `;

        wrapperDiv.appendChild(titleGhost);
        wrapperDiv.appendChild(valueGhost);
        itemDiv.appendChild(wrapperDiv);

        return itemDiv;
    }

    createEpisodeGhostItem() {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'column__item episode-ghost-item';

        const wrapperDiv = document.createElement('div');
        wrapperDiv.className = 'column__item-wrapper';

        const titleGhost = document.createElement('div');
        titleGhost.style.cssText = `
            height: 18px;
            width: 60px;
            background: linear-gradient(90deg, #f8f8f8 25%, #eaeaea 50%, #f8f8f8 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 4px;
            margin-bottom: 4px;
        `;

        const valueGhost = document.createElement('div');
        valueGhost.style.cssText = `
            height: 16px;
            width: 150px;
            background: linear-gradient(90deg, #f8f8f8 25%, #eaeaea 50%, #f8f8f8 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 4px;
            margin-bottom: 6px;
        `;

        const dateGhost = document.createElement('div');
        dateGhost.style.cssText = `
            height: 12px;
            width: 100px;
            background: linear-gradient(90deg, #f8f8f8 25%, #eaeaea 50%, #f8f8f8 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 4px;
        `;

        wrapperDiv.appendChild(titleGhost);
        wrapperDiv.appendChild(valueGhost);
        wrapperDiv.appendChild(dateGhost);
        itemDiv.appendChild(wrapperDiv);

        return itemDiv;
    }

    show404() {
        const container = document.querySelector('.main__container');
        if (container) {
            const urlParams = new URLSearchParams(window.location.search);
            const ref = urlParams.get('ref') || 'index';
            const backUrl = ref === 'characters' ? 'index.html' : `${ref}.html`;

            container.innerHTML = `
                <div class="character-404">
                    <div style="text-align: center; padding: 60px 20px;">
                        <h1 style="font-size: 48px; margin-bottom: 16px; color: #081F32;">404</h1>
                        <p style="font-size: 20px; margin-bottom: 24px; color: #6E798C;">Character not found</p>
                        <p style="font-size: 16px; margin-bottom: 32px; color: #8E8E93;">
                            The character you're looking for doesn't exist or may have been removed.
                        </p>
                        <a href="${backUrl}" style="
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
                            <svg width="16" height="16">
                                <use xlink:href="assets/icons/arrow-left.svg#icon"></use>
                            </svg>
                            Back to ${ref === 'characters' ? 'Characters' : ref.charAt(0).toUpperCase() + ref.slice(1)}
                        </a>
                    </div>
                </div>
            `;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CharacterDetailPage();
});
