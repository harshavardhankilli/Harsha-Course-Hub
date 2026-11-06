/**
 * Harsha CourseHub — Courses Catalog Controller
 * Designed & Developed by Harsha
 */

const CoursesPage = {
  coursesList: [],
  selectedCourseId: null,
  currentSort: 'code_asc',

  init() {
    this.bindEvents();
    this.updateSortIcons();
    this.fetchCourses();

    const params = new URLSearchParams(window.location.search);
    if (params.get('open') === 'add') {
      setTimeout(() => this.openAddModal(), 150);
    }
  },

  bindEvents() {
    const searchInput = document.getElementById('course-search');
    const deptFilter = document.getElementById('department-filter');
    const semFilter = document.getElementById('semester-filter');

    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => this.fetchCourses(), 200);
      });
    }

    if (deptFilter) {
      deptFilter.addEventListener('change', () => this.fetchCourses());
    }

    if (semFilter) {
      semFilter.addEventListener('change', () => this.fetchCourses());
    }
  },

  toggleSort(column) {
    if (column === 'code') {
      this.currentSort = this.currentSort === 'code_asc' ? 'code_desc' : 'code_asc';
    } else if (column === 'name') {
      this.currentSort = this.currentSort === 'name_asc' ? 'name_desc' : 'name_asc';
    } else if (column === 'credits') {
      this.currentSort = this.currentSort === 'credits_asc' ? 'credits_desc' : 'credits_asc';
    } else if (column === 'enrolled') {
      this.currentSort = this.currentSort === 'enrolled_desc' ? 'enrolled_asc' : 'enrolled_desc';
    }
    this.updateSortIcons();
    this.applySort();
    this.renderCourses();
  },

  updateSortIcons() {
    const code = document.getElementById('sort-course-code');
    const name = document.getElementById('sort-course-name');
    const credits = document.getElementById('sort-course-credits');
    const enrolled = document.getElementById('sort-course-enrolled');

    if (code) code.innerText = this.currentSort === 'code_asc' ? '▲' : (this.currentSort === 'code_desc' ? '▼' : '');
    if (name) name.innerText = this.currentSort === 'name_asc' ? '▲' : (this.currentSort === 'name_desc' ? '▼' : '');
    if (credits) credits.innerText = this.currentSort === 'credits_asc' ? '▲' : (this.currentSort === 'credits_desc' ? '▼' : '');
    if (enrolled) enrolled.innerText = this.currentSort === 'enrolled_asc' ? '▲' : (this.currentSort === 'enrolled_desc' ? '▼' : '');
  },

  applySort() {
    if (this.currentSort === 'code_asc') {
      this.coursesList.sort((a, b) => a.course_code.localeCompare(b.course_code));
    } else if (this.currentSort === 'code_desc') {
      this.coursesList.sort((a, b) => b.course_code.localeCompare(a.course_code));
    } else if (this.currentSort === 'name_asc') {
      this.coursesList.sort((a, b) => a.course_name.localeCompare(b.course_name));
    } else if (this.currentSort === 'name_desc') {
      this.coursesList.sort((a, b) => b.course_name.localeCompare(a.course_name));
    } else if (this.currentSort === 'credits_asc') {
      this.coursesList.sort((a, b) => a.credits - b.credits);
    } else if (this.currentSort === 'credits_desc') {
      this.coursesList.sort((a, b) => b.credits - a.credits);
    } else if (this.currentSort === 'enrolled_desc') {
      this.coursesList.sort((a, b) => (b.enrolled_students_count || 0) - (a.enrolled_students_count || 0));
    } else if (this.currentSort === 'enrolled_asc') {
      this.coursesList.sort((a, b) => (a.enrolled_students_count || 0) - (b.enrolled_students_count || 0));
    }
  },

  resetFilters() {
    const s = document.getElementById('course-search');
    const d = document.getElementById('department-filter');
    const sem = document.getElementById('semester-filter');
    if (s) s.value = '';
    if (d) d.value = 'all';
    if (sem) sem.value = 'all';
    this.currentSort = 'code_asc';
    this.updateSortIcons();
    this.fetchCourses();
  },

  async fetchCourses() {
    const tbody = document.getElementById('courses-tbody');
    const countBadge = document.getElementById('course-count-badge');
    const search = document.getElementById('course-search')?.value.trim() || '';
    const dept = document.getElementById('department-filter')?.value || 'all';
    const sem = document.getElementById('semester-filter')?.value || 'all';

    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="loading-state">
          <div class="spinner"></div>
          <span>Loading course catalog...</span>
        </td>
      </tr>
    `;

    try {
      let url = `/api/courses?`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (dept && dept !== 'all') url += `department=${encodeURIComponent(dept)}&`;
      if (sem && sem !== 'all') url += `semester=${encodeURIComponent(sem)}&`;

      const res = await App.apiRequest(url);
      this.coursesList = res.data || [];
      this.applySort();
      if (countBadge) {
        countBadge.innerText = `Showing ${this.coursesList.length} course${this.coursesList.length === 1 ? '' : 's'}`;
      }
      this.renderCourses();
    } catch (err) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 36px; color: var(--status-drop-text);">
            <strong>Failed to load course catalog.</strong><br>
            <span style="font-size: 0.8rem; color: var(--text-secondary);">${App.escapeHtml(err.message)}</span>
          </td>
        </tr>
      `;
    }
  },

  renderCourses() {
    const tbody = document.getElementById('courses-tbody');

    if (this.coursesList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-state">
            <div class="empty-state-icon">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
            </div>
            <h3>No Courses Found</h3>
            <p>No matching courses located in the catalog.</p>
            <button class="btn btn-primary btn-sm" onclick="CoursesPage.openAddModal()">Add Course</button>
          </td>
        </tr>
      `;
      return;
    }

    // Exactly 7 columns:
    // 1. Course Code, 2. Course Name, 3. Credits, 4. Department, 5. Semester, 6. Enrolled Students, 7. Actions
    tbody.innerHTML = this.coursesList.map(c => {
      const enrolledCount = c.enrolled_students_count || 0;
      return `
        <tr>
          <td>
            <span class="badge badge-course">${App.escapeHtml(c.course_code)}</span>
          </td>
          <td style="font-weight: 600; color: var(--text-primary); font-size: 0.86rem;">
            ${App.escapeHtml(c.course_name)}
          </td>
          <td>
            <strong>${c.credits}</strong> <span style="font-size: 0.76rem; color: var(--text-secondary);">Credits</span>
          </td>
          <td style="color: var(--text-primary); font-size: 0.84rem;">
            ${App.escapeHtml(c.department)}
          </td>
          <td style="color: var(--text-secondary); font-size: 0.84rem;">
            ${App.escapeHtml(c.semester)}
          </td>
          <td>
            <span style="font-weight: 600; color: var(--text-primary);">${enrolledCount}</span>
            <span style="color: var(--text-secondary); font-size: 0.78rem;"> enrolled</span>
          </td>
          <td style="text-align: right;">
            <div class="action-buttons" style="justify-content: flex-end;">
              <a href="register.html?course_id=${c.course_id}" class="btn btn-primary btn-sm" title="Register student for this course">Register Student</a>
              <button class="btn btn-secondary btn-sm" onclick="CoursesPage.openEditModal(${c.course_id})" title="Edit Course">Edit</button>
              <button class="btn btn-danger btn-sm" onclick="CoursesPage.openDeleteModal(${c.course_id})" title="Delete Course">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  openAddModal() {
    document.getElementById('add-course-form')?.reset();
    App.openModal('addCourseModal');
    setTimeout(() => document.getElementById('add-code')?.focus(), 100);
  },

  async handleAddSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-add-course');
    const originalText = btn.innerText;

    const payload = {
      course_code: document.getElementById('add-code').value.trim().toUpperCase(),
      course_name: document.getElementById('add-title').value.trim(),
      credits: parseInt(document.getElementById('add-credits').value, 10),
      department: document.getElementById('add-dept').value.trim(),
      semester: document.getElementById('add-sem').value.trim()
    };

    if (!payload.course_code || !payload.course_name || !payload.credits || !payload.department || !payload.semester) {
      App.showToast('warning', 'Missing Fields', 'Please complete all required course fields.');
      return;
    }

    try {
      btn.disabled = true;
      btn.innerText = 'Saving...';

      const res = await App.apiRequest('/api/courses', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      App.showToast('success', 'Course Created', res.message || 'Course added to catalog successfully!');
      App.closeModal('addCourseModal');
      this.fetchCourses();
    } catch (err) {
      App.showToast('error', 'Creation Error', err.message);
    } finally {
      btn.disabled = false;
      btn.innerText = originalText;
    }
  },

  openEditModal(courseId) {
    const course = this.coursesList.find(c => c.course_id === courseId);
    if (!course) return;

    this.selectedCourseId = courseId;
    document.getElementById('edit-course-id').value = course.course_id;
    document.getElementById('edit-code').value = course.course_code;
    document.getElementById('edit-title').value = course.course_name;
    document.getElementById('edit-credits').value = course.credits;
    document.getElementById('edit-dept').value = course.department;
    document.getElementById('edit-sem').value = course.semester;

    App.openModal('editCourseModal');
  },

  async handleEditSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-edit-course');
    const originalText = btn.innerText;
    const courseId = document.getElementById('edit-course-id').value;

    const payload = {
      course_code: document.getElementById('edit-code').value.trim().toUpperCase(),
      course_name: document.getElementById('edit-title').value.trim(),
      credits: parseInt(document.getElementById('edit-credits').value, 10),
      department: document.getElementById('edit-dept').value.trim(),
      semester: document.getElementById('edit-sem').value.trim()
    };

    try {
      btn.disabled = true;
      btn.innerText = 'Saving...';

      const res = await App.apiRequest(`/api/courses/${courseId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      App.showToast('success', 'Changes Saved', res.message || 'Course updated successfully.');
      App.closeModal('editCourseModal');
      this.fetchCourses();
    } catch (err) {
      App.showToast('error', 'Update Error', err.message);
    } finally {
      btn.disabled = false;
      btn.innerText = originalText;
    }
  },

  openDeleteModal(courseId) {
    const course = this.coursesList.find(c => c.course_id === courseId);
    if (!course) return;

    this.selectedCourseId = courseId;
    document.getElementById('delete-course-code').innerText = course.course_code;
    document.getElementById('delete-course-name').innerText = course.course_name;

    const warningBox = document.getElementById('delete-course-warning');
    const enrolled = course.enrolled_students_count || 0;
    if (warningBox) {
      if (enrolled > 0) {
        warningBox.innerHTML = `⚠️ <strong>Attention:</strong> There are currently <strong>${enrolled} student(s)</strong> registered for this course. Deleting it will also remove their registration allocations.`;
      } else {
        warningBox.innerHTML = `This course currently has 0 enrolled students. Course will be permanently removed.`;
      }
    }

    App.openModal('deleteCourseModal');
  },

  async confirmDelete() {
    if (!this.selectedCourseId) return;
    const btn = document.getElementById('btn-confirm-delete-course');
    const originalText = btn.innerText;

    try {
      btn.disabled = true;
      btn.innerText = 'Deleting...';

      const res = await App.apiRequest(`/api/courses/${this.selectedCourseId}`, {
        method: 'DELETE'
      });

      App.showToast('success', 'Course Deleted', res.message || 'Course removed.');
      App.closeModal('deleteCourseModal');
      this.fetchCourses();
    } catch (err) {
      App.showToast('error', 'Delete Error', err.message);
    } finally {
      btn.disabled = false;
      btn.innerText = originalText;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  CoursesPage.init();
});
