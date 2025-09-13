// Ganti URL ini dengan URL Vercel project-mu jika berbeda.
const CUSTOM_API_URL = 'https://abcd-chi-umber.vercel.app';

// --- BAGIAN UNTUK MENGATUR ELEMEN-ELEMEN DI HALAMAN ---
let lastTiktokVideoUrl = '';

// Navigasi & Sidebar
const sidebar = document.getElementById('sidebar');
const backdrop = document.getElementById('backdrop');
const menuItems = document.querySelectorAll('.sidebar .menu-item');
const searchInput = document.getElementById('searchInput');

// TikTok Downloader (Variabel video player dikembalikan)
const downloadTiktokBtn = document.getElementById('downloadTiktokBtn');
const tiktokUrlInput = document.getElementById('tiktokUrlInput');
const tiktokResultArea = document.getElementById('resultAreaTiktok');
const tiktokVideoPlayer = document.getElementById('tiktokVideoPlayer');
const tiktokVideoTitle = document.getElementById('videoTitle');
const tiktokVideoAuthor = document.getElementById('videoAuthor');
const tiktokVideoLikes = document.getElementById('videoLikes');
const tiktokVideoViews = document.getElementById('videoViews');
const tiktokVideoComments = document.getElementById('videoComments');
const btnVideoNowm = document.getElementById('btnVideoNowm');
const btnMusic = document.getElementById('btnMusic');
const tiktokStatusMessage = document.getElementById('tiktokStatusMessage');

// Media Uploader
const uploadForm = document.getElementById('uploadForm');
const mediaFile = document.getElementById('mediaFile');
const fileName = document.getElementById('fileName');
const uploadBtn = document.getElementById('uploadBtn');
const uploadStatusMessage = document.getElementById('uploadStatusMessage');
const uploadResult = document.getElementById('uploadResult');
const uploadedUrlResult = document.getElementById('uploadedUrlResult');
const progressBarContainer = document.querySelector('.media-uploader .progress-bar-container');
const progressBar = document.querySelector('.media-uploader .progress-bar');

// Create Panel
const createPanelForm = document.getElementById('createPanelForm');
const createPanelBtn = document.getElementById('createPanelBtn');
const panelUsernameInput = document.getElementById('panelUsernameInput');
const panelPasswordInput = document.getElementById('panelPasswordInput');
const panelRamSelect = document.getElementById('panelRamSelect');
const panelResultArea = document.getElementById('panelResultArea');
const panelStatusMessage = document.getElementById('panelStatusMessage');

// Riwayat
const HISTORY_KEY = 'rofik_history';
const historyList = document.getElementById('historyList');
const emptyHistoryMessage = document.getElementById('emptyHistoryMessage');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// --- FUNGSI-FUNGSI UTAMA ---

function toggleSidebar() {
    sidebar.classList.toggle('open');
    backdrop.classList.toggle('active');
}

function showContent(targetId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    menuItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === '#' + targetId) {
            item.classList.add('active');
        }
    });
}

async function loadPresets() {
    const presetContainer = document.querySelector('.preset-container');
    if (!presetContainer) return;
    presetContainer.innerHTML = '<p style="text-align: center; color: var(--neon-cyan);">Memuat preset...</p>';
    
    try {
        const response = await fetch(`${CUSTOM_API_URL}/api/presets`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const presets = await response.json();
        presetContainer.innerHTML = '';

        if (presets.length === 0) {
            presetContainer.innerHTML = '<p style="text-align: center; color: var(--light-text);">Tidak ada preset yang tersedia.</p>';
            return;
        }

        presets.forEach(preset => {
            const presetCard = document.createElement('div');
            presetCard.className = 'preset-card';
            const downloadButtons = [];
            if (preset.download_url_alight) {
                downloadButtons.push(`<a href="${preset.download_url_alight}" target="_blank" class="download-btn">Download 5MB</a>`);
            }
            if (preset.download_url_xml) {
                downloadButtons.push(`<a href="${preset.download_url_xml}" target="_blank" class="download-btn">Download XML</a>`);
            }
            presetCard.innerHTML = `
                <h2>${preset.title}</h2>
                <div class="video-wrapper">
                    <video src="${preset.video_url}" controls preload="none" poster="${preset.video_url}"></video>
                </div>
                <div class="download-section">
                    <p>${preset.description}</p>
                    ${downloadButtons.join('')}
                </div>
            `;
            presetContainer.appendChild(presetCard);
        });
    } catch (error) {
        console.error('Gagal memuat preset:', error);
        presetContainer.innerHTML = `<p style="text-align: center; color: #f44336;">Gagal memuat daftar preset.</p>`;
    }
}

function saveToHistory(item) {
    let history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    item.id = Date.now();
    item.date = new Date().toLocaleString('id-ID');
    history.unshift(item); 
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    loadHistory();
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    historyList.innerHTML = ''; 
    if (history.length === 0) {
        emptyHistoryMessage.style.display = 'block';
        clearHistoryBtn.style.display = 'none';
    } else {
        emptyHistoryMessage.style.display = 'none';
        clearHistoryBtn.style.display = 'block';
        history.forEach(item => {
            const listItem = document.createElement('li');
            listItem.className = `history-item ${item.type}`;
            listItem.innerHTML = `
                <div class="item-header">
                    <span class="type">${item.type.charAt(0).toUpperCase() + item.type.slice(1)}</span>
                    <span class="date">${item.date}</span>
                </div>
                <div class="item-title">${item.title}</div>
                <div class="item-url"><a href="${item.url}" target="_blank">${item.url}</a></div>
            `;
            historyList.appendChild(listItem);
        });
    }
}

function copyResultUrl(elementId) {
    const el = document.getElementById(elementId);
    if (el && el.href) navigator.clipboard.writeText(el.href).then(() => alert('URL berhasil disalin!'));
}

function copyResultText(elementId) {
    const el = document.getElementById(elementId);
    if (el && el.innerText) navigator.clipboard.writeText(el.innerText).then(() => alert('Teks berhasil disalin!'));
}

// --- EVENT LISTENERS ---

document.addEventListener('DOMContentLoaded', () => {
    const initialHash = window.location.hash.substring(1) || 'beranda';
    showContent(initialHash);
    loadHistory();
    if (initialHash === 'alight-motion-preset') {
        loadPresets();
    }
});

backdrop.addEventListener('click', toggleSidebar);

menuItems.forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        showContent(targetId);
        if (targetId === 'alight-motion-preset') {
            loadPresets();
        }
        if (window.innerWidth <= 768) {
            toggleSidebar();
        }
    });
});

document.querySelectorAll('.quick-access-card.menu-trigger').forEach(card => {
    card.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        showContent(targetId);
        if (targetId === 'alight-motion-preset') {
            loadPresets();
        }
    });
});

if (downloadTiktokBtn) {
    downloadTiktokBtn.addEventListener('click', async () => {
        const url = tiktokUrlInput.value.trim();
        if (!url) return alert('Masukkan URL video TikTok dulu, bro.');

        tiktokStatusMessage.style.display = 'block';
        tiktokStatusMessage.innerText = 'Sedang memproses...';
        downloadTiktokBtn.disabled = true;
        tiktokResultArea.style.display = 'none';
        
        try {
            const response = await fetch(`${CUSTOM_API_URL}/api/download-tiktok?url=${encodeURIComponent(url)}`);
            const result = await response.json();
            
            if (!response.ok || result.status !== 'success') {
                throw new Error(result.message || 'Gagal mendapatkan data video.');
            }

            const tiktokData = result.data;
            tiktokResultArea.style.display = 'flex';
            
            const videoUrl = tiktokData.hdplay || tiktokData.play;
            
            tiktokVideoPlayer.src = videoUrl;

            tiktokVideoTitle.innerText = tiktokData.title || 'Tidak ada judul';
            tiktokVideoAuthor.innerText = tiktokData.author?.nickname || 'Tidak diketahui';
            tiktokVideoViews.innerText = (tiktokData.play_count || 0).toLocaleString('id-ID');
            tiktokVideoLikes.innerText = (tiktokData.digg_count || 0).toLocaleString('id-ID');
            tiktokVideoComments.innerText = (tiktokData.comment_count || 0).toLocaleString('id-ID');
            
            btnVideoNowm.href = videoUrl;
            btnMusic.href = tiktokData.music;

            btnVideoNowm.style.display = videoUrl ? 'block' : 'none';
            btnMusic.style.display = tiktokData.music ? 'block' : 'none';
            
            tiktokStatusMessage.style.display = 'none';
            saveToHistory({ type: 'tiktok', title: tiktokData.title || 'Video TikTok', url: videoUrl });

        } catch (error) {
            console.error('Download Error:', error);
            tiktokStatusMessage.innerText = `❌ Gagal: ${error.message}`;
        } finally {
            downloadTiktokBtn.disabled = false;
        }
    });
}

if (uploadForm) {
    mediaFile.addEventListener('change', () => {
        fileName.textContent = mediaFile.files.length > 0 ? mediaFile.files[0].name : 'Pilih File Media';
    });

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!mediaFile.files[0]) return alert('Pilih file dulu, bro.');

        const file = mediaFile.files[0];
        const formData = new FormData();
        formData.append('media', file);

        uploadBtn.disabled = true;
        uploadBtn.innerText = 'Mengupload...';
        uploadStatusMessage.style.display = 'none';
        uploadResult.style.display = 'none';
        progressBarContainer.style.display = 'block';
        progressBar.style.width = '0%';

        try {
            const response = await fetch(`${CUSTOM_API_URL}/api/upload-media`, { method: 'POST', body: formData });
            progressBar.style.width = '50%';
            const resultUrl = await response.text();
            progressBar.style.width = '100%';

            if (!response.ok) throw new Error(resultUrl || 'Gagal upload file.');

            uploadedUrlResult.href = resultUrl;
            uploadedUrlResult.innerText = resultUrl;
            uploadResult.style.display = 'block';
            saveToHistory({ type: 'media', title: file.name, url: resultUrl });

        } catch (error) {
            console.error('Upload Error:', error);
            uploadStatusMessage.style.display = 'block';
            uploadStatusMessage.innerText = `❌ Gagal: ${error.message}`;
        } finally {
            uploadBtn.disabled = false;
            uploadBtn.innerText = 'Upload';
            setTimeout(() => {
                progressBarContainer.style.display = 'none';
                progressBar.style.width = '0%';
            }, 1000);
        }
    });
}

if (createPanelForm) {
    createPanelForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = panelUsernameInput.value.trim();
        const password = panelPasswordInput.value.trim();
        const ram = panelRamSelect.value;
        const serverName = document.getElementById('panelServerNameInput').value.trim();

        if (!username || !password || !ram) return alert('Username, Password, dan RAM wajib diisi.');

        panelStatusMessage.style.display = 'block';
        panelStatusMessage.innerText = 'Sedang membuat panel, mohon tunggu...';
        createPanelBtn.disabled = true;
        createPanelBtn.innerText = 'Memproses...';
        panelResultArea.style.display = 'none';

        try {
            const response = await fetch(`${CUSTOM_API_URL}/api/create-panel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, ram, serverName })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Terjadi kesalahan di server.');

            document.getElementById('panelLoginUrl').href = data.domain;
            document.getElementById('panelLoginUrl').innerText = data.domain;
            document.getElementById('loginToPanelBtn').href = data.domain;
            document.getElementById('panelUsername').innerText = data.username;
            document.getElementById('panelPassword').innerText = data.password;

            panelResultArea.style.display = 'block';
            panelStatusMessage.style.display = 'none';
        } catch (error) {
            console.error('Panel Creation Error:', error);
            panelStatusMessage.innerText = `❌ Gagal: ${error.message}`;
        } finally {
            createPanelBtn.disabled = false;
            createPanelBtn.innerText = 'Buat Panel';
        }
    });
}

if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Yakin mau hapus semua riwayat?')) {
            localStorage.removeItem(HISTORY_KEY);
            loadHistory();
        }
    });
}
