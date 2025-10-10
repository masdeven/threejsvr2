// File: model-loader.js

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

// --- PERBAIKAN: Tambahkan properti onComplete pada transitionState ---
let transitionState = {
  isAnimating: false,
  targetY: 0,
  speed: 4,
  onMidpoint: null,
  onComplete: null, // <-- TAMBAHAN BARU
};

export function setupKTX2Loader(ktx2Loader) {
  loader.setKTX2Loader(ktx2Loader);
}

export function setupDRACOLoader(dracoLoader) {
  loader.setDRACOLoader(dracoLoader);
}

// --- PERBAIKAN: Fungsi menerima onCompleteCallback ---
export function startModelAnimation(
  isAnimatingOut,
  onMidpointCallback = null,
  onCompleteCallback = null // <-- TAMBAHAN BARU
) {
  if (!currentModel) {
    if (onMidpointCallback) {
      onMidpointCallback();
    }
    if (onCompleteCallback && !isAnimatingOut) {
      onCompleteCallback();
    }
    return;
  }

  transitionState.isAnimating = isAnimatingOut ? "out" : "in";
  transitionState.onMidpoint = onMidpointCallback;
  transitionState.onComplete = onCompleteCallback; // <-- TAMBAHAN BARU

  if (isAnimatingOut) {
    transitionState.targetY = TABLE_HEIGHT - 1.5;
  } else {
    transitionState.targetY = currentModel.userData.finalY;
  }
}

export function updateModelTransition(deltaTime) {
  if (!transitionState.isAnimating || !currentModel) return;

  const currentY = currentModel.position.y;
  const targetY = transitionState.targetY;
  const speed = transitionState.speed;

  currentModel.position.y = THREE.MathUtils.lerp(
    currentY,
    targetY,
    speed * deltaTime
  );

  if (Math.abs(currentY - targetY) < 0.01) {
    currentModel.position.y = targetY;

    // --- AWAL PERBAIKAN ---
    // Cek jika animasi 'out' selesai dan memiliki callback.
    if (transitionState.isAnimating === "out" && transitionState.onMidpoint) {
      // Simpan callback-nya.
      const midpointCallback = transitionState.onMidpoint;

      // Reset state animasi SEKARANG, SEBELUM memanggil callback.
      transitionState.isAnimating = false;
      transitionState.onMidpoint = null;

      // Jalankan callback yang akan memulai animasi 'in' yang baru.
      midpointCallback();

      // Hentikan eksekusi fungsi ini agar tidak ada state yang tertimpa.
      return;
    }

    // Jika animasi 'in' yang selesai, jalankan onComplete.
    if (transitionState.isAnimating === "in" && transitionState.onComplete) {
      transitionState.onComplete();
    }
    // --- AKHIR PERBAIKAN ---

    // Reset state untuk kasus normal (animasi 'in' selesai, atau 'out' tanpa callback).
    transitionState.isAnimating = false;
    transitionState.onMidpoint = null;
    transitionState.onComplete = null;
  }
}

// --- PERBAIKAN: setupModel sekarang menerima startYOffset ---
function setupModel(model, startYOffset = 0) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());

  const maxDim = Math.max(size.x, size.y, size.z);
  const scaleFactor = 0.8 / maxDim;
  model.scale.setScalar(scaleFactor);

  model.traverse((child) => {
    if (child.isMesh) {
      const oldMaterial = child.material;
      const toonMaterial = new THREE.MeshToonMaterial({
        color: oldMaterial.color,
        map: oldMaterial.map,
      });
      child.material = toonMaterial;
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  const newBox = new THREE.Box3().setFromObject(model);
  const center = newBox.getCenter(new THREE.Vector3());

  model.position.x -= center.x;
  model.position.z = -2.5 - center.z;

  const newMinY = newBox.min.y;
  const finalY = TABLE_HEIGHT - newMinY;
  model.position.y = finalY + startYOffset; // <-- Variabel startYOffset sekarang terdefinisi
  model.userData.finalY = finalY;

  currentModel = model;
  scene.add(currentModel);
}
// --- AKHIR PERBAIKAN ---

// --- PERBAIKAN: loadComponentModel sekarang menerima onAnimationComplete ---
export function loadComponentModel(url, startYOffset = 0, onAnimationComplete) {
  if (activeLoad) {
    activeLoad.cancel();
    activeLoad = null;
  }
  unloadComponentModel();

  if (modelCache[url]) {
    console.log(`Mengambil model dari cache: ${url}`);
    const modelFromCache = modelCache[url].clone();
    setupModel(modelFromCache, startYOffset);
    startModelAnimation(false, null, onAnimationComplete); // <-- Panggil animasi 'in' dengan callback
    return;
  }

  console.log(`Memuat model baru: ${url}`);
  activeLoad = loader.load(
    url,
    (gltf) => {
      modelCache[url] = gltf.scene;
      const newModel = gltf.scene.clone();
      setupModel(newModel, startYOffset);
      startModelAnimation(false, null, onAnimationComplete); // <-- Panggil animasi 'in' dengan callback
      activeLoad = null;
    },
    undefined,
    (error) => {
      console.error("An error happened while loading the model:", error);
      activeLoad = null;
    }
  );
}
// --- AKHIR PERBAIKAN ---

export function unloadComponentModel() {
  if (currentModel) {
    scene.remove(currentModel);
    currentModel.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
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

// ... Sisa file (startDragging, stopDragging, dll.) tetap sama ...
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
