/* 
 * Proyek Web Edukasi Literasi Finansial PGSD
 * Author: Aan Rifai (NIM: 2501050298, No. Absen: 28)
 * Universitas Negeri Semarang (UNNES)
 */

document.addEventListener('DOMContentLoaded', async () => {
    const formEksplorasi = document.getElementById('formEksplorasi');
    const limitInfo = document.getElementById('limitInfo');
    const btnSubmit = formEksplorasi ? formEksplorasi.querySelector('button') : null;
    
    // Tampilkan loading di tombol sementara memuat setting
    if (btnSubmit) btnSubmit.textContent = "Memuat...";
    
    // ==========================================
    // 0. LOGIKA TAB (CERITA VS FOTO)
    // ==========================================
    const tabCerita = document.getElementById('tabCerita');
    const tabFoto = document.getElementById('tabFoto');
    const btnLanjutFoto = document.getElementById('btnLanjutFoto');
    const secCerita = document.getElementById('sectionCerita');
    const secFoto = document.getElementById('sectionFoto');
    const secGaleri = document.getElementById('sectionGaleri');

    function switchToFoto() {
        tabCerita.classList.remove('active');
        tabFoto.classList.add('active');
        secCerita.style.display = 'none';
        secFoto.style.display = 'block';
        if (secGaleri) secGaleri.style.display = 'block';
        window.scrollTo(0, 0);
    }

    function switchToCerita() {
        tabFoto.classList.remove('active');
        tabCerita.classList.add('active');
        secFoto.style.display = 'none';
        if (secGaleri) secGaleri.style.display = 'none';
        secCerita.style.display = 'block';
        window.scrollTo(0, 0);
    }

    if (tabCerita && tabFoto) {
        tabCerita.addEventListener('click', switchToCerita);
        tabFoto.addEventListener('click', switchToFoto);
        if (btnLanjutFoto) btnLanjutFoto.addEventListener('click', switchToFoto);
    }

    // ==========================================
    // 0.5 MENGAMBIL CERITA & PENGATURAN SECARA REAL-TIME
    // ==========================================
    let currentStorySettings = null;

    if (typeof listenToStorySettings === 'function') {
        listenToStorySettings((storyData) => {
            currentStorySettings = storyData;
            const teksAturan = document.getElementById('teksAturan');
            const pilihanKelompok = document.getElementById('pilihanKelompok');
            
            if(teksAturan) teksAturan.textContent = storyData.aturan;
            
            // Buat pilihan dropdown sesuai jumlah kelompok
            if (pilihanKelompok && pilihanKelompok.options.length <= 1) {
                const jumlah = storyData.jumlahKelompok || 1;
                for (let i = 1; i <= jumlah; i++) {
                    const opt = document.createElement('option');
                    opt.value = i;
                    opt.textContent = "Kelompok " + i;
                    pilihanKelompok.appendChild(opt);
                }
            }
        });
    }

    // ==========================================
    // ==========================================
    // 0.6 LOGIKA UNDIAN GACHA CERITA
    // ==========================================
    const btnAcakCerita = document.getElementById('btnAcakCerita');
    const pilihKelompokArea = document.getElementById('pilihKelompokArea');
    const hasilCeritaArea = document.getElementById('hasilCeritaArea');

    if (btnAcakCerita) {
        btnAcakCerita.addEventListener('click', async () => {
            const pilihanKelompok = document.getElementById('pilihanKelompok');
            if (!pilihanKelompok.value) {
                alert("Pilih nomor kelompokmu dulu ya!");
                return;
            }

            const kelompokId = parseInt(pilihanKelompok.value);
            btnAcakCerita.textContent = "Mengacak Misi... 🎲";
            btnAcakCerita.disabled = true;

            // Tarik undian cerita dari Firebase
            const hasil = await drawRandomStory(kelompokId);
            // Cek apakah cerita berupa objek (format baru) atau string (format lama)
            let teksMisi = "";
            let uangSakuMisi = 20000; // default

            if (typeof hasil.cerita === 'object' && hasil.cerita !== null) {
                teksMisi = hasil.cerita.teks || "";
                uangSakuMisi = parseInt(hasil.cerita.uangSaku) || 20000;
            } else {
                teksMisi = hasil.cerita || "";
                // Untuk format lama, uang saku bisa dibiarkan default 20000 atau di-fetch nanti
            }

            // Simpan uang saku spesifik ke localStorage agar dipakai oleh kuis-belanja.js
            localStorage.setItem('uangSakuCerita', uangSakuMisi.toString());

            const teksCerita = document.getElementById('teksCerita');
            if(teksCerita) teksCerita.textContent = teksMisi;
            
            const infoUangSakuMisi = document.getElementById('infoUangSakuMisi');
            if(infoUangSakuMisi && typeof formatRupiah === 'function') {
                infoUangSakuMisi.textContent = formatRupiah(uangSakuMisi);
            } else if (infoUangSakuMisi) {
                infoUangSakuMisi.textContent = "Rp " + uangSakuMisi.toLocaleString('id-ID');
            }

            // Sembunyikan area pilih kelompok, tampilkan hasil
            pilihKelompokArea.style.display = 'none';
            hasilCeritaArea.style.display = 'block';
            
            if (hasil.baruSajaDiundi) {
                const sfx = new Audio('../benar.mp3');
                sfx.play().catch(e=>{});
                alert("🎉 Selamat! Kelompokmu telah menerima misi misteri. Baca misinya dan segera foto barangnya!");
            }
        });
    }    // Fitur Upload Foto telah dipindahkan ke Dasbor Guru.
    // Siswa kini langsung beralih ke Kuis Belanja (Pusat Pertokoan).
});
