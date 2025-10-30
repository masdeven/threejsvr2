import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { loadingManager } from "./loading-manager.js";
import { loader as gltfLoader, convertModelMaterials } from "./model-loader.js";

const INITIAL_BG_COLOR = 0xffffff;
const TONE_MAPPING_EXPOSURE = 0.6;

const CAMERA_FOV = 50;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 100;
const CAMERA_POS = new THREE.Vector3(-0.35, 1.2, -0.3);

const MAX_PIXEL_RATIO = 2;

const TARGET_POS = new THREE.Vector3(-0.35, 1.2, -0.5);
const CONTROLS_ROTATE_SPEED = -0.1;
const CONTROLS_MIN_DIST = 0.05;
const CONTROLS_MAX_DIST = 0.5;
const CONTROLS_MIN_POLAR = Math.PI / 4;
const CONTROLS_MAX_POLAR = (3 * Math.PI) / 4;

const ROOM_POSITION = new THREE.Vector3(-1.85, 0, -2.5);
const ENV_MAP_PATH = "assets/env/";
const ENV_MAP_FILE = "environment.hdr";
const ROOM_MODEL_PATH = "assets/models/room.glb";

export const scene = new THREE.Scene();
scene.background = new THREE.Color(INITIAL_BG_COLOR);

export const camera = new THREE.PerspectiveCamera(
  CAMERA_FOV,
  window.innerWidth / window.innerHeight,
  CAMERA_NEAR,
  CAMERA_FAR
);
camera.position.copy(CAMERA_POS);

export const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance",
});
renderer.xr.setReferenceSpaceType("local-floor");
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = TONE_MAPPING_EXPOSURE;

renderer.xr.addEventListener("sessionstart", () => {
  console.log("VR Session started with optimized settings");
});

document.getElementById("container").appendChild(renderer.domElement);

export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = false;
controls.enablePan = false;
controls.enableZoom = true;
controls.rotateSpeed = CONTROLS_ROTATE_SPEED;
controls.target.copy(TARGET_POS);
controls.minDistance = CONTROLS_MIN_DIST;
controls.maxDistance = CONTROLS_MAX_DIST;
controls.minPolarAngle = CONTROLS_MIN_POLAR;
controls.maxPolarAngle = CONTROLS_MAX_POLAR;
controls.update();

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

/**
 * Menangani resize window untuk menjaga rasio aspek kamera dan ukuran renderer.
 */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
});

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
    undefined,
    (error) => {
      console.error("✗ Gagal memuat model ruangan:", error);
    }
  );
}
