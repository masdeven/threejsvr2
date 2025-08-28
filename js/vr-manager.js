import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";
import { renderer, scene } from "./scene-setup.js";

let controller1, controller2;
let controllerGrip1, controllerGrip2;

export function initVR(onSessionStartCallback) {
  const vrButton = VRButton.createButton(renderer);
  document.body.appendChild(vrButton);

  vrButton.style.position = "absolute";
  vrButton.style.top = "20px";
  vrButton.style.bottom = "auto";
  vrButton.style.left = "100%";
  vrButton.style.margin = "0";
  vrButton.style.padding = "8px 12px";
  vrButton.style.boxSizing = "border-box";
  vrButton.style.zIndex = "999";

  renderer.xr.enabled = true;

  if (onSessionStartCallback) {
    renderer.xr.addEventListener("sessionstart", onSessionStartCallback);
  }

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

export function isVRMode() {
  return renderer.xr.isPresenting;
}

export function getVRControllers() {
  return [controller1, controller2];
}
