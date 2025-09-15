function computeSceneZGeometricMean(scene) {
    let log_z_sum = 0;  // Start with 0, not 1
    let count = 0;

    for (const mesh of scene.meshes) {
        if (!mesh.isVisible || !mesh.getVerticesData || !mesh.getTotalVertices()) continue;
        mesh.computeWorldMatrix(true);
        const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        if (!positions) continue;

        const matrix = mesh.getWorldMatrix();

        for (let i = 0; i < positions.length; i += 3) {
            const pos = BABYLON.Vector3.TransformCoordinates(
                BABYLON.Vector3.FromArray(positions, i),
                matrix
            );
            // Only use vertices with negative Z (in front of camera)
            if (pos.z < 0) {
                log_z_sum += Math.log(-pos.z);
                count++;
            }
        }
    }

    // Return a fallback distance if no valid vertices found
    if (count === 0) {
        console.warn('computeSceneZGeometricMean: No valid vertices found, using fallback distance');
        return 5.0;  // Return a reasonable default distance
    }

    const zGeoMean = Math.exp(log_z_sum / count);
    return zGeoMean;
}

function computeSceneBoundingBox(scene) {
    let min = new BABYLON.Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    let max = new BABYLON.Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);

    scene.meshes.forEach(mesh => {
        if (!mesh.isVisible || !mesh.getBoundingInfo || !mesh.getTotalVertices()) return;
        mesh.computeWorldMatrix(true);

        const box = mesh.getBoundingInfo().boundingBox;
        min = BABYLON.Vector3.Minimize(min, box.minimumWorld);
        max = BABYLON.Vector3.Maximize(max, box.maximumWorld);
    });

    return [min, max];
}

function resetViewer(viewer) {

    // Reset the camera position and target
    const zGeoMean = computeSceneZGeometricMean(viewer.scene);

    const center = new BABYLON.Vector3(0, 0, -zGeoMean)
    // DEBUG: Uncomment for camera positioning debugging
    // console.log('resetViewer: Camera target =', center);
    viewer.camera.setTarget(center);

    // const [boundingBoxMin, boundingBoxMax] = computeSceneBoundingBox(viewer.scene);

    const sceneSize = 3 * zGeoMean;
    // DEBUG: Uncomment for camera positioning debugging
    // console.log('resetViewer: sceneSize =', sceneSize);
    viewer.sceneSize = sceneSize;
    viewer.camera.radius = sceneSize / 2;
    viewer.camera.lowerRadiusLimit = 0.3 * sceneSize;
    viewer.camera.upperRadiusLimit = sceneSize * 2;
    viewer.camera.wheelPrecision = 500 / sceneSize;

    // Reduce keyboard movement sensitivity
    viewer.camera.angularSensibilityX = 2000; // Higher values = slower movement (default is ~1000)
    viewer.camera.angularSensibilityY = 2000; // Higher values = slower movement (default is ~1000)
    viewer.camera.panningSensibility = 2000;  // Higher values = slower panning (default is ~1000)
    viewer.camera.inertia = 0.9; // Smooth movement with inertia (0-1, higher = more inertia)

    viewer.camera.alpha = 0.5 * Math.PI;
    viewer.camera.beta = 0.4 * Math.PI;

    // DEBUG: Uncomment for camera positioning debugging
    // console.log('resetViewer: Camera radius =', viewer.camera.radius);
    // console.log('resetViewer: Camera position =', viewer.camera.position);

    // Set the material (use plain neutral material)
    if (viewer.scene.meshes.length > 1) {
        const mesh = viewer.scene.meshes[1];
    } else {
        console.warn('resetViewer: No mesh at index 1 to apply material to');
    }

    // DEBUG: Uncomment for resetViewer debugging
    // console.log('resetViewer: Reset complete');
}

function createAnnotationMaterial(scene) {
    const material = new BABYLON.StandardMaterial("sphereMaterial", scene);
    // Use MapAnything orange color #f08f35 (converted to RGB: r=240/255, g=143/255, b=53/255)
    material.emissiveColor = new BABYLON.Color3(240/255, 143/255, 53/255);
    material.diffuseColor = new BABYLON.Color3(0, 0, 0);
    material.specularColor = new BABYLON.Color3(0, 0, 0); // Remove white specular highlights
    material.specularPower = 0; // Further disable specular reflections
    return material;
}



const canvas = document.getElementById("renderCanvas");

function clearAnnotations() {
    const viewer = canvas.viewer;
    viewer.annotationMeshes.forEach(mesh => mesh.dispose());
    viewer.selectedPoints = [];
    // Reset the distance display
    const distanceDisplay = document.getElementById("distanceDisplay");
    if (distanceDisplay) {
        distanceDisplay.innerHTML = "Click two points to measure distance";
    }
}


window.addEventListener("DOMContentLoaded", () => {
    console.log("Results.js DOMContentLoaded");
    const viewer = canvas.viewer;

    viewer.selectedPoints = [];
    viewer.annotationMeshes = [];

    viewer.annotationMaterial = createAnnotationMaterial(viewer.scene);

    viewer.onClickPick = (pickResult) => {
        const pickedPoint = pickResult.pickedPoint;

        // Clear the previous annotation meshes and reset the selected points
        if (viewer.selectedPoints.length === 2) {
            clearAnnotations();
        };

        // Create a sphere at the picked point
        const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: viewer.sceneSize / 100 }, viewer.scene);
        sphere.position = pickedPoint;
        sphere.material = viewer.annotationMaterial;

        viewer.selectedPoints.push(pickedPoint);
        viewer.annotationMeshes.push(sphere);

        if (viewer.selectedPoints.length === 2) {
            // Create a thicker line between the two selected points using a tube
            const tube = BABYLON.MeshBuilder.CreateTube("tube", {
                path: [viewer.selectedPoints[0], viewer.selectedPoints[1]],
                radius: viewer.sceneSize / 400,  // Half the line thickness
                tessellation: 8
            }, canvas.viewer.scene);
            tube.material = viewer.annotationMaterial;
            viewer.annotationMeshes.push(tube);

            const distance = BABYLON.Vector3.Distance(viewer.selectedPoints[0], viewer.selectedPoints[1]);

            // Display the distance in the UI element
            const distanceDisplay = document.getElementById("distanceDisplay");
            if (distanceDisplay) {
                distanceDisplay.innerHTML = `Distance: ${distance.toFixed(2)} meters`;
            }
            console.log("Distance: " + distance.toFixed(2) + " m");
        }
    }

    // Initialize the viewer with a default model
    const name = document.querySelector('#gallerySelectionPanel .selectable-image.selected').getAttribute('name');
    const glbPath = `static/qual_viz_outputs/${name}/${name}_mapanything_output.glb`;
    // console.log('Loading initial GLB:', glbPath);
    clearAnnotations();
    viewer.loadGLB(glbPath, () => { resetViewer(viewer) }, (error) => {
        console.error('Failed to load GLB:', glbPath, error);
    });

    // Initialize the results selection panel with consistent image selection functionality
    const resultsExpectedCounts = {
        'basketball': 2,
        'basti_desk': 2,
        'dino': 3,
        'grindelwald': 3,
        'jpl_mars_yard': 6,
        'kpi': 2,
        'mt_washington': 4,
        'painting': 1,
        'panda_wildwest': 1
    };

    initializeImageSelection(
        '#gallerySelectionPanel',
        'static/qual_viz_outputs/{name}/{name}_input_images/view_{i}.png',
        resultsExpectedCounts
    );

    // Set up custom click functionality with proper highlighting synchronization
    const selectionPanel = document.querySelector('#gallerySelectionPanel');
    selectionPanel.addEventListener('click', function(event) {
        const img = event.target.closest('.selectable-image');
          
        if (!img) return;
          
        const name = img.getAttribute('name');
        const glbPath = `static/qual_viz_outputs/${name}/${name}_mapanything_output.glb`;
        const viewer = canvas.viewer;
          
        // Prevent multiple simultaneous loads - DON'T change highlighting if blocked
        if (viewer.isLoading) {
            console.log('GLB already loading, ignoring click');
            return; // Exit early, don't change highlighting
        }
          
        // If we get here, the load will proceed, so update highlighting
        selectionPanel.querySelectorAll('.selectable-image').forEach(function(image) {
            image.classList.remove('selected');
        });
        img.classList.add('selected');
          
        viewer.isLoading = true;
        clearAnnotations();
          
        // Clear all meshes immediately before loading new one
        viewer.clearMeshes();
        viewer.clearMaterials();
          
        viewer.loadGLB(glbPath, () => { 
            resetViewer(viewer);
            viewer.isLoading = false;
        }, (error) => {
            console.error('Failed to load GLB on click:', glbPath, error);
            viewer.isLoading = false;
        });
    });
});


// Toggle functionality removed - always use textured materials
