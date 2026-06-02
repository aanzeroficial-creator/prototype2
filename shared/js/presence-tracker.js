/* 
 * Presence Tracker (Pemantau Siswa Aktif)
 * Berjalan otomatis di latar belakang seluruh halaman siswa.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Cek apakah ini sesi siswa
    const authData = sessionStorage.getItem('siswaAuth');
    if (!authData) return; // Jika bukan siswa yang login, hentikan pelacakan
    
    const siswa = JSON.parse(authData);
    
    // Buat ID unik berdasarkan nama dan kelas agar mudah dilacak
    const siswaId = `${siswa.kelas}_${siswa.nama}`.replace(/\s+/g, '_').toLowerCase();
    
    let pingInterval;

    // 2. Fungsi untuk mengirim Ping (Tanda kehidupan)
    async function sendPing() {
        if (typeof window.updatePresence === 'function') {
            await window.updatePresence(siswaId, siswa.nama, siswa.kelas, 'online');
        }
    }

    // 3. Jalankan ping pertama kali saat halaman dimuat
    sendPing();

    // 4. Set Interval Ping setiap 2 Menit (120000 ms) agar sangat hemat kuota
    pingInterval = setInterval(() => {
        // Jangan ping jika tab browser sedang di-minimize/disembunyikan
        if (document.visibilityState === 'visible') {
            sendPing();
        }
    }, 120000);

    // 5. Deteksi saat siswa menutup tab/browser (atau pindah halaman luar)
    window.addEventListener('beforeunload', () => {
        // Kirim status offline tepat sebelum browser tertutup
        if (typeof window.updatePresence === 'function') {
            window.updatePresence(siswaId, siswa.nama, siswa.kelas, 'offline');
        }
    });
});
