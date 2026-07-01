// ==========================================================================
// POLISPORT BOOK CORE ENGINE - OFFLINE-FIRST HYBRID ARCHITECTURE
// ==========================================================================

let useMySQL = false;
let currentUser = null;
let currentRoleMode = 'pengguna'; // Selected on login tabs: 'pengguna' or 'admin'

// Local Datastores (Fallback when MySQL is offline)
let pshUsers = [];
let pshFacilities = [];
let pshEquipment = [];
let pshBookings = [];

// Selected Item state for booking form
let activeReceiptId = null;

// Document Ready Initialization
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Probe MySQL Server
    await probeDatabaseStatus();
    
    // 2. Load Data Store
    await loadDataStore();

    // 3. Keep forms updated
    const dateInput = document.getElementById('booking-date');
    if (dateInput) {
        // Prevent booking in the past
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
    }
});

// Probe api.php status to verify database configuration
async function probeDatabaseStatus() {
    const statusDot = document.getElementById('db-status-dot');
    const statusText = document.getElementById('db-status-text');

    try {
        const res = await fetch('api.php?action=status');
        if (!res.ok) throw new Error();
        const data = await res.json();
        
        if (data.status === 'online') {
            useMySQL = true;
            statusDot.className = 'status-dot online';
            statusText.textContent = 'MySQL Bersambung 🟢';
        } else {
            throw new Error();
        }
    } catch (e) {
        useMySQL = false;
        statusDot.className = 'status-dot offline';
        statusText.textContent = 'LocalStorage Aktif 🟠';
    }
}

// Load Datastore (MySQL API vs LocalStorage Fallback)
async function loadDataStore() {
    if (useMySQL) {
        try {
            const res = await fetch('api.php?action=get_data');
            if (!res.ok) throw new Error("Gagal mengambil data MySQL");
            const data = await res.json();
            pshFacilities = data.facilities;
            pshEquipment = data.equipment;
            pshBookings = data.bookings;
        } catch (e) {
            console.warn("Ralat MySQL, beralih ke mod sandaran LocalStorage", e);
            useMySQL = false;
            document.getElementById('db-status-dot').className = 'status-dot offline';
            document.getElementById('db-status-text').textContent = 'LocalStorage Aktif 🟠';
            initialiseLocalStorage();
        }
    } else {
        initialiseLocalStorage();
    }
}

// LocalStorage Fallback database loaders
function initialiseLocalStorage() {
    // 1. Users list
    const localUsers = localStorage.getItem('psh_sukan_users');
    if (localUsers) {
        pshUsers = JSON.parse(localUsers);
    } else {
        pshUsers = [
            { ic: '050101121234', name: 'Ahmad Bin Daniel (Pelajar)', password: 'sukan123', role: 'pengguna' },
            { ic: '040202125678', name: 'Siti Aminah Binti Rosli (Pelajar)', password: 'sukan123', role: 'pengguna' },
            { ic: '800505129999', name: 'Encik Ramli Bin Kassim (Staf)', password: 'sukan123', role: 'pengguna' },
            { ic: 'admin', name: 'Penyelaras JSKK', password: 'admin123', role: 'admin' }
        ];
        localStorage.setItem('psh_sukan_users', JSON.stringify(pshUsers));
    }

    // 2. Facilities catalog
    const localFac = localStorage.getItem('psh_sukan_facilities');
    if (localFac) {
        pshFacilities = JSON.parse(localFac);
    } else {
        pshFacilities = [
            { id: 'FAC-DEWAN', name: 'Dewan Sukan Serbaguna (Indoor)', icon: '🏢', status: 'Tersedia', description: 'Gelanggang Badminton, Bola Jaring & Bola Tampar Indoor.' },
            { id: 'FAC-FUTSAL', name: 'Gelanggang Futsal Luar (Outdoor)', icon: '⚽', status: 'Tersedia', description: 'Gelanggang futsal bertar berserta lampu limpah.' },
            { id: 'FAC-TAMPAR', name: 'Gelanggang Bola Tampar Sandakan', icon: '🏐', status: 'Tersedia', description: 'Gelanggang bola tampar outdoor bersebelahan dewan.' },
            { id: 'FAC-PADANG', name: 'Padang Bola Sepak JSKK', icon: '🌿', status: 'Penyenggaraan', description: 'Padang bola sepak rumput semula jadi (Sesi penyuburan rumput).' }
        ];
        localStorage.setItem('psh_sukan_facilities', JSON.stringify(pshFacilities));
    }

    // 3. Equipment catalog
    const localEqp = localStorage.getItem('psh_sukan_equipment');
    if (localEqp) {
        pshEquipment = JSON.parse(localEqp);
    } else {
        pshEquipment = [
            { id: 'EQP-BADM', name: 'Set Raket & Bulu Tangkis', icon: '🏸', quantity: 12, borrowed: 0, description: 'Set mengandungi 2 raket dan 3 biji bulu tangkis.' },
            { id: 'EQP-FUTS', name: 'Bola Futsal Molten', icon: '⚽', quantity: 6, borrowed: 0, description: 'Bola futsal bersaiz 4 untuk kegunaan gelanggang keras.' },
            { id: 'EQP-BOLA', name: 'Bola Sepak Adidas', icon: '⚽', quantity: 8, borrowed: 0, description: 'Bola sepak saiz 5 kulit sintetik premium.' },
            { id: 'EQP-TAMP', name: 'Set Jaring & Bola Tampar', icon: '🏐', quantity: 4, borrowed: 0, description: 'Mengandungi 1 bola tampar berserta jaring mudah alih.' },
            { id: 'EQP-PING', name: 'Set Ping Pong (Raket & Bola)', icon: '🏓', quantity: 5, borrowed: 0, description: 'Set mengandungi 2 raket berserta 3 biji bola ping pong.' }
        ];
        localStorage.setItem('psh_sukan_equipment', JSON.stringify(pshEquipment));
    }

    // 4. Bookings register
    const localBookings = localStorage.getItem('psh_sukan_bookings');
    if (localBookings) {
        pshBookings = JSON.parse(localBookings);
    } else {
        pshBookings = [
            {
                id: 'BK-98471',
                user_ic: '050101121234',
                user_name: 'Ahmad Bin Daniel (Pelajar)',
                item_id: 'FAC-DEWAN',
                item_name: 'Dewan Sukan Serbaguna (Indoor)',
                item_type: 'facility',
                quantity: 1,
                booking_date: new Date().toISOString().split('T')[0],
                session: 'Pagi (8:00 AM - 12:00 PM)',
                status: 'Lulus',
                created_at: new Date().toISOString(),
                notes: 'Latihan persediaan MASKOM'
            }
        ];
        localStorage.setItem('psh_sukan_bookings', JSON.stringify(pshBookings));
    }
}

// --------------------------------------------------------------------------
// AUTHENTICATION LOGIC
// --------------------------------------------------------------------------

function selectLoginRole(role) {
    currentRoleMode = role;
    const tabUser = document.getElementById('tab-login-pengguna');
    const tabAdmin = document.getElementById('tab-login-admin');
    const icLabel = document.getElementById('login-id-label');
    const icInput = document.getElementById('login-ic');

    if (role === 'pengguna') {
        tabUser.classList.add('active');
        tabAdmin.classList.remove('active');
        icLabel.textContent = "No. Kad Pengenalan (12 Digit)";
        icInput.placeholder = "Contoh: 050101121234";
    } else {
        tabUser.classList.remove('active');
        tabAdmin.classList.add('active');
        icLabel.textContent = "ID Penyelaras (Username)";
        icInput.placeholder = "Contoh: admin";
    }
    
    // Clear error
    document.getElementById('login-error-msg').style.display = 'none';
}

async function handleLogin(event) {
    event.preventDefault();
    const ic = document.getElementById('login-ic').value.trim();
    const password = document.getElementById('login-password').value;
    const errorMsg = document.getElementById('login-error-msg');

    errorMsg.style.display = 'none';

    if (useMySQL) {
        try {
            const res = await fetch('api.php?action=login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ic, password })
            });
            if (!res.ok) throw new Error("Gagal menyambung ke API Log Masuk");
            const data = await res.json();
            if (data.success) {
                currentUser = data.user;
                onLoginSuccess();
            } else {
                errorMsg.textContent = data.message;
                errorMsg.style.display = 'block';
            }
        } catch (e) {
            console.error(e);
            showToast("API MySQL Ralat! Beralih ke pengesahan luar talian.");
            loginFallback(ic, password, errorMsg);
        }
    } else {
        loginFallback(ic, password, errorMsg);
    }
}

function loginFallback(ic, password, errorMsg) {
    const user = pshUsers.find(u => u.ic === ic && u.password === password);
    if (user) {
        currentUser = { ic: user.ic, name: user.name, role: user.role };
        onLoginSuccess();
    } else {
        errorMsg.textContent = "Ralat! No. KP / Username atau Kata Laluan salah.";
        errorMsg.style.display = 'block';
    }
}

function onLoginSuccess() {
    // Hide login modal overlay
    document.getElementById('login-overlay').style.display = 'none';

    // Populate Sidebar info
    document.getElementById('user-display-name').textContent = currentUser.name;
    document.getElementById('user-display-role').textContent = currentUser.role === 'admin' ? 'Penyelaras JSKK' : 'Pelajar / Staf';
    document.getElementById('avatar-char').textContent = currentUser.name.charAt(0).toUpperCase();

    // Toggle Sidebar display items based on roles
    if (currentUser.role === 'admin') {
        document.querySelectorAll('.role-link-pengguna').forEach(l => l.style.display = 'none');
        document.querySelectorAll('.role-link-admin').forEach(l => l.style.display = 'block');
        switchTab('admin-dashboard');
    } else {
        document.querySelectorAll('.role-link-pengguna').forEach(l => l.style.display = 'block');
        document.querySelectorAll('.role-link-admin').forEach(l => l.style.display = 'none');
        switchTab('dashboard-pengguna');
    }

    showToast(`Selamat datang, ${currentUser.name}! 👋`);
}

function handleLogout() {
    currentUser = null;
    document.getElementById('login-overlay').style.display = 'flex';
    document.getElementById('login-form').reset();
    showToast("Berjaya log keluar.");
}

// --------------------------------------------------------------------------
// VIEW ROUTING
// --------------------------------------------------------------------------

function switchTab(tabId) {
    // Clear active classes in sidebar links
    document.querySelectorAll('.sidebar .nav-links .nav-item').forEach(li => {
        li.classList.remove('active');
    });

    // Toggle active view
    document.querySelectorAll('.tab-view').forEach(view => {
        view.classList.remove('active');
    });

    const activeView = document.getElementById(`view-${tabId}`);
    if (activeView) activeView.classList.add('active');

    const sidebarLink = document.getElementById(`nav-${tabId}`);
    if (sidebarLink) sidebarLink.classList.add('active');

    // Update Header texts dynamically
    const headerTitle = document.getElementById('header-title');
    const headerSubtitle = document.getElementById('header-subtitle');

    if (tabId === 'dashboard-pengguna') {
        headerTitle.textContent = "Papan Pemuka JSKK";
        headerSubtitle.textContent = "Laman utama sistem tempahan sukan Politeknik Sandakan Sabah.";
        renderUserDashboard();
    } else if (tabId === 'tempahan-kemudahan') {
        headerTitle.textContent = "Tempahan Gelanggang & Kemudahan";
        headerSubtitle.textContent = "Semak status dan tempah gelanggang sukan Politeknik Sandakan Sabah.";
        renderFacilities();
    } else if (tabId === 'tempahan-peralatan') {
        headerTitle.textContent = "Pinjaman Peralatan Sukan";
        headerSubtitle.textContent = "Pinjam peralatan sukan untuk latihan atau riadah.";
        renderEquipment();
    } else if (tabId === 'sejarah-pengguna') {
        headerTitle.textContent = "Rekod & Sejarah Tempahan";
        headerSubtitle.textContent = "Lihat status kelulusan semasa dan cetak slip permohonan.";
        renderUserBookings();
    } else if (tabId === 'admin-dashboard') {
        headerTitle.textContent = "Penyelaras JSKK Dashboard";
        headerSubtitle.textContent = "Senarai permohonan tempahan menunggu keputusan kelulusan.";
        renderAdminDashboard();
    } else if (tabId === 'admin-inventori') {
        headerTitle.textContent = "Selenggara Alatan & Stok";
        headerSubtitle.textContent = "Pengurusan had kuantiti inventori peralatan sukan.";
        renderAdminInventory();
    }
}

// --------------------------------------------------------------------------
// RENDERING ENGINES
// --------------------------------------------------------------------------

// 1. Render user dashboard statistics
function renderUserDashboard() {
    const activeCount = pshBookings.filter(b => b.user_ic === currentUser.ic && (b.status === 'Menunggu' || b.status === 'Lulus')).length;
    const itemsBorrowed = pshBookings
        .filter(b => b.user_ic === currentUser.ic && b.item_type === 'equipment' && b.status === 'Lulus')
        .reduce((sum, b) => sum + parseInt(b.quantity), 0);

    document.getElementById('user-stat-active').textContent = activeCount;
    document.getElementById('user-stat-items').textContent = itemsBorrowed;
}

// 2. Render sports facilities catalog
function renderFacilities() {
    const container = document.getElementById('facilities-catalog');
    if (!container) return;
    container.innerHTML = '';

    pshFacilities.forEach(f => {
        const card = document.createElement('div');
        card.className = 'catalog-card';

        const isAvailable = f.status === 'Tersedia';

        card.innerHTML = `
            <div class="catalog-card-header">
                <span class="catalog-card-icon">${f.icon}</span>
                <span class="status-pill ${isAvailable ? 'status-lulus' : 'status-tolak'}">
                    ${f.status}
                </span>
            </div>
            <div class="catalog-card-body">
                <h3 class="catalog-title">${f.name}</h3>
                <p class="catalog-description">${f.description}</p>
                <div class="catalog-qty-bar" style="color: var(--body-muted); font-size: 0.75rem;">
                    Identifikasi: <strong>${f.id}</strong>
                </div>
            </div>
            <div class="catalog-card-footer">
                <button class="btn btn-primary" onclick="openBookingModal('${f.id}', 'facility')" ${!isAvailable ? 'disabled' : ''}>
                    Tempah Kemudahan ⚽
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// 3. Render sports equipment catalog
function renderEquipment() {
    const container = document.getElementById('equipment-catalog');
    if (!container) return;
    container.innerHTML = '';

    pshEquipment.forEach(eq => {
        const card = document.createElement('div');
        card.className = 'catalog-card';

        const availableQty = eq.quantity - eq.borrowed;
        const progressPercentage = (availableQty / eq.quantity) * 100;
        
        let barClass = '';
        if (progressPercentage <= 20) barClass = 'critical';
        else if (progressPercentage <= 50) barClass = 'warning';

        const outOfStock = availableQty <= 0;

        card.innerHTML = `
            <div class="catalog-card-header">
                <span class="catalog-card-icon">${eq.icon}</span>
                <span class="status-pill ${outOfStock ? 'status-tolak' : 'status-lulus'}">
                    ${outOfStock ? 'Habis Stok' : 'Ada Stok'}
                </span>
            </div>
            <div class="catalog-card-body">
                <h3 class="catalog-title">${eq.name}</h3>
                <p class="catalog-description">${eq.description}</p>
                
                <div class="catalog-qty-bar">
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                        <span>Tersedia:</span>
                        <span>${availableQty} / ${eq.quantity}</span>
                    </div>
                    <div class="qty-track">
                        <div class="qty-fill ${barClass}" style="width: ${progressPercentage}%"></div>
                    </div>
                </div>
            </div>
            <div class="catalog-card-footer">
                <button class="btn btn-primary" onclick="openBookingModal('${eq.id}', 'equipment')" ${outOfStock ? 'disabled' : ''}>
                    Pinjam Peralatan 🏸
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// 4. Render student/staff personal history table
function renderUserBookings() {
    const tbody = document.getElementById('user-bookings-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const myBookings = pshBookings.filter(b => b.user_ic === currentUser.ic);

    if (myBookings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 32px; color: var(--body-muted);">
                    Tiada rekod tempahan ditemui. Sila lakukan tempahan di bahagian menu kiri.
                </td>
            </tr>
        `;
        return;
    }

    myBookings.forEach((b, index) => {
        const tr = document.createElement('tr');
        
        // Bil
        const tdBil = document.createElement('td');
        tdBil.style.textAlign = 'center';
        tdBil.textContent = index + 1;
        tr.appendChild(tdBil);

        // ID Tempahan
        const tdID = document.createElement('td');
        tdID.style.fontWeight = '700';
        tdID.textContent = b.id;
        tr.appendChild(tdID);

        // Item Name
        const tdItem = document.createElement('td');
        tdItem.innerHTML = `<div style="font-weight:600;">${b.item_name}</div><div style="font-size:0.75rem; color:var(--body-muted);">Jenis: ${b.item_type === 'facility' ? 'Kemudahan' : 'Alatan (' + b.quantity + ' Unit)'}</div>`;
        tr.appendChild(tdItem);

        // Date
        const tdDate = document.createElement('td');
        tdDate.textContent = b.booking_date;
        tr.appendChild(tdDate);

        // Session
        const tdSession = document.createElement('td');
        tdSession.textContent = b.session;
        tr.appendChild(tdSession);

        // Status
        const tdStatus = document.createElement('td');
        tdStatus.style.textAlign = 'center';
        let badgeClass = 'status-menunggu';
        if (b.status === 'Lulus') badgeClass = 'status-lulus';
        else if (b.status === 'Tolak') badgeClass = 'status-tolak';
        else if (b.status === 'Selesai') badgeClass = 'status-selesai';

        tdStatus.innerHTML = `<span class="status-pill ${badgeClass}">${b.status}</span>`;
        tr.appendChild(tdStatus);

        // Action
        const tdAction = document.createElement('td');
        tdAction.style.textAlign = 'center';
        
        const canPrint = b.status === 'Lulus';
        tdAction.innerHTML = `
            <button class="btn btn-secondary" onclick="openReceiptModal('${b.id}')" style="padding: 6px 12px; font-size: 11px;" ${!canPrint ? 'disabled' : ''}>
                Lihat Slip 👁️
            </button>
        `;
        tr.appendChild(tdAction);

        tbody.appendChild(tr);
    });
}

// 5. Render Penyelaras Dashboard (Admin list)
function renderAdminDashboard() {
    const pendingCount = pshBookings.filter(b => b.status === 'Menunggu').length;
    const activeCount = pshBookings.filter(b => b.status === 'Lulus').length;
    
    // Approval Rate Calculation
    const totalProcessed = pshBookings.filter(b => b.status === 'Lulus' || b.status === 'Tolak').length;
    const totalApproved = pshBookings.filter(b => b.status === 'Lulus').length;
    const rate = totalProcessed > 0 ? Math.round((totalApproved / totalProcessed) * 100) : 100;

    document.getElementById('admin-stat-pending').textContent = pendingCount;
    document.getElementById('admin-stat-active').textContent = activeCount;
    document.getElementById('admin-stat-rate').textContent = `${rate}%`;

    const tbody = document.getElementById('admin-bookings-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (pshBookings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 32px; color: var(--body-muted);">
                    Tiada permohonan tempahan dalam pangkalan data.
                </td>
            </tr>
        `;
        return;
    }

    pshBookings.forEach((b, index) => {
        const tr = document.createElement('tr');
        
        // Bil
        const tdBil = document.createElement('td');
        tdBil.style.textAlign = 'center';
        tdBil.textContent = index + 1;
        tr.appendChild(tdBil);

        // Applicant
        const tdUser = document.createElement('td');
        tdUser.innerHTML = `<div style="font-weight:600;">${b.user_name}</div><div style="font-size:0.75rem; color:var(--body-muted);">KP: ${b.user_ic}</div>`;
        tr.appendChild(tdUser);

        // Booking details
        const tdDetails = document.createElement('td');
        tdDetails.innerHTML = `<div style="font-weight:700; color:var(--primary-red);">${b.item_name}</div><div style="font-size:0.75rem; color:var(--body-muted);">ID: ${b.id} &nbsp;|&nbsp; Keterangan: "${b.notes}"</div>`;
        tr.appendChild(tdDetails);

        // Date/Session
        const tdDate = document.createElement('td');
        tdDate.innerHTML = `<div>${b.booking_date}</div><div style="font-size:0.72rem; color:var(--body-muted);">${b.session}</div>`;
        tr.appendChild(tdDate);

        // Status
        const tdStatus = document.createElement('td');
        tdStatus.style.textAlign = 'center';
        let badgeClass = 'status-menunggu';
        if (b.status === 'Lulus') badgeClass = 'status-lulus';
        else if (b.status === 'Tolak') badgeClass = 'status-tolak';
        else if (b.status === 'Selesai') badgeClass = 'status-selesai';

        tdStatus.innerHTML = `<span class="status-pill ${badgeClass}">${b.status}</span>`;
        tr.appendChild(tdStatus);

        // Action Buttons
        const tdAction = document.createElement('td');
        tdAction.style.textAlign = 'center';
        
        if (b.status === 'Menunggu') {
            tdAction.innerHTML = `
                <div style="display:flex; gap:6px; justify-content:center;">
                    <button class="btn btn-secondary" onclick="updateBookingStatus('${b.id}', 'Lulus')" style="padding:6px 10px; font-size:11px; background:var(--success-green-soft); color:var(--success-green); border-color:var(--success-green);">
                        Lulus ✔
                    </button>
                    <button class="btn btn-secondary" onclick="updateBookingStatus('${b.id}', 'Tolak')" style="padding:6px 10px; font-size:11px; background:var(--danger-orange-soft); color:var(--danger-orange); border-color:var(--danger-orange);">
                        Tolak ✖
                    </button>
                </div>
            `;
        } else if (b.status === 'Lulus') {
            tdAction.innerHTML = `
                <button class="btn btn-secondary" onclick="updateBookingStatus('${b.id}', 'Selesai')" style="padding:6px 12px; font-size:11px; width:100%; justify-content:center;">
                    Selesai/Pulang 🔄
                </button>
            `;
        } else {
            tdAction.innerHTML = `<span style="color:var(--body-muted); font-size:0.75rem;">Selesai Diproses</span>`;
        }

        tr.appendChild(tdAction);
        tbody.appendChild(tr);
    });
}

// 6. Render admin inventory management table
function renderAdminInventory() {
    const tbody = document.getElementById('admin-inventory-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    let index = 0;

    // Combine Facilities and Equipment
    pshFacilities.forEach(f => {
        const tr = document.createElement('tr');
        
        // Bil
        const tdBil = document.createElement('td');
        tdBil.style.textAlign = 'center';
        tdBil.textContent = ++index;
        tr.appendChild(tdBil);

        // ID
        const tdID = document.createElement('td');
        tdID.style.fontWeight = '700';
        tdID.textContent = f.id;
        tr.appendChild(tdID);

        // Type
        const tdType = document.createElement('td');
        tdType.style.textAlign = 'center';
        tdType.innerHTML = `<span style="background:#e0f2fe; color:#0369a1; padding:4px 8px; border-radius:4px; font-size:10px; font-weight:700;">Kemudahan</span>`;
        tr.appendChild(tdType);

        // Name
        const tdName = document.createElement('td');
        tdName.innerHTML = `<div style="font-weight:600;">${f.name}</div><div style="font-size:0.75rem; color:var(--body-muted);">${f.description}</div>`;
        tr.appendChild(tdName);

        // Capacity / Stock
        const tdStock = document.createElement('td');
        tdStock.style.textAlign = 'center';
        tdStock.textContent = f.status === 'Tersedia' ? 'Tersedia' : 'Diselenggara';
        tr.appendChild(tdStock);

        // Borrowed
        const tdBorrowed = document.createElement('td');
        tdBorrowed.style.textAlign = 'center';
        tdBorrowed.textContent = '-';
        tr.appendChild(tdBorrowed);

        // Update action
        const tdAction = document.createElement('td');
        tdAction.style.textAlign = 'center';
        tdAction.innerHTML = `
            <button class="btn btn-secondary" onclick="openInventoryModal('${f.id}', 'facility')" style="padding: 6px 12px; font-size: 11px;">
                Urus
            </button>
        `;
        tr.appendChild(tdAction);

        tbody.appendChild(tr);
    });

    pshEquipment.forEach(eq => {
        const tr = document.createElement('tr');
        
        // Bil
        const tdBil = document.createElement('td');
        tdBil.style.textAlign = 'center';
        tdBil.textContent = ++index;
        tr.appendChild(tdBil);

        // ID
        const tdID = document.createElement('td');
        tdID.style.fontWeight = '700';
        tdID.textContent = eq.id;
        tr.appendChild(tdID);

        // Type
        const tdType = document.createElement('td');
        tdType.style.textAlign = 'center';
        tdType.innerHTML = `<span style="background:#fef3c7; color:#b45309; padding:4px 8px; border-radius:4px; font-size:10px; font-weight:700;">Alatan</span>`;
        tr.appendChild(tdType);

        // Name
        const tdName = document.createElement('td');
        tdName.innerHTML = `<div style="font-weight:600;">${eq.name}</div><div style="font-size:0.75rem; color:var(--body-muted);">${eq.description}</div>`;
        tr.appendChild(tdName);

        // Capacity / Stock
        const tdStock = document.createElement('td');
        tdStock.style.textAlign = 'center';
        tdStock.textContent = `${eq.quantity} Unit`;
        tr.appendChild(tdStock);

        // Borrowed
        const tdBorrowed = document.createElement('td');
        tdBorrowed.style.textAlign = 'center';
        tdBorrowed.textContent = `${eq.borrowed} Unit`;
        tr.appendChild(tdBorrowed);

        // Update action
        const tdAction = document.createElement('td');
        tdAction.style.textAlign = 'center';
        tdAction.innerHTML = `
            <button class="btn btn-secondary" onclick="openInventoryModal('${eq.id}', 'equipment')" style="padding: 6px 12px; font-size: 11px;">
                Urus
            </button>
        `;
        tr.appendChild(tdAction);

        tbody.appendChild(tr);
    });
}

// --------------------------------------------------------------------------
// MODAL CONTROLLERS & ACTIONS
// --------------------------------------------------------------------------

// 1. Create booking Modal handlers
function openBookingModal(itemId, itemType) {
    const item = itemType === 'facility' 
        ? pshFacilities.find(f => f.id === itemId) 
        : pshEquipment.find(e => e.id === itemId);

    if (!item) return;

    document.getElementById('booking-item-id').value = itemId;
    document.getElementById('booking-item-type').value = itemType;
    document.getElementById('booking-item-name').value = item.name;

    const qtyContainer = document.getElementById('qty-field-container');
    const qtyLimitNotice = document.getElementById('qty-limit-notice');
    const qtyInput = document.getElementById('booking-qty');

    if (itemType === 'facility') {
        qtyContainer.style.display = 'none';
        qtyInput.value = 1;
    } else {
        qtyContainer.style.display = 'block';
        const maxLimit = item.quantity - item.borrowed;
        qtyInput.max = maxLimit;
        qtyInput.value = 1;
        qtyLimitNotice.textContent = `Baki stok semasa yang boleh dipinjam: ${maxLimit} Unit.`;
    }

    document.getElementById('booking-form').reset();
    document.getElementById('booking-item-id').value = itemId;
    document.getElementById('booking-item-type').value = itemType;
    document.getElementById('booking-item-name').value = item.name;

    document.getElementById('booking-modal').classList.add('active');
}

function closeBookingModal() {
    document.getElementById('booking-modal').classList.remove('active');
}

async function saveNewBooking(event) {
    event.preventDefault();

    const itemId = document.getElementById('booking-item-id').value;
    const itemType = document.getElementById('booking-item-type').value;
    const itemName = document.getElementById('booking-item-name').value;
    const qty = parseInt(document.getElementById('booking-qty').value);
    const date = document.getElementById('booking-date').value;
    const session = document.getElementById('booking-session').value;
    const notes = document.getElementById('booking-notes').value.trim();

    if (!date) {
        showToast("Sila pilih tarikh tempahan yang sah.");
        return;
    }

    const bookingId = 'BK-' + Math.floor(10000 + Math.random() * 90000);

    const newBookingObj = {
        id: bookingId,
        user_ic: currentUser.ic,
        user_name: currentUser.name,
        item_id: itemId,
        item_name: itemName,
        item_type: itemType,
        quantity: qty,
        booking_date: date,
        session: session,
        notes: notes
    };

    if (useMySQL) {
        try {
            const res = await fetch('api.php?action=add_booking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newBookingObj)
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            
            if (data.success) {
                showToast(`Permohonan ${bookingId} berjaya dihantar ke database!`);
                closeBookingModal();
                await loadDataStore();
                switchTab('sejarah-pengguna');
            } else {
                showToast(`Gagal: ${data.message}`);
            }
        } catch (e) {
            console.error(e);
            showToast("Ralat menyimpan tempahan ke MySQL. Sila cuba lagi.");
        }
    } else {
        // LocalStorage logic
        if (itemType === 'facility') {
            const doubleCheck = pshBookings.some(b => b.item_id === itemId && b.booking_date === date && b.session === session && (b.status === 'Menunggu' || b.status === 'Lulus'));
            if (doubleCheck) {
                showToast("Ralat! Kemudahan telah pun ditempah pada tarikh dan sesi tersebut.");
                return;
            }
        } else {
            // Equipment check stock limits
            const eqItem = pshEquipment.find(e => e.id === itemId);
            if (eqItem && (eqItem.quantity - eqItem.borrowed) < qty) {
                showToast("Ralat! Kuantiti dipinta melebihi stok yang tersedia.");
                return;
            }
        }

        newBookingObj.status = 'Menunggu';
        newBookingObj.created_at = new Date().toISOString();

        pshBookings.unshift(newBookingObj);
        localStorage.setItem('psh_sukan_bookings', JSON.stringify(pshBookings));

        showToast(`Permohonan ${bookingId} berjaya disimpan di LocalStorage!`);
        closeBookingModal();
        switchTab('sejarah-pengguna');
    }
}

// 2. Admin approval handlers
async function updateBookingStatus(bookingId, newStatus) {
    if (useMySQL) {
        try {
            const res = await fetch('api.php?action=update_booking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: bookingId, status: newStatus })
            });
            if (!res.ok) throw new Error();
            
            showToast(`Tempahan ${bookingId} ditukar status kepada: ${newStatus}`);
            await loadDataStore();
            renderAdminDashboard();
        } catch (e) {
            console.error(e);
            showToast("Gagal menukar status tempahan di MySQL.");
        }
    } else {
        // LocalStorage update
        const bk = pshBookings.find(b => b.id === bookingId);
        if (!bk) return;

        const oldStatus = bk.status;

        // Apply changes
        bk.status = newStatus;

        if (bk.item_type === 'equipment') {
            const eq = pshEquipment.find(e => e.id === bk.item_id);
            if (eq) {
                if (newStatus === 'Lulus' && oldStatus !== 'Lulus') {
                    eq.borrowed += bk.quantity;
                } else if (newStatus === 'Selesai' && oldStatus === 'Lulus') {
                    eq.borrowed = Math.max(0, eq.borrowed - bk.quantity);
                } else if (newStatus === 'Tolak' && oldStatus === 'Lulus') {
                    eq.borrowed = Math.max(0, eq.borrowed - bk.quantity);
                }
                localStorage.setItem('psh_sukan_equipment', JSON.stringify(pshEquipment));
            }
        }

        localStorage.setItem('psh_sukan_bookings', JSON.stringify(pshBookings));
        showToast(`Tempahan ${bookingId} ditukar status kepada: ${newStatus}`);
        renderAdminDashboard();
    }
}

// 3. Admin inventory edit handlers
function openInventoryModal(itemId, itemType) {
    document.getElementById('inventory-item-id').value = itemId;

    const qtyInput = document.getElementById('inventory-qty');
    const qtyLabel = document.getElementById('inventory-qty-label');
    const descInput = document.getElementById('inventory-desc');

    if (itemType === 'facility') {
        const item = pshFacilities.find(f => f.id === itemId);
        document.getElementById('inventory-item-name').value = item.name;
        descInput.value = item.description;
        
        // For facility, quantity represents Status (1 for Tersedia, 0 for Penyelenggaraan)
        qtyLabel.textContent = "Status Kemudahan (1=Tersedia, 0=Penyelenggaraan)";
        qtyInput.min = 0;
        qtyInput.max = 1;
        qtyInput.value = item.status === 'Tersedia' ? 1 : 0;
    } else {
        const item = pshEquipment.find(e => e.id === itemId);
        document.getElementById('inventory-item-name').value = item.name;
        descInput.value = item.description;
        
        qtyLabel.textContent = "Kuantiti Unit Stok Maksimum";
        qtyInput.min = 1;
        qtyInput.max = 100;
        qtyInput.value = item.quantity;
    }

    document.getElementById('inventory-modal').classList.add('active');
}

function closeInventoryModal() {
    document.getElementById('inventory-modal').classList.remove('active');
}

async function saveInventoryEdit(event) {
    event.preventDefault();
    const itemId = document.getElementById('inventory-item-id').value;
    const qtyVal = parseInt(document.getElementById('inventory-qty').value);
    const descVal = document.getElementById('inventory-desc').value.trim();

    const isFacility = itemId.startsWith('FAC');

    if (useMySQL) {
        try {
            // Note: If using MySQL, we update database
            if (isFacility) {
                // Not fully implemented on simple PHP to update facilities, but handles gracefully
                showToast("Fungsi MySQL terhad untuk inventori. Beralih mod.");
            } else {
                const res = await fetch('api.php?action=update_equipment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: itemId, quantity: qtyVal, description: descVal })
                });
                if (!res.ok) throw new Error();
                showToast("Inventori alatan berjaya dikemaskini di MySQL!");
            }
            closeInventoryModal();
            await loadDataStore();
            renderAdminInventory();
        } catch (e) {
            console.error(e);
            showToast("Ralat mengemaskini data MySQL.");
        }
    } else {
        if (isFacility) {
            const f = pshFacilities.find(x => x.id === itemId);
            if (f) {
                f.status = qtyVal === 1 ? 'Tersedia' : 'Penyenggaraan';
                f.description = descVal;
                localStorage.setItem('psh_sukan_facilities', JSON.stringify(pshFacilities));
            }
        } else {
            const eq = pshEquipment.find(x => x.id === itemId);
            if (eq) {
                eq.quantity = qtyVal;
                eq.description = descVal;
                localStorage.setItem('psh_sukan_equipment', JSON.stringify(pshEquipment));
            }
        }
        showToast("Inventori berjaya dikemaskini dalam LocalStorage!");
        closeInventoryModal();
        renderAdminInventory();
    }
}

// 4. Receipt slips viewer
function openReceiptModal(bookingId) {
    const bk = pshBookings.find(b => b.id === bookingId);
    if (!bk) return;

    activeReceiptId = bookingId;

    const receiptBox = document.getElementById('receipt-preview-content');
    
    // Receipt formatting matching traditional courier slips
    receiptBox.innerHTML = `
=============================================
         SLIP KELULUSAN TEMPAHAN JSKK
          POLITEKNIK SANDAKAN SABAH
=============================================
ID TEMPAHAN  : ${bk.id}
TARIKH SLIP  : ${new Date(bk.created_at || Date.now()).toLocaleDateString('ms-MY')}
---------------------------------------------
PEMOHON      : ${bk.user_name}
NO. KP       : ${bk.user_ic}
PERALATAN/   : ${bk.item_name}
KUANTITI     : ${bk.quantity} Unit
TARIKH TEMPAH: ${bk.booking_date}
SESI PINJAMAN: ${bk.session}
STATUS       : ${bk.status} (DILULUSKAN)
---------------------------------------------
* Sila tunjukkan slip kelulusan digital ini 
  atau cetak bagi tujuan verifikasi stor sukan.
* Pastikan alatan dipulangkan tepat pada masanya.
=============================================
    [ KOD QR SAMPLE VERIFIKASI JSKK ]
              [📷 QR CODE]
=============================================
    `;

    document.getElementById('receipt-modal').classList.add('active');
}

function closeReceiptModal() {
    document.getElementById('receipt-modal').classList.remove('active');
}

function printReceipt() {
    const printWindow = window.open('', '_blank');
    const content = document.getElementById('receipt-preview-content').innerHTML;

    printWindow.document.write(`
        <html>
        <head>
            <title>Cetak Slip Tempahan JSKK</title>
            <style>
                body { font-family: monospace; white-space: pre-wrap; padding: 20px; color: #000; line-height: 1.5; }
            </style>
        </head>
        <body>
            ${content}
            <script>
                window.onload = function() { window.print(); window.close(); }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// 5. System Reset database action
async function resetSystemData() {
    if (!confirm("Adakah anda benar-benar ingin menetapkan semula database sukan? Semua rekod tempahan pelajar akan dipadam sepenuhnya.")) return;

    if (useMySQL) {
        try {
            const res = await fetch('api.php?action=reset_database', { method: 'POST' });
            if (!res.ok) throw new Error();
            showToast("Pangkalan data MySQL berjaya diset semula!");
            await loadDataStore();
            renderAdminDashboard();
        } catch (e) {
            console.error(e);
            showToast("Ralat menetapkan semula MySQL database.");
        }
    } else {
        localStorage.removeItem('psh_sukan_users');
        localStorage.removeItem('psh_sukan_facilities');
        localStorage.removeItem('psh_sukan_equipment');
        localStorage.removeItem('psh_sukan_bookings');
        
        initialiseLocalStorage();
        showToast("LocalStorage berjaya diset semula ke data sampel!");
        renderAdminDashboard();
    }
}

// --------------------------------------------------------------------------
// UTILITIES
// --------------------------------------------------------------------------

function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>🔔</span> <span>${message}</span>`;
    
    container.appendChild(toast);

    // Auto-remove toast after 4.5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4200);
}
