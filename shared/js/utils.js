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

/* ========================================================
   GLOBAL AUDIO MANAGER
   Mengatur Backsound dan Sound Effect Klik untuk SEMUA HALAMAN
   ======================================================== */

// Deteksi otomatis path ke root folder
const rootPath = (window.location.pathname.includes('/student/') || window.location.pathname.includes('/teacher/')) ? '../' : './';

// Inisialisasi Audio
const globalBGM = new Audio(rootPath + (window.location.pathname.includes('kuis-belanja.html') ? 'backsound kuis.mp3' : 'backsound.mp3'));
globalBGM.loop = true;
globalBGM.volume = 0.2; // Volume latar belakang

const globalClickSFX = new Audio(rootPath + 'klik semua.mp3');
globalClickSFX.preload = 'auto'; // Preload agar siap diputar kapan sajaTanpa Delay

// Memulihkan waktu pemutaran BGM antar halaman agar musik bersambung mulus
const savedBgmTime = sessionStorage.getItem('bgmTime');
if (savedBgmTime) {
    globalBGM.currentTime = parseFloat(savedBgmTime);
}

// Simpan waktu BGM saat pindah halaman
window.addEventListener('beforeunload', () => {
    sessionStorage.setItem('bgmTime', globalBGM.currentTime);
});

// Menangani Autoplay Policy: Coba putar BGM langsung saat halaman dimuat
let globalBgmStarted = false;

function playBGM() {
    const isBgmOn = localStorage.getItem('bgmEnabled') !== 'false';
    if (!globalBgmStarted && isBgmOn) {
        globalBGM.play().then(() => {
            globalBgmStarted = true;
        }).catch(err => {
            console.log("Autoplay BGM ditunda browser, menunggu interaksi...");
        });
    }
}

// Langsung panggil tanpa menunggu klik
playBGM();

// Tetap tangani klik sebagai fallback (cadangan) dan efek suara SFX klik
document.addEventListener('click', (e) => {
    playBGM(); // Coba lagi jika sebelumnya gagal karena kebijakan browser

    // Deteksi jika yang diklik adalah tombol atau tautan
    const isButtonOrLink = e.target.closest('button') || e.target.closest('a') || e.target.closest('.btn');
    
    // Putar SFX klik secara global, namun matikan sepenuhnya saat berada di halaman Kuis
    const isKuisPage = window.location.pathname.includes('kuis-belanja.html');
    if (!isKuisPage && isButtonOrLink && e.target.id !== 'bgmToggleBtn') {
        // Menggunakan cloneNode agar suara langsung berbunyi tanpa delay antrian
        const clickSound = globalClickSFX.cloneNode();
        clickSound.play().catch(err => {});
    }
});

/* ========================================================
   SISTEM TOGGLE BGM (MUTE/UNMUTE)
   ======================================================== */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Buat elemen tombol
    const bgmToggleBtn = document.createElement('button');
    bgmToggleBtn.id = 'bgmToggleBtn';
    
    // Cek status dari localStorage
    let isBgmOn = localStorage.getItem('bgmEnabled') !== 'false';
    
    // Styling umum
    bgmToggleBtn.style.padding = '8px 15px';
    bgmToggleBtn.style.borderRadius = '20px';
    bgmToggleBtn.style.border = 'none';
    bgmToggleBtn.style.fontWeight = 'bold';
    bgmToggleBtn.style.cursor = 'pointer';
    bgmToggleBtn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.2)';
    bgmToggleBtn.style.fontFamily = 'inherit';
    bgmToggleBtn.style.fontSize = '1rem';
    bgmToggleBtn.style.transition = 'all 0.2s';
    
    // Fungsi update UI
    function updateBgmButtonUI() {
        if (isBgmOn) {
            bgmToggleBtn.innerHTML = '🔊 Musik: ON';
            bgmToggleBtn.style.backgroundColor = '#2ECC71';
            bgmToggleBtn.style.color = 'white';
        } else {
            bgmToggleBtn.innerHTML = '🔇 Musik: OFF';
            bgmToggleBtn.style.backgroundColor = '#E74C3C';
            bgmToggleBtn.style.color = 'white';
        }
    }
    updateBgmButtonUI();

    // Penempatan di layar
    const navContainer = document.querySelector('.nav-container') || document.querySelector('.header-container');
    const gameHeaderRight = document.querySelector('.game-header .header-right');
    const topUserActions = document.querySelector('.top-user-actions');
    
    if (navContainer) {
        navContainer.insertBefore(bgmToggleBtn, navContainer.firstChild);
    } else if (gameHeaderRight) {
        bgmToggleBtn.style.marginLeft = '15px';
        gameHeaderRight.appendChild(bgmToggleBtn);
    } else if (topUserActions) {
        bgmToggleBtn.style.marginLeft = '15px';
        topUserActions.appendChild(bgmToggleBtn);
    } else {
        bgmToggleBtn.style.position = 'fixed';
        bgmToggleBtn.style.top = '15px';
        // Secara default (jika bukan nav dan bukan kuis), taruh di kanan
        bgmToggleBtn.style.right = '15px'; 
        bgmToggleBtn.style.zIndex = '9999';
        document.body.appendChild(bgmToggleBtn);
    }

    // Event Klik Toggle
    bgmToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        
        isBgmOn = !isBgmOn;
        localStorage.setItem('bgmEnabled', isBgmOn);
        updateBgmButtonUI();

        if (isBgmOn) {
            globalBGM.play().catch(err=>{});
            globalBgmStarted = true;
        } else {
            globalBGM.pause();
        }
        
        // Mainkan sfx klik khusus toggle agar tetap ada feedback
        const sfxClick = globalClickSFX.cloneNode();
        sfxClick.play().catch(err=>{});
    });
    
    if (!isBgmOn) {
        globalBGM.pause();
    }
});

/* ========================================================
   SISTEM AUTENTIKASI SISWA & PROFIL (Berjalan di setiap halaman student)
   ======================================================== */
document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;
    
    // Hanya jalankan proteksi ini di folder /student/
    const isStudentPage = currentPath.includes('/student/') && !currentPath.includes('login');
    
    if (isStudentPage) {
        // 1. Cek Autentikasi
        const siswaAuth = sessionStorage.getItem('siswaAuth');
        if (!siswaAuth) {
            // Jika belum login, paksa kembali ke login siswa
            window.location.href = '../login-siswa.html';
            return; // hentikan eksekusi script selanjutnya
        }
        
        // 2. Tampilkan Nama dan Kelas di Navigasi
        const dataSiswa = JSON.parse(siswaAuth);
        const navContainer = document.querySelector('.nav-container');
        
        if (navContainer) {
            // Buat elemen widget profil siswa
            const profileWidget = document.createElement('div');
            profileWidget.className = 'student-profile-widget';
            // Styling inline atau bisa dipindah ke css, saya gunakan inline agar aman
            profileWidget.style.display = 'flex';
            profileWidget.style.alignItems = 'center';
            profileWidget.style.gap = '15px';
            
            profileWidget.innerHTML = `
                <span style="background: rgba(255,255,255,0.3); padding: 8px 20px; border-radius: 20px; font-weight: bold; color: white; text-shadow: 1px 1px 2px rgba(0,0,0,0.5); font-size: 1.1rem;">
                    Halo, ${dataSiswa.nama} (Kelas ${dataSiswa.kelas}) 🎓
                </span>
                <button id="btnLogoutSiswa" style="background: #E74C3C; color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer; font-weight: bold; box-shadow: 0 4px 0 #C0392B; font-family: inherit; font-size: 1rem;">Keluar</button>
            `;
            
            // Sisipkan profil ini sebelum tombol Kembali/Home
            const btnHome = navContainer.querySelector('.btn-home');
            if (btnHome) {
                navContainer.insertBefore(profileWidget, btnHome);
            } else {
                navContainer.appendChild(profileWidget);
            }

            // Atur flex pada container nav jika layar sempit
            navContainer.style.flexWrap = 'wrap';

            // 3. Logika Logout
            document.getElementById('btnLogoutSiswa').addEventListener('click', () => {
                // (Efek suara klik sudah ditangani oleh Global Audio Manager)
                
                // Hapus sesi dan kembalikan ke portal
                sessionStorage.removeItem('siswaAuth');
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 300);
            });
        }
    }
});
