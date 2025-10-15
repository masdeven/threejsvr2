import * as THREE from "three";
import { scene } from "./scene-setup.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let currentModel = null;
let activeLoad = null;
const TABLE_HEIGHT = 1;
export let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
export const modelCache = {};
export const preloadLoader = new GLTFLoader(THREE.DefaultLoadingManager);
export const loader = new GLTFLoader();

let dracoLoaderInstance = null;
let ktx2LoaderInstance = null;

// âœ… TAMBAHKAN: Store renderer reference
let rendererRef = null;
let cameraRef = null;

// âœ… TAMBAHKAN: Function untuk set renderer
export function setRendererForCompilation(renderer, camera) {
  rendererRef = renderer;
  cameraRef = camera;
}

let transitionState = {
  isAnimating: false,
  targetY: 0,
  speed: 4,
  onMidpoint: null,
  onComplete: null,
};

export function setupKTX2Loader(ktx2Loader) {
  ktx2LoaderInstance = ktx2Loader;
  loader.setKTX2Loader(ktx2Loader);
  preloadLoader.setKTX2Loader(ktx2Loader);
}

export function setupDRACOLoader(dracoLoader) {
  dracoLoaderInstance = dracoLoader;
  loader.setDRACOLoader(dracoLoader);
  preloadLoader.setDRACOLoader(dracoLoader);
}

export function convertModelMaterials(model) {
  model.traverse((child) => {
    if (child.isMesh) {
      const oldMaterial = child.material;
      if (oldMaterial.userData.isConverted) return;

      const toonMaterial = new THREE.MeshBasicMaterial({
        color: oldMaterial.color,
        map: oldMaterial.map,
      });

      toonMaterial.userData.isConverted = true;
      oldMaterial.dispose();
      child.material = toonMaterial;
    }
  });
}

// ✅ PERBAIKAN: Function untuk pre-compile shader
export function preCompileModel(model) {
  if (!rendererRef || !cameraRef) {
    console.warn("⚠ Renderer not set for shader compilation");
    return;
  }

  // ✅ Simpan posisi original
  const originalPosition = model.position.clone();
  const originalRotation = model.rotation.clone();
  const originalScale = model.scale.clone();

  // Add model to scene temporarily (off-screen)
  model.position.set(0, -1000, 0); // Far away, won't be visible
  scene.add(model);

  try {
    // ✅ Pre-compile all shaders for this model
    rendererRef.compile(model, cameraRef);
    console.log("✓ Shader pre-compiled for model");
  } catch (error) {
    console.warn("⚠ Shader compilation warning:", error);
  }

  // Remove from scene immediately
  scene.remove(model);

  // ✅ Kembalikan transformasi ke nilai original
  model.position.copy(originalPosition);
  model.rotation.copy(originalRotation);
  model.scale.copy(originalScale);
}

// Di model-loader.js
function setupModelPosition(model, startYOffset = 0) {
  // ✅ OPTIMASI: Hitung bounding box sekali, lalu scale, baru hitung lagi
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scaleFactor = 0.8 / maxDim;
  model.scale.setScalar(scaleFactor);

  // ✅ Set properti rendering sekali saat setup
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.frustumCulled = true; // ✅ Set di sini, bukan di render loop
    }
  });

  // ✅ Sekarang hitung box setelah scaling (hanya sekali lagi)
  box.setFromObject(model); // Reuse box object
  const center = box.getCenter(new THREE.Vector3());

  model.position.x -= center.x;
  model.position.z = -2.5 - center.z;

  const finalY = TABLE_HEIGHT - box.min.y;
  model.position.y = finalY + startYOffset;
  model.userData.finalY = finalY;

  currentModel = model;
  scene.add(currentModel);
}

let currentAbort = null;
export async function loadComponentModel(
  url,
  startYOffset = 0,
  onAnimationComplete
) {
  if (currentAbort) currentAbort.abort();
  currentAbort = new AbortController();
  try {
    const gltf = await loader.loadAsync(url, undefined, currentAbort.signal);
    convertModelMaterials(gltf.scene);
    preCompileModel(gltf.scene);
    modelCache[url] = gltf.scene;
    const newModel = gltf.scene.clone();
    setupModelPosition(newModel, startYOffset);
    startModelAnimation(false, null, onAnimationComplete);
  } catch (e) {
    if (e?.name !== "AbortError") console.error("Error loading model:", e);
  } finally {
    currentAbort = null;
  }
}

export function startModelAnimation(
  isAnimatingOut,
  onMidpointCallback = null,
  onCompleteCallback = null
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
  transitionState.onComplete = onCompleteCallback;

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

    if (transitionState.isAnimating === "out" && transitionState.onMidpoint) {
      const midpointCallback = transitionState.onMidpoint;
      transitionState.isAnimating = false;
      transitionState.onMidpoint = null;
      midpointCallback();
      return;
    }

    if (transitionState.isAnimating === "in" && transitionState.onComplete) {
      transitionState.onComplete();
    }

    transitionState.isAnimating = false;
    transitionState.onMidpoint = null;
    transitionState.onComplete = null;
  }
}

export function unloadComponentModel() {
  if (currentModel) {
    scene.remove(currentModel);
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

export function stopDragging() {
  isDragging = false;
}

export function dragModel(event) {
  if (!isDragging) return;

  const currentModel = getCurrentModel();
  if (!currentModel) return;

  const deltaX = event.clientX - previousMousePosition.x;
  const deltaY = event.clientY - previousMousePosition.y;

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

  const rotationSpeed = 2.0;
  currentModel.rotation.y += deltaX * rotationSpeed;
  currentModel.rotation.x += deltaY * rotationSpeed;
}

export function getCurrentModel() {
  return currentModel;
}

export function updateModelRotation() {
  if (currentModel && !isDragging) {
    currentModel.rotation.y += 0.005;
  }
}
