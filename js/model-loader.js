import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { scene, renderer } from "./scene-setup.js";
import { loadingManager } from "./loading-manager.js";

const ktx2Loader = new KTX2Loader()
  .setTranscoderPath("https://unpkg.com/three@0.162.0/examples/jsm/libs/basis/")
  .detectSupport(renderer);

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("assets/draco/");

export const loader = new GLTFLoader(loadingManager);
loader.setDRACOLoader(dracoLoader);
loader.setKTX2Loader(ktx2Loader);

let currentModel = null;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let activeLoad = null;

export function loadComponentModel(url) {
  if (activeLoad) {
    activeLoad.cancel();
  }

  unloadComponentModel();
  activeLoad = loader.load(
    url,
    (gltf) => {
      currentModel = gltf.scene;

      const box = new THREE.Box3().setFromObject(currentModel);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      currentModel.position.sub(center);

      const maxDim = Math.max(size.x, size.y, size.z);
      const scaleFactor = 2 / maxDim;
      currentModel.scale.setScalar(scaleFactor);

      const newBox = new THREE.Box3().setFromObject(currentModel);
      const newMinY = newBox.min.y;
      currentModel.position.y -= newMinY;

      scene.add(currentModel);
      activeLoad = null;
    },
    undefined,
    (error) => {
      if (error.type !== "abort") {
        console.error("An error happened while loading the model:", error);
      }
      activeLoad = null;
    }
  );
}

export function unloadComponentModel() {
  if (currentModel) {
    scene.remove(currentModel);
    currentModel.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
    currentModel = null;
  }
}

export function updateModelRotation() {
  if (currentModel && !isDragging) {
    currentModel.rotation.y += 0.005;
  }
}
