# 🧠 Virtual Reality Hardware Learning App (WebXR + Three.js)

A WebXR-based interactive learning application for exploring computer hardware in 3D.  
Developed using **Three.js** and **WebXR**, following the **Multimedia Development Life Cycle (MDLC)** methodology.  
The app allows learners to interactively study computer hardware components through immersive, browser-based experiences — without requiring expensive VR devices.

---

## 🚀 Features
- 3D interactive visualization of computer hardware  
- Web-based VR mode (WebXR)  
- Audio narration using AI-generated voices  
- Lightweight and optimized 3D rendering (Draco + KTX2 compression)  
- Responsive control for both desktop and VR devices  

---

## 🧩 Technology Stack
| Category | Tools / Frameworks |
|-----------|--------------------|
| 3D Engine | Three.js |
| XR Support | WebXR API |
| Optimization | glTF-Transform, Draco, KTX2 |
| Modeling | Blender |
| Audio | Narakeet (AI TTS), YouTube Audio Library |
| Hosting | Cloudflare Pages / GitHub Pages |

---

## 🧱 Development Flow
1. 3D modeling in Blender (vertex reduction ±20%)  
2. Export as `.glb` format  
3. Optimize using **glTF-Transform**  
   - `optimize` (simplify structure)  
   - `draco` (geometry compression)  
   - `ktx2` (texture compression)  
4. Integrate into **Three.js + WebXR**  
5. Test and deploy on the web  

---

## 🎨 Credits & Licenses

### 🧱 3D Models
| Model | Source | Author | License |
|--------|--------|---------|----------|
| Motherboard | [Sketchfab](<!-- URL -->) | <!-- Author --> | CC BY 4.0 |
| CPU | [CGTrader](<!-- URL -->) | <!-- Author --> | Royalty Free |
| GPU | [Sketchfab](<!-- URL -->) | <!-- Author --> | CC BY 4.0 |
| Hard Drive | [Sketchfab](<!-- URL -->) | <!-- Author --> | CC BY 4.0 |

> Please note: All 3D models are used under their respective licenses. Attribution is given according to platform requirements.

---

### 🔊 Audio & Voice
| Source | Description | License / Credit |
|---------|-------------|------------------|
| [Narakeet](https://www.narakeet.com) | AI-generated voice narration | Licensed for educational/non-commercial use |
| [YouTube Audio Library](https://www.youtube.com/audiolibrary) | Background music & sound effects | Free to use with attribution |
| <!-- Add others if any --> |  |  |

---

### 🧰 Tools & Frameworks
- [Three.js](https://threejs.org/) – 3D rendering engine  
- [WebXR](https://immersive-web.github.io/webxr/) – Browser-based VR/AR support  
- [glTF-Transform](https://gltf-transform.donmccurdy.com/) – Model optimization CLI  
- [Blender](https://www.blender.org/) – 3D modeling and asset preparation  

---

## ⚖️ License
This project is licensed under the **MIT License**.  
You are free to use, modify, and distribute this project for educational or non-commercial purposes, provided that all attributions and credits remain intact.

---

## 🙌 Acknowledgements
Special thanks to:
- All creators on **Sketchfab** and **CGTrader** for providing high-quality 3D models.  
- **Narakeet** for AI voice narration services.  
- The open-source community of **Three.js** and **WebXR** developers.  

---

## 🧑‍💻 Author
**<!-- Nama Kamu -->**  
Undergraduate Research Project — Virtual Reality Learning Media  
Faculty of <!-- Fakultas / Universitas -->  
📧 <!-- email / optional -->

---

