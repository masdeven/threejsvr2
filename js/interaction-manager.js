import * as THREE from "three";
import { scene, camera, renderer, controls } from "./scene-setup.js";
import { getVRControllers, vrInteractionState } from "./vr-manager.js";
import {
  uiGroup,
  viewerUIGroup,
  FONT,
  getResolution,
  LOGICAL_RESOLUTION,
} from "./ui-creator.js";
import {
  startDragging,
  stopDragging,
  dragModel,
  getCurrentModel,
  rotateModelWithVR,
} from "./model-loader.js";
import { isVRMode } from "./vr-manager.js";

// ===============================================================
// KONSTANTA & STATE MODUL
// ===============================================================

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const raycasterDrag = new THREE.Raycaster();

let lastVRClickTime = 0;
const VR_CLICK_DEBOUNCE = 300;

// Warna
const DISABLED_COLOR = "#2727278a";
const BGCOLOR = "#000000ff"; // Warna default jika tidak ada
const HOVER_COLOR = "#4A5568";
const TEXT_COLOR = "#FFFFFF";

// State
let interactionCallback = null;
let lastIntersectedButton = null;

// ===============================================================
// FUNGSI INTERSEKSI (RAYCASTING)
// ===============================================================

/**
 * Mendapatkan objek UI (tombol) yang berpotongan dengan pointer mouse.
 * @param {number} x - Posisi pointer X (-1 hingga 1).
 * @param {number} y - Posisi pointer Y (-1 hingga 1).
 * @returns {THREE.Mesh | null} - Objek tombol yang berpotongan atau null.
 */
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

/**
 * Mendapatkan objek UI (tombol) yang berpotongan dengan controller VR.
 * @param {THREE.Object3D} controller - Controller VR.
 * @returns {THREE.Mesh | null} - Objek tombol yang berpotongan atau null.
 */
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

/**
 * Mendapatkan model 3D yang berpotongan dengan controller VR.
 * @param {THREE.Object3D} controller - Controller VR.
 * @returns {THREE.Object3D | null} - Objek model yang berpotongan atau null.
 */
function getVRIntersectedModel(controller) {
  const currentModel = getCurrentModel();
  if (!currentModel) return null;

  raycaster.setFromXRController(controller);
  const intersects = raycaster.intersectObject(currentModel, true);
  return intersects.length > 0 ? intersects[0].object : null;
}

// ===============================================================
// MANAJEMEN VISUAL & STATE TOMBOL
// ===============================================================

/**
 * Menggambar ulang canvas tekstur tombol dengan warna dan teks baru.
 * @param {THREE.Mesh} button - Objek tombol yang akan digambar ulang.
 * @param {string} color - Warna latar belakang baru.
 * @param {string | null} text - Teks baru (opsional, default ke teks asli).
 */
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

  const padding = 0; // Padding 0 seperti di kode asli

  if (shape === "circle") {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - padding;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    ctx.fill();
  } else {
    // Rounded rectangle
    const r = 10 * (buttonResolution / getResolution());
    const x = padding;
    const y = padding;
    const w = canvas.width - padding * 2;
    const h = canvas.height - padding * 2;
    const clampedR = Math.min(r, w / 2, h / 2);

    ctx.beginPath();
    ctx.moveTo(x + clampedR, y);
    ctx.lineTo(x + w - clampedR, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + clampedR);
    ctx.lineTo(x + w, y + h - clampedR);
    ctx.quadraticCurveTo(x + w, y + h, x + w - clampedR, y + h);
    ctx.lineTo(x + clampedR, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - clampedR);
    ctx.lineTo(x, y + clampedR);
    ctx.quadraticCurveTo(x, y, x + clampedR, y);
    ctx.closePath();
    ctx.fill();
  }

  // Gambar Teks
  ctx.fillStyle = TEXT_COLOR;
  const vrFontScale = 1;
  const resolution = getResolution();
  const fontStyle = shape === "circle" ? "normal" : FONT.split(" ")[0];
  let baseFontSize = height * resolution * 0.5;
  if (shape === "circle") {
    baseFontSize *= 1.2;
  }
  const finalFontSize = Math.floor(
    isVRMode() ? baseFontSize * vrFontScale : baseFontSize
  );
  ctx.font = `${fontStyle} ${finalFontSize}px Verdana, Geneva, sans-serif`;
  ctx.textBaseline = "middle"; // Tetapkan baseline

  const verticalOffset = shape === "circle" ? finalFontSize * 0.05 : 0;
  const buttonText = text || data.text;

  // === PERBAIKAN: Cek flag textAlign ===
  if (data.textAlign === "left") {
    // Jika ditandai "left" (dari createTopicButton)
    ctx.textAlign = "left";
    const logicalTextPadding = 20; // 20px padding logis
    const textPadding =
      logicalTextPadding * (buttonResolution / LOGICAL_RESOLUTION);
    ctx.fillText(buttonText, textPadding, canvas.height / 2 + verticalOffset);
  } else {
    // Perilaku default (rata tengah, untuk createButton biasa)
    ctx.textAlign = "center";
    ctx.fillText(
      buttonText,
      canvas.width / 2,
      canvas.height / 2 + verticalOffset
    );
  }

  button.material.map.needsUpdate = true;
}

/**
 * Mengatur status tombol (aktif atau nonaktif).
 * @param {THREE.Mesh} button - Objek tombol.
 * @param {boolean} enabled - True untuk aktif, false untuk nonaktif.
 * @param {string | null} text - Teks opsional untuk ditampilkan saat nonaktif (mis: "...").
 */
export function setButtonEnabled(button, enabled, text = null) {
  if (!button || !button.userData.isButton) return;

  const data = button.userData;

  if (enabled) {
    // Mengaktifkan tombol
    data.action = data.originalAction || data.action;
    data.colors = {
      default: data.colors?.default || BGCOLOR,
      hover: HOVER_COLOR,
    };
    redrawButton(button, data.colors.default, data.text);
    button.userData.currentState = "default";
  } else {
    // Menonaktifkan tombol
    data.originalAction = data.action; // Simpan aksi asli
    data.action = "locked";
    data.colors = null; // Hapus kemampuan hover
    redrawButton(button, DISABLED_COLOR, text || data.text);
    button.userData.currentState = "disabled";
  }
}

/**
 * Menangani logika visual saat tombol di-hover (oleh mouse atau VR controller).
 * @param {THREE.Mesh | null} intersectedObject - Tombol yang sedang di-hover, atau null.
 */
function handleHover(intersectedObject) {
  // Jika tombol sebelumnya tidak lagi di-hover, kembalikan ke state default
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

  // Jika tombol baru di-hover, ubah ke state hover
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

// ===============================================================
// PENANGANAN EVENT (EVENT HANDLERS)
// ===============================================================

/**
 * Menangani klik pada tombol scroll (hanya VR).
 * @param {string} action - "scroll_up" atau "scroll_down".
 * @param {THREE.Object3D} scrollParent - Objek parent yang berisi data scroll.
 */
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

    // Batasi scroll
    content.position.y = THREE.MathUtils.clamp(
      newY,
      scrollBounds.bottom,
      scrollBounds.top
    );
  }
}

/**
 * Handler untuk event 'click' mouse pada canvas.
 * @param {MouseEvent} event - Event mouse.
 */
function onClick(event) {
  if (isVRMode()) return;

  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);

  const intersects = raycaster.intersectObjects(scene.children, true);

  for (const intersect of intersects) {
    let interactableObject = intersect.object;
    // Cari parent yang memiliki 'userData.action'
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

/**
 * Handler untuk event 'pointerdown' (klik kiri mouse/tap) pada canvas.
 * @param {PointerEvent} event - Event pointer.
 */
function onPointerDown(event) {
  const x = (event.clientX / window.innerWidth) * 2 - 1;
  const y = -(event.clientY / window.innerHeight) * 2 + 1;

  // 1. Cek apakah mengklik UI
  const uiHit = getIntersectedObject(x, y);
  if (uiHit) {
    // Jika klik UI, jangan lakukan drag model
    return;
  }

  // 2. Cek apakah mengklik model
  const currentModel = getCurrentModel();
  if (!currentModel) return;

  pointer.x = x;
  pointer.y = y;
  raycasterDrag.setFromCamera(pointer, camera);

  const intersects = raycasterDrag.intersectObject(currentModel, true);

  if (intersects.length > 0) {
    // Klik pada model, nonaktifkan orbit controls dan mulai drag
    controls.enabled = false;
    startDragging(event);
  }
}

/**
 * Handler untuk event 'pointerup' (lepas klik mouse/tap) di mana saja.
 */
function onPointerUp() {
  if (!controls.enabled) {
    controls.enabled = true; // Aktifkan kembali orbit controls
  }
  stopDragging();
}

/**
 * Handler untuk event 'mousemove' pada canvas.
 * @param {MouseEvent} event - Event mouse.
 */
function onMouseMove(event) {
  if (isVRMode()) return;

  // Handle hover tombol UI
  const x = (event.clientX / window.innerWidth) * 2 - 1;
  const y = -(event.clientY / window.innerHeight) * 2 + 1;
  const intersectedObject = getIntersectedObject(x, y);
  handleHover(intersectedObject);
}

/**
 * Handler untuk event 'pointermove' (drag mouse) di mana saja.
 * @param {PointerEvent} event - Event pointer.
 */
function onPointerMove(event) {
  // Fungsi ini hanya memanggil dragModel,
  // isDragging akan dicek di dalam dragModel
  dragModel(event);
}

/**
 * Handler untuk event 'selectstart' (trigger down) pada controller VR.
 * @param {number} controllerIndex - 0 atau 1.
 */
function onVRSelectStart(controllerIndex) {
  const controller = getVRControllers()[controllerIndex];
  const state =
    controllerIndex === 0
      ? vrInteractionState.controller1
      : vrInteractionState.controller2;

  // 1. Cek apakah grab model
  const intersectedModel = getVRIntersectedModel(controller);
  if (intersectedModel) {
    state.isGrabbing = true;
    state.startPosition.copy(controller.position);
    return; // Prioritaskan grab model di atas klik UI
  }

  // 2. Cek apakah klik tombol UI
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
}

/**
 * Handler untuk event 'selectend' (trigger up) pada controller VR.
 * @param {number} controllerIndex - 0 atau 1.
 */
function onVRSelectEnd(controllerIndex) {
  const state =
    controllerIndex === 0
      ? vrInteractionState.controller1
      : vrInteractionState.controller2;
  if (state.isGrabbing) {
    state.isGrabbing = false;
  }
}

// ===============================================================
// FUNGSI SETUP UTAMA
// ===============================================================

/**
 * Mengatur semua event listener untuk interaksi mouse dan VR.
 * @param {function} callback - Fungsi callback yang akan dipanggil saat aksi UI dipicu.
 */
export function setupInteraction(callback) {
  interactionCallback = callback;
  const targetElement = renderer.domElement;

  // --- Event Listeners Desktop ---
  targetElement.addEventListener("click", onClick);
  targetElement.addEventListener("mousemove", onMouseMove);
  targetElement.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);

  // --- Event Listeners VR ---
  const controllers = getVRControllers();
  controllers.forEach((controller, index) => {
    controller.addEventListener("selectstart", () => onVRSelectStart(index));
    controller.addEventListener("selectend", () => onVRSelectEnd(index));
  });
}

// ===============================================================
// FUNGSI YANG DIPANGGIL DI RENDER LOOP (VR)
// ===============================================================

/**
 * Menangani logika hover untuk controller VR (dipanggil setiap frame).
 */
export function handleVRHover() {
  const controllers = getVRControllers();
  let intersectedInFrame = null;

  // Jika sedang grabbing model, jangan tunjukkan hover UI
  if (
    vrInteractionState.controller1.isGrabbing ||
    vrInteractionState.controller2.isGrabbing
  ) {
    handleHover(null);
    return;
  }

  // Cek interseksi untuk kedua controller
  for (const controller of controllers) {
    const intersectedObject = getVRIntersectedObject(controller);
    if (intersectedObject) {
      intersectedInFrame = intersectedObject;
      break; // Hanya satu hover yang bisa aktif
    }
  }
  handleHover(intersectedInFrame);
}

/**
 * Menangani logika drag model dengan controller VR (dipanggil setiap frame).
 */
export function handleVRDrag() {
  const controllers = getVRControllers();

  controllers.forEach((controller, index) => {
    const state =
      index === 0
        ? vrInteractionState.controller1
        : vrInteractionState.controller2;

    if (state.isGrabbing) {
      const currentPosition = controller.position;
      // Hitung delta (perbedaan) dari frame sebelumnya
      const deltaX = currentPosition.x - state.startPosition.x;
      const deltaY = currentPosition.y - state.startPosition.y;

      // Rotasi model berdasarkan delta
      rotateModelWithVR(deltaX, deltaY);

      // Simpan posisi saat ini untuk perhitungan delta di frame berikutnya
      state.startPosition.copy(currentPosition);
    }
  });
}
