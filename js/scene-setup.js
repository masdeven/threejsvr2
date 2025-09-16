import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { loadingManager } from "./loading-manager.js";
import { loader as gltfLoader } from "./model-loader.js";

// Scene
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101010);

// Camera
export const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 1.6, 4.5);

// Renderer
export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.localClippingEnabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.getElementById("container").appendChild(renderer.domElement);

// Controls
export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 1;
controls.maxDistance = 4.8;
controls.target.set(0, 1.6, 0);
controls.maxPolarAngle = Math.PI / 2.1;
controls.enablePan = false;
controls.update();

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
// dirLight.position.set(5, 10, 7.5);
// scene.add(dirLight);

// Environment
new RGBELoader(loadingManager)
  .setPath("assets/env/")
  .load("environment.hdr", function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    scene.background = texture;
  });

// Load Environment Room Model
gltfLoader.load(
  "assets/models/Ruangan_Optimal.glb",
  (gltf) => {
    const room = gltf.scene;
    scene.add(room);
    console.log("Model ruangan berhasil dimuat.");
  },
  undefined,
  (error) => {
    console.error("Gagal memuat model ruangan:", error);
  }
);

// Window Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
