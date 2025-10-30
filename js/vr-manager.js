import * as THREE from "three";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";
import { renderer, scene } from "./scene-setup.js";

const RAY_LINE_GEOMETRY = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0, 0, -1),
]);
const RAY_LINE_SCALE = 5;

let controller1, controller2;
let controllerGrip1, controllerGrip2;

/**
 * Menyimpan state interaksi VR (apakah sedang 'grabbing' model).
 * Digunakan oleh interaction-manager.js.
 */
export const vrInteractionState = {
  controller1: { isGrabbing: false, startPosition: new THREE.Vector3() },
  controller2: { isGrabbing: false, startPosition: new THREE.Vector3() },
};

/**
 * Menginisialisasi WebXR pada renderer dan menyiapkan controller.
 * Membuat model grip dan garis pointer untuk setiap controller.
 */
export function setupVR() {
  renderer.xr.enabled = true;

  controller1 = renderer.xr.getController(0);
  scene.add(controller1);

  controller2 = renderer.xr.getController(1);
  scene.add(controller2);

  const controllerModelFactory = new XRControllerModelFactory();

  controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(
    controllerModelFactory.createControllerModel(controllerGrip1)
  );
  scene.add(controllerGrip1);

  controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.add(
    controllerModelFactory.createControllerModel(controllerGrip2)
  );
  scene.add(controllerGrip2);

  const line = new THREE.Line(RAY_LINE_GEOMETRY);
  line.name = "line";
  line.scale.z = RAY_LINE_SCALE;

  controller1.add(line.clone());
  controller2.add(line.clone());
}

/**
 * Mencoba memulai sesi WebXR ('immersive-vr').
 * Menampilkan alert jika gagal atau tidak didukung.
 * @param {function} onSessionEndCallback - Callback yang akan dijalankan saat sesi VR berakhir.
 */
export async function startVRSession(
  onSessionEndCallback,
  onSessionStartCallback
) {
  if (!navigator.xr) {
    alert("Your device or browser does not support WebXR.");
    return;
  }

  try {
    const session = await navigator.xr.requestSession("immersive-vr", {
      optionalFeatures: [
        "local-floor",
        "bounded-floor",
        "hand-tracking",
        "layers",
      ],
    });
    renderer.xr.setSession(session);

    if (onSessionStartCallback) {
      onSessionStartCallback();
    }

    if (onSessionEndCallback) {
      session.addEventListener("end", onSessionEndCallback);
    }
  } catch (e) {
    console.error("Gagal memulai sesi VR:", e);
    alert("Gagal memulai sesi VR. Pastikan headset Anda terhubung.");
  }
}

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
