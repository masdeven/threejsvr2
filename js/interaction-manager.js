import * as THREE from "three";
import { scene, camera, renderer, controls } from "./scene-setup.js";
import { getVRControllers } from "./vr-manager.js";
import { uiGroup, viewerUIGroup, FONT } from "./ui-creator.js";
import {
  startDragging,
  stopDragging,
  dragModel,
  getCurrentModel,
} from "./model-loader.js";
import { isVRMode } from "./vr-manager.js";

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hoveredObject = null;
let interactionCallback = null;
let lastIntersectedButton = null;

function getIntersectedObject(x, y) {
  pointer.set(x, y);
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects([uiGroup, viewerUIGroup], true);
  if (intersects.length > 0) {
    const firstHit = intersects[0].object;
    if (firstHit.userData.isButton) {
      return firstHit;
    }
  }
  return null;
}

function getVRIntersectedObject(controller) {
  raycaster.setFromXRController(controller);
  const intersects = raycaster.intersectObjects([uiGroup, viewerUIGroup], true);
  if (intersects.length > 0) {
    const firstHit = intersects[0].object;
    if (firstHit.userData.isButton) {
      return firstHit;
    }
  }
  return null;
}

function redrawButton(button, color) {
  // This function remains the same as your corrected version.
  const data = button.userData;
  const ctx = data.canvasContext;
  const canvas = ctx.canvas;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const resolution = canvas.width / button.geometry.parameters.width;

  // Logic for shape drawing (circle vs roundedRectangle)
  const shape =
    button.geometry.parameters.width === button.geometry.parameters.height
      ? "circle"
      : "roundedRectangle";

  if (shape === "circle") {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    ctx.fill();
  } else {
    const radius =
      20 * (resolution / (canvas.width / button.geometry.parameters.width / 2));
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(canvas.width - radius, 0);
    ctx.quadraticCurveTo(canvas.width, 0, canvas.width, radius);
    ctx.lineTo(canvas.width, canvas.height - radius);
    ctx.quadraticCurveTo(
      canvas.width,
      canvas.height,
      canvas.width - radius,
      canvas.height
    );
    ctx.lineTo(radius, canvas.height);
    ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fill();
  }

  const TEXT_COLOR = "#FFFFFF";
  ctx.fillStyle = TEXT_COLOR;

  const baseFontSize = parseInt(FONT.split(" ")[1]);
  const fontStyle = shape === "circle" ? "normal" : FONT.split(" ")[0];
  const scaledFontSize =
    baseFontSize *
    (resolution / (canvas.width / button.geometry.parameters.width / 2)) *
    (shape === "circle" ? 1.2 : 1.0);
  ctx.font = `${fontStyle} ${scaledFontSize}px Arial`;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(data.text, canvas.width / 2, canvas.height / 2);

  button.material.map.needsUpdate = true;
}

function handleHover(intersectedObject) {
  if (lastIntersectedButton && lastIntersectedButton !== intersectedObject) {
    if (
      lastIntersectedButton.userData.isButton &&
      lastIntersectedButton.userData.colors
    ) {
      redrawButton(
        lastIntersectedButton,
        lastIntersectedButton.userData.colors.default
      );
    }
  }

  if (intersectedObject && intersectedObject !== lastIntersectedButton) {
    if (
      intersectedObject.userData.isButton &&
      intersectedObject.userData.colors
    ) {
      redrawButton(intersectedObject, intersectedObject.userData.colors.hover);
    }
  }
  lastIntersectedButton = intersectedObject;
}

// --- [BARU] Logika untuk menangani klik pada tombol scroll ---
function handleScrollClick(action, scrollParent) {
  if (scrollParent && scrollParent.userData.isScrollable) {
    const { content, scrollBounds } = scrollParent.userData;
    const scrollStep = 0.2; // Seberapa jauh sekali scroll

    let newY = content.position.y;
    if (action === "scroll_up") {
      newY += scrollStep;
    } else {
      // "scroll_down"
      newY -= scrollStep;
    }

    // Batasi posisi scroll agar tidak keluar dari batas atas/bawah
    content.position.y = THREE.MathUtils.clamp(
      newY,
      scrollBounds.bottom,
      scrollBounds.top
    );
  }
}
function onClick(event) {
  if (isVRMode()) return;

  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);

  const intersects = raycaster.intersectObjects(scene.children, true);

  for (const intersect of intersects) {
    let interactableObject = intersect.object;
    while (interactableObject) {
      if (interactableObject.userData.action) {
        if (interactionCallback) {
          interactionCallback(interactableObject.userData.action);
        }
        return;
      }
      interactableObject = interactableObject.parent;
    }
  }
}

export function setupInteraction(callback) {
  interactionCallback = callback;
  const targetElement = renderer.domElement;

  targetElement.addEventListener("click", onClick);
  targetElement.addEventListener("mousemove", (event) => {
    if (isVRMode()) return;

    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;
    const intersectedObject = getIntersectedObject(x, y);
    handleHover(intersectedObject); // <- pakai logika hover lama
  });

  // --- AWAL MODIFIKASI ROTASI MANUAL ---
  const raycasterDrag = new THREE.Raycaster();

  targetElement.addEventListener("pointerdown", (event) => {
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;
    const uiHit = getIntersectedObject(x, y);
    if (uiHit) {
      // Pointer sedang di atas tombol, jangan mulai drag model
      return;
    }
    const currentModel = getCurrentModel();
    if (!currentModel) return;

    // Cek apakah pointer mengenai model
    pointer.x = x;
    pointer.y = y;
    raycasterDrag.setFromCamera(pointer, camera);

    const intersects = raycasterDrag.intersectObject(currentModel, true);

    if (intersects.length > 0) {
      controls.enabled = false; // Nonaktifkan OrbitControls
      startDragging(event);
    }
  });

  window.addEventListener("pointermove", (event) => {
    dragModel(event); // Fungsi ini sudah memiliki pengecekan isDragging
  });

  window.addEventListener("pointerup", () => {
    if (!controls.enabled) {
      controls.enabled = true; // Aktifkan kembali OrbitControls
    }
    stopDragging();
  });

  const controllers = getVRControllers();
  controllers.forEach((controller) => {
    controller.addEventListener("selectstart", () => {
      const intersectedObject = getVRIntersectedObject(controller);

      if (intersectedObject && intersectedObject.userData.isButton) {
        const action = intersectedObject.userData.action;
        const scrollParent = intersectedObject.userData.scrollParent;

        // --- PERBAIKAN DI SINI JUGA ---
        if (action === "scroll_up" || action === "scroll_down") {
          handleScrollClick(action, scrollParent); // Panggil fungsi scroll untuk VR
        } else if (interactionCallback) {
          interactionCallback(action); // Kirim aksi lain ke main.js
        }
      }
    });

    // selectend listener remains the same
    controller.addEventListener("selectend", () => {
      /* ... */
    });
  });
}

export function handleVRHover() {
  const controllers = getVRControllers();
  let intersectedInFrame = null;
  for (const controller of controllers) {
    const intersectedObject = getVRIntersectedObject(controller);
    if (intersectedObject) {
      intersectedInFrame = intersectedObject;
      break;
    }
  }
  handleHover(intersectedInFrame);
}
