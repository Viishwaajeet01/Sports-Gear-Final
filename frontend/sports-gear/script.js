const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    // Determine which page logic to run based on URL
    const path = window.location.pathname;

    // Highlight Nav
    highlightNav();

    if (path.includes('index.html') || path.endsWith('/')) {
        loadDashboard();
    } else if (path.includes('inventory.html')) {
        loadInventory();
    } else if (path.includes('form.html')) {
        loadForm();
    } else if (path.includes('recommendations.html')) {
        loadRecommendationsPage();
    } else if (path.includes('profile.html')) {
        loadProfile();
    }
});

function highlightNav() {
    const links = document.querySelectorAll('.nav-links a');
    const current = window.location.pathname.split('/').pop() || 'index.html';
    links.forEach(link => {
        if (link.getAttribute('href') === current) {
            link.classList.add('active');
        }
    });
}

// --- Dashboard Logic ---
async function loadDashboard() {
    try {
        const res = await fetch(`${API_URL}/gear`);
        const json = await res.json();
        const data = json.data;

        // Calculate stats
        document.getElementById('total-items').innerText = data.length;
        document.getElementById('active-sports').innerText = new Set(data.map(g => g.sport)).size;

        const replaceSoon = data.filter(g => (g.current_usage / g.max_usage) > 0.8).length;
        document.getElementById('replace-soon').innerText = replaceSoon;

        // Recent items (limit 3)
        const recentList = document.getElementById('recent-list');
        if (recentList && data.length > 0) {
            recentList.innerHTML = '';
            data.slice(-3).reverse().forEach(gear => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${gear.name}</td>
                    <td>${gear.sport}</td>
                    <td>${gear.status}</td>
                `;
                recentList.appendChild(tr);
            });
        }
    } catch (e) { console.error(e); }
}

// --- Inventory Logic ---
async function loadInventory() {
    const list = document.getElementById('inventory-body');
    try {
        const res = await fetch(`${API_URL}/gear`);
        const json = await res.json();

        list.innerHTML = '';
        json.data.forEach(gear => {
            const pct = Math.min((gear.current_usage / gear.max_usage) * 100, 100);
            let color = 'var(--accent)';
            if (pct > 90) color = 'var(--danger)';
            else if (pct > 75) color = 'var(--warning)';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${gear.name}</strong><br><span style="font-size:0.8rem; color:var(--text-secondary)">${gear.type}</span></td>
                <td>${gear.sport}</td>
                <td style="width: 30%">
                    <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
                        <span>${gear.current_usage} ${gear.usage_metric}</span>
                        <span>${Math.round(pct)}%</span>
                    </div>
                    <div class="progress-container">
                        <div class="progress-fill" style="width: ${pct}%; background-color: ${color}"></div>
                    </div>
                </td>
                <td><span class="status-badge">${gear.status}</span></td>
                <td>
                    <a href="form.html?id=${gear.id}" class="btn secondary">Edit</a>
                    <button class="btn danger" onclick="deleteGear(${gear.id})">Del</button>
                    <button class="btn primary" style="padding:4px 8px; font-size:0.8rem" onclick="quickAdd(${gear.id})">+10</button>
                </td>
            `;
            list.appendChild(tr);
        });
    } catch (e) { console.error(e); }
}

// --- Form Logic ---
async function loadForm() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const form = document.getElementById('gear-form');
    const title = document.getElementById('form-title');

    if (id) {
        title.innerText = 'Edit Gear';
        // Fetch existing
        const res = await fetch(`${API_URL}/gear/${id}`);
        const json = await res.json();
        const data = json.data;

        document.getElementById('g-name').value = data.name;
        document.getElementById('g-sport').value = data.sport;
        document.getElementById('g-type').value = data.type;
        document.getElementById('g-metric').value = data.usage_metric;
        document.getElementById('g-max').value = data.max_usage;
        document.getElementById('g-date').value = data.purchase_date;
        document.getElementById('g-current').value = data.current_usage; // hidden or shown
    }

    form.onsubmit = async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById('g-name').value,
            sport: document.getElementById('g-sport').value,
            type: document.getElementById('g-type').value,
            usage_metric: document.getElementById('g-metric').value,
            max_usage: document.getElementById('g-max').value,
            purchase_date: document.getElementById('g-date').value
        };

        if (id) {
            // In edit mode we might want to also send current_usage if exposed
            payload.current_usage = document.getElementById('g-current').value;
            await fetch(`${API_URL}/gear/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            await fetch(`${API_URL}/gear`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }
        window.location.href = 'inventory.html';
    };
}

// --- Recommendations Logic ---
async function loadRecommendationsPage() {
    const container = document.getElementById('rec-grid');
    const res = await fetch(`${API_URL}/recommendations`);
    const json = await res.json();

    container.innerHTML = '';
    json.data.forEach(rec => {
        const div = document.createElement('div');
        const typeClass = rec.type === 'Replacement' ? 'urgent' : (rec.type === 'Maintenance' ? 'maintenance' : '');
        div.className = `rec-card ${typeClass}`;
        div.innerHTML = `
            <div class="rec-header">
                <span class="rec-type">${rec.type}</span>
                <span class="icon">💡</span>
            </div>
            <h3 style="margin-top:0">${rec.sport || 'General'}</h3>
            <p>${rec.message}</p>
            ${rec.related_product ? `<button class="btn primary" style="width:100%; margin-top:10px">Shop ${rec.related_product}</button>` : ''}
        `;
        container.appendChild(div);
    });
}

// --- Profile Logic (Mock) ---
function loadProfile() {
    // Just static interactions for now
    document.getElementById('save-profile').onclick = () => {
        alert('Profile saved!');
    };
}

// --- Global Actions ---
window.deleteGear = async (id) => {
    if (!confirm('Are you sure?')) return;
    await fetch(`${API_URL}/gear/${id}`, { method: 'DELETE' });
    loadInventory();
};

window.quickAdd = async (id) => {
    // Quick +10 usage hack
    // Ideally we fetch first to get current, but let's assume valid
    // We need current usage first properly... 
    // Simplified: Just re-fetch and add 10
    const res = await fetch(`${API_URL}/gear/${id}`);
    const json = await res.json();
    const current = json.data.current_usage;

    await fetch(`${API_URL}/gear/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_usage: current + 10 })
    });
    loadInventory();
};
