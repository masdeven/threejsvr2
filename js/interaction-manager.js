import * as THREE from "three";
import { scene, camera, renderer, controls } from "./scene-setup.js";
import { getVRControllers } from "./vr-manager.js";
import { uiGroup, viewerUIGroup, FONT } from "./ui-creator.js";

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let interactionCallback = null;
let lastIntersectedButton = null;

// The old draggingState and handleScroll are not needed for the new scroll system.
// let draggingState = { ... };
// function handleScroll(...) { ... }

function getIntersectedObject(x, y) {
  pointer.set(x, y);
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects([uiGroup, viewerUIGroup], true);
  if (intersects.length > 0) {
    const firstHit = intersects[0].object;
    // We only care about objects that are buttons.
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

export function setupInteraction(callback) {
  interactionCallback = callback;
  const domElement = renderer.domElement;

  domElement.addEventListener("pointermove", (event) => {
    // Hover logic remains the same
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;
    const intersectedObject = getIntersectedObject(x, y);
    handleHover(intersectedObject);
  });

  domElement.addEventListener("pointerdown", (event) => {
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;
    const intersectedObject = getIntersectedObject(x, y);

    if (intersectedObject && intersectedObject.userData.isButton) {
      const action = intersectedObject.userData.action;
      const scrollParent = intersectedObject.userData.scrollParent;

      // --- PERBAIKAN DI SINI ---
      if (action === "scroll_up" || action === "scroll_down") {
        handleScrollClick(action, scrollParent); // Panggil fungsi scroll
      } else if (interactionCallback) {
        interactionCallback(action); // Kirim aksi lain ke main.js
      }
    }
  });

  // pointerup listener remains the same
  window.addEventListener("pointerup", () => {
    /* ... */
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
