document.addEventListener('DOMContentLoaded', async () => {
    // Override suara global dengan versi khusus kuis
    if (window.audios) {
        if (window.audios.bgm) {
            window.audios.bgm.src = '../backsound kuis.mp3';
            window.audios.bgm.load();
        }
        if (window.audios.click) {
            window.audios.click.src = '../klik kuis.mp3';
            window.audios.click.load();
        }
    }

    /* =========================================
       1. DEKLARASI VARIABEL & ELEMEN
       ========================================= */
    const budgetDisplay = document.getElementById('budgetDisplay');
    const btnBukaRak = document.getElementById('btnBukaRak');
    const modalRak = document.getElementById('modalRak');
    const btnTutupRak = document.getElementById('btnTutupRak');
    const shopTabsContainer = document.getElementById('shopTabsContainer');
    const rakBarangGrid = document.getElementById('rakBarangGrid');
    
    const pertanyaanKasir = document.getElementById('pertanyaanKasir');
    const uangTerkumpulDisplay = document.getElementById('uangTerkumpulDisplay');
    const btnResetUang = document.getElementById('btnResetUang');
    const btnBayar = document.getElementById('btnBayar');
    const keranjangVisual = document.getElementById('keranjangVisual');
    const feedbackToast = document.getElementById('feedbackToast');

    let uangSaku = 0;
    let uangTerkumpul = 0;
    let allItems = [];
    let currentShop = 'all';
    let selectedItemForBuy = null;
    
    // VARIABEL BARU UNTUK FITUR EVALUASI & TIMER
    let saldoAwal = 0;
    let daftarBelanjaan = [];
    let sisaWaktu = 120; // 2 Menit (120 detik)
    let timerInterval = null;
    let isGameEnded = false;

    // ELEMEN DOM BARU
    const timerDisplay = document.getElementById('timerDisplay');
    const btnSelesaiBelanja = document.getElementById('btnSelesaiBelanja');
    const areaGame = document.querySelector('.game-area');
    const headerGame = document.querySelector('.game-header');
    const sectionEvaluasi = document.getElementById('evaluasi-belanja');
    const evalSaldoAwal = document.getElementById('evalSaldoAwal');
    const evalSisaSaldo = document.getElementById('evalSisaSaldo');
    const evalTabelBody = document.getElementById('evalTabelBody');
    const teksSisaUang = document.getElementById('teksSisaUang');
    const inputPerencanaan = document.getElementById('inputPerencanaan');
    const btnSimpanEvaluasi = document.getElementById('btnSimpanEvaluasi');
    const btnTutupEvaluasi = document.getElementById('btnTutupEvaluasi');

    // SFX
    const sfxKoin = new Audio('../klik kuis.mp3');
    const sfxBenar = new Audio('../benar.mp3');
    const sfxSalah = new Audio('../salah.mp3');
    const sfxSelesai = new Audio('../u_o8xh7gwsrj-cute_happy_victory-476376.mp3');

    /* =========================================
       2. FUNGSI UTILITAS
       ========================================= */
    function formatRupiah(number) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number);
    }

    function showFeedback(message, isSuccess) {
        feedbackToast.textContent = message;
        feedbackToast.style.background = isSuccess ? '#27AE60' : '#E74C3C';
        feedbackToast.style.display = 'block';
        
        if (isSuccess) sfxBenar.play().catch(e=>{});
        else sfxSalah.play().catch(e=>{});

        setTimeout(() => {
            feedbackToast.style.display = 'none';
        }, 3000);
    }

    function updateWalletUI() {
        const formatted = formatRupiah(uangSaku);
        if (budgetDisplay) budgetDisplay.textContent = formatted;
        
        // Perbarui sisa uang saku di header modal Rak Toko
        const modalBudgetDisplay = document.getElementById('modalBudgetDisplay');
        if (modalBudgetDisplay) modalBudgetDisplay.textContent = formatted;
    }

    function updateCashierUI() {
        uangTerkumpulDisplay.textContent = uangTerkumpul;
    }

    /* =========================================
       3. INIT & LOAD DATA
       ========================================= */
    async function initData() {
        try {
            const savedUangSaku = localStorage.getItem('uangSakuCerita');
            
            if (savedUangSaku) {
                uangSaku = parseInt(savedUangSaku);
            } else if (typeof getStorySettings === 'function') {
                const storySettings = await getStorySettings();
                uangSaku = storySettings.uangSakuAwal || 20000;
            } else {
                uangSaku = 20000;
            }
            
            saldoAwal = uangSaku; // Catat saldo awal untuk evaluasi
            updateWalletUI();

            if (typeof getAllItems === 'function') {
                const fetchedItems = await getAllItems();
                allItems = fetchedItems.filter(item => item.uploader === 'guru');
            }

            renderShopTabs();
            renderItemsGrid();

        } catch (error) {
            console.error("Gagal memuat data:", error);
            rakBarangGrid.innerHTML = '<p style="color:red; text-align:center;">Gagal memuat data toko.</p>';
        }
    }

    /* =========================================
       4. MODAL RAK TOKO
       ========================================= */
    btnBukaRak.addEventListener('click', () => { modalRak.style.display = 'flex'; });
    btnTutupRak.addEventListener('click', () => { modalRak.style.display = 'none'; });

    function renderShopTabs() {
        const uniqueShops = [...new Set(allItems.map(item => item.toko || 'Toko Umum'))];
        shopTabsContainer.innerHTML = '<div class="shop-tab active" data-shop="all">🌟 Semua Toko</div>';
        
        uniqueShops.forEach(shopName => {
            const tab = document.createElement('div');
            tab.className = 'shop-tab';
            tab.setAttribute('data-shop', shopName);
            tab.textContent = `🏪 ${shopName}`;
            shopTabsContainer.appendChild(tab);
        });

        const tabs = shopTabsContainer.querySelectorAll('.shop-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                tabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                currentShop = e.target.getAttribute('data-shop');
                renderItemsGrid();
            });
        });
    }

    function renderItemsGrid() {
        rakBarangGrid.innerHTML = '';
        let filteredItems = currentShop === 'all' ? allItems : allItems.filter(item => (item.toko || 'Toko Umum') === currentShop);

        if (filteredItems.length === 0) {
            rakBarangGrid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: #7F8C8D; padding: 20px;">Toko ini kosong.</p>`;
            return;
        }

        filteredItems.forEach((item) => {
            if (typeof item.jumlahPilihan === 'undefined') item.jumlahPilihan = 0;

            const card = document.createElement('div');
            card.className = 'item-card';

            const imgSrc = item.fotoBase64 || '../aset student/dompet.png';
            card.innerHTML = `
                <img src="${imgSrc}" class="item-img" alt="${item.nama}">
                <div class="item-name">${item.nama}</div>
                <div class="item-price">${formatRupiah(item.harga)}</div>
                
                <div style="margin: 10px 0; display:flex; align-items:center; justify-content:center; gap:10px;">
                    <button class="btn-min" style="width:30px; height:30px; border-radius:5px; border:none; background:#E74C3C; color:white; font-weight:bold; cursor:pointer;">-</button>
                    <span class="qty-display" style="font-size:1.2rem; font-weight:bold;">${item.jumlahPilihan}</span>
                    <button class="btn-plus" style="width:30px; height:30px; border-radius:5px; border:none; background:#2ECC71; color:white; font-weight:bold; cursor:pointer;">+</button>
                </div>
            `;

            const btnMin = card.querySelector('.btn-min');
            const btnPlus = card.querySelector('.btn-plus');
            const qtyDisplay = card.querySelector('.qty-display');

            btnMin.addEventListener('click', (e) => {
                e.stopPropagation(); // Mencegah klik menembus ke card
                if(item.jumlahPilihan > 0) {
                    item.jumlahPilihan--;
                    qtyDisplay.textContent = item.jumlahPilihan;
                }
            });

            btnPlus.addEventListener('click', (e) => {
                e.stopPropagation();
                item.jumlahPilihan++;
                qtyDisplay.textContent = item.jumlahPilihan;
            });

            rakBarangGrid.appendChild(card);
        });
    }

    const btnMulaiBermain = document.getElementById('btnMulaiBermain');
    const barangAtasKasir = document.getElementById('barangAtasKasir');
    let currentCheckoutIndex = 0; // Menyimpan index barang yang sedang dikasir

    if (btnMulaiBermain) {
        btnMulaiBermain.addEventListener('click', () => {
            // Ambil semua barang yang jumlahPilihannya > 0
            keranjangPilihan = allItems.filter(item => item.jumlahPilihan > 0).map(item => ({...item, jumlah: item.jumlahPilihan}));
            
            if (keranjangPilihan.length === 0) {
                Swal.fire({
                    title: 'Keranjang Kosong!',
                    text: 'Pilih minimal 1 barang terlebih dahulu!',
                    icon: 'warning',
                    confirmButtonColor: '#F39C12'
                });
                return;
            }

            currentCheckoutIndex = 0; // Mulai dari barang pertama
            modalRak.style.display = 'none'; // Tutup rak
            
            // Sembunyikan tombol Buka Rak jika game sudah dimulai
            btnBukaRak.style.display = 'none';
            
            renderPercakapanKasir();
            
            uangTerkumpul = 0;
            updateCashierUI();
            
            mulaiTimer(); // Mulai timer sekarang
        });
    }

    // Fungsi render percakapan per barang (1 per 1)
    window.renderPercakapanKasir = function() {
        if (!keranjangPilihan || keranjangPilihan.length === 0 || currentCheckoutIndex >= keranjangPilihan.length) {
            pertanyaanKasir.innerHTML = `Semua barang yang kamu pilih sudah selesai dibayar. Terima kasih!`;
            return;
        }
        
        const currentItem = keranjangPilihan[currentCheckoutIndex];
        const imgSrc = currentItem.fotoBase64 || '../aset student/dompet.png';

        pertanyaanKasir.innerHTML = `
            <div style="display:flex; justify-content:center; margin-bottom:10px;">
                <img src="${imgSrc}" style="width:60px; height:60px; object-fit:contain; background:rgba(255,255,255,0.8); border-radius:10px; box-shadow:0 2px 5px rgba(0,0,0,0.2);">
            </div>
            Barang ke-${currentCheckoutIndex + 1} dari ${keranjangPilihan.length}:<br>
            <strong>${currentItem.jumlah}x ${currentItem.nama}</strong> (@${formatRupiah(currentItem.harga)}/buah).<br>
            <strong>Berapa total yang harus kamu bayar untuk ini?</strong><br>
            Silakan susun uangnya di meja!
        `;
    };

    /* =========================================
       5. INTERAKSI UANG (DOMPET & KASIR)
       ========================================= */
    const uangButtons = document.querySelectorAll('.uang-btn');
    uangButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (!keranjangPilihan || keranjangPilihan.length === 0 || currentCheckoutIndex >= keranjangPilihan.length) {
                showFeedback('Kamu belum memilih barang apapun untuk dibayar!', false);
                return;
            }

            const nominal = parseInt(e.target.getAttribute('data-nominal'));
            uangTerkumpul += nominal;
            updateCashierUI();

            // Clone node agar efek suara bisa diputar bertumpuk walau diklik secara cepat beruntun
            const sfxKoinClone = sfxKoin.cloneNode();
            sfxKoinClone.play().catch(err=>{});

            // Animasi uang terbang ke kasir
            const uangClone = e.target.cloneNode(true);
            uangClone.style.position = 'fixed';
            uangClone.style.zIndex = '9999';
            
            const rectStart = e.target.getBoundingClientRect();
            uangClone.style.left = rectStart.left + 'px';
            uangClone.style.top = rectStart.top + 'px';
            
            document.body.appendChild(uangClone);
            
            const rectEnd = uangTerkumpulDisplay.getBoundingClientRect();
            const animasi = uangClone.animate([
                { left: rectStart.left + 'px', top: rectStart.top + 'px', transform: 'scale(1)', opacity: 1 },
                { left: rectEnd.left + 'px', top: rectEnd.top + 'px', transform: 'scale(0.5)', opacity: 0 }
            ], {
                duration: 500,
                easing: 'ease-in-out'
            });

            animasi.onfinish = () => { uangClone.remove(); };
        });
    });

    btnResetUang.addEventListener('click', () => {
        uangTerkumpul = 0;
        updateCashierUI();
    });

    btnBayar.addEventListener('click', () => {
        if (!keranjangPilihan || keranjangPilihan.length === 0 || currentCheckoutIndex >= keranjangPilihan.length) {
            showFeedback('Belum ada barang atau semua barang sudah dibayar!', false);
            return;
        }

        const currentItem = keranjangPilihan[currentCheckoutIndex];
        const currentTotal = currentItem.harga * currentItem.jumlah;

        // Cek apakah uang yang diserahkan PAS
        if (uangTerkumpul !== currentTotal) {
            showFeedback(`Uang yang kamu serahkan (Rp${uangTerkumpul}) salah! Hitung lagi dengan teliti.`, false);
            uangTerkumpul = 0;
            updateCashierUI();
            return;
        }

        // Cek apakah modal uang saku masih cukup
        if (uangSaku < currentTotal) {
            showFeedback('Uang Saku Misimu tidak cukup untuk membayar ini!', false);
            uangTerkumpul = 0;
            updateCashierUI();
            return;
        }

        // BERHASIL DIBELI
        uangSaku -= currentTotal;
        updateWalletUI();
        
        showFeedback(`Hebat! Pembayaran untuk ${currentItem.nama} benar.`, true);
        
        // Buat efek partikel cahaya dan masukkan barang ke keranjang
        for (let i = 0; i < currentItem.jumlah; i++) {
            // Catat ke daftar belanjaan
            daftarBelanjaan.push({
                foto: currentItem.fotoBase64 || '',
                nama: currentItem.nama,
                harga: currentItem.harga
            });

            // Efek Partikel
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'particle';
                
                // Posisikan partikel mulai dari foto barang di bubble chat
                let startX = 0;
                let startY = 0;
                const bubbleImg = document.querySelector('#pertanyaanKasir img');
                
                if (bubbleImg) {
                    const imgRect = bubbleImg.getBoundingClientRect();
                    startX = imgRect.left + (imgRect.width / 2);
                    startY = imgRect.top + (imgRect.height / 2);
                } else {
                    const kasirRect = document.querySelector('.area-kanan').getBoundingClientRect();
                    startX = kasirRect.left + 50;
                    startY = kasirRect.top + 100;
                }
                
                particle.style.left = startX + 'px';
                particle.style.top = startY + 'px';
                document.body.appendChild(particle);
                
                setTimeout(() => particle.remove(), 500);

                // Tambahkan visual barang ke dalam keranjang
                const img = document.createElement('img');
                img.src = currentItem.fotoBase64 || '';
                img.title = currentItem.nama;
                img.className = 'dropped'; // CSS class animasi masuk
                keranjangVisual.appendChild(img);
            }, (i * 200)); // Jeda animasi bertahap
        }

        // Lanjut ke barang berikutnya setelah animasi
        currentCheckoutIndex++;
        uangTerkumpul = 0;
        updateCashierUI();
        
        setTimeout(() => {
            if (currentCheckoutIndex >= keranjangPilihan.length) {
                // Semua barang sudah selesai dibayar
                setTimeout(() => {
                    akhiriGame();
                }, 1000); // Tunggu sampai partikel terakhir selesai
            } else {
                // Render percakapan untuk barang berikutnya
                renderPercakapanKasir();
            }
        }, currentItem.jumlah * 200 + 500);
    });

    /* =========================================
       6. OVERLAY ROTASI LAYAR
       ========================================= */
    const rotateOverlay = document.getElementById('rotateOverlay');
    const btnForceLandscape = document.getElementById('btnForceLandscape');
    
    function checkOrientation() {
        if (window.innerHeight > window.innerWidth) {
            rotateOverlay.style.display = 'flex';
        } else {
            rotateOverlay.style.display = 'none';
        }
    }

    window.addEventListener('resize', checkOrientation);
    checkOrientation();

    btnForceLandscape.addEventListener('click', () => {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().then(() => {
                if (screen.orientation && screen.orientation.lock) {
                    screen.orientation.lock('landscape').catch(console.error);
                }
            }).catch(console.error);
        }
    });

    /* =========================================
       7. LOGIKA TIMER & EVALUASI
       ========================================= */
    function formatWaktu(detik) {
        const m = Math.floor(detik / 60).toString().padStart(2, '0');
        const s = (detik % 60).toString().padStart(2, '0');
        return `⏱️ ${m}:${s}`;
    }

    function mulaiTimer() {
        if (timerInterval) clearInterval(timerInterval);
        
        timerDisplay.textContent = formatWaktu(sisaWaktu);
        
        timerInterval = setInterval(() => {
            if (isGameEnded) {
                clearInterval(timerInterval);
                return;
            }

            sisaWaktu--;
            timerDisplay.textContent = formatWaktu(sisaWaktu);

            if (sisaWaktu <= 10 && sisaWaktu > 0) {
                timerDisplay.classList.add('warning'); // Efek kedip merah
            }

            if (sisaWaktu <= 0) {
                clearInterval(timerInterval);
                akhiriGame();
            }
        }, 1000);
    }

    function akhiriGame() {
        if (isGameEnded) return;
        isGameEnded = true;
        
        // Hentikan timer dan hapus efek
        if (timerInterval) clearInterval(timerInterval);
        timerDisplay.classList.remove('warning');

        // Mainkan SFX Selesai
        sfxSelesai.play().catch(err => console.log('Gagal play sfx selesai:', err));

        // Transisi Halus: Sembunyikan area game dengan fade out
        areaGame.style.transition = 'opacity 0.5s ease';
        headerGame.style.transition = 'opacity 0.5s ease';
        areaGame.style.opacity = '0';
        headerGame.style.opacity = '0';

        setTimeout(() => {
            areaGame.style.display = 'none';
            headerGame.style.display = 'none';

            // Munculkan layar evaluasi dengan animasi fade in & slide up
            sectionEvaluasi.style.display = 'flex';
            sectionEvaluasi.style.opacity = '0';
            
            // Trigger reflow agar animasi jalan
            void sectionEvaluasi.offsetWidth;
            
            sectionEvaluasi.style.transition = 'opacity 0.8s ease';
            sectionEvaluasi.style.opacity = '1';
        }, 500);

        // Tampilkan Saldo
        evalSaldoAwal.textContent = formatRupiah(saldoAwal);
        evalSisaSaldo.textContent = formatRupiah(uangSaku);
        teksSisaUang.textContent = formatRupiah(uangSaku);

        // Isi Tabel Daftar Belanjaan
        evalTabelBody.innerHTML = '';
        if (daftarBelanjaan.length === 0) {
            evalTabelBody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px; color:#7F8C8D;">Kamu tidak membeli apa-apa.</td></tr>`;
        } else {
            daftarBelanjaan.forEach(item => {
                const tr = document.createElement('tr');
                tr.className = 'evaluasi-row';
                tr.innerHTML = `
                    <td><img src="${item.foto}" class="evaluasi-item-img"></td>
                    <td class="evaluasi-item-name">${item.nama}</td>
                    <td class="evaluasi-item-price">${formatRupiah(item.harga)}</td>
                `;
                evalTabelBody.appendChild(tr);
            });
        }
    }

    btnSelesaiBelanja.addEventListener('click', () => {
        Swal.fire({
            title: 'Selesai Belanja?',
            text: 'Apakah kamu yakin ingin menyudahi belanja sekarang?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#27AE60',
            cancelButtonColor: '#E74C3C',
            confirmButtonText: 'Ya, Selesai!',
            cancelButtonText: 'Lanjut Belanja'
        }).then((result) => {
            if (result.isConfirmed) {
                akhiriGame();
            }
        });
    });

    btnSimpanEvaluasi.addEventListener('click', async () => {
        const rencana = inputPerencanaan.value.trim();
        if (!rencana) {
            Swal.fire({
                title: 'Rencana Belum Diisi!',
                text: 'Tuliskan dulu rencanamu untuk sisa uang tersebut!',
                icon: 'info',
                confirmButtonColor: '#3498DB'
            });
            return;
        }

        btnSimpanEvaluasi.disabled = true;
        btnSimpanEvaluasi.textContent = 'Menyimpan... ⏳';

        try {
            let userNama = "Siswa (Tanpa Login)";
            const auth = sessionStorage.getItem('siswaAuth');
            if (auth) {
                userNama = JSON.parse(auth).nama;
            }

            // Simpan ke Firestore
            if (typeof db !== 'undefined') {
                await db.collection('perencanaan').add({
                    namaSiswa: userNama,
                    saldoAwal: saldoAwal,
                    sisaSaldo: uangSaku,
                    daftarBelanjaan: daftarBelanjaan,
                    rencanaSisaUang: rencana,
                    tanggal: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            // Integrasi dengan Dashboard Guru (Sistem Tab)
            if (auth && typeof saveStudentResult === 'function') {
                const parsedAuth = JSON.parse(auth);
                const status = uangSaku >= 0 ? "Aman (Tersisa)" : "Minus (Hutang)";
                
                // Hitung total belanja
                const totalBelanja = daftarBelanjaan.reduce((sum, item) => sum + item.harga, 0);
                const jumlahBarang = daftarBelanjaan.length;
                
                // Generate HTML rincian barang beserta foto (Dikabungkan jika barang sama)
                const groupedItems = {};
                daftarBelanjaan.forEach(item => {
                    if (!groupedItems[item.nama]) {
                        groupedItems[item.nama] = { ...item, qty: 1, subtotal: item.harga };
                    } else {
                        groupedItems[item.nama].qty += 1;
                        groupedItems[item.nama].subtotal += item.harga;
                    }
                });

                let rincianBarangHTML = '<div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:10px; margin-bottom:15px;">';
                if (jumlahBarang === 0) {
                    rincianBarangHTML += '<span style="font-size:1.1rem; color:#7F8C8D;"><i>Tidak membeli apa-apa</i></span>';
                } else {
                    Object.values(groupedItems).forEach(item => {
                        let qtyBadge = item.qty > 1 ? `<div style="position:absolute; top:10px; right:10px; background:#F1C40F; color:#000; font-weight:bold; font-size:1.1rem; padding:5px 12px; border-radius:15px; border:2px solid #D4AC0D; box-shadow:0 2px 5px rgba(0,0,0,0.4); z-index:2;">x${item.qty}</div>` : '';
                        rincianBarangHTML += `
                            <div style="background:#fff; border:2px solid #ecf0f1; border-radius:15px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 5px 15px rgba(0,0,0,0.1); position:relative; width:220px;">
                                ${qtyBadge}
                                <img src="${item.foto}" style="width:100%; height:150px; object-fit:cover; z-index:1; border-bottom:2px solid #f1f2f6;">
                                <div style="padding:15px; line-height:1.4; text-align:left;">
                                    <div style="font-size:1.3rem; font-weight:900; color:#2C3E50; margin-bottom:8px;">${item.nama}</div>
                                    <div style="font-size:1.2rem; color:#E74C3C; font-weight:800;">Rp ${item.subtotal.toLocaleString('id-ID')}</div>
                                </div>
                            </div>
                        `;
                    });
                }
                rincianBarangHTML += '</div>';

                // Rangkum catatan lengkap
                const catatanFormatted = `
                    <div style="font-size:1.2rem; line-height:1.5;">
                        <strong style="font-size:1.3rem; color:#34495E;">🛒 Total Belanja (${jumlahBarang} Barang):</strong> <span style="font-weight:900; color:#2C3E50;">Rp ${totalBelanja.toLocaleString('id-ID')}</span>
                        ${rincianBarangHTML}
                        <hr style="margin:12px 0; border:0; border-top:2px dashed #bdc3c7;">
                        <strong>Modal Awal:</strong> Rp ${saldoAwal.toLocaleString('id-ID')}<br>
                        <strong>Sisa Saldo Akhir:</strong> <span style="color:${uangSaku >= 0 ? '#27AE60' : '#E74C3C'}; font-weight:900; font-size:1.3rem;">Rp ${uangSaku.toLocaleString('id-ID')}</span><br>
                        <strong>Status:</strong> <span style="font-weight:bold; background:${uangSaku >= 0 ? '#d5f5e3' : '#fadbd8'}; padding:2px 8px; border-radius:6px; color:${uangSaku >= 0 ? '#1e8449' : '#c0392b'};">${status}</span><br>
                        <div style="background:#e8f4f8; padding:12px 15px; border-radius:8px; margin-top:12px; border-left:5px solid #3498DB; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
                            <strong style="color:#2980B9; font-size:1.15rem;">💡 Rencana Penggunaan Sisa Uang:</strong><br>
                            <i style="color:#34495E; font-size:1.1rem;">"${rencana}"</i>
                        </div>
                    </div>
                `;

                await saveStudentResult({
                    nama: parsedAuth.nama,
                    kelas: parsedAuth.kelas,
                    aktivitas: "Mini-Game Belanja",
                    skorAkhir: `Rp ${uangSaku}`,
                    catatan: catatanFormatted
                });
            }

            Swal.fire({
                title: 'Luar Biasa!',
                text: 'Laporan keuanganmu telah tersimpan.',
                icon: 'success',
                confirmButtonColor: '#27AE60'
            }).then(() => {
                // Arahkan kembali ke portal
                window.location.href = 'index.html';
            });

        } catch (error) {
            console.error('Gagal menyimpan evaluasi:', error);
            Swal.fire({
                title: 'Gagal Menyimpan',
                text: 'Gagal menyimpan data. Pastikan koneksi internetmu aktif!',
                icon: 'error',
                confirmButtonColor: '#E74C3C'
            });
            btnSimpanEvaluasi.disabled = false;
            btnSimpanEvaluasi.textContent = '💾 Simpan ke Buku Tabungan';
        }
    });

    if (btnTutupEvaluasi) {
        btnTutupEvaluasi.addEventListener('click', () => {
            Swal.fire({
                title: 'Keluar Laporan?',
                text: 'Yakin ingin keluar dari laporan? Rencana sisa uangmu mungkin belum tersimpan.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#E74C3C',
                cancelButtonColor: '#95A5A6',
                confirmButtonText: 'Ya, Keluar',
                cancelButtonText: 'Batal'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = 'index.html';
                }
            });
        });
    }

    // Panggil inisialisasi
    initData();
});
