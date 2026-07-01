// State Management
let students = [];

// Grade Rules
function getGrade(score) {
  if (score === null || score === undefined) return '-';
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 40) return 'D';
  if (score >= 30) return 'E';
  return 'G';
}

function getGradeColorClass(grade) {
  switch (grade) {
    case 'A': return 'A';
    case 'B': return 'B';
    case 'C': return 'C';
    case 'D': return 'D';
    case 'E': return 'E';
    case 'G': return 'G';
    default: return '';
  }
}

// Check if student passes (Average >= 40)
function getStatus(scores) {
  if (!scores || Object.keys(scores).length === 0) return 'Belum Direkod';
  
  const values = Object.values(scores);
  if (values.length < 5) return 'Belum Direkod';
  
  // Calculate average
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / values.length;
  
  return avg >= 40 ? 'Lulus' : 'Gagal';
}

// Initialise App
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  switchTab('dashboard');
});

// Load from LocalStorage
function loadData() {
  const localData = localStorage.getItem('sabah_students_marks');
  if (localData) {
    students = JSON.parse(localData);
  } else {
    // Initialise students with empty marks
    students = INITIAL_STUDENTS.map(s => ({
      ...s,
      marks: null // { bm: null, bi: null, mt: null, sn: null, sj: null }
    }));
    saveToLocalStorage();
  }
  updateDashboard();
}

function saveToLocalStorage() {
  localStorage.setItem('sabah_students_marks', JSON.stringify(students));
}

// Navigation Tabs Switching
function switchTab(tabId) {
  // Hide all sections
  document.getElementById('section-dashboard').style.display = 'none';
  document.getElementById('section-students').style.display = 'none';
  document.getElementById('section-export').style.display = 'none';
  
  // Reset nav active classes
  document.getElementById('nav-dashboard').classList.remove('active');
  document.getElementById('nav-students').classList.remove('active');
  document.getElementById('nav-export').classList.remove('active');
  
  // Show target section & set active
  if (tabId === 'dashboard') {
    document.getElementById('section-dashboard').style.display = 'block';
    document.getElementById('nav-dashboard').classList.add('active');
    document.getElementById('view-title').textContent = 'Papan Pemuka';
    document.getElementById('view-subtitle').textContent = 'Analisis prestasi dan status rekod markah keseluruhan kelas.';
    updateDashboard();
  } else if (tabId === 'students') {
    document.getElementById('section-students').style.display = 'block';
    document.getElementById('nav-students').classList.add('active');
    document.getElementById('view-title').textContent = 'Buku Rekod Markah';
    document.getElementById('view-subtitle').textContent = 'Urus, cari, dan kemas kini markah bagi setiap pelajar terdaftar.';
    renderStudentsTable();
  } else if (tabId === 'export') {
    document.getElementById('section-export').style.display = 'block';
    document.getElementById('nav-export').classList.add('active');
    document.getElementById('view-title').textContent = 'Eksport & Data';
    document.getElementById('view-subtitle').textContent = 'Muat turun data pelajar dan markah dalam format CSV atau JSON.';
  }
}

// Update Dashboard Statistics and Charts
function updateDashboard() {
  const totalStudents = students.length;
  document.getElementById('stat-total-students').textContent = totalStudents;

  // Filter students who have records
  const recordedStudents = students.filter(s => s.marks !== null && Object.keys(s.marks).length === 5);
  const recordedCount = recordedStudents.length;

  if (recordedCount === 0) {
    document.getElementById('stat-class-avg').textContent = '-';
    document.getElementById('stat-pass-rate').textContent = '-';
    document.getElementById('stat-top-student').textContent = 'Tiada Data';
    document.getElementById('stat-top-student-label').textContent = 'Rekod markah terlebih dahulu';
    
    // Clear chart & distributions
    renderSubjectChart({ bm: 0, bi: 0, mt: 0, sn: 0, sj: 0 });
    updateGradeDistribution({ A: 0, B: 0, C: 0, D: 0, E: 0, G: 0 });
    return;
  }

  // Calculate averages
  let totalClassScore = 0;
  let passCount = 0;
  let topStudent = null;
  let topAverage = -1;

  // Subject sums for chart
  const subjectSums = { bm: 0, bi: 0, mt: 0, sn: 0, sj: 0 };

  recordedStudents.forEach(s => {
    const marks = s.marks;
    const studentTotal = marks.bm + marks.bi + marks.mt + marks.sn + marks.sj;
    const studentAvg = studentTotal / 5;

    totalClassScore += studentAvg;
    
    if (studentAvg >= 40) {
      passCount++;
    }

    // Top Student detection
    if (studentAvg > topAverage) {
      topAverage = studentAvg;
      topStudent = s;
    }

    // Accumulate subject scores
    subjectSums.bm += marks.bm;
    subjectSums.bi += marks.bi;
    subjectSums.mt += marks.mt;
    subjectSums.sn += marks.sn;
    subjectSums.sj += marks.sj;
  });

  // Calculate averages
  const classAverage = totalClassScore / recordedCount;
  const passRate = (passCount / recordedCount) * 100;

  document.getElementById('stat-class-avg').textContent = classAverage.toFixed(1) + '%';
  document.getElementById('stat-pass-rate').textContent = passRate.toFixed(1) + '%';
  
  if (topStudent) {
    document.getElementById('stat-top-student').textContent = topStudent.name;
    document.getElementById('stat-top-student-label').textContent = `Purata: ${topAverage.toFixed(1)}% (${getGrade(topAverage)})`;
  }

  // Subject averages
  const subjectAverages = {
    bm: subjectSums.bm / recordedCount,
    bi: subjectSums.bi / recordedCount,
    mt: subjectSums.mt / recordedCount,
    sn: subjectSums.sn / recordedCount,
    sj: subjectSums.sj / recordedCount
  };

  // Render SVG Chart
  renderSubjectChart(subjectAverages);

  // Grade distributions
  const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, E: 0, G: 0 };
  recordedStudents.forEach(s => {
    const studentAvg = (s.marks.bm + s.marks.bi + s.marks.mt + s.marks.sn + s.marks.sj) / 5;
    const grade = getGrade(studentAvg);
    if (gradeDistribution[grade] !== undefined) {
      gradeDistribution[grade]++;
    }
  });

  updateGradeDistribution(gradeDistribution);
}

// Render SVG Chart Bars Dynamically
function renderSubjectChart(averages) {
  const barsGroup = document.getElementById('chart-bars-group');
  barsGroup.innerHTML = '';

  const subjects = [
    { key: 'bm', label: 'B. Melayu' },
    { key: 'bi', label: 'English' },
    { key: 'mt', label: 'Matematik' },
    { key: 'sn', label: 'Sains' },
    { key: 'sj', label: 'Sejarah' }
  ];

  const chartHeight = 180; // Max amplitude (from y=30 to y=210)
  const baseY = 210;
  const startX = 70;
  const spacing = 80;
  const barWidth = 36;

  subjects.forEach((subj, index) => {
    const score = averages[subj.key] || 0;
    const barHeight = (score / 100) * chartHeight;
    const x = startX + index * spacing;
    const y = baseY - barHeight;

    // Create Bar
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', barWidth);
    rect.setAttribute('height', barHeight);
    rect.setAttribute('class', 'chart-bar');
    
    // Animate height entry
    rect.animate([
      { y: baseY, height: 0 },
      { y: y, height: barHeight }
    ], {
      duration: 600,
      easing: 'ease-out'
    });

    // Create Title / Label (Under Bar)
    const textLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textLabel.setAttribute('x', x + barWidth / 2);
    textLabel.setAttribute('y', 230);
    textLabel.setAttribute('class', 'chart-axis-text');
    textLabel.setAttribute('text-anchor', 'middle');
    textLabel.textContent = subj.label;

    // Create Value text (Above Bar)
    const textVal = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textVal.setAttribute('x', x + barWidth / 2);
    textVal.setAttribute('y', score > 15 ? y + 18 : y - 6);
    textVal.setAttribute('class', 'chart-value-text');
    if (score <= 15) {
      textVal.style.fill = 'var(--text-secondary)';
    }
    textVal.textContent = score.toFixed(1) + '%';

    barsGroup.appendChild(rect);
    barsGroup.appendChild(textLabel);
    barsGroup.appendChild(textVal);
  });
}

// Update Grade distribution bars
function updateGradeDistribution(distribution) {
  const totalRecorded = Object.values(distribution).reduce((a, b) => a + b, 0);

  const grades = ['A', 'B', 'C', 'D', 'E', 'G'];
  grades.forEach(g => {
    const count = distribution[g] || 0;
    const percentage = totalRecorded > 0 ? (count / totalRecorded) * 100 : 0;
    
    const bar = document.getElementById(`dist-bar-${g}`);
    const label = document.getElementById(`dist-count-${g}`);
    
    bar.style.width = percentage + '%';
    label.textContent = count;
  });
}

// Render Gradebook List Table
function renderStudentsTable() {
  const tbody = document.getElementById('student-table-body');
  tbody.innerHTML = '';

  const filtered = getFilteredAndSortedStudents();

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <div class="empty-icon">🔍</div>
          <p>Tiada pelajar yang sepadan dengan carian atau tapisan anda.</p>
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach((s, idx) => {
    const tr = document.createElement('tr');

    // Bil
    const tdBil = document.createElement('td');
    tdBil.style.textAlign = 'center';
    tdBil.textContent = idx + 1;
    tr.appendChild(tdBil);

    // Name
    const tdName = document.createElement('td');
    tdName.className = 'student-name-cell';
    tdName.textContent = s.name;
    tr.appendChild(tdName);

    // IC
    const tdIC = document.createElement('td');
    tdIC.className = 'student-ic-cell';
    tdIC.textContent = s.ic;
    tr.appendChild(tdIC);

    // Gender
    const tdGender = document.createElement('td');
    const genderIcon = s.gender === 'Lelaki' ? '👨' : '👩';
    tdGender.innerHTML = `<span class="gender-icon">${genderIcon}</span>${s.gender}`;
    tr.appendChild(tdGender);

    // Average & Grade
    const tdMarks = document.createElement('td');
    if (s.marks === null) {
      tdMarks.innerHTML = `<span style="color: var(--text-muted);">Belum Direkod</span>`;
    } else {
      const avg = (s.marks.bm + s.marks.bi + s.marks.mt + s.marks.sn + s.marks.sj) / 5;
      const grade = getGrade(avg);
      tdMarks.innerHTML = `<strong>${avg.toFixed(1)}%</strong> <span class="badge badge-gray" style="margin-left: 0.5rem; font-weight:700; border-color:var(--border-color);">${grade}</span>`;
    }
    tr.appendChild(tdMarks);

    // Status
    const tdStatus = document.createElement('td');
    const status = getStatus(s.marks);
    let badgeClass = 'badge-gray';
    if (status === 'Lulus') badgeClass = 'badge-emerald';
    if (status === 'Gagal') badgeClass = 'badge-rose';
    
    tdStatus.innerHTML = `<span class="badge ${badgeClass}">${status}</span>`;
    tr.appendChild(tdStatus);

    // Actions
    const tdAction = document.createElement('td');
    tdAction.style.textAlign = 'center';
    const labelBtn = s.marks === null ? 'Rekod Markah' : 'Edit Markah';
    tdAction.innerHTML = `<button class="record-btn" onclick="openRecordModal('${s.ic}')">${labelBtn}</button>`;
    tr.appendChild(tdAction);

    tbody.appendChild(tr);
  });
}

// Filter and Sort Students Data
function getFilteredAndSortedStudents() {
  const searchQuery = document.getElementById('search-student').value.toLowerCase().trim();
  const genderFilter = document.getElementById('filter-gender').value;
  const statusFilter = document.getElementById('filter-status').value;
  const sortOrder = document.getElementById('sort-order').value;

  // Filter
  let result = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery) || s.ic.includes(searchQuery);
    const matchesGender = genderFilter === 'Semua' || s.gender === genderFilter;
    
    let matchesStatus = true;
    const status = getStatus(s.marks);
    if (statusFilter !== 'Semua') {
      matchesStatus = status === statusFilter;
    }

    return matchesSearch && matchesGender && matchesStatus;
  });

  // Sort
  result.sort((a, b) => {
    if (sortOrder === 'nama-asc') {
      return a.name.localeCompare(b.name);
    } else if (sortOrder === 'nama-desc') {
      return b.name.localeCompare(a.name);
    } else {
      const aAvg = a.marks ? (a.marks.bm + a.marks.bi + a.marks.mt + a.marks.sn + a.marks.sj) / 5 : -1;
      const bAvg = b.marks ? (b.marks.bm + b.marks.bi + b.marks.mt + b.marks.sn + b.marks.sj) / 5 : -1;
      
      if (sortOrder === 'markah-desc') {
        return bAvg - aAvg;
      } else {
        return aAvg - bAvg;
      }
    }
  });

  return result;
}

// Trigger filter rendering
function filterStudentsList() {
  renderStudentsTable();
}

// Modal Management
function openRecordModal(ic) {
  const student = students.find(s => s.ic === ic);
  if (!student) return;

  // Set Metadata
  document.getElementById('modal-student-name').textContent = student.name;
  document.getElementById('modal-student-meta').textContent = `IC: ${student.ic} | Jantina: ${student.gender}`;
  document.getElementById('modal-student-ic').value = student.ic;

  // Set Inputs
  if (student.marks) {
    document.getElementById('score-bm').value = student.marks.bm;
    document.getElementById('score-bi').value = student.marks.bi;
    document.getElementById('score-mt').value = student.marks.mt;
    document.getElementById('score-sn').value = student.marks.sn;
    document.getElementById('score-sj').value = student.marks.sj;
  } else {
    document.getElementById('score-form').reset();
  }

  // Calculate live calculations
  calculateRealtimeStats();

  // Show Modal
  document.getElementById('score-modal').classList.add('active');
}

function closeModal() {
  document.getElementById('score-modal').classList.remove('active');
}

// Calculate score values on input typing
function calculateRealtimeStats() {
  const bm = parseInt(document.getElementById('score-bm').value);
  const bi = parseInt(document.getElementById('score-bi').value);
  const mt = parseInt(document.getElementById('score-mt').value);
  const sn = parseInt(document.getElementById('score-sn').value);
  const sj = parseInt(document.getElementById('score-sj').value);

  // If any input is not loaded / blank
  if (isNaN(bm) || isNaN(bi) || isNaN(mt) || isNaN(sn) || isNaN(sj)) {
    document.getElementById('calc-total').textContent = '-';
    document.getElementById('calc-avg').textContent = '-';
    document.getElementById('calc-grade').textContent = '-';
    document.getElementById('calc-grade').className = 'calc-box-value';
    return;
  }

  const total = bm + bi + mt + sn + sj;
  const avg = total / 5;
  const grade = getGrade(avg);

  document.getElementById('calc-total').textContent = total + ' / 500';
  document.getElementById('calc-avg').textContent = avg.toFixed(1) + '%';
  
  const gradeEl = document.getElementById('calc-grade');
  gradeEl.textContent = grade;
  gradeEl.className = 'calc-box-value ' + getGradeColorClass(grade);
}

// Open Quick Record for first unrecorded student
function openQuickRecord() {
  const unrecorded = students.find(s => s.marks === null);
  if (unrecorded) {
    openRecordModal(unrecorded.ic);
  } else if (students.length > 0) {
    openRecordModal(students[0].ic);
  }
}

// Save student mark details
function saveStudentScore(event) {
  event.preventDefault();

  const ic = document.getElementById('modal-student-ic').value;
  const studentIndex = students.findIndex(s => s.ic === ic);
  if (studentIndex === -1) return;

  const bm = parseInt(document.getElementById('score-bm').value);
  const bi = parseInt(document.getElementById('score-bi').value);
  const mt = parseInt(document.getElementById('score-mt').value);
  const sn = parseInt(document.getElementById('score-sn').value);
  const sj = parseInt(document.getElementById('score-sj').value);

  if (isNaN(bm) || isNaN(bi) || isNaN(mt) || isNaN(sn) || isNaN(sj)) {
    alert('Sila lengkapkan markah untuk semua subjek (0 - 100).');
    return;
  }

  // Validate range
  if ([bm, bi, mt, sn, sj].some(score => score < 0 || score > 100)) {
    alert('Markah mestilah di antara nilai 0 hingga 100.');
    return;
  }

  // Save to State
  students[studentIndex].marks = { bm, bi, mt, sn, sj };
  saveToLocalStorage();
  closeModal();

  // Refresh Views
  const isDashboardActive = document.getElementById('nav-dashboard').classList.contains('active');
  if (isDashboardActive) {
    updateDashboard();
  } else {
    renderStudentsTable();
  }

  // Toast Notification
  showToast(`Markah ${students[studentIndex].name} berjaya disimpan!`);
}

// Toast Feedback Helper
function showToast(message) {
  const toast = document.getElementById('toast-banner');
  document.getElementById('toast-message').textContent = message;
  toast.classList.add('active');

  setTimeout(() => {
    toast.classList.remove('active');
  }, 3000);
}

// Export Database as CSV File
function exportDataAsCSV() {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Nama,No. Kad Pengenalan,Jantina,Bahasa Melayu,English,Matematik,Sains,Sejarah,Purata,Gred,Status\n";

  students.forEach(s => {
    const hasMarks = s.marks !== null;
    const bm = hasMarks ? s.marks.bm : "";
    const bi = hasMarks ? s.marks.bi : "";
    const mt = hasMarks ? s.marks.mt : "";
    const sn = hasMarks ? s.marks.sn : "";
    const sj = hasMarks ? s.marks.sj : "";
    
    let avg = "";
    let grade = "";
    let status = "Belum Direkod";
    
    if (hasMarks) {
      avg = ((s.marks.bm + s.marks.bi + s.marks.mt + s.marks.sn + s.marks.sj) / 5).toFixed(2);
      grade = getGrade(parseFloat(avg));
      status = getStatus(s.marks);
    }

    // Escape commas
    const escapedName = `"${s.name.replace(/"/g, '""')}"`;
    csvContent += `${escapedName},${s.ic},${s.gender},${bm},${bi},${mt},${sn},${sj},${avg},${grade},${status}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `laporan_markah_pelajar_sabah_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("Laporan CSV berjaya dimuat turun!");
}

// Export Database as JSON file
function exportDataAsJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(students, null, 2));
  const link = document.createElement("a");
  link.setAttribute("href", dataStr);
  link.setAttribute("download", `sabah_students_marks_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("Laporan JSON berjaya dimuat turun!");
}

// Reset LocalStorage and set default student list
function resetAllData() {
  if (confirm("Adakah anda pasti mahu memadamkan semua rekod markah pelajar? Tindakan ini tidak boleh diundur.")) {
    localStorage.removeItem('sabah_students_marks');
    loadData();
    const isDashboardActive = document.getElementById('nav-dashboard').classList.contains('active');
    if (isDashboardActive) {
      updateDashboard();
    } else {
      renderStudentsTable();
    }
    showToast("Semua rekod markah telah berjaya dipadamkan!");
  }
}
