/* 
 * Proyek Web Edukasi Literasi Finansial PGSD
 * Author: Aan Rifai (NIM: 2501050298, No. Absen: 28)
 * Universitas Negeri Semarang (UNNES)
 */

document.addEventListener('DOMContentLoaded', async () => {
    
    // =====================================
    // 1. VARIABEL STATE (Logika Game) & AUDIO
    // =====================================
    let totalUangDibayar = 0; 
    let soalSaatIni = 0;      
    let skor = 0;             
    let nyawa = 3;            

    // CATAT AKTIVITAS: Mulai Kuis
    if (typeof logActivity === 'function') {
        logActivity('🎮 Memulai Misi: Kuis Belanja');
    }

    let daftarBarang = [
        { nama: "Buku Tulis", harga: 5000 },
        { nama: "Pensil 2B", harga: 3000 },
        { nama: "Penghapus", harga: 1500 },
        { nama: "Kotak Pensil", harga: 12000 },
        { nama: "Cemilan Biskuit", harga: 8500 }
    ];

    const sfxCoin = new Audio('../klik kuis.mp3');
    const sfxKaching = new Audio('../benar.mp3');
    const sfxError = new Audio('../salah.mp3');
    const sfxVictory = new Audio('../sfx game selesai.wav');
    // BGM dan suara klik biasa sekarang ditangani secara otomatis oleh utils.js

    // ==========================================
    // 0. FITUR ROTASI LAYAR (LANDSCAPE LOCK)
    // ==========================================
    const btnForceLandscape = document.getElementById('btnForceLandscape');
    if (btnForceLandscape) {
        btnForceLandscape.addEventListener('click', () => {
            const docElm = document.documentElement;
            // Meminta mode layar penuh (Fullscreen)
            if (docElm.requestFullscreen) {
                docElm.requestFullscreen().then(() => {
                    // Setelah layar penuh, kunci orientasi ke landscape
                    if (screen.orientation && screen.orientation.lock) {
                        screen.orientation.lock('landscape').catch(e => console.log("Gagal mengunci orientasi:", e));
                    }
                }).catch(e => console.log("Gagal masuk layar penuh:", e));
            }
        });
    }

    // =====================================
    // 2. MENGAMBIL ELEMEN DOM HTML
    // =====================================
    const mesinKasirDisplay = document.getElementById('mesinKasirDisplay');
    const bubbleText = document.getElementById('bubbleText');
    const btnBayar = document.getElementById('btnBayar');
    const btnResetUang = document.getElementById('btnResetUang');
    const tombolUang = document.querySelectorAll('.uang-btn');
    
    const overlay = document.getElementById('gameOverlay');
    const overlayBox = document.getElementById('overlayBox');
    const overlayTitle = document.getElementById('overlayTitle');
    const overlayMessage = document.getElementById('overlayMessage');
    const btnLanjut = document.getElementById('btnLanjut');
    
    const scoreDisplay = document.getElementById('scoreDisplay');
    const livesDisplay = document.getElementById('livesDisplay');
    const timerDisplay = document.getElementById('timerDisplay');

    // =====================================
    // 3. FUNGSI-FUNGSI UTAMA GAME
    // =====================================

    async function initGame() {
        try {
            bubbleText.innerHTML = "Menghubungkan ke Database... ⏳";
            
            // Timeout 4 detik jika Firebase lambat atau nyangkut
            const timeoutPromise = new Promise(resolve => setTimeout(() => {
                resolve({ timeout: true, data: [] });
            }, 4000));

            let itemsDariDB = [];
            if(typeof getAllItems === "function") {
                const dbResult = await Promise.race([getAllItems().then(d => ({timeout:false, data:d})), timeoutPromise]);
                if(dbResult.timeout) {
                    bubbleText.innerHTML = "Koneksi lambat, memakai data lokal... ⏱";
                } else {
                    itemsDariDB = dbResult.data;
                }
            }

            const approvedItems = itemsDariDB.filter(item => item.status === 'approved');
            const sourceItems = approvedItems.length > 0 ? approvedItems : (itemsDariDB.length > 0 ? itemsDariDB : daftarBarang);
            
            if (sourceItems && sourceItems.length > 0) {
                daftarBarang = shuffleArray([...sourceItems]).slice(0, 5);
            }

            await tampilkanSoal();
            mulaiTimer(60); 
        } catch (error) {
            bubbleText.innerHTML = "Error sistem: " + error.message;
        }
    }

    async function tampilkanSoal() {
        try {
            if (soalSaatIni < daftarBarang.length && nyawa > 0) {
                const barang = daftarBarang[soalSaatIni];
                if (!barang) throw new Error("Barang kosong");

                let imgHTML = '';
                if (barang.fotoBase64) {
                    imgHTML = `<img src="${barang.fotoBase64}" alt="${barang.nama}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 10px; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.2); margin-bottom: 10px;"><br>`;
                } else {
                    imgHTML = `<div style="font-size: 4rem; margin-bottom: 10px;">📦</div>`; 
                }

                let hargaText = "Gratis";
                if (barang.harga && !isNaN(barang.harga)) {
                    hargaText = formatRupiah(barang.harga);
                }

                bubbleText.innerHTML = `
                    ${imgHTML}
                    ${barang.nama || "Barang Tanpa Nama"}<br>
                    <span style="color: #D35400; font-size: 1.4rem;">${hargaText}</span> x 1
                `;
                resetMesinKasir();
            } else {
            // GAME OVER ATAU MENANG
            // Putar suara kemenangan/selesai jika nyawa > 0, jika tidak bisa pakai suara error
            if(nyawa > 0) {
                sfxVictory.currentTime = 0;
                sfxVictory.play();
            } else {
                sfxError.currentTime = 0;
                sfxError.play();
            }

            // [LOGIKA BARU] - Menyimpan nilai siswa ke database guru (Firebase)
            const authData = sessionStorage.getItem('siswaAuth');
            if (authData && typeof saveStudentResult === "function") {
                const siswa = JSON.parse(authData);
                try {
                    await saveStudentResult({
                        nama: siswa.nama,
                        kelas: siswa.kelas,
                        aktivitas: "Kuis Belanja",
                        skorAkhir: skor,
                        catatan: `Sisa Nyawa: ${nyawa}`
                    });
                } catch(e) {
                    console.error("Gagal menyimpan hasil kuis", e);
                }
            }

            let judulGameOver = nyawa > 0 ? "Kamu Hebat!" : "Game Over!";
            tampilkanOverlay(judulGameOver, `Semua soal telah dijawab.<br>Skor akhir kamu: <b>${skor}</b>.<br>Nyawa tersisa: <b>${nyawa}</b>.`, "info");
            
            btnLanjut.textContent = "Main Lagi 🔄";
            btnLanjut.onclick = () => location.reload();
        }
        } catch (error) {
            bubbleText.innerHTML = "Error sistem: " + error.message;
        }
    }

    function updateLayarKasir() {
        mesinKasirDisplay.textContent = new Intl.NumberFormat('id-ID').format(totalUangDibayar);
    }

    function resetMesinKasir() {
        totalUangDibayar = 0;
        updateLayarKasir();
    }

    function updateNyawa() {
        let ikonNyawa = "";
        for(let i=0; i<nyawa; i++){
            ikonNyawa += "😀 ";
        }
        for(let i=nyawa; i<3; i++){
            ikonNyawa += "💀 ";
        }
        livesDisplay.textContent = ikonNyawa;
    }

    let timerInterval;
    function mulaiTimer(durasiDetik) {
        let waktu = durasiDetik;
        clearInterval(timerInterval);
        
        timerInterval = setInterval(() => {
            waktu--;
            let menit = Math.floor(waktu / 60);
            let detik = waktu % 60;
            
            detik = detik < 10 ? "0" + detik : detik;
            timerDisplay.textContent = `0${menit}:${detik}`;
            
            if (waktu <= 0) {
                clearInterval(timerInterval);
                nyawa = 0;
                updateNyawa();
                tampilkanSoal(); 
            }
        }, 1000); 
    }

    // =====================================
    // 4. EVENT LISTENER (Interaksi Klik)
    // =====================================

    tombolUang.forEach(tombol => {
        tombol.addEventListener('click', (e) => {
            // Memainkan efek suara koin/uang saat ditekan
            sfxCoin.currentTime = 0; // Reset waktu agar bisa diputar beruntun dengan cepat
            sfxCoin.play().catch(e => {});

            const nominal = parseInt(e.target.getAttribute('data-nominal'));
            totalUangDibayar += nominal;
            updateLayarKasir();
        });
    });

    btnResetUang.addEventListener('click', () => {
        resetMesinKasir();
    });

    btnBayar.addEventListener('click', () => {
        const barang = daftarBarang[soalSaatIni];
        const hargaAsli = barang.harga;

        if (totalUangDibayar < hargaAsli) {
            // UANG KURANG
            sfxError.currentTime = 0;
            sfxError.play().catch(e => {});

            nyawa--;        
            updateNyawa();  
            
            tampilkanOverlay(
                "Yah, Uang Kurang!", 
                `Uang yang kamu berikan <b>(${formatRupiah(totalUangDibayar)})</b> masih kurang dari harga barang <b>(${formatRupiah(hargaAsli)})</b>.`, 
                "error"
            );
        } else {
            // UANG PAS ATAU LEBIH (ADA KEMBALIAN)
            sfxKaching.currentTime = 0;
            sfxKaching.play().catch(e => {});

            let kembalian = totalUangDibayar - hargaAsli; 
            skor += 20; 
            scoreDisplay.textContent = skor; 
            
            let pesan = "Hore! Barang berhasil dibeli.";
            if (kembalian > 0) {
                pesan += `<br><br>Kamu mendapat uang kembalian sebesar:<br><b style="font-size:1.5rem; color:#2ECC71;">${formatRupiah(kembalian)}</b>`;
            }
            
            tampilkanOverlay("Pembayaran Berhasil!", pesan, "success");
            soalSaatIni++; 
        }
    });

    // =====================================
    // 5. FUNGSI KONTROL OVERLAY (POPUP)
    // =====================================

    function tampilkanOverlay(judul, pesan, tema) {
        overlayTitle.textContent = judul;
        overlayMessage.innerHTML = pesan; 
        
        overlayBox.className = "overlay-box"; 
        if (tema === "success") {
            overlayBox.classList.add("success-theme");
        } else if (tema === "error") {
            overlayBox.classList.add("error-theme");
        }

        overlay.classList.remove('hidden');
    }

    btnLanjut.addEventListener('click', () => {
        overlay.classList.add('hidden');
        
        if (nyawa > 0 && btnLanjut.textContent !== "Main Lagi 🔄") {
            if(overlayBox.classList.contains("success-theme")){
                tampilkanSoal();
            } else {
                resetMesinKasir(); 
            }
        } else if (nyawa <= 0) {
            tampilkanSoal(); 
        }
    });

    // Mulai Game
    initGame();
});
