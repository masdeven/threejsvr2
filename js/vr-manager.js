import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";
import { renderer, scene } from "./scene-setup.js";

let controller1, controller2;
let controllerGrip1, controllerGrip2;

// --- BARU ---
// Objek untuk melacak status interaksi VR
export const vrInteractionState = {
  controller1: { isGrabbing: false, startPosition: new THREE.Vector3() },
  controller2: { isGrabbing: false, startPosition: new THREE.Vector3() },
};
// --- AKHIR BARU ---

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
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1),
  ]);
  const line = new THREE.Line(geometry);
  line.name = "line";
  line.scale.z = 5;
  controller1.add(line.clone());
  controller2.add(line.clone());
}

export async function startVRSession(onSessionEndCallback) {
  if (!navigator.xr) {
    alert("Perangkat atau browser Anda tidak mendukung WebXR.");
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

    if (onSessionEndCallback) {
      session.addEventListener("end", onSessionEndCallback);
    }
  } catch (e) {
    console.error("Gagal memulai sesi VR:", e);
    alert("Gagal memulai sesi VR. Pastikan headset Anda terhubung.");
  }
}

export function isVRMode() {
  return renderer.xr.isPresenting;
}

export function getVRControllers() {
  return [controller1, controller2];
}
