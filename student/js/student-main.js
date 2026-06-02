/* 
 * Proyek Web Edukasi Literasi Finansial PGSD
 * Author: Aan Rifai (NIM: 2501050298, No. Absen: 28)
 * Universitas Negeri Semarang (UNNES)
 */

// File ini bisa digunakan untuk logika umum yang berlaku di semua halaman siswa.
// Misalnya untuk menampilkan nama siswa jika nantinya menggunakan sistem login sederhana.

document.addEventListener('DOMContentLoaded', () => {
    // Log pesan ke console browser sebagai tanda file JS dimuat dengan baik
    console.log("Aplikasi Siswa Pintar Finansial Siap!");

    // CATAT AKTIVITAS: Masuk ke Menu Utama
    if (typeof logActivity === 'function') {
        logActivity('📱 Masuk ke Menu Utama (Dashboard)');
    }
});
