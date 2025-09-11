import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { scene, renderer } from "./scene-setup.js";
import { loadingManager } from "./loading-manager.js";

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("assets/draco/");

export const loader = new GLTFLoader(loadingManager);
loader.setDRACOLoader(dracoLoader);

export function setupKTX2Loader(ktx2Loader) {
  loader.setKTX2Loader(ktx2Loader);
}

let currentModel = null;
let isDragging = false;
let activeLoad = null;
const TABLE_HEIGHT = 0.9;

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
      const size = box.getSize(new THREE.Vector3());

      // 1. Normalisasi ukuran (misal 0.8 m maksimum)
      const maxDim = Math.max(size.x, size.y, size.z);
      const scaleFactor = 0.8 / maxDim;
      currentModel.scale.setScalar(scaleFactor);

      // 2. Hitung bounding box ulang setelah scaling
      const newBox = new THREE.Box3().setFromObject(currentModel);
      const center = newBox.getCenter(new THREE.Vector3());

      // 3. Geser supaya center pas di (0,0) di sumbu X,Z
      currentModel.position.x -= center.x;
      currentModel.position.z -= center.z;

      // 4. Geser Y supaya bawah mesh pas di meja
      const newMinY = newBox.min.y;
      currentModel.position.y = TABLE_HEIGHT - newMinY;

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
