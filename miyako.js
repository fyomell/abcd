// --- DEKLARASI ELEMEN ---
const loadingView = document.getElementById('loading-view');
const loginView = document.getElementById('login-view');
const registerView = document.getElementById('register-view');
const appContainer = document.getElementById('app-container');
const allViews = [loadingView, loginView, registerView, appContainer];
const userProfileName = document.getElementById('user-profile-name');
const userProfileRole = document.getElementById('user-profile-role');
const ownerMenuBtn = document.getElementById('owner-menu-btn');
const authErrorDiv = document.getElementById('auth-error');

// --- STATE APLIKASI ---
let loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser')) || null;

// --- FUNGSI UTAMA ---
document.addEventListener('DOMContentLoaded', main);

function main() {
    if (loggedInUser) {
        initializeAppUI();
    } else {
        showView('login-view');
    }
}

function showView(viewId) {
    allViews.forEach(v => v.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
}

function initializeAppUI() {
    userProfileName.textContent = loggedInUser.username;
    userProfileRole.textContent = `Role: ${loggedInUser.role}`;
    if (loggedInUser.role === 'owner') {
        ownerMenuBtn.classList.remove('hidden');
    }
    showView('app-container');
    showAppSubView('app-view');
}

function showAppSubView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
}

async function apiCall(action, body = {}, showLoading = true) {
    if(showLoading) document.body.style.cursor = 'wait';
    try {
        const response = await fetch(`/api/main?action=${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Terjadi kesalahan di server.');
        }
        return data;
    } catch (error) {
        console.error(`API Call Error (${action}):`, error);
        alert(`Error: ${error.message}`);
        return null;
    } finally {
        if(showLoading) document.body.style.cursor = 'default';
    }
}

// --- LOGIKA AUTHENTICATION ---
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const result = await apiCall('login', { username, password });
    if (result && result.success) {
        loggedInUser = result.user;
        sessionStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
        main();
    } else {
        authErrorDiv.textContent = (result && result.message) || 'Login gagal.';
    }
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    if (password !== confirmPassword) { authErrorDiv.textContent = "Password tidak cocok."; return; }

    const result = await apiCall('register', { username, password });
    if (result && result.success) {
        alert('Registrasi berhasil! Silakan login.');
        showView('login-view');
    } else {
         authErrorDiv.textContent = (result && result.message) || 'Registrasi gagal.';
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    sessionStorage.removeItem('loggedInUser');
    window.location.reload();
});

// --- OWNER PANEL ---
async function renderUserList() {
    const tbody = document.querySelector('#user-list-table tbody');
    tbody.innerHTML = '<tr><td colspan="6">Memuat data...</td></tr>';
    const result = await apiCall('listUsers', {}, false);
    if (result && result.success) {
        let rows = '';
        result.users.forEach(user => {
            const statusClass = user.isBanned ? 'status-banned' : 'status-active';
            const statusText = user.isBanned ? 'Banned' : 'Active';
            const actionButton = user.isBanned 
                ? `<button class="action-btn unban" data-username="${user.username}">Unban</button>`
                : `<button class="action-btn ban" data-username="${user.username}">Ban</button>`;

            rows += `<tr>
                <td>${user.username}</td><td>${user.role}</td>
                <td class="${statusClass}">${statusText}</td>
                <td>${user.pteroUserId || '-'}</td><td>${user.serverId || '-'}</td>
                <td>${user.username !== 'admin' ? actionButton : ''}</td>
            </tr>`;
        });
        tbody.innerHTML = rows || '<tr><td colspan="6">Tidak ada user.</td></tr>';
    } else {
        tbody.innerHTML = '<tr><td colspan="6">Gagal memuat data.</td></tr>';
    }
}

document.getElementById('user-list-table').addEventListener('click', async (e) => {
    const target = e.target;
    if (!target.matches('.action-btn')) return;
    const username = target.dataset.username;
    const ban = target.classList.contains('ban');
    if (confirm(`Yakin mau ${ban ? 'Ban' : 'Unban'} user "${username}"?`)) {
        const result = await apiCall('toggleBan', { username, ban });
        if (result && result.success) {
            alert(result.message);
            renderUserList();
        }
    }
});


// --- UI SWITCHERS ---
document.getElementById('show-register').addEventListener('click', (e) => { e.preventDefault(); authErrorDiv.textContent = ''; showView('register-view'); });
document.getElementById('show-login').addEventListener('click', (e) => { e.preventDefault(); authErrorDiv.textContent = ''; showView('login-view'); });
document.querySelector('.header .hamburger').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('backdrop').classList.toggle('active');
});
document.getElementById('backdrop').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('backdrop').classList.remove('active');
});
document.querySelectorAll('.sidebar .menu-item[data-view]').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const viewId = e.currentTarget.dataset.view;
        showAppSubView(viewId);
        document.querySelectorAll('.sidebar .menu-item[data-view]').forEach(i => i.classList.remove('active'));
        e.currentTarget.classList.add('active');
        if (viewId === 'owner-view') renderUserList();
    });
});