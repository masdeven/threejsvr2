import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { loadingManager } from "./loading-manager.js";
import { isVRMode } from "./vr-manager.js";
import { loader as gltfLoader, convertModelMaterials } from "./model-loader.js";

// ===============================================================
// KONSTANTA & PENGATURAN AWAL
// ===============================================================

// --- Warna & Cahaya ---
const INITIAL_BG_COLOR = 0xffffff;
const AMBIENT_LIGHT_COLOR = 0xffffff;
const AMBIENT_LIGHT_INTENSITY = 0.6;
const TONE_MAPPING_EXPOSURE = 0.6;

// --- Kamera ---
const CAMERA_FOV = 50;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 100;
const CAMERA_POS = new THREE.Vector3(0, 1.6, 0);

// --- Renderer ---
const MAX_PIXEL_RATIO = 2;

// --- Kontrol ---
const TARGET_POS = new THREE.Vector3(0, 1.6, 0);
const CONTROLS_ROTATE_SPEED = -0.1;
const CONTROLS_MIN_DIST = 0.1;
const CONTROLS_MAX_DIST = 0.5;
const CONTROLS_MIN_POLAR = Math.PI / 4; // 45 derajat
const CONTROLS_MAX_POLAR = (3 * Math.PI) / 4; // 135 derajat

// --- Scene ---
const ROOM_POSITION = new THREE.Vector3(-1.5, 0, -2.5);
const ENV_MAP_PATH = "assets/env/";
const ENV_MAP_FILE = "environment.hdr";
const ROOM_MODEL_PATH = "assets/models/room.glb";

// ===============================================================
// INISIALISASI SCENE
// ===============================================================

export const scene = new THREE.Scene();
scene.background = new THREE.Color(INITIAL_BG_COLOR);

// ===============================================================
// INISIALISASI KAMERA
// ===============================================================

export const camera = new THREE.PerspectiveCamera(
  CAMERA_FOV,
  window.innerWidth / window.innerHeight,
  CAMERA_NEAR,
  CAMERA_FAR
);
camera.position.copy(CAMERA_POS);

// ===============================================================
// INISIALISASI RENDERER
// ===============================================================

export const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance",
});
// renderer.localClippingEnabled = true;
// renderer.xr.setReferenceSpaceType("local");
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));

// Pengaturan Encoding & Tone Mapping
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; // Lebih aman untuk mobile VR
renderer.toneMappingExposure = TONE_MAPPING_EXPOSURE;

renderer.xr.addEventListener("sessionstart", () => {
  // Reset tone mapping untuk VR
  console.log("VR Session started with optimized settings");
});

// Tambahkan renderer ke DOM
document.getElementById("container").appendChild(renderer.domElement);

// ===============================================================
// INISIALISASI KONTROL (ORBIT)
// ===============================================================

export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = false;
controls.enablePan = false;
controls.enableZoom = false;
controls.rotateSpeed = CONTROLS_ROTATE_SPEED;
controls.target.copy(TARGET_POS);

// Pembatasan Kontrol
controls.minDistance = CONTROLS_MIN_DIST;
controls.maxDistance = CONTROLS_MAX_DIST;
controls.minPolarAngle = CONTROLS_MIN_POLAR;
controls.maxPolarAngle = CONTROLS_MAX_POLAR;

controls.update();

// ===============================================================
// PENCAHAYAAN & ENVIRONMENT
// ===============================================================

// DI scene-setup.js - Tambah lighting yang proper
// Ambient light (kurangi intensity)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

// Main directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Fill light
const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
fillLight.position.set(-5, 3, -5);
scene.add(fillLight);

// Environment Map (HDR)
export function loadEnvironmentMap(callback) {
  new RGBELoader(loadingManager).setPath(ENV_MAP_PATH).load(
    ENV_MAP_FILE,
    function (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
      console.log("Environment map loaded");
      if (callback) callback();
    },
    undefined,
    (error) => {
      console.error("Gagal memuat environment map:", error);
    }
  );
}
// ===============================================================
// EVENT LISTENER
// ===============================================================

/**
 * Menangani resize window untuk menjaga rasio aspek kamera dan ukuran renderer.
 */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
});

// ===============================================================
// FUNGSI EKSPOR (HELPERS)
// ===============================================================

/**
 * Memuat model ruangan ke dalam scene.
 * @param {GLTFLoader} gltfLoaderInstance - Instance loader yang akan digunakan (diteruskan dari main.js).
 */
export function loadRoom(gltfLoaderInstance) {
  gltfLoaderInstance.load(
    ROOM_MODEL_PATH,
    (gltf) => {
      const room = gltf.scene;
      room.position.copy(ROOM_POSITION);
      convertModelMaterials(room);
      scene.add(room);
      console.log("✓ Model ruangan berhasil dimuat.");
    },
    undefined, // onProgress callback (tidak digunakan)
    (error) => {
      console.error("✗ Gagal memuat model ruangan:", error);
    }
  );
}
