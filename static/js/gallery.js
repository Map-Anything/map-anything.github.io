function computeSceneZGeometricMean(scene) {
    let log_z_sum = 1;
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
            log_z_sum += Math.log(-pos.z);
            count++;
        }
    }
    if (count === 0) return new BABYLON.Vector3(0, 0, 0);

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
    viewer.camera.setTarget(center);

    // const [boundingBoxMin, boundingBoxMax] = computeSceneBoundingBox(viewer.scene);

    const sceneSize = 3 * zGeoMean;
    viewer.sceneSize = sceneSize;
    viewer.camera.radius = sceneSize / 2;
    viewer.camera.lowerRadiusLimit = 0.3 * sceneSize;
    viewer.camera.upperRadiusLimit = sceneSize * 2;
    viewer.camera.wheelPrecision = 500 / sceneSize;
    viewer.camera.alpha = 0.5 * Math.PI;
    viewer.camera.beta = 0.4 * Math.PI;

    // Set the material
    const mesh = viewer.scene.meshes[1];
    mesh.originalMaterial = mesh.material;
    if (document.querySelector('#toggleTexturedGallery .toggle-left.active')) {
        mesh.material = viewer.plainMaterial;
    }
}

function createAnnotationMaterial(scene) {
    const material = new BABYLON.StandardMaterial("sphereMaterial", scene);
    material.emissiveColor = new BABYLON.Color3(1, 0, 0);
    material.diffuseColor = new BABYLON.Color3(0, 0, 0);
    material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    return material;
}

function createPlainMaterial(scene) {
    const material = new BABYLON.StandardMaterial("sphereMaterial", scene);
    material.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    material.ambientColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    return material;
}


const canvas = document.getElementById("renderCanvas");
const measureTextBox = document.getElementById("measureTextBox");


function clearAnnotations() {
    const viewer = canvas.viewer;
    viewer.annotationMeshes.forEach(mesh => mesh.dispose());
    viewer.selectedPoints = [];
    measureTextBox.innerHTML = "Pick two points to measure the distance.";
}


window.addEventListener("DOMContentLoaded", () => {
    const viewer = canvas.viewer;

    viewer.selectedPoints = [];
    viewer.annotationMeshes = [];

    viewer.annotationMaterial = createAnnotationMaterial(viewer.scene);
    viewer.plainMaterial = createPlainMaterial(viewer.scene);

    viewer.onClickPick = (pickResult) => {
        const pickedPoint = pickResult.pickedPoint;

        // Clear the previous annotation meshes and reset the selected points
        if (viewer.selectedPoints.length === 2) {
            clearAnnotations();
        };

        // Create a sphere at the picked point
        const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: viewer.sceneSize / 200 }, viewer.scene);
        sphere.position = pickedPoint;
        sphere.material = viewer.annotationMaterial;

        viewer.selectedPoints.push(pickedPoint);
        viewer.annotationMeshes.push(sphere);

        if (viewer.selectedPoints.length === 2) {
            // Create a line between the two selected points
            const line = BABYLON.MeshBuilder.CreateLines("line", {
                points: [viewer.selectedPoints[0], viewer.selectedPoints[1]]
            }, canvas.viewer.scene);
            line.material = viewer.annotationMaterial;
            viewer.annotationMeshes.push(line);

            const distance = BABYLON.Vector3.Distance(viewer.selectedPoints[0], viewer.selectedPoints[1]);
            measureTextBox.innerHTML = "Distance: " + distance.toFixed(2) + " m";
        }
    }

    // Initialize the viewer with a default model
    const name = document.querySelector('#gallerySelectionPanel .selectable-image.selected').getAttribute('name');
    clearAnnotations();
    viewer.loadGLB(`static/gallery/${name}/mesh.glb`, () => { resetViewer(viewer) });
});

// Initialize the selection panel images
$('#gallerySelectionPanel .selectable-image').each((i, img) => {
    img.src = `static/gallery/${img.getAttribute('name')}/image.jpg`;
})

const gallerySelectionPanel = document.getElementById('gallerySelectionPanel');
gallerySelectionPanel.addEventListener('click', async function(event) {
    const img = event.target.closest('.selectable-image');

    if (!img || img.classList.contains('selected'))
        return;

    gallerySelectionPanel.querySelectorAll('.selectable-image').forEach(function(image) {
        image.classList.remove('selected');
    });
    img.classList.add('selected');

    const name = img.getAttribute('name');

    const viewer = canvas.viewer;
    clearAnnotations();
    viewer.loadGLB(`static/gallery/${name}/mesh.glb`, () => { resetViewer(viewer) });
});


// Set the toggle buttons
const toggleGalleryLeftButton = document.querySelector('#toggleTexturedGallery .toggle-left');
const toggleGalleryRightButton = document.querySelector('#toggleTexturedGallery .toggle-right');

toggleGalleryLeftButton.addEventListener('click', function() {
    toggleGalleryLeftButton.classList.add('active');
    toggleGalleryRightButton.classList.remove('active');

    const viewer = canvas.viewer;
    if ((viewer.scene.meshes.length > 1) && (viewer.scene.meshes[1].getTotalVertices() > 0)) {
        mesh = viewer.scene.meshes[1];
        mesh.material = viewer.plainMaterial;
    }
});

toggleGalleryRightButton.addEventListener('click', function() {
    toggleGalleryRightButton.classList.add('active');
    toggleGalleryLeftButton.classList.remove('active');

    const viewer = canvas.viewer;
    if ((viewer.scene.meshes.length > 1) && (viewer.scene.meshes[1].getTotalVertices() > 0)) {
        mesh = viewer.scene.meshes[1];
        mesh.material = mesh.originalMaterial;
    }
});
