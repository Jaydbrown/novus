// ==================== Configuration ====================
const API_URL = 'http://localhost:5000/api';

// ==================== State Management ====================
let currentPage = 'dashboard';
let authToken = localStorage.getItem('authToken');
let currentBookingsPage = 1;
let currentContactsPage = 1;
let adminData = null;

// ==================== Initialization ====================
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

function initializeApp() {
  checkAuthentication();
  setupEventListeners();
  setupModalHandlers();
}

// ==================== Authentication ====================
function checkAuthentication() {
  if (authToken) {
    validateToken();
  } else {
    showLoginPage();
  }
}

async function validateToken() {
  try {
    const response = await fetch(`${API_URL}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      adminData = data.admin;
      showDashboardPage();
      loadDashboardData();
    } else {
      localStorage.removeItem('authToken');
      authToken = null;
      showLoginPage();
    }
  } catch (error) {
    console.error('Token validation failed:', error);
    showLoginPage();
  }
}

function showLoginPage() {
  document.getElementById('loginPage').classList.remove('hidden');
  document.getElementById('dashboardPage').classList.add('hidden');
}

function showDashboardPage() {
  document.getElementById('loginPage').classList.add('hidden');
  document.getElementById('dashboardPage').classList.remove('hidden');
  
  if (adminData) {
    document.getElementById('adminUsername').textContent = adminData.username;
  }
}

async function handleLogin(e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('loginError');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  // Validation
  if (!username || !password) {
    errorDiv.textContent = 'Please enter both username and password';
    errorDiv.style.display = 'block';
    return;
  }
  
  // Disable button and show loading
  submitBtn.disabled = true;
  submitBtn.textContent = 'Logging in...';
  errorDiv.style.display = 'none';
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      authToken = data.token;
      adminData = data.admin;
      localStorage.setItem('authToken', authToken);
      
      showToast('Login successful! Welcome back.', 'success');
      showDashboardPage();
      loadDashboardData();
    } else {
      errorDiv.textContent = data.error || 'Invalid username or password';
      errorDiv.style.display = 'block';
    }
  } catch (error) {
    console.error('Login error:', error);
    errorDiv.textContent = 'Connection error. Please check your server is running.';
    errorDiv.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Login';
  }
}

function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('authToken');
    authToken = null;
    adminData = null;
    showToast('Logged out successfully', 'info');
    showLoginPage();
  }
}

// ==================== Event Listeners ====================
function setupEventListeners() {
  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      navigateToPage(page);
    });
  });
  
  // Filters
  const applyFiltersBtn = document.getElementById('applyFilters');
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', () => loadBookings(1));
  }
  
  const applyContactFiltersBtn = document.getElementById('applyContactFilters');
  if (applyContactFiltersBtn) {
    applyContactFiltersBtn.addEventListener('click', () => loadContacts(1));
  }
  
  // Settings form
  const settingsForm = document.getElementById('settingsForm');
  if (settingsForm) {
    settingsForm.addEventListener('submit', handleSettingsUpdate);
  }
  
  // Export subscribers
  const exportBtn = document.getElementById('exportSubscribers');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportSubscribers);
  }
  
  // Blog management
  const createPostBtn = document.getElementById('createPostBtn');
  if (createPostBtn) {
    createPostBtn.addEventListener('click', () => openBlogModal());
  }
  
  const saveBlogPostBtn = document.getElementById('saveBlogPost');
  if (saveBlogPostBtn) {
    saveBlogPostBtn.addEventListener('click', handleSaveBlogPost);
  }
  
  const applyBlogFiltersBtn = document.getElementById('applyBlogFilters');
  if (applyBlogFiltersBtn) {
    applyBlogFiltersBtn.addEventListener('click', () => loadBlogPosts(1));
  }
  
  // Filter inputs - Enter key support
  const filterInputs = document.querySelectorAll('#statusFilter, #startDateFilter, #endDateFilter, #contactStatusFilter');
  filterInputs.forEach(input => {
    input.addEventListener('change', () => {
      if (currentPage === 'bookings') {
        loadBookings(1);
      } else if (currentPage === 'contacts') {
        loadContacts(1);
      }
    });
  });
}

function setupModalHandlers() {
  // Close modal buttons
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });
  
  // Close modal on outside click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeAllModals();
      }
    });
  });
  
  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });
}

// ==================== Navigation ====================
function navigateToPage(page) {
  // Update active nav item
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  const activeNav = document.querySelector(`[data-page="${page}"]`);
  if (activeNav) {
    activeNav.classList.add('active');
  }
  
  // Hide all content sections
  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Show selected content
  const contentSection = document.getElementById(`${page}Content`);
  if (contentSection) {
    contentSection.classList.add('active');
  }
  
  // Update page title
  const titles = {
    dashboard: 'Dashboard',
    bookings: 'Bookings Management',
    contacts: 'Contact Messages',
    newsletter: 'Newsletter Subscribers',
    blog: 'Blog Posts Management',
    settings: 'Application Settings'
  };
  document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';
  
  currentPage = page;
  
  // Load page data
  loadPageData(page);
}

function loadPageData(page) {
  switch (page) {
    case 'dashboard':
      loadDashboardData();
      break;
    case 'bookings':
      loadBookings(1);
      break;
    case 'contacts':
      loadContacts(1);
      break;
    case 'newsletter':
      loadNewsletterSubscribers();
      break;
    case 'blog':
      loadBlogPosts(1);
      break;
    case 'settings':
      loadSettings();
      break;
  }
}

// ==================== Dashboard ====================
async function loadDashboardData() {
  try {
    showLoading('dashboardContent');
    
    const response = await fetch(`${API_URL}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      updateDashboardStats(data.stats);
      renderRecentBookings(data.recentBookings);
    } else if (response.status === 401) {
      handleUnauthorized();
    } else {
      throw new Error('Failed to load dashboard data');
    }
  } catch (error) {
    console.error('Dashboard load error:', error);
    showToast('Failed to load dashboard data', 'error');
  } finally {
    hideLoading('dashboardContent');
  }
}

function updateDashboardStats(stats) {
  document.getElementById('totalBookings').textContent = stats.totalBookings || 0;
  document.getElementById('pendingBookings').textContent = stats.pendingBookings || 0;
  document.getElementById('newContacts').textContent = stats.newContacts || 0;
  document.getElementById('subscribers').textContent = stats.activeSubscribers || 0;
}

function renderRecentBookings(bookings) {
  const tbody = document.getElementById('recentBookingsTable');
  
  if (!bookings || bookings.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">No recent bookings</td></tr>';
    return;
  }
  
  tbody.innerHTML = bookings.map(booking => `
    <tr>
      <td>${escapeHtml(booking.name)}</td>
      <td>${escapeHtml(booking.email)}</td>
      <td>${formatDate(booking.date)}</td>
      <td>${escapeHtml(booking.time_slot)}</td>
      <td><span class="badge badge-${booking.status}">${booking.status}</span></td>
    </tr>
  `).join('');
}

// ==================== Bookings Management ====================
async function loadBookings(page = 1) {
  try {
    showLoading('bookingsContent');
    
    const status = document.getElementById('statusFilter')?.value || '';
    const startDate = document.getElementById('startDateFilter')?.value || '';
    const endDate = document.getElementById('endDateFilter')?.value || '';
    
    let url = `${API_URL}/admin/bookings?page=${page}&limit=10`;
    if (status) url += `&status=${status}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      renderBookingsTable(data.bookings);
      renderPagination('bookingsPagination', data.pagination, loadBookings);
      currentBookingsPage = page;
    } else if (response.status === 401) {
      handleUnauthorized();
    } else {
      throw new Error('Failed to load bookings');
    }
  } catch (error) {
    console.error('Bookings load error:', error);
    showToast('Failed to load bookings', 'error');
  } finally {
    hideLoading('bookingsContent');
  }
}

function renderBookingsTable(bookings) {
  const tbody = document.getElementById('bookingsTable');
  
  if (!bookings || bookings.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center">No bookings found</td></tr>';
    return;
  }
  
  tbody.innerHTML = bookings.map(booking => `
    <tr>
      <td>${booking.id}</td>
      <td>${escapeHtml(booking.name)}</td>
      <td>${escapeHtml(booking.email)}</td>
      <td>${escapeHtml(booking.company || '-')}</td>
      <td>${formatDate(booking.date)}</td>
      <td>${escapeHtml(booking.time_slot)}</td>
      <td><span class="badge badge-${booking.status}">${booking.status}</span></td>
      <td>
        <button class="btn-icon" onclick="viewBooking(${booking.id})" title="View Details">
          <i class="fas fa-eye"></i>
        </button>
        <select onchange="updateBookingStatus(${booking.id}, this.value)" class="status-select">
          <option value="">Change Status</option>
          <option value="pending" ${booking.status === 'pending' ? 'disabled' : ''}>Pending</option>
          <option value="confirmed" ${booking.status === 'confirmed' ? 'disabled' : ''}>Confirmed</option>
          <option value="completed" ${booking.status === 'completed' ? 'disabled' : ''}>Completed</option>
          <option value="cancelled" ${booking.status === 'cancelled' ? 'disabled' : ''}>Cancelled</option>
        </select>
        <button class="btn-icon btn-danger" onclick="deleteBooking(${booking.id})" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

async function viewBooking(id) {
  try {
    const response = await fetch(`${API_URL}/admin/bookings?page=1&limit=1000`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      const booking = data.bookings.find(b => b.id === id);
      
      if (booking) {
        document.getElementById('bookingDetails').innerHTML = `
          <div class="details-grid">
            <div class="detail-item">
              <strong>Booking ID:</strong>
              <span>${booking.id}</span>
            </div>
            <div class="detail-item">
              <strong>Name:</strong>
              <span>${escapeHtml(booking.name)}</span>
            </div>
            <div class="detail-item">
              <strong>Email:</strong>
              <span>${escapeHtml(booking.email)}</span>
            </div>
            <div class="detail-item">
              <strong>Company:</strong>
              <span>${escapeHtml(booking.company || 'Not provided')}</span>
            </div>
            <div class="detail-item">
              <strong>Date:</strong>
              <span>${formatDate(booking.date)}</span>
            </div>
            <div class="detail-item">
              <strong>Time:</strong>
              <span>${escapeHtml(booking.time_slot)}</span>
            </div>
            <div class="detail-item">
              <strong>Status:</strong>
              <span class="badge badge-${booking.status}">${booking.status}</span>
            </div>
            <div class="detail-item">
              <strong>Created:</strong>
              <span>${formatDateTime(booking.created_at)}</span>
            </div>
            <div class="detail-item full-width">
              <strong>Notes:</strong>
              <p>${escapeHtml(booking.notes || 'No notes provided')}</p>
            </div>
          </div>
        `;
        showModal('bookingModal');
      }
    }
  } catch (error) {
    console.error('View booking error:', error);
    showToast('Failed to load booking details', 'error');
  }
}

async function updateBookingStatus(id, status) {
  if (!status) return;
  
  if (!confirm(`Are you sure you want to change the status to "${status}"?`)) {
    loadBookings(currentBookingsPage); // Reset select
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/admin/bookings/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    
    if (response.ok) {
      showToast('Booking status updated successfully', 'success');
      loadBookings(currentBookingsPage);
      if (currentPage === 'dashboard') {
        loadDashboardData();
      }
    } else {
      throw new Error('Failed to update status');
    }
  } catch (error) {
    console.error('Update booking error:', error);
    showToast('Failed to update booking status', 'error');
    loadBookings(currentBookingsPage);
  }
}

async function deleteBooking(id) {
  if (!confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/admin/bookings/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (response.ok) {
      showToast('Booking deleted successfully', 'success');
      loadBookings(currentBookingsPage);
      if (currentPage === 'dashboard') {
        loadDashboardData();
      }
    } else {
      throw new Error('Failed to delete booking');
    }
  } catch (error) {
    console.error('Delete booking error:', error);
    showToast('Failed to delete booking', 'error');
  }
}

// ==================== Contacts Management ====================
async function loadContacts(page = 1) {
  try {
    showLoading('contactsContent');
    
    const status = document.getElementById('contactStatusFilter')?.value || '';
    
    let url = `${API_URL}/admin/contacts?page=${page}&limit=10`;
    if (status) url += `&status=${status}`;
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      renderContactsTable(data.contacts);
      renderPagination('contactsPagination', data.pagination, loadContacts);
      currentContactsPage = page;
    } else if (response.status === 401) {
      handleUnauthorized();
    } else {
      throw new Error('Failed to load contacts');
    }
  } catch (error) {
    console.error('Contacts load error:', error);
    showToast('Failed to load contacts', 'error');
  } finally {
    hideLoading('contactsContent');
  }
}

function renderContactsTable(contacts) {
  const tbody = document.getElementById('contactsTable');
  
  if (!contacts || contacts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center">No contact messages found</td></tr>';
    return;
  }
  
  tbody.innerHTML = contacts.map(contact => `
    <tr>
      <td>${contact.id}</td>
      <td>${escapeHtml(contact.name)}</td>
      <td>${escapeHtml(contact.email)}</td>
      <td>${escapeHtml(contact.subject || '-')}</td>
      <td class="truncate">${escapeHtml(contact.message.substring(0, 50))}...</td>
      <td>${formatDate(contact.created_at)}</td>
      <td><span class="badge badge-${contact.status}">${contact.status}</span></td>
      <td>
        <button class="btn-icon" onclick="viewContact(${contact.id})" title="View Message">
          <i class="fas fa-eye"></i>
        </button>
        <select onchange="updateContactStatus(${contact.id}, this.value)" class="status-select">
          <option value="">Change Status</option>
          <option value="new" ${contact.status === 'new' ? 'disabled' : ''}>New</option>
          <option value="read" ${contact.status === 'read' ? 'disabled' : ''}>Read</option>
          <option value="responded" ${contact.status === 'responded' ? 'disabled' : ''}>Responded</option>
        </select>
        <button class="btn-icon btn-danger" onclick="deleteContact(${contact.id})" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

async function viewContact(id) {
  try {
    const response = await fetch(`${API_URL}/admin/contacts?page=1&limit=1000`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      const contact = data.contacts.find(c => c.id === id);
      
      if (contact) {
        document.getElementById('contactDetails').innerHTML = `
          <div class="details-grid">
            <div class="detail-item">
              <strong>Contact ID:</strong>
              <span>${contact.id}</span>
            </div>
            <div class="detail-item">
              <strong>Name:</strong>
              <span>${escapeHtml(contact.name)}</span>
            </div>
            <div class="detail-item">
              <strong>Email:</strong>
              <span><a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a></span>
            </div>
            <div class="detail-item">
              <strong>Subject:</strong>
              <span>${escapeHtml(contact.subject || 'No subject')}</span>
            </div>
            <div class="detail-item">
              <strong>Status:</strong>
              <span class="badge badge-${contact.status}">${contact.status}</span>
            </div>
            <div class="detail-item">
              <strong>Received:</strong>
              <span>${formatDateTime(contact.created_at)}</span>
            </div>
            <div class="detail-item full-width">
              <strong>Message:</strong>
              <p style="white-space: pre-wrap;">${escapeHtml(contact.message)}</p>
            </div>
          </div>
        `;
        showModal('contactModal');
        
        // Mark as read if it's new
        if (contact.status === 'new') {
          updateContactStatus(id, 'read', false);
        }
      }
    }
  } catch (error) {
    console.error('View contact error:', error);
    showToast('Failed to load contact details', 'error');
  }
}

async function updateContactStatus(id, status, showNotification = true) {
  if (!status) return;
  
  try {
    const response = await fetch(`${API_URL}/admin/contacts/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    
    if (response.ok) {
      if (showNotification) {
        showToast('Contact status updated successfully', 'success');
      }
      loadContacts(currentContactsPage);
      if (currentPage === 'dashboard') {
        loadDashboardData();
      }
    } else {
      throw new Error('Failed to update status');
    }
  } catch (error) {
    console.error('Update contact error:', error);
    if (showNotification) {
      showToast('Failed to update contact status', 'error');
    }
  }
}

async function deleteContact(id) {
  if (!confirm('Are you sure you want to delete this contact message? This action cannot be undone.')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/admin/contacts/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (response.ok) {
      showToast('Contact deleted successfully', 'success');
      loadContacts(currentContactsPage);
      if (currentPage === 'dashboard') {
        loadDashboardData();
      }
    } else {
      throw new Error('Failed to delete contact');
    }
  } catch (error) {
    console.error('Delete contact error:', error);
    showToast('Failed to delete contact', 'error');
  }
}

// ==================== Newsletter Management ====================
async function loadNewsletterSubscribers() {
  try {
    showLoading('newsletterContent');
    
    const response = await fetch(`${API_URL}/admin/newsletters`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      renderNewsletterTable(data.subscribers);
    } else if (response.status === 401) {
      handleUnauthorized();
    } else {
      throw new Error('Failed to load subscribers');
    }
  } catch (error) {
    console.error('Newsletter load error:', error);
    showToast('Failed to load newsletter subscribers', 'error');
  } finally {
    hideLoading('newsletterContent');
  }
}

function renderNewsletterTable(subscribers) {
  const tbody = document.getElementById('newsletterTable');
  
  if (!subscribers || subscribers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">No subscribers found</td></tr>';
    return;
  }
  
  tbody.innerHTML = subscribers.map(subscriber => `
    <tr>
      <td>${subscriber.id}</td>
      <td>${escapeHtml(subscriber.email)}</td>
      <td>${formatDate(subscriber.subscribed_at)}</td>
      <td><span class="badge badge-${subscriber.is_active ? 'confirmed' : 'cancelled'}">${subscriber.is_active ? 'Active' : 'Inactive'}</span></td>
    </tr>
  `).join('');
}

function exportSubscribers() {
  const table = document.getElementById('newsletterTable');
  const rows = table.querySelectorAll('tr');
  
  let csv = 'ID,Email,Subscribed Date,Status\n';
  
  rows.forEach((row) => {
    const cells = row.querySelectorAll('td');
    if (cells.length > 1) {
      const rowData = Array.from(cells).map(cell => {
        // Remove badge HTML and get text content
        return '"' + cell.textContent.trim().replace(/"/g, '""') + '"';
      });
      csv += rowData.join(',') + '\n';
    }
  });
  
  // Create and download file
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
  
  showToast('Subscribers exported successfully', 'success');
}

// ==================== Blog Management ====================
let currentBlogPage = 1;

async function loadBlogPosts(page = 1) {
  try {
    showLoading('blogContent');
    
    const status = document.getElementById('blogStatusFilter')?.value || '';
    const category = document.getElementById('blogCategoryFilter')?.value || '';
    
    let url = `${API_URL}/blog/admin/posts?page=${page}&limit=10`;
    if (status) url += `&status=${status}`;
    if (category) url += `&category=${category}`;
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      renderBlogTable(data.posts);
      renderPagination('blogPagination', data.pagination, loadBlogPosts);
      currentBlogPage = page;
    } else if (response.status === 401) {
      handleUnauthorized();
    } else {
      throw new Error('Failed to load blog posts');
    }
  } catch (error) {
    console.error('Blog load error:', error);
    showToast('Failed to load blog posts', 'error');
  } finally {
    hideLoading('blogContent');
  }
}

function renderBlogTable(posts) {
  const tbody = document.getElementById('blogTable');
  
  if (!posts || posts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">No blog posts found</td></tr>';
    return;
  }
  
  tbody.innerHTML = posts.map(post => `
    <tr>
      <td>${post.id}</td>
      <td class="truncate" style="max-width: 300px;">${escapeHtml(post.title)}</td>
      <td>${escapeHtml(post.category || '-')}</td>
      <td>${escapeHtml(post.author || '-')}</td>
      <td><span class="badge badge-${post.status === 'published' ? 'confirmed' : 'pending'}">${post.status}</span></td>
      <td>${formatDate(post.created_at)}</td>
      <td>
        <button class="btn-icon" onclick="openBlogModal(${post.id})" title="Edit">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn-icon" onclick="viewBlogPost(${post.id})" title="View">
          <i class="fas fa-eye"></i>
        </button>
        <button class="btn-icon btn-danger" onclick="deleteBlogPost(${post.id})" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

async function openBlogModal(postId = null) {
  const modal = document.getElementById('blogModal');
  const modalTitle = document.getElementById('blogModalTitle');
  const form = document.getElementById('blogPostForm');
  
  // Reset form
  form.reset();
  document.getElementById('blogPostId').value = '';
  
  if (postId) {
    // Edit mode - load post data
    modalTitle.textContent = 'Edit Blog Post';
    
    try {
      const response = await fetch(`${API_URL}/blog/admin/posts?page=1&limit=1000`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const post = data.posts.find(p => p.id === postId);
        
        if (post) {
          document.getElementById('blogPostId').value = post.id;
          document.getElementById('postTitle').value = post.title;
          document.getElementById('postCategory').value = post.category || 'General';
          document.getElementById('postAuthor').value = post.author || '';
          document.getElementById('postImageUrl').value = post.image_url || '';
          document.getElementById('postExcerpt').value = post.excerpt || '';
          document.getElementById('postContent').value = post.content;
          document.getElementById('postStatus').value = post.status;
        }
      }
    } catch (error) {
      console.error('Load post error:', error);
      showToast('Failed to load post details', 'error');
      return;
    }
  } else {
    // Create mode
    modalTitle.textContent = 'Create Blog Post';
    document.getElementById('postAuthor').value = adminData?.username || '';
  }
  
  showModal('blogModal');
}

async function handleSaveBlogPost() {
  const postId = document.getElementById('blogPostId').value;
  const title = document.getElementById('postTitle').value.trim();
  const category = document.getElementById('postCategory').value;
  const author = document.getElementById('postAuthor').value.trim();
  const imageUrl = document.getElementById('postImageUrl').value.trim();
  const excerpt = document.getElementById('postExcerpt').value.trim();
  const content = document.getElementById('postContent').value.trim();
  const status = document.getElementById('postStatus').value;
  
  // Validation
  if (!title || !content) {
    showToast('Title and content are required', 'error');
    return;
  }
  
  const saveBtn = document.getElementById('saveBlogPost');
  const originalText = saveBtn.textContent;
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';
  
  const postData = {
    title,
    category,
    author: author || adminData?.username,
    image_url: imageUrl || null,
    excerpt: excerpt || content.substring(0, 200),
    content,
    status
  };
  
  try {
    let response;
    if (postId) {
      // Update existing post
      response = await fetch(`${API_URL}/blog/admin/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });
    } else {
      // Create new post
      response = await fetch(`${API_URL}/blog/admin/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });
    }
    
    if (response.ok) {
      showToast(postId ? 'Post updated successfully' : 'Post created successfully', 'success');
      closeAllModals();
      loadBlogPosts(currentBlogPage);
    } else {
      const data = await response.json();
      throw new Error(data.error || 'Failed to save post');
    }
  } catch (error) {
    console.error('Save post error:', error);
    showToast(error.message || 'Failed to save post', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
  }
}

async function viewBlogPost(id) {
  try {
    const response = await fetch(`${API_URL}/blog/admin/posts?page=1&limit=1000`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      const post = data.posts.find(p => p.id === id);
      
      if (post) {
        // Create a temporary modal for viewing
        const viewModal = document.createElement('div');
        viewModal.className = 'modal';
        viewModal.style.display = 'flex';
        viewModal.innerHTML = `
          <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
              <h3>View Blog Post</h3>
              <button class="close-modal" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
              <div class="details-grid">
                <div class="detail-item">
                  <strong>Title:</strong>
                  <span>${escapeHtml(post.title)}</span>
                </div>
                <div class="detail-item">
                  <strong>Category:</strong>
                  <span>${escapeHtml(post.category || '-')}</span>
                </div>
                <div class="detail-item">
                  <strong>Author:</strong>
                  <span>${escapeHtml(post.author || '-')}</span>
                </div>
                <div class="detail-item">
                  <strong>Status:</strong>
                  <span class="badge badge-${post.status === 'published' ? 'confirmed' : 'pending'}">${post.status}</span>
                </div>
                <div class="detail-item">
                  <strong>Created:</strong>
                  <span>${formatDateTime(post.created_at)}</span>
                </div>
                <div class="detail-item">
                  <strong>Updated:</strong>
                  <span>${formatDateTime(post.updated_at)}</span>
                </div>
                ${post.image_url ? `
                  <div class="detail-item full-width">
                    <strong>Featured Image:</strong>
                    <img src="${escapeHtml(post.image_url)}" alt="Post image" style="max-width: 100%; border-radius: 10px; margin-top: 10px;">
                  </div>
                ` : ''}
                ${post.excerpt ? `
                  <div class="detail-item full-width">
                    <strong>Excerpt:</strong>
                    <p>${escapeHtml(post.excerpt)}</p>
                  </div>
                ` : ''}
                <div class="detail-item full-width">
                  <strong>Content:</strong>
                  <div style="white-space: pre-wrap; background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 10px; max-height: 400px; overflow-y: auto;">
                    ${escapeHtml(post.content)}
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" onclick="this.closest('.modal').remove()">Close</button>
              <button class="btn-primary" onclick="openBlogModal(${post.id}); this.closest('.modal').remove();">Edit Post</button>
            </div>
          </div>
        `;
        document.body.appendChild(viewModal);
        
        // Close on outside click
        viewModal.addEventListener('click', (e) => {
          if (e.target === viewModal) {
            viewModal.remove();
          }
        });
      }
    }
  } catch (error) {
    console.error('View post error:', error);
    showToast('Failed to load post details', 'error');
  }
}

async function deleteBlogPost(id) {
  if (!confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/blog/admin/posts/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (response.ok) {
      showToast('Blog post deleted successfully', 'success');
      loadBlogPosts(currentBlogPage);
    } else {
      throw new Error('Failed to delete post');
    }
  } catch (error) {
    console.error('Delete post error:', error);
    showToast('Failed to delete blog post', 'error');
  }
}

// ==================== Settings Management ====================
async function loadSettings() {
  try {
    showLoading('settingsContent');
    
    const response = await fetch(`${API_URL}/admin/settings`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      populateSettingsForm(data.settings);
    } else if (response.status === 401) {
      handleUnauthorized();
    } else {
      throw new Error('Failed to load settings');
    }
  } catch (error) {
    console.error('Settings load error:', error);
    showToast('Failed to load settings', 'error');
  } finally {
    hideLoading('settingsContent');
  }
}

function populateSettingsForm(settings) {
  document.getElementById('workingHoursStart').value = settings.working_hours_start || '09:00';
  document.getElementById('workingHoursEnd').value = settings.working_hours_end || '17:00';
  document.getElementById('meetingDuration').value = settings.meeting_duration || 30;
  document.getElementById('maxBookingsPerDay').value = settings.max_bookings_per_day || 10;
  document.getElementById('companyEmail').value = settings.company_email || '';
  document.getElementById('companyPhone').value = settings.company_phone || '';
  document.getElementById('emailNotifications').checked = settings.email_notifications !== false;
  
  // Working days checkboxes
  const workingDays = settings.working_days || [1, 2, 3, 4, 5];
  document.querySelectorAll('input[name="workingDays"]').forEach(checkbox => {
    checkbox.checked = workingDays.includes(parseInt(checkbox.value));
  });
}

async function handleSettingsUpdate(e) {
  e.preventDefault();
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving...';
  
  const workingDays = Array.from(document.querySelectorAll('input[name="workingDays"]:checked'))
    .map(cb => parseInt(cb.value));
  
  if (workingDays.length === 0) {
    showToast('Please select at least one working day', 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save Settings';
    return;
  }
  
  const settings = {
    working_hours_start: document.getElementById('workingHoursStart').value,
    working_hours_end: document.getElementById('workingHoursEnd').value,
    working_days: workingDays,
    meeting_duration: parseInt(document.getElementById('meetingDuration').value),
    max_bookings_per_day: parseInt(document.getElementById('maxBookingsPerDay').value),
    email_notifications: document.getElementById('emailNotifications').checked,
    company_email: document.getElementById('companyEmail').value,
    company_phone: document.getElementById('companyPhone').value
  };
  
  try {
    const response = await fetch(`${API_URL}/admin/settings`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(settings)
    });
    
    if (response.ok) {
      showToast('Settings updated successfully', 'success');
    } else {
      throw new Error('Failed to update settings');
    }
  } catch (error) {
    console.error('Settings update error:', error);
    showToast('Failed to update settings', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save Settings';
  }
}

// ==================== Pagination ====================
function renderPagination(containerId, pagination, loadFunction) {
  const container = document.getElementById(containerId);
  
  if (!pagination || pagination.totalPages <= 1) {
    container.innerHTML = '';
    return;
  }
  
  let html = '<div class="pagination-controls">';
  
  // Previous button
  if (pagination.currentPage > 1) {
    html += `<button onclick="${loadFunction.name}(${pagination.currentPage - 1})" class="btn-pagination">
      <i class="fas fa-chevron-left"></i> Previous
    </button>`;
  }
  
  // Page numbers
  const maxVisible = 5;
  let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }
  
  // First page
  if (startPage > 1) {
    html += `<button onclick="${loadFunction.name}(1)" class="btn-pagination">1</button>`;
    if (startPage > 2) {
      html += `<span class="pagination-ellipsis">...</span>`;
    }
  }
  
  // Page numbers
  for (let i = startPage; i <= endPage; i++) {
    if (i === pagination.currentPage) {
      html += `<button class="btn-pagination active">${i}</button>`;
    } else {
      html += `<button onclick="${loadFunction.name}(${i})" class="btn-pagination">${i}</button>`;
    }
  }
  
  // Last page
  if (endPage < pagination.totalPages) {
    if (endPage < pagination.totalPages - 1) {
      html += `<span class="pagination-ellipsis">...</span>`;
    }
    html += `<button onclick="${loadFunction.name}(${pagination.totalPages})" class="btn-pagination">${pagination.totalPages}</button>`;
  }
  
  // Next button
  if (pagination.currentPage < pagination.totalPages) {
    html += `<button onclick="${loadFunction.name}(${pagination.currentPage + 1})" class="btn-pagination">
      Next <i class="fas fa-chevron-right"></i>
    </button>`;
  }
  
  html += '</div>';
  html += `<div class="pagination-info">Showing page ${pagination.currentPage} of ${pagination.totalPages} (${pagination.total} total items)</div>`;
  
  container.innerHTML = html;
}

// ==================== Modals ====================
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

function closeAllModals() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.style.display = 'none';
  });
  document.body.style.overflow = 'auto';
}

// ==================== Toast Notifications ====================
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  
  toast.textContent = message;
  toast.className = `toast toast-${type} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ==================== Loading States ====================
function showLoading(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    const loader = document.createElement('div');
    loader.className = 'loading-overlay';
    loader.innerHTML = `
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin fa-3x"></i>
        <p>Loading...</p>
      </div>
    `;
    section.style.position = 'relative';
    section.appendChild(loader);
  }
}

function hideLoading(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    const loader = section.querySelector('.loading-overlay');
    if (loader) {
      loader.remove();
    }
  }
}

// ==================== Utility Functions ====================
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

function formatDateTime(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function handleUnauthorized() {
  showToast('Session expired. Please login again.', 'error');
  localStorage.removeItem('authToken');
  authToken = null;
  adminData = null;
  setTimeout(() => showLoginPage(), 1500);
}

// ==================== Global Functions (for onclick handlers) ====================
window.viewBooking = viewBooking;
window.updateBookingStatus = updateBookingStatus;
window.deleteBooking = deleteBooking;
window.viewContact = viewContact;
window.updateContactStatus = updateContactStatus;
window.deleteContact = deleteContact;
window.loadBookings = loadBookings;
window.loadContacts = loadContacts;

// ==================== Additional CSS for Loading Overlay ====================
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
  }
  
  .loading-spinner {
    text-align: center;
    color: #667eea;
  }
  
  .loading-spinner p {
    margin-top: 15px;
    font-size: 14px;
    font-weight: 500;
  }
  
  .pagination-info {
    text-align: center;
    margin-top: 10px;
    font-size: 13px;
    color: #666;
  }
  
  .pagination-ellipsis {
    padding: 8px 12px;
    color: #999;
  }
  
  .detail-item a {
    color: #667eea;
    text-decoration: none;
  }
  
  .detail-item a:hover {
    text-decoration: underline;
  }
  
  /* Smooth transitions */
  .content-section {
    animation: fadeIn 0.3s ease-in;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* Status badge animations */
  .badge {
    transition: all 0.3s ease;
  }
  
  /* Table row hover effect */
  .data-table tbody tr {
    transition: background-color 0.2s ease;
  }
  
  /* Button hover effects */
  .btn-icon,
  .btn-primary,
  .btn-secondary,
  .btn-pagination {
    transition: all 0.3s ease;
  }
  
  /* Modal animations */
  .modal {
    animation: modalFadeIn 0.3s ease;
  }
  
  @keyframes modalFadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  .modal-content {
    animation: modalSlideIn 0.3s ease;
  }
  
  @keyframes modalSlideIn {
    from {
      transform: translateY(-50px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  /* Responsive table scrolling */
  @media (max-width: 768px) {
    .card-body {
      overflow-x: auto;
    }
    
    .data-table {
      min-width: 800px;
    }
  }
  
  /* Custom scrollbar for tables */
  .card-body::-webkit-scrollbar {
    height: 8px;
  }
  
  .card-body::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  
  .card-body::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 10px;
  }
  
  .card-body::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
  
  /* Print styles */
  @media print {
    .sidebar,
    .dashboard-header,
    .filters,
    .btn-icon,
    .status-select,
    .pagination {
      display: none !important;
    }
    
    .main-content {
      margin-left: 0;
      width: 100%;
    }
    
    .card {
      box-shadow: none;
      border: 1px solid #ddd;
    }
  }
  
  /* Loading animation */
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .fa-spin {
    animation: spin 1s linear infinite;
  }
  
  /* Empty state styles */
  .text-center {
    padding: 40px 20px;
    color: #999;
    font-style: italic;
  }
  
  /* Focus styles for accessibility */
  button:focus,
  input:focus,
  select:focus,
  textarea:focus {
    outline: 2px solid #667eea;
    outline-offset: 2px;
  }
  
  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .badge {
      border: 2px solid currentColor;
    }
    
    .btn-icon {
      border-width: 2px;
    }
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;
document.head.appendChild(additionalStyles);

// ==================== Service Worker Registration (Optional) ====================
if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => console.log('SW registered:', registration))
      .catch(err => console.log('SW registration failed:', err));
  });
}

// ==================== Error Boundary ====================
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  showToast('An unexpected error occurred. Please refresh the page.', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  showToast('An unexpected error occurred. Please try again.', 'error');
});

// ==================== Network Status Monitoring ====================
window.addEventListener('online', () => {
  showToast('Connection restored', 'success');
  if (currentPage && authToken) {
    loadPageData(currentPage);
  }
});

window.addEventListener('offline', () => {
  showToast('No internet connection. Please check your network.', 'error');
});

// ==================== Auto-refresh Dashboard ====================
let autoRefreshInterval;

function startAutoRefresh() {
  // Refresh dashboard every 5 minutes when on dashboard page
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }
  
  autoRefreshInterval = setInterval(() => {
    if (currentPage === 'dashboard' && authToken) {
      loadDashboardData();
    }
  }, 300000); // 5 minutes
}

function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
}

// Start auto-refresh when page loads
if (authToken) {
  startAutoRefresh();
}

// ==================== Keyboard Shortcuts ====================
document.addEventListener('keydown', (e) => {
  // Alt + D = Dashboard
  if (e.altKey && e.key === 'd') {
    e.preventDefault();
    navigateToPage('dashboard');
  }
  
  // Alt + B = Bookings
  if (e.altKey && e.key === 'b') {
    e.preventDefault();
    navigateToPage('bookings');
  }
  
  // Alt + C = Contacts
  if (e.altKey && e.key === 'c') {
    e.preventDefault();
    navigateToPage('contacts');
  }
  
  // Alt + N = Newsletter
  if (e.altKey && e.key === 'n') {
    e.preventDefault();
    navigateToPage('newsletter');
  }
  
  // Alt + S = Settings
  if (e.altKey && e.key === 's') {
    e.preventDefault();
    navigateToPage('settings');
  }
});

// ==================== Session Timeout Warning ====================
let sessionTimeout;
let sessionWarningTimeout;

function resetSessionTimer() {
  clearTimeout(sessionTimeout);
  clearTimeout(sessionWarningTimeout);
  
  if (authToken) {
    // Warn 5 minutes before timeout
    sessionWarningTimeout = setTimeout(() => {
      if (confirm('Your session will expire in 5 minutes. Do you want to stay logged in?')) {
        // Refresh token by making a request
        loadDashboardData();
      }
    }, 25 * 60 * 1000); // 25 minutes
    
    // Logout after 30 minutes of inactivity
    sessionTimeout = setTimeout(() => {
      showToast('Session expired due to inactivity', 'error');
      handleLogout();
    }, 30 * 60 * 1000); // 30 minutes
  }
}

// Reset timer on user activity
['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
  document.addEventListener(event, resetSessionTimer, { passive: true });
});

// Initialize session timer
if (authToken) {
  resetSessionTimer();
}

// ==================== Console Welcome Message ====================
console.log('%c NOVUS Admin Dashboard ', 'background: #667eea; color: white; font-size: 20px; padding: 10px; font-weight: bold;');
console.log('%c Welcome! Dashboard initialized successfully. ', 'color: #667eea; font-size: 14px;');
console.log('%c Keyboard shortcuts: ', 'color: #333; font-weight: bold;');
console.log('Alt + D = Dashboard');
console.log('Alt + B = Bookings');
console.log('Alt + C = Contacts');
console.log('Alt + N = Newsletter');
console.log('Alt + S = Settings');
console.log('Esc = Close modal');

// ==================== Export for testing (if needed) ====================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadDashboardData,
    loadBookings,
    loadContacts,
    loadSettings,
    loadNewsletterSubscribers
  };
}