export const components = [
  {
    label: "Pengantar",
    modelFile: null,
    audioFile: "assets/audio/intro.mp3",
    description: [
      "Hardware merupakan komponen fisik komputer yang bisa dilihat dan disentuh. Fungsinya meliputi menerima input (keyboard, mouse), memproses data (CPU), menyimpan data (SSD/HDD), serta memberikan output (monitor, printer). Semua komponen bekerja sama dalam sistem komputer.",
      "Sejarah hardware dimulai dari komputer awal 1940-an seperti ENIAC yang menggunakan tabung vakum besar. Teknologi transistor dan sirkuit terpadu pada 1960-an hingga 1970-an membuat perangkat menjadi lebih kecil dan efisien.",
      "Penemuan mikroprosesor pada 1970-an memungkinkan lahirnya komputer pribadi yang lebih kecil dan terjangkau. Sejak 1990-an, CPU semakin cepat, RAM bertambah besar, serta penyimpanan SSD mempercepat dan memudahkan akses data.",
      "Perkembangan perangkat mobile pun kian pesat, menjadikan komputer lebih cepat, efisien, dan mudah dibawa atau diakses di mana saja.",
    ],
    unlocked: true,
    quiz: [
      {
        question:
          "Komputer pertama seperti ENIAC menggunakan mikroprosesor modern.",
        answers: ["Salah", "Benar"],
        correctAnswerIndex: 0,
        explanation:
          "ENIAC menggunakan tabung vakum, bukan mikroprosesor yang baru ditemukan pada 1970-an.",
      },
    ],
  },
  {
    label: "Monitor",
    modelFile: "assets/models/monitor.glb",
    audioFile: "assets/audio/monitor.mp3",
    description: [
      "Monitor adalah perangkat output yang menampilkan data visual dari komputer, seperti teks dan gambar. Sejarahnya dimulai dari tabung sinar katoda (CRT) yang besar dan berat, teknologi awal dalam teknologi tampilan visual komputer.",
      "Perkembangan layar LCD dan LED kemudian menghadirkan monitor yang lebih tipis, hemat energi, dan berkualitas tinggi. Fitur modern seperti layar sentuh dan HDR kini menyempurnakan pengalaman pengguna.",
      "Monitor memproses sinyal digital menjadi tampilan visual yang dapat dilihat, memungkinkan pengguna berinteraksi dengan sistem operasi dan aplikasi.",
      "Selain menampilkan data, monitor juga membantu memantau status sistem seperti penggunaan CPU dan RAM serta mendukung multitasking dengan menampilkan banyak informasi sekaligus.",
    ],
    unlocked: false,
    quiz: [
      {
        question: "Teknologi monitor pertama adalah Layar Kristal Cair (LCD).",
        answers: ["Salah", "Benar"],
        correctAnswerIndex: 0,
        explanation:
          "Teknologi monitor pertama adalah tabung sinar katoda (CRT); LCD baru muncul kemudian.",
      },
    ],
  },
  {
    label: "Keyboard",
    modelFile: "assets/models/keyboard.glb",
    audioFile: "assets/audio/keyboard.mp3",
    description: [
      "Keyboard adalah perangkat input utama untuk memasukkan teks, angka, dan perintah ke komputer melalui tombol. Desainnya terinspirasi dari mesin ketik mekanik abad ke-19.",
      "Saat tombol ditekan, keyboard mengirim sinyal ke komputer untuk diolah menjadi perintah atau data digital. Keyboard menjadi alat penting dalam interaksi pengguna dengan komputer.",
      "Selain mengetik, keyboard juga digunakan untuk kontrol sistem dengan tombol fungsi dan shortcut yang memudahkan pekerjaan dan meningkatkan produktivitas.",
      "Keyboard juga mengontrol navigasi seperti menggulir layar dan menggerakkan kursor, bahkan mengoperasikan aplikasi dan permainan.",
    ],
    unlocked: false,
    quiz: [
      {
        question: "Inspirasi keyboard modern berasal dari mesin ketik.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 0,
        explanation:
          "Keyboard modern terinspirasi dari mesin ketik mekanik abad ke-19.",
      },
    ],
  },
  {
    label: "Mouse",
    modelFile: "assets/models/mouse.glb",
    audioFile: "assets/audio/mouse.mp3",
    description: [
      "Mouse adalah perangkat input penunjuk yang mengendalikan kursor pada layar. Diciptakan pada 1964 oleh Douglas Engelbart, model awal berupa kotak kayu dengan tombol dan roda metal.",
      "Mouse berfungsi untuk memilih objek, membuka menu konteks, menggulir halaman, dan drag and drop, memudahkan navigasi antarmuka grafis.",
      "Saat ini, mouse berkembang menjadi optik dan nirkabel dengan desain ergonomis untuk kenyamanan dan akurasi lebih baik.",
      "Perkembangan teknologi mouse juga meningkatkan fungsi dan memenuhi kebutuhan interaksi pengguna yang beragam dalam komputer modern.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "Mouse pertama kali ditemukan pada tahun 1964 oleh Douglas Engelbart.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 0,
        explanation:
          "Mouse pertama diciptakan Douglas Engelbart pada 1964, awalnya berbahan kayu.",
      },
    ],
  },
  {
    label: "Motherboard",
    modelFile: "assets/models/motherboard.glb",
    audioFile: "assets/audio/motherboard.mp3",
    description: [
      "Motherboard adalah papan sirkuit utama yang menghubungkan komponen seperti CPU, RAM, penyimpanan, dan kartu video agar dapat bekerja bersama secara harmonis.",
      "Fungsinya menyediakan jalur komunikasi serta distribusi daya bagi semua perangkat yang terhubung, menjadikannya fondasi utama komputer.",
      "Motherboard juga memiliki chip BIOS yang mengendalikan proses inisialisasi perangkat keras dan slot ekspansi untuk menambah komponen seperti kartu suara atau jaringan.",
      "Sejarah motherboard dimulai pada 1981 dengan IBM 'Planar Breadboard' yang menjadi dasar komputer pribadi pertama.",
    ],
    unlocked: false,
    quiz: [
      {
        question: "Motherboard adalah komponen opsional dalam sebuah komputer.",
        answers: ["Salah", "Benar"],
        correctAnswerIndex: 0,
        explanation:
          "Motherboard wajib ada untuk menghubungkan semua komponen penting komputer.",
      },
    ],
  },
  {
    label: "Processor (CPU)",
    modelFile: "assets/models/cpu.glb",
    audioFile: "assets/audio/cpu.mp3",
    description: [
      "CPU adalah otak komputer yang mengeksekusi instruksi dan memproses data dengan bantuan unit kontrol dan unit logika aritmatika (ALU).",
      "CPU mengatur pengambilan instruksi, proses perhitungan, serta menyimpan data sementara pada cache untuk mempercepat kerja.",
      "Awalnya, CPU menggunakan tabung vakum besar, lalu bertransformasi dengan transistor dan mikroprosesor Intel 4004 tahun 1971 menjadi lebih kecil dan efisien.",
      "Produsen seperti Intel, AMD, dan ARM terus mengembangkan CPU lebih cepat dan hemat energi hingga era modern saat ini.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "Intel 4004 adalah mikroprosesor pertama di dunia yang dirilis pada tahun 1971.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 0,
        explanation:
          "Intel 4004 adalah mikroprosesor pertama yang dirilis tahun 1971.",
      },
    ],
  },
  {
    label: "Memori",
    modelFile: "assets/models/ram.glb",
    audioFile: "assets/audio/ram.mp3",
    description: [
      "RAM (Random Access Memory) adalah memori sementara yang menyimpan data aktif agar CPU dapat mengakses dengan cepat. Semakin besar RAM, semakin lancar multitasking dan performa aplikasi.",
      "RAM bersifat volatil, data hilang saat komputer mati, berbeda dengan penyimpanan permanen seperti HDD atau SSD.",
      "Sejarah RAM dimulai dari tabung Williams 1947, berkembang ke memori inti magnetik dan DRAM yang ditemukan oleh Robert Dennard pada 1970-an.",
      "RAM sangat penting sebagai ruang kerja aktif untuk mempercepat proses dan menjalankan banyak aplikasi simultan.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "Data yang tersimpan di RAM akan tetap ada meskipun komputer dimatikan.",
        answers: ["Salah", "Benar"],
        correctAnswerIndex: 0,
        explanation:
          "RAM bersifat volatil, sehingga data hilang tanpa aliran listrik.",
      },
    ],
  },
  {
    label: "Kartu Grafis (GPU)",
    modelFile: "assets/models/gpu.glb",
    audioFile: "assets/audio/gpu.mp3",
    description: [
      "GPU adalah prosesor khusus yang mempercepat rendering gambar, video, dan animasi menggunakan ribuan inti yang bekerja paralel.",
      "GPU membantu melepaskan beban CPU, sangat penting untuk gaming, desain grafis, dan machine learning.",
      "Istilah GPU dipopulerkan NVIDIA tahun 1999 lewat GeForce 256 sebagai GPU pertama di dunia.",
      "GPU juga memainkan peran vital dalam AI dan deep learning dengan mempercepat pelatihan model kompleks.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "GPU hanya berfungsi untuk menampilkan teks dan tidak bisa memproses grafis 3D.",
        answers: ["Salah", "Benar"],
        correctAnswerIndex: 0,
        explanation: "GPU merender grafis 2D dan 3D dengan cepat dan efisien.",
      },
    ],
  },
  {
    label: "Kartu Jaringan",
    modelFile: "assets/models/kartu_jaringan.glb",
    audioFile: "assets/audio/kartu_jaringan.mp3",
    description: [
      "Kartu Jaringan (NIC) menghubungkan komputer ke jaringan seperti internet atau LAN, melalui kabel (Ethernet) atau nirkabel (Wi-Fi).",
      "NIC mengonversi data komputer ke sinyal jaringan dan sebaliknya, serta memiliki alamat fisik unik (MAC address) untuk identifikasi perangkat di jaringan.",
      "Sejarah NIC berkembang dari pengembangan Ethernet pada 1960-an hingga teknologi nirkabel saat ini, mendukung kecepatan data yang terus meningkat.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "Setiap kartu jaringan memiliki alamat fisik unik yang disebut MAC address.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 0,
        explanation:
          "MAC address adalah identitas unik kartu jaringan untuk komunikasi data.",
      },
    ],
  },
  {
    label: "Storage (HDD/SSD)",
    modelFile: "assets/models/storage.glb",
    audioFile: "assets/audio/storage.mp3",
    description: [
      "HDD adalah media penyimpanan mekanis menggunakan piringan magnetik berputar untuk simpan data permanen, ditemukan IBM 1956.",
      "SSD menggunakan chip memori flash tanpa bagian bergerak, lebih cepat, senyap, dan tahan goresan dibanding HDD.",
      "Keduanya menyimpan sistem operasi, aplikasi, dan file pribadi. SSD mempercepat booting dan loading, sementara HDD menawarkan kapasitas besar dengan harga terjangkau.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "SSD menyimpan data menggunakan piringan magnetik yang berputar.",
        answers: ["Salah", "Benar"],
        correctAnswerIndex: 0,
        explanation:
          "SSD memakai memori flash tanpa bagian bergerak; HDD yang memakai piringan magnetik.",
      },
    ],
  },
  {
    label: "Printer",
    modelFile: "assets/models/printer.glb",
    audioFile: "assets/audio/printer.mp3",
    description: [
      "Printer adalah perangkat output yang mengubah data digital menjadi salinan fisik (hardcopy) pada kertas, seperti teks dan gambar. Awal mula cetak dari mesin cetak Gutenberg abad ke-15, kemudian berkembang ke printer elektronik dan laser modern.",
      "Printer modern multifungsi dapat mencetak, memindai dokumen menjadi digital, menyalin, dan mengirim faks. Printer 3D kini bisa mencetak objek tiga dimensi dari desain digital, membuka banyak kemungkinan baru.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "Fungsi utama printer adalah mengubah dokumen fisik menjadi data digital.",
        answers: ["Salah", "Benar"],
        correctAnswerIndex: 0,
        explanation:
          "Printer mengubah data digital menjadi salinan fisik, sedangkan scanner fungsi sebaliknya.",
      },
    ],
  },
  {
    label: "Flashdisk",
    modelFile: "assets/models/flashdisk.glb",
    audioFile: "assets/audio/flashdisk.mp3",
    description: [
      "Flashdisk adalah perangkat penyimpanan data portabel dengan memori flash NAND yang non-volatil dan terhubung lewat USB. Ukurannya kecil, ringan, dan mudah dibawa, populer untuk transfer data dan backup cepat.",
      "Sejarah flashdisk dimulai dengan DiskOnKey M-Systems 1999. Kini kapasitas dan kecepatan flashdisk terus meningkat, memungkinkan penyimpanan file, menjalankan aplikasi portabel, dan instalasi sistem operasi.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "Flashdisk memerlukan daya listrik eksternal untuk menyimpan data secara permanen.",
        answers: ["Salah", "Benar"],
        correctAnswerIndex: 0,
        explanation:
          "Flashdisk menggunakan memori flash non-volatil yang menyimpan data tanpa perlu daya listrik.",
      },
    ],
  },
];
