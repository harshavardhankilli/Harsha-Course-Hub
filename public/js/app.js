/**
 * Harsha CourseHub — Core Application Utilities & UI Controllers
 * Designed & Developed by Harsha
 */

const App = {
  dbConnected: false,

  init() {
    this.setupSidebarToggle();
    this.checkDatabaseHealth();
    this.setupGlobalEvents();
  },

  // Check database health
  async checkDatabaseHealth() {
    const statusDot = document.getElementById('db-status-dot');
    const statusText = document.getElementById('db-status-text');
    const alertBanner = document.getElementById('db-connection-banner');

    try {
      const response = await fetch('/api/health');
      const data = await response.json();

      if (data.database && data.database.connected) {
        this.dbConnected = true;
        if (statusDot) {
          statusDot.className = 'status-dot online';
          statusDot.title = 'MySQL Connected';
        }
        if (statusText) statusText.innerText = 'DB Online';
        if (alertBanner) alertBanner.classList.remove('show');
      } else {
        this.dbConnected = false;
        if (statusDot) {
          statusDot.className = 'status-dot offline';
          statusDot.title = 'MySQL Disconnected';
        }
        if (statusText) statusText.innerText = 'DB Offline';
        if (alertBanner) alertBanner.classList.add('show');
      }
    } catch (err) {
      this.dbConnected = false;
      if (statusDot) statusDot.className = 'status-dot offline';
      if (statusText) statusText.innerText = 'Server Error';
      if (alertBanner) alertBanner.classList.add('show');
    }
  },

  // Mobile menu sidebar toggle
  setupSidebarToggle() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');

    if (menuBtn && sidebar) {
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('mobile-open');
      });

      document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
          sidebar.classList.remove('mobile-open');
        }
      });
    }
  },

  setupGlobalEvents() {
    // ESC key closes active modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal-backdrop.show');
        if (openModal) {
          App.closeModal(openModal.id);
        }
      }
    });
  },

  // Modal Functions
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
    }
  },

  // Toast Notification System
  showToast(type, title, message, duration = 4000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = `<svg width="16" height="16" viewBox="0 0 20 20" fill="#2855A6"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>`;
    if (type === 'success') {
      icon = `<svg width="16" height="16" viewBox="0 0 20 20" fill="#027A48"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`;
    } else if (type === 'error') {
      icon = `<svg width="16" height="16" viewBox="0 0 20 20" fill="#B42318"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 00-1.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>`;
    } else if (type === 'warning') {
      icon = `<svg width="16" height="16" viewBox="0 0 20 20" fill="#B54708"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>`;
    }

    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <div class="toast-title">${App.escapeHtml(title)}</div>
        <div class="toast-msg">${App.escapeHtml(message)}</div>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()" aria-label="Close">&times;</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  },

  // API Request Helper
  async apiRequest(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        ...options
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error [${url}]:`, err);
      throw err;
    }
  },

  // Escape HTML
  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  // Clean date formatter
  formatDate(dateString) {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  // Restrained Status Badge Generator
  getStatusBadge(status) {
    const s = (status || '').toLowerCase();
    if (s === 'registered' || s === 'confirmed') {
      return `<span class="badge badge-registered"><span class="badge-dot"></span>Registered</span>`;
    } else if (s === 'dropped') {
      return `<span class="badge badge-dropped"><span class="badge-dot"></span>Dropped</span>`;
    }
    return `<span class="badge badge-registered"><span class="badge-dot"></span>${App.escapeHtml(status)}</span>`;
  }
};

// Auto initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
