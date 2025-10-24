import * as THREE from "three";
// Impor VRButton dihapus karena tidak digunakan di dalam file ini.
// Tombol VRButton di-handle oleh DOM di main.js.
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";
import { renderer, scene } from "./scene-setup.js";

// ===============================================================
// KONSTANTA
// ===============================================================

// Geometri untuk garis pointer (ray)
const RAY_LINE_GEOMETRY = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0, 0, -1),
]);
const RAY_LINE_SCALE = 5;

// ===============================================================
// STATE MODUL
// ===============================================================

// Referensi ke controller
let controller1, controller2;
// Referensi ke model fisik (grip) controller
let controllerGrip1, controllerGrip2;

/**
 * Menyimpan state interaksi VR (apakah sedang 'grabbing' model).
 * Digunakan oleh interaction-manager.js.
 */
export const vrInteractionState = {
  controller1: { isGrabbing: false, startPosition: new THREE.Vector3() },
  controller2: { isGrabbing: false, startPosition: new THREE.Vector3() },
};

// ===============================================================
// FUNGSI SETUP
// ===============================================================

/**
 * Menginisialisasi WebXR pada renderer dan menyiapkan controller.
 * Membuat model grip dan garis pointer untuk setiap controller.
 */
export function setupVR() {
  renderer.xr.enabled = true;
  
  // Pengaturan optimal untuk Quest 2
  // Menggunakan pixel ratio native Quest 2 untuk mengurangi chromatic aberration
  const xrSession = renderer.xr.getSession();
  if (xrSession) {
    // Set reference space untuk kualitas terbaik
    renderer.xr.setReferenceSpaceType('local-floor');
  }
  
  // Nonaktifkan foveation untuk mengurangi blur (trade-off performa)
  if (renderer.xr.isPresenting) {
    renderer.xr.setFoveation(0); // 0 = no foveation, 1 = max foveation
  }

  // Inisialisasi Controller 1 (input)
  controller1 = renderer.xr.getController(0);
  scene.add(controller1);

  // Inisialisasi Controller 2 (input)
  controller2 = renderer.xr.getController(1);
  scene.add(controller2);

  const controllerModelFactory = new XRControllerModelFactory();

  // Setup Grip 1 (model fisik controller)
  controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(
    controllerModelFactory.createControllerModel(controllerGrip1)
  );
  scene.add(controllerGrip1);

  // Setup Grip 2 (model fisik controller)
  controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.add(
    controllerModelFactory.createControllerModel(controllerGrip2)
  );
  scene.add(controllerGrip2);

  // Setup Garis Pointer (Ray)
  const line = new THREE.Line(RAY_LINE_GEOMETRY);
  line.name = "line";
  line.scale.z = RAY_LINE_SCALE;

  // Tambahkan garis ke kedua controller
  controller1.add(line.clone());
  controller2.add(line.clone());
}

// ===============================================================
// FUNGSI MANAJEMEN SESI
// ===============================================================

/**
 * Mencoba memulai sesi WebXR ('immersive-vr').
 * Menampilkan alert jika gagal atau tidak didukung.
 * @param {function} onSessionEndCallback - Callback yang akan dijalankan saat sesi VR berakhir.
 */
export async function startVRSession(
  onSessionEndCallback,
  onSessionStartCallback
) {
  // Cek dukungan WebXR
  if (!navigator.xr) {
    alert("Perangkat atau browser Anda tidak mendukung WebXR.");
    return;
  }

  try {
    // Meminta sesi VR dengan pengaturan optimal untuk Quest 2
    const session = await navigator.xr.requestSession("immersive-vr", {
      requiredFeatures: ["local-floor"],
      optionalFeatures: [
        "bounded-floor",
        "hand-tracking",
        "layers",
      ],
    });
    
    await renderer.xr.setSession(session);
    
    // Set foveation ke 0 untuk mengurangi blur
    // Nilai 0 = no foveation (kualitas penuh), 1 = max foveation (performa max)
    renderer.xr.setFoveation(0);
    
    // Set frame rate untuk Quest 2 (72Hz atau 90Hz)
    if (session.updateRenderState) {
      session.updateRenderState({
        baseLayer: new XRWebGLLayer(session, renderer.getContext(), {
          framebufferScaleFactor: 1.0, // 1.0 untuk kualitas penuh
          antialias: true,
        }),
      });
    }

    if (onSessionStartCallback) {
      onSessionStartCallback();
    }

    // Tambahkan listener untuk event 'end'
    if (onSessionEndCallback) {
      session.addEventListener("end", onSessionEndCallback);
    }
  } catch (e) {
    console.error("Gagal memulai sesi VR:", e);
    alert("Gagal memulai sesi VR. Pastikan headset Anda terhubung.");
  }
}

// ===============================================================
// FUNGSI GETTER (Status & Referensi)
// ===============================================================

/**
 * Memeriksa apakah sesi VR sedang aktif (presenting).
 * @returns {boolean} - True jika VR aktif.
 */
export function isVRMode() {
  return renderer.xr.isPresenting;
}

/**
 * Mengembalikan array yang berisi kedua instance controller.
 * @returns {Array<THREE.Object3D>} - [controller1, controller2]
 */
export function getVRControllers() {
  return [controller1, controller2];
}
