// File: /api/create-panel.js (Sudah diperbaiki)
import config from '../config.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // --- PERUBAHAN 1: Tambah 'serverName' dari body ---
        const { username, password, ram: selectedRam, serverName } = req.body;

        if (!username || !password || !selectedRam) {
            return res.status(400).json({ message: 'Username, password, dan RAM wajib diisi.' });
        }

        const { domain, apikey, egg, nestid, loc } = config;

        if (!apikey || apikey === "PTLC_xxxxxxxxxxxxxxxxxxxxxxxx") {
            return res.status(500).json({ message: 'API key belum di-setting di config.js.' });
        }
        
        let ram, disknya, cpu;
        switch (selectedRam) {
            case "1gb": ram = "1024"; disknya = "1024"; cpu = "40"; break;
            case "2gb": ram = "2048"; disknya = "2048"; cpu = "60"; break;
            case "3gb": ram = "3072"; disknya = "3072"; cpu = "80"; break;
            case "4gb": ram = "4096"; disknya = "4096"; cpu = "100"; break;
            case "5gb": ram = "5120"; disknya = "5120"; cpu = "120"; break;
            case "6gb": ram = "6144"; disknya = "6144"; cpu = "140"; break;
            case "7gb": ram = "7168"; disknya = "7168"; cpu = "160"; break;
            case "8gb": ram = "8192"; disknya = "8192"; cpu = "180"; break;
            case "9gb": ram = "9216"; disknya = "9216"; cpu = "200"; break;
            case "10gb": ram = "10240"; disknya = "10240"; cpu = "220"; break;
            case "unlimited": ram = "0"; disknya = "0"; cpu = "0"; break;
            default: return res.status(400).json({ message: 'Pilihan RAM tidak valid.' });
        }

        const email = username + "@rofik.tools";

        const userResponse = await fetch(`${domain}/api/application/users`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apikey}`
            },
            body: JSON.stringify({
                email: email,
                username: username,
                first_name: username,
                last_name: 'User',
                language: 'en',
                password: password
            })
        });

        if (!userResponse.ok) {
            const errorText = await userResponse.text();
            console.error("RAW ERROR DARI PANEL (SAAT BUAT USER):", errorText);
            return res.status(500).json({ message: `Panel Pterodactyl error saat membuat user. Cek log di Vercel untuk detailnya.` });
        }

        const userData = await userResponse.json();
        if (userData.errors) {
            console.error('Pterodactyl User Error (JSON):', userData.errors);
            return res.status(500).json({ message: `Gagal membuat user: ${userData.errors[0].detail}` });
        }

        const userId = userData.attributes.id;

        // --- PERUBAHAN 2: Tentukan nama server ---
        // Kalo serverName diisi, pake itu. Kalo kosong, pake username.
        const finalServerName = serverName && serverName.trim() !== '' ? serverName : username;

        const serverResponse = await fetch(`${domain}/api/application/servers`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apikey}`,
            },
            body: JSON.stringify({
                // --- PERUBAHAN 3: Gunakan nama server yang sudah ditentukan ---
                name: finalServerName,
                user: userId,
                egg: parseInt(egg),
                docker_image: "ghcr.io/parkervcp/yolks:nodejs_18",
                startup: `if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z \${NODE_PACKAGES} ]]; then /usr/local/bin/npm install \${NODE_PACKAGES}; fi; if [[ ! -z \${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall \${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; if [[ ! -z \${CUSTOM_ENVIRONMENT_VARIABLES} ]]; then vars=$(echo \${CUSTOM_ENVIRONMENT_VARIABLES} | tr ";" "\\n"); for line in $vars; do export $line; done fi; /usr/local/bin/\${CMD_RUN};`,
                environment: {
                    "USER_UPLOAD": "0",
                    "AUTO_UPDATE": "0",
                    "CMD_RUN": "npm start"
                },
                limits: { memory: ram, swap: 0, disk: disknya, io: 500, cpu: cpu },
                feature_limits: { databases: 5, backups: 5, allocations: 1 },
                deploy: { locations: [parseInt(loc)], dedicated_ip: false, port_range: [] }
            })
        });

        if (!serverResponse.ok) {
            const errorText = await serverResponse.text();
            console.error("RAW ERROR DARI PANEL (SAAT BUAT SERVER):", errorText);
            return res.status(500).json({ message: `Panel Pterodactyl error saat membuat server. Cek log di Vercel untuk detailnya.` });
        }

        const serverData = await serverResponse.json();
        if (serverData.errors) {
            console.error('Pterodactyl Server Error (JSON):', serverData.errors);
            return res.status(500).json({ message: `Gagal membuat server: ${serverData.errors[0].detail}` });
        }
        
        res.status(200).json({
            success: true,
            username: userData.attributes.username,
            password: password,
            domain: domain,
            server_id: serverData.attributes.id
        });

    } catch (error) {
        console.error('API Handler Error:', error);
        res.status(500).json({ message: 'Terjadi kesalahan internal pada server backend.' });
    }
}
