import * as THREE from "three";
import { scene, camera, renderer, controls } from "./scene-setup.js";
import { getVRControllers, vrInteractionState } from "./vr-manager.js";
import { uiGroup, viewerUIGroup, FONT, getResolution } from "./ui-creator.js";
import {
  startDragging,
  stopDragging,
  dragModel,
  getCurrentModel,
  rotateModelWithVR,
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

function getVRIntersectedModel(controller) {
  const currentModel = getCurrentModel();
  if (!currentModel) return null;

  raycaster.setFromXRController(controller);
  const intersects = raycaster.intersectObject(currentModel, true);
  return intersects.length > 0 ? intersects[0].object : null;
}

function redrawButton(button, color, text = null) {
  const data = button.userData;
  const ctx = data.canvasContext;
  const canvas = ctx.canvas;
  const width = button.geometry.parameters.width;
  const height = button.geometry.parameters.height;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const buttonResolution = getResolution();
  const shape = width === height ? "circle" : "roundedRectangle";
  ctx.fillStyle = color;

  if (shape === "circle") {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    ctx.fill();
  } else {
    const radius = 10 * (buttonResolution / getResolution());
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

  const vrFontScale = 1;
  const resolution = getResolution();
  const fontStyle = shape === "circle" ? "normal" : FONT.split(" ")[0];

  let baseFontSize = height * resolution * 0.5; // Dari 1 → 0.55
  if (shape === "circle") {
    baseFontSize *= 1.2; // Dari 1.2 → 1.0
  }

  const finalFontSize = Math.floor(
    isVRMode() ? baseFontSize * vrFontScale : baseFontSize
  );
  ctx.font = `${fontStyle} ${finalFontSize}px Verdana, Geneva, sans-serif`;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const verticalOffset = shape === "circle" ? finalFontSize * 0.05 : 0;
  ctx.fillText(
    text || data.text,
    canvas.width / 2,
    canvas.height / 2 + verticalOffset
  );

  button.material.map.needsUpdate = true;
}

export function setButtonEnabled(button, enabled, text = null) {
  if (!button || !button.userData.isButton) return;

  const DISABLED_COLOR = "#4A5568";
  const BGCOLOR = "#2D3748"; // Tambahkan konstanta ini
  const data = button.userData;

  if (enabled) {
    // Enable button - restore functionality
    data.action = data.originalAction || data.action;
    data.colors = {
      default: data.colors?.default || BGCOLOR,
      hover: "#4A5568",
    };
    redrawButton(button, data.colors.default, data.text);
    button.userData.currentState = "default";
  } else {
    // Disable button - remove hover capability
    data.originalAction = data.action;
    data.action = "locked";
    data.colors = null; // Set null agar tidak bisa hover
    redrawButton(button, DISABLED_COLOR, text || data.text);
    button.userData.currentState = "disabled";
  }
}

function handleHover(intersectedObject) {
  if (lastIntersectedButton && lastIntersectedButton !== intersectedObject) {
    if (
      lastIntersectedButton.userData.isButton &&
      lastIntersectedButton.userData.colors &&
      lastIntersectedButton.userData.currentState !== "default"
    ) {
      redrawButton(
        lastIntersectedButton,
        lastIntersectedButton.userData.colors.default
      );
      lastIntersectedButton.userData.currentState = "default";
    }
  }

  if (intersectedObject && intersectedObject !== lastIntersectedButton) {
    if (
      intersectedObject.userData.isButton &&
      intersectedObject.userData.colors &&
      intersectedObject.userData.currentState !== "hover"
    ) {
      redrawButton(intersectedObject, intersectedObject.userData.colors.hover);
      intersectedObject.userData.currentState = "hover";
    }
  }

  lastIntersectedButton = intersectedObject;
}

function handleScrollClick(action, scrollParent) {
  if (scrollParent && scrollParent.userData.isScrollable) {
    const { content, scrollBounds } = scrollParent.userData;
    const scrollStep = 0.2;

    let newY = content.position.y;
    if (action === "scroll_up") {
      newY += scrollStep;
    } else {
      newY -= scrollStep;
    }

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
    handleHover(intersectedObject);
  });

  const raycasterDrag = new THREE.Raycaster();

  targetElement.addEventListener("pointerdown", (event) => {
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;
    const uiHit = getIntersectedObject(x, y);
    if (uiHit) {
      return;
    }
    const currentModel = getCurrentModel();
    if (!currentModel) return;

    pointer.x = x;
    pointer.y = y;
    raycasterDrag.setFromCamera(pointer, camera);

    const intersects = raycasterDrag.intersectObject(currentModel, true);

    if (intersects.length > 0) {
      controls.enabled = false;
      startDragging(event);
    }
  });

  window.addEventListener("pointermove", (event) => {
    dragModel(event);
  });

  window.addEventListener("pointerup", () => {
    if (!controls.enabled) {
      controls.enabled = true;
    }
    stopDragging();
  });

  const controllers = getVRControllers();
  controllers.forEach((controller, index) => {
    controller.addEventListener("selectstart", () => {
      const state =
        index === 0
          ? vrInteractionState.controller1
          : vrInteractionState.controller2;
      const intersectedModel = getVRIntersectedModel(controller);

      if (intersectedModel) {
        state.isGrabbing = true;
        state.startPosition.copy(controller.position);
        return;
      }

      const intersectedObject = getVRIntersectedObject(controller);

      if (intersectedObject && intersectedObject.userData.isButton) {
        const action = intersectedObject.userData.action;
        const scrollParent = intersectedObject.userData.scrollParent;

        if (action === "scroll_up" || action === "scroll_down") {
          handleScrollClick(action, scrollParent);
        } else if (interactionCallback && action) {
          interactionCallback(action);
        }
      }
    });

    controller.addEventListener("selectend", () => {
      const state =
        index === 0
          ? vrInteractionState.controller1
          : vrInteractionState.controller2;
      if (state.isGrabbing) {
        state.isGrabbing = false;
      }
    });
  });
}

export function handleVRHover() {
  const controllers = getVRControllers();
  let intersectedInFrame = null;
  if (
    vrInteractionState.controller1.isGrabbing ||
    vrInteractionState.controller2.isGrabbing
  ) {
    handleHover(null);
    return;
  }
  for (const controller of controllers) {
    const intersectedObject = getVRIntersectedObject(controller);
    if (intersectedObject) {
      intersectedInFrame = intersectedObject;
      break;
    }
  }
  handleHover(intersectedInFrame);
}

export function handleVRDrag() {
  const controllers = getVRControllers();

  controllers.forEach((controller, index) => {
    const state =
      index === 0
        ? vrInteractionState.controller1
        : vrInteractionState.controller2;
    if (state.isGrabbing) {
      const currentPosition = controller.position;
      const deltaX = currentPosition.x - state.startPosition.x;
      const deltaY = currentPosition.y - state.startPosition.y;

      rotateModelWithVR(deltaX, deltaY);

      state.startPosition.copy(currentPosition);
    }
  });
}
