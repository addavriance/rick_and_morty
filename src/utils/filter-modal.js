class FilterModal {
    constructor(filterOptions, currentFilters = {}) {
        this.filterOptions = filterOptions;
        this.currentFilters = { ...currentFilters };
        this.tempFilters = { ...currentFilters };
        this.onApply = null;
        this.modal = null;

        this.createModal();
        this.bindEvents();
    }

    createModal() {
        const existingModal = document.querySelector('.filter-modal');
        if (existingModal) {
            existingModal.remove();
        }

        this.modal = document.createElement('div');
        this.modal.className = 'filter-modal';
        this.modal.innerHTML = this.getModalHTML();

        document.body.appendChild(this.modal);
    }

    getModalHTML() {
        const filterGroups = Object.entries(this.filterOptions).map(([key, options]) => {
            const currentValue = this.tempFilters[key] || '';
            const label = this.getFilterLabel(key);

            return `
                <div class="filter-modal__group">
                    <select class="filter-modal__select" id="modal-${key}" data-filter="${key}">
                        <option value="">All ${label}</option>
                        ${options.map(option =>
                `<option value="${option}" ${option === currentValue ? 'selected' : ''}>${option}</option>`
            ).join('')}
                    </select>
                </div>
            `;
        }).join('');

        return `
            <div class="filter-modal__backdrop"></div>
            <div class="filter-modal__content">
                <div class="filter-modal__header">
                    <h3 class="filter-modal__title">Filters</h3>
                    <button class="filter-modal__close" aria-label="Close" style="">×</button>
                </div>
                <div class="filter-modal__body">
                    ${filterGroups}
                </div>
                <div class="filter-modal__actions">
                    <button class="filter-modal__button filter-modal__button--primary" data-action="apply">
                        Apply
                    </button>
                </div>
            </div>
        `;
    }

    getFilterLabel(key) {
        const labels = {
            species: 'Species',
            gender: 'Gender',
            status: 'Status',
            type: 'Type',
            dimension: 'Dimension'
        };
        return labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
    }

    bindEvents() {
        if (!this.modal) return;

        const closeBtn = this.modal.querySelector('.filter-modal__close');
        const backdrop = this.modal.querySelector('.filter-modal__backdrop');
        const applyBtn = this.modal.querySelector('[data-action="apply"]');

        [closeBtn, backdrop].forEach(element => {
            if (element) {
                element.addEventListener('click', () => this.close());
            }
        });

        if (applyBtn) {
            applyBtn.addEventListener('click', () => this.applyFilters());
        }

        const selects = this.modal.querySelectorAll('.filter-modal__select');
        selects.forEach(select => {
            select.addEventListener('change', (e) => {
                const filterKey = e.target.dataset.filter;
                this.tempFilters[filterKey] = e.target.value;
            });
        });

        this.handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        };
        document.addEventListener('keydown', this.handleKeyDown);

        const content = this.modal.querySelector('.filter-modal__content');
        if (content) {
            content.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    }

    open() {
        if (this.modal) {
            // Reset temp filters to current filters
            this.tempFilters = { ...this.currentFilters };
            this.updateModalValues();

            this.modal.classList.add('is-open');
            document.body.style.overflow = 'hidden';

            // Focus first select for accessibility
            const firstSelect = this.modal.querySelector('.filter-modal__select');
            if (firstSelect) {
                setTimeout(() => firstSelect.focus(), 100);
            }
        }
    }

    close() {
        if (this.modal) {
            this.modal.classList.remove('is-open');
            document.body.style.overflow = '';

            this.tempFilters = { ...this.currentFilters };
        }
    }

    applyFilters() {
        this.currentFilters = { ...this.tempFilters };

        if (this.onApply && typeof this.onApply === 'function') {
            this.onApply(this.currentFilters);
        }

        this.close();
    }

    resetFilters() {
        Object.keys(this.tempFilters).forEach(key => {
            this.tempFilters[key] = '';
        });

        this.updateModalValues();
    }

    updateModalValues() {
        if (!this.modal) return;

        Object.entries(this.tempFilters).forEach(([key, value]) => {
            const select = this.modal.querySelector(`[data-filter="${key}"]`);
            if (select) {
                select.value = value || '';
            }
        });
    }

    setOnApply(callback) {
        this.onApply = callback;
    }

    updateFilters(newFilters) {
        this.currentFilters = { ...newFilters };
        this.tempFilters = { ...newFilters };
    }

    destroy() {
        if (this.handleKeyDown) {
            document.removeEventListener('keydown', this.handleKeyDown);
        }

        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }

        document.body.style.overflow = '';
    }

    static show(filterOptions, currentFilters = {}, onApply = null) {
        const modal = new FilterModal(filterOptions, currentFilters);
        if (onApply) {
            modal.setOnApply(onApply);
        }
        modal.open();
        return modal;
    }

    getActiveFiltersCount() {
        return Object.values(this.currentFilters).filter(value => value && value.trim() !== '').length;
    }

    getActiveFiltersText() {
        const activeFilters = Object.entries(this.currentFilters)
            .filter(([key, value]) => value && value.trim() !== '')
            .map(([key, value]) => `${this.getFilterLabel(key)}: ${value}`);

        return activeFilters.length > 0 ? activeFilters.join(', ') : 'No filters applied';
    }
}

window.FilterModal = FilterModal;
