class BabylonModelViewer {
    constructor(canvas) {
        this.canvas = canvas;
        this.engine = new BABYLON.Engine(canvas, true);
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor = new BABYLON.Color4(1.0, 1.0, 1.0, 1.0);

        this.camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2, 10, BABYLON.Vector3.Zero(), this.scene);
        this.camera.attachControl(canvas, true);
        this.scene.ambientColor = new BABYLON.Color3(1.0, 1.0, 1.0);

        this.light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 0, 1), this.scene);
        this.light.intensity = 4;

        this._PointerDownPos = null;

        this.canvas.addEventListener("pointerdown", (evt) => {
            if (evt.button === 0) {
                this._PointerDownPos = { x: this.scene.pointerX, y: this.scene.pointerY };
            }
        });

        this.canvas.addEventListener("pointerup", (evt) => {
            if (evt.button === 0 && this._PointerDownPos) {
                const dx = this.scene.pointerX - this._PointerDownPos.x;
                const dy = this.scene.pointerY - this._PointerDownPos.y;
                const distanceSquared = dx * dx + dy * dy;

                const clickThreshold = 3 * 3;

                if (distanceSquared < clickThreshold) {
                    const pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY);

                    if (pickResult.hit && this.onClickPick) {
                        this.onClickPick(pickResult);
                    }
                }
                this._PointerDownPos = null;
            }
        });

        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        window.addEventListener("resize", () => {
            this.engine.resize();
        });

        this.canvas.addEventListener("wheel", function (event) {
            event.preventDefault();
        }, { passive: false });

        canvas.addEventListener("contextmenu", (evt) => evt.preventDefault());
    }

    clearMeshes() {
        this.scene.meshes.forEach(mesh => {
            if (!(mesh instanceof BABYLON.Camera) && !(mesh instanceof BABYLON.Light)) {
                mesh.dispose();
            }
        });
    }

    clearMaterials() {
        this.scene.materials.forEach(mat => mat.dispose());
    }

    loadGLB(fileUrl, onSuccess, onError) {
        // Clear previous meshes and materials
        this.clearMeshes();
        this.clearMaterials();


        // Load the glb file
        BABYLON.SceneLoader.Append(
            "./",
            fileUrl,
            this.scene,
            () => {
                if (onSuccess) onSuccess();
            },
            null, // onProgress callback
            (scene, message, exception) => {
                console.error('BabylonModelViewer: Failed to load GLB:', fileUrl, 'Message:', message, 'Exception:', exception);
                if (onError) onError({ message, exception });
            }
        );
    }
}


window.addEventListener("DOMContentLoaded", () => {
    const modelViewers = document.querySelectorAll('.babylon-model-viewer');

    modelViewers.forEach((canvasElement) => {
        canvasElement.viewer = new BabylonModelViewer(canvasElement);
    });
});
