// Menggunakan Firebase Compat Library (dimuat dari CDN di HTML)
// Tidak perlu import module, objek 'firebase' sudah tersedia secara global.

// Konfigurasi Web App Firebase (Proyek Baru: database-finansial)
const firebaseConfig = {
    apiKey: "AIzaSyAkEmM4DxWrkfeT1XXqyRqU3bkB3-60ors",
    authDomain: "database-finansial-edb56.firebaseapp.com",
    projectId: "database-finansial-edb56",
    storageBucket: "database-finansial-edb56.firebasestorage.app",
    messagingSenderId: "949826246842",
    appId: "1:949826246842:web:0d91cc2e84c5f0a4e00a83",
    measurementId: "G-LNM81TV8PF"
};

// Inisialisasi Firebase App
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Inisialisasi Firestore
const db = firebase.firestore();

// Referensi Koleksi
const itemsCol = db.collection("items");
const resultsCol = db.collection("studentResults");
const settingsDoc = db.collection("settings").doc("appSettings");
const presenceCol = db.collection("presence");
const activityLogsCol = db.collection("activityLogs");

// =========================================
// 1. DATA BARANG (EKSPLORASI)
// =========================================

// Menyimpan barang baru
window.addItem = async function(item) {
    try {
        item.status = item.status || 'pending';
        item.timestamp = Date.now();
        const docRef = await itemsCol.add(item);
        item.id = docRef.id;
        return item;
    } catch (e) {
        console.error("Error adding document ke Firestore: ", e);
        throw e;
    }
};

// Mengambil seluruh barang
window.getAllItems = async function() {
    try {
        const querySnapshot = await itemsCol.get();
        let items = [];
        querySnapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
        });
        // Pastikan status ada (untuk data lama jika ada)
        items = items.map(item => ({...item, status: item.status || 'pending'}));
        // Urutkan berdasarkan waktu (terbaru di atas)
        items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        return items;
    } catch (e) {
        console.error("Error getting documents dari Firestore: ", e);
        return [];
    }
};

// Menghapus barang permanen
window.deleteItem = async function(id) {
    try {
        await itemsCol.doc(id).delete();
    } catch (e) {
        console.error("Error deleting document dari Firestore: ", e);
    }
};

// Menyetujui barang
window.approveItem = async function(id) {
    try {
        await itemsCol.doc(id).update({
            status: 'approved'
        });
    } catch (e) {
        console.error("Error updating document di Firestore: ", e);
    }
};

// =========================================
// 2. HASIL EVALUASI BELAJAR (KUIS & RENCANA)
// =========================================

window.getStudentResults = async function() {
    try {
        // Membatasi pengambilan data (limit 100) agar sangat cepat saat loading/refresh pertama kali
        const querySnapshot = await resultsCol.orderBy('timestamp', 'desc').limit(100).get();
        let results = [];
        querySnapshot.forEach((doc) => {
            results.push({ id: doc.id, ...doc.data() });
        });
        return results;
    } catch (e) {
        console.error("Error getting results dari Firestore: ", e);
        return [];
    }
};

window.listenToStudentResults = function(callback) {
    return resultsCol.orderBy('timestamp', 'desc').limit(100).onSnapshot((snapshot) => {
        let results = [];
        snapshot.forEach((doc) => {
            results.push({ id: doc.id, ...doc.data() });
        });
        callback(results);
    }, (error) => {
        console.error("Error listening to results: ", error);
    });
};

window.saveStudentResult = async function(data) {
    try {
        const record = {
            waktu: new Date().toLocaleString('id-ID'),
            timestamp: Date.now(),
            ...data
        };
        await resultsCol.add(record);
    } catch (e) {
        console.error("Error saving result ke Firestore: ", e);
        throw e;
    }
};

// Menghapus semua hasil evaluasi (batch delete di Firestore)
window.clearStudentResults = async function() {
    try {
        const snapshot = await resultsCol.get();
        const batch = db.batch();
        snapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    } catch (e) {
        console.error("Error clearing results di Firestore: ", e);
    }
};

// =========================================
// 3. PENGATURAN LIMIT FOTO
// =========================================

window.getSettings = async function() {
    try {
        const docSnap = await settingsDoc.get();
        if (docSnap.exists) {
            return docSnap.data();
        } else {
            // Default jika dokumen belum ada di Firestore
            const defaultSettings = { limitFoto: 5 };
            await settingsDoc.set(defaultSettings);
            return defaultSettings;
        }
    } catch (e) {
        console.error("Error getting settings dari Firestore: ", e);
        return { limitFoto: 5 };
    }
};

window.updateLimitFoto = async function(limit) {
    try {
        await settingsDoc.set({ limitFoto: limit }, { merge: true });
    } catch (e) {
        console.error("Error updating settings di Firestore: ", e);
    }
};

// Pengaturan Cerita Kasus, Aturan, dan Kelompok
window.getStorySettings = async function() {
    try {
        const docSnap = await settingsDoc.get();
        if (docSnap.exists) {
            const data = docSnap.data();
            return {
                kumpulanCerita: data.kumpulanCerita || ['Silakan bantu Andi memilih barang kebutuhan sekolahnya dengan uang Rp20.000.'],
                aturan: data.aturan || '1. Pilih barang yang paling penting.\n2. Diskusikan dengan teman kelompokmu.\n3. Jangan lupa difoto dan diunggah!',
                jumlahKelompok: data.jumlahKelompok || 1,
                uangSakuAwal: data.uangSakuAwal || 20000,
                alokasiCerita: data.alokasiCerita || {}
            };
        } else {
            return {
                kumpulanCerita: ['Silakan bantu Andi memilih barang kebutuhan sekolahnya dengan uang Rp20.000.'],
                aturan: '1. Pilih barang yang paling penting.\n2. Diskusikan dengan teman kelompokmu.\n3. Jangan lupa difoto dan diunggah!',
                jumlahKelompok: 1,
                uangSakuAwal: 20000,
                alokasiCerita: {}
            };
        }
    } catch (e) {
        console.error("Error getting story settings: ", e);
        return { kumpulanCerita: [], aturan: '', jumlahKelompok: 1, alokasiCerita: {} };
    }
};

window.listenToStorySettings = function(callback) {
    return settingsDoc.onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            callback({
                kumpulanCerita: data.kumpulanCerita || [],
                aturan: data.aturan || '',
                jumlahKelompok: data.jumlahKelompok || 1,
                uangSakuAwal: data.uangSakuAwal || 20000,
                alokasiCerita: data.alokasiCerita || {}
            });
        }
    });
};

window.updateStorySettings = async function(kumpulanCerita, aturan, jumlahKelompok) {
    try {
        // Simpan ke DB, reset alokasi cerita jika disave ulang
        await settingsDoc.set({ 
            kumpulanCerita: kumpulanCerita, 
            aturan: aturan, 
            jumlahKelompok: parseInt(jumlahKelompok) || 1,
            alokasiCerita: {} 
        }, { merge: true });
    } catch (e) {
        console.error("Error updating story settings: ", e);
    }
};

window.drawRandomStory = async function(kelompokNumber) {
    try {
        return await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(settingsDoc);
            if (!doc.exists) throw "Dokumen tidak ditemukan!";

            const data = doc.data();
            const alokasi = data.alokasiCerita || {};
            const kumpulan = data.kumpulanCerita || [];

            // Jika kelompok ini sudah memiliki cerita, berikan cerita tersebut
            if (alokasi[kelompokNumber] !== undefined) {
                return { cerita: kumpulan[alokasi[kelompokNumber]], baruSajaDiundi: false };
            }

            // Cari index cerita yang belum diambil kelompok mana pun
            const assignedIndexes = Object.values(alokasi).map(x => parseInt(x, 10));
            const availableIndexes = [];
            for (let i = 0; i < kumpulan.length; i++) {
                if (!assignedIndexes.includes(i)) {
                    availableIndexes.push(i);
                }
            }

            if (availableIndexes.length === 0) {
                // Semua cerita habis (misal jumlah kelompok > jumlah cerita), berikan cerita acak
                const fallbackIndex = Math.floor(Math.random() * kumpulan.length);
                alokasi[kelompokNumber] = fallbackIndex;
                transaction.update(settingsDoc, { alokasiCerita: alokasi });
                return { cerita: kumpulan[fallbackIndex], baruSajaDiundi: true };
            }

            // Acak dari cerita yang masih tersedia
            const randomIndex = availableIndexes[Math.floor(Math.random() * availableIndexes.length)];
            alokasi[kelompokNumber] = randomIndex;
            
            // Simpan alokasi baru
            transaction.update(settingsDoc, { alokasiCerita: alokasi });
            return { cerita: kumpulan[randomIndex], baruSajaDiundi: true };
        });
    } catch (e) {
        console.error("Gagal melakukan undian cerita: ", e);
        return { cerita: "Maaf, gagal memuat cerita. Silakan coba lagi.", baruSajaDiundi: false };
    }
};

window.resetStoryAllocation = async function() {
    try {
        await settingsDoc.update({
            alokasiCerita: {}
        });
        return true;
    } catch (e) {
        console.error("Gagal mereset undian cerita: ", e);
        return false;
    }
};

// =========================================
// 4. PEMANTAUAN SISWA AKTIF (PRESENCE LMS)
// =========================================

// Siswa mengirim sinyal 'ping' ke database
window.updatePresence = async function(siswaId, nama, kelas, status) {
    try {
        await presenceCol.doc(siswaId).set({
            nama: nama,
            kelas: kelas,
            status: status, // 'online' atau 'offline'
            lastActive: Date.now()
        }, { merge: true });
    } catch (e) {
        console.error("Error updating presence: ", e);
    }
};

// Guru mendengarkan perubahan status secara real-time
window.listenToPresence = function(callback) {
    // Menggunakan onSnapshot agar data terkirim otomatis tiap ada perubahan
    return presenceCol.onSnapshot((snapshot) => {
        let activeStudents = [];
        const now = Date.now();
        snapshot.forEach((doc) => {
            const data = doc.data();
            // Jika status online dan ping terakhir kurang dari 3 menit (180000 ms) yang lalu
            const isTimeout = (now - (data.lastActive || 0)) > 180000;
            
            if (data.status === 'online' && !isTimeout) {
                activeStudents.push({ id: doc.id, ...data });
            } else if (data.status === 'online' && isTimeout) {
                // Auto set offline secara diam-diam jika sudah lewat batas waktu (misal HP mati mendadak)
                presenceCol.doc(doc.id).update({ status: 'offline' }).catch(()=>{});
            }
        });
        
        // Urutkan berdasarkan waktu aktif terbaru (agar yang baru online ada di atas)
        activeStudents.sort((a, b) => b.lastActive - a.lastActive);
        callback(activeStudents);
    }, (error) => {
        console.error("Error listening to presence: ", error);
    });
};

// =========================================
// 5. REKAM JEJAK KEAKTIFAN SISWA (ACTIVITY LOG)
// =========================================

window.logActivity = async function(aktivitas) {
    // Ambil data siswa yang sedang login dari sessionStorage
    const siswaAuth = sessionStorage.getItem('siswaAuth');
    if (!siswaAuth) return;

    // --- FITUR EFISIENSI JEJAK AKTIVITAS ---
    // Cegah pencatatan aktivitas yang sama berulang kali di satu sesi (sekali login)
    let loggedActivities = JSON.parse(sessionStorage.getItem('loggedActivities') || '[]');
    if (loggedActivities.includes(aktivitas)) {
        return; // Aktivitas ini sudah terekam sebelumnya pada sesi ini, abaikan!
    }
    // Catat ke ingatan sementara agar tidak diulang
    loggedActivities.push(aktivitas);
    sessionStorage.setItem('loggedActivities', JSON.stringify(loggedActivities));

    try {
        const dataSiswa = JSON.parse(siswaAuth);
        
        // Buat ID Sesi unik jika belum ada (hanya dibuat sekali saat login)
        if (!dataSiswa.sessionId) {
            dataSiswa.sessionId = "session_" + Date.now() + "_" + Math.floor(Math.random()*1000);
            const now = new Date();
            const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
            dataSiswa.waktu = now.toLocaleDateString('id-ID', options).replace(/\./g, ':');
            dataSiswa.timestamp = Date.now();
            sessionStorage.setItem('siswaAuth', JSON.stringify(dataSiswa));
        }

        const logRef = activityLogsCol.doc(dataSiswa.sessionId);
        
        // Gabungkan aktivitas ke dalam satu data (satu baris) menggunakan arrayUnion
        await logRef.set({
            timestamp: dataSiswa.timestamp,
            waktu: dataSiswa.waktu,
            namaSiswa: dataSiswa.nama,
            kelasSiswa: dataSiswa.kelas,
            aktivitasList: firebase.firestore.FieldValue.arrayUnion(aktivitas)
        }, { merge: true });
        
    } catch (e) {
        console.error("Gagal merekam aktivitas: ", e);
    }
};

window.getActivityLogs = async function() {
    try {
        const snapshot = await activityLogsCol.orderBy('timestamp', 'desc').limit(50).get();
        let logs = [];
        snapshot.forEach(doc => {
            logs.push({ id: doc.id, ...doc.data() });
        });
        return logs;
    } catch (e) {
        console.error("Error mengambil log aktivitas: ", e);
        return [];
    }
};

window.listenToActivityLogs = function(callback) {
    return activityLogsCol.orderBy('timestamp', 'desc').limit(50).onSnapshot((snapshot) => {
        let logs = [];
        snapshot.forEach(doc => {
            logs.push({ id: doc.id, ...doc.data() });
        });
        callback(logs);
    }, (error) => {
        console.error("Error listening to activity logs: ", error);
    });
};

window.clearActivityLogs = async function() {
    try {
        const snapshot = await activityLogsCol.get();
        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        return true;
    } catch (e) {
        console.error("Error menghapus log: ", e);
        return false;
    }
};
