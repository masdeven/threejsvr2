# VR-Based Computer Hardware Learning Application (WebXR + Three.js)

Aplikasi pembelajaran interaktif berbasis WebXR untuk menjelajahi perangkat keras komputer dalam 3D. Dikembangkan menggunakan **Three.js** dan **WebXR** dengan metodologi **Multimedia Development Life Cycle (MDLC)**, aplikasi ini memungkinkan pelajar untuk mempelajari komponen perangkat keras komputer secara interaktif melalui pengalaman berbasis browser yang imersif—tanpa memerlukan perangkat VR yang mahal.

---

## Features

- Visualisasi 3D interaktif dari perangkat keras komputer
- Mode VR berbasis web (WebXR)
- Narasi audio menggunakan suara yang dihasilkan AI
- Rendering 3D yang ringan dan dioptimalkan (kompresi Draco + KTX2)
- Kontrol responsif untuk perangkat desktop dan VR

---

## Tech Stack

| Kategori        | Alat / Kerangka Kerja                    |
| :-------------- | :--------------------------------------- |
| **Mesin 3D**    | Three.js                                 |
| **Dukungan XR** | WebXR API                                |
| **Optimisasi**  | glTF-Transform, Draco, KTX2              |
| **Pemodelan**   | Blender                                  |
| **Audio**       | Narakeet (AI TTS), YouTube Audio Library |
| **Hosting**     | Cloudflare Pages / GitHub Pages          |

---

## Development Workflow

1.  Pemodelan 3D di Blender (pengurangan verteks ±20%)
2.  Ekspor sebagai format `.glb`
3.  Optimalkan menggunakan **glTF-Transform**
    - `optimize` (menyederhanakan struktur)
    - `draco` (kompresi geometri)
    - `ktx2` (kompresi tekstur)
4.  Integrasikan ke dalam **Three.js + WebXR**
5.  Uji dan deploy di web

---

## Credits & Licensing

### 3D Models

| Model              | Sumber                                                                                                                      | 3D Artist / Modeler    | Lisensi                    |
| :----------------- | :-------------------------------------------------------------------------------------------------------------------------- | :--------------------- | :------------------------- |
| **Monitor**        | [Sketchfab](https://sketchfab.com/3d-models/rigged-monitor-iiyama-gb2770hsu-free-download-bca1aef8e0424cc3baf4369beec3b6a8) | BlendedPopcorn         | CC BY 4.0                  |
| **Keyboard**       | [CGTrader](https://www.cgtrader.com/free-3d-models/electronics/computer/mechanical-keybord)                                 | autho                  | Royalty Free No Ai License |
| **Mouse**          | [Sketchfab](https://sketchfab.com/3d-models/mouse-ef4c6dfb6de44d0c9bd200a64c8c1a73)                                         | Mukhesh                | CC BY 4.0                  |
| **Printer**        | [Sketchfab](https://sketchfab.com/3d-models/epson-printer-model-752da10ef09a4f4782aa6c38a82f4b26)                           | zafry                  | CC BY 4.0                  |
| **Storage**        | [Sketchfab](https://sketchfab.com/3d-models/ssd-noname-sata-5a182a80361f407e965adaaee077e3cd)                               | Хлюпич                 | CC BY 4.0                  |
| **Motherboard**    | [Sketchfab](https://sketchfab.com/3d-models/dream-computer-setup-82f78bbaf2d34f01af854a52151dbf49)                          | Daniel Cardona         | CC BY 4.0                  |
| **CPU**            | [Sketchfab](https://sketchfab.com/3d-models/am4-cpu-free-912c9c42d2dc40fe95574345aae51ea0)                                  | Igor.Jop               | CC BY 4.0                  |
| **Kartu Jaringan** | [Sketchfab](https://sketchfab.com/3d-models/network-interface-card-191c8ad40de2430980b879615aa0d2e3)                        | ARComputerFundamentals | CC BY 4.0                  |
| **GPU**            | [Sketchfab](https://sketchfab.com/3d-models/dream-computer-setup-82f78bbaf2d34f01af854a52151dbf49)                          | Daniel Cardona         | CC BY 4.0                  |
| **RAM**            | [Sketchfab](https://sketchfab.com/3d-models/dream-computer-setup-82f78bbaf2d34f01af854a52151dbf49)                          | Daniel Cardona         | CC BY 4.0                  |
| **Flask Drive**    | [Sketchfab](https://sketchfab.com/3d-models/flash-drive-ecc57ae0430f4786845a6f76ae924268)                                   | Blender3D              | CC BY 4.0                  |
| **Avatar**         | [Sketchfab](https://sketchfab.com/3d-models/low-poly-guardian-8df18d89b3354cd88c2fea99c2c2048a)                             | Akash Sisodiya         | CC BY 4.0                  |
| **Ruangan**        | [Sketchfab](https://sketchfab.com/3d-models/vr-round-art-gallery-3af1b679f52042fc9c40c901a6fed81b)                          | Maxim Mavrichev        | CC BY 4.0                  |

> Perlu diketahui: Semua model 3D digunakan di bawah lisensi masing-masing. Atribusi diberikan sesuai dengan persyaratan platform.

---

### Audio & Voice

| Sumber                                                                                                                | Deskripsi    |
| :-------------------------------------------------------------------------------------------------------------------- | :----------- |
| **[Narakeet](https://www.narakeet.com)**                                                                              | Narasi suara |
| **[YouTube - BreakingCopyright — Royalty Free Music](https://www.youtube.com/watch?v=pBEdwmP8B4o&list=LL&index=17s)** | Musik latar  |
| **[Pixabay](https://pixabay.com/id/)**                                                                                | Efek suara   |
|                                                                                                                       |              |

---

### Tools & Frameworks

- [Three.js](https://threejs.org/) – Mesin rendering 3D
- [WebXR](https://immersiveweb.dev/) – Dukungan VR/AR berbasis browser
- [glTF-Transform](https://gltf-transform.dev/) – CLI optimisasi model
- [Blender](https://www.blender.org/) – Pemodelan 3D dan persiapan aset

---

## License

Proyek ini dilisensikan di bawah **Lisensi MIT**. Anda bebas menggunakan, memodifikasi, dan mendistribusikan proyek ini untuk tujuan pendidikan atau non-komersial, dengan syarat semua atribusi dan kredit tetap utuh.

---

## Acknowledgments

Terima kasih khusus kepada:

- Semua kreator di **Sketchfab** dan **CGTrader** yang telah menyediakan model 3D berkualitas tinggi.
- **Narakeet** untuk layanan narasi suara AI.
- Komunitas sumber terbuka dari para pengembang **Three.js** dan **WebXR**.

---

## Authors

**Falachul Akhadihima Ibrahaical**

Proyek Skripsi — IMPLEMENTASI THREE.JS DAN WEBXR DALAM PENGEMBANGAN APLIKASI VIRTUAL REALITY (VR) UNTUK PENGENALAN
PERANGKAT KERAS KOMPUTER
_Program Studi Teknik Infromatika_
_Fakultas Teknologi dan Desain, Universitas Ma Chung_

---

Proyek Penelitian Sarjana 📧
