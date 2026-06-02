/* 
 * Chatbot Edukasi Literasi Finansial (Native Google Gemini API)
 * Author: Aan Rifai
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. KONFIGURASI API BACKEND (VERCEL / LOCALHOST)
    // Otomatis mendeteksi apakah sedang dijalankan lokal (file://) atau dihosting
    const isLocal = window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_URL = isLocal ? 'http://localhost:3000/api/chat' : '/api/chat';
    
    // Sistem Persona: Memberi tahu AI siapa dirinya sebelum merespon
    const SYSTEM_PROMPT = "Kamu adalah Fin AI, robot pintar, lucu, dan ramah yang membantu anak Sekolah Dasar (SD) belajar tentang uang, menabung, kebutuhan vs keinginan, dan literasi finansial dasar. Selalu jawab dengan singkat (maksimal 2 paragraf pendek), gunakan bahasa Indonesia yang sangat mudah dipahami anak-anak, dan gunakan banyak emoji lucu. Jangan memberikan jawaban yang rumit atau matematis berat. Jika ditanya hal di luar literasi keuangan, arahkan kembali ke topik uang dengan ramah.";

    // Riwayat chat untuk mengingat konteks percakapan
    let chatHistory = [];

    // 2. BUAT ELEMEN HTML CHATBOT SECARA DINAMIS
    const chatbotHTML = `
        <!-- Tombol Mengambang -->
        <button id="chatbot-toggle" title="Tanya Bot Keuangan">🤖</button>

        <!-- Jendela Chat -->
        <div id="chatbot-window">
            <div class="chatbot-header">
                <h3>🤖 Fin AI</h3>
                <button class="close-chatbot" id="chatbot-close">&times;</button>
            </div>
            
            <!-- Area Pesan Native -->
            <div class="chatbot-messages" id="chatbot-messages">
                <div class="message bot">
                    Bip Bop! 🤖 Halo, namaku Fin AI. Aku adalah robot cerdas yang siap menjawab pertanyaanmu tentang uang, jajan, atau menabung. Ada yang ingin kamu tanyakan hari ini? 💰✨
                </div>
            </div>
            
            <!-- Area Input Native -->
            <div class="chatbot-input-area">
                <input type="text" id="chatbot-input" placeholder="Tanya sesuatu ke Fin..." autocomplete="off">
                <button id="chatbot-send">➤</button>
            </div>
        </div>
    `;

    // Sisipkan ke dalam body
    document.body.insertAdjacentHTML('beforeend', chatbotHTML);

    // 3. REFERENSI ELEMEN DOM
    const toggleBtn = document.getElementById('chatbot-toggle');
    const closeBtn = document.getElementById('chatbot-close');
    const chatWindow = document.getElementById('chatbot-window');
    
    const messagesArea = document.getElementById('chatbot-messages');
    const inputField = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send');

    // 4. FUNGSI BUKA / TUTUP CHAT
    toggleBtn.addEventListener('click', () => {
        chatWindow.classList.toggle('active');
        if (chatWindow.classList.contains('active')) {
            // Scroll ke bawah saat dibuka
            messagesArea.scrollTop = messagesArea.scrollHeight;
        }
    });

    closeBtn.addEventListener('click', () => {
        chatWindow.classList.remove('active');
    });

    // 5. FUNGSI MENAMBAHKAN PESAN KE LAYAR
    function appendMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        // Ubah newline menjadi <br> agar rapi
        messageDiv.innerHTML = text.replace(/\n/g, '<br>');
        
        messagesArea.appendChild(messageDiv);
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    // 6. FUNGSI MEMANGGIL API
    async function sendMessageToGemini(userText) {
        // Tampilkan pesan user di UI
        appendMessage(userText, 'user');
        
        // CATAT AKTIVITAS: Tanya AI
        if (typeof logActivity === 'function') {
            // Potong teks jika terlalu panjang agar tabel guru rapi
            const shortText = userText.length > 30 ? userText.substring(0, 30) + '...' : userText;
            logActivity(`🤖 Bertanya ke Fin AI: "${shortText}"`);
        }
        
        // Kosongkan input
        inputField.value = '';
        inputField.disabled = true;
        sendBtn.disabled = true;

        // Tambahkan indikator loading (typing)
        const loadingId = "loading-" + Date.now();
        const loadingHtml = `<div id="${loadingId}" class="message bot" style="color: #7F8C8D; font-style: italic;">Fin sedang berpikir... ⏳</div>`;
        messagesArea.insertAdjacentHTML('beforeend', loadingHtml);
        messagesArea.scrollTop = messagesArea.scrollHeight;

        try {
            // Siapkan payload untuk dikirim ke Backend Node.js
            const payload = {
                message: userText,
                systemPrompt: SYSTEM_PROMPT
            };

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            // Hapus pesan loading
            const loadingEl = document.getElementById(loadingId);
            if(loadingEl) loadingEl.remove();

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                const detail = errData.error || response.statusText;
                throw new Error("Error " + response.status + ": " + detail);
            }

            const data = await response.json();
            let botReply = data.reply || "Maaf, Fin sedang bingung. Coba lagi ya!";

            // Tampilkan balasan bot
            appendMessage(botReply, 'bot');

        } catch (error) {
            // Hapus pesan loading jika error
            const loadingEl = document.getElementById(loadingId);
            if(loadingEl) loadingEl.remove();
            
            console.error("Gemini Error:", error);
            
            // Tampilkan pesan error ASLI dari server agar kita tahu apa masalahnya
            appendMessage("Aduh! 🤕 Sistem menolak kuncinya. Pesan dari Google: <b>" + error.message + "</b>", 'bot');
        } finally {
            // Kembalikan input
            inputField.disabled = false;
            sendBtn.disabled = false;
            inputField.focus();
        }
    }

    // 7. EVENT LISTENER UNTUK MENGIRIM PESAN
    sendBtn.addEventListener('click', () => {
        const text = inputField.value.trim();
        if (text) {
            sendMessageToGemini(text);
        }
    });

    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const text = inputField.value.trim();
            if (text) {
                sendMessageToGemini(text);
            }
        }
    });

});
