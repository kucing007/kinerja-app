# Kakin – Kalkulator Kinerja

Alat bantu pegawai **non-Pimpinan UPK** Kementerian Keuangan untuk menghitung dan merencanakan kinerja sendiri sesuai **KMK 127 Tahun 2026** tentang Manajemen Kinerja.

🔗 **https://kinerja-app-jade.vercel.app**

> **Bukan produk resmi.** Hasil di aplikasi ini adalah perhitungan mandiri, bukan nilai resmi dari aplikasi Performa. Gunakan untuk memperkirakan dan merencanakan, bukan sebagai rujukan final.

## Data Anda tidak ke mana-mana

Seluruh data hanya tersimpan di `localStorage` browser Anda. Tidak ada server, tidak ada login, tidak ada pengiriman data — NKP bersifat rahasia (KMK hal. 118). Cadangan dan pemindahan data dilakukan lewat **Ekspor/Impor JSON** di halaman Pengaturan.

## Isi aplikasi

Navigasi mengikuti komponen rumus NKP, sehingga tiap data punya satu tempat. Aplikasi dirancang untuk laptop/desktop.

| Halaman | Fungsi |
|---|---|
| **Nilai Kinerja** | NKP, predikat, langkah perhitungan, semua periode; di kolom kanan isian NKO dan penyesuaian (hukdis/dampak/koreksi) |
| **Hasil Kerja** | Tabel IKI: target & realisasi Q1–Q4 diisi langsung di tabel, capaian/K3/kontribusi → NHK. Polarisasi, jenis IKI, dan K3 di panel **Rincian** |
| **Perilaku Kerja** | NPK per triwulan atau 7 core value, dengan kalibrasi dan rating per periode |
| **Perencanaan** | Tabel rencana tahun depan: Target Y langsung di tabel, syarat target untuk bobot 1,20, K3, dan proyeksi NHK |
| **Pengaturan** | Tahun, posisi jabatan, Ekspor/Impor/Reset |

**Bilah periode** di bawah menu berlaku untuk Nilai Kinerja, Hasil Kerja, dan Perilaku Kerja. Saat dibuka, bilah ini memilih triwulan terakhir yang sudah ada realisasinya, dan menampilkan NKP secara langsung selagi Anda mengisi di halaman lain. Nilai yang belum memuat semua IKI bertarget ditandai `*` (sementara), dan sel realisasi yang perlu diisi ditandai kuning.

**Mode Simulasi** pada halaman Nilai Kinerja memungkinkan mengubah NHK, NPK, NKO, dan koreksi untuk melihat pengaruhnya pada NKP — tanpa pernah menulis ke data tersimpan. Mode ini berakhir saat periode diganti atau halaman ditinggalkan.

Menghapus IKI atau hukdis dapat dibatalkan lewat tombol **Urungkan** yang muncul sesaat.

## Cakupan perhitungan

Capaian IKI (maximize/minimize/stabilize, konversi 120, target 0) · konsolidasi triwulan · K3 dari bobot kualitas IKI × bobot kualitas target · NHK & bobot tertimbang · NPK · kalibrasi (maksimal 115) · Nilai Hukuman Disiplin · Nilai Dampak · Nilai Koreksi · pembobotan NKO · rating dan predikat.

**Belum tercakup:** Pimpinan UPK, JPTM, Tugas Belajar, Plt, SKP Komplemen, dan pembobotan evaluator 360°.

**Catatan:** rumus kalibrasi 115 direkonstruksi dari dua contoh pada paparan sosialisasi, karena KMK hanya menyebutkan batas nilainya. Sebaiknya dikonfirmasi ke pengelola kinerja unit masing-masing.

## Teknis

SvelteKit 2 · Svelte 5 (runes) · TypeScript · Tailwind CSS 4 · Vitest · `adapter-static` (SPA, tanpa sisi server).

```sh
npm install     # .npmrc sudah menyetel legacy-peer-deps
npm run dev     # server pengembangan
npm test        # unit test untuk mesin perhitungan
npm run check   # type-check
npm run build   # keluaran statis ke build/
```

Logika perhitungan terpisah murni di `src/lib/calc/` dan diuji langsung terhadap contoh-contoh dalam KMK, terlepas dari antarmuka.

## Deploy

Berkas statis, dapat di-host di mana saja. Saat ini di Vercel lewat `vercel.json` (`framework: null`, `outputDirectory: build`, `cleanUrls: true` — `cleanUrls` wajib agar deep link tidak 404).
