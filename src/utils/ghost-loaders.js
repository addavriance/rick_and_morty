class GhostLoaderUtils {

    static createCharacterGhost() {
        const ghost = document.createElement('div');
        ghost.className = 'character-card-ghost';
        ghost.innerHTML = `
            <div class="character-card-ghost__image"></div>
            <div class="character-card-ghost__content">
                <div class="character-card-ghost__title"></div>
                <div class="character-card-ghost__desc"></div>
            </div>
        `;
        return ghost;
    }

    static createLocationGhost() {
        const ghost = document.createElement('div');
        ghost.className = 'location-card-ghost';
        ghost.innerHTML = `
            <div class="location-card-ghost__content">
                <div class="location-card-ghost__title"></div>
                <div class="location-card-ghost__desc"></div>
            </div>
        `;
        return ghost;
    }

    static createEpisodeGhost() {
        const ghost = document.createElement('div');
        ghost.className = 'episode-card-ghost';
        ghost.innerHTML = `
            <div class="episode-card-ghost__content">
                <div class="episode-card-ghost__title"></div>
                <div class="episode-card-ghost__desc"></div>
                <div class="episode-card-ghost__index"></div>
            </div>
        `;
        return ghost;
    }

    static showGhostLoaders(container, type, count = 6) {
        if (!container) return;

        container.innerHTML = '';

        for (let i = 0; i < count; i++) {
            let ghost;
            switch (type) {
                case 'character':
                    ghost = this.createCharacterGhost();
                    break;
                case 'location':
                    ghost = this.createLocationGhost();
                    break;
                case 'episode':
                    ghost = this.createEpisodeGhost();
                    break;
                default:
                    ghost = this.createCharacterGhost();
            }
            container.appendChild(ghost);
        }
    }

    static removeGhostLoaders(container) {
        if (!container) return;

        const ghosts = container.querySelectorAll('[class*="-ghost"]');
        ghosts.forEach(ghost => ghost.remove());
    }

    static animateCardAppearance(card, delay = 0) {
        if (!card) return;

        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';

        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, delay);
    }

    static staggerCardAnimation(cards, staggerDelay = 100) {
        if (!cards || !cards.length) return;

        cards.forEach((card, index) => {
            this.animateCardAppearance(card, index * staggerDelay);
        });
    }
}

window.GhostLoaderUtils = GhostLoaderUtils;
