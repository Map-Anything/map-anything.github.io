const modelViewerComparison1 = document.querySelector("model-viewer#modelViewerComparison1");
const modelViewerComparison2 = document.querySelector("model-viewer#modelViewerComparison2");

// Define the list of comparison scenes
const comparisonScenes = [
    'aachen_night_spring',
    'berlin',
    'drifting',
    'jpl_mars_yard',
    'lake_statue',
    'lion_mirror',
    'mt_washington',
    'night_iphone_robot_vid',
    'night_temple',
    'panda',
    'park_sisters_statue',
    'peter_scenic',
    'skyscraper',
    'vatutin',
    'window',
];

// Initialize the comparison selection panel images with hover cycling functionality
function initializeComparisonPanel() {
    const selectionPanel = document.getElementById('comparisonSelectionPanel');

    // Clear existing content
    selectionPanel.innerHTML = '';

    // Create images for each scene
    comparisonScenes.forEach((name, index) => {
        const img = document.createElement('img');
        img.className = 'selectable-image';
        img.setAttribute('name', name);
        img.src = `static/qual_comparison_outputs/${name}/${name}_input_images/view_0.png`;

        // Make first image selected by default
        if (index === 0) {
            img.classList.add('selected');
        }

        selectionPanel.appendChild(img);

        // Add hover cycling functionality (similar to gallery.js)
        let currentImageIndex = 0;
        let cyclingInterval = null;
        let availableImages = [];
        let isDiscovering = false;

        // Pre-populate available images based on common patterns
        const discoverImages = () => {
            if (isDiscovering) return;
            isDiscovering = true;

            availableImages = [];

            // Try up to 10 images for each scene
            const maxImages = 10;
            for (let i = 0; i < maxImages; i++) {
                availableImages.push(`static/qual_comparison_outputs/${name}/${name}_input_images/view_${i}.png`);
            }

            console.log(`Pre-loaded ${availableImages.length} images for ${name}`);
            isDiscovering = false;
        };

        // Initialize images
        discoverImages();

        // Add hover event listeners
        img.addEventListener('mouseenter', function() {
            if (availableImages.length > 1) {
                startCycling();
            }

            function startCycling() {
                if (cyclingInterval) return;

                currentImageIndex = 0;
                img.src = availableImages[currentImageIndex];

                cyclingInterval = setInterval(() => {
                    currentImageIndex = (currentImageIndex + 1) % availableImages.length;
                    img.src = availableImages[currentImageIndex];
                }, 250);
            }
        });

        img.addEventListener('mouseleave', function() {
            if (cyclingInterval) {
                clearInterval(cyclingInterval);
                cyclingInterval = null;
            }
            // Reset to first image
            currentImageIndex = 0;
            img.src = `static/qual_comparison_outputs/${name}/${name}_input_images/view_0.png`;
        });
    });
}

// Handle comparison panel clicks and method selection
function initializeComparisonSelection() {
    const selectionPanel = document.getElementById('comparisonSelectionPanel');
    const methodSelector1 = document.getElementById('methodSelector1');
    const methodSelector2 = document.getElementById('methodSelector2');

    // Function to update a model viewer with camera settings
    function updateModelViewer(viewer, path) {
        viewer.src = path;
        // Set camera at origin with fixed position, closer to origin
        viewer.cameraTarget = "0m 0m 0m";
        viewer.cameraOrbit = "0deg 80deg 15m";
        if (viewer.resetTurntableRotation) {
            viewer.resetTurntableRotation(0);
        }
        // Wait for the model to load before positioning camera
        viewer.addEventListener('load', () => {
            viewer.jumpCameraToGoal();
        }, { once: true });
    }

    // Function to update viewer 1 based on current selections
    function updateViewer1() {
        const selectedScene = selectionPanel.querySelector('.selectable-image.selected');
        if (!selectedScene) return;

        const sceneName = selectedScene.getAttribute('name');
        const method1 = methodSelector1.value;
        const path1 = `static/qual_comparison_outputs/${sceneName}/${sceneName}_${method1}_output.glb`;

        updateModelViewer(modelViewerComparison1, path1);
        console.log(`Updated viewer 1: ${method1} for scene ${sceneName}`);
    }

    // Function to update viewer 2 based on current selections
    function updateViewer2() {
        const selectedScene = selectionPanel.querySelector('.selectable-image.selected');
        if (!selectedScene) return;

        const sceneName = selectedScene.getAttribute('name');
        const method2 = methodSelector2.value;
        const path2 = `static/qual_comparison_outputs/${sceneName}/${sceneName}_${method2}_output.glb`;

        updateModelViewer(modelViewerComparison2, path2);
        console.log(`Updated viewer 2: ${method2} for scene ${sceneName}`);
    }

    // Function to update both viewers (used when scene changes)
    function updateBothViewers() {
        updateViewer1();
        updateViewer2();
    }

    // Handle scene selection clicks
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

        // Load models for the new scene (both viewers)
        updateBothViewers();
    });

    // Handle method selector changes - each dropdown only updates its own viewer
    methodSelector1.addEventListener('change', updateViewer1);
    methodSelector2.addEventListener('change', updateViewer2);

    // Store the function for external use
    window.updateBothViewers = updateBothViewers;
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeComparisonPanel();
    initializeComparisonSelection();

    // Load initial models for the first scene with proper camera positioning
    if (comparisonScenes.length > 0) {
        const firstName = comparisonScenes[0];
        const mapAnythingPath = `static/qual_comparison_outputs/${firstName}/${firstName}_mapanything_output.glb`;
        const vggtPath = `static/qual_comparison_outputs/${firstName}/${firstName}_vggt_output.glb`;

        modelViewerComparison1.src = mapAnythingPath;
        modelViewerComparison1.addEventListener('load', () => {
            modelViewerComparison1.cameraTarget = "0m 0m 0m";
            modelViewerComparison1.cameraOrbit = "0deg 80deg 15m";
            modelViewerComparison1.jumpCameraToGoal();
        });

        modelViewerComparison2.src = vggtPath;
        modelViewerComparison2.addEventListener('load', () => {
            modelViewerComparison2.cameraTarget = "0m 0m 0m";
            modelViewerComparison2.cameraOrbit = "0deg 80deg 15m";
            modelViewerComparison2.jumpCameraToGoal();
        });
    }
});
