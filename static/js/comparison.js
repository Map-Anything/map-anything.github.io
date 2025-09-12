const modelViewerComparison1 = document.querySelector("model-viewer#modelViewerComparison1");
const modelViewerComparison2 = document.querySelector("model-viewer#modelViewerComparison2");

// Define the list of comparison scenes (these should match the img name attributes in HTML)
const comparisonScenes = [
    'peter_scenic',
    'panda',
    'aachen_night_spring',
    'berlin',
    'drifting',
    'jpl_mars_yard',
    'lake_statue',
    'lion_mirror',
    'mt_washington',
    'night_iphone_robot_vid',
    'night_temple',
    'park_sisters_statue',
    'skyscraper',
    'vatutin',
    'window',
];

// Initialize the comparison selection panel with consistent image selection functionality (same as results.js)
const comparisonExpectedCounts = {
    'peter_scenic': 2,
    'panda': 1,
    'aachen_night_spring': 2,
    'berlin': 2,
    'drifting': 7,
    'jpl_mars_yard': 6,
    'lake_statue': 2,
    'lion_mirror': 4,
    'mt_washington': 4,
    'night_iphone_robot_vid': 7,
    'night_temple': 2,
    'park_sisters_statue': 2,
    'skyscraper': 4,
    'vatutin': 2,
    'window': 2
};

// Initialize the comparison functionality with method buttons
function initializeComparisonSelection() {
    const selectionPanel = document.getElementById('comparisonSelectionPanel');
    const methodButtons1 = document.querySelectorAll('[data-viewer="1"]');
    const methodButtons2 = document.querySelectorAll('[data-viewer="2"]');

    // Store current method selections
    let currentMethod1 = 'mapanything';
    let currentMethod2 = 'vggt';

    // Function to update a model viewer with a new GLB file
    function updateModelViewer(viewer, src) {
        if (viewer && src) {
            viewer.src = src;
            viewer.addEventListener('load', () => {
                viewer.cameraTarget = "0m 0m 0m";
                viewer.cameraOrbit = "0deg 80deg 15m";
                viewer.jumpCameraToGoal();
            }, { once: true });
        }
    }

    // Function to update viewer 1 based on current selections
    function updateViewer1() {
        const selectedScene = selectionPanel.querySelector('.selectable-image.selected');
        if (!selectedScene) return;

        const sceneName = selectedScene.getAttribute('name');
        const path1 = `static/qual_comparison_outputs/${sceneName}/${sceneName}_${currentMethod1}_output.glb`;

        updateModelViewer(modelViewerComparison1, path1);
        console.log(`Updated viewer 1: ${currentMethod1} for scene ${sceneName}`);
    }

    // Function to update viewer 2 based on current selections
    function updateViewer2() {
        const selectedScene = selectionPanel.querySelector('.selectable-image.selected');
        if (!selectedScene) return;

        const sceneName = selectedScene.getAttribute('name');
        const path2 = `static/qual_comparison_outputs/${sceneName}/${sceneName}_${currentMethod2}_output.glb`;

        updateModelViewer(modelViewerComparison2, path2);
        console.log(`Updated viewer 2: ${currentMethod2} for scene ${sceneName}`);
    }

    // Function to update both viewers (used when scene changes)
    function updateBothViewers() {
        updateViewer1();
        updateViewer2();
    }

    // Handle method button clicks for viewer 1
    methodButtons1.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all viewer 1 buttons
            methodButtons1.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');

            // Update current method and viewer
            currentMethod1 = button.getAttribute('data-method');
            updateViewer1();
        });
    });

    // Handle method button clicks for viewer 2
    methodButtons2.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all viewer 2 buttons
            methodButtons2.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');

            // Update current method and viewer
            currentMethod2 = button.getAttribute('data-method');
            updateViewer2();
        });
    });

    // Store the function for external use
    window.updateBothViewers = updateBothViewers;
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeComparisonSelection();

    // Initialize the comparison selection panel with consistent image selection functionality (same as results.js)
    initializeImageSelection(
        '#comparisonSelectionPanel',
        'static/qual_comparison_outputs/{name}/{name}_input_images/view_{i}.png',
        comparisonExpectedCounts
    );

    // Set up click functionality using the shared utility (same pattern as results.js)
    initializeImageSelectionClick('#comparisonSelectionPanel', (selectedImg) => {
        // Update both model viewers for the new scene
        if (window.updateBothViewers) {
            window.updateBothViewers();
        }
    });

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
