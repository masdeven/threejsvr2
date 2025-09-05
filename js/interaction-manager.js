import * as THREE from "three";
import { scene, camera, renderer, controls } from "./scene-setup.js";
import { getVRControllers } from "./vr-manager.js";
import { uiGroup, viewerUIGroup, FONT } from "./ui-creator.js";

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let interactionCallback = null;
let lastIntersectedButton = null;

let draggingState = {
  isDragging: false,
  panel: null,
  lastPosition: 0,
};

function getIntersectedObject(x, y) {
  pointer.set(x, y);
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects([uiGroup, viewerUIGroup], true);
  if (intersects.length > 0) {
    const firstHit = intersects[0].object;
    if (firstHit.userData.isButton || firstHit.userData.isScrollable) {
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
    if (firstHit.userData.isButton || firstHit.userData.isScrollable) {
      return firstHit;
    }
  }
  return null;
}

function handleScroll(panel, delta) {
  const state = panel.userData.scrollState;
  if (!state || !panel.userData.isScrollable) return;
  const maxScroll = state.totalCanvasPixelHeight - state.visiblePixelHeight;
  if (maxScroll <= 0) return;
  state.currentScroll -= delta;
  state.currentScroll = Math.max(0, Math.min(state.currentScroll, maxScroll));
  const scrollableTextureRange = 1.0 - state.texture.repeat.y;
  state.texture.offset.y =
    maxScroll > 0
      ? (state.currentScroll / maxScroll) * scrollableTextureRange
      : 0;
  const { ctx, canvas, text, font, padding, maxWidth, lineHeight } = state;
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = font;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const words = text.split(" ");
  let line = "";
  let currentY = padding;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, padding, currentY);
      line = words[n] + " ";
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, padding, currentY);
  ctx.fillStyle = "#555";
  ctx.fillRect(canvas.width - 10, 0, 5, canvas.height);
  ctx.fillStyle = "#999";
  const scrollbarHeight =
    (state.visiblePixelHeight / canvas.height) * canvas.height;
  const scrollbarY =
    (state.currentScroll / maxScroll) * (canvas.height - scrollbarHeight);
  ctx.fillRect(canvas.width - 10, scrollbarY, 5, scrollbarHeight);
  state.texture.needsUpdate = true;
}

function redrawButton(button, color) {
  const data = button.userData;
  const ctx = data.canvasContext;
  const canvas = ctx.canvas;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const radius = 15;
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

  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = FONT;
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

export function setupInteraction(callback) {
  interactionCallback = callback;
  const domElement = renderer.domElement;
  domElement.addEventListener("pointermove", (event) => {
    if (draggingState.isDragging) return;
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;
    const intersectedObject = getIntersectedObject(x, y);
    handleHover(intersectedObject);
  });
  domElement.addEventListener("pointerdown", (event) => {
    const intersectedObject = getIntersectedObject(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );
    if (!intersectedObject) return;
    if (intersectedObject.userData.isButton) {
      if (interactionCallback)
        interactionCallback(intersectedObject.userData.action);
    }
  });
  window.addEventListener("pointerup", () => {
    if (draggingState.isDragging) {
      draggingState.isDragging = false;
      controls.enabled = true;
    }
  });
  const controllers = getVRControllers();
  controllers.forEach((controller) => {
    controller.addEventListener("selectstart", () => {
      const intersectedObject = getVRIntersectedObject(controller);
      if (!intersectedObject) return;
      if (intersectedObject.userData.isButton) {
        if (interactionCallback)
          interactionCallback(intersectedObject.userData.action);
      }
    });
    controller.addEventListener("selectend", () => {
      if (draggingState.isDragging) {
        draggingState.isDragging = false;
      }
    });
  });
}
export function handleVRHover() {
  const controllers = getVRControllers();
  let intersectedInFrame = null;

  // Cek kedua controller, ambil yang pertama kali berpotongan dengan objek
  for (const controller of controllers) {
    const intersectedObject = getVRIntersectedObject(controller);
    if (intersectedObject) {
      intersectedInFrame = intersectedObject;
      break; // Hentikan jika sudah menemukan objek
    }
  }

  handleHover(intersectedInFrame);
}
