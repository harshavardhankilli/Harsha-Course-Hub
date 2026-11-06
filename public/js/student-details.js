/**
 * Harsha CourseHub — Student Academic Profile Controller
 * Designed & Developed by Harsha
 */

const StudentDetailsPage = {
  studentId: null,
  studentData: null,

  init() {
    const params = new URLSearchParams(window.location.search);
    this.studentId = parseInt(params.get('id'), 10);

    if (isNaN(this.studentId)) {
      document.getElementById('student-profile-wrapper').innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          </div>
          <h3>Student Not Specified</h3>
          <p>Please select a valid student from the directory.</p>
          <a href="students.html" class="btn btn-primary btn-sm">Go to Students Directory</a>
        </div>
      `;
      return;
    }

    const btnEnroll = document.getElementById('btn-enroll-more');
    if (btnEnroll) {
      btnEnroll.onclick = () => {
        window.location.href = `register.html?student_id=${this.studentId}`;
      };
    }

    this.fetchDetails();
  },

  async fetchDetails() {
    const wrapper = document.getElementById('student-profile-wrapper');

    try {
      const res = await App.apiRequest(`/api/students/${this.studentId}`);
      this.studentData = res.data;
      this.render();
    } catch (err) {
      wrapper.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </div>
          <h3>Student Not Found</h3>
          <p>${App.escapeHtml(err.message)}</p>
          <a href="students.html" class="btn btn-primary btn-sm">Return to Students</a>
        </div>
      `;
    }
  },

  render() {
    const s = this.studentData;
    const wrapper = document.getElementById('student-profile-wrapper');

    const activeRegs = (s.registrations || []).filter(r => r.status === 'Registered' || r.status === 'Confirmed');
    const droppedRegs = (s.registrations || []).filter(r => r.status === 'Dropped');

    wrapper.innerHTML = `
      <!-- Student Info Card -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-group">
            <h2>Student Academic Record</h2>
            <p>Enrolled candidate details and academic profile</p>
          </div>
          <a href="register.html?student_id=${s.student_id}" class="btn btn-primary btn-sm">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
            Register Another Course
          </a>
        </div>
        <div class="card-body">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
            <div style="background: var(--bg-surface-subtle); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px 16px;">
              <span style="font-size: 0.74rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">Student Name</span>
              <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-top: 2px;">${App.escapeHtml(s.name)}</div>
            </div>

            <div style="background: var(--bg-surface-subtle); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px 16px;">
              <span style="font-size: 0.74rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">Roll Number</span>
              <div style="margin-top: 2px;"><code>${App.escapeHtml(s.roll_no)}</code></div>
            </div>

            <div style="background: var(--bg-surface-subtle); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px 16px;">
              <span style="font-size: 0.74rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">Branch</span>
              <div style="font-size: 0.88rem; font-weight: 600; color: var(--text-primary); margin-top: 2px;">${App.escapeHtml(s.branch)}</div>
            </div>

            <div style="background: var(--bg-surface-subtle); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px 16px;">
              <span style="font-size: 0.74rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">Email Address</span>
              <div style="font-size: 0.86rem; color: var(--text-primary); margin-top: 2px;">${App.escapeHtml(s.email)}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Metrics: Exactly Total Courses & Total Credits -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 20px;">
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Total Courses Registered</span>
            <div class="stat-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
            </div>
          </div>
          <div class="stat-value">${activeRegs.length}</div>
          <div class="stat-footer">Active course allocations</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Total Credits</span>
            <div class="stat-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
          </div>
          <div class="stat-value" style="color: var(--status-reg-text);">${s.total_credits || 0}</div>
          <div class="stat-footer">Cumulative credits for Registered courses</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Dropped Courses</span>
            <div class="stat-icon" style="background: var(--status-drop-bg); color: var(--status-drop-text);">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </div>
          </div>
          <div class="stat-value">${droppedRegs.length}</div>
          <div class="stat-footer">Withdrawn course records</div>
        </div>
      </div>

      <!-- Registered Courses Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-group">
            <h3>Registered Courses</h3>
            <p>Course schedule and curriculum registrations for this student</p>
          </div>
          <a href="register.html?student_id=${s.student_id}" class="btn btn-secondary btn-sm">+ Register Course</a>
        </div>
        <div class="card-body" style="padding: 0;">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Name</th>
                  <th>Credits</th>
                  <th>Department</th>
                  <th>Semester</th>
                  <th>Registration Date</th>
                  <th>Status</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${(!s.registrations || s.registrations.length === 0) ? `
                  <tr>
                    <td colspan="8" class="empty-state">
                      <div class="empty-state-icon">
                        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                      </div>
                      <h3>No Courses Registered</h3>
                      <p>This student is not currently enrolled in any academic courses.</p>
                      <a href="register.html?student_id=${s.student_id}" class="btn btn-primary btn-sm">Register Course</a>
                    </td>
                  </tr>
                ` : s.registrations.map(r => `
                  <tr>
                    <td><span class="badge badge-course">${App.escapeHtml(r.course_code)}</span></td>
                    <td style="font-weight: 600; color: var(--text-primary); font-size: 0.86rem;">${App.escapeHtml(r.course_name)}</td>
                    <td><strong>${r.credits}</strong> <span style="font-size: 0.76rem; color: var(--text-secondary);">Credits</span></td>
                    <td style="color: var(--text-primary); font-size: 0.84rem;">${App.escapeHtml(r.department)}</td>
                    <td style="color: var(--text-secondary); font-size: 0.84rem;">${App.escapeHtml(r.semester)}</td>
                    <td style="color: var(--text-secondary); font-size: 0.82rem;">${App.formatDate(r.registration_date)}</td>
                    <td>${App.getStatusBadge(r.status)}</td>
                    <td style="text-align: right;">
                      ${(r.status === 'Registered' || r.status === 'Confirmed') ? `
                        <button class="btn btn-secondary btn-sm" onclick="StudentDetailsPage.toggleStatus(${r.registration_id}, 'Dropped')">
                          Drop
                        </button>
                      ` : `
                        <button class="btn btn-secondary btn-sm" onclick="StudentDetailsPage.toggleStatus(${r.registration_id}, 'Registered')">
                          Restore
                        </button>
                      `}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  async toggleStatus(regId, newStatus) {
    try {
      const res = await App.apiRequest(`/api/registrations/${regId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });

      App.showToast('success', 'Status Updated', res.message || `Course status set to ${newStatus}`);
      this.fetchDetails();
    } catch (err) {
      App.showToast('error', 'Status Update Failed', err.message);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  StudentDetailsPage.init();
});
