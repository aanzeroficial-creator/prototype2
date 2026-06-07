/* 
 * Proyek Web Edukasi Literasi Finansial PGSD
 * Author: Aan Rifai (NIM: 2501050298, No. Absen: 28)
 * Universitas Negeri Semarang (UNNES)
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // Array berisi data bermacam-macam pecahan uang Rupiah beserta gambarnya
    const moneyData = [
        {
            nominal: 100000,
            gambarDepan: "100 rb tampak depan.png",
            gambarBelakang: "100rb belakang.png",
            ciri: "Uang Rp100.000 berwarna merah dengan tokoh Soekarno & Mohammad Hatta."
        },
        {
            nominal: 50000,
            gambarDepan: "50rb tampak depan.png",
            gambarBelakang: "50rb tampak belakang.png",
            ciri: "Uang Rp50.000 didominasi warna biru dengan tokoh Ir. H. Djuanda Kartawidjaja."
        },
        {
            nominal: 20000,
            gambarDepan: "20rb tampak depan.png",
            gambarBelakang: "20rb tampak belakang.png",
            ciri: "Uang Rp20.000 berwarna hijau terang dengan tokoh Dr. G.S.S.J. Ratulangi."
        },
        {
            nominal: 10000,
            gambarDepan: "10rb tampak depan.png",
            gambarBelakang: "10rb tampak belakang.png",
            ciri: "Uang Rp10.000 identik dengan warna ungu dengan tokoh Frans Kaisiepo."
        },
        {
            nominal: 5000,
            gambarDepan: "5rb tampak depan.png",
            gambarBelakang: "5rb tampak belakang.png",
            ciri: "Uang Rp5.000 berwarna cokelat dengan tokoh Dr. K.H. Idham Chalid."
        },
        {
            nominal: 1000,
            gambarDepan: "1rb tampak depan.png",
            gambarBelakang: "1rb tampak belakang.png",
            ciri: "Uang kertas Rp1.000 berwarna dominan kuning/kehijauan dengan tokoh Tjut Meutia."
        },
        {
            nominal: 1000,
            gambarDepan: "1rb koin tampak depan.png",
            gambarBelakang: "1rb koin tampak belakang.png",
            ciri: "Uang koin Rp1.000 berbahan perak mengilap."
        },
        {
            nominal: 500,
            gambarDepan: "500 koin tampak depan.png",
            gambarBelakang: "500 koin tampak belakang.png",
            ciri: "Uang koin Rp500 berbahan aluminium/kuningan."
        },
        {
            nominal: 200,
            gambarDepan: "200 koin tampak depan.png",
            gambarBelakang: "200 koin tampak belakang.png",
            ciri: "Uang koin Rp200 yang berukuran kecil."
        },
        {
            nominal: 100,
            gambarDepan: "100 koin tampak depan (1).png",
            gambarBelakang: "100 koin tampak belakang.png",
            ciri: "Uang koin Rp100 berbahan aluminium/kuningan."
        }
    ];

    const container = document.getElementById('moneyCardsContainer');

    // Melakukan perulangan untuk merender setiap data kartu ke dalam HTML
    moneyData.forEach(item => {
        // Membuat elemen wrapper kartu utama
        const card = document.createElement('div');
        card.className = 'flip-card'; // Memberikan class CSS untuk efek 3D
        
        // Memasukkan struktur HTML ke dalam kartu
        card.innerHTML = `
            <div class="flip-card-inner">
                <div class="flip-card-front" style="display:flex; flex-direction:column; justify-content:center; align-items:center; padding:10px; gap: 10px;">
                    <img src="aset student/aset uang/${item.gambarDepan}" alt="Rp ${item.nominal} Depan" style="max-width: 100%; max-height: 100px; object-fit: contain; border-radius: 8px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2));">
                    <img src="aset student/aset uang/${item.gambarBelakang}" alt="Rp ${item.nominal} Belakang" style="max-width: 100%; max-height: 100px; object-fit: contain; border-radius: 8px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2));">
                    <h3 style="margin-top: 5px; font-size: 1.5rem; color: #fff; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">${formatRupiah(item.nominal)}</h3> 
                </div>
                <div class="flip-card-back" style="display:flex; flex-direction:column; justify-content:center; align-items:center; padding:20px;">
                    <h3 style="margin-bottom: 15px; border-bottom: 2px solid rgba(255,255,255,0.4); padding-bottom: 10px; font-size: 2rem;">${formatRupiah(item.nominal)}</h3>
                    <p style="font-size: 1.1rem; line-height:1.5;">${item.ciri}</p>
                </div>
            </div>
        `;

        // Menambahkan Event Listener agar kartu bisa berputar (flip) saat diklik oleh siswa
        card.addEventListener('click', () => {
            // Memutar efek suara saat membalik kartu
            const sfxFlip = new Audio('../klik semua.mp3');
            sfxFlip.play().catch(e => {});

            card.classList.toggle('flipped');
        });

        // Menambahkan kartu yang sudah dibuat ke dalam container utama di layar
        container.appendChild(card);
    });
});
