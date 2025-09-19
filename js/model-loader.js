import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { scene } from "./scene-setup.js";
import { loadingManager } from "./loading-manager.js";

export const loader = new GLTFLoader(loadingManager);
let currentModel = null;
let activeLoad = null;
const TABLE_HEIGHT = 1;
export let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
export const modelCache = {};

export function setupKTX2Loader(ktx2Loader) {
  loader.setKTX2Loader(ktx2Loader);
}

export function setupDRACOLoader(dracoLoader) {
  loader.setDRACOLoader(dracoLoader);
}

function setupModel(model) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());

  // 1. Normalisasi ukuran
  const maxDim = Math.max(size.x, size.y, size.z);
  const scaleFactor = 0.8 / maxDim;
  model.scale.setScalar(scaleFactor);

  // 2. Hitung ulang bounding box setelah scaling
  const newBox = new THREE.Box3().setFromObject(model);
  const center = newBox.getCenter(new THREE.Vector3());

  // 3. Geser agar pusatnya di (0,0) pada sumbu X,Z
  model.position.x -= center.x;
  model.position.z = -2.0 - center.z;

  // 4. Geser Y agar bagian bawah mesh pas di atas meja
  const newMinY = newBox.min.y;
  model.position.y = TABLE_HEIGHT - newMinY;

  currentModel = model;
  scene.add(currentModel);
}

export function loadComponentModel(url) {
  if (activeLoad) {
    activeLoad.cancel();
    activeLoad = null;
  }
  unloadComponentModel();

  // 2. Cek cache terlebih dahulu
  if (modelCache[url]) {
    console.log(`Mengambil model dari cache: ${url}`);
    const modelFromCache = modelCache[url].clone();
    setupModel(modelFromCache); // Gunakan model dari cache
    return;
  }

  // 3. Jika tidak ada di cache, muat dari file
  console.log(`Memuat model baru: ${url}`);
  activeLoad = loader.load(
    url,
    (gltf) => {
      console.log(`Model di-cache setelah dimuat: ${url}`);
      // Simpan model asli (sebelum di-clone) ke dalam cache
      modelCache[url] = gltf.scene;

      const newModel = gltf.scene.clone(); // Selalu gunakan clone untuk scene
      setupModel(newModel); // Setup model yang baru
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
export function startDragging(event) {
  const currentModel = getCurrentModel();
  if (!currentModel) return;
  isDragging = true;
  previousMousePosition = {
    x: event.clientX,
    y: event.clientY,
  };
}

// Fungsi untuk menghentikan interaksi drag
export function stopDragging() {
  isDragging = false;
}

export function dragModel(event) {
  if (!isDragging) return;

  const currentModel = getCurrentModel();
  if (!currentModel) return;

  const deltaX = event.clientX - previousMousePosition.x;
  const deltaY = event.clientY - previousMousePosition.y;

  // Rotasi berdasarkan pergerakan mouse
  currentModel.rotation.y += deltaX * 0.005;
  currentModel.rotation.x += deltaY * 0.005;

  previousMousePosition = {
    x: event.clientX,
    y: event.clientY,
  };
}

export function rotateModelWithVR(deltaX, deltaY) {
  const currentModel = getCurrentModel();
  if (!currentModel) return;

  const rotationSpeed = 2.0; // Sesuaikan kecepatan rotasi jika perlu

  // Terapkan rotasi. Sumbu mungkin perlu disesuaikan tergantung orientasi model/controller
  currentModel.rotation.y += deltaX * rotationSpeed;
  currentModel.rotation.x += deltaY * rotationSpeed;
}
// Fungsi untuk mengambil model yang sedang aktif
export function getCurrentModel() {
  return currentModel;
}
export function updateModelRotation() {
  if (currentModel && !isDragging) {
    currentModel.rotation.y += 0.005;
  }
}
