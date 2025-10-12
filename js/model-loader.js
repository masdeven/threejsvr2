import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { scene } from "./scene-setup.js";
import { loadingManager } from "./loading-manager.js";

export const loader = new GLTFLoader(loadingManager);
let currentModel = null;
let activeLoad = null;
const TABLE_HEIGHT = 1;
export let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
export const modelCache = {};

let transitionState = {
  isAnimating: false,
  targetY: 0,
  speed: 4,
  onMidpoint: null,
  onComplete: null,
};

export function setupKTX2Loader(ktx2Loader) {
  loader.setKTX2Loader(ktx2Loader);
}

export function setupDRACOLoader(dracoLoader) {
  loader.setDRACOLoader(dracoLoader);
}

export function startModelAnimation(
  isAnimatingOut,
  onMidpointCallback = null,
  onCompleteCallback = null
) {
  if (!currentModel) {
    if (onMidpointCallback) {
      onMidpointCallback();
    }
    if (onCompleteCallback && !isAnimatingOut) {
      onCompleteCallback();
    }
    return;
  }

  transitionState.isAnimating = isAnimatingOut ? "out" : "in";
  transitionState.onMidpoint = onMidpointCallback;
  transitionState.onComplete = onCompleteCallback;

  if (isAnimatingOut) {
    transitionState.targetY = TABLE_HEIGHT - 1.5;
  } else {
    transitionState.targetY = currentModel.userData.finalY;
  }
}

export function updateModelTransition(deltaTime) {
  if (!transitionState.isAnimating || !currentModel) return;

  const currentY = currentModel.position.y;
  const targetY = transitionState.targetY;
  const speed = transitionState.speed;

  currentModel.position.y = THREE.MathUtils.lerp(
    currentY,
    targetY,
    speed * deltaTime
  );

  if (Math.abs(currentY - targetY) < 0.01) {
    currentModel.position.y = targetY;

    if (transitionState.isAnimating === "out" && transitionState.onMidpoint) {
      const midpointCallback = transitionState.onMidpoint;
      transitionState.isAnimating = false;
      transitionState.onMidpoint = null;
      midpointCallback();
      return;
    }

    if (transitionState.isAnimating === "in" && transitionState.onComplete) {
      transitionState.onComplete();
    }

    transitionState.isAnimating = false;
    transitionState.onMidpoint = null;
    transitionState.onComplete = null;
  }
}

function setupModel(model, startYOffset = 0) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());

  const maxDim = Math.max(size.x, size.y, size.z);
  const scaleFactor = 0.8 / maxDim;
  model.scale.setScalar(scaleFactor);

  model.traverse((child) => {
    if (child.isMesh) {
      const oldMaterial = child.material;
      const toonMaterial = new THREE.MeshBasicMaterial({
        color: oldMaterial.color,
        map: oldMaterial.map,
      });
      child.material = toonMaterial;
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  const newBox = new THREE.Box3().setFromObject(model);
  const center = newBox.getCenter(new THREE.Vector3());

  model.position.x -= center.x;
  model.position.z = -2.5 - center.z;

  const newMinY = newBox.min.y;
  const finalY = TABLE_HEIGHT - newMinY;
  model.position.y = finalY + startYOffset;
  model.userData.finalY = finalY;

  currentModel = model;
  scene.add(currentModel);
}

export function loadComponentModel(url, startYOffset = 0, onAnimationComplete) {
  if (activeLoad) {
    activeLoad.cancel();
    activeLoad = null;
  }
  unloadComponentModel();

  if (modelCache[url]) {
    console.log(`Mengambil model dari cache: ${url}`);
    const modelFromCache = modelCache[url].clone();
    setupModel(modelFromCache, startYOffset);
    startModelAnimation(false, null, onAnimationComplete);
    return;
  }

  console.log(`Memuat model baru: ${url}`);
  activeLoad = loader.load(
    url,
    (gltf) => {
      modelCache[url] = gltf.scene;
      const newModel = gltf.scene.clone();
      setupModel(newModel, startYOffset);
      startModelAnimation(false, null, onAnimationComplete);
      activeLoad = null;
    },
    undefined,
    (error) => {
      console.error("An error happened while loading the model:", error);
      activeLoad = null;
    }
  );
}

export function unloadComponentModel() {
  if (currentModel) {
    scene.remove(currentModel);
    currentModel.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
    currentModel = null;
  }
}

export function startDragging(event) {
  const currentModel = getCurrentModel();
  if (!currentModel) return;
  isDragging = true;
  previousMousePosition = {
    x: event.clientX,
    y: event.clientY,
  };
}

export function stopDragging() {
  isDragging = false;
}

export function dragModel(event) {
  if (!isDragging) return;

  const currentModel = getCurrentModel();
  if (!currentModel) return;

  const deltaX = event.clientX - previousMousePosition.x;
  const deltaY = event.clientY - previousMousePosition.y;

  currentModel.rotation.y += deltaX * 0.005;
  currentModel.rotation.x += deltaY * 0.005;

  previousMousePosition = {
    x: event.clientX,
    y: event.clientY,
  };
}

export function rotateModelWithVR(deltaX, deltaY) {
  const currentModel = getCurrentModel();
  if (!currentModel) return;

  const rotationSpeed = 2.0;

  currentModel.rotation.y += deltaX * rotationSpeed;
  currentModel.rotation.x += deltaY * rotationSpeed;
}

export function getCurrentModel() {
  return currentModel;
}

export function updateModelRotation() {
  if (currentModel && !isDragging) {
    currentModel.rotation.y += 0.005;
  }
}
