# Skenario Tes Fitur Booking Cukur

Untuk memastikan pengaturan antrian Booking dan Cukur Reguler (Premium/TOK) sudah berjalan secara terpisah dan mematuhi batasan kuota (maksimal 2 per slot), silakan ikuti langkah tes berikut ini:

## Persiapan
- Pastikan tab **Supabase SQL Editor** sudah menjalankan script `supabase_migration_booking.sql` dengan sukses agar tabel `queues` memiliki struktur yang benar.
- Pastikan tabel `queues` Anda dalam keadaan kosong (bisa Anda hapus isi datanya sementara, atau diamkan saja jika ini hari baru).

---

## 🧪 Skenario 1: Antrian Reguler Pertama (Premium/TOK)
1. Buka halaman `/join`.
2. Pilih layanan **Cukur Premium** atau **Cukur TOK**.
3. Isi data form pelanggan pertama (Misal nama: `Andi`).
4. **Ekspektasi Hasil:** Andi mendapat nomor antrian **1**.

## 🧪 Skenario 2: Booking Slot Pertama (Siang)
1. Buka kembali `/join`.
2. Pilih **Booking Cukur**.
3. Pilih Tanggal: **Hari Ini**.
4. Pilih Waktu: **Siang**.
5. Isi data pelanggan (Misal nama: `Budi`).
6. **Ekspektasi Hasil:** Budi mendapat nomor antrian **1** (karena dia booker Siang pertama hari ini). Andi yang antri reguler posisinya tidak berubah.

## 🧪 Skenario 3: Antrian Reguler Kedua (Membuktikan Posisi Tidak Terganggu)
1. Buka `/join` dan pilih **Cukur Reguler (TOK/Premium)** lagi.
2. Isi data pelanggan (Misal nama: `Citra`).
3. **Ekspektasi Hasil:** Citra mendapat nomor antrian **2**. (Bukan 3, karena Budi statusnya Booking, tidak memengaruhi posisi Citra).

## 🧪 Skenario 4: Booking Slot Kedua di Waktu yang Sama (Siang)
1. Buka `/join` dan pilih **Booking Cukur**.
2. Pilih Tanggal: **Hari Ini**.
3. Pilih Waktu: **Siang**.
4. Isi data (Misal nama: `Deni`).
5. **Ekspektasi Hasil:** Deni mendapat nomor antrian **2**. (Dan slot Siang untuk hari ini resmi PENUH).

## 🧪 Skenario 5: Testing Slot Penuh & Auto Rekomendasi
1. Buka `/join` dan pilih **Booking Cukur**.
2. Pilih Tanggal: **Hari Ini**.
3. Pilih Waktu: **Siang** (yang sudah diisi Budi & Deni sebelumnya).
4. Isi data dan tekan submit.
5. **Ekspektasi Hasil:** Antrian **GAGAL** masuk. Muncul box peringatan merah yang mengatakan slot Siang sudah penuh. Di bawahnya, harus ada pesan biru (Rekomendasi) yang menyarankan untuk mengambil slot **Malam**.

## 🧪 Skenario 6: Booking Beda Waktu (Malam)
1. Dengan data gagal dari Skenario 5 tadi, ganti pilihan waktu jadi **Malam**.
2. Submit form.
3. **Ekspektasi Hasil:** Pelanggan masuk dengan sukses dan mendapat nomor antrian **1** (karena untuk Malam hari ini, dia adalah orang pertama).

## 🧪 Skenario 7: Booking Beda Hari
1. Buka `/join` dan pilih **Booking Cukur**.
2. Pilih Tanggal: **Besok** (atau hari lain kedepannya).
3. Pilih Waktu: **Siang**.
4. Submit form.
5. **Ekspektasi Hasil:** Pelanggan masuk dengan sukses dan mendapat nomor antrian **1**. Walaupun slot Siang hari ini penuh, slot besok masih kosong.
