/* 
 * Proyek Web Edukasi Literasi Finansial PGSD
 * Author: Aan Rifai (NIM: 2501050298, No. Absen: 28)
 * Universitas Negeri Semarang (UNNES)
 */

// Menunggu hingga seluruh elemen HTML (DOM) selesai dimuat di browser
document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. Cek Autentikasi Guru
    // ==========================================
    if (!sessionStorage.getItem('guruAuth')) {
        window.location.href = '../login-guru.html';
        return; // Hentikan script jika tidak memiliki izin
    }

    // ==========================================
    // 2. Logika Logout & Ganti Akun
    // ==========================================
    const handleLogout = (e) => {
        e.preventDefault();
        sessionStorage.removeItem('guruAuth');
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 300);
    };

    const btnLogoutGuru = document.querySelector('.btn-logout-new');
    if (btnLogoutGuru) {
        btnLogoutGuru.addEventListener('click', handleLogout);
    }

    /* =========================================
       2.5. LOGIKA NAVIGASI SIDEBAR (TAB SWITCHING)
       ========================================= */
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const sections = document.querySelectorAll('.dashboard-section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Hapus class active dari semua menu
            navItems.forEach(nav => nav.classList.remove('active'));
            // Tambahkan class active ke menu yang di-klik
            item.classList.add('active');
            
            // Sembunyikan semua section
            sections.forEach(sec => sec.style.display = 'none');
            
            // Tampilkan section yang sesuai dengan data-target
            const targetId = item.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.style.display = 'block';
            }
        });
    });

    /* =========================================
       3. PENGATURAN LIMIT FOTO EKSPLORASI
       ========================================= */
    const limitInput = document.getElementById('limitFoto');
    const btnSaveLimit = document.getElementById('btnSaveLimit');
    const saveMessage = document.getElementById('saveMessage');

    // Mengambil data pengaturan secara asinkron
    async function loadSettings() {
        if(limitInput && typeof getSettings === 'function') {
            const settings = await getSettings();
            limitInput.value = settings.limitFoto;
        }
        
        // Memuat pengaturan cerita dan kelompok
        if(typeof getStorySettings === 'function') {
            const storySet = await getStorySettings();
            const aturanInput = document.getElementById('aturanMain');
            const kelompokInput = document.getElementById('jumlahKelompok');
            if(aturanInput) aturanInput.value = storySet.aturan;
            
            if(kelompokInput) {
                kelompokInput.value = storySet.jumlahKelompok;
                // Render textareas berdasarkan jumlah kelompok
                renderCeritaInputs(storySet.jumlahKelompok, storySet.kumpulanCerita || []);
                
                // Tambahkan event listener saat jumlah kelompok berubah
                kelompokInput.addEventListener('change', (e) => {
                    const count = parseInt(e.target.value) || 1;
                    // Kumpulkan nilai yang sudah diketik agar tidak hilang
                    const currentStories = collectCeritaInputs();
                    renderCeritaInputs(count, currentStories);
                });
            }
        }
    }
    loadSettings();

    // Listener Real-time untuk Status Undian Kelompok
    if (typeof listenToStorySettings === 'function') {
        listenToStorySettings((storySet) => {
            const statusText = document.getElementById('undianStatusText');
            const statusList = document.getElementById('undianList');
            if (!statusText || !statusList) return;

            const alokasi = storySet.alokasiCerita || {};
            const totalKelompok = storySet.jumlahKelompok || 1;
            const pickedCount = Object.keys(alokasi).length;

            statusText.textContent = `${pickedCount} dari ${totalKelompok} Kelompok telah mengundi.`;
            
            if (pickedCount === 0) {
                statusList.innerHTML = '<li style="color: #7F8C8D;">Belum ada kelompok yang mengundi.</li>';
            } else {
                statusList.innerHTML = '';
                for (const [kelompokId, storyIndex] of Object.entries(alokasi)) {
                    const li = document.createElement('li');
                    li.style.marginBottom = "5px";
                    li.style.padding = "5px";
                    li.style.borderBottom = "1px dashed #bdc3c7";
                    li.innerHTML = `<span style="display:inline-block; width:100px; font-weight:bold; color:#E67E22;">Kelompok ${kelompokId}</span> ➡️ <span style="font-weight:bold; color:#2C3E50;">Mendapat Cerita ${parseInt(storyIndex)+1}</span>`;
                    statusList.appendChild(li);
                }
            }
        });
    }

    function renderCeritaInputs(count, existingStories) {
        const container = document.getElementById('ceritaContainer');
        if (!container) return;
        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const storyData = existingStories[i] || {};
            const val = typeof storyData === 'string' ? storyData : (storyData.teks || '');
            const uangSaku = typeof storyData === 'object' && storyData.uangSaku ? storyData.uangSaku : 20000;
            container.innerHTML += `
                <div style="display:flex; flex-direction:column; gap:5px; border:1px dashed #ccc; padding:10px; border-radius:5px;">
                    <label style="font-weight:bold; color:#2980B9;">Cerita untuk Kelompok ${i + 1}</label>
                    <textarea class="cerita-input" rows="3" style="padding:8px; border-radius:5px; border:1px solid #ccc; font-family:inherit; resize:vertical;" placeholder="Masukkan variasi cerita kasus...">${val}</textarea>
                    <label style="font-weight:bold; color:#E67E22; margin-top:5px;">Modal Uang Saku (Rp):</label>
                    <input type="number" class="uang-saku-input" min="1000" step="1000" value="${uangSaku}" style="padding:8px; border-radius:5px; border:1px solid #ccc; width:150px;">
                </div>
            `;
        }
    }

    function collectCeritaInputs() {
        const inputs = document.querySelectorAll('.cerita-input');
        const uangSakuInputs = document.querySelectorAll('.uang-saku-input');
        const result = [];
        for (let i = 0; i < inputs.length; i++) {
            result.push({
                teks: inputs[i].value,
                uangSaku: parseInt(uangSakuInputs[i].value) || 20000
            });
        }
        return result;
    }

    // Pengaturan Limit Foto Eksplorasi telah dihapus.

    // Menangani kejadian (event) saat tombol "Simpan Cerita" diklik
    const btnSaveStory = document.getElementById('btnSaveStory');
    const saveStoryMsg = document.getElementById('saveStoryMsg');
    const btnResetUndian = document.getElementById('btnResetUndian');
    
    if (btnSaveStory) {
        btnSaveStory.addEventListener('click', async () => {
            const kumpulanCerita = collectCeritaInputs();
            const aturan = document.getElementById('aturanMain').value;
            const jumlahKel = document.getElementById('jumlahKelompok').value;
            
            if (kumpulanCerita.some(c => !c.teks.trim() || !c.uangSaku) || !aturan.trim() || !jumlahKel) {
                alert("Mohon lengkapi semua isian cerita, aturan, modal uang saku, dan jumlah kelompok!");
                return;
            }
            
            btnSaveStory.textContent = "Menyimpan...";
            await updateStorySettings(kumpulanCerita, aturan, jumlahKel);
            btnSaveStory.textContent = "Simpan Cerita & Kelompok";
            
            // Putar suara sukses
            const sfxSave = new Audio('../benar.mp3');
            sfxSave.play().catch(e=>{});

            saveStoryMsg.classList.remove('hidden');
            setTimeout(() => {
                saveStoryMsg.classList.add('hidden');
            }, 3000);
        });
    }

    if (btnResetUndian) {
        btnResetUndian.addEventListener('click', async () => {
            if (confirm('Apakah Anda yakin ingin mereset undian? Semua kelompok akan mengundi ulang cerita mereka.')) {
                btnResetUndian.textContent = "Mereset...";
                await resetStoryAllocation();
                btnResetUndian.textContent = "Reset Undian Cerita";
                alert('Undian berhasil direset!');
            }
        });
    }

    /* =========================================
       2. MANAJEMEN TOKO & BARANG (UPLOAD OLEH GURU)
       ========================================= */
    const formTambahBarangToko = document.getElementById('formTambahBarangToko');
    const itemsGrid = document.getElementById('itemsGrid');

    if (formTambahBarangToko) {
        formTambahBarangToko.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btnSubmit = formTambahBarangToko.querySelector('button');
            const originalText = btnSubmit.textContent;
            btnSubmit.textContent = 'Menyimpan... ⏳';
            btnSubmit.disabled = true;

            const inputToko = document.getElementById('inputToko').value;
            const inputNama = document.getElementById('inputNamaBarang').value;
            const inputHarga = document.getElementById('inputHargaBarang').value;
            const fileInput = document.getElementById('inputFotoBarang');
            const file = fileInput.files[0];

            if (!file) {
                alert('Pilih foto barang terlebih dahulu!');
                btnSubmit.textContent = originalText;
                btnSubmit.disabled = false;
                return;
            }

            try {
                // Konversi gambar ke base64 (disediakan di utils.js)
                let base64String = "";
                if (typeof resizeAndCompressImage === 'function') {
                    base64String = await resizeAndCompressImage(file);
                }

                // Susun objek barang untuk diunggah oleh guru
                const newItem = {
                    toko: inputToko,
                    nama: inputNama,
                    harga: parseInt(inputHarga),
                    fotoBase64: base64String,
                    uploader: 'guru', // Penanda bahwa ini diupload oleh guru
                    status: 'approved' // Otomatis disetujui karena guru yang upload
                };

                await addItem(newItem);
                alert(`Barang ${inputNama} berhasil ditambahkan ke ${inputToko}!`);
                
                // Reset form
                formTambahBarangToko.reset();
                renderItems(); // Muat ulang grid galeri
            } catch (err) {
                console.error("Gagal menambah barang:", err);
                alert("Gagal menambahkan barang. Silakan coba lagi.");
            } finally {
                btnSubmit.textContent = originalText;
                btnSubmit.disabled = false;
            }
        });
    }

    function showGridLoading() {
        if(itemsGrid) itemsGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 50px;">Memuat data dari Firebase... ⏳</p>';
    }

    async function renderItems() {
        if (!itemsGrid) return;
        
        if(itemsGrid.innerHTML === '') showGridLoading();
        
        const allItems = typeof getAllItems === 'function' ? await getAllItems() : [];
        itemsGrid.innerHTML = '';
        
        // Hanya ambil barang yang diupload oleh guru
        const itemsToRender = allItems.filter(item => item.uploader === 'guru');

        if (itemsToRender.length === 0) {
            itemsGrid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 50px;">Toko Anda masih kosong. Ayo tambahkan barang!</p>`;
        } else {
            itemsToRender.forEach((item) => {
                const card = document.createElement('div');
                card.className = 'photo-card';
                card.style.position = 'relative';
                             // Elemen Foto
                const fotoHtml = item.fotoBase64 
                    ? `<img src="${item.fotoBase64}" alt="${item.nama}">` 
                    : `<div style="display:flex; justify-content:center; align-items:center; height:100%; font-size:4rem;">📦</div>`;
                
                // Ikon Toko
                const categoryIcon = '🏪';
                const categoryText = item.toko || 'Toko Umum';
                
                // Harga
                const formattedPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.harga || 0);

                const buttonHtml = `
                    <button class="btn-delete" data-id="${item.id}" style="margin-top:10px; width:100%; background:var(--danger); border:none; color:white; padding:10px; border-radius:10px; cursor:pointer; font-weight:bold;">Hapus Barang 🗑️</button>`;

                card.innerHTML = `
                    <div class="photo-wrapper">
                        ${fotoHtml}
                        <div class="badge-pending" style="background:#8E44AD;">${categoryIcon} ${categoryText}</div>
                    </div>
                    <div class="card-content">
                        <h3>${item.nama}</h3>
                        <p class="student-name" style="color:var(--primary-color); font-weight:bold; font-size:1.1rem; margin-bottom:5px;">${formattedPrice}</p>
                        ${buttonHtml}
                    </div>
                `;
                
                itemsGrid.appendChild(card);
            });
            
            // Tambahkan event listener untuk tombol hapus
            const deleteButtons = itemsGrid.querySelectorAll('.btn-delete');
            deleteButtons.forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const itemId = e.target.getAttribute('data-id');
                    if (confirm('Yakin ingin menghapus barang ini dari toko?')) {
                        const originalText = e.target.textContent;
                        e.target.textContent = 'Menghapus...';
                        e.target.disabled = true;
                        try {
                            if (typeof deleteItem === 'function') {
                                await deleteItem(itemId);
                                renderItems();
                            }
                        } catch (err) {
                            console.error('Gagal hapus item:', err);
                            alert('Gagal menghapus barang.');
                            e.target.textContent = originalText;
                            e.target.disabled = false;
                        }
                    }
                });
            });
        }
    }

    renderItems();

    /* =========================================
       3. MENAMPILKAN DATA HASIL EVALUASI & PERENCANAAN
       ========================================= */
    const studentTabsContainer = document.getElementById('studentTabsContainer');
    const studentTabContentContainer = document.getElementById('studentTabContentContainer');
    const planTableBody = document.getElementById('planTableBody');
    
    let currentActiveTab = null;
    let previousEvalCount = 0; // Untuk mendeteksi adanya data baru

    function renderEvaluasiSiswa(results) {
        if (!studentTabsContainer || !studentTabContentContainer || !planTableBody || !results) return;
        
        planTableBody.innerHTML = '';
        
        const evalResults = results.filter(r => r.aktivitas !== "Perencanaan Keuangan");
        const planResults = results.filter(r => r.aktivitas === "Perencanaan Keuangan");
        
        // Deteksi jika ada data evaluasi baru masuk secara realtime
        if (evalResults.length > previousEvalCount) {
            // Karena orderBy('timestamp', 'desc'), data terbaru ada di index 0
            if (evalResults[0]) {
                currentActiveTab = evalResults[0].nama;
            }
        }
        previousEvalCount = evalResults.length;
        
        // 1. Tampilkan Evaluasi Kuis (Tab System)
        if (evalResults.length === 0) {
            studentTabsContainer.innerHTML = '';
            studentTabContentContainer.innerHTML = `
                <div class="empty-tab-state">
                    <h3>Pilih nama siswa di atas untuk melihat laporan misinya!</h3>
                    <p>Data akan otomatis muncul jika ada siswa yang sudah bermain.</p>
                </div>
            `;
        } else {
            // Kelompokkan hasil berdasarkan nama siswa
            const groupedByStudent = {};
            evalResults.slice().reverse().forEach(r => {
                if (!groupedByStudent[r.nama]) {
                    groupedByStudent[r.nama] = [];
                }
                groupedByStudent[r.nama].push(r);
            });

            // Render Tab Buttons
            studentTabsContainer.innerHTML = '';
            const studentNames = Object.keys(groupedByStudent);
            
            studentNames.forEach((nama, index) => {
                const btn = document.createElement('button');
                btn.className = 'student-tab-btn';
                btn.textContent = nama;
                
                // Set tab pertama sebagai aktif secara default jika tidak ada yg aktif
                if (!currentActiveTab && index === 0) currentActiveTab = nama;
                
                if (currentActiveTab === nama) btn.classList.add('active');

                btn.onclick = () => {
                    currentActiveTab = nama;
                    // Update class active
                    document.querySelectorAll('.student-tab-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    renderTabContent(nama, groupedByStudent[nama]);
                };

                studentTabsContainer.appendChild(btn);
            });

            // Render Konten Tab Aktif
            if (currentActiveTab && groupedByStudent[currentActiveTab]) {
                renderTabContent(currentActiveTab, groupedByStudent[currentActiveTab]);
            } else if (studentNames.length > 0) {
                // Fallback jika tab aktif sebelumnya dihapus
                currentActiveTab = studentNames[0];
                studentTabsContainer.firstChild.classList.add('active');
                renderTabContent(studentNames[0], groupedByStudent[studentNames[0]]);
            }
        }
        
        function renderTabContent(studentName, historyArr) {
            let html = `<div class="student-results-grid">`;
            
            historyArr.forEach(r => {
                let badgeClass = r.aktivitas.toLowerCase().includes('kuis') ? 'kuis' : 'game';
                let emoji = r.aktivitas.toLowerCase().includes('kuis') ? '📝' : '🎮';
                
                html += `
                    <div class="mission-result-card ${badgeClass}">
                        <div class="mission-header">
                            <span class="mission-badge ${badgeClass}">${emoji} ${r.aktivitas}</span>
                            <span class="mission-date">${r.waktu}</span>
                        </div>
                        <div class="mission-score">${r.skorAkhir}</div>
                        <div class="mission-notes">
                            <strong>Catatan:</strong><br>
                            ${r.catatan}
                        </div>
                    </div>
                `;
            });
            
            html += `</div>`;
            studentTabContentContainer.innerHTML = html;
        }
        
        // 2. Tampilkan Laporan Perencanaan Keuangan
        if (planResults.length === 0) {
            planTableBody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding: 20px;">Belum ada siswa yang mengirim laporan perencanaan keuangan.</td></tr>';
        } else {
            planResults.slice().reverse().forEach((r) => {
                const tr = document.createElement('tr');
                
                // Pisahkan catatan untuk mendapatkan Uang Saku, Status, dan Rincian
                // Format asal dari catatan: <strong>Uang Saku:</strong> ... <br> <strong>Status:</strong> ... <br> <strong>Rincian Jajan:</strong>...
                let uangSaku = "-";
                let status = "-";
                let rincian = r.catatan; // Fallback jika format berbeda
                
                if(r.catatan.includes('<strong>Uang Saku:</strong>')) {
                    const parts = r.catatan.split('<br>');
                    if(parts.length >= 3) {
                        uangSaku = parts[0].replace('<strong>Uang Saku:</strong>', '').trim();
                        status = parts[1].replace('<strong>Status:</strong>', '').trim();
                        // Gabungkan sisa potongan karena rincian jajan dan rencana sisa uang mengandung banyak <br>
                        rincian = parts.slice(2).join('<br>').replace('<strong>Rincian Jajan:</strong>', '').trim();
                    }
                }
                
                // Tambahkan pewarnaan pada status
                let statusColor = "color: #333;";
                if(status.includes("Aman")) statusColor = "color: #27AE60; font-weight:bold;";
                if(status.includes("Minus")) statusColor = "color: #E74C3C; font-weight:bold;";
                
                tr.innerHTML = `
                    <td style="vertical-align: top;">${r.waktu}</td>
                    <td style="vertical-align: top; font-weight:bold; color:#27AE60;">${r.nama}</td>
                    <td style="vertical-align: top;">${r.kelas}</td>
                    <td style="vertical-align: top; font-weight:bold;">${uangSaku}</td>
                    <td style="vertical-align: top; font-weight:bold; color:var(--danger);">${r.skorAkhir}</td>
                    <td style="vertical-align: top; ${statusColor}">${status}</td>
                    <td style="vertical-align: top; text-align:left;">${rincian}</td>
                `;
                planTableBody.appendChild(tr);
            });
        }
    }

    if (typeof listenToStudentResults === 'function') {
        const studentTabContentContainer = document.getElementById('studentTabContentContainer');
        if(studentTabContentContainer) studentTabContentContainer.innerHTML = '<div class="empty-tab-state"><h3>Menghubungkan ke database real-time...</h3></div>';
        planTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Menghubungkan ke database real-time...</td></tr>';
        listenToStudentResults((results) => {
            renderEvaluasiSiswa(results);
        });
    }

    // Hapus Data Evaluasi
    const btnClearEval = document.getElementById('btnClearEval');
    if (btnClearEval) {
        btnClearEval.addEventListener('click', async () => {
            if (confirm('Yakin ingin menghapus data Kuis/Evaluasi? (Data Perencanaan mungkin ikut terhapus di sistem ini)')) {
                btnClearEval.textContent = "Menghapus...";
                await clearStudentResults();
                btnClearEval.textContent = "Hapus Riwayat Kuis";
            }
        });
    }
    
    // Hapus Data Perencanaan
    const btnClearPlan = document.getElementById('btnClearPlan');
    if (btnClearPlan) {
        btnClearPlan.addEventListener('click', async () => {
            if (confirm('Yakin ingin menghapus seluruh data Laporan Perencanaan?')) {
                btnClearPlan.textContent = "Menghapus...";
                await clearStudentResults(); 
                btnClearPlan.textContent = "Hapus Data Laporan";
            }
        });
    }

    /* =========================================
       4. PEMANTAUAN LMS SISWA AKTIF
       ========================================= */
    const liveMonitorGrid = document.getElementById('liveMonitorGrid');
    const activeCountBadge = document.getElementById('activeCountBadge');

    if (liveMonitorGrid && typeof listenToPresence === 'function') {
        listenToPresence((activeStudents) => {
            // Update counter
            if (activeCountBadge) {
                activeCountBadge.textContent = `${activeStudents.length} Siswa Online`;
            }

            if (activeStudents.length === 0) {
                liveMonitorGrid.innerHTML = `<p style="color: #95A5A6; width: 100%; text-align: center; padding: 20px;">Belum ada siswa yang terdeteksi online saat ini.</p>`;
                return;
            }

            // Render daftar siswa
            liveMonitorGrid.innerHTML = '';
            activeStudents.forEach(student => {
                const card = document.createElement('div');
                card.style.cssText = `
                    background: #f8f9fa;
                    border: 1px solid #e9ecef;
                    border-radius: 10px;
                    padding: 15px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    width: calc(33.333% - 10px);
                    min-width: 200px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                `;

                // Animasi ping hijau
                const pingDot = `
                    <div style="position: relative; width: 12px; height: 12px;">
                        <div style="position: absolute; width: 100%; height: 100%; background: #2ecc71; border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                        <div style="position: absolute; width: 100%; height: 100%; background: #27ae60; border-radius: 50%;"></div>
                    </div>
                `;

                // Hitung berapa lama aktif
                const diffMin = Math.floor((Date.now() - student.lastActive) / 60000);
                const timeText = diffMin < 1 ? "Aktif" : `${diffMin} mnt lalu`;

                card.innerHTML = `
                    ${pingDot}
                    <div style="flex: 1; overflow: hidden;">
                        <div style="font-weight: bold; color: #2c3e50; font-size: 1.1rem; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">${student.nama}</div>
                        <div style="font-size: 0.85rem; color: #7f8c8d;">Kelas ${student.kelas} • <span style="color:#27ae60;">${timeText}</span></div>
                    </div>
                `;
                liveMonitorGrid.appendChild(card);
            });
        });
        
        // Tambahkan keyframes untuk animasi ping jika belum ada
        if (!document.getElementById('pingAnimation')) {
            const style = document.createElement('style');
            style.id = 'pingAnimation';
            style.innerHTML = `
                @keyframes ping {
                    75%, 100% { transform: scale(2.5); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /* =========================================
       5. REKAM JEJAK KEAKTIFAN SISWA (ACTIVITY LOGS)
       ========================================= */
    const activityLogTableBody = document.getElementById('activityLogTableBody');
    const btnClearActivityLogs = document.getElementById('btnClearActivityLogs');

    function renderActivityLogs(logs) {
        if (!activityLogTableBody || !logs) return;

        activityLogTableBody.innerHTML = '';
        
        if (logs.length === 0) {
            activityLogTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#95A5A6;">Belum ada aktivitas siswa yang terekam.</td></tr>';
            return;
        }

        logs.forEach(log => {
            const tr = document.createElement('tr');
            const arrAktivitas = log.aktivitasList || (log.aktivitas ? [log.aktivitas] : []);
            const tags = arrAktivitas.map(act => `<span style="background: #E8F8F5; color: #16A085; padding: 4px 10px; border-radius: 15px; font-size: 0.85rem; font-weight: bold; display: inline-block; margin: 2px;">${act}</span>`).join('');
            
            tr.innerHTML = `
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 0.9rem; color: #7F8C8D;">${log.waktu}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #2C3E50;">${log.namaSiswa}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; color: #2980B9; font-weight: bold;">${log.kelasSiswa}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    ${tags}
                </td>
            `;
            activityLogTableBody.appendChild(tr);
        });
    }

    if (typeof listenToActivityLogs === 'function') {
        activityLogTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#95A5A6;">Menghubungkan ke radar aktivitas real-time... ⏳</td></tr>';
        listenToActivityLogs((logs) => {
            renderActivityLogs(logs);
        });
    }

    if (btnClearActivityLogs) {
        btnClearActivityLogs.addEventListener('click', async () => {
            if (confirm('Yakin ingin membersihkan SEMUA rekam jejak aktivitas siswa? (Ini tidak akan menghapus skor kuis)')) {
                btnClearActivityLogs.textContent = "Menghapus...";
                await clearActivityLogs();
                btnClearActivityLogs.textContent = "Bersihkan Log";
            }
        });
    }

});
