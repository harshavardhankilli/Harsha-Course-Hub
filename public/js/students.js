/**
 * Harsha CourseHub — Students Management Controller
 * Designed & Developed by Harsha
 */

const StudentsPage = {
  studentsList: [],
  selectedStudentId: null,
  currentSort: 'roll_asc',

  init() {
    this.bindEvents();
    this.updateSortIcons();
    this.fetchStudents();

    // Check if open=add query param is present
    const params = new URLSearchParams(window.location.search);
    if (params.get('open') === 'add') {
      setTimeout(() => this.openAddModal(), 150);
    }
  },

  bindEvents() {
    const searchInput = document.getElementById('search-input');
    const branchFilter = document.getElementById('branch-filter');

    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => this.fetchStudents(), 200);
      });
    }

    if (branchFilter) {
      branchFilter.addEventListener('change', () => this.fetchStudents());
    }
  },

  onSortChange(value) {
    this.currentSort = value || 'roll_asc';
    this.updateSortIcons();
    this.fetchStudents();
  },

  toggleSort(column) {
    if (column === 'roll') {
      this.currentSort = this.currentSort === 'roll_asc' ? 'roll_desc' : 'roll_asc';
    } else if (column === 'name') {
      this.currentSort = this.currentSort === 'name_asc' ? 'name_desc' : 'name_asc';
    } else if (column === 'courses') {
      this.currentSort = this.currentSort === 'courses_desc' ? 'courses_asc' : 'courses_desc';
    }
    const sortFilter = document.getElementById('sort-filter');
    if (sortFilter) {
      sortFilter.value = this.currentSort;
    }
    this.updateSortIcons();
    this.fetchStudents();
  },

  updateSortIcons() {
    const iconRoll = document.getElementById('sort-icon-roll');
    const iconName = document.getElementById('sort-icon-name');
    const iconCourses = document.getElementById('sort-icon-courses');

    if (iconRoll) iconRoll.innerText = this.currentSort === 'roll_asc' ? '▲' : (this.currentSort === 'roll_desc' ? '▼' : '');
    if (iconName) iconName.innerText = this.currentSort === 'name_asc' ? '▲' : (this.currentSort === 'name_desc' ? '▼' : '');
    if (iconCourses) iconCourses.innerText = this.currentSort === 'courses_asc' ? '▲' : (this.currentSort === 'courses_desc' ? '▼' : '');
  },

  resetFilters() {
    const s = document.getElementById('search-input');
    const b = document.getElementById('branch-filter');
    const sf = document.getElementById('sort-filter');
    if (s) s.value = '';
    if (b) b.value = 'all';
    if (sf) sf.value = 'roll_asc';
    this.currentSort = 'roll_asc';
    this.updateSortIcons();
    this.fetchStudents();
  },

  async fetchStudents() {
    const tbody = document.getElementById('students-tbody');
    const countBadge = document.getElementById('student-count-badge');
    const search = document.getElementById('search-input')?.value.trim() || '';
    const branch = document.getElementById('branch-filter')?.value || 'all';

    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="loading-state">
          <div class="spinner"></div>
          <span>Loading student records...</span>
        </td>
      </tr>
    `;

    try {
      let url = `/api/students?sort=${encodeURIComponent(this.currentSort)}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (branch && branch !== 'all') url += `branch=${encodeURIComponent(branch)}&`;

      const res = await App.apiRequest(url);
      this.studentsList = res.data || [];
      if (countBadge) {
        countBadge.innerText = `Showing ${this.studentsList.length} student${this.studentsList.length === 1 ? '' : 's'}`;
      }
      this.renderStudents();
    } catch (err) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 36px; color: var(--status-drop-text);">
            <strong>Failed to load students directory.</strong><br>
            <span style="font-size: 0.8rem; color: var(--text-secondary);">${App.escapeHtml(err.message)}</span>
          </td>
        </tr>
      `;
    }
  },

  renderStudents() {
    const tbody = document.getElementById('students-tbody');

    if (this.studentsList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-state">
            <div class="empty-state-icon">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            </div>
            <h3>No Students Found</h3>
            <p>No matching student records located.</p>
            <button class="btn btn-primary btn-sm" onclick="StudentsPage.openAddModal()">Add Student</button>
          </td>
        </tr>
      `;
      return;
    }

    // Exactly 6 columns: Student Name, Roll Number, Branch, Email, Courses Enrolled, Actions
    tbody.innerHTML = this.studentsList.map(s => {
      const courseCount = s.registered_courses_count || 0;
      return `
        <tr>
          <td>
            <a href="student-details.html?id=${s.student_id}" style="font-weight: 600; color: var(--text-primary);" title="View Student Details">
              ${App.escapeHtml(s.name)}
            </a>
          </td>
          <td><code>${App.escapeHtml(s.roll_no)}</code></td>
          <td style="color: var(--text-primary); font-size: 0.84rem;">${App.escapeHtml(s.branch)}</td>
          <td style="color: var(--text-secondary); font-size: 0.84rem;">${App.escapeHtml(s.email)}</td>
          <td>
            <span style="font-weight: 600; color: var(--text-primary);">${courseCount}</span>
            <span style="color: var(--text-secondary); font-size: 0.78rem;"> course${courseCount === 1 ? '' : 's'}</span>
          </td>
          <td style="text-align: right;">
            <div class="action-buttons" style="justify-content: flex-end;">
              <a href="student-details.html?id=${s.student_id}" class="btn btn-secondary btn-sm" title="View Details">Details</a>
              <button class="btn btn-secondary btn-sm" onclick="StudentsPage.openEditModal(${s.student_id})" title="Edit Student">Edit</button>
              <button class="btn btn-danger btn-sm" onclick="StudentsPage.openDeleteModal(${s.student_id})" title="Delete Student">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  openAddModal() {
    document.getElementById('add-student-form')?.reset();
    App.openModal('addStudentModal');
    setTimeout(() => document.getElementById('add-name')?.focus(), 100);
  },

  async handleAddSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-add');
    const originalText = btn.innerText;

    const payload = {
      name: document.getElementById('add-name').value.trim(),
      roll_no: document.getElementById('add-roll').value.trim(),
      branch: document.getElementById('add-branch').value.trim(),
      email: document.getElementById('add-email').value.trim()
    };

    if (!payload.name || !payload.roll_no || !payload.branch || !payload.email) {
      App.showToast('warning', 'Missing Fields', 'Please complete all required fields.');
      return;
    }

    try {
      btn.disabled = true;
      btn.innerText = 'Saving...';

      const res = await App.apiRequest('/api/students', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      App.showToast('success', 'Student Enrolled', res.message || 'Student created successfully!');
      App.closeModal('addStudentModal');
      this.fetchStudents();
    } catch (err) {
      App.showToast('error', 'Enrollment Error', err.message);
    } finally {
      btn.disabled = false;
      btn.innerText = originalText;
    }
  },

  openEditModal(studentId) {
    const student = this.studentsList.find(s => s.student_id === studentId);
    if (!student) return;

    this.selectedStudentId = studentId;
    document.getElementById('edit-id').value = student.student_id;
    document.getElementById('edit-name').value = student.name;
    document.getElementById('edit-roll').value = student.roll_no;
    document.getElementById('edit-branch').value = student.branch;
    document.getElementById('edit-email').value = student.email;

    App.openModal('editStudentModal');
  },

  async handleEditSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-edit');
    const originalText = btn.innerText;
    const studentId = document.getElementById('edit-id').value;

    const payload = {
      name: document.getElementById('edit-name').value.trim(),
      roll_no: document.getElementById('edit-roll').value.trim(),
      branch: document.getElementById('edit-branch').value.trim(),
      email: document.getElementById('edit-email').value.trim()
    };

    try {
      btn.disabled = true;
      btn.innerText = 'Saving...';

      const res = await App.apiRequest(`/api/students/${studentId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      App.showToast('success', 'Changes Saved', res.message || 'Student updated successfully.');
      App.closeModal('editStudentModal');
      this.fetchStudents();
    } catch (err) {
      App.showToast('error', 'Update Failed', err.message);
    } finally {
      btn.disabled = false;
      btn.innerText = originalText;
    }
  },

  openDeleteModal(studentId) {
    const student = this.studentsList.find(s => s.student_id === studentId);
    if (!student) return;

    this.selectedStudentId = studentId;
    document.getElementById('delete-student-name').innerText = student.name;
    document.getElementById('delete-student-roll').innerText = student.roll_no;

    const warningBox = document.getElementById('delete-warning-box');
    const courseCount = student.registered_courses_count || 0;
    if (warningBox) {
      if (courseCount > 0) {
        warningBox.innerHTML = `⚠️ <strong>Attention:</strong> This student is currently registered for <strong>${courseCount} course(s)</strong>. Deleting this record will automatically remove all course registration relationships.`;
      } else {
        warningBox.innerHTML = `This student currently has 0 course registrations. Record will be permanently removed.`;
      }
    }

    App.openModal('deleteStudentModal');
  },

  async confirmDelete() {
    if (!this.selectedStudentId) return;
    const btn = document.getElementById('btn-confirm-delete');
    const originalText = btn.innerText;

    try {
      btn.disabled = true;
      btn.innerText = 'Deleting...';

      const res = await App.apiRequest(`/api/students/${this.selectedStudentId}`, {
        method: 'DELETE'
      });

      App.showToast('success', 'Record Deleted', res.message || 'Student deleted successfully.');
      App.closeModal('deleteStudentModal');
      this.fetchStudents();
    } catch (err) {
      App.showToast('error', 'Delete Failed', err.message);
    } finally {
      btn.disabled = false;
      btn.innerText = originalText;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  StudentsPage.init();
});
