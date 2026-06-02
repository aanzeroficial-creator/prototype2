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
    
    // Ambil setting secara asinkron dari Firebase
    const settings = await getSettings();
    let namaPenginput = "Siswa Anonim";
    let kelasPenginput = "-";
    const siswaAuth = sessionStorage.getItem('siswaAuth');
    if (siswaAuth) {
        const dataSiswa = JSON.parse(siswaAuth);
        namaPenginput = dataSiswa.nama;
        kelasPenginput = dataSiswa.kelas;
        kelasPenginput = dataSiswa.kelas;
    }

    // CATAT AKTIVITAS: Membuka Kamera
    if (typeof logActivity === 'function') {
        logActivity('📸 Membuka Misi Eksplorasi Kamera');
    }

    let jumlahFotoSiswa = 0; 
    
    function updateLimitUI() {
        const sisa = settings.limitFoto - jumlahFotoSiswa;
        limitInfo.textContent = `Kamu bisa menambahkan ${sisa} barang lagi.`;
        
        if (btnSubmit) {
            if (sisa <= 0) {
                btnSubmit.disabled = true;
                btnSubmit.textContent = "Batas Foto Habis";
                btnSubmit.style.backgroundColor = "gray";
            } else {
                btnSubmit.disabled = false;
                btnSubmit.textContent = "Simpan Barang!";
                btnSubmit.style.backgroundColor = ""; // Kembali ke default CSS
            }
        }
    }

    async function renderMyItems() {
        const myItemsList = document.getElementById('myItemsList');
        if (!myItemsList) return;

        myItemsList.innerHTML = '<p style="text-align:center; color:#777; width:100%;">Sedang mengambil data dari Firebase... ⏳</p>';
        
        // Ambil data dari Firebase lalu saring khusus barang milik siswa ini saja
        const allItems = typeof getAllItems === 'function' ? await getAllItems() : [];
        const myItems = allItems.filter(item => item.namaSiswa === namaPenginput && item.kelasSiswa === kelasPenginput);
        
        // Memperbarui jumlah foto sesuai dengan data di database (bukan 0 lagi)
        jumlahFotoSiswa = myItems.length;
        updateLimitUI(); 

        myItemsList.innerHTML = '';
        if (myItems.length === 0) {
            myItemsList.innerHTML = '<p style="color:#777; width:100%; text-align:center;">Belum ada barang yang kamu foto.</p>';
            return;
        }

        myItems.forEach(item => {
            const card = document.createElement('div');
            card.style.background = '#f9f9f9';
            card.style.border = '2px solid #eee';
            card.style.borderRadius = '15px';
            card.style.padding = '10px';
            card.style.width = '140px';
            card.style.textAlign = 'center';
            card.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';

            const img = item.fotoBase64 ? `<img src="${item.fotoBase64}" style="width:100%; height:100px; object-fit:cover; border-radius:10px; margin-bottom:10px;">` : `<div style="font-size:3rem; margin-bottom:10px;">📦</div>`;
            const badgeClass = item.kategori === 'kebutuhan' ? 'background: #2ECC71;' : 'background: #F39C12;';
            const kategori = item.kategori === 'kebutuhan' ? 'Kebutuhan' : 'Keinginan';
            
            // Tambahkan badge kecil jika sudah di-approve guru
            const statusBadge = item.status === 'approved' ? `<div style="margin-top:5px; font-size:0.75rem; color:#27AE60; font-weight:bold;">✔ Disetujui Guru</div>` : `<div style="margin-top:5px; font-size:0.75rem; color:#E67E22; font-weight:bold;">⏳ Menunggu Review</div>`;

            card.innerHTML = `
                ${img}
                <h4 style="margin: 5px 0; font-size:1rem; color:#333;">${item.nama}</h4>
                <p style="color:#E67E22; font-weight:bold; margin: 0 0 5px 0; font-size:0.9rem;">${formatRupiah(item.harga)}</p>
                <span style="${badgeClass} color:white; padding:3px 8px; border-radius:10px; font-size:0.8rem;">${kategori}</span>
                ${statusBadge}
            `;
            myItemsList.appendChild(card);
        });
    }

    // Render otomatis saat halaman pertama kali dimuat (menunggu fetch)
    await renderMyItems();

    formEksplorasi.addEventListener('submit', (e) => {
        e.preventDefault(); 
        
        if (jumlahFotoSiswa >= settings.limitFoto) {
            const sfxErr = new Audio('../salah.mp3');
            sfxErr.play().catch(err=>{});
            alert('Maaf, kamu sudah mencapai batas maksimal!');
            return;
        }

        const namaBarang = document.getElementById('namaBarang').value.trim();
        const hargaBarang = document.getElementById('hargaBarang').value;
        const kategoriBarang = document.getElementById('kategoriBarang').value;
        const fileInput = document.getElementById('fotoBarang');
        
        // Validasi Manual (jika browser tidak mendukung atribut required)
        if (!namaBarang || !hargaBarang || !kategoriBarang || !fileInput.files || !fileInput.files[0]) {
            alert("Mohon lengkapi semua isian dan pilih foto barang terlebih dahulu!");
            return;
        }

        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.textContent = "Menyimpan ke Cloud... ⏳";
        }

        // Fungsi pembantu untuk menyimpan data asinkron
        const simpanData = async (fotoBase64 = null) => {
            try {
                await addItem({
                    nama: namaBarang,
                    harga: parseInt(hargaBarang), 
                    kategori: kategoriBarang,
                    fotoBase64: fotoBase64, // Menyimpan data gambar
                    namaSiswa: namaPenginput, // Menyimpan siapa yang menginput
                    kelasSiswa: kelasPenginput
                });

                // Suara sukses simpan
                const sfxSave = new Audio('../benar.mp3');
                sfxSave.play().catch(err=>{});

                // CATAT AKTIVITAS: Berhasil Foto
                if (typeof logActivity === 'function') {
                    logActivity(`✅ Berhasil memfoto barang: ${namaBarang}`);
                }

                formEksplorasi.reset();
                
                // Render ulang dan otomatis memperbarui sisa limit foto
                await renderMyItems(); 
            } catch (error) {
                alert("Terjadi kesalahan saat menyimpan ke server.");
                console.error(error);
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.textContent = "Simpan Barang!";
                }
            }
        };

        // Membaca file gambar dan mengompresnya sebelum disimpan ke Firebase
        if (fileInput.files && fileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 300;
                    const scaleSize = MAX_WIDTH / img.width;
                    canvas.width = MAX_WIDTH;
                    canvas.height = img.height * scaleSize;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    // Kompres jadi base64 ringan
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    
                    simpanData(dataUrl);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(fileInput.files[0]);
        } else {
            // Jika tidak ada file (seharusnya required, tapi jaga-jaga)
            simpanData();
        }
    });
});
