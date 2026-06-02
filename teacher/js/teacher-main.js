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
    }
    loadSettings();

    // Menangani kejadian (event) saat tombol "Simpan Pengaturan" diklik
    btnSaveLimit.addEventListener('click', async () => {
        // Mengambil nilai dari input dan mengubahnya menjadi angka (integer)
        const newLimit = parseInt(limitInput.value);
        
        // Validasi: pastikan nilai lebih besar dari 0
        if (newLimit > 0) {
            btnSaveLimit.textContent = "Menyimpan...";
            await updateLimitFoto(newLimit); // Menyimpan ke Firebase
            btnSaveLimit.textContent = "Simpan Pengaturan";
            
            // Putar suara sukses
            const sfxSave = new Audio('../benar.mp3');
            sfxSave.play().catch(e=>{});

            // Memberikan umpan balik (feedback) visual ke guru
            saveMessage.classList.remove('hidden');
            
            // Menyembunyikan pesan sukses secara otomatis setelah 3 detik
            setTimeout(() => {
                saveMessage.classList.add('hidden');
            }, 3000);
        } else {
            alert('Limit harus berupa angka lebih dari 0');
        }
    });

    /* =========================================
       2. MENAMPILKAN DATA BARANG EKSPLORASI (GRID KARTU)
       ========================================= */
    const itemsGrid = document.getElementById('itemsGrid');
    const countAll = document.getElementById('countAll');
    const countPending = document.getElementById('countPending');
    const countApproved = document.getElementById('countApproved');
    
    let currentFilter = 'pending'; // Default tab

    // Setup Event Listener untuk Tab Filter
    const tabPills = document.querySelectorAll('.tab-pill');
    tabPills.forEach(tab => {
        tab.addEventListener('click', (e) => {
            // Hapus kelas aktif dari semua tab
            tabPills.forEach(t => t.classList.remove('active'));
            // Tambahkan kelas aktif ke tab yang diklik
            e.target.classList.add('active');
            
            // Ubah filter dan render ulang
            currentFilter = e.target.getAttribute('data-filter');
            renderItems();
        });
    });

    function showGridLoading() {
        if(itemsGrid) itemsGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 50px;">Memuat data dari Firebase... ⏳</p>';
    }

    async function renderItems() {
        if (!itemsGrid) return;
        
        // Kosongkan grid dan tampilkan loading cuma saat ambil data pertama kali atau refresh filter all
        if(itemsGrid.innerHTML === '') showGridLoading();
        
        const allItems = typeof getAllItems === 'function' ? await getAllItems() : []; // Ambil dari Firebase
        itemsGrid.innerHTML = ''; // Kosongkan grid setelah data dapat
        
        // Hitung jumlah untuk masing-masing kategori
        const pendingItems = allItems.filter(item => item.status === 'pending');
        const approvedItems = allItems.filter(item => item.status === 'approved');

        // Update teks penghitung (counter) di tab
        if(countAll) countAll.textContent = `(${allItems.length})`;
        if(countPending) countPending.textContent = `(${pendingItems.length})`;
        if(countApproved) countApproved.textContent = `(${approvedItems.length})`;

        // Tentukan data mana yang akan dirender berdasarkan filter aktif
        let itemsToRender = [];
        if (currentFilter === 'all') itemsToRender = allItems;
        else if (currentFilter === 'pending') itemsToRender = pendingItems;
        else if (currentFilter === 'approved') itemsToRender = approvedItems;

        if (itemsToRender.length === 0) {
            itemsGrid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 50px;">Tidak ada data pada kategori ini.</p>`;
        } else {
            itemsToRender.forEach((item) => {
                const card = document.createElement('div');
                card.className = 'photo-card';
                
                // Elemen Foto
                const fotoHtml = item.fotoBase64 
                    ? `<img src="${item.fotoBase64}" alt="${item.nama}">` 
                    : `<div style="display:flex; justify-content:center; align-items:center; height:100%; font-size:4rem;">📦</div>`;
                
                // Ikon Kategori
                const categoryIcon = item.kategori === 'kebutuhan' ? '🎯' : '🍦';
                const categoryText = item.kategori === 'kebutuhan' ? 'Kebutuhan' : 'Keinginan';
                
                // Info Siswa
                const studentName = item.namaSiswa ? item.namaSiswa : 'Siswa Anonim';

                // Tampilan bergantung pada status
                const isApproved = item.status === 'approved';
                const badgeHtml = isApproved 
                    ? `<div class="badge-pending" style="background:#2ECC71;">APPROVED</div>` 
                    : `<div class="badge-pending">PENDING</div>`;
                
                const buttonHtml = isApproved
                    ? `<button class="btn-approve" disabled style="background:#BDC3C7; cursor:not-allowed;">Telah Disetujui</button>
                       <button class="btn-delete" data-id="${item.id}" style="margin-top:10px; background:transparent; border:1px solid var(--danger); color:var(--danger); padding:8px; border-radius:10px; cursor:pointer; font-weight:bold;">Hapus 🗑️</button>`
                    : `<button class="btn-approve" data-action="approve" data-id="${item.id}">Setujui & Beri XP ✔</button>`;

                card.innerHTML = `
                    <div class="photo-wrapper">
                        ${fotoHtml}
                        ${badgeHtml}
                    </div>
                    <div class="card-content">
                        <div class="student-info">
                            <span>👦</span> <strong>${studentName}</strong>
                        </div>
                        <h3 class="item-name">${item.nama}</h3>
                        <div class="item-meta">
                            <span class="item-price">${formatRupiah(item.harga)}</span>
                            <span class="item-category">${categoryIcon} ${categoryText}</span>
                        </div>
                        ${buttonHtml}
                    </div>
                `;
                
                itemsGrid.appendChild(card);
            });

            // Pasang event listener ke tombol Setujui
            const approveButtons = document.querySelectorAll('.btn-approve[data-action="approve"]');
            approveButtons.forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.getAttribute('data-id');
                    // Putar SFX Sukses
                    const sfxSuccess = new Audio('../benar.mp3');
                    sfxSuccess.play().catch(err=>{});
                    
                    if (typeof approveItem === 'function') {
                        e.target.textContent = "Menyetujui...";
                        await approveItem(id);
                        await renderItems(); // Gambar ulang grid
                    }
                });
            });

            // Pasang event listener ke tombol Hapus (jika ada)
            const deleteButtons = document.querySelectorAll('.btn-delete');
            deleteButtons.forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if(confirm('Yakin ingin menghapus foto barang ini dari database kelas?')) {
                        const id = e.target.getAttribute('data-id');
                        if (typeof deleteItem === 'function') {
                            e.target.textContent = "Menghapus...";
                            await deleteItem(id);
                            await renderItems();
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
    const evalTableBody = document.getElementById('evalTableBody');
    const planTableBody = document.getElementById('planTableBody');
    
    function renderEvaluasiSiswa(results) {
        if (!evalTableBody || !planTableBody || !results) return;
        
        evalTableBody.innerHTML = '';
        planTableBody.innerHTML = '';
        
        const evalResults = results.filter(r => r.aktivitas !== "Perencanaan Keuangan");
        const planResults = results.filter(r => r.aktivitas === "Perencanaan Keuangan");
        
        // 1. Tampilkan Evaluasi Kuis
        if (evalResults.length === 0) {
            evalTableBody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding: 20px;">Belum ada hasil evaluasi (kuis/game) yang direkam.</td></tr>';
        } else {
            evalResults.slice().reverse().forEach((r) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${r.waktu}</td>
                    <td style="font-weight:bold; color:var(--primary-teacher);">${r.nama}</td>
                    <td>${r.kelas}</td>
                    <td><span style="background:#F1C40F; padding:3px 8px; border-radius:10px; font-size:0.8rem; font-weight:bold;">${r.aktivitas}</span></td>
                    <td style="font-weight:bold;">${r.skorAkhir}</td>
                    <td>${r.catatan}</td>
                `;
                evalTableBody.appendChild(tr);
            });
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
                        rincian = parts[2].replace('<strong>Rincian Jajan:</strong>', '').trim();
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
        evalTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Menghubungkan ke database real-time...</td></tr>';
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
