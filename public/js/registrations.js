/**
 * Harsha CourseHub — Registrations Management Controller
 * Designed & Developed by Harsha
 */

const RegistrationsPage = {
  registrations: [],
  selectedRegId: null,

  init() {
    this.bindEvents();
    this.fetchRegistrations();
  },

  bindEvents() {
    const searchInput = document.getElementById('reg-search');
    const statusFilter = document.getElementById('status-filter');

    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => this.fetchRegistrations(), 200);
      });
    }

    if (statusFilter) {
      statusFilter.addEventListener('change', () => this.fetchRegistrations());
    }
  },

  resetFilters() {
    const s = document.getElementById('reg-search');
    const st = document.getElementById('status-filter');
    if (s) s.value = '';
    if (st) st.value = 'all';
    this.fetchRegistrations();
  },

  exportCsv() {
    const search = document.getElementById('reg-search')?.value.trim() || '';
    const status = document.getElementById('status-filter')?.value || 'all';

    let url = `/api/reports/registrations/csv?`;
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (status && status !== 'all') url += `status=${encodeURIComponent(status)}&`;

    window.location.href = url;
  },

  async fetchRegistrations() {
    const tbody = document.getElementById('registrations-tbody');
    const countBadge = document.getElementById('reg-count-badge');
    const search = document.getElementById('reg-search')?.value.trim() || '';
    const status = document.getElementById('status-filter')?.value || 'all';

    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="loading-state">
          <div class="spinner"></div>
          <span>Loading registrations...</span>
        </td>
      </tr>
    `;

    try {
      let url = `/api/registrations?`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (status && status !== 'all') url += `status=${encodeURIComponent(status)}&`;

      const res = await App.apiRequest(url);
      this.registrations = res.data || [];
      if (countBadge) {
        countBadge.innerText = `Showing ${this.registrations.length} record${this.registrations.length === 1 ? '' : 's'}`;
      }
      this.renderRegistrations();
    } catch (err) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 36px; color: var(--status-drop-text);">
            <strong>Failed to load registrations.</strong><br>
            <span style="font-size: 0.8rem; color: var(--text-secondary);">${App.escapeHtml(err.message)}</span>
          </td>
        </tr>
      `;
    }
  },

  renderRegistrations() {
    const tbody = document.getElementById('registrations-tbody');

    if (this.registrations.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-state">
            <div class="empty-state-icon">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            </div>
            <h3>No Registrations Found</h3>
            <p>No enrollment records matching the specified filters.</p>
            <a href="register.html" class="btn btn-primary btn-sm">+ New Registration</a>
          </td>
        </tr>
      `;
      return;
    }

    // Exactly 7 columns:
    // 1. Student Name, 2. Roll Number, 3. Course Code and Name, 4. Credits, 5. Registration Date, 6. Status, 7. Actions
    tbody.innerHTML = this.registrations.map(r => {
      const isRegistered = r.status === 'Registered';
      return `
        <tr>
          <td>
            <a href="student-details.html?id=${r.student_id}" style="font-weight: 600; color: var(--text-primary);" title="View Student Academic Record">
              ${App.escapeHtml(r.student_name)}
            </a>
          </td>
          <td><code>${App.escapeHtml(r.roll_no)}</code></td>
          <td>
            <span class="badge badge-course">${App.escapeHtml(r.course_code)}</span>
            <span style="font-weight: 500; margin-left: 6px; color: var(--text-primary); font-size: 0.85rem;">
              ${App.escapeHtml(r.course_name)}
            </span>
          </td>
          <td>
            <strong>${r.credits}</strong> <span style="font-size: 0.76rem; color: var(--text-secondary);">Credits</span>
          </td>
          <td style="color: var(--text-secondary); font-size: 0.82rem;">
            ${App.formatDate(r.registration_date)}
          </td>
          <td>
            ${App.getStatusBadge(r.status)}
          </td>
          <td style="text-align: right;">
            <div class="action-buttons" style="justify-content: flex-end;">
              ${isRegistered ? `
                <button class="btn btn-secondary btn-sm" onclick="RegistrationsPage.updateStatus(${r.registration_id}, 'Dropped')" title="Mark enrollment as Dropped">
                  Drop
                </button>
              ` : `
                <button class="btn btn-secondary btn-sm" onclick="RegistrationsPage.updateStatus(${r.registration_id}, 'Registered')" title="Restore enrollment to Registered">
                  Restore
                </button>
              `}
              <button class="btn btn-danger btn-sm" onclick="RegistrationsPage.openDeleteModal(${r.registration_id})" title="Delete record">
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  async updateStatus(regId, newStatus) {
    try {
      const res = await App.apiRequest(`/api/registrations/${regId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });

      App.showToast('success', 'Status Updated', res.message || `Status set to ${newStatus}`);
      this.fetchRegistrations();
    } catch (err) {
      App.showToast('error', 'Update Failed', err.message);
      this.fetchRegistrations();
    }
  },

  openDeleteModal(regId) {
    const reg = this.registrations.find(r => r.registration_id === regId);
    if (!reg) return;

    this.selectedRegId = regId;
    document.getElementById('delete-reg-student').innerText = reg.student_name;
    document.getElementById('delete-reg-course').innerText = `${reg.course_code} - ${reg.course_name}`;

    App.openModal('deleteRegModal');
  },

  async confirmDelete() {
    if (!this.selectedRegId) return;
    const btn = document.getElementById('btn-confirm-delete-reg');
    const originalText = btn.innerText;

    try {
      btn.disabled = true;
      btn.innerText = 'Deleting...';

      const res = await App.apiRequest(`/api/registrations/${this.selectedRegId}`, {
        method: 'DELETE'
      });

      App.showToast('success', 'Record Deleted', res.message || 'Registration record removed.');
      App.closeModal('deleteRegModal');
      this.fetchRegistrations();
    } catch (err) {
      App.showToast('error', 'Delete Error', err.message);
    } finally {
      btn.disabled = false;
      btn.innerText = originalText;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  RegistrationsPage.init();
});
