// Shared utility for consistent image selection panel functionality
// Used by both results.js and comparison.js for consistent styling and behavior

// Global image cache to store preloaded images
const imageCache = new Map();

/**
 * Preloads and caches images for a given scene
 * @param {string} name - Scene name
 * @param {string} imagePath - Path template for images
 * @param {number} maxImages - Maximum number of images to preload
 * @returns {Promise<Image[]>} - Array of preloaded Image objects
 */
function preloadAndCacheImages(name, imagePath, maxImages) {
    const cacheKey = `${name}_${imagePath}_${maxImages}`;

    if (imageCache.has(cacheKey)) {
        return Promise.resolve(imageCache.get(cacheKey));
    }

    const imagePromises = [];

    for (let i = 0; i < maxImages; i++) {
        const imageSrc = imagePath.replace('{name}', name).replace('{name}', name).replace('{i}', i.toString());

        const imagePromise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve({ src: imageSrc, image: img, index: i });
            img.onerror = () => {
                console.warn(`Failed to load image: ${imageSrc}`);
                resolve(null); // Resolve with null instead of rejecting
            };
            img.src = imageSrc;
        });

        imagePromises.push(imagePromise);
    }

    return Promise.all(imagePromises).then(results => {
        // Filter out failed loads (null values)
        const validImages = results.filter(result => result !== null);
        console.log(`Cached ${validImages.length} images for ${name}`);
        imageCache.set(cacheKey, validImages);
        return validImages;
    });
}

/**
 * Initializes a selection panel with hover cycling functionality
 * @param {string} panelSelector - CSS selector for the selection panel (e.g., '#gallerySelectionPanel')
 * @param {string} imagePath - Path template for images (e.g., 'static/qual_viz_outputs/{name}/{name}_input_images/view_{i}.png')
 * @param {Object} expectedCounts - Object mapping scene names to expected image counts
 */
function initializeImageSelection(panelSelector, imagePath, expectedCounts = {}) {
    console.log(`[DEBUG] Initializing image selection for ${panelSelector}`);

    // Initialize the selection panel images with hover cycling functionality
    $(`${panelSelector} .selectable-image`).each(async (i, img) => {
        const name = img.getAttribute('name');
        console.log(`[DEBUG] Setting up image cycling for: ${name}`);

        // Set initial image source
        const initialImagePath = imagePath.replace('{name}', name).replace('{name}', name).replace('{i}', '0');
        img.src = initialImagePath;
        console.log(`[DEBUG] Initial image path: ${initialImagePath}`);

        let currentImageIndex = 0;
        let cyclingInterval = null;
        let cachedImages = [];
        let isLoading = false;

        // Use expected count if available, otherwise try up to 10 images
        const maxImages = expectedCounts[name] || 10;

        // Preload and cache images immediately
        const loadImages = async () => {
            if (isLoading) return;
            isLoading = true;

            try {
                cachedImages = await preloadAndCacheImages(name, imagePath, maxImages);
                console.log(`[DEBUG] Successfully cached ${cachedImages.length} images for ${name}`);
            } catch (error) {
                console.error(`[DEBUG] Failed to cache images for ${name}:`, error);
                // Fallback to just the first image
                cachedImages = [{ src: initialImagePath, index: 0 }];
            }

            isLoading = false;
        };

        // Start loading images immediately
        loadImages();

        // Add hover event listeners
        $(img).on('mouseenter', function() {
            console.log(`[DEBUG] Mouse entered ${name}, cachedImages: ${cachedImages.length}`);

            // Wait for images to be loaded if still loading
            const waitAndStartCycling = async () => {
                while (isLoading) {
                    await new Promise(resolve => setTimeout(resolve, 50)); // Wait 50ms
                }

                if (cachedImages.length > 1) {
                    console.log(`[DEBUG] Starting cycling for ${name} with ${cachedImages.length} images`);
                    startCycling();
                } else {
                    console.log(`[DEBUG] Not enough images to cycle for ${name}`);
                }
            };

            waitAndStartCycling();

            function startCycling() {
                if (cyclingInterval) return; // Already cycling

                currentImageIndex = 0;
                // Start with the first image displayed for full duration
                if (cachedImages[currentImageIndex]) {
                    img.src = cachedImages[currentImageIndex].src;
                }
                console.log(`[DEBUG] Started cycling with ${cachedImages.length} images for ${name}`);

                cyclingInterval = setInterval(() => {
                    currentImageIndex = (currentImageIndex + 1) % cachedImages.length;
                    if (cachedImages[currentImageIndex]) {
                        img.src = cachedImages[currentImageIndex].src;
                        console.log(`[DEBUG] Cycling to image ${currentImageIndex} for ${name}: ${img.src}`);
                    }
                }, 250); // Change image every 250ms for smooth cycling
            }
        });

        $(img).on('mouseleave', function() {
            console.log(`[DEBUG] Mouse left ${name}, stopping cycling`);
            if (cyclingInterval) {
                clearInterval(cyclingInterval);
                cyclingInterval = null;
            }
            // Reset to first image
            currentImageIndex = 0;
            const resetImagePath = imagePath.replace('{name}', name).replace('{name}', name).replace('{i}', '0');
            img.src = resetImagePath;
        });
    });
}

/**
 * Sets up click event handler for a selection panel
 * @param {string} panelSelector - CSS selector for the selection panel
 * @param {Function} onSelectionChange - Callback function called when selection changes, receives the selected image element
 */
function initializeImageSelectionClick(panelSelector, onSelectionChange) {
    const selectionPanel = document.querySelector(panelSelector);

    selectionPanel.addEventListener('click', function(event) {
        const img = event.target.closest('.selectable-image');

        if (!img || img.classList.contains('selected'))
            return;

        // Remove selected class from all images
        selectionPanel.querySelectorAll('.selectable-image').forEach(function(image) {
            image.classList.remove('selected');
        });

        // Add selected class to clicked image
        img.classList.add('selected');

        // Call the callback function
        if (onSelectionChange) {
            onSelectionChange(img);
        }
    });
}
