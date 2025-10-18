import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { loadingManager } from "./loading-manager.js";
import { loader as gltfLoader } from "./model-loader.js";

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101010);

export const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 1.6, 0);

export const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance",
});
renderer.localClippingEnabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.6;
document.getElementById("container").appendChild(renderer.domElement);

export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.enableZoom = false;
controls.rotateSpeed = 0.25;
controls.target.set(0, 1.6, 0);
controls.minDistance = 0.1;
controls.maxDistance = 0.5;
controls.minPolarAngle = Math.PI / 4;
controls.maxPolarAngle = (3 * Math.PI) / 4;
controls.update();

const ambientLight = new THREE.AmbientLight(0xffffff, 2);
scene.add(ambientLight);

const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

new RGBELoader(loadingManager)
  .setPath("assets/env/")
  .load("environment.hdr", function (texture) {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    pmremGenerator.dispose();
    scene.environment = envMap;
    scene.background = envMap;
  });

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

export function loadRoom(gltfLoader) {
  gltfLoader.load(
    "assets/models/room.glb",
    (gltf) => {
      const room = gltf.scene;
      room.position.set(0, 0, -2.5);
      scene.add(room);
      console.log("Model ruangan berhasil dimuat.");
    },
    undefined,
    (error) => {
      console.error("Gagal memuat model ruangan:", error);
    }
  );
}
