import * as THREE from "three";
import { scene } from "./scene-setup.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let currentModel = null;
let activeLoad = null;
const TABLE_HEIGHT = 1;
export let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
export const modelCache = {};
export const loader = new GLTFLoader();

// âœ… TAMBAHKAN: Store renderer reference
let rendererRef = null;
let cameraRef = null;

// âœ… TAMBAHKAN: Function untuk set renderer
export function setRendererForCompilation(renderer, camera) {
  rendererRef = renderer;
  cameraRef = camera;
}

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

function convertModelMaterials(model) {
  model.traverse((child) => {
    if (child.isMesh) {
      const oldMaterial = child.material;
      if (oldMaterial.userData.isConverted) return;

      const toonMaterial = new THREE.MeshBasicMaterial({
        color: oldMaterial.color,
        map: oldMaterial.map,
      });

      toonMaterial.userData.isConverted = true;
      oldMaterial.dispose();
      child.material = toonMaterial;
    }
  });
}

// âœ… TAMBAHKAN: Function untuk pre-compile shader
function preCompileModel(model) {
  if (!rendererRef || !cameraRef) {
    console.warn("âš  Renderer not set for shader compilation");
    return;
  }

  // Add model to scene temporarily (off-screen)
  model.position.set(0, -1000, 0); // Far away, won't be visible
  scene.add(model);

  try {
    // âœ… Pre-compile all shaders for this model
    rendererRef.compile(model, cameraRef);
    console.log("âœ“ Shader pre-compiled for model");
  } catch (error) {
    console.warn("âš  Shader compilation warning:", error);
  }

  // Remove from scene immediately
  scene.remove(model);
}

function setupModelPosition(model, startYOffset = 0) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scaleFactor = 0.8 / maxDim;
  model.scale.setScalar(scaleFactor);

  model.traverse((child) => {
    if (child.isMesh) {
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
    console.log(`âœ“ Mengambil model dari cache: ${url}`);
    const modelFromCache = modelCache[url].clone();
    setupModelPosition(modelFromCache, startYOffset);
    startModelAnimation(false, null, onAnimationComplete);
    return;
  }

  console.log(`â³ Memuat model baru: ${url}`);
  activeLoad = loader.load(
    url,
    (gltf) => {
      // âœ… Konversi material
      convertModelMaterials(gltf.scene);

      // âœ… Pre-compile shader SEBELUM disimpan ke cache
      preCompileModel(gltf.scene);

      // Simpan ke cache
      modelCache[url] = gltf.scene;
      console.log(
        `âœ“ Model dimuat, shader compiled, disimpan ke cache: ${url}`
      );

      const newModel = gltf.scene.clone();
      setupModelPosition(newModel, startYOffset);
      startModelAnimation(false, null, onAnimationComplete);
      activeLoad = null;
    },
    undefined,
    (error) => {
      console.error("âœ— Error loading model:", error);
      activeLoad = null;
    }
  );
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

export function unloadComponentModel() {
  if (currentModel) {
    scene.remove(currentModel);
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
