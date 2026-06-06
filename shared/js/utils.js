/* 
 * Proyek Web Edukasi Literasi Finansial PGSD
 * Author: Aan Rifai (NIM: 2501050298, No. Absen: 28)
 * Universitas Negeri Semarang (UNNES)
 */


// Fungsi untuk memformat angka biasa menjadi format mata uang Rupiah (contoh: 15000 -> Rp 15.000)
function formatRupiah(angka) {
    // Mengonversi input ke tipe angka, untuk memastikan tidak terjadi error
    const num = Number(angka);
    // Jika ternyata input bukan angka, kembalikan nilai Rp 0
    if (isNaN(num)) return "Rp 0";
    
    // Menggunakan API bawaan Javascript (Intl.NumberFormat) untuk format mata uang lokal Indonesia
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0, // Ditetapkan 0 agar tidak ada ,00 di belakang (contoh: Rp 1.000,00 menjadi Rp 1.000)
        maximumFractionDigits: 0
    }).format(num);
}

// Fungsi praktis untuk membuat elemen HTML baru menggunakan JavaScript dengan cepat
function createElement(tag, className, textContent = "") {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (textContent) el.textContent = textContent;
    return el;
}

// Fungsi untuk mengacak (shuffle) urutan elemen di dalam sebuah Array.
// Algoritma yang digunakan adalah Fisher-Yates Shuffle.
// Ini akan sangat berguna untuk menampilkan kuis simulasi belanja secara acak.
function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;

    // Selama masih ada elemen yang belum diacak dalam array...
    while (currentIndex !== 0) {
        // Pilih salah satu elemen tersisa secara acak
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // Tukar posisi elemen saat ini dengan elemen yang dipilih secara acak
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]
        ];
    }

    return array;
}

// Fungsi untuk Resize dan Compress gambar agar tidak berat saat disimpan ke Database
window.resizeAndCompressImage = function(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 400; // Lebar maksimal
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // Kualitas kompresi 0.7 (70%)
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(dataUrl);
            };
            img.onerror = error => reject(error);
        };
        reader.onerror = error => reject(error);
    });
};

/* ========================================================
   GLOBAL AUDIO MANAGER
   Mengatur Backsound dan Sound Effect Klik untuk SEMUA HALAMAN
   ======================================================== */

// Deteksi otomatis path ke root folder
const rootPath = (window.location.pathname.includes('/student/') || window.location.pathname.includes('/teacher/')) ? '../' : './';

// Daftar semua elemen suara
const audios = {
    // Memilih backsound khusus kuis jika halamannya adalah kuis
    bgm: new Audio(rootPath + (window.location.pathname.includes('kuis') ? 'backsound kuis.mp3' : 'backsound.mp3')),
    click: new Audio(rootPath + 'klik semua.mp3'),
    correct: new Audio(rootPath + 'benar.mp3'),
    wrong: new Audio(rootPath + 'salah.mp3'),
    applause: new Audio(rootPath + 'u_o8xh7gwsrj-cute_happy_victory-476376.mp3')
};

// Mengatur properti backsound
audios.bgm.loop = true; // Akan terus diulang
audios.bgm.volume = 0.3; // Volume musik latar agar tidak terlalu bising (30%)

// Flag untuk menyimpan status mute dari localStorage
let isMuted = localStorage.getItem('isMuted') === 'true';

// Setelan awal sesuai status
if (isMuted) {
    Object.values(audios).forEach(a => a.volume = 0);
}

// Fungsi untuk memainkan musik latar
function playBGM() {
    if (!isMuted && audios.bgm.paused) {
        // Dibungkus Promise.catch karena kebijakan Autoplay browser yang ketat
        audios.bgm.play().catch(error => {
            console.log("Autoplay diblokir browser, butuh interaksi user dulu.");
        });
    }
}

// Fungsi untuk memainkan Sound Effect koin klik
function playClickSound() {
    if (!isMuted) {
        // Clone node agar suara bisa ditumpuk (overlap) saat diklik cepat
        const clickClone = audios.click.cloneNode();
        clickClone.volume = 0.6; 
        clickClone.play().catch(err => {});
    }
}

// Fungsi untuk membuat Tombol Toggle Audio (Mute/Unmute)
function createAudioToggleUI() {
    const btnAudio = document.createElement('button');
    btnAudio.id = 'btnToggleGlobalAudio';
    
    // Setup fungsi untuk update tampilan tombol sesuai status
    const updateButtonUI = () => {
        if (isMuted) {
            btnAudio.innerHTML = '🔇 Musik: OFF';
            btnAudio.style.backgroundColor = '#E74C3C'; // Merah
        } else {
            btnAudio.innerHTML = '🔊 Musik: ON';
            btnAudio.style.backgroundColor = '#2ECC71'; // Hijau
        }
    };

    btnAudio.title = "Matikan/Nyalakan Suara";
    btnAudio.style.cssText = `
        padding: 8px 15px;
        border-radius: 20px;
        color: white;
        font-size: 0.9rem;
        font-weight: bold;
        border: none;
        cursor: pointer;
        font-family: inherit;
        transition: transform 0.1s, background-color 0.3s;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        gap: 5px;
    `;
    
    // Inisialisasi tampilan awal
    updateButtonUI();
    
    // Efek saat ditekan
    btnAudio.onmousedown = () => btnAudio.style.transform = 'translateY(4px)';
    btnAudio.onmouseup = () => btnAudio.style.transform = 'translateY(0)';
    btnAudio.onmouseleave = () => btnAudio.style.transform = 'translateY(0)';
    
    btnAudio.addEventListener('click', (e) => {
        e.stopPropagation(); // Mencegah pemicu event klik global
        isMuted = !isMuted;
        localStorage.setItem('isMuted', isMuted);
        
        updateButtonUI();
        
        if (isMuted) {
            Object.values(audios).forEach(a => a.volume = 0);
            audios.bgm.pause();
        } else {
            // Kembalikan ke volume standar
            audios.bgm.volume = 0.3;
            audios.click.volume = 0.6;
            audios.correct.volume = 1.0;
            audios.wrong.volume = 1.0;
            audios.applause.volume = 1.0;
            
            audios.bgm.play().catch(err=>{});
        }
    });

    const navContainer = document.querySelector('.nav-container');
    const teacherNav = document.querySelector('.top-user-actions');
    const headerRight = document.querySelector('.header-right');
    
    if (navContainer) {
        // Taruh di sebelah kiri nav (sebelum logo)
        navContainer.prepend(btnAudio);
        btnAudio.style.marginRight = 'auto'; 
    } else if (teacherNav) {
        // Taruh di dalam top nav Guru agar rapi sejajar dengan tombol Ganti Akun
        teacherNav.prepend(btnAudio);
    } else if (headerRight) {
        // Kuis Belanja: Taruh di header kanan agar sejajar dengan tombol Selesai Belanja
        btnAudio.style.marginRight = '10px';
        headerRight.prepend(btnAudio);
    } else {
        // Fallback untuk halaman yang tidak punya header (misal game kuis-belanja lama)
        btnAudio.style.position = 'absolute';
        btnAudio.style.top = '15px';
        btnAudio.style.right = '15px'; // Taruh di kanan agar rapi
        btnAudio.style.zIndex = '999999';
        document.body.appendChild(btnAudio);
    }
}

// Menampilkan identitas pengguna yang sedang aktif (Siswa/Guru)
function displayUserIdentity() {
    const path = window.location.pathname.toLowerCase();
    
    // Jangan tampilkan di halaman root portal, halaman login, Dashboard Guru, atau halaman kuis belanja
    // (Dashboard guru sudah memiliki profil lengkap di sidebar kiri)
    const isRootFolder = !path.includes('/student/') && !path.includes('/teacher/');
    if (path.includes('/teacher/') || (path.includes('index.html') && isRootFolder) || path.includes('login') || path.includes('kuis-belanja') || (path.endsWith('/') && isRootFolder)) {
        return;
    }

    let nama = "";
    let roleInfo = "";
    
    // Cek apakah yang login adalah Siswa
    const siswaAuth = sessionStorage.getItem('siswaAuth');
    if (siswaAuth) {
        try {
            const data = JSON.parse(siswaAuth);
            nama = data.nama;
            roleInfo = `Kelas ${data.kelas}`;
        } catch (e) {}
    } else {
        // Cek apakah yang login adalah Guru
        const guruAuth = sessionStorage.getItem('guruAuth');
        if (guruAuth) {
            try {
                const data = JSON.parse(guruAuth);
                nama = data.nama || "Guru";
                roleInfo = "Dasbor Guru";
            } catch(e) {}
        }
    }
    
    // Jika tidak ada yang login, tidak perlu memunculkan badge
    if (!nama) return;

    // Hapus badge lama jika ada
    const oldBadge = document.getElementById('userIdentityContainer');
    if (oldBadge) oldBadge.remove();

    const navContainer = document.querySelector('.nav-container') || document.querySelector('.header-right');
    
    if (navContainer) {
        // Buat container wrapper untuk Identitas + Tombol Keluar
        const idContainer = document.createElement('div');
        idContainer.id = 'userIdentityContainer';
        idContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            margin-left: auto; /* Dorong ke kanan */
            margin-right: 15px; /* Spasi dengan tombol Kembali */
        `;
        
        // 1. Badge Nama (Biru Muda Transparan)
        const badge = document.createElement('div');
        badge.innerHTML = `Halo, <strong>${nama}</strong> (${roleInfo}) 🎓`;
        badge.style.cssText = `
            background: rgba(255, 255, 255, 0.4);
            color: white;
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 0.95rem;
            backdrop-filter: blur(5px);
            font-weight: 500;
        `;
        
        // 2. Tombol Keluar (Merah)
        const btnLogout = document.createElement('button');
        btnLogout.innerHTML = 'Keluar';
        btnLogout.style.cssText = `
            background: #E74C3C;
            color: white;
            padding: 8px 15px;
            border-radius: 20px;
            font-weight: bold;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: transform 0.1s;
        `;
        btnLogout.onmousedown = () => btnLogout.style.transform = 'translateY(2px)';
        btnLogout.onmouseup = () => btnLogout.style.transform = 'translateY(0)';
        btnLogout.addEventListener('click', () => {
            sessionStorage.removeItem('siswaAuth');
            sessionStorage.removeItem('guruAuth');
            window.location.href = rootPath + 'index.html'; // rootPath dari atas
        });
        
        idContainer.appendChild(badge);
        idContainer.appendChild(btnLogout);
        
        // Sisipkan tepat sebelum elemen terakhir (tombol Kembali ke Portal)
        if (navContainer.lastElementChild) {
            navContainer.insertBefore(idContainer, navContainer.lastElementChild);
        } else {
            navContainer.appendChild(idContainer);
        }
    } else {
        // Fallback untuk halaman game yang tidak punya nav-container
        const fallbackBadge = document.createElement('div');
        fallbackBadge.id = 'userIdentityContainer';
        fallbackBadge.innerHTML = `👤 <strong>${nama}</strong><br><span style="font-size:0.75rem;">${roleInfo}</span>`;
        fallbackBadge.style.cssText = `
            position: absolute;
            top: 15px;
            right: 150px; /* Spasi dari tombol toggle audio absolute */
            background: rgba(41, 128, 185, 0.9);
            color: white;
            padding: 6px 12px;
            border-radius: 8px;
            border-bottom: 3px solid #1A5276;
            z-index: 999998;
            font-size: 0.85rem;
        `;
        document.body.appendChild(fallbackBadge);
    }
}

// Pasang listener di SELURUH TOMBOL (button) dan LINK (a) agar otomatis bunyi saat diklik!
document.addEventListener('DOMContentLoaded', () => {
    
    // Buat dan tampilkan tombol musik
    createAudioToggleUI();
    
    // Tampilkan identitas user
    displayUserIdentity();
    
    // Event delegation untuk efek suara klik agar berlaku juga pada elemen yang dibuat dinamis (seperti daftar barang di rak)
    document.body.addEventListener('click', (e) => {
        // Cek apakah yang diklik adalah tombol, tautan, atau elemen dengan class .clickable
        const isClickable = e.target.closest('button, a, .clickable');
        if (isClickable) {
            playClickSound();
        }
    });

    // Pemicu Play BGM dari interaksi pertama user (klik dimana saja)
    // Hal ini untuk melewati aturan proteksi Autoplay browser
    document.body.addEventListener('click', playBGM, { once: true });
});

/* ========================================================
   SISTEM LOG AKTIVITAS (Activity Logger)
   Berfungsi mencatat apa saja yang siswa lakukan untuk
   dilaporkan ke Dasbor Guru di index.html.
   ======================================================== */

// Simpan jejak / riwayat pergerakan ke Firebase Realtime Log (atau LocalStorage)
window.logActivity = async function(aktivitasText, skorTerkait = null, catatanKhusus = "") {
    
    // Ambil identitas siswa yang sedang login
    const siswaAuth = sessionStorage.getItem('siswaAuth');
    
    // Jika tidak ada yang login, maka kita skip saja (jangan dicatat)
    if (!siswaAuth) return;
    
    const dataSiswa = JSON.parse(siswaAuth);

    // Bikin objek struktur log
    const activityData = {
        nama: dataSiswa.nama,
        kelas: dataSiswa.kelas,
        waktu: new Date().toLocaleString('id-ID'), // Format: "12/5/2024, 14:05:00"
        aktivitas: aktivitasText,
        skorAkhir: skorTerkait !== null ? skorTerkait : "-",
        catatan: catatanKhusus,
        timestamp: Date.now() // Untuk mempermudah pengurutan terbaru di database
    };

    // Panggil fungsi Firebase Database (disimpan terpusat di firebase-db.js)
    if (typeof recordActivityToDB === 'function') {
        try {
            await recordActivityToDB(activityData);
        } catch (err) {
            console.error("Gagal mencatat log ke Firebase:", err);
        }
    } else {
        // Fallback: Jika tidak terhubung internet, simpan di localStorage sementara
        console.warn("Fungsi database tak ditemukan! Disimpan secara lokal.");
        const currentLogs = JSON.parse(localStorage.getItem('offlineLogs') || '[]');
        currentLogs.push(activityData);
        localStorage.setItem('offlineLogs', JSON.stringify(currentLogs));
    }
};

/* ========================================================
   FUNGSI EXPORT & REPORTING UNTUK DASBOR GURU
   Mendownload tabel HTML ke format Excel (.csv)
   ======================================================== */
   function downloadTableToCSV(filename, tableId) {
    const table = document.getElementById(tableId);
    let csv = [];
    for (let i = 0; i < table.rows.length; i++) {
        let row = [], cols = table.rows[i].querySelectorAll("td, th");
        for (let j = 0; j < cols.length; j++) 
            // Ganti koma agar tak merusak format csv
            row.push('"' + cols[j].innerText.replace(/"/g, '""') + '"');
        csv.push(row.join(","));		
    }
    const csvFile = new Blob([csv.join("\n")], {type: "text/csv"});
    const downloadLink = document.createElement("a");
    downloadLink.download = filename;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
}
