class RickAndMortyAPI {
    constructor() {
        this.baseURL = 'https://rickandmortyapi.com/api';
        this.endpoints = {
            characters: '/character',
            locations: '/location',
            episodes: '/episode'
        };
    }

    async fetchData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                if (response.status === 404) {
                    return {
                        info: {
                            count: 0,
                            pages: 0,
                            next: null,
                            prev: null
                        },
                        results: []
                    };
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async getCharacters(page = 1, filters = {}) {
        let url = `${this.baseURL}${this.endpoints.characters}?page=${page}`;

        // Add filters to URL
        Object.entries(filters).forEach(([key, value]) => {
            if (value && value.trim() !== '') {
                url += `&${key}=${encodeURIComponent(value)}`;
            }
        });

        return await this.fetchData(url);
    }

    async getCharacter(id) {
        const url = `${this.baseURL}${this.endpoints.characters}/${id}`;
        return await this.fetchData(url);
    }

    async getMultipleCharacters(ids) {
        const url = `${this.baseURL}${this.endpoints.characters}/${ids.join(',')}`;
        return await this.fetchData(url);
    }

    async getLocations(page = 1, filters = {}) {
        let url = `${this.baseURL}${this.endpoints.locations}?page=${page}`;

        Object.entries(filters).forEach(([key, value]) => {
            if (value && value.trim() !== '') {
                url += `&${key}=${encodeURIComponent(value)}`;
            }
        });

        return await this.fetchData(url);
    }

    async getLocation(id) {
        const url = `${this.baseURL}${this.endpoints.locations}/${id}`;
        return await this.fetchData(url);
    }

    async getEpisodes(page = 1, filters = {}) {
        let url = `${this.baseURL}${this.endpoints.episodes}?page=${page}`;

        Object.entries(filters).forEach(([key, value]) => {
            if (value && value.trim() !== '') {
                url += `&${key}=${encodeURIComponent(value)}`;
            }
        });

        return await this.fetchData(url);
    }

    async getEpisode(id) {
        const url = `${this.baseURL}${this.endpoints.episodes}/${id}`;
        return await this.fetchData(url);
    }

    async getMultipleEpisodes(ids) {
        const url = `${this.baseURL}${this.endpoints.episodes}/${ids.join(',')}`;
        return await this.fetchData(url);
    }

    async getAllDataForFilters() { // unused
        const results = {
            characters: { species: new Set(), gender: new Set(), status: new Set() },
            locations: { type: new Set(), dimension: new Set() },
            episodes: { season: new Set() }
        };

        try {
            let page = 1;
            let hasNextPage = true;

            while (hasNextPage) {
                const data = await this.getCharacters(page);
                data.results.forEach(char => {
                    if (char.species) results.characters.species.add(char.species);
                    if (char.gender) results.characters.gender.add(char.gender);
                    if (char.status) results.characters.status.add(char.status);
                });

                hasNextPage = !!data.info.next;
                page++;

                await new Promise(resolve => setTimeout(resolve, 100));
            }

            page = 1;
            hasNextPage = true;

            while (hasNextPage) {
                const data = await this.getLocations(page);
                data.results.forEach(loc => {
                    if (loc.type) results.locations.type.add(loc.type);
                    if (loc.dimension) results.locations.dimension.add(loc.dimension);
                });

                hasNextPage = !!data.info.next;
                page++;

                await new Promise(resolve => setTimeout(resolve, 100));
            }

            page = 1;
            hasNextPage = true;

            while (hasNextPage) {
                const data = await this.getEpisodes(page);
                data.results.forEach(ep => {
                    if (ep.episode) {
                        const season = ep.episode.substring(0, 3);
                        results.episodes.season.add(season);
                    }
                });

                hasNextPage = !!data.info.next;
                page++;

                await new Promise(resolve => setTimeout(resolve, 100));
            }

            return {
                characters: {
                    species: Array.from(results.characters.species).sort(),
                    gender: Array.from(results.characters.gender).sort(),
                    status: Array.from(results.characters.status).sort()
                },
                locations: {
                    type: Array.from(results.locations.type).sort(),
                    dimension: Array.from(results.locations.dimension).sort()
                },
                episodes: {
                    season: Array.from(results.episodes.season).sort()
                }
            };

        } catch (error) {
            console.error('Error collecting filter data:', error);
            return results;
        }
    }
}

window.RickAndMortyAPI = RickAndMortyAPI;
