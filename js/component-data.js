export const components = [
  {
    label: "Sejarah",
    modelFile: null,
    audioFile: "assets/audio/intro.mp3",
    description: [
      "Sejarah komputer dimulai dari alat hitung sederhana seperti abakus ribuan tahun lalu, kemudian berkembang menjadi mesin hitung mekanik pada abad ke-17. Komputer elektronik pertama seperti ENIAC pada tahun 1946 berukuran sebesar ruangan dan menggunakan ribuan tabung vakum. Perkembangan transistor pada tahun 1950-an memungkinkan komputer menjadi lebih kecil dan efisien, diikuti dengan integrated circuit pada tahun 1960-an yang semakin memperkecil ukuran komputer.",

      "Era komputer personal dimulai pada tahun 1970-an dengan kemunculan Apple II dan IBM PC yang membuat komputer dapat digunakan di rumah dan kantor kecil. Tahun 1980-an hingga 1990-an menjadi era perkembangan pesat dengan munculnya sistem operasi Windows, mouse, dan antarmuka grafis yang user-friendly. Internet mulai populer pada tahun 1990-an, mengubah cara manusia berkomunikasi dan mengakses informasi.",

      "Abad ke-21 membawa revolusi komputer mobile dengan laptop yang semakin tipis dan ringan, smartphone yang merupakan komputer saku, serta tablet yang menggabungkan portabilitas dengan layar sentuh. Teknologi cloud computing memungkinkan akses data dari mana saja, while artificial intelligence dan machine learning membuka era baru komputasi cerdas yang dapat belajar dan beradaptasi. Saat ini, komputer quantum sedang dikembangkan untuk mengatasi masalah komputasi yang sangat kompleks.",
    ],
    unlocked: true,
    quiz: [
      {
        question:
          "Komputer pertama seperti ENIAC menggunakan mikroprosesor modern.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 1,
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
      "Monitor adalah layar tampilan komputer yang berfungsi sebagai jendela visual antara pengguna dan sistem komputer. Perangkat ini menampilkan semua informasi, gambar, video, dan antarmuka program yang sedang berjalan di komputer. Tanpa monitor, kita tidak dapat melihat apa yang sedang dikerjakan oleh komputer.",

      "Terdapat beberapa jenis monitor berdasarkan teknologinya, yaitu monitor LED yang paling umum digunakan saat ini karena hemat energi dan kualitas gambar yang baik, monitor OLED dengan kontras tinggi dan warna yang lebih hidup, serta monitor gaming dengan refresh rate tinggi untuk pengalaman bermain game yang lebih lancar. Monitor juga tersedia dalam berbagai ukuran mulai dari 15 inci hingga 32 inci atau lebih besar.",
    ],
    unlocked: false,
    quiz: [
      {
        question: "Teknologi monitor pertama adalah Layar Kristal Cair (LCD).",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 1,
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
      "Keyboard adalah perangkat input utama yang memungkinkan pengguna untuk memasukkan teks, angka, dan perintah ke dalam komputer. Setiap tombol pada keyboard mewakili karakter atau fungsi tertentu yang akan dikirim ke komputer saat ditekan. Keyboard modern umumnya memiliki 104 tombol standar termasuk huruf, angka, simbol, dan tombol fungsi khusus.",

      "Ada berbagai jenis keyboard yang tersedia, mulai dari keyboard membran yang menggunakan lapisan fleksibel dan lebih terjangkau, keyboard mekanik yang memberikan respons taktil lebih baik dan tahan lama, hingga keyboard wireless yang menggunakan koneksi Bluetooth atau USB receiver. Beberapa keyboard khusus juga dilengkapi dengan lampu latar atau tombol makro untuk kebutuhan gaming dan produktivitas.",
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
      "Mouse adalah perangkat penunjuk yang memungkinkan pengguna untuk mengontrol kursor di layar komputer dan berinteraksi dengan elemen-elemen visual seperti ikon, menu, dan tombol. Mouse bekerja dengan mendeteksi gerakan dan mengonversinya menjadi pergerakan kursor di layar. Perangkat ini memiliki tombol kiri dan kanan untuk klik, serta scroll wheel untuk navigasi halaman.",

      "Berdasarkan teknologi deteksinya, terdapat mouse optik yang menggunakan sensor LED dan dapat digunakan di hampir semua permukaan, mouse laser yang lebih akurat dan sensitif, dan mouse gaming dengan DPI tinggi untuk pergerakan yang presisi. Mouse juga tersedia dalam versi kabel dan wireless, dengan ergonomi yang disesuaikan untuk kenyamanan penggunaan jangka panjang.",
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
      'Motherboard atau papan induk adalah komponen utama yang menghubungkan semua bagian komputer menjadi satu sistem yang utuh. Seperti namanya, motherboard berfungsi sebagai "ibu" yang menyediakan jalur komunikasi dan daya listrik untuk semua komponen lainnya seperti prosesor, RAM, kartu grafis, dan perangkat penyimpanan. Tanpa motherboard, komponen-komponen ini tidak dapat saling berkomunikasi.',

      "Motherboard hadir dalam berbagai ukuran atau form factor, mulai dari ATX yang berukuran besar dan cocok untuk komputer desktop dengan banyak slot ekspansi, Micro-ATX yang lebih kompak namun tetap memiliki fitur lengkap, hingga Mini-ITX yang sangat kecil untuk build PC yang hemat ruang. Setiap motherboard memiliki socket prosesor tertentu, slot RAM, port input-output, dan chipset yang menentukan kompatibilitas dengan komponen lainnya.",
    ],
    unlocked: false,
    quiz: [
      {
        question: "Motherboard adalah komponen opsional dalam sebuah komputer.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 1,
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
      "CPU atau prosesor adalah otak dari komputer yang bertugas menjalankan semua instruksi dan perhitungan yang dibutuhkan oleh sistem dan aplikasi. Setiap kali Anda membuka program, mengetik, atau melakukan aktivitas apapun di komputer, CPU bekerja memproses perintah-perintah tersebut dengan kecepatan yang sangat tinggi. Kinerja CPU sangat menentukan seberapa cepat komputer dapat menyelesaikan tugasnya.",

      "CPU modern hadir dalam berbagai konfigurasi core, mulai dari dual-core untuk kebutuhan dasar, quad-core untuk multitasking yang lancar, hingga 8, 16, atau bahkan 32 core untuk keperluan profesional seperti editing video dan rendering. Dua produsen utama CPU adalah Intel dengan seri Core i3, i5, i7, dan i9, serta AMD dengan seri Ryzen 3, 5, 7, dan 9. Semakin tinggi angkanya, semakin kuat performa yang ditawarkan.",
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
    label: "Memori (RAM)",
    modelFile: "assets/models/ram.glb",
    audioFile: "assets/audio/ram.mp3",
    description: [
      "Memory atau memori adalah tempat penyimpanan data sementara yang digunakan komputer untuk menjalankan program dan sistem operasi. RAM atau Random Access Memory berfungsi sebagai ruang kerja komputer, menyimpan data yang sedang aktif digunakan agar dapat diakses dengan cepat oleh prosesor. Semakin besar kapasitas RAM, semakin banyak program yang dapat berjalan bersamaan tanpa membuat komputer lambat.",

      "ROM atau Read-Only Memory adalah jenis memori permanen yang menyimpan instruksi dasar untuk menghidupkan komputer, seperti BIOS atau UEFI. RAM tersedia dalam berbagai kapasitas mulai dari 4GB untuk kebutuhan dasar, 8GB untuk penggunaan normal, hingga 16GB atau 32GB untuk kebutuhan profesional. RAM juga memiliki kecepatan yang berbeda, seperti DDR4 dan DDR5 yang lebih baru dengan performa lebih baik.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "Data yang tersimpan di RAM akan tetap ada meskipun komputer dimatikan.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 1,
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
      "GPU atau kartu grafis adalah komponen yang bertanggung jawab untuk memproses dan menampilkan gambar, video, animasi, dan efek visual di layar komputer. Berbeda dengan CPU yang dirancang untuk pemrosesan umum, GPU memiliki ribuan core kecil yang bekerja secara paralel untuk menangani perhitungan grafis yang kompleks dengan sangat efisien. GPU sangat penting untuk gaming, desain grafis, editing video, dan aplikasi yang membutuhkan visualisasi tinggi.",

      "Terdapat dua jenis GPU yaitu integrated graphics yang sudah tertanam dalam prosesor dan cocok untuk kebutuhan dasar, serta dedicated graphics card yang merupakan kartu terpisah dengan performa jauh lebih tinggi. GPU dedicated diproduksi oleh NVIDIA dengan seri GeForce RTX dan GTX, serta AMD dengan seri Radeon RX. GPU modern juga mendukung teknologi ray tracing untuk pencahayaan realistis dan DLSS untuk meningkatkan frame rate dalam gaming.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "GPU hanya berfungsi untuk menampilkan teks dan tidak bisa memproses grafis 3D.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 1,
        explanation: "GPU merender grafis 2D dan 3D dengan cepat dan efisien.",
      },
    ],
  },
  {
    label: "Kartu Jaringan (NIC)",
    modelFile: "assets/models/kartu_jaringan.glb",
    audioFile: "assets/audio/kartu_jaringan.mp3",
    description: [
      "Kartu jaringan atau Network Interface Card adalah komponen yang memungkinkan komputer untuk terhubung ke jaringan internet atau jaringan lokal. Perangkat ini berfungsi sebagai jembatan komunikasi antara komputer dengan router, modem, atau perangkat jaringan lainnya. Kartu jaringan mengonversi data digital menjadi sinyal yang dapat dikirim melalui kabel atau gelombang radio untuk koneksi wireless.",

      "Kartu jaringan tersedia dalam dua jenis utama, yaitu Ethernet card untuk koneksi kabel dengan kecepatan stabil dan latensi rendah, serta WiFi card untuk koneksi nirkabel yang memberikan fleksibilitas mobilitas. Kecepatan kartu jaringan bervariasi mulai dari 100 Mbps untuk kebutuhan dasar, 1 Gbps untuk penggunaan rumahan, hingga 10 Gbps untuk server dan kebutuhan enterprise. Sebagian besar motherboard modern sudah memiliki kartu jaringan terintegrasi.",
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
      "Storage atau perangkat penyimpanan adalah tempat menyimpan semua data, file, program, dan sistem operasi secara permanen di komputer. Berbeda dengan RAM yang bersifat sementara, data di storage akan tetap tersimpan meskipun komputer dimatikan. Storage berperan vital dalam menyimpan foto, video, dokumen, game, aplikasi, dan semua file digital yang Anda miliki.",

      "Terdapat dua jenis storage utama yaitu HDD atau Hard Disk Drive yang menggunakan piringan magnetik berputar dengan kapasitas besar dan harga terjangkau, serta SSD atau Solid State Drive yang menggunakan chip flash memory dengan kecepatan baca-tulis jauh lebih cepat namun harga lebih mahal. Storage tersedia dalam berbagai kapasitas mulai dari 128GB hingga beberapa terabyte, dengan interface SATA untuk HDD tradisional dan NVMe untuk SSD modern yang super cepat.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "SSD menyimpan data menggunakan piringan magnetik yang berputar.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 1,
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
      "Printer adalah perangkat output yang berfungsi untuk mencetak dokumen digital menjadi bentuk fisik di atas kertas atau media lainnya. Printer mengubah file teks, gambar, atau dokumen yang ada di komputer menjadi hasil cetakan yang dapat dipegang dan dibaca secara langsung. Perangkat ini sangat penting untuk kebutuhan kantor, sekolah, dan rumah tangga dalam menghasilkan dokumen fisik.",

      "Berdasarkan teknologi pencetakannya, terdapat printer inkjet yang menggunakan tinta cair dan cocok untuk mencetak foto dengan kualitas tinggi namun biaya operasional lebih mahal, printer laser yang menggunakan toner bubuk dengan kecepatan cetak tinggi dan cocok untuk dokumen teks dalam volume besar, serta printer dot matrix yang masih digunakan untuk dokumen resmi karena dapat mencetak dengan tekanan. Printer juga tersedia dalam versi monochrome hitam-putih atau color untuk kebutuhan cetak berwarna.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "Fungsi utama printer adalah mengubah dokumen fisik menjadi data digital.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 1,
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
      "Flashdisk atau USB flash drive adalah perangkat penyimpanan portabel berukuran kecil yang dapat dengan mudah dibawa kemana-mana. Perangkat ini menggunakan teknologi flash memory yang memungkinkan penyimpanan data tanpa memerlukan daya listrik untuk mempertahankan data. Flashdisk sangat praktis untuk memindahkan file antar komputer, membuat backup data penting, atau menyimpan file sementara.",

      "Flashdisk tersedia dalam berbagai kapasitas mulai dari 8GB untuk kebutuhan dasar hingga 1TB untuk penyimpanan besar, dengan interface USB 2.0, USB 3.0, hingga USB 3.2 dan USB-C yang lebih cepat dalam transfer data. Kecepatan transfer flashdisk bervariasi dari 10 MB/s hingga lebih dari 200 MB/s tergantung teknologi yang digunakan. Beberapa flashdisk dilengkapi dengan enkripsi dan password untuk keamanan data.",
    ],
    unlocked: false,
    quiz: [
      {
        question:
          "Flashdisk memerlukan daya listrik eksternal untuk menyimpan data secara permanen.",
        answers: ["Benar", "Salah"],
        correctAnswerIndex: 1,
        explanation:
          "Flashdisk menggunakan memori flash non-volatil yang menyimpan data tanpa perlu daya listrik.",
      },
    ],
  },
];
