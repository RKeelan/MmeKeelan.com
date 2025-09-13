/**
 * StringReel - A reusable slot machine-style component for animating through strings
 */

/**
 * @typedef {Object} StringReelOptions
 * @property {number} [itemHeight=80] - Height of each item in pixels
 * @property {number} [additionalSets=3] - Number of additional sets to show during animation
 * @property {number} [animationDuration=2500] - Duration of the animation in milliseconds
 * @property {string} [transition='transform 2.5s cubic-bezier(0.2, 0.1, 0.4, 1)'] - CSS transition property
 * @property {string} [itemClassName='reel-item'] - CSS class name for individual items
 */

export class StringReel {
    /**
     * Creates a new StringReel instance
     * @param {HTMLElement} element - The DOM element that contains the reel
     * @param {string[]} items - Array of strings to display in the reel
     * @param {StringReelOptions} [options={}] - Configuration options
     */
    constructor(element, items, options = {}) {
        this.element = element;
        this.items = items;
        this.options = {
            itemHeight: 80,
            additionalSets: 3,
            animationDuration: 2500,
            transition: 'transform 2.5s cubic-bezier(0.2, 0.1, 0.4, 1)',
            itemClassName: 'reel-item',
            ...options
        };
        
        this.initialize();
    }
    
    /**
     * Initialize the reel with items
     * @returns {void}
     */
    initialize() {
        this.element.innerHTML = '';
        this.element.style.transition = this.options.transition;
        
        // Create multiple sets of items for smooth animation
        for (let set = 0; set <= this.options.additionalSets; set++) {
            this.items.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = this.options.itemClassName;
                itemElement.textContent = item;
                itemElement.style.height = `${this.options.itemHeight}px`;
                this.element.appendChild(itemElement);
            });
        }
        
        // Initialize to show first item
        this.element.style.transform = 'translateY(0px)';
    }
    
    /**
     * Animate to a specific string
     * @param {string} targetString - The string to animate to
     * @returns {void}
     */
    animateTo(targetString) {
        const itemIndex = this.items.indexOf(targetString);
        if (itemIndex === -1) {
            console.warn(`String "${targetString}" not found in reel items`);
            return;
        }
        
        const targetPosition = -(itemIndex * this.options.itemHeight);
        const targetInSecondSet = targetPosition - (this.options.additionalSets * this.items.length * this.options.itemHeight);
        
        // Animate to position in additional set
        this.element.style.transform = `translateY(${targetInSecondSet}px)`;
        
        // After animation, snap to final position
        setTimeout(() => {
            this.element.style.transition = 'none';
            this.element.style.transform = `translateY(${targetPosition}px)`;
            
            // Re-enable transitions after a brief delay
            setTimeout(() => {
                this.element.style.transition = this.options.transition;
            }, 50);
        }, this.options.animationDuration);
    }
    
    /**
     * Animate to a random string from the items
     * @returns {string} The string that was selected
     */
    animateToRandom() {
        const randomString = this.items[Math.floor(Math.random() * this.items.length)];
        this.animateTo(randomString);
        return randomString;
    }
    
    /**
     * Get the currently displayed string
     * @returns {string} The currently displayed string
     */
    getCurrentString() {
        const transform = this.element.style.transform;
        const translateY = transform.match(/translateY\((-?\d+)px\)/);
        if (!translateY) return this.items[0];
        
        const position = parseInt(translateY[1]);
        const index = Math.abs(position) / this.options.itemHeight;
        return this.items[Math.floor(index) % this.items.length];
    }
    
    /**
     * Update the items in the reel
     * @param {string[]} newItems - New array of strings
     * @returns {void}
     */
    updateItems(newItems) {
        this.items = newItems;
        this.initialize();
    }
}