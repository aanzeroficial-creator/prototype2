/* 
 * Proyek Web Edukasi Literasi Finansial PGSD
 * File: detektor.js
 * Logika Mode Instan & Mode Detektif
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 0. AUDIO (SOUND EFFECTS)
    // ==========================================
    const sfxClick = new Audio('../klik kuis.mp3');
    const sfxKebutuhan = new Audio('../benar.mp3');
    const sfxKeinginan = new Audio('../salah.mp3');
    const sfxPop = new Audio('../klik kuis.mp3'); // Suara pop saat pesan muncul
    sfxPop.volume = 0.5;

    function playSound(audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log("Audio play failed:", e));
    }

    // ==========================================
    // 1. PENGATURAN MODE (TABS)
    // ==========================================
    const btnModeInstan = document.getElementById('btnModeInstan');
    const btnModeDetektif = document.getElementById('btnModeDetektif');
    const cardInstan = document.getElementById('cardInstan');
    const cardDetektif = document.getElementById('cardDetektif');

    btnModeInstan.addEventListener('click', () => {
        playSound(sfxClick);
        btnModeInstan.classList.add('active');
        btnModeDetektif.classList.remove('active');
        cardInstan.classList.add('active');
        cardDetektif.classList.remove('active');
    });

    btnModeDetektif.addEventListener('click', () => {
        playSound(sfxClick);
        btnModeDetektif.classList.add('active');
        btnModeInstan.classList.remove('active');
        cardDetektif.classList.add('active');
        cardInstan.classList.remove('active');
    });

    // ==========================================
    // 2. LOGIKA MODE INSTAN (Analisis Teks)
    // ==========================================
    const inputNama = document.getElementById('inputNamaBarang');
    const inputFungsi = document.getElementById('inputFungsiBarang');
    const btnProsesInstan = document.getElementById('btnProsesInstan');
    const hasilInstan = document.getElementById('hasilInstan');
    const statusRencana = document.getElementById('statusRencana');

    // CATAT AKTIVITAS: Membuka Kalkulator / Detektor
    if (typeof logActivity === 'function') {
        logActivity('🧮 Mulai membuat Perencanaan Keuangan');
    }

    // Kumpulan kata kunci untuk heuristik
    const kataKunciKeinginan = ['main', 'game', 'gaya', 'hiburan', 'lucu', 'keren', 'jalan', 'koleksi', 'pajangan', 'nongkrong'];
    const kataKunciKebutuhan = ['belajar', 'sekolah', 'makan', 'minum', 'sakit', 'obat', 'tugas', 'seragam', 'buku', 'penting', 'wajib'];

    btnProsesInstan.addEventListener('click', () => {
        playSound(sfxClick);
        const nama = inputNama.value.trim().toLowerCase();
        const fungsi = inputFungsi.value.trim().toLowerCase();

        if (!nama || !fungsi) {
            alert('Mohon isi nama barang dan fungsinya terlebih dahulu!');
            return;
        }

        // Skor analisis
        let skorKebutuhan = 0;
        let skorKeinginan = 0;
        
        // Memindai gabungan teks
        const gabunganTeks = nama + " " + fungsi;

        kataKunciKeinginan.forEach(kata => {
            if (gabunganTeks.includes(kata)) skorKeinginan++;
        });

        kataKunciKebutuhan.forEach(kata => {
            if (gabunganTeks.includes(kata)) skorKebutuhan++;
        });

        // Hapus class lama
        hasilInstan.classList.remove('result-kebutuhan', 'result-keinginan');
        hasilInstan.style.display = 'block';

        if (skorKebutuhan > skorKeinginan) {
            hasilInstan.classList.add('result-kebutuhan');
            hasilInstan.innerHTML = `✅ <b>Kebutuhan!</b><br>Berdasarkan fungsinya, "${inputNama.value}" sangat penting untuk kehidupan/sekolahmu.`;
        } else if (skorKeinginan > skorKebutuhan) {
            hasilInstan.classList.add('result-keinginan');
            hasilInstan.innerHTML = `⚠️ <b>Keinginan!</b><br>Sepertinya "${inputNama.value}" lebih condong ke hiburan atau gaya. Kamu bisa menabung dulu untuk ini.`;
        } else {
            // Kasus seimbang atau tidak ada kata kunci yang cocok (default ke keinginan agar lebih berhati-hati)
            hasilInstan.classList.add('result-keinginan');
            hasilInstan.innerHTML = `🤔 <b>Abu-abu (Kemungkinan Keinginan)</b><br>Mesin agak ragu. Tapi jika kamu bisa hidup tanpanya besok, sebaiknya anggap ini sebagai Keinginan!`;
        }
    });

    // ==========================================
    // 3. LOGIKA MODE DETEKTIF (Tanya Jawab)
    // ==========================================
    const chatArea = document.getElementById('chatArea');
    const chatInputArea = document.getElementById('chatInputArea');
    const chatInput = document.getElementById('chatInput');
    const btnKirimChat = document.getElementById('btnKirimChat');
    const chatActionArea = document.getElementById('chatActionArea');
    const btnJawabYa = document.getElementById('btnJawabYa');
    const btnJawabTidak = document.getElementById('btnJawabTidak');
    const btnUlangiDetektif = document.getElementById('btnUlangiDetektif');

    let stateDetektif = 0; // 0 = Tanya Barang, 1 = Tanya Pertanyaan 1, 2 = Tanya Pertanyaan 2
    let barangDetektif = "";
    let poinKebutuhan = 0;

    // Fungsi menambah pesan ke UI
    function tambahPesan(pesan, pengirim) {
        playSound(sfxPop); // Suara pop tiap kali ada pesan masuk
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${pengirim === 'bot' ? 'chat-bot' : 'chat-user'}`;
        bubble.innerHTML = pesan;
        chatArea.appendChild(bubble);
        
        // Auto scroll ke bawah
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    // Fungsi pura-pura mengetik
    function tambahPesanBotDenganTyping(pesan, callback = null) {
        // Tampilkan typing indicator
        const typingBubble = document.createElement('div');
        typingBubble.className = 'chat-bubble chat-bot';
        typingBubble.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        chatArea.appendChild(typingBubble);
        chatArea.scrollTop = chatArea.scrollHeight;

        // Tunggu 1.5 detik seolah-olah sedang mengetik
        setTimeout(() => {
            chatArea.removeChild(typingBubble);
            tambahPesan(pesan, 'bot');
            if (callback) callback();
        }, 1500);
    }

    // Mengirim teks nama barang
    btnKirimChat.addEventListener('click', () => {
        playSound(sfxClick);
        const teks = chatInput.value.trim();
        if (!teks) return;

        tambahPesan(teks, 'user');
        chatInput.value = "";
        
        if (stateDetektif === 0) {
            barangDetektif = teks;
            stateDetektif = 1;
            
            // Sembunyikan input teks
            chatInputArea.style.display = 'none';
            
            tambahPesanBotDenganTyping(`Wah, kamu mau beli <b>${barangDetektif}</b> ya? 🤔<br>Pertanyaan Pertama:<br><i>Apakah kamu akan kesulitan belajar atau beraktivitas besok jika tidak membelinya hari ini?</i>`, () => {
                chatActionArea.style.display = 'flex';
            });
        }
    });

    // Menekan Enter di input chat
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') btnKirimChat.click();
    });

    // Menjawab Ya / Tidak
    function prosesJawaban(isYa) {
        playSound(sfxClick);
        // Tampilkan apa yang ditekan user
        tambahPesan(isYa ? "Tentu Saja (Ya)" : "Sebenarnya Tidak (Tidak)", 'user');
        
        // Sembunyikan tombol sementara robot berpikir
        chatActionArea.style.display = 'none';

        if (stateDetektif === 1) {
            // Evaluasi Q1 (Apakah kesulitan besok?)
            if (isYa) poinKebutuhan += 1; 

            stateDetektif = 2;
            tambahPesanBotDenganTyping(`Oke, dicatat! 📝<br>Pertanyaan Kedua (Terakhir):<br><i>Apakah kamu sudah punya barang yang fungsinya mirip di rumah dan masih bisa dipakai?</i>`, () => {
                chatActionArea.style.display = 'flex';
            });
        } 
        else if (stateDetektif === 2) {
            // Evaluasi Q2 (Apakah punya yang mirip?)
            if (!isYa) poinKebutuhan += 1; // Jika TIDAK punya yang mirip, berarti lebih butuh

            // Kesimpulan Akhir
            stateDetektif = 3;
            let kesimpulan = "";
            
            if (poinKebutuhan === 2) {
                kesimpulan = `🎉 <b>Ini adalah KEBUTUHAN!</b><br>Kamu benar-benar membutuhkannya dan belum punya penggantinya. Boleh dibeli!`;
            } else if (poinKebutuhan === 1) {
                kesimpulan = `⚖️ <b>Ini ada di tengah-tengah!</b><br>Mungkin kamu butuh, tapi coba pikirkan lagi apakah ini bisa ditunda bulan depan?`;
            } else {
                kesimpulan = `🛍️ <b>Ini murni KEINGINAN!</b><br>Kamu masih bisa hidup tanpanya atau kamu sudah punya barang serupa. Uangnya lebih baik ditabung!`;
            }

            tambahPesanBotDenganTyping(`Bip bop! 🤖 Selesai menganalisis...<br><br>${kesimpulan}`, () => {
                // Tampilkan tombol ulangi
                btnUlangiDetektif.style.display = 'inline-block';
            });
        }
    }

    btnJawabYa.addEventListener('click', () => prosesJawaban(true));
    btnJawabTidak.addEventListener('click', () => prosesJawaban(false));

    // Reset Detektif
    btnUlangiDetektif.addEventListener('click', () => {
        playSound(sfxClick);
        stateDetektif = 0;
        barangDetektif = "";
        poinKebutuhan = 0;
        
        // Bersihkan chat (sisakan ucapan pertama)
        chatArea.innerHTML = `
            <div class="chat-bubble chat-bot">
                Bip Bop! 🤖 Halo! Aku Robot Detektif. Sebutkan satu nama barang yang ingin kamu beli!
            </div>
        `;
        
        btnUlangiDetektif.style.display = 'none';
        chatActionArea.style.display = 'none';
        chatInputArea.style.display = 'flex';
    });

});
