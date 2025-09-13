// --- KONFIGURASI & DEKLARASI ELEMEN ---
const GITHUB_DB_PATH = 'db/users.json';
const appContainer = document.getElementById('app-container');
const loginView = document.getElementById('login-view');
const registerView = document.getElementById('register-view');
const githubModal = document.getElementById('github-modal');

// --- STATE APLIKASI ---
let githubConfig = JSON.parse(localStorage.getItem('githubConfig')) || null;
let loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser')) || null;
let usersData = [];
let fileSHA = null;

// --- FUNGSI UTAMA ---
document.addEventListener('DOMContentLoaded', main);

function main() {
    if (!githubConfig) {
        showView('github-modal');
    } else if (loggedInUser) {
        initializeAppUI();
    } else {
        showView('login-view');
    }
}

function showView(viewId) {
    ['app-container', 'login-view', 'register-view', 'github-modal'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
    document.getElementById(viewId).classList.remove('hidden');
}

async function initializeAppUI() {
    document.getElementById('user-profile-name').textContent = loggedInUser.username;
    document.getElementById('user-profile-role').textContent = `Role: ${loggedInUser.role}`;
    
    if (loggedInUser.role === 'owner') {
        document.getElementById('owner-menu-btn').classList.remove('hidden');
        renderUserList(); 
    }
    
    showView('app-container');
    document.getElementById('app-view').classList.remove('hidden');
    document.getElementById('owner-view').classList.add('hidden');
}

// --- LOGIKA GITHUB SEBAGAI DB ---
async function githubApi(endpoint, options = {}) {
    if (!githubConfig || !githubConfig.token) throw new Error('Konfigurasi GitHub PAT tidak ditemukan.');
    const headers = {
        'Authorization': `Bearer ${githubConfig.token}`, 'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
    };
    const response = await fetch(`https://api.github.com${endpoint}`, { ...options, headers });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`GitHub API Error: ${errorData.message || response.statusText}`);
    }
    if (response.status === 204 || response.status === 201) return null;
    return response.json();
}

async function readDB() {
    try {
        const data = await githubApi(`/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${GITHUB_DB_PATH}`);
        fileSHA = data.sha;
        usersData = JSON.parse(atob(data.content));
        return true;
    } catch (error) {
        if (error.message.includes("Not Found")) {
            console.warn(`${GITHUB_DB_PATH} tidak ada, akan dibuat saat pendaftaran pertama.`);
            usersData = [];
            fileSHA = null;
            return true;
        }
        alert(`Gagal membaca database dari GitHub: ${error.message}`);
        return false;
    }
}

async function writeDB(commitMessage) {
    const content = btoa(JSON.stringify(usersData, null, 2));
    const body = { message: commitMessage, content, sha: fileSHA };
    
    // Jika fileSHA null, berarti ini file baru (method POST)
    if (!fileSHA) {
        delete body.sha;
    }
    
    const data = await githubApi(`/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${GITHUB_DB_PATH}`, { 
        method: 'PUT', 
        body: JSON.stringify(body) 
    });
    fileSHA = data.content.sha; // Update SHA setelah write
}

// --- LOGIKA AUTHENTICATION ---
async function hashPassword(password) {
    const data = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('auth-error');
    errorDiv.textContent = '';

    if (username === 'admin' && password === 'rofikfyo') {
        loggedInUser = { username: 'admin', role: 'owner' };
        sessionStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
        main();
        return;
    }

    if (!await readDB()) return;
    const user = usersData.find(u => u.username.toLowerCase() === username.toLowerCase());
    const hashedPassword = await hashPassword(password);
    if (user && user.password === hashedPassword) {
        if (user.isBanned) {
            errorDiv.textContent = 'Akun Anda telah di-ban.';
            return;
        }
        loggedInUser = user;
        sessionStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
        main();
    } else {
        errorDiv.textContent = 'Username atau password salah.';
    }
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const errorDiv = document.getElementById('auth-error');
    errorDiv.textContent = '';

    if (password !== confirmPassword) {
        errorDiv.textContent = "Konfirmasi password tidak cocok."; return;
    }
    if (password.length < 6) {
        errorDiv.textContent = "Password minimal 6 karakter."; return;
    }

    if (!await readDB()) return;
    if (usersData.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        errorDiv.textContent = "Username sudah digunakan."; return;
    }

    const hashedPassword = await hashPassword(password);
    usersData.push({ username, password: hashedPassword, role: 'user', isBanned: false });
    
    try {
        await writeDB(`User registration: ${username}`);
        alert('Pendaftaran berhasil! Silakan login.');
        showView('login-view');
    } catch (error) {
        errorDiv.textContent = `Gagal menyimpan data: ${error.message}`;
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    sessionStorage.removeItem('loggedInUser');
    loggedInUser = null;
    window.location.reload();
});

// --- LOGIKA OWNER PANEL ---
async function renderUserList() {
    if (!await readDB()) return;
    const tbody = document.querySelector('#user-list-table tbody');
    tbody.innerHTML = '';
    usersData.forEach(user => {
        const row = document.createElement('tr');
        const statusClass = user.isBanned ? 'status-banned' : 'status-active';
        const statusText = user.isBanned ? 'Banned' : 'Active';
        const actionButton = user.isBanned 
            ? `<button class="action-btn unban" data-username="${user.username}">Unban</button>`
            : `<button class="action-btn ban" data-username="${user.username}">Ban</button>`;

        row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.role}</td>
            <td class="${statusClass}">${statusText}</td>
            <td>${user.username !== 'admin' ? actionButton : ''}</td>
        `;
        tbody.appendChild(row);
    });
}

document.getElementById('user-list-table').addEventListener('click', async (e) => {
    const target = e.target;
    if (!target.matches('.action-btn')) return;

    const username = target.dataset.username;
    const shouldBan = target.classList.contains('ban');
    
    if (!confirm(`Yakin mau ${shouldBan ? 'Ban' : 'Unban'} user "${username}"?`)) return;

    if (!await readDB()) return;
    const userIndex = usersData.findIndex(u => u.username === username);
    if (userIndex > -1) {
        usersData[userIndex].isBanned = shouldBan;
        try {
            await writeDB(`Update ban status for ${username}`);
            alert(`User ${username} berhasil di-${shouldBan ? 'Ban' : 'Unban'}.`);
            renderUserList(); // Refresh tabel
        } catch (error) {
            alert(`Gagal update status: ${error.message}`);
        }
    }
});

// --- EVENT LISTENERS LAINNYA ---
document.getElementById('save-github-config').addEventListener('click', () => {
    githubConfig = {
        token: document.getElementById('token').value.trim(),
        owner: document.getElementById('owner').value.trim(),
        repo: document.getElementById('repo').value.trim(),
    };
    if (githubConfig.token && githubConfig.owner && githubConfig.repo) {
        localStorage.setItem('githubConfig', JSON.stringify(githubConfig));
        main();
    } else {
        alert('Semua field wajib diisi.');
    }
});

document.querySelectorAll('.sidebar .menu-item[data-view]').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const viewId = e.currentTarget.dataset.view;
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        document.getElementById(viewId).classList.remove('hidden');
        document.querySelectorAll('.sidebar .menu-item[data-view]').forEach(i => i.classList.remove('active'));
        e.currentTarget.classList.add('active');
        if (viewId === 'owner-view') renderUserList();
    });
});

document.getElementById('show-register').addEventListener('click', () => showView('register-view'));
document.getElementById('show-login').addEventListener('click', () => showView('login-view'));
document.querySelector('.header .hamburger').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('backdrop').classList.toggle('active');
});
document.getElementById('backdrop').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('backdrop').classList.remove('active');
});