import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { loadingManager } from "./loading-manager.js";
import { isVRMode } from "./vr-manager.js";
import { loader as gltfLoader } from "./model-loader.js";

// ===============================================================
// KONSTANTA & PENGATURAN AWAL
// ===============================================================

// --- Warna & Cahaya ---
const INITIAL_BG_COLOR = 0x101010;
const AMBIENT_LIGHT_COLOR = 0xffffff;
const AMBIENT_LIGHT_INTENSITY = 2;
const TONE_MAPPING_EXPOSURE = 1;

// --- Kamera ---
const CAMERA_FOV = 50;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 100;
const CAMERA_POS = new THREE.Vector3(0, 1.6, -1);

// --- Renderer ---
const MAX_PIXEL_RATIO = 1.5;

// --- Kontrol ---
const TARGET_POS = new THREE.Vector3(0, 1.6, -1);
const CONTROLS_ROTATE_SPEED = -0.1;
const CONTROLS_MIN_DIST = 0.1;
const CONTROLS_MAX_DIST = 0.5;
const CONTROLS_MIN_POLAR = Math.PI / 4; // 45 derajat
const CONTROLS_MAX_POLAR = (3 * Math.PI) / 4; // 135 derajat

// --- Scene ---
const ROOM_POSITION = new THREE.Vector3(0, 0, -1.5);
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
renderer.physicallyCorrectLights = false;
renderer.gammaFactor = 2.2; // Standard gamma
renderer.localClippingEnabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
const getVRPixelRatio = () => {
  return isVRMode() ? 1.0 : Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO);
};
renderer.setPixelRatio(getVRPixelRatio());

// Pengaturan Encoding & Tone Mapping
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.LinearToneMapping; // Lebih aman untuk mobile VR
renderer.toneMappingExposure = TONE_MAPPING_EXPOSURE;

renderer.xr.addEventListener("sessionstart", () => {
  // Reset tone mapping untuk VR
  renderer.toneMapping = THREE.LinearToneMapping;
  renderer.toneMappingExposure = TONE_MAPPING_EXPOSURE;
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

// Cahaya Ambient
const ambientLight = new THREE.AmbientLight(
  AMBIENT_LIGHT_COLOR,
  AMBIENT_LIGHT_INTENSITY
);
scene.add(ambientLight);

// Environment Map (HDR)
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

// GANTI environment map loading:
new RGBELoader(loadingManager)
  .setPath(ENV_MAP_PATH)
  .load(ENV_MAP_FILE, function (texture) {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    pmremGenerator.dispose();

    // Batasi intensity environment map
    envMap.intensity = 0.5; // Turunkan dari default 1.0

    scene.environment = envMap;
    scene.background = envMap;
  });

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
      scene.add(room);
      console.log("✓ Model ruangan berhasil dimuat.");
    },
    undefined, // onProgress callback (tidak digunakan)
    (error) => {
      console.error("✗ Gagal memuat model ruangan:", error);
    }
  );
}
