export const components = [
  {
    label: "Pengantar",
    modelFile: null,
    audioFile: "assets/audio/intro.mp3",
    description: [
      "Perangkat keras (hardware) adalah komponen fisik dari sebuah komputer yang dapat dilihat dan disentuh. Fungsinya mencakup empat tugas utama: menerima input (seperti dari keyboard), memproses data (dengan CPU), menyimpan data (pada SSD/HDD), dan menghasilkan output (melalui monitor). Komponen-komponen ini bekerja sama untuk menjalankan sistem.",
      "Sejarah hardware dimulai pada tahun 1940-an dengan komputer seperti ENIAC yang menggunakan tabung vakum besar. Era transistor pada tahun 60-an membuat ukurannya menyusut, hingga penemuan mikroprosesor pada tahun 1970-an yang menjadi cikal bakal komputer pribadi modern yang kita kenal saat ini.",
      "Era modern sejak 1990-an ditandai oleh inovasi pesat: CPU yang jauh lebih cepat, RAM berkapasitas besar, dan penyimpanan SSD yang efisien. Perkembangan ini tidak hanya meningkatkan kekuatan komputer desktop tetapi juga memicu revolusi perangkat mobile yang ringkas dan bertenaga.",
    ],
    unlocked: true,
    quiz: [
      {
        question:
          "Komputer pertama seperti ENIAC menggunakan mikroprosesor modern.",
        answers: ["Salah", "Benar"],
        correctAnswerIndex: 0,
        explanation:
          "Komputer awal seperti ENIAC menggunakan tabung vakum, bukan mikroprosesor yang baru ditemukan pada tahun 1970-an.",
      },
    ],
  },
  {
    label: "Monitor",
    modelFile: "assets/models/monitor.glb",
    audioFile: "assets/audio/monitor.mp3",
    description: [
      "Monitor adalah perangkat output utama yang menampilkan informasi visual dari komputer, seperti teks dan gambar. Sejarahnya dimulai dengan teknologi tabung sinar katoda (CRT) yang besar dan berat, menjadikannya komponen esensial untuk interaksi pengguna dengan sistem operasi dan aplikasi.",
      "Evolusi monitor melahirkan teknologi Liquid Crystal Display (LCD) dan Light Emitting Diode (LED) yang menawarkan desain lebih ramping, konsumsi daya lebih rendah, dan kualitas gambar lebih superior. Fitur modern seperti layar sentuh (touchscreen) dan High Dynamic Range (HDR) semakin memperkaya pengalaman visual pengguna.",
    ],
    unlocked: false,
    quiz: [
      {
        question: "Teknologi monitor pertama adalah Layar Kristal Cair (LCD).",
        answers: ["Salah", "Benar"],
        correctAnswerIndex: 0,
        explanation:
          "Sejarah monitor dimulai dari penemuan tabung sinar katoda (CRT), teknologi LCD baru muncul setelahnya.",
      },
    ],
  },
  {
    label: "Keyboard",
    modelFile: "assets/models/keyboard.glb",
    audioFile: "assets/audio/keyboard.mp3",
    description: [
      "Keyboard adalah perangkat input utama yang memungkinkan pengguna memasukkan teks, angka, dan perintah ke dalam komputer. Desainnya terinspirasi dari mesin ketik mekanis dari abad ke-19. Saat sebuah tombol ditekan, keyboard akan mengirimkan sinyal spesifik ke komputer untuk diproses lebih lanjut.",
      "Selain untuk mengetik, keyboard juga berfungsi untuk kontrol sistem melalui tombol fungsi (F1-F12) dan pintasan (shortcut) seperti Ctrl+C untuk menyalin. Penggunaan pintasan ini dapat secara signifikan mempercepat alur kerja dan meningkatkan produktivitas pengguna dalam bernavigasi antar aplikasi.",
    ],
    unlocked: false,
    quiz: [
      {
        question: "Inspirasi keyboard modern berasal dari mesin ketik.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 0,
        explanation:
          "Keyboard modern terinspirasi dari mesin ketik mekanik yang populer pada abad ke-19.",
      },
    ],
  },
  {
    label: "Mouse",
    modelFile: "assets/models/mouse.glb",
    audioFile: "assets/audio/mouse.mp3",
    description: [
      "Mouse adalah perangkat input penunjuk (pointing device) yang berfungsi untuk mengontrol pergerakan kursor di layar. Diciptakan oleh Douglas Engelbart pada tahun 1964, model pertamanya terbuat dari kayu. Mouse menyederhanakan navigasi dalam antarmuka pengguna grafis (GUI).",
      "Fungsi utamanya meliputi memilih objek (klik kiri), membuka menu konteks (klik kanan), dan menggulir halaman (scroll wheel). Fitur 'drag and drop' juga sangat bergantung pada mouse. Kini, mouse telah berevolusi dari model mekanis menjadi optik dan nirkabel untuk akurasi dan kenyamanan yang lebih baik.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "Mouse pertama kali ditemukan pada tahun 1964 oleh Douglas Engelbart.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 0,
        explanation:
          "Mouse pertama kali diciptakan oleh Douglas Engelbart pada tahun 1964, awalnya terbuat dari kayu.",
      },
    ],
  },
  {
    label: "Motherboard",
    modelFile: "assets/models/motherboard.glb",
    audioFile: "assets/audio/motherboard.mp3",
    description: [
      "Motherboard atau mainboard adalah papan sirkuit utama yang menjadi fondasi sebuah komputer. Komponen ini berfungsi sebagai pusat penghubung yang mengintegrasikan semua perangkat keras penting lainnya, seperti CPU, RAM, kartu grafis, dan perangkat penyimpanan agar dapat saling berkomunikasi.",
      "Selain menyediakan slot dan port untuk semua komponen, motherboard juga bertanggung jawab mendistribusikan daya listrik dan mengatur aliran data melalui jalur sirkuitnya yang disebut 'bus'. Tanpa motherboard, sebuah komputer tidak akan dapat berfungsi sebagai satu sistem yang utuh.",
      "Motherboard juga dilengkapi dengan chip BIOS atau UEFI, yaitu firmware yang melakukan inisialisasi perangkat keras saat komputer pertama kali dinyalakan. Terdapat juga slot ekspansi seperti PCI Express yang memungkinkan pengguna menambah komponen tambahan seperti kartu suara atau kartu jaringan.",
    ],
    unlocked: false,
    quiz: [
      {
        question: "Motherboard adalah komponen opsional dalam sebuah komputer.",
        answers: ["Salah", "Benar"],
        correctAnswerIndex: 0,
        explanation:
          "Motherboard adalah papan sirkuit utama yang wajib ada untuk menghubungkan semua komponen penting komputer.",
      },
    ],
  },
  {
    label: "Processor (CPU)",
    modelFile: "assets/models/cpu.glb",
    audioFile: "assets/audio/cpu.mp3",
    description: [
      "CPU (Central Processing Unit) sering disebut sebagai 'otak' komputer. Ini adalah komponen inti yang bertanggung jawab untuk mengeksekusi instruksi dari perangkat lunak dan melakukan sebagian besar pemrosesan data. Kecepatan CPU, yang diukur dalam Gigahertz (GHz), sangat memengaruhi kinerja sistem secara keseluruhan.",
      "Di dalam CPU terdapat dua unit utama: Arithmetic Logic Unit (ALU) yang menangani operasi matematika dan logika, serta Control Unit (CU) yang mengatur dan mengoordinasikan semua aktivitas di dalam prosesor. Sejarahnya dimulai dari Intel 4004 pada 1971, mikroprosesor pertama di dunia.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "Intel 4004 adalah mikroprosesor pertama di dunia yang dirilis pada tahun 1971.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 0,
        explanation:
          "Mikroprosesor pertama, Intel 4004, yang dirilis pada tahun 1971, menjadi tonggak sejarah dalam evolusi CPU.",
      },
    ],
  },
  {
    label: "Memori",
    modelFile: "assets/models/ram.glb",
    audioFile: "assets/audio/ram.mp3",
    description: [
      "RAM (Random Access Memory) adalah jenis memori berkecepatan tinggi yang berfungsi sebagai tempat penyimpanan sementara untuk data yang sedang aktif digunakan oleh CPU. Semakin besar kapasitas RAM, semakin banyak aplikasi yang dapat dijalankan secara bersamaan (multitasking) dengan lancar.",
      "Sifat utama RAM adalah 'volatil', yang berarti semua data yang tersimpan di dalamnya akan hilang ketika komputer dimatikan. Karena itu, RAM berbeda dengan media penyimpanan jangka panjang seperti SSD atau HDD yang bersifat 'non-volatil' atau permanen.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "Data yang tersimpan di RAM akan tetap ada meskipun komputer dimatikan.",
        answers: ["Salah", "Benar"],
        correctAnswerIndex: 0,
        explanation:
          "RAM bersifat volatil, yang berarti data akan hilang saat komputer tidak mendapatkan daya listrik.",
      },
    ],
  },
  {
    label: "Kartu Grafis (GPU)",
    modelFile: "assets/models/gpu.glb",
    audioFile: "assets/audio/gpu.mp3",
    description: [
      "GPU (Graphics Processing Unit) adalah prosesor khusus yang dirancang untuk mempercepat rendering gambar, video, dan animasi untuk ditampilkan di monitor. GPU mengambil beban kerja grafis dari CPU, sehingga memungkinkan kinerja sistem yang lebih baik, terutama saat bermain game atau desain grafis.",
      "Kekuatan utama GPU terletak pada kemampuannya melakukan 'komputasi paralel', yaitu memproses ribuan tugas kecil secara serentak berkat ribuan inti prosesor di dalamnya. Istilah GPU dipopulerkan oleh NVIDIA pada tahun 1999 dengan peluncuran GeForce 256.",
      "Selain untuk gaming dan desain, GPU kini juga memainkan peran krusial dalam bidang kecerdasan buatan (AI) dan machine learning. Kemampuan komputasi paralelnya sangat efisien untuk melatih model AI yang kompleks, jauh lebih cepat daripada jika hanya mengandalkan CPU.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "GPU hanya berfungsi untuk menampilkan teks dan tidak bisa memproses grafis 3D.",
        answers: ["Salah", "Benar"],
        correctAnswerIndex: 0,
        explanation:
          "Fungsi utama GPU adalah merender grafis dua dan tiga dimensi (3D) dengan cepat dan efisien.",
      },
    ],
  },
  {
    label: "Kartu Jaringan",
    modelFile: "assets/models/kartu_jaringan.glb",
    audioFile: "assets/audio/kartu_jaringan.mp3",
    description: [
      "Kartu Jaringan atau NIC (Network Interface Card) adalah komponen perangkat keras yang memungkinkan komputer terhubung ke sebuah jaringan, seperti internet atau jaringan lokal (LAN). Kartu ini tersedia dalam dua jenis utama: Ethernet untuk koneksi kabel dan Wi-Fi untuk koneksi nirkabel.",
      "Fungsi utamanya adalah menerjemahkan data digital dari komputer menjadi sinyal yang dapat dikirim melalui jaringan, dan sebaliknya. Setiap kartu jaringan memiliki alamat fisik unik yang disebut MAC (Media Access Control) address, yang berfungsi sebagai identitas unik perangkat di jaringan.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "Setiap kartu jaringan memiliki alamat fisik unik yang disebut MAC address.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 0,
        explanation:
          "Kartu jaringan menggunakan MAC address sebagai pengenal unik untuk mengirim dan menerima data di jaringan.",
      },
    ],
  },
  {
    label: "Storage (HDD/SDD)",
    modelFile: "assets/models/storage.glb",
    audioFile: "assets/audio/storage.mp3",
    description: [
      "Perangkat penyimpanan (storage) adalah komponen yang menyimpan data secara permanen (non-volatil), bahkan saat komputer mati. Ini termasuk sistem operasi, aplikasi, dan semua file pribadi Anda. Dua jenis utama yang paling umum digunakan saat ini adalah HDD dan SSD.",
      "HDD (Hard Disk Drive) adalah teknologi penyimpanan tradisional yang menggunakan piringan magnetik berputar dan lengan mekanis untuk membaca/menulis data. HDD menawarkan kapasitas besar dengan harga yang lebih terjangkau, namun lebih lambat dan rentan terhadap guncangan fisik.",
      "SSD (Solid State Drive) adalah teknologi yang lebih modern dan tidak memiliki bagian bergerak. SSD menggunakan chip memori flash untuk menyimpan data, membuatnya jauh lebih cepat, lebih senyap, dan lebih tahan lama daripada HDD. Kecepatan SSD secara drastis mengurangi waktu booting dan loading aplikasi.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "SSD menyimpan data menggunakan piringan magnetik yang berputar.",
        answers: ["Salah", "Benar"],
        correctAnswerIndex: 0,
        explanation:
          "SSD menggunakan chip memori flash tanpa bagian bergerak, sedangkan HDD yang menggunakan piringan magnetik.",
      },
    ],
  },
  {
    label: "Printer",
    modelFile: "assets/models/printer.glb",
    audioFile: "assets/audio/printer.mp3",
    description: [
      "Printer adalah perangkat output yang berfungsi untuk mencetak data digital dari komputer ke media fisik, biasanya kertas. Hasil cetakan ini disebut 'hardcopy'. Teknologi cetak yang paling umum digunakan adalah inkjet, yang menyemprotkan tinta, dan laser, yang menggunakan toner bubuk.",
      "Banyak printer modern kini bersifat multifungsi atau All-in-One (AIO). Selain mencetak, perangkat ini juga dapat melakukan fungsi lain seperti memindai (scan) dokumen fisik menjadi file digital, menyalin (copy) dokumen, dan bahkan mengirim atau menerima faks.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "Fungsi utama printer adalah mengubah dokumen fisik menjadi data digital.",
        answers: ["Salah", "Benar"],
        correctAnswerIndex: 0,
        explanation:
          "Printer berfungsi mengubah data digital menjadi salinan fisik (hardcopy). Fungsi sebaliknya dilakukan oleh scanner.",
      },
    ],
  },
  {
    label: "Flashdisk",
    modelFile: "assets/models/flashdisk.glb",
    audioFile: "assets/audio/flashdisk.mp3",
    description: [
      "Flashdisk (atau USB flash drive) adalah perangkat penyimpanan data portabel yang menggunakan memori flash non-volatil. Ukurannya yang kecil, ringan, dan tidak memerlukan daya eksternal membuatnya sangat populer untuk memindahkan file antar komputer dengan mudah.",
      "Flashdisk terhubung ke komputer melalui port USB (Universal Serial Bus). Selain untuk mentransfer file, perangkat ini juga sering digunakan untuk mencadangkan data penting, menjalankan aplikasi portabel, atau bahkan sebagai media untuk menginstal sistem operasi.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "Flashdisk memerlukan daya listrik eksternal untuk menyimpan data secara permanen.",
        answers: ["Salah", "Benar"],
        correctAnswerIndex: 0,
        explanation:
          "Flashdisk menggunakan memori flash non-volatil, yang artinya dapat menyimpan data secara permanen tanpa memerlukan daya listrik.",
      },
    ],
  },
];
