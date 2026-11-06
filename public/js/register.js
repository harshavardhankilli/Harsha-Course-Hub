/**
 * Harsha CourseHub — Sequential Course Registration Controller
 * Designed & Developed by Harsha
 */

const RegisterWorkflow = {
  students: [],
  courses: [],
  selectedStudent: null,
  selectedCourse: null,
  courseFilter: 'all',
  focusedAutocompleteIndex: -1,

  async init() {
    this.bindDocumentEvents();
    await this.loadStudents();

    // Check pre-selected student or course from URL
    const params = new URLSearchParams(window.location.search);
    const preStudentId = params.get('student_id');
    const preCourseId = params.get('course_id');

    if (preStudentId) {
      const studentId = parseInt(preStudentId, 10);
      if (!isNaN(studentId)) {
        await this.selectStudent(studentId, preCourseId);
      }
    } else if (preCourseId) {
      this.pendingPreCourseId = preCourseId;
    }
  },

  bindDocumentEvents() {
    // Close autocomplete on click outside
    document.addEventListener('click', (e) => {
      const wrapper = document.querySelector('.search-box-wrapper');
      if (wrapper && !wrapper.contains(e.target)) {
        this.hideAutocomplete();
      }
    });
  },

  async loadStudents() {
    try {
      // Fetch sorted roll-number wise by default
      const res = await App.apiRequest('/api/students?sort=roll_asc');
      this.students = res.data || [];
      this.populateStudentDropdown(this.students);
      const indicator = document.getElementById('student-count-indicator');
      if (indicator) {
        indicator.innerText = `${this.students.length} students enrolled`;
      }
    } catch (err) {
      App.showToast('error', 'Error Loading Students', err.message);
    }
  },

  populateStudentDropdown(list) {
    const select = document.getElementById('select-student');
    if (!select) return;

    const currentVal = select.value;
    select.innerHTML = '<option value="">-- Choose Student --</option>' +
      list.map(s => `
        <option value="${s.student_id}">${App.escapeHtml(s.name)} (${App.escapeHtml(s.roll_no)}) — ${App.escapeHtml(s.branch)}</option>
      `).join('');

    if (currentVal && list.some(s => s.student_id == currentVal)) {
      select.value = currentVal;
    }
  },

  /* ==========================================================
   * Live Autocomplete Suggestions
   * ========================================================== */
  onSearchInput(value) {
    const term = (value || '').trim();
    const clearBtn = document.getElementById('student-clear-btn');
    if (clearBtn) {
      clearBtn.style.display = term ? 'flex' : 'none';
    }

    if (!term) {
      this.hideAutocomplete();
      return;
    }

    this.renderAutocompleteDropdown(term);
  },

  onSearchFocus() {
    const input = document.getElementById('student-search-box');
    const term = input ? input.value.trim() : '';
    // If not selected or has text, show matching/recent
    if (!this.selectedStudent) {
      this.renderAutocompleteDropdown(term);
    }
  },

  renderAutocompleteDropdown(term) {
    const dropdown = document.getElementById('student-autocomplete-dropdown');
    if (!dropdown) return;

    const lowerTerm = term.toLowerCase();
    const filtered = this.students.filter(s =>
      !lowerTerm ||
      s.name.toLowerCase().includes(lowerTerm) ||
      s.roll_no.toLowerCase().includes(lowerTerm) ||
      s.branch.toLowerCase().includes(lowerTerm) ||
      s.email.toLowerCase().includes(lowerTerm)
    ).slice(0, 8); // Top 8 matches for snappy UX

    this.focusedAutocompleteIndex = -1;

    if (filtered.length === 0) {
      dropdown.innerHTML = `
        <div style="padding: 14px; text-align: center; color: var(--text-secondary); font-size: 0.82rem;">
          No student found matching "<strong>${App.escapeHtml(term)}</strong>"
        </div>
      `;
      dropdown.style.display = 'block';
      return;
    }

    dropdown.innerHTML = filtered.map((s, idx) => {
      const highlightedName = this.highlightMatch(s.name, term);
      const highlightedRoll = this.highlightMatch(s.roll_no, term);
      const initials = s.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

      return `
        <div class="autocomplete-item" data-index="${idx}" onclick="RegisterWorkflow.selectStudent(${s.student_id})">
          <div style="display: flex; align-items: center; min-width: 0;">
            <div class="autocomplete-avatar">${initials}</div>
            <div style="min-width: 0;">
              <div style="font-size: 0.86rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${highlightedName}
              </div>
              <div style="font-size: 0.74rem; color: var(--text-secondary);">
                ${highlightedRoll} • ${App.escapeHtml(s.branch)}
              </div>
            </div>
          </div>
          <span class="badge badge-course" style="font-size: 0.72rem; margin-left: 8px; flex-shrink: 0;">
            ${s.registered_courses_count || 0} courses
          </span>
        </div>
      `;
    }).join('');

    dropdown.style.display = 'block';
  },

  highlightMatch(text, term) {
    if (!text) return '';
    if (!term) return App.escapeHtml(text);
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedTerm})`, 'gi');
    return App.escapeHtml(text).replace(regex, '<mark>$1</mark>');
  },

  hideAutocomplete() {
    const dropdown = document.getElementById('student-autocomplete-dropdown');
    if (dropdown) dropdown.style.display = 'none';
    this.focusedAutocompleteIndex = -1;
  },

  onSearchKeyDown(event) {
    const dropdown = document.getElementById('student-autocomplete-dropdown');
    if (!dropdown || dropdown.style.display === 'none') return;

    const items = dropdown.querySelectorAll('.autocomplete-item');
    if (items.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.focusedAutocompleteIndex = (this.focusedAutocompleteIndex + 1) % items.length;
      this.updateAutocompleteFocus(items);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.focusedAutocompleteIndex = (this.focusedAutocompleteIndex - 1 + items.length) % items.length;
      this.updateAutocompleteFocus(items);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (this.focusedAutocompleteIndex >= 0 && items[this.focusedAutocompleteIndex]) {
        items[this.focusedAutocompleteIndex].click();
      } else if (items.length > 0) {
        items[0].click();
      }
    } else if (event.key === 'Escape') {
      this.hideAutocomplete();
    }
  },

  updateAutocompleteFocus(items) {
    items.forEach((item, idx) => {
      if (idx === this.focusedAutocompleteIndex) {
        item.classList.add('focused');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('focused');
      }
    });
  },

  /* ==========================================================
   * Student Selection & Lifecycle
   * ========================================================== */
  async selectStudent(studentId, desiredCourseId = null) {
    const student = this.students.find(s => s.student_id === studentId);
    if (!student) return;

    this.selectedStudent = student;
    this.hideAutocomplete();

    // Fill search box
    const searchInput = document.getElementById('student-search-box');
    if (searchInput) {
      searchInput.value = `${student.name} (${student.roll_no})`;
    }

    const clearBtn = document.getElementById('student-clear-btn');
    if (clearBtn) clearBtn.style.display = 'flex';

    // Sync select dropdown
    const select = document.getElementById('select-student');
    if (select) {
      select.value = studentId;
    }

    await this.onStudentSelected(desiredCourseId);
  },

  onSelectDropdownChange() {
    const select = document.getElementById('select-student');
    const studentId = parseInt(select.value, 10);
    if (isNaN(studentId)) {
      this.clearStudentSelection();
    } else {
      this.selectStudent(studentId);
    }
  },

  clearStudentSelection() {
    this.selectedStudent = null;
    this.selectedCourse = null;

    const searchInput = document.getElementById('student-search-box');
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }

    const clearBtn = document.getElementById('student-clear-btn');
    if (clearBtn) clearBtn.style.display = 'none';

    const select = document.getElementById('select-student');
    if (select) select.value = '';

    const summaryBox = document.getElementById('student-summary');
    if (summaryBox) summaryBox.classList.remove('active');

    const step1Status = document.getElementById('step-1-status');
    const step2Status = document.getElementById('step-2-status');
    if (step1Status) step1Status.innerText = 'Type name or roll number below';
    if (step2Status) step2Status.innerText = 'Select student in Step 1 first';

    const courseSearchInput = document.getElementById('course-search-box');
    if (courseSearchInput) {
      courseSearchInput.value = '';
      courseSearchInput.disabled = true;
    }

    const courseList = document.getElementById('course-list-container');
    if (courseList) {
      courseList.innerHTML = `
        <div class="loading-state" style="padding: 24px 10px;">
          <span>Please select a student above to view course options.</span>
        </div>
      `;
    }

    this.updateReviewBox();
    this.hideAutocomplete();
  },

  async onStudentSelected(desiredCourseId = null) {
    if (!this.selectedStudent) return;

    const summaryBox = document.getElementById('student-summary');
    const step1Status = document.getElementById('step-1-status');
    const step2Status = document.getElementById('step-2-status');
    const courseSearchInput = document.getElementById('course-search-box');
    const courseList = document.getElementById('course-list-container');

    // Reset selected course
    this.selectedCourse = null;
    this.updateReviewBox();

    // Populate summary card
    const nameElem = document.getElementById('summary-name');
    const rollElem = document.getElementById('summary-roll');
    const branchElem = document.getElementById('summary-branch');
    const emailElem = document.getElementById('summary-email');
    const avatarElem = document.getElementById('summary-avatar');

    if (nameElem) nameElem.innerText = this.selectedStudent.name;
    if (rollElem) rollElem.innerText = this.selectedStudent.roll_no;
    if (branchElem) branchElem.innerText = this.selectedStudent.branch;
    if (emailElem) emailElem.innerText = this.selectedStudent.email;
    if (avatarElem) {
      const initials = this.selectedStudent.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
      avatarElem.innerText = initials;
    }

    summaryBox.classList.add('active');

    if (step1Status) {
      step1Status.innerHTML = `<span style="color: var(--status-reg-text); font-weight: 600;">✓ ${App.escapeHtml(this.selectedStudent.name)}</span>`;
    }
    if (step2Status) {
      step2Status.innerText = 'Choose an eligible course';
    }
    if (courseSearchInput) {
      courseSearchInput.disabled = false;
    }

    // Set Recommended button text
    const pillBranch = document.getElementById('pill-branch');
    if (pillBranch) {
      const shortBranch = this.getShortBranchName(this.selectedStudent.branch);
      pillBranch.innerText = `★ Recommended (${shortBranch})`;
    }

    // Load student's course status
    courseList.innerHTML = `
      <div class="loading-state" style="padding: 20px 10px;">
        <div class="spinner"></div>
        <span>Checking enrollments and academic eligibility...</span>
      </div>
    `;

    try {
      const res = await App.apiRequest(`/api/registrations/student/${this.selectedStudent.student_id}/course-status`);
      this.courses = res.data || [];

      // Calculate enrolled credits
      this.updateCreditMeter();

      const courseToPreSelect = desiredCourseId || this.pendingPreCourseId;
      this.pendingPreCourseId = null;
      this.renderCourses(courseToPreSelect);
    } catch (err) {
      courseList.innerHTML = `
        <div style="padding: 20px; text-align: center; color: var(--status-drop-text);">
          Failed to load courses: ${App.escapeHtml(err.message)}
        </div>
      `;
    }
  },

  getShortBranchName(branchName) {
    if (!branchName) return 'Branch';
    if (branchName.includes('Computer Science')) return 'CSE';
    if (branchName.includes('Artificial Intelligence')) return 'AI&DS';
    if (branchName.includes('Information Technology')) return 'IT';
    if (branchName.includes('Electronics and Communication')) return 'ECE';
    if (branchName.includes('Electrical and Electronics')) return 'EEE';
    if (branchName.includes('Mechanical')) return 'MECH';
    if (branchName.includes('Civil')) return 'CIVIL';
    return branchName;
  },

  updateCreditMeter() {
    const enrolledCourses = this.courses.filter(c => c.is_registered === 1);
    const totalCredits = enrolledCourses.reduce((sum, c) => sum + Number(c.credits || 0), 0);
    const maxCredits = 24;

    const countElem = document.getElementById('summary-courses-count');
    if (countElem) {
      countElem.innerText = `${enrolledCourses.length} course${enrolledCourses.length === 1 ? '' : 's'}`;
    }

    const meterText = document.getElementById('credit-meter-text');
    const meterFill = document.getElementById('credit-progress-fill');

    if (meterText) {
      meterText.innerText = `${totalCredits} / ${maxCredits} Credits`;
    }

    if (meterFill) {
      const pct = Math.min(100, Math.round((totalCredits / maxCredits) * 100));
      meterFill.style.width = `${pct}%`;
      meterFill.className = 'credit-progress-fill';
      if (totalCredits >= 24) {
        meterFill.classList.add('max');
      } else if (totalCredits >= 20) {
        meterFill.classList.add('warn');
      }
    }
  },

  /* ==========================================================
   * Course Filtering & Selection
   * ========================================================== */
  setCourseFilter(filter) {
    this.courseFilter = filter;
    const pills = document.querySelectorAll('.course-filter-pills .filter-pill');
    pills.forEach(p => p.classList.remove('active'));

    const activePill = document.getElementById(`pill-${filter}`);
    if (activePill) activePill.classList.add('active');

    this.renderCourses();
  },

  filterCourseList() {
    this.renderCourses();
  },

  renderCourses(autoSelectId = null) {
    const container = document.getElementById('course-list-container');
    const term = document.getElementById('course-search-box')?.value.toLowerCase().trim() || '';

    let list = this.courses;

    // Filter by search query
    if (term) {
      list = list.filter(c =>
        c.course_code.toLowerCase().includes(term) ||
        c.course_name.toLowerCase().includes(term) ||
        c.department.toLowerCase().includes(term)
      );
    }

    // Filter by pill category
    if (this.courseFilter === 'branch' && this.selectedStudent) {
      list = list.filter(c => c.department === this.selectedStudent.branch);
    } else if (this.courseFilter === 'available') {
      list = list.filter(c => c.is_registered !== 1);
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 24px 10px;">
          <p>No courses match your active filters.</p>
          <button type="button" class="btn btn-secondary btn-sm" onclick="RegisterWorkflow.setCourseFilter('all')" style="margin-top: 8px;">View All Courses</button>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(c => {
      const isAlready = c.is_registered === 1;
      const isSelected = this.selectedCourse && this.selectedCourse.course_id === c.course_id;
      const isBranchMatch = this.selectedStudent && c.department === this.selectedStudent.branch;

      if (isAlready) {
        return `
          <div class="course-item-row disabled" title="Student is already registered for this course">
            <div>
              <div class="course-item-title">
                <span class="badge badge-course" style="opacity: 0.7;">${App.escapeHtml(c.course_code)}</span>
                <span style="color: var(--text-secondary);">${App.escapeHtml(c.course_name)}</span>
                ${isBranchMatch ? `<span class="badge-recommended" style="opacity: 0.7;">★ Branch Match</span>` : ''}
              </div>
              <div class="course-item-meta">
                ${App.escapeHtml(c.department)} • ${App.escapeHtml(c.semester)} • ${c.credits} Credits
              </div>
            </div>
            <div>
              <span class="badge badge-registered">
                <span class="badge-dot"></span>Already Registered
              </span>
            </div>
          </div>
        `;
      }

      return `
        <div class="course-item-row ${isSelected ? 'selected' : ''}" onclick="RegisterWorkflow.selectCourse(${c.course_id})">
          <div>
            <div class="course-item-title">
              <span class="badge badge-course">${App.escapeHtml(c.course_code)}</span>
              <span>${App.escapeHtml(c.course_name)}</span>
              ${isBranchMatch ? `<span class="badge-recommended">★ Recommended for ${this.getShortBranchName(this.selectedStudent.branch)}</span>` : ''}
            </div>
            <div class="course-item-meta">
              ${App.escapeHtml(c.department)} • ${App.escapeHtml(c.semester)} • <strong>${c.credits} Credits</strong>
            </div>
          </div>
          <button type="button" class="btn ${isSelected ? 'btn-primary' : 'btn-secondary'} btn-sm">
            ${isSelected ? '✓ Selected' : 'Select'}
          </button>
        </div>
      `;
    }).join('');

    if (autoSelectId) {
      const targetId = parseInt(autoSelectId, 10);
      const target = this.courses.find(c => c.course_id === targetId && c.is_registered !== 1);
      if (target) {
        this.selectCourse(targetId);
      }
    }
  },

  selectCourse(courseId) {
    const course = this.courses.find(c => c.course_id === courseId);
    if (!course || course.is_registered === 1) return;

    this.selectedCourse = course;
    const step2Status = document.getElementById('step-2-status');
    if (step2Status) {
      step2Status.innerHTML = `<span style="color: var(--status-reg-text); font-weight: 600;">✓ ${App.escapeHtml(course.course_code)} (${course.credits} Credits)</span>`;
    }

    this.renderCourses();
    this.updateReviewBox();
  },

  /* ==========================================================
   * Review Box & Registration Submission
   * ========================================================== */
  updateReviewBox() {
    const studentVal = document.getElementById('review-student-val');
    const courseVal = document.getElementById('review-course-val');
    const creditsVal = document.getElementById('review-credits-val');
    const btnSubmit = document.getElementById('btn-register-student');
    const step3Status = document.getElementById('step-3-status');

    if (this.selectedStudent) {
      studentVal.innerText = `${this.selectedStudent.name} (${this.selectedStudent.roll_no})`;
    } else {
      studentVal.innerText = 'None selected';
    }

    if (this.selectedCourse) {
      courseVal.innerText = `${this.selectedCourse.course_code} — ${this.selectedCourse.course_name} (${this.selectedCourse.semester})`;
      creditsVal.innerText = `${this.selectedCourse.credits} Credits`;
    } else {
      courseVal.innerText = 'None selected';
      creditsVal.innerText = '—';
    }

    if (this.selectedStudent && this.selectedCourse) {
      btnSubmit.disabled = false;
      step3Status.innerHTML = `<span style="color: var(--primary); font-weight: 600;">Ready to register</span>`;
    } else {
      btnSubmit.disabled = true;
      step3Status.innerText = 'Awaiting selections';
    }
  },

  cancelSelection() {
    this.clearStudentSelection();
    const successCard = document.getElementById('reg-success-card');
    if (successCard) successCard.classList.remove('active');
  },

  resetForm() {
    this.cancelSelection();
  },

  async submitRegistration() {
    if (!this.selectedStudent || !this.selectedCourse) {
      App.showToast('warning', 'Incomplete', 'Please select both a student and an eligible course.');
      return;
    }

    const btn = document.getElementById('btn-register-student');
    const originalText = btn.innerHTML;

    const payload = {
      student_id: this.selectedStudent.student_id,
      course_id: this.selectedCourse.course_id,
      status: 'Confirmed'
    };

    try {
      btn.disabled = true;
      btn.innerText = 'Registering...';

      const res = await App.apiRequest('/api/registrations', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Display clean success card
      const successCard = document.getElementById('reg-success-card');
      const successMsg = document.getElementById('reg-success-message');
      const btnProfile = document.getElementById('btn-view-student-profile');

      successMsg.innerHTML = `
        <strong>${App.escapeHtml(this.selectedStudent.name)}</strong> (${App.escapeHtml(this.selectedStudent.roll_no)}) has been successfully registered for <strong>${App.escapeHtml(this.selectedCourse.course_code)} — ${App.escapeHtml(this.selectedCourse.course_name)}</strong> (${this.selectedCourse.credits} Credits).
      `;

      if (btnProfile) {
        btnProfile.href = `student-details.html?id=${this.selectedStudent.student_id}`;
      }

      successCard.classList.add('active');
      successCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      App.showToast('success', 'Registration Confirmed', `Successfully registered for ${this.selectedCourse.course_code}`);

      // Refresh student course status
      const savedStudentId = this.selectedStudent.student_id;
      await this.loadStudents();
      await this.selectStudent(savedStudentId);
    } catch (err) {
      App.showToast('error', 'Registration Failed', err.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  RegisterWorkflow.init();
});
