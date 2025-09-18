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
// Posisikan kamera di pusat ruangan (posisi mata pengguna)
camera.position.set(0, 1.6, 0);

// Renderer
export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.localClippingEnabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
document.getElementById("container").appendChild(renderer.domElement);

// Controls
export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false; // Pastikan pan dinonaktifkan

// KUNCI PERBAIKAN: Atur target ke posisi yang sama dengan kamera
// Ini akan membuat kamera berputar pada posisinya sendiri (menoleh)
controls.target.set(0, 1.6, 0);

// Atur jarak zoom agar tidak bisa keluar dari ruangan
controls.minDistance = 0.1; // Jarak minimal (dari sebelumnya 0.1)
controls.maxDistance = 0.5; // Jarak maksimal (dari sebelumnya 0.5)

// Batasi rotasi vertikal agar terasa lebih alami
controls.minPolarAngle = Math.PI / 4;
controls.maxPolarAngle = (3 * Math.PI) / 4;

controls.update();

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

// Environment
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

new RGBELoader(loadingManager)
  .setPath("assets/env/")
  .load("environment.hdr", function (texture) {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    pmremGenerator.dispose(); // Hapus generator setelah tidak digunakan

    // Terapkan environment map yang sudah diproses
    scene.environment = envMap;
    scene.background = envMap; // Gunakan peta yang sama untuk background
  });

// Load Environment Room Model
gltfLoader.load(
  "assets/models/Ruangan_Optimal.glb",
  (gltf) => {
    const room = gltf.scene;
    // --- TAMBAHKAN BARIS INI ---
    // Geser ruangan ke belakang sejauh 2.5 meter pada sumbu Z
    room.position.set(0, 0, -2.5);
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
