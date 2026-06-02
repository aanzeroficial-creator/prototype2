/* 
 * Proyek Web Edukasi Literasi Finansial PGSD
 * Author: Aan Rifai (NIM: 2501050298, No. Absen: 28)
 * Universitas Negeri Semarang (UNNES)
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // Array berisi data bermacam-macam pecahan uang Rupiah
    const moneyData = [
        {
            nominal: 1000,
            warna: "Kuning/Kehijauan",
            tokoh: "Tjut Meutia",
            ciri: "Uang kertas seribu rupiah biasanya berwarna dominan kuning atau kehijauan."
        },
        {
            nominal: 2000,
            warna: "Abu-abu",
            tokoh: "Mohammad Husni Thamrin",
            ciri: "Uang dua ribu rupiah didominasi warna abu-abu."
        },
        {
            nominal: 5000,
            warna: "Cokelat",
            tokoh: "Dr. K.H. Idham Chalid",
            ciri: "Uang lima ribu rupiah mudah dikenali dari warna cokelatnya."
        },
        {
            nominal: 10000,
            warna: "Ungu",
            tokoh: "Frans Kaisiepo",
            ciri: "Uang sepuluh ribu rupiah identik dengan warna ungu."
        },
        {
            nominal: 20000,
            warna: "Hijau",
            tokoh: "Dr. G.S.S.J. Ratulangi",
            ciri: "Uang dua puluh ribu rupiah berwarna hijau terang."
        },
        {
            nominal: 50000,
            warna: "Biru",
            tokoh: "Ir. H. Djuanda Kartawidjaja",
            ciri: "Uang lima puluh ribu rupiah didominasi warna biru."
        },
        {
            nominal: 100000,
            warna: "Merah",
            tokoh: "Soekarno & Mohammad Hatta",
            ciri: "Uang seratus ribu rupiah adalah pecahan terbesar dan berwarna merah."
        }
    ];

    const container = document.getElementById('moneyCardsContainer');

    // Melakukan perulangan untuk merender setiap data kartu ke dalam HTML
    moneyData.forEach(item => {
        // Membuat elemen wrapper kartu utama
        const card = document.createElement('div');
        card.className = 'flip-card'; // Memberikan class CSS untuk efek 3D
        
        // Memasukkan struktur HTML ke dalam kartu
        // Bagian Depan (Nominal) dan Bagian Belakang (Penjelasan/Ciri)
        card.innerHTML = `
            <div class="flip-card-inner">
                <div class="flip-card-front">
                    <div class="money-icon">💰</div>
                    <!-- Menggunakan fungsi formatRupiah dari utils.js -->
                    <h3>${formatRupiah(item.nominal)}</h3> 
                </div>
                <div class="flip-card-back">
                    <h3>${formatRupiah(item.nominal)}</h3>
                    <p><strong>Tokoh Pahlawan:</strong><br>${item.tokoh}</p>
                    <p style="margin-top:10px;"><strong>Warna Dominan:</strong><br>${item.warna}</p>
                    <p style="margin-top:10px; font-size: 0.95rem;">${item.ciri}</p>
                </div>
            </div>
        `;

        // Menambahkan Event Listener agar kartu bisa berputar (flip) saat diklik oleh siswa
        card.addEventListener('click', () => {
            // Memutar efek suara saat membalik kartu
            const sfxFlip = new Audio('../klik semua.mp3');
            sfxFlip.play().catch(e => {});

            // classList.toggle akan menambah class 'flipped' jika belum ada, 
            // dan menghapusnya jika sudah ada. Ini memicu animasi CSS.
            card.classList.toggle('flipped');
        });

        // Menambahkan kartu yang sudah dibuat ke dalam container utama di layar
        container.appendChild(card);
    });
});
