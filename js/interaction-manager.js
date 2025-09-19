import * as THREE from "three";
import { scene, camera, renderer, controls } from "./scene-setup.js";
// --- MODIFIKASI ---
import { getVRControllers, vrInteractionState } from "./vr-manager.js";
import { uiGroup, viewerUIGroup, FONT, getResolution } from "./ui-creator.js";
import {
  startDragging,
  stopDragging,
  dragModel,
  getCurrentModel,
  // --- BARU ---
  rotateModelWithVR,
  // --- AKHIR BARU ---
} from "./model-loader.js";
// --- MODIFIKASI ---
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

// --- BARU ---
function getVRIntersectedModel(controller) {
  const currentModel = getCurrentModel();
  if (!currentModel) return null;

  raycaster.setFromXRController(controller);
  const intersects = raycaster.intersectObject(currentModel, true);
  return intersects.length > 0 ? intersects[0].object : null;
}
// --- AKHIR BARU ---

function redrawButton(button, color) {
  const data = button.userData;
  const ctx = data.canvasContext;
  const canvas = ctx.canvas;
  const width = button.geometry.parameters.width;
  const height = button.geometry.parameters.height;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const buttonResolution = getResolution() * 2;
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
    const radius = 20 * (buttonResolution / getResolution());
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

  // --- DITAMBAHKAN: Menggunakan logika font yang SAMA seperti createButton ---
  const vrFontScale = 1.2;
  const resolution = getResolution();
  const fontStyle = shape === "circle" ? "normal" : FONT.split(" ")[0];

  let baseFontSize = height * resolution * 1;

  if (shape === "circle") {
    baseFontSize *= 1.2;
  }

  const finalFontSize = Math.floor(
    isVRMode() ? baseFontSize * vrFontScale : baseFontSize
  );
  ctx.font = `${fontStyle} ${finalFontSize}px Arial`;
  // --- AKHIR PENAMBAHAN ---

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // --- PENYESUAIAN UNTUK PUSAT IKON ---
  // Menambahkan sedikit offset vertikal untuk beberapa ikon/karakter
  const verticalOffset = shape === "circle" ? finalFontSize * 0.05 : 0;
  ctx.fillText(data.text, canvas.width / 2, canvas.height / 2 + verticalOffset);
  // --- AKHIR PENYESUAIAN ---

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
  controllers.forEach((controller, index) => {
    // --- MODIFIKASI ---
    controller.addEventListener("selectstart", () => {
      // --- AWAL MODIFIKASI VR DRAG ---
      const state =
        index === 0
          ? vrInteractionState.controller1
          : vrInteractionState.controller2;
      const intersectedModel = getVRIntersectedModel(controller);

      if (intersectedModel) {
        state.isGrabbing = true;
        state.startPosition.copy(controller.position);
        return; // Hentikan eksekusi agar tidak memproses klik UI
      }
      // --- AKHIR MODIFIKASI VR DRAG ---

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

    // --- MODIFIKASI selectend ---
    controller.addEventListener("selectend", () => {
      const state =
        index === 0
          ? vrInteractionState.controller1
          : vrInteractionState.controller2;
      if (state.isGrabbing) {
        state.isGrabbing = false;
      }
    });
    // --- AKHIR MODIFIKASI selectend ---
  });
}

export function handleVRHover() {
  const controllers = getVRControllers();
  let intersectedInFrame = null;
  // Jangan proses hover jika sedang grabbing
  if (
    vrInteractionState.controller1.isGrabbing ||
    vrInteractionState.controller2.isGrabbing
  ) {
    handleHover(null); // Kosongkan hover
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

// --- BARU ---
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

      // Perbarui posisi awal untuk frame berikutnya
      state.startPosition.copy(currentPosition);
    }
  });
}
// --- AKHIR BARU ---
