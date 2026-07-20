import * as THREE from "three";
import { scene } from "./scene-setup.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const TABLE_HEIGHT = 1;
const ROTATION_SPEED_VR = 75.0;
const ROTATION_SPEED_MOUSE = 0.005;
const ROTATION_SPEED_AUTO = 0.005;
const ANIMATION_SPEED = 10;
const MODEL_SCALE_FACTOR = 0.3;

export let currentModel = null;
export let isUserInteracting = false;
export function setUserInteracting(state) {
  isUserInteracting = state;
}
let previousMousePosition = { x: 0, y: 0 };
let currentAbort = null;

export const modelCache = {};
export const preloadLoader = new GLTFLoader(THREE.DefaultLoadingManager);
export const loader = new GLTFLoader();

let dracoLoaderInstance = null;
let ktx2LoaderInstance = null;

let rendererRef = null;
let cameraRef = null;

export let transitionState = {
  isAnimating: false,
  targetY: 0,
  speed: ANIMATION_SPEED,
  onMidpoint: null,
  onComplete: null,
};

/**
 * Menyimpan referensi renderer dan kamera untuk pre-compile shader.
 * @param {THREE.WebGLRenderer} renderer - Instance renderer.
 * @param {THREE.Camera} camera - Instance kamera.
 */
export function setRendererForCompilation(renderer, camera) {
  rendererRef = renderer;
  cameraRef = camera;
}

/**
 * Mengatur KTX2Loader untuk loader utama dan preloadLoader.
 * @param {KTX2Loader} ktx2Loader - Instance KTX2Loader.
 */
export function setupKTX2Loader(ktx2Loader) {
  ktx2LoaderInstance = ktx2Loader;
  loader.setKTX2Loader(ktx2Loader);
  preloadLoader.setKTX2Loader(ktx2Loader);
}

/**
 * Mengatur DRACOLoader untuk loader utama dan preloadLoader.
 * @param {DRACOLoader} dracoLoader - Instance DRACOLoader.
 */
export function setupDRACOLoader(dracoLoader) {
  dracoLoaderInstance = dracoLoader;
  loader.setDRACOLoader(dracoLoader);
  preloadLoader.setDRACOLoader(dracoLoader);
}

/**
 * Memuat model komponen secara asinkron.
 * Meng-handle pembatalan (abort) load sebelumnya.
 * @param {string} url - Path ke file model.
 * @param {number} startYOffset - Offset Y awal untuk animasi masuk.
 * @param {function} onAnimationComplete - Callback setelah animasi masuk selesai.
 */
export async function loadComponentModel(
  url,
  startYOffset = 0,
  onAnimationComplete
) {
  if (currentAbort) currentAbort.abort();
  currentAbort = new AbortController();

  try {
    let newModel;
    if (modelCache[url]) {
      newModel = modelCache[url].clone();
    } else {
      console.warn("Model not in cache, loading manually:", url);
      const gltf = await loader.loadAsync(url, undefined, currentAbort.signal);
      convertModelMaterials(gltf.scene);
      preCompileModel(gltf.scene);
      newModel = gltf.scene.clone();
      modelCache[url] = gltf.scene; // Add to cache for future use
    }

    setupModelPosition(newModel, startYOffset);
    startModelAnimation(false, null, onAnimationComplete);
  } catch (e) {
    if (e?.name !== "AbortError") {
      if (onAnimationComplete) onAnimationComplete();
      console.error("Error loading model:", e);
    }
  } finally {
    currentAbort = null;
  }
}

/**
 * Menghapus model saat ini dari scene.
 */
export function unloadComponentModel() {
  if (currentModel) {
    scene.remove(currentModel);
    currentModel = null;
  }
}

/**
 * Memulai animasi masuk (in) atau keluar (out) untuk model.
 * @param {boolean} isAnimatingOut - True jika animasi keluar, false jika animasi masuk.
 * @param {function | null} onMidpointCallback - Callback saat animasi keluar mencapai titik tengah.
 * @param {function | null} onCompleteCallback - Callback saat animasi masuk selesai.
 */
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
    transitionState.targetY = TABLE_HEIGHT - 0.5;
  } else {
    transitionState.targetY = currentModel.userData.finalY;
  }
}

/**
 * Mengupdate posisi model selama transisi (dipanggil di render loop).
 * @param {number} deltaTime - Waktu delta dari frame.
 */
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

  if (Math.abs(currentY - targetY) < 0.001) {
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

export function stopModelAnimation() {
  if (transitionState.isAnimating) {
    console.log("Force stopping model transition animation.");
    transitionState.isAnimating = false;
    transitionState.onMidpoint = null;
    transitionState.onComplete = null;
  }
}

/**
 * Memulai mode drag model (dipanggil oleh interaction-manager).
 * @param {PointerEvent} event - Event pointer.
 */
export function startDragging(event) {
  if (!currentModel) return;
  isUserInteracting = true;
  previousMousePosition = {
    x: event.clientX,
    y: event.clientY,
  };
}

/**
 * Menghentikan mode drag model (dipanggil oleh interaction-manager).
 */
export function stopDragging() {
  isUserInteracting = false;
}

/**
 * Menghitung rotasi model berdasarkan gerakan mouse (dipanggil oleh interaction-manager).
 * @param {PointerEvent} event - Event pointer.
 */
export function dragModel(event) {
  if (!isUserInteracting || !currentModel) return;

  const deltaX = event.clientX - previousMousePosition.x;
  const deltaY = event.clientY - previousMousePosition.y;

  currentModel.rotation.y += deltaX * ROTATION_SPEED_MOUSE;
  currentModel.rotation.x += deltaY * ROTATION_SPEED_MOUSE;

  previousMousePosition = {
    x: event.clientX,
    y: event.clientY,
  };
}

/**
 * Merotasi model berdasarkan delta gerakan controller VR.
 * @param {number} deltaX - Perubahan posisi X controller.
 * @param {number} deltaY - Perubahan posisi Y controller.
 */
export function rotateModelWithVR(deltaX, deltaY) {
  if (!currentModel) return;

  currentModel.rotation.y += deltaX * ROTATION_SPEED_VR;
  currentModel.rotation.x += deltaY * ROTATION_SPEED_VR;
}

/**
 * Merotasi model secara otomatis (dipanggil di render loop).
 */
export function updateModelRotation() {
  if (currentModel && !isUserInteracting && !transitionState.isAnimating) {
    currentModel.rotation.y += ROTATION_SPEED_AUTO;
  }
}
/**
 * Mengembalikan referensi ke model yang sedang ditampilkan.
 * @returns {THREE.Object3D | null}
 */
export function getCurrentModel() {
  return currentModel;
}

/**
 * Mengkonversi material model ke MeshBasicMaterial (unlit/toon).
 * @param {THREE.Object3D} model - Model yang akan dikonversi.
 */
export function convertModelMaterials(model) {
  model.traverse((child) => {
    if (child.isMesh) {
      const oldMaterial = child.material;
      if (oldMaterial.userData.isConverted) return;

      const vrMaterial = new THREE.MeshStandardMaterial({
        color: oldMaterial.color,
        map: oldMaterial.map,
        transparent: oldMaterial.transparent,
        opacity: oldMaterial.opacity,
        depthWrite: true,
        metalness: 0.0,
        roughness: 0.9,
      });

      vrMaterial.userData.isConverted = true;

      if (oldMaterial !== vrMaterial) {
        oldMaterial.dispose();
      }

      child.material = vrMaterial;
    }
  });
}

/**
 * Memaksa renderer untuk meng-compile shader model agar tidak lag saat pertama kali muncul.
 * @param {THREE.Object3D} model - Model yang akan di-compile.
 */
export function preCompileModel(model) {
  if (!rendererRef || !cameraRef) {
    console.warn("⚠ Renderer not set for shader compilation");
    return;
  }

  const originalPosition = model.position.clone();
  const originalRotation = model.rotation.clone();
  const originalScale = model.scale.clone();

  model.position.set(0, -1000, 0);
  scene.add(model);

  try {
    rendererRef.compile(model, cameraRef);
    console.log("✓ Shader pre-compiled for model");
  } catch (error) {
    console.warn("⚠ Shader compilation warning:", error);
  }

  scene.remove(model);
  model.position.copy(originalPosition);
  model.rotation.copy(originalRotation);
  model.scale.copy(originalScale);
}

/**
 * Mengatur skala, posisi, dan properti rendering model.
 * @param {THREE.Object3D} model - Model yang akan diatur.
 * @param {number} startYOffset - Offset Y awal untuk animasi.
 */
function setupModelPosition(model, startYOffset = 0) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scaleFactor = MODEL_SCALE_FACTOR / maxDim;
  model.scale.setScalar(scaleFactor);

  model.traverse((child) => {
    if (child.isMesh) {
      child.frustumCulled = true;
    }
  });

  box.setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());

  model.position.x = -0.55 - center.x;
  model.position.z = -1 - center.z;

  const finalY = TABLE_HEIGHT - box.min.y;
  model.position.y = finalY + startYOffset;
  model.userData.finalY = finalY;

  currentModel = model;
  scene.add(currentModel);
}
