import * as THREE from "three";
import { scene } from "./scene-setup.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// ===============================================================
// KONSTANTA
// ===============================================================

const TABLE_HEIGHT = 1.2;
const ROTATION_SPEED_VR = 2.0;
const ROTATION_SPEED_MOUSE = 0.005;
const ROTATION_SPEED_AUTO = 0.005;
const ANIMATION_SPEED = 10;
const MODEL_SCALE_FACTOR = 0.7; // Skala target untuk model (0.7 / maxDim)

// ===============================================================
// STATE MODUL
// ===============================================================

let currentModel = null;
let activeLoad = null; // Catatan: Variabel ini dideklarasikan tapi tidak pernah digunakan di kode asli.
export let isUserInteracting = false; // Ganti nama dari isDragging
export function setUserInteracting(state) {
  isUserInteracting = state;
}
let previousMousePosition = { x: 0, y: 0 };
let currentAbort = null;

// Cache & Loaders
export const modelCache = {};
export const preloadLoader = new GLTFLoader(THREE.DefaultLoadingManager);
export const loader = new GLTFLoader();

// Instance Loader (diset oleh modul lain)
let dracoLoaderInstance = null;
let ktx2LoaderInstance = null;

// Referensi untuk Pre-compilation
let rendererRef = null;
let cameraRef = null;

// State Animasi Transisi
let transitionState = {
  isAnimating: false,
  targetY: 0,
  speed: ANIMATION_SPEED,
  onMidpoint: null,
  onComplete: null,
};

// ===============================================================
// FUNGSI SETUP (LOADERS & RENDERER)
// ===============================================================

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

// ===============================================================
// FUNGSI CORE (LOADING & UNLOADING MODEL)
// ===============================================================

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
  // Batalkan load sebelumnya jika ada
  if (currentAbort) currentAbort.abort();
  currentAbort = new AbortController();

  try {
    const gltf = await loader.loadAsync(url, undefined, currentAbort.signal);

    // Optimasi: Konversi material & pre-compile shader
    convertModelMaterials(gltf.scene);
    preCompileModel(gltf.scene);

    // Simpan ke cache
    modelCache[url] = gltf.scene;

    // Clone model dari cache untuk ditampilkan
    const newModel = gltf.scene.clone();
    setupModelPosition(newModel, startYOffset);

    // Mulai animasi masuk (isAnimatingOut = false)
    startModelAnimation(false, null, onAnimationComplete);
  } catch (e) {
    // Jangan log error jika itu adalah AbortError yang disengaja
    if (e?.name !== "AbortError") {
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
    // (Dispose geometri & material bisa ditambahkan di sini jika diperlukan,
    // tapi karena model di-clone, ini mungkin tidak esensial)
    currentModel = null;
  }
}

// ===============================================================
// FUNGSI ANIMASI & TRANSISI
// ===============================================================

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
    // Jika tidak ada model, langsung jalankan callback
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
    // Target Y di bawah meja
    transitionState.targetY = TABLE_HEIGHT - 1;
  } else {
    // Target Y di atas meja (posisi final)
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

  // Interpolasi (Lerp) posisi Y
  currentModel.position.y = THREE.MathUtils.lerp(
    currentY,
    targetY,
    speed * deltaTime
  );

  // Cek jika sudah dekat dengan target
  if (Math.abs(currentY - targetY) < 0.001) {
    currentModel.position.y = targetY; // Snap ke posisi final

    if (transitionState.isAnimating === "out" && transitionState.onMidpoint) {
      // Animasi keluar selesai, panggil midpoint
      const midpointCallback = transitionState.onMidpoint;
      transitionState.isAnimating = false;
      transitionState.onMidpoint = null;
      midpointCallback();
      return;
    }

    if (transitionState.isAnimating === "in" && transitionState.onComplete) {
      // Animasi masuk selesai, panggil complete
      transitionState.onComplete();
    }

    // Reset state animasi
    transitionState.isAnimating = false;
    transitionState.onMidpoint = null;
    transitionState.onComplete = null;
  }
}

// ===============================================================
// FUNGSI INTERAKSI (DRAG & ROTATE)
// ===============================================================

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
  if (
    currentModel &&
    !isUserInteracting &&
    !transitionState.isAnimating // <-- TAMBAHKAN KONDISI INI
  ) {
    currentModel.rotation.y += ROTATION_SPEED_AUTO;
  }
}

// ===============================================================
// FUNGSI GETTER
// ===============================================================

/**
 * Mengembalikan referensi ke model yang sedang ditampilkan.
 * @returns {THREE.Object3D | null}
 */
export function getCurrentModel() {
  return currentModel;
}

// ===============================================================
// FUNGSI UTILITAS INTERNAL (PRIVATE & EXPORTED)
// ===============================================================

/**
 * Mengkonversi material model ke MeshBasicMaterial (unlit/toon).
 * @param {THREE.Object3D} model - Model yang akan dikonversi.
 */
export function convertModelMaterials(model) {
  model.traverse((child) => {
    if (child.isMesh) {
      const oldMaterial = child.material;
      if (oldMaterial.userData.isConverted) return;

      // GUNAKAN MeshLambertMaterial atau MeshStandardMaterial
      const vrMaterial = new THREE.MeshStandardMaterial({
        color: oldMaterial.color,
        map: oldMaterial.map,
        transparent: oldMaterial.transparent,
        opacity: oldMaterial.opacity,
        depthWrite: true,
        metalness: 0.0, // Asumsikan non-logam
        roughness: 0.8,
      });

      vrMaterial.userData.isConverted = true;

      // Dispose material lama dengan benar
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

  // Simpan transformasi asli
  const originalPosition = model.position.clone();
  const originalRotation = model.rotation.clone();
  const originalScale = model.scale.clone();

  // Pindahkan model ke luar layar
  model.position.set(0, -1000, 0);
  scene.add(model);

  try {
    // Paksa compile
    rendererRef.compile(model, cameraRef);
    console.log("✓ Shader pre-compiled for model");
  } catch (error) {
    console.warn("⚠ Shader compilation warning:", error);
  }

  // Hapus dari scene dan kembalikan transformasi
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
  // Hitung Bounding Box pertama untuk scaling
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scaleFactor = MODEL_SCALE_FACTOR / maxDim;
  model.scale.setScalar(scaleFactor);

  // Atur properti rendering (shadow, frustum culling)
  model.traverse((child) => {
    if (child.isMesh) {
      // child.castShadow = true;
      // child.receiveShadow = true;
      child.frustumCulled = true;
    }
  });

  // Hitung Bounding Box kedua (setelah scaling) untuk positioning
  box.setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());

  // Pusatkan model di X dan Z
  model.position.x = -1.5 - center.x;
  model.position.z = -2.5 - center.z; // -1.5 adalah posisi Z meja/ruangan

  // Atur posisi Y
  const finalY = TABLE_HEIGHT - box.min.y; // Y agar model 'duduk' di atas meja
  model.position.y = finalY + startYOffset;
  model.userData.finalY = finalY; // Simpan posisi Y final untuk animasi

  // Simpan sebagai model saat ini dan tambahkan ke scene
  currentModel = model;
  scene.add(currentModel);
}
