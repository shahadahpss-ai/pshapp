// Portal PSH State Variables
let pshCourses = [];
let pshGallery = [];
let pshRegistrations = []; 
let pshEvaluations = []; 

// Login / Access Control Variables
let currentUserRole = null; // 'pengguna', 'urusetia', 'admin'
let currentUserIC = null;   // Stored for 'pengguna'
let activeLoginRole = 'pengguna'; // Selected login tab role

// UI State Variables
let activeCourse = null; // Target course for registration
let uploadedReceiptBase64 = null; // Base64 data of receipt
let uploadedReceiptName = null; // Filename of receipt
let activeAdminCourseId = 'Semua'; // Selected course sub-tab in Urusetia registrations
let activeReportCourseId = null; // Target course for report writing

// Database Connection state
let useMySQL = false;

// 1. Initial Load & Setup
document.addEventListener('DOMContentLoaded', async () => {
  await initialiseDatabase();
  
  // Set default view on login form
  selectLoginRole('pengguna', document.querySelector('.login-tab'));
});

async function checkBackendConnection() {
  try {
    const res = await fetch('api.php?action=status');
    const data = await res.json();
    if (data.databaseConnected) {
      useMySQL = true;
      console.log("● Sambungan MySQL Aktif via PHP. Menggunakan database.");
    } else {
      useMySQL = false;
      console.warn("● Sambungan MySQL Mati. Menggunakan mod local storage fallback.");
    }
  } catch (e) {
    useMySQL = false;
    console.warn("● Fail PHP backend offline. Menggunakan mod local storage fallback.");
  }
  updateConnectionModeBadge();
}

function updateConnectionModeBadge() {
  const badge = document.getElementById('db-connection-badge');
  if (!badge) return;
  if (useMySQL) {
    badge.innerHTML = `<span style="width: 8px; height: 8px; border-radius: 50%; background: var(--brand); display: inline-block; animation: pulse 2s infinite;"></span> <span style="color: var(--brand); font-weight: 700;">Mod: MySQL Database</span>`;
  } else {
    badge.innerHTML = `<span style="width: 8px; height: 8px; border-radius: 50%; background: #E2B93B; display: inline-block;"></span> <span style="color: #E2B93B; font-weight: 700;">Mod: LocalStorage</span>`;
  }
}

async function loadDatabase() {
  if (useMySQL) {
    try {
      const coursesRes = await fetch('api.php?action=get_courses');
      pshCourses = await coursesRes.json();

      const regsRes = await fetch('api.php?action=get_registrations');
      pshRegistrations = await regsRes.json();

      const evalsRes = await fetch('api.php?action=get_evaluations');
      pshEvaluations = await evalsRes.json();
      return;
    } catch (e) {
      console.error("Ralat membaca pangkalan data pusat via PHP, fallback ke LocalStorage:", e);
      useMySQL = false;
      updateConnectionModeBadge();
    }
  }

  // Fallback to LocalStorage
  const localCourses = localStorage.getItem('psh_courses');
  const localRegistrations = localStorage.getItem('psh_registrations');
  const localEvaluations = localStorage.getItem('psh_evaluations');

  pshEvaluations = localEvaluations ? JSON.parse(localEvaluations) : [];

  if (localCourses) {
    pshCourses = JSON.parse(localCourses);
  } else {
    pshCourses = INITIAL_PSH_COURSES.map(c => ({
      ...c,
      status: (c.id === 'MAT-01' || c.id === 'SCI-01') ? "Telah Dilaksanakan" : "Belum Dilaksanakan",
      laporan: (c.id === 'MAT-01' || c.id === 'SCI-01') ? {
        ringkasan: "Kursus telah dilaksanakan dengan kehadiran penuh dan jayanya.",
        feedback: "Peserta memberikan maklum balas yang amat positif berkenaan isi kandungan.",
        cadangan: "Kemudahan dewan kuliah / makmal perlu dipertingkatkan lagi.",
        tarikhLaporan: new Date().toLocaleDateString('ms-MY')
      } : null
    }));
    localStorage.setItem('psh_courses', JSON.stringify(pshCourses));
  }

  if (localRegistrations) {
    pshRegistrations = JSON.parse(localRegistrations);
  } else {
    const seedStudents = [
      { nama: 'Mohd Azlan bin Awang', ic: '080412125131', courseId: 'MAT-01', courseName: 'Kursus Analisis Data dengan Excel & Statistik Asas' },
      { nama: 'Dayang Nurul binti Mohd', ic: '090822475246', courseId: 'MAT-02', courseName: 'Kursus Pengiraan Cukai Pendapatan & Kewangan Peribadi' },
      { nama: 'Jolius bin Justin', ic: '071015125353', courseId: 'SCI-01', courseName: 'Kursus Bioteknologi Rumah: Pembuatan Sabun Organik' },
      { nama: 'Fiona binti Gunting', ic: '081203495464', courseId: 'SCI-02', courseName: 'Kursus Asas Sistem Penapis Air Mesra Alam' },
      { nama: 'Wong Jun Jie', ic: '100214125575', courseId: 'COMP-01', courseName: 'Kursus Asas Pembangunan Laman Web HTML/CSS' },
      { nama: 'Siti Aishah binti Abdullah', ic: '090530485682', courseId: 'COMP-02', courseName: 'Kursus Keselamatan Siber & Perlindungan Data Peribadi' },
      { nama: 'Elvin bin Mojikon', ic: '080618125791', courseId: 'MAT-01', courseName: 'Kursus Analisis Data dengan Excel & Statistik Asas' },
      { nama: 'Sherry binti Kurup', ic: '091125475808', courseId: 'MAT-02', courseName: 'Kursus Pengiraan Cukai Pendapatan & Kewangan Peribadi' },
      { nama: 'Lee Kah Seng', ic: '070405495913', courseId: 'SCI-01', courseName: 'Kursus Bioteknologi Rumah: Pembuatan Sabun Organik' },
      { nama: 'Wong Qi Yi', ic: '080312126020', courseId: 'SCI-02', courseName: 'Kursus Asas Sistem Penapis Air Mesra Alam' }
    ];
    
    const banks = ['Maybank', 'CIMB Bank', 'Bank Islam', 'RHB Bank'];
    const dummyReceipt = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    
    pshRegistrations = seedStudents.map((s, idx) => ({
      id: 'REG-' + (1719700000 + idx),
      courseId: s.courseId,
      courseName: s.courseName,
      nama: s.nama,
      ic: s.ic,
      tel: '01' + (2 + (idx % 8)) + '-' + (3456000 + idx),
      emel: s.nama.toLowerCase().replace(/[^a-z]/g, '') + '@gmail.com',
      bank: banks[idx % banks.length],
      receiptName: 'resit_' + s.courseId.toLowerCase() + '_' + idx + '.png',
      receiptData: dummyReceipt,
      tarikhDaftar: new Date().toISOString()
    }));
    
    localStorage.setItem('psh_registrations', JSON.stringify(pshRegistrations));
    
    // Update local course capacities
    pshRegistrations.forEach(r => {
      const cIdx = pshCourses.findIndex(c => c.id === r.courseId);
      if (cIdx !== -1) {
        pshCourses[cIdx].peserta++;
      }
    });
    localStorage.setItem('psh_courses', JSON.stringify(pshCourses));
  }
}

// Database Initialization & Migration
async function initialiseDatabase() {
  // Check MySQL Server connection
  await checkBackendConnection();

  // Load central or local data
  await loadDatabase();

  const localGallery = localStorage.getItem('psh_gallery');
  // Load Gallery
  if (localGallery) {
    pshGallery = JSON.parse(localGallery);
  } else {
    pshGallery = INITIAL_PSH_GALLERY;
    localStorage.setItem('psh_gallery', JSON.stringify(pshGallery));
  }

  // Force migration check for local state
  if (!useMySQL) {
    let needsUpdate = false;
    pshCourses.forEach(c => {
      if (c.urusetia === undefined) {
        const match = INITIAL_PSH_COURSES.find(initC => initC.id === c.id);
        c.urusetia = match ? match.urusetia : "Pegawai JMSK";
        needsUpdate = true;
      }
      if (c.status === undefined) {
        c.status = "Belum Dilaksanakan";
        needsUpdate = true;
      }
      if (c.laporan === undefined) {
        c.laporan = null;
        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      localStorage.setItem('psh_courses', JSON.stringify(pshCourses));
    }
  }
}

// 2. Login Screen Navigation & Submission
function toggleLoginRegister(showLogin) {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const verifyForm = document.getElementById('forgot-verify-form');
  const resetForm = document.getElementById('forgot-reset-form');
  const loginTip = document.getElementById('login-tip');
  
  if (showLogin) {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    verifyForm.style.display = 'none';
    resetForm.style.display = 'none';
    loginTip.style.display = 'block';
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    verifyForm.style.display = 'none';
    resetForm.style.display = 'none';
    loginTip.style.display = 'none';
  }
}

function toggleForgotPassword(showForgot) {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const verifyForm = document.getElementById('forgot-verify-form');
  const resetForm = document.getElementById('forgot-reset-form');
  const loginTip = document.getElementById('login-tip');
  
  if (showForgot) {
    loginForm.style.display = 'none';
    registerForm.style.display = 'none';
    verifyForm.style.display = 'block';
    resetForm.style.display = 'none';
    loginTip.style.display = 'none';
  } else {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    verifyForm.style.display = 'none';
    resetForm.style.display = 'none';
    loginTip.style.display = 'block';
  }
}

function selectLoginRole(role, button) {
  activeLoginRole = role;

  // Toggle active tab class
  const tabs = document.querySelectorAll('.login-tab');
  tabs.forEach(t => t.classList.remove('active'));
  button.classList.add('active');

  // Toggle to login form view first
  toggleLoginRegister(true);
  toggleForgotPassword(false);

  // Fields and tip references
  const groupIC = document.getElementById('login-group-ic');
  const groupUsername = document.getElementById('login-group-username');
  const groupPassword = document.getElementById('login-group-password');
  const loginTip = document.getElementById('login-tip');
  const regLink = document.getElementById('login-register-link-container');
  const forgotLink = document.getElementById('login-forgot-link');

  // Adjust display inputs and help text based on selected role
  if (role === 'pengguna') {
    groupIC.style.display = 'block';
    groupUsername.style.display = 'none';
    groupPassword.style.display = 'block';
    regLink.style.display = 'block';
    forgotLink.style.display = 'inline';
    loginTip.innerHTML = `<strong>Tip Log Masuk Pengguna:</strong><br>Masukkan Nombor Kad Pengenalan anda (12 digit) dan kata laluan untuk log masuk. Sila daftar akaun terlebih dahulu jika anda adalah pengguna baharu.`;
  } else {
    groupIC.style.display = 'none';
    groupUsername.style.display = 'block';
    groupPassword.style.display = 'block';
    regLink.style.display = 'none';
    forgotLink.style.display = 'none';
    if (role === 'urusetia') {
      loginTip.innerHTML = `<strong>Tip Log Masuk Urusetia:</strong><br>Log masuk menggunakan kredensial urusetia.<br>Username: <code>urusetia</code> / Password: <code>urusetia123</code>`;
    } else if (role === 'admin') {
      loginTip.innerHTML = `<strong>Tip Log Masuk Admin:</strong><br>Log masuk menggunakan kredensial pentadbir sistem.<br>Username: <code>admin</code> / Password: <code>admin123</code>`;
    }
  }
}

async function handleRegisterSubmit(event) {
  event.preventDefault();
  
  const nama = document.getElementById('reg-nama').value.trim();
  const ic = document.getElementById('reg-ic').value.trim();
  const tel = document.getElementById('reg-tel').value.trim();
  const emel = document.getElementById('reg-emel').value.trim();
  const password = document.getElementById('reg-password').value.trim();
  
  if (!nama || !ic || !tel || !emel || !password) {
    showToast("Sila lengkapkan semua medan maklumat diri!");
    return;
  }
  
  if (ic.length !== 12 || isNaN(ic)) {
    showToast("No. Kad Pengenalan mestilah 12 digit nombor!");
    return;
  }
  
  const payload = { nama, ic, tel, emel, password };
  
  if (useMySQL) {
    try {
      const res = await fetch('api.php?action=register_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mendaftar akaun.");
      }
      showToast("Pendaftaran akaun berjaya! Sila log masuk.");
      
      // Auto populate login field and toggle
      document.getElementById('login-ic').value = ic;
      document.getElementById('login-password').value = password;
      toggleLoginRegister(true);
    } catch (e) {
      console.error(e);
      showToast(e.message || "Ralat semasa mendaftar akaun.");
    }
  } else {
    // LocalStorage mode
    let localUsers = localStorage.getItem('psh_users');
    let users = localUsers ? JSON.parse(localUsers) : [];
    
    // Check if user exists
    if (users.some(u => u.ic === ic)) {
      showToast("Ralat: Pengguna dengan No. KP ini sudah berdaftar!");
      return;
    }
    
    users.push(payload);
    localStorage.setItem('psh_users', JSON.stringify(users));
    
    showToast("Pendaftaran akaun berjaya (Mod Local)! Sila log masuk.");
    document.getElementById('login-ic').value = ic;
    document.getElementById('login-password').value = password;
    toggleLoginRegister(true);
  }
}

async function handleLoginSubmit(event) {
  event.preventDefault();

  if (activeLoginRole === 'pengguna') {
    const icVal = document.getElementById('login-ic').value.trim();
    const passVal = document.getElementById('login-password').value.trim();
    
    if (!icVal || icVal.length < 12 || isNaN(icVal)) {
      showToast("Sila masukkan 12 digit Nombor Kad Pengenalan yang sah!");
      return;
    }
    if (!passVal) {
      showToast("Sila masukkan kata laluan anda!");
      return;
    }
    
    if (useMySQL) {
      try {
        const res = await fetch('api.php?action=login_user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ic: icVal, password: passVal })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Log masuk gagal.");
        }
        
        currentUserRole = 'pengguna';
        currentUserIC = icVal;
        showToast(`Selamat kembali, ${data.user.nama}!`);
        enterWorkspace();
      } catch (e) {
        console.error(e);
        showToast(e.message || "No. Kad Pengenalan atau kata laluan tidak sah!");
      }
    } else {
      // LocalStorage mode
      let localUsers = localStorage.getItem('psh_users');
      let users = localUsers ? JSON.parse(localUsers) : [];
      
      let user = users.find(u => u.ic === icVal && u.password === passVal);
      
      // Also fallback search in the seeded students list with default password 'user123'
      if (!user && passVal === 'user123') {
        const seedStudents = [
          { nama: 'Mohd Azlan bin Awang', ic: '080412125131' },
          { nama: 'Dayang Nurul binti Mohd', ic: '090822475246' },
          { nama: 'Jolius bin Justin', ic: '071015125353' },
          { nama: 'Fiona binti Gunting', ic: '081203495464' },
          { nama: 'Wong Jun Jie', ic: '100214125575' },
          { nama: 'Siti Aishah binti Abdullah', ic: '090530485682' },
          { nama: 'Elvin bin Mojikon', ic: '080618125791' },
          { nama: 'Sherry binti Kurup', ic: '091125475808' },
          { nama: 'Lee Kah Seng', ic: '070405495913' },
          { nama: 'Wong Qi Yi', ic: '080312126020' }
        ];
        const match = seedStudents.find(s => s.ic === icVal);
        if (match) {
          user = match;
        }
      }
      
      if (user) {
        currentUserRole = 'pengguna';
        currentUserIC = icVal;
        showToast(`Selamat kembali, ${user.nama} (Mod Local)!`);
        enterWorkspace();
      } else {
        showToast("No. Kad Pengenalan atau kata laluan tidak sah!");
      }
    }
  } else if (activeLoginRole === 'urusetia') {
    const userVal = document.getElementById('login-username').value.trim();
    const passVal = document.getElementById('login-password').value.trim();

    if (userVal === 'urusetia' && passVal === 'urusetia123') {
      currentUserRole = 'urusetia';
      currentUserIC = null;
      enterWorkspace();
    } else {
      showToast("Kredensial Urusetia tidak sah!");
    }
  } else if (activeLoginRole === 'admin') {
    const userVal = document.getElementById('login-username').value.trim();
    const passVal = document.getElementById('login-password').value.trim();

    if (userVal === 'admin' && passVal === 'admin123') {
      currentUserRole = 'admin';
      currentUserIC = null;
      enterWorkspace();
    } else {
      showToast("Kredensial Admin tidak sah!");
    }
  }
}

let tempForgotData = null;

async function handleForgotVerifySubmit(event) {
  event.preventDefault();

  const ic = document.getElementById('forgot-ic').value.trim();
  const tel = document.getElementById('forgot-tel').value.trim();
  const emel = document.getElementById('forgot-emel').value.trim();

  if (!ic || !tel || !emel) {
    showToast("Sila lengkapkan semua medan pengesahan diri!");
    return;
  }

  if (ic.length !== 12 || isNaN(ic)) {
    showToast("No. Kad Pengenalan mestilah 12 digit nombor!");
    return;
  }

  const payload = { ic, tel, emel };

  if (useMySQL) {
    try {
      const res = await fetch('api.php?action=verify_reset_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Pengesahan diri gagal.");
      }
      
      tempForgotData = payload;
      
      // Move to Step 2: Show Reset Form
      document.getElementById('forgot-verify-form').style.display = 'none';
      document.getElementById('forgot-reset-form').style.display = 'block';
      showToast("Maklumat disahkan! Sila masukkan kata laluan baharu.");
    } catch (e) {
      console.error(e);
      showToast(e.message || "Ralat semasa mengesahkan maklumat diri.");
    }
  } else {
    // LocalStorage mode
    let localUsers = localStorage.getItem('psh_users');
    let users = localUsers ? JSON.parse(localUsers) : [];

    let matched = users.some(u => u.ic === ic && u.tel === tel && u.emel === emel);
    
    if (!matched) {
      // Also fallback check seeded students list since they are the core registrations
      const reg = pshRegistrations.find(r => r.ic === ic && r.tel === tel && r.emel === emel);
      if (reg) {
        matched = true;
      }
    }

    if (matched) {
      tempForgotData = payload;
      document.getElementById('forgot-verify-form').style.display = 'none';
      document.getElementById('forgot-reset-form').style.display = 'block';
      showToast("Maklumat disahkan (Mod Local)! Sila masukkan kata laluan baharu.");
    } else {
      showToast("Ralat: Maklumat pengesahan diri (No. KP / Telefon / Emel) tidak sepadan dengan rekod kami!");
    }
  }
}

async function handleForgotResetSubmit(event) {
  event.preventDefault();

  if (!tempForgotData) {
    showToast("Ralat sistem: Maklumat pengesahan tidak ditemui!");
    return;
  }

  const newPass = document.getElementById('forgot-new-password').value.trim();
  const confirmPass = document.getElementById('forgot-confirm-password').value.trim();

  if (!newPass || !confirmPass) {
    showToast("Sila masukkan kata laluan baharu!");
    return;
  }

  if (newPass !== confirmPass) {
    showToast("Kata laluan baharu dan pengesahan kata laluan tidak sepadan!");
    return;
  }

  const payload = { 
    ic: tempForgotData.ic, 
    tel: tempForgotData.tel, 
    emel: tempForgotData.emel, 
    password: newPass 
  };

  if (useMySQL) {
    try {
      const res = await fetch('api.php?action=reset_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal set semula kata laluan.");
      }
      showToast("Kata laluan berjaya diset semula! Sila log masuk.");
      
      // Auto-populate login form and reset inputs
      document.getElementById('login-ic').value = tempForgotData.ic;
      document.getElementById('login-password').value = newPass;
      
      // Clear forms
      document.getElementById('forgot-verify-form').reset();
      document.getElementById('forgot-reset-form').reset();
      tempForgotData = null;
      
      toggleForgotPassword(false);
    } catch (e) {
      console.error(e);
      showToast(e.message || "Ralat semasa set semula kata laluan.");
    }
  } else {
    // LocalStorage mode
    let localUsers = localStorage.getItem('psh_users');
    let users = localUsers ? JSON.parse(localUsers) : [];

    let userIdx = users.findIndex(u => u.ic === tempForgotData.ic && u.tel === tempForgotData.tel && u.emel === tempForgotData.emel);
    
    if (userIdx === -1) {
      // Find inside pshRegistrations (seeded from CSV)
      const reg = pshRegistrations.find(r => r.ic === tempForgotData.ic && r.tel === tempForgotData.tel && r.emel === tempForgotData.emel);
      if (reg) {
        users.push({
          ic: reg.ic,
          nama: reg.nama,
          tel: reg.tel,
          emel: reg.emel,
          password: newPass
        });
        userIdx = users.length - 1;
      }
    } else {
      users[userIdx].password = newPass;
    }

    if (userIdx !== -1) {
      localStorage.setItem('psh_users', JSON.stringify(users));
      showToast("Kata laluan berjaya diset semula (Mod Local)! Sila log masuk.");
      
      document.getElementById('login-ic').value = tempForgotData.ic;
      document.getElementById('login-password').value = newPass;
      
      document.getElementById('forgot-verify-form').reset();
      document.getElementById('forgot-reset-form').reset();
      tempForgotData = null;
      
      toggleForgotPassword(false);
    } else {
      showToast("Ralat sistem semasa memproses kemas kini.");
    }
  }
}

// Redirect and Switch Sidebars
function enterWorkspace() {
  // Hide login screen, display app dashboard
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-container').style.display = 'flex';

  // Customize dynamic side navigation links based on user role
  updateSidebarNavigation();

  // Reset defaults and load initial tabs
  if (currentUserRole === 'pengguna') {
    switchTab('courses');
  } else if (currentUserRole === 'urusetia') {
    switchTab('urusetia-reg');
  } else if (currentUserRole === 'admin') {
    switchTab('admin-dashboard');
  }
}

function updateSidebarNavigation() {
  // Hide all links initially
  const links = document.querySelectorAll('.nav-role-link');
  links.forEach(l => l.style.display = 'none');

  // Display role display names
  const roleLabel = document.getElementById('sidebar-role-label');
  const userDisplay = document.getElementById('sidebar-user-display');

  if (currentUserRole === 'pengguna') {
    roleLabel.textContent = "Peserta PSH";
    userDisplay.textContent = `No. KP: ${currentUserIC}`;
    
    // Display student links
    document.querySelectorAll('.role-link-pengguna').forEach(l => l.style.display = 'block');
  } else if (currentUserRole === 'urusetia') {
    roleLabel.textContent = "Urusetia PSH";
    userDisplay.textContent = "Pegawai Urusetia";

    // Display urusetia links
    document.querySelectorAll('.role-link-urusetia').forEach(l => l.style.display = 'block');
  } else if (currentUserRole === 'admin') {
    roleLabel.textContent = "Penyelaras ULPL";
    userDisplay.textContent = "Penyelaras ULPL";

    // Display admin links
    document.querySelectorAll('.role-link-admin').forEach(l => l.style.display = 'block');
  }
}

function performLogout() {
  currentUserRole = null;
  currentUserIC = null;

  // Reset form inputs
  document.getElementById('login-ic').value = '';
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';

  // Show login layout, hide content dashboard
  document.getElementById('app-container').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  
  showToast("Anda telah berjaya log keluar.");
}

// 3. Tab Navigation & Header Toggles
function switchTab(tabId) {
  // Hide all views
  const views = document.querySelectorAll('.tab-view');
  views.forEach(v => v.style.display = 'none');

  // Clear active navigations
  const navItems = document.querySelectorAll('.nav-links .nav-item');
  navItems.forEach(n => n.classList.remove('active'));

  // Header element selectors
  const title = document.getElementById('app-title');
  const subtitle = document.getElementById('app-subtitle');
  const urusetiaHeaderActions = document.getElementById('urusetia-header-actions');

  // Hide urusetia adding header action by default
  urusetiaHeaderActions.style.display = 'none';

  // Toggle specific view active
  if (tabId === 'courses') {
    document.getElementById('nav-courses').classList.add('active');
    document.getElementById('view-courses').style.display = 'block';
    title.textContent = 'Maklumat Kursus PSH';
    subtitle.textContent = 'Daftar dan sertai kursus Pembelajaran Sepanjang Hayat yang dianjurkan oleh JMSK.';
    renderCourses();
  } else if (tabId === 'gallery') {
    document.getElementById('nav-gallery').classList.add('active');
    document.getElementById('view-gallery').style.display = 'block';
    title.textContent = 'Galeri Kursus PSH';
    subtitle.textContent = 'Gambar-gambar menarik sepanjang sesi kursus PSH yang dikendalikan oleh JMSK.';
    renderGallery('Semua');
  } else if (tabId === 'user-history') {
    document.getElementById('nav-user-history').classList.add('active');
    document.getElementById('view-user-history').style.display = 'block';
    title.textContent = 'Sejarah Pendaftaran';
    subtitle.textContent = 'Semak rekod permohonan penyertaan kursus dan resit bayaran anda.';
    renderUserHistory();
  } else if (tabId === 'evaluations') {
    document.getElementById('nav-evaluations').classList.add('active');
    document.getElementById('view-evaluations').style.display = 'block';
    title.textContent = 'Penilaian Kursus PSH';
    subtitle.textContent = 'Sila lengkapkan penilaian untuk setiap kursus yang telah anda sertai.';
    renderUserEvaluations();
  } else if (tabId === 'urusetia-reg') {
    document.getElementById('nav-urusetia-reg').classList.add('active');
    document.getElementById('view-admin-registrations').style.display = 'block';
    title.textContent = 'Urusetia: Pendaftaran Peserta';
    subtitle.textContent = 'Semak butiran maklumat peserta, sahkan resit yuran pembayaran, dan uruskan pendaftaran.';
    renderAdminRegistrations();
  } else if (tabId === 'urusetia-rep') {
    document.getElementById('nav-urusetia-rep').classList.add('active');
    document.getElementById('view-urusetia-reports').style.display = 'block';
    title.textContent = 'Urusetia: Laporan Pelaksanaan PSH';
    subtitle.textContent = 'Kemaskini status kursus yang selesai dan jana laporan ulasan bertulis rasmi.';
    renderUrusetiaReports();
  } else if (tabId === 'urusetia-courses') {
    document.getElementById('nav-urusetia-courses').classList.add('active');
    document.getElementById('view-urusetia-courses').style.display = 'block';
    title.textContent = 'Urus Rekod Kursus';
    subtitle.textContent = 'Daftar kursus baru yang akan dilaksanakan, kemas kini butiran maklumat, atau padam.';
    urusetiaHeaderActions.style.display = 'block'; // Display "Tambah Kursus Baru" for Urusetia
    renderUrusetiaCourses();
  } else if (tabId === 'admin-dashboard') {
    document.getElementById('nav-admin-dashboard').classList.add('active');
    document.getElementById('view-admin-dashboard').style.display = 'block';
    title.textContent = 'Dashboard Sistem (Penyelaras ULPL)';
    subtitle.textContent = 'Analisis statistik data keseluruhan sistem PSH dan selenggara pangkalan data.';
    renderAdminDashboard();
  }
}

// 4. USER PORTAL LOGIC

// Tab 1: Course Info (Grouped by Month)
function renderCourses() {
  const container = document.getElementById('courses-container');
  container.innerHTML = '';

  // Group courses by month (Year-Month)
  const grouped = {};
  const monthNames = {
    '01': 'Januari', '02': 'Februari', '03': 'Mac', '04': 'April',
    '05': 'Mei', '06': 'Jun', '07': 'Julai', '08': 'Ogos',
    '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
  };

  pshCourses.forEach(c => {
    const monthNum = c.tarikh.split('-')[1];
    const year = c.tarikh.split('-')[0];
    const monthKey = `${year}-${monthNum}`;
    if (!grouped[monthKey]) {
      grouped[monthKey] = {
        label: `${monthNames[monthNum]} ${year}`,
        list: []
      };
    }
    grouped[monthKey].list.push(c);
  });

  // Sort keys chronologically
  const sortedMonthKeys = Object.keys(grouped).sort();

  if (sortedMonthKeys.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:48px; color:var(--body-subtle);">Tiada tawaran kursus ditemui dalam sistem.</div>`;
    return;
  }

  sortedMonthKeys.forEach(monthKey => {
    const group = grouped[monthKey];
    
    // Create month heading section
    const heading = document.createElement('h2');
    heading.className = 'month-section-title';
    heading.innerHTML = `📅 Bulan ${group.label}`;
    container.appendChild(heading);

    // Create a grid specifically for this month's courses
    const grid = document.createElement('div');
    grid.className = 'courses-grid';
    grid.style.marginBottom = '40px';

    group.list.forEach(c => {
      const card = document.createElement('div');
      card.className = 'course-card';

      const tagClass = `tag-${c.kategori.toLowerCase()}`;
      const fillPercent = (c.peserta / c.maxPeserta) * 100;
      const isFull = c.peserta >= c.maxPeserta;
      const formattedDate = formatDateMalay(c.tarikh);

      // Check if user has already registered for this course
      const isRegistered = pshRegistrations.some(r => r.courseId === c.id && r.ic === currentUserIC);

      card.innerHTML = `
        <div class="course-card-header">
          <span class="category-tag ${tagClass}">${c.kategori}</span>
          <span style="font-size: 0.8rem; font-weight: 700; color: var(--body-subtle);">ID: ${c.id}</span>
        </div>
        <div class="course-card-body">
          <h3 class="course-title">${c.nama}</h3>
          
          <div class="course-meta-details">
            <div class="meta-row">
              <span class="meta-icon">📅</span>
              <span><strong>Tarikh:</strong> ${formattedDate}</span>
            </div>
            <div class="meta-row">
              <span class="meta-icon">⏰</span>
              <span><strong>Masa:</strong> ${c.masa}</span>
            </div>
            <div class="meta-row">
              <span class="meta-icon">📍</span>
              <span><strong>Lokasi:</strong> ${c.lokasi}</span>
            </div>
            <div class="meta-row">
              <span class="meta-icon">👤</span>
              <span><strong>Penceramah:</strong> ${c.penceramah}</span>
            </div>
          </div>

          <div class="course-participants-bar">
            <div class="participants-text">
              <span>Pendaftaran Peserta</span>
              <span>${c.peserta} / ${c.maxPeserta} Ahli</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width: ${fillPercent}%; background: ${isFull ? 'var(--danger)' : 'var(--brand)'};"></div>
            </div>
          </div>
        </div>
        <div class="course-card-footer">
          <div class="course-fee">RM ${c.yuran.toFixed(2)}</div>
          
          ${isRegistered ? `
            <button class="btn btn-secondary" disabled style="background: var(--success-soft); color: var(--success); cursor: default;">
              ✓ Telah Berdaftar
            </button>
          ` : `
            <button class="btn btn-primary" onclick="openRegisterPage('${c.id}')" ${isFull ? 'disabled style="background: var(--disabled); color: var(--fg-disabled); cursor: not-allowed;"' : ''}>
              ${isFull ? 'Penuh' : 'Daftar Sekarang'}
            </button>
          `}
        </div>
      `;
      grid.appendChild(card);
    });

    container.appendChild(grid);
  });
}

// Tab 2: Gallery PSH
function renderGallery(kategori) {
  const container = document.getElementById('gallery-container');
  container.innerHTML = '';

  const filtered = pshGallery.filter(item => kategori === 'Semua' || item.kategori === kategori);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px; color: var(--body-subtle);">
        <p style="font-size: 1.5rem;">🖼️</p>
        <p style="margin-top: 8px;">Tiada imej galeri ditemui bagi kategori ini.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'gallery-card';

    card.innerHTML = `
      <div class="gallery-image-wrapper">
        <img class="gallery-image" src="${item.imageUrl}" alt="${item.title}">
      </div>
      <div class="gallery-info">
        <div class="gallery-category">${item.kategori}</div>
        <h3 class="gallery-title">${item.title}</h3>
        <p class="gallery-desc">${item.description}</p>
      </div>
    `;
    container.appendChild(card);
  });
}

function filterGallery(kategori, button) {
  // Reset active button class
  const buttons = document.querySelectorAll('.gallery-filter-bar .filter-btn');
  buttons.forEach(b => b.classList.remove('active'));
  button.classList.add('active');

  renderGallery(kategori);
}

// Tab 3: Personal History Workspace
function renderUserHistory() {
  const listContainer = document.getElementById('user-history-list');
  listContainer.innerHTML = '';

  // Get active user's registrations
  const myRegs = pshRegistrations.filter(r => r.ic === currentUserIC);

  if (myRegs.length === 0) {
    listContainer.innerHTML = `
      <div style="text-align: center; padding: 48px; border: 1px dashed var(--border-light); border-radius: var(--radius-default);">
        <span style="font-size: 2.5rem;">📁</span>
        <p style="margin-top: 12px; font-weight: 600; color: var(--heading);">Tiada rekod pendaftaran ditemui.</p>
        <p style="font-size: 0.8rem; color: var(--body-subtle); margin-top: 4px;">Sila layari tab Maklumat Kursus untuk mendaftar kursus yang ditawarkan.</p>
      </div>
    `;
    return;
  }

  myRegs.forEach(r => {
    const item = document.createElement('div');
    item.style.cssText = `
      background: var(--neutral-primary);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-default);
      padding: 18px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    `;

    const registerDate = new Date(r.tarikhDaftar).toLocaleDateString('ms-MY', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    const course = pshCourses.find(c => c.id === r.courseId);
    const isExecuted = course && course.status === "Telah Dilaksanakan";
    const hasEvaluated = pshEvaluations.some(ev => ev.registrationId === r.id);

    item.innerHTML = `
      <div>
        <h4 style="font-weight: 700; color: var(--heading); font-size: 0.95rem;">${r.courseName}</h4>
        <div style="font-size: 0.8rem; color: var(--body-subtle); margin-top: 4px; display: flex; gap: 16px; flex-wrap: wrap;">
          <span><strong>Kod:</strong> ${r.courseId}</span>
          <span><strong>Bank FPX:</strong> ${r.bank}</span>
          <span><strong>Tarikh Daftar:</strong> ${registerDate}</span>
          <span><strong>Status:</strong> ${isExecuted ? '<span style="color: var(--success); font-weight: 700;">Selesai </span>' : '<span style="color: var(--body-subtle);">Menunggu Laksana ⏳</span>'}</span>
        </div>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-secondary" onclick="openReceiptPreview('${r.id}')" style="padding: 6px 14px; font-size: 12px; font-weight: 700; background: var(--brand-softer); color: var(--brand-strong);">
          Lihat Resit 👁️
        </button>
        ${hasEvaluated ? `
          <button class="btn btn-secondary" disabled style="padding: 6px 14px; font-size: 12px; font-weight: 700; background: var(--success-soft); color: var(--success); cursor: default; border-color: var(--success);">
            ✓ Dinilai
          </button>
        ` : isExecuted ? `
          <button class="btn btn-primary" onclick="openEvaluationModal('${r.id}')" style="padding: 6px 14px; font-size: 12px; font-weight: 700;">
            Penilaian Kursus 📋
          </button>
        ` : `
          <button class="btn btn-secondary" disabled style="padding: 6px 14px; font-size: 12px; font-weight: 700; background: var(--disabled); color: var(--fg-disabled); cursor: not-allowed; border-color: var(--border-light);">
            Belum Laksana ⏳
          </button>
        `}
      </div>
    `;
    listContainer.appendChild(item);
  });
}

function renderUserEvaluations() {
  const listContainer = document.getElementById('user-evaluations-list');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  // Get active user's registrations
  const myRegs = pshRegistrations.filter(r => r.ic === currentUserIC);

  if (myRegs.length === 0) {
    listContainer.innerHTML = `
      <div style="text-align: center; padding: 48px; border: 1px dashed var(--border-light); border-radius: var(--radius-default);">
        <span style="font-size: 2.5rem;">📋</span>
        <p style="margin-top: 12px; font-weight: 600; color: var(--heading);">Tiada rekod pendaftaran untuk dinilai.</p>
        <p style="font-size: 0.8rem; color: var(--body-subtle); margin-top: 4px;">Anda hanya boleh menilai kursus yang telah anda daftarkan.</p>
      </div>
    `;
    return;
  }

  myRegs.forEach(r => {
    const item = document.createElement('div');
    item.style.cssText = `
      background: var(--neutral-primary);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-default);
      padding: 18px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    `;

    const registerDate = new Date(r.tarikhDaftar).toLocaleDateString('ms-MY', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    const course = pshCourses.find(c => c.id === r.courseId);
    const isExecuted = course && course.status === "Telah Dilaksanakan";
    const hasEvaluated = pshEvaluations.some(ev => ev.registrationId === r.id);

    let statusText = '';
    if (hasEvaluated) {
      statusText = '<span style="color: var(--success); font-weight: 700;">✓ Telah Dinilai</span>';
    } else if (isExecuted) {
      statusText = '<span style="color: var(--brand); font-weight: 700;">Belum Dinilai</span>';
    } else {
      statusText = '<span style="color: var(--body-subtle);">Menunggu Pelaksanaan ⏳</span>';
    }

    item.innerHTML = `
      <div>
        <h4 style="font-weight: 700; color: var(--heading); font-size: 0.95rem;">${r.courseName}</h4>
        <div style="font-size: 0.8rem; color: var(--body-subtle); margin-top: 4px; display: flex; gap: 16px; flex-wrap: wrap;">
          <span><strong>Kod:</strong> ${r.courseId}</span>
          <span><strong>Tarikh Daftar:</strong> ${registerDate}</span>
          <span><strong>Status Penilaian:</strong> ${statusText}</span>
        </div>
      </div>
      <div>
        ${hasEvaluated ? `
          <button class="btn btn-secondary" disabled style="padding: 6px 14px; font-size: 12px; font-weight: 700; background: var(--success-soft); color: var(--success); cursor: default; border-color: var(--success); min-width: 130px;">
            ✓ Selesai Dinilai
          </button>
        ` : isExecuted ? `
          <button class="btn btn-primary" onclick="openEvaluationModal('${r.id}')" style="padding: 6px 14px; font-size: 12px; font-weight: 700; min-width: 130px;">
            Beri Penilaian 📋
          </button>
        ` : `
          <button class="btn btn-secondary" disabled style="padding: 6px 14px; font-size: 12px; font-weight: 700; background: var(--disabled); color: var(--fg-disabled); cursor: not-allowed; border-color: var(--border-light); min-width: 130px;">
            Belum Laksana ⏳
          </button>
        `}
      </div>
    `;
    listContainer.appendChild(item);
  });
}

// Special SPA Registration Form Page
function openRegisterPage(courseId) {
  const course = pshCourses.find(c => c.id === courseId);
  if (!course) return;

  activeCourse = course;
  uploadedReceiptBase64 = null;
  uploadedReceiptName = null;

  // Clear inputs and file status label
  document.getElementById('page-reg-nama').value = '';
  document.getElementById('page-reg-tel').value = '';
  document.getElementById('page-reg-emel').value = '';
  document.getElementById('page-reg-bank').selectedIndex = 0;
  document.getElementById('page-receipt-filename-display').textContent = 'Tiada fail terpilih';
  document.getElementById('page-upload-status-text').textContent = 'Klik di sini untuk memilih fail resit (PDF, PNG, JPG)';
  document.getElementById('page-receipt-icon').textContent = '📄';

  // Lock target IC to active logged in student
  document.getElementById('page-reg-ic').value = currentUserIC;

  // Set course text labels
  document.getElementById('page-reg-course-title').textContent = course.nama;
  document.getElementById('page-reg-course-meta').innerHTML = `
    <strong>Kod Kursus:</strong> ${course.id} &nbsp;|&nbsp; 
    <strong>Penceramah:</strong> ${course.penceramah} &nbsp;|&nbsp; 
    <strong>Lokasi:</strong> ${course.lokasi}<br>
    <strong>Tarikh & Masa:</strong> ${formatDateMalay(course.tarikh)} (${course.masa})
  `;

  // Swap content tabs
  const views = document.querySelectorAll('.tab-view');
  views.forEach(v => v.style.display = 'none');
  document.getElementById('view-register-page').style.display = 'block';

  // Update header text
  document.getElementById('app-title').textContent = 'Pendaftaran Kursus PSH';
  document.getElementById('app-subtitle').textContent = 'Sila lengkapkan butiran pendaftaran dan muat naik resit pembayaran anda.';
}

function triggerPageReceiptInput() {
  document.getElementById('page-receipt-file').click();
}

function handlePageReceiptFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  uploadedReceiptName = file.name;

  const reader = new FileReader();
  reader.onload = function(e) {
    uploadedReceiptBase64 = e.target.result;
    
    // Update display icons and label status
    document.getElementById('page-receipt-filename-display').textContent = file.name;
    document.getElementById('page-upload-status-text').textContent = '✓ Fail Resit Sedia Dimuat Naik!';
    document.getElementById('page-receipt-icon').textContent = '✅';
    showToast("Fail bukti pembayaran dimuat naik!");
  };
  reader.readAsDataURL(file);
}

async function submitPSHRegistration(event) {
  event.preventDefault();

  if (!uploadedReceiptBase64) {
    showToast("Ralat! Anda diwajibkan untuk memuat naik resit yuran bayaran terlebih dahulu.");
    return;
  }

  const nama = document.getElementById('page-reg-nama').value.trim();
  const tel = document.getElementById('page-reg-tel').value.trim();
  const emel = document.getElementById('page-reg-emel').value.trim();
  const bank = document.getElementById('page-reg-bank').value;

  const newReg = {
    id: 'REG-' + Date.now(),
    courseId: activeCourse.id,
    courseName: activeCourse.nama,
    nama: nama,
    ic: currentUserIC,
    tel: tel,
    emel: emel,
    bank: bank,
    receiptData: uploadedReceiptBase64,
    receiptName: uploadedReceiptName,
    tarikhDaftar: new Date().toISOString()
  };

  if (useMySQL) {
    try {
      const res = await fetch('api.php?action=add_registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReg)
      });
      if (!res.ok) throw new Error("Gagal menyimpan ke MySQL");
      await loadDatabase();
    } catch (e) {
      console.error(e);
      showToast("Ralat menyimpan pendaftaran ke MySQL.");
      return;
    }
  } else {
    // Increment course capacity
    const courseIdx = pshCourses.findIndex(c => c.id === activeCourse.id);
    if (courseIdx !== -1) {
      if (pshCourses[courseIdx].peserta < pshCourses[courseIdx].maxPeserta) {
        pshCourses[courseIdx].peserta++;
        localStorage.setItem('psh_courses', JSON.stringify(pshCourses));
      }
    }

    // Save registration
    pshRegistrations.push(newReg);
    localStorage.setItem('psh_registrations', JSON.stringify(pshRegistrations));
  }

  showToast(`Pendaftaran ${nama} berjaya dihantar dan resit disimpan!`);

  // Switch view
  switchTab('courses');
}


// 5. SECRETARIAT REGISTER MANAGER (Urusetia)
function renderAdminRegistrations() {
  const tbody = document.getElementById('admin-registrations-body');
  tbody.innerHTML = '';

  // 1. Bilangan kursus yang belum dilaksanakan
  const pendingCoursesCount = pshCourses.filter(c => c.status === "Belum Dilaksanakan").length;
  document.getElementById('urusetia-stat-pending-courses').textContent = `${pendingCoursesCount} Sesi`;

  // 2. Jumlah peserta bagi semua kursus yang telah dilaksanakan
  const executedParticipantsCount = pshCourses.filter(c => c.status === "Telah Dilaksanakan").reduce((sum, c) => sum + c.peserta, 0);
  document.getElementById('urusetia-stat-executed-participants').textContent = `${executedParticipantsCount} Orang`;

  // 3. Jumlah kutipan yuran diperoleh setakat hari ini (RM10 per pendaftaran)
  const totalCollections = pshRegistrations.length * 10;
  document.getElementById('urusetia-stat-total-fees').textContent = `RM ${totalCollections.toFixed(2)}`;

  // Generate Course Sub-Tabs dynamically (Grouped by Month of Offer)
  const tabsContainer = document.getElementById('admin-course-tabs');
  tabsContainer.innerHTML = '';

  // 1. "Semua Kursus" Sub-Tab
  const allBtn = document.createElement('button');
  allBtn.className = `filter-btn ${activeAdminCourseId === 'Semua' ? 'active' : ''}`;
  allBtn.textContent = `Semua Kursus (RM ${totalCollections.toFixed(0)})`;
  allBtn.onclick = () => {
    activeAdminCourseId = 'Semua';
    renderAdminRegistrations();
  };
  tabsContainer.appendChild(allBtn);

  // Group courses by month
  const monthNames = {
    '01': 'Januari', '02': 'Februari', '03': 'Mac', '04': 'April',
    '05': 'Mei', '06': 'Jun', '07': 'Julai', '08': 'Ogos',
    '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
  };

  const groupedCourses = {};
  pshCourses.forEach(c => {
    const monthNum = c.tarikh.split('-')[1];
    const year = c.tarikh.split('-')[0];
    const monthLabel = `${monthNames[monthNum]} ${year}`;
    if (!groupedCourses[monthLabel]) {
      groupedCourses[monthLabel] = [];
    }
    groupedCourses[monthLabel].push(c);
  });

  // Render monthly groups of tabs
  for (const monthLabel of Object.keys(groupedCourses).sort()) {
    const courses = groupedCourses[monthLabel];
    
    const groupDiv = document.createElement('div');
    groupDiv.style.display = 'flex';
    groupDiv.style.alignItems = 'center';
    groupDiv.style.flexWrap = 'wrap';
    groupDiv.style.gap = '8px';
    groupDiv.style.width = '100%';
    groupDiv.style.marginTop = '12px';
    
    const labelSpan = document.createElement('span');
    labelSpan.style.fontSize = '12px';
    labelSpan.style.fontWeight = '700';
    labelSpan.style.color = 'var(--body-subtle)';
    labelSpan.style.marginRight = '8px';
    labelSpan.textContent = `Bulan ${monthLabel}:`;
    groupDiv.appendChild(labelSpan);

    courses.forEach(c => {
      const courseRegs = pshRegistrations.filter(r => r.courseId === c.id);
      const courseFees = courseRegs.length * 10;
      
      const btn = document.createElement('button');
      btn.className = `filter-btn ${activeAdminCourseId === c.id ? 'active' : ''}`;
      btn.textContent = `${c.id} (RM ${courseFees.toFixed(0)})`;
      btn.onclick = () => {
        activeAdminCourseId = c.id;
        renderAdminRegistrations();
      };
      groupDiv.appendChild(btn);
    });

    tabsContainer.appendChild(groupDiv);
  }

  // Filter registrations based on selected sub-tab
  const filteredRegs = activeAdminCourseId === 'Semua'
    ? pshRegistrations
    : pshRegistrations.filter(r => r.courseId === activeAdminCourseId);

  // Update Active Course Tab Summary & Fee Collected
  const summaryTitle = document.getElementById('admin-summary-course-title');
  const summaryDesc = document.getElementById('admin-summary-course-desc');
  const summaryTotalPeserta = document.getElementById('admin-summary-total-peserta');
  const summaryTotalKutipan = document.getElementById('admin-summary-total-kutipan');

  const filteredCount = filteredRegs.length;
  const filteredFees = filteredCount * 10;

  if (activeAdminCourseId === 'Semua') {
    summaryTitle.textContent = 'Semua Pendaftaran Kursus';
    summaryDesc.textContent = 'Senarai penuh pendaftaran merentasi semua kategori subjek (Matematik, Sains, & Komputer).';
  } else {
    const activeCourseObj = pshCourses.find(c => c.id === activeAdminCourseId);
    if (activeCourseObj) {
      summaryTitle.textContent = activeCourseObj.nama;
      summaryDesc.textContent = `📆 Tarikh: ${formatDateMalay(activeCourseObj.tarikh)} | 📍 Lokasi: ${activeCourseObj.lokasi} | 👤 Urusetia: ${activeCourseObj.urusetia}`;
    }
  }

  summaryTotalPeserta.textContent = `${filteredCount} Orang`;
  summaryTotalKutipan.textContent = `RM ${filteredFees.toFixed(2)}`;

  if (filteredCount === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 32px; color: var(--body-subtle);">
          <div style="font-size: 2rem;">📂</div>
          <p style="margin-top: 8px; font-weight: 600;">Tiada rekod pendaftaran peserta ditemui bagi tab ini.</p>
        </td>
      </tr>
    `;
    return;
  }

  const sortedRegs = [...filteredRegs].reverse();

  sortedRegs.forEach((r, index) => {
    const tr = document.createElement('tr');

    // Bil
    const tdBil = document.createElement('td');
    tdBil.style.textAlign = 'center';
    tdBil.textContent = index + 1;
    tr.appendChild(tdBil);

    // Nama & KP
    const tdProfile = document.createElement('td');
    tdProfile.innerHTML = `<div class="student-name-cell">${r.nama}</div><div class="student-ic-cell">${r.ic}</div>`;
    tr.appendChild(tdProfile);

    // Contact details
    const tdContact = document.createElement('td');
    tdContact.innerHTML = `<div>📞 ${r.tel}</div><div style="font-size: 0.8rem; color: var(--body-subtle);">✉️ ${r.emel}</div>`;
    tr.appendChild(tdContact);

    // Course Name
    const tdCourse = document.createElement('td');
    tdCourse.innerHTML = `<strong>${r.courseName}</strong><br><span style="font-size: 0.75rem; color: var(--body-subtle);">${r.courseId}</span>`;
    tr.appendChild(tdCourse);

    // Bank
    const tdBank = document.createElement('td');
    tdBank.textContent = r.bank;
    tr.appendChild(tdBank);

    // Receipt Column (Green Preview Button)
    const tdReceipt = document.createElement('td');
    tdReceipt.style.textAlign = 'center';
    tdReceipt.innerHTML = `
      <button class="record-btn" onclick="openReceiptPreview('${r.id}')" style="background: var(--brand-softer); color: var(--brand-strong); font-weight: 700;">
        Lihat Resit 👁️
      </button>
    `;
    tr.appendChild(tdReceipt);

    // Actions (Delete option)
    const tdAction = document.createElement('td');
    tdAction.style.textAlign = 'center';
    tdAction.innerHTML = `
      <button class="record-btn" onclick="deletePSHRegistration('${r.id}')" style="background: var(--danger-soft); color: var(--danger-strong); font-weight: 700;">
        Padam
      </button>
    `;
    tr.appendChild(tdAction);

    tbody.appendChild(tr);
  });
}

function openReceiptPreview(regId) {
  const reg = pshRegistrations.find(r => r.id === regId);
  if (!reg) return;

  document.getElementById('receipt-preview-title').textContent = `Resit Bayaran: ${reg.nama}`;
  
  const imgContainer = document.getElementById('receipt-image-container');
  const imgElement = document.getElementById('receipt-preview-img');
  const fallbackContainer = document.getElementById('receipt-fallback-container');
  const fallbackFilename = document.getElementById('receipt-preview-filename');
  const downloadBtn = document.getElementById('receipt-download-btn');

  if (reg.receiptData && reg.receiptData.startsWith('data:image/')) {
    fallbackContainer.style.display = 'none';
    imgContainer.style.display = 'block';
    imgElement.src = reg.receiptData;
  } else {
    imgContainer.style.display = 'none';
    fallbackContainer.style.display = 'block';
    fallbackFilename.textContent = reg.receiptName || 'resit_pembayaran.pdf';
    downloadBtn.href = reg.receiptData || '#';
    downloadBtn.download = reg.receiptName || 'resit_pembayaran';
  }

  document.getElementById('receipt-preview-modal').classList.add('active');
}

function closeReceiptPreviewModal() {
  document.getElementById('receipt-preview-modal').classList.remove('active');
}

async function deletePSHRegistration(regId) {
  if (!confirm("Adakah anda pasti mahu memadam rekod pendaftaran peserta ini?")) return;

  if (useMySQL) {
    try {
      const res = await fetch(`api.php?action=delete_registration&id=${regId}`, { method: 'POST' });
      if (!res.ok) throw new Error("Gagal memadam dari MySQL");
      await loadDatabase();
    } catch (e) {
      console.error(e);
      showToast("Ralat memadam pendaftaran dari MySQL.");
      return;
    }
  } else {
    const idx = pshRegistrations.findIndex(r => r.id === regId);
    if (idx === -1) return;

    const reg = pshRegistrations[idx];

    // Decrement capacity
    const courseIdx = pshCourses.findIndex(c => c.id === reg.courseId);
    if (courseIdx !== -1 && pshCourses[courseIdx].peserta > 0) {
      pshCourses[courseIdx].peserta--;
      localStorage.setItem('psh_courses', JSON.stringify(pshCourses));
    }

    pshRegistrations.splice(idx, 1);
    localStorage.setItem('psh_registrations', JSON.stringify(pshRegistrations));
  }

  showToast("Pendaftaran berjaya dipadamkan.");
  renderAdminRegistrations();
}


// 6. URUSETIA REPORTS WORKSPACE
function renderUrusetiaReports() {
  const container = document.getElementById('urusetia-reports-container');
  container.innerHTML = '';

  if (pshCourses.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:48px; color:var(--body-subtle);">Tiada kursus untuk disediakan laporan.</div>`;
    return;
  }

  pshCourses.forEach(c => {
    const card = document.createElement('div');
    card.className = 'course-card';

    const tagClass = `tag-${c.kategori.toLowerCase()}`;
    const formattedDate = formatDateMalay(c.tarikh);
    const isExecuted = c.status === "Telah Dilaksanakan";

    card.innerHTML = `
      <div class="course-card-header">
        <span class="category-tag ${tagClass}">${c.kategori}</span>
        <span class="status-pill ${isExecuted ? 'status-executed' : 'status-pending'}">
          ${isExecuted ? '✓ Telah Dilaksanakan' : '🕒 Belum Dilaksanakan'}
        </span>
      </div>
      <div class="course-card-body" style="flex:1;">
        <h3 class="course-title">${c.nama}</h3>
        
        <div class="course-meta-details" style="margin-top: 12px; margin-bottom: 0;">
          <div class="meta-row">
            <span><strong>Kod:</strong> ${c.id}</span>
          </div>
          <div class="meta-row">
            <span><strong>Tarikh:</strong> ${formattedDate}</span>
          </div>
          <div class="meta-row">
            <span><strong>Penceramah:</strong> ${c.penceramah}</span>
          </div>
          <div class="meta-row">
            <span><strong>Urusetia:</strong> ${c.urusetia}</span>
          </div>
          <div class="meta-row" style="margin-top: 8px; border-top: 1px solid var(--border-light); padding-top: 8px;">
            <span><strong>Jumlah Yuran Dikutip:</strong> RM ${(c.peserta * 10).toFixed(2)} (${c.peserta} Peserta)</span>
          </div>
        </div>
      </div>
      <div class="course-card-footer" style="padding-top:16px; display:flex; flex-direction:column; gap:8px;">
        ${isExecuted ? `
          <button class="btn btn-primary" onclick="openReportModal('${c.id}')" style="width:100%;">
            Lihat / Edit Ulasan Laporan
          </button>
        ` : `
          <button class="btn btn-secondary" onclick="markCourseExecuted('${c.id}')" style="width:100%; background: var(--brand-softer); color: var(--brand-strong); font-weight:700;">
            Sahkan Kursus Telah Dilaksanakan
          </button>
          <button class="btn btn-primary" disabled style="width:100%; background: var(--disabled); color: var(--fg-disabled); cursor: not-allowed; opacity: 0.6; border: 1px solid var(--border-light);">
            Tulis Laporan (Nyahaktif)
          </button>
        `}
      </div>
    `;
    container.appendChild(card);
  });
}

async function markCourseExecuted(courseId) {
  if (!confirm("Adakah anda ingin mengesahkan bahawa kursus ini telah dilaksanakan? Setelah disahkan, anda boleh mula menulis laporan.")) return;
  const course = pshCourses.find(c => c.id === courseId);
  if (course) {
    course.status = "Telah Dilaksanakan";
    if (useMySQL) {
      try {
        const res = await fetch(`api.php?action=update_course&id=${courseId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(course)
        });
        if (!res.ok) throw new Error("Gagal mengemaskini status ke MySQL");
        await loadDatabase();
      } catch (e) {
        console.error(e);
        showToast("Ralat mengemaskini status kursus ke MySQL.");
        return;
      }
    } else {
      localStorage.setItem('psh_courses', JSON.stringify(pshCourses));
    }
    showToast(`Status kursus ${course.id} ditukar ke Telah Dilaksanakan!`);
    renderUrusetiaReports();
  }
}

function openReportModal(courseId) {
  const course = pshCourses.find(c => c.id === courseId);
  if (!course) return;

  activeReportCourseId = courseId;

  // Set titles
  document.getElementById('report-course-title').textContent = course.nama;
  document.getElementById('report-course-meta').innerHTML = `
    ID: ${course.id} &nbsp;|&nbsp; Penceramah: ${course.penceramah} &nbsp;|&nbsp; Urusetia: ${course.urusetia}
  `;

  // Select dropdown status
  document.getElementById('report-status').value = course.status || "Belum Dilaksanakan";

  // Populate text areas if report object exists
  if (course.laporan) {
    document.getElementById('report-ringkasan').value = course.laporan.ringkasan || '';
    document.getElementById('report-feedback').value = course.laporan.feedback || '';
    document.getElementById('report-cadangan').value = course.laporan.cadangan || '';
    document.getElementById('report-btn-print').style.display = 'inline-flex';
  } else {
    document.getElementById('report-ringkasan').value = '';
    document.getElementById('report-feedback').value = '';
    document.getElementById('report-cadangan').value = '';
    document.getElementById('report-btn-print').style.display = 'none'; // Hide print button initially
  }

  document.getElementById('report-form-modal').classList.add('active');
}

function closeReportModal() {
  document.getElementById('report-form-modal').classList.remove('active');
}

async function handleReportSave(event) {
  event.preventDefault();

  const courseIdx = pshCourses.findIndex(c => c.id === activeReportCourseId);
  if (courseIdx === -1) return;

  const course = pshCourses[courseIdx];
  const newStatus = document.getElementById('report-status').value;
  const ringkasan = document.getElementById('report-ringkasan').value.trim();
  const feedback = document.getElementById('report-feedback').value.trim();
  const cadangan = document.getElementById('report-cadangan').value.trim();

  course.status = newStatus;
  
  if (newStatus === "Telah Dilaksanakan") {
    course.laporan = {
      ringkasan: ringkasan,
      feedback: feedback,
      cadangan: cadangan,
      tarikhLaporan: new Date().toLocaleDateString('ms-MY')
    };
  } else {
    course.laporan = null;
  }

  if (useMySQL) {
    try {
      const res = await fetch(`api.php?action=update_course&id=${activeReportCourseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(course)
      });
      if (!res.ok) throw new Error("Gagal mengemaskini laporan ke MySQL");
      await loadDatabase();
    } catch (e) {
      console.error(e);
      showToast("Ralat menyimpan laporan ke MySQL.");
      return;
    }
  } else {
    // Save to DB
    localStorage.setItem('psh_courses', JSON.stringify(pshCourses));
  }
  
  showToast("Laporan pelaksanaan kursus berjaya disimpan.");
  closeReportModal();
  renderUrusetiaReports();
}

function triggerReportPrint() {
  const course = pshCourses.find(c => c.id === activeReportCourseId);
  if (!course) return;

  const printWindow = window.open('', '_blank');
  
  // Format report for physical printing
  const html = `
    <html>
    <head>
      <title>Laporan Kursus PSH - ${course.id}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
        .header { text-align: center; border-bottom: 3px double #333; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 22px; text-transform: uppercase; color: #111; }
        .header h2 { margin: 5px 0 0; font-size: 14px; font-weight: normal; color: #666; }
        .report-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; background: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #ddd; }
        .report-meta div { font-size: 14px; }
        .section-title { font-size: 15px; font-weight: bold; border-left: 4px solid #00875A; padding-left: 10px; margin-top: 30px; margin-bottom: 10px; color: #00875A; text-transform: uppercase; }
        .content-box { font-size: 14px; background: #fff; border: 1px solid #eee; padding: 15px; border-radius: 4px; min-height: 60px; white-space: pre-wrap; }
        .footer-sign { margin-top: 80px; display: flex; justify-content: space-between; }
        .signature { text-align: center; width: 220px; }
        .signature-line { border-bottom: 1px solid #333; margin-top: 60px; margin-bottom: 5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Laporan Pelaksanaan Kursus Pembelajaran Sepanjang Hayat (PSH)</h1>
        <h2>Jabatan Matematik, Sains & Komputer, Politeknik</h2>
      </div>
      
      <div class="report-meta">
        <div><strong>ID Kursus:</strong> ${course.id}</div>
        <div><strong>Kategori Jabatan:</strong> ${course.kategori}</div>
        <div><strong>Nama Kursus:</strong> ${course.nama}</div>
        <div><strong>Tarikh Pelaksanaan:</strong> ${formatDateMalay(course.tarikh)}</div>
        <div><strong>Penceramah:</strong> ${course.penceramah}</div>
        <div><strong>Pegawai Urusetia:</strong> ${course.urusetia}</div>
        <div><strong>Bilangan Kehadiran Peserta:</strong> ${course.peserta} Orang</div>
        <div><strong>Jumlah Dana Yuran (RM10):</strong> RM ${(course.peserta * 10).toFixed(2)}</div>
      </div>
      
      <div class="section-title">1. Ringkasan Pengisian & Aktiviti Kursus</div>
      <div class="content-box">${document.getElementById('report-ringkasan').value || 'Tiada laporan aktiviti disediakan.'}</div>
      
      <div class="section-title">2. Maklum Balas Peserta</div>
      <div class="content-box">${document.getElementById('report-feedback').value || 'Tiada maklum balas disediakan.'}</div>
      
      <div class="section-title">3. Cadangan Penambahbaikan</div>
      <div class="content-box">${document.getElementById('report-cadangan').value || 'Tiada cadangan penambahbaikan disediakan.'}</div>
      
      <div class="footer-sign">
        <div class="signature">
          <div class="signature-line"></div>
          <span>Disediakan Oleh<br>(Urusetia Kursus)</span>
        </div>
        <div class="signature">
          <div class="signature-line"></div>
          <span>Disahkan Oleh<br>(Ketua Jabatan JMSK)</span>
        </div>
      </div>
      
      <script>
        window.onload = function() { 
          window.print(); 
          setTimeout(function() { window.close(); }, 500); 
        }
      </script>
    </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
}


// 7. URUSETIA COURSE MANAGER WORKSPACE (CRUD)
function renderUrusetiaCourses() {
  const tbody = document.getElementById('urusetia-courses-body');
  tbody.innerHTML = '';

  if (pshCourses.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 32px; color: var(--body-subtle);">
          <div style="font-size: 2rem;">📂</div>
          <p style="margin-top: 8px; font-weight: 600;">Tiada rekod kursus ditemui dalam sistem.</p>
        </td>
      </tr>
    `;
    return;
  }

  pshCourses.forEach((c, index) => {
    const tr = document.createElement('tr');

    // Bil
    const tdBil = document.createElement('td');
    tdBil.style.textAlign = 'center';
    tdBil.textContent = index + 1;
    tr.appendChild(tdBil);

    // ID Kursus
    const tdID = document.createElement('td');
    tdID.style.fontWeight = '700';
    tdID.textContent = c.id;
    tr.appendChild(tdID);

    // Nama Kursus
    const tdNama = document.createElement('td');
    tdNama.innerHTML = `<div style="font-weight:600; line-height:1.4;">${c.nama}</div><div style="font-size:0.75rem; color:var(--body-subtle);">Urusetia: ${c.urusetia}</div>`;
    tr.appendChild(tdNama);

    // Kategori
    const tdKategori = document.createElement('td');
    tdKategori.textContent = c.kategori;
    tr.appendChild(tdKategori);

    // Tarikh
    const tdTarikh = document.createElement('td');
    tdTarikh.textContent = formatDateMalay(c.tarikh);
    tr.appendChild(tdTarikh);

    // Penceramah
    const tdPenceramah = document.createElement('td');
    tdPenceramah.textContent = c.penceramah;
    tr.appendChild(tdPenceramah);

    // Kapasiti
    const tdCapacity = document.createElement('td');
    tdCapacity.textContent = `${c.peserta} / ${c.maxPeserta} Peserta`;
    tr.appendChild(tdCapacity);

    // Actions (Edit & Delete)
    const tdAction = document.createElement('td');
    tdAction.style.textAlign = 'center';
    tdAction.innerHTML = `
      <div class="crud-btn-group" style="justify-content:center;">
        <button class="record-btn" onclick="openCourseFormModal('${c.id}')" style="background: var(--brand-softer); color: var(--brand-strong); font-weight: 700;">
          Edit
        </button>
        <button class="record-btn" onclick="deleteCourse('${c.id}')" style="background: var(--danger-soft); color: var(--danger-strong); font-weight: 700;">
          Padam
        </button>
      </div>
    `;
    tr.appendChild(tdAction);

    tbody.appendChild(tr);
  });
}

function openCourseFormModal(courseId = null) {
  const modalTitle = document.getElementById('course-modal-title');
  const idInput = document.getElementById('editor-course-id');
  const hiddenId = document.getElementById('editor-course-id-hidden');

  // Reset Form
  document.getElementById('course-editor-form').reset();

  if (courseId) {
    // EDIT MODE
    const course = pshCourses.find(c => c.id === courseId);
    if (!course) return;

    modalTitle.textContent = "Kemaskini Butiran Kursus PSH";
    hiddenId.value = course.id;
    idInput.value = course.id;
    idInput.readOnly = true;
    idInput.style.background = 'var(--disabled)';
    idInput.style.color = 'var(--fg-disabled)';

    // Populate Fields
    document.getElementById('editor-course-nama').value = course.nama;
    document.getElementById('editor-course-kategori').value = course.kategori;
    document.getElementById('editor-course-tarikh').value = course.tarikh;
    document.getElementById('editor-course-masa').value = course.masa;
    document.getElementById('editor-course-lokasi').value = course.lokasi;
    document.getElementById('editor-course-penceramah').value = course.penceramah;
    document.getElementById('editor-course-urusetia').value = course.urusetia;
    document.getElementById('editor-course-max').value = course.maxPeserta;
  } else {
    // ADD MODE
    modalTitle.textContent = "Daftar Kursus PSH Baru";
    hiddenId.value = "";
    idInput.readOnly = false;
    idInput.style.background = '';
    idInput.style.color = '';
    document.getElementById('editor-course-max').value = 30;
  }

  document.getElementById('course-form-modal').classList.add('active');
}

function closeCourseFormModal() {
  document.getElementById('course-form-modal').classList.remove('active');
}

async function handleCourseSave(event) {
  event.preventDefault();

  const hiddenId = document.getElementById('editor-course-id-hidden').value;
  const idInputVal = document.getElementById('editor-course-id').value.trim().toUpperCase();
  const nama = document.getElementById('editor-course-nama').value.trim();
  const kategori = document.getElementById('editor-course-kategori').value;
  const tarikh = document.getElementById('editor-course-tarikh').value;
  const masa = document.getElementById('editor-course-masa').value.trim();
  const lokasi = document.getElementById('editor-course-lokasi').value.trim();
  const penceramah = document.getElementById('editor-course-penceramah').value.trim();
  const urusetia = document.getElementById('editor-course-urusetia').value.trim();
  const maxPeserta = parseInt(document.getElementById('editor-course-max').value);

  let targetCourse = null;

  if (hiddenId) {
    // Edit Save
    const idx = pshCourses.findIndex(c => c.id === hiddenId);
    if (idx !== -1) {
      targetCourse = {
        ...pshCourses[idx],
        nama: nama,
        kategori: kategori,
        tarikh: tarikh,
        masa: masa,
        lokasi: lokasi,
        penceramah: penceramah,
        urusetia: urusetia,
        maxPeserta: maxPeserta
      };
    }
  } else {
    // Add Save
    // Check duplication
    const duplicate = pshCourses.some(c => c.id === idInputVal);
    if (duplicate) {
      showToast(`Ralat! ID Kursus "${idInputVal}" sudah wujud.`);
      return;
    }

    targetCourse = {
      id: idInputVal,
      nama: nama,
      kategori: kategori,
      tarikh: tarikh,
      masa: masa,
      lokasi: lokasi,
      penceramah: penceramah,
      urusetia: urusetia,
      peserta: 0,
      maxPeserta: maxPeserta,
      yuran: 10,
      status: "Belum Dilaksanakan",
      laporan: null
    };
  }

  if (useMySQL) {
    try {
      if (hiddenId) {
        const res = await fetch(`api.php?action=update_course&id=${hiddenId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(targetCourse)
        });
        if (!res.ok) throw new Error("Gagal mengemaskini di MySQL");
      } else {
        const res = await fetch('api.php?action=add_course', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(targetCourse)
        });
        if (!res.ok) throw new Error("Gagal menambah ke MySQL");
      }
      await loadDatabase();
    } catch (e) {
      console.error(e);
      showToast("Ralat menyimpan kursus ke MySQL.");
      return;
    }
  } else {
    if (hiddenId) {
      const idx = pshCourses.findIndex(c => c.id === hiddenId);
      if (idx !== -1) pshCourses[idx] = targetCourse;
    } else {
      pshCourses.push(targetCourse);
    }
    localStorage.setItem('psh_courses', JSON.stringify(pshCourses));
  }
  
  showToast("Butiran maklumat kursus berjaya disimpan.");
  closeCourseFormModal();
  renderUrusetiaCourses();
}

async function deleteCourse(courseId) {
  if (!confirm(`Adakah anda pasti mahu memadam kursus "${courseId}"? Semua rekod pendaftaran berkaitan tidak akan terjejas, namun kursus tidak ditawarkan lagi.`)) return;

  if (useMySQL) {
    try {
      const res = await fetch(`api.php?action=delete_course&id=${courseId}`, { method: 'POST' });
      if (!res.ok) throw new Error("Gagal memadam kursus dari MySQL");
      await loadDatabase();
    } catch (e) {
      console.error(e);
      showToast("Ralat memadam kursus dari MySQL.");
      return;
    }
  } else {
    const idx = pshCourses.findIndex(c => c.id === courseId);
    if (idx === -1) return;

    pshCourses.splice(idx, 1);
    localStorage.setItem('psh_courses', JSON.stringify(pshCourses));
  }

  showToast("Kursus berjaya dipadamkan.");
  renderUrusetiaCourses();
}


// 8. ADMIN MASTER DASHBOARD WORKSPACE
function renderAdminDashboard() {
  // 1. Stats Counter values
  const totalCoursesCount = pshCourses.length;
  const totalRegsCount = pshRegistrations.length;
  const totalReportsCount = pshCourses.filter(c => c.status === "Telah Dilaksanakan").length;

  document.getElementById('admin-db-total-courses').textContent = totalCoursesCount;
  document.getElementById('admin-db-total-peserta').textContent = totalRegsCount;
  document.getElementById('admin-db-total-reports').textContent = totalReportsCount;

  // 2. Populate course listing body
  const tbody = document.getElementById('admin-db-courses-body');
  tbody.innerHTML = '';

  if (totalCoursesCount === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 32px; color: var(--body-subtle);">
          <div style="font-size: 2rem;">📂</div>
          <p style="margin-top: 8px; font-weight: 600;">Tiada rekod kursus ditemui dalam sistem.</p>
        </td>
      </tr>
    `;
    return;
  }

  pshCourses.forEach((c, index) => {
    const tr = document.createElement('tr');

    // Bil
    const tdBil = document.createElement('td');
    tdBil.style.textAlign = 'center';
    tdBil.textContent = index + 1;
    tr.appendChild(tdBil);

    // ID Kursus
    const tdID = document.createElement('td');
    tdID.style.fontWeight = '700';
    tdID.textContent = c.id;
    tr.appendChild(tdID);

    // Nama Kursus
    const tdNama = document.createElement('td');
    tdNama.style.fontWeight = '600';
    tdNama.textContent = c.nama;
    tr.appendChild(tdNama);

    // Kategori
    const tdKategori = document.createElement('td');
    tdKategori.textContent = c.kategori;
    tr.appendChild(tdKategori);

    // Penceramah
    const tdPenceramah = document.createElement('td');
    tdPenceramah.textContent = c.penceramah;
    tr.appendChild(tdPenceramah);

    // Urusetia
    const tdUrusetia = document.createElement('td');
    tdUrusetia.textContent = c.urusetia;
    tr.appendChild(tdUrusetia);

    // Status Badge
    const tdStatus = document.createElement('td');
    tdStatus.style.textAlign = 'center';
    const isExecuted = c.status === "Telah Dilaksanakan";
    tdStatus.innerHTML = `
      <span class="status-pill ${isExecuted ? 'status-executed' : 'status-pending'}" style="font-size: 11px; padding: 4px 8px;">
        ${isExecuted ? 'Selesai' : 'Belum Selesai'}
      </span>
    `;
    tr.appendChild(tdStatus);

    tbody.appendChild(tr);
  });
}

async function resetSystemDatabase() {
  if (!confirm("AMARAN: Adakah anda benar-benar mahu menetapkan semula pangkalan data? Semua rekod pendaftaran pelajar sedia ada, resit bayaran, dan ulasan laporan bertulis urusetia akan dipadamkan sepenuhnya.")) return;

  if (useMySQL) {
    try {
      const res = await fetch('api.php?action=reset_database', { method: 'POST' });
      if (!res.ok) throw new Error("Gagal menetapkan semula database MySQL");
      await loadDatabase();
    } catch (e) {
      console.error(e);
      showToast("Ralat menetapkan semula MySQL.");
      return;
    }
  } else {
    // Clear local storage
    localStorage.removeItem('psh_courses');
    localStorage.removeItem('psh_gallery');
    localStorage.removeItem('psh_registrations');

    // Reload Database
    await initialiseDatabase();
  }
  
  // Refresh Active Workspace View
  renderAdminDashboard();
  showToast("Sistem PSH berjaya ditetapkan semula ke tetapan asal!");
}


// 8. CONVENIENCE / HELPER FUNCTIONS
function formatDateMalay(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  const year = parts[0];
  const monthNum = parts[1];
  const day = parseInt(parts[2]).toString();

  const monthNames = {
    '01': 'Januari', '02': 'Februari', '03': 'Mac', '04': 'April',
    '05': 'Mei', '06': 'Jun', '07': 'Julai', '08': 'Ogos',
    '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
  };

  return `${day} ${monthNames[monthNum]} ${year}`;
}

function openEvaluationModal(regId) {
  const reg = pshRegistrations.find(x => x.id === regId);
  if (!reg) return;

  document.getElementById('eval-reg-id').value = regId;
  document.getElementById('eval-course-id').value = reg.courseId;
  document.getElementById('eval-course-title').textContent = reg.courseName;
  document.getElementById('eval-course-meta').innerHTML = `<strong>Kod Kursus:</strong> ${reg.courseId} &nbsp;|&nbsp; <strong>No. KP:</strong> ${reg.ic}`;

  // Reset ratings to default (5)
  document.getElementById('eval-rating-speaker').selectedIndex = 0;
  document.getElementById('eval-rating-content').selectedIndex = 0;
  document.getElementById('eval-rating-facilities').selectedIndex = 0;
  document.getElementById('eval-feedback').value = '';

  document.getElementById('evaluation-modal').classList.add('active');
}

function closeEvaluationModal() {
  document.getElementById('evaluation-modal').classList.remove('active');
}

async function handleEvaluationSave(event) {
  event.preventDefault();

  const regId = document.getElementById('eval-reg-id').value;
  const courseId = document.getElementById('eval-course-id').value;
  const ratingSpeaker = parseInt(document.getElementById('eval-rating-speaker').value);
  const ratingContent = parseInt(document.getElementById('eval-rating-content').value);
  const ratingFacilities = parseInt(document.getElementById('eval-rating-facilities').value);
  const feedback = document.getElementById('eval-feedback').value.trim();

  const newEval = {
    id: 'EVAL-' + Date.now(),
    registrationId: regId,
    courseId: courseId,
    ic: currentUserIC,
    ratingSpeaker: ratingSpeaker,
    ratingContent: ratingContent,
    ratingFacilities: ratingFacilities,
    feedback: feedback
  };

  if (useMySQL) {
    try {
      const res = await fetch('api.php?action=add_evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEval)
      });
      if (!res.ok) throw new Error("Gagal menyimpan penilaian ke MySQL");
      
      // Reload database
      await loadDatabase();
    } catch (e) {
      console.error(e);
      showToast("Ralat menyimpan penilaian ke MySQL.");
      return;
    }
  } else {
    // LocalStorage fallback
    pshEvaluations.push(newEval);
    localStorage.setItem('psh_evaluations', JSON.stringify(pshEvaluations));
  }

  closeEvaluationModal();
  showToast("Penilaian kursus anda telah berjaya dihantar! Terima kasih.");
  renderUserHistory();
  renderUserEvaluations();
}

function showToast(message) {
  const toast = document.getElementById('psh-toast');
  const toastMessage = document.getElementById('psh-toast-message');

  toastMessage.textContent = message;
  toast.classList.add('active');

  setTimeout(() => {
    toast.classList.remove('active');
  }, 3500);
}
