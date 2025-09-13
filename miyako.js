// Ganti URL ini dengan URL Vercel project-mu jika berbeda.
const CUSTOM_API_URL = 'https://abcd-chi-umber.vercel.app';

// --- DEKLARASI ELEMEN ---
const createPanelForm = document.getElementById('createPanelForm');
const createPanelBtn = document.getElementById('createPanelBtn');
const panelUsernameInput = document.getElementById('panelUsernameInput');
const panelPasswordInput = document.getElementById('panelPasswordInput');
const panelRamSelect = document.getElementById('panelRamSelect');
const panelResultArea = document.getElementById('panelResultArea');
const panelStatusMessage = document.getElementById('panelStatusMessage');

// --- FUNGSI HELPER ---
function copyResultUrl(elementId) {
    const el = document.getElementById(elementId);
    if (el && el.href) navigator.clipboard.writeText(el.href).then(() => alert('URL berhasil disalin!'));
}

function copyResultText(elementId) {
    const el = document.getElementById(elementId);
    if (el && el.innerText) navigator.clipboard.writeText(el.innerText).then(() => alert('Teks berhasil disalin!'));
}

// --- EVENT LISTENER UTAMA ---
if (createPanelForm) {
    createPanelForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = panelUsernameInput.value.trim();
        const password = panelPasswordInput.value.trim();
        const ram = panelRamSelect.value;
        const serverName = document.getElementById('panelServerNameInput').value.trim();

        if (!username || !password || !ram) return alert('Username, Password, dan RAM wajib diisi.');

        panelStatusMessage.style.display = 'block';
        panelStatusMessage.style.backgroundColor = 'rgba(0, 255, 242, 0.2)';
        panelStatusMessage.style.color = 'var(--neon-cyan)';
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
            panelStatusMessage.style.backgroundColor = 'rgba(244, 67, 54, 0.2)';
            panelStatusMessage.style.color = '#f44336';
            panelStatusMessage.innerText = `❌ Gagal: ${error.message}`;
        } finally {
            createPanelBtn.disabled = false;
            createPanelBtn.innerText = 'Buat Panel';
        }
    });
}
