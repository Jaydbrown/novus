// ==================== Configuration ====================
const API_URL = 'http://localhost:5000/api';

// ==================== State Management ====================
let currentDate = new Date();
let selectedDate = null;
let selectedTime = null;
let availableSlots = [];
let settings = null;

// ==================== Initialization ====================
document.addEventListener('DOMContentLoaded', () => {
  initializeScheduler();
});

function initializeScheduler() {
  renderCalendar();
  setupEventListeners();
  loadSettings();
}

// ==================== Event Listeners ====================
function setupEventListeners() {
  // Calendar navigation
  const prevBtn = document.getElementById('prevMonth');
  const nextBtn = document.getElementById('nextMonth');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      renderCalendar();
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar();
    });
  }
  
  // Continue button
  const continueBtn = document.getElementById('continueBtn');
  if (continueBtn) {
    continueBtn.addEventListener('click', handleContinue);
  }
  
  // Booking form
  const bookingForm = document.getElementById('bookingForm');
  if (bookingForm) {
    bookingForm.addEventListener('submit', handleFormSubmit);
  }
  
  // Form validation
  setupFormValidation();
}

function setupFormValidation() {
  const emailInput = document.getElementById('email');
  if (emailInput) {
    emailInput.addEventListener('blur', (e) => {
      validateEmail(e.target);
    });
  }
  
  const nameInput = document.getElementById('name');
  if (nameInput) {
    nameInput.addEventListener('blur', (e) => {
      if (e.target.value.trim().length < 2) {
        showFieldError(e.target, 'Name must be at least 2 characters');
      } else {
        clearFieldError(e.target);
      }
    });
  }
}

// ==================== Load Settings ====================
async function loadSettings() {
  try {
    // Try to load settings, but don't block if it fails
    const response = await fetch(`${API_URL}/bookings/available-slots?date=${new Date().toISOString().split('T')[0]}`);
    if (response.ok) {
      console.log('Server connection successful');
    }
  } catch (error) {
    console.warn('Could not connect to server. Using default settings.');
    showNotification('Using default booking settings. Some features may be limited.', 'warning');
  }
}

// ==================== Calendar Rendering ====================
function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Update header
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const headerElement = document.getElementById('currentMonthYear');
  if (headerElement) {
    headerElement.textContent = `${monthNames[month]} ${year}`;
  }
  
  // Get calendar data
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Build calendar
  const calendarBody = document.getElementById('calendarBody');
  if (!calendarBody) return;
  
  calendarBody.innerHTML = '';
  
  let date = 1;
  let hasMoreDates = true;
  
  // Create calendar rows
  for (let i = 0; i < 6 && hasMoreDates; i++) {
    const row = document.createElement('tr');
    
    for (let j = 0; j < 7; j++) {
      const cell = document.createElement('td');
      
      // First week - handle offset
      if (i === 0 && j < firstDay) {
        cell.textContent = '';
        cell.classList.add('empty');
      } 
      // Dates within month
      else if (date <= daysInMonth) {
        const cellDate = new Date(year, month, date);
        cell.textContent = date;
        cell.dataset.date = cellDate.toISOString();
        
        // Disable past dates and Sundays (if needed)
        if (cellDate < today) {
          cell.classList.add('disabled');
        } else {
          cell.classList.add('selectable');
          cell.addEventListener('click', () => selectDate(cellDate, cell));
        }
        
        // Highlight today
        if (cellDate.toDateString() === today.toDateString()) {
          cell.classList.add('today');
        }
        
        // Highlight selected date
        if (selectedDate && cellDate.toDateString() === selectedDate.toDateString()) {
          cell.classList.add('selected');
        }
        
        date++;
      } 
      // Empty cells after month ends
      else {
        cell.textContent = '';
        cell.classList.add('empty');
        hasMoreDates = false;
      }
      
      row.appendChild(cell);
    }
    
    calendarBody.appendChild(row);
  }
}

// ==================== Date Selection ====================
async function selectDate(date, cell) {
  // Remove previous selection
  document.querySelectorAll('.calendar-table td').forEach(td => {
    td.classList.remove('selected');
  });
  
  // Add new selection
  cell.classList.add('selected');
  selectedDate = date;
  selectedTime = null; // Reset time selection
  
  // Update display
  const dateStr = date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const displayElement = document.getElementById('selectedDateDisplay');
  if (displayElement) {
    displayElement.textContent = dateStr;
  }
  
  // Disable continue button until time is selected
  const continueBtn = document.getElementById('continueBtn');
  if (continueBtn) {
    continueBtn.disabled = true;
  }
  
  // Fetch available time slots
  await fetchTimeSlots(date);
}

// ==================== Fetch Time Slots ====================
async function fetchTimeSlots(date) {
  const slotsContainer = document.getElementById('timeSlots');
  if (!slotsContainer) return;
  
  // Show loading
  slotsContainer.innerHTML = '<div class="loading-slots"><i class="fas fa-spinner fa-spin"></i> Loading available times...</div>';
  
  try {
    const dateStr = date.toISOString().split('T')[0];
    const response = await fetch(`${API_URL}/bookings/available-slots?date=${dateStr}`);
    
    if (response.ok) {
      const data = await response.json();
      availableSlots = data.slots || [];
      renderTimeSlots(availableSlots);
    } else {
      throw new Error('Failed to fetch time slots');
    }
  } catch (error) {
    console.error('Error fetching time slots:', error);
    
    // Fallback to default slots if API fails
    availableSlots = generateDefaultTimeSlots();
    renderTimeSlots(availableSlots);
    
    showNotification('Using default time slots. Please contact us if you need a specific time.', 'warning');
  }
}

function generateDefaultTimeSlots() {
  // Default working hours: 9 AM to 5 PM, 30-minute intervals
  const slots = [];
  for (let hour = 9; hour < 17; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return slots;
}

// ==================== Render Time Slots ====================
function renderTimeSlots(slots) {
  const container = document.getElementById('timeSlots');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (!slots || slots.length === 0) {
    container.innerHTML = `
      <div class="no-slots">
        <i class="fas fa-calendar-times"></i>
        <p>No available time slots for this date</p>
        <p class="hint">Please select a different date</p>
      </div>
    `;
    return;
  }
  
  slots.forEach(slot => {
    const button = document.createElement('button');
    button.className = 'time-slot';
    button.textContent = formatTime(slot);
    button.dataset.time = slot;
    
    button.addEventListener('click', () => selectTimeSlot(slot, button));
    container.appendChild(button);
  });
}

// ==================== Time Slot Selection ====================
function selectTimeSlot(time, button) {
  // Remove previous selection
  document.querySelectorAll('.time-slot').forEach(btn => {
    btn.classList.remove('selected');
  });
  
  // Add new selection
  button.classList.add('selected');
  selectedTime = time;
  
  // Enable continue button
  const continueBtn = document.getElementById('continueBtn');
  if (continueBtn) {
    continueBtn.disabled = false;
  }
}

// ==================== Format Time ====================
function formatTime(time) {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

// ==================== Continue to Form ====================
function handleContinue() {
  if (!selectedDate || !selectedTime) {
    showNotification('Please select both a date and time', 'error');
    return;
  }
  
  // Hide step 1, show step 2
  const step1 = document.getElementById('step1');
  const step2 = document.getElementById('step2');
  
  if (step1) step1.classList.add('hidden');
  if (step2) step2.classList.remove('hidden');
  
  // Update step indicators
  const step1Indicator = document.getElementById('step1Indicator');
  const step2Indicator = document.getElementById('step2Indicator');
  
  if (step1Indicator) step1Indicator.classList.remove('active');
  if (step2Indicator) step2Indicator.classList.add('active');
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== Form Submission ====================
async function handleFormSubmit(e) {
  e.preventDefault();
  
  // Get form data
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const company = document.getElementById('company').value.trim();
  const notes = document.getElementById('notes').value.trim();
  
  // Validate
  if (!validateForm(name, email)) {
    return;
  }
  
  // Disable submit button
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Booking...';
  
  // Prepare booking data
  const bookingData = {
    name,
    email,
    company: company || null,
    notes: notes || null,
    date: selectedDate.toISOString().split('T')[0],
    timeSlot: selectedTime
  };
  
  try {
    const response = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showSuccessPage(bookingData);
    } else {
      throw new Error(data.error || 'Booking failed');
    }
  } catch (error) {
    console.error('Booking error:', error);
    showNotification(error.message || 'Failed to create booking. Please try again.', 'error');
    
    // Re-enable submit button
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

// ==================== Form Validation ====================
function validateForm(name, email) {
  let isValid = true;
  
  // Validate name
  const nameInput = document.getElementById('name');
  if (name.length < 2) {
    showFieldError(nameInput, 'Name must be at least 2 characters');
    isValid = false;
  } else {
    clearFieldError(nameInput);
  }
  
  // Validate email
  const emailInput = document.getElementById('email');
  if (!isValidEmail(email)) {
    showFieldError(emailInput, 'Please enter a valid email address');
    isValid = false;
  } else {
    clearFieldError(emailInput);
  }
  
  return isValid;
}

function validateEmail(input) {
  const email = input.value.trim();
  if (email && !isValidEmail(email)) {
    showFieldError(input, 'Please enter a valid email address');
  } else {
    clearFieldError(input);
  }
}

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function showFieldError(input, message) {
  clearFieldError(input);
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'field-error';
  errorDiv.textContent = message;
  
  input.classList.add('error');
  input.parentNode.appendChild(errorDiv);
}

function clearFieldError(input) {
  input.classList.remove('error');
  const existingError = input.parentNode.querySelector('.field-error');
  if (existingError) {
    existingError.remove();
  }
}

// ==================== Success Page ====================
function showSuccessPage(bookingData) {
  const container = document.querySelector('.form-container');
  if (!container) return;
  
  const dateStr = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  container.innerHTML = `
    <div class="success-message">
      <div class="success-icon">
        <i class="fas fa-check-circle"></i>
      </div>
      <h2>Booking Confirmed!</h2>
      <p>Thank you, ${escapeHtml(bookingData.name)}! Your consultation has been scheduled.</p>
      
      <div class="booking-summary">
        <h3>Booking Details</h3>
        <div class="summary-item">
          <i class="fas fa-calendar"></i>
          <div>
            <strong>Date</strong>
            <span>${dateStr}</span>
          </div>
        </div>
        <div class="summary-item">
          <i class="fas fa-clock"></i>
          <div>
            <strong>Time</strong>
            <span>${formatTime(bookingData.timeSlot)}</span>
          </div>
        </div>
        <div class="summary-item">
          <i class="fas fa-hourglass-half"></i>
          <div>
            <strong>Duration</strong>
            <span>30 minutes</span>
          </div>
        </div>
        <div class="summary-item">
          <i class="fas fa-envelope"></i>
          <div>
            <strong>Confirmation Email</strong>
            <span>Sent to ${escapeHtml(bookingData.email)}</span>
          </div>
        </div>
      </div>
      
      <div class="success-actions">
        <button class="primary-btn" onclick="window.location.href='index.html'">
          <i class="fas fa-home"></i> Return to Home
        </button>
        <button class="secondary-btn" onclick="window.location.reload()">
          <i class="fas fa-calendar-plus"></i> Book Another
        </button>
      </div>
      
      <div class="success-note">
        <i class="fas fa-info-circle"></i>
        <p>Please check your email for confirmation and meeting details. If you need to reschedule or cancel, please contact us at <a href="mailto:contact@novus.com">contact@novus.com</a></p>
      </div>
    </div>
  `;
  
  // Add confetti effect
  createConfetti();
}

// ==================== Confetti Effect ====================
function createConfetti() {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe'];

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 3;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'confetti';
      particle.style.cssText = `
        position: fixed;
        width: 10px;
        height: 10px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        left: ${randomInRange(0, 100)}%;
        top: -10px;
        opacity: 1;
        border-radius: 50%;
        animation: confettiFall ${randomInRange(2, 4)}s linear forwards;
      `;
      document.body.appendChild(particle);
      
      setTimeout(() => particle.remove(), 4000);
    }
  }, 100);
}

// ==================== Notifications ====================
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existing = document.querySelector('.notification-toast');
  if (existing) {
    existing.remove();
  }
  
  const notification = document.createElement('div');
  notification.className = `notification-toast notification-${type}`;
  
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };
  
  notification.innerHTML = `
    <i class="fas ${icons[type] || icons.info}"></i>
    <span>${message}</span>
    <button class="notification-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
}

// ==================== Utility Functions ====================
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ==================== Back Navigation ====================
function goBackToCalendar() {
  const step1 = document.getElementById('step1');
  const step2 = document.getElementById('step2');
  
  if (step1) step1.classList.remove('hidden');
  if (step2) step2.classList.add('hidden');
  
  const step1Indicator = document.getElementById('step1Indicator');
  const step2Indicator = document.getElementById('step2Indicator');
  
  if (step1Indicator) step1Indicator.classList.add('active');
  if (step2Indicator) step2Indicator.classList.remove('active');
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Add back button to form
window.addEventListener('DOMContentLoaded', () => {
  const formContainer = document.querySelector('.form-container');
  if (formContainer) {
    const backButton = document.createElement('button');
    backButton.type = 'button';
    backButton.className = 'back-btn';
    backButton.innerHTML = '<i class="fas fa-arrow-left"></i> Back to Calendar';
    backButton.onclick = goBackToCalendar;
    
    const form = formContainer.querySelector('form');
    if (form) {
      form.insertBefore(backButton, form.firstChild);
    }
  }
});

// ==================== Additional Styles ====================
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
  .loading-slots {
    text-align: center;
    padding: 40px 20px;
    color: #667eea;
    font-size: 14px;
  }
  
  .loading-slots i {
    font-size: 24px;
    margin-bottom: 10px;
    display: block;
  }
  
  .no-slots {
    text-align: center;
    padding: 40px 20px;
    color: #999;
  }
  
  .no-slots i {
    font-size: 48px;
    color: #ddd;
    margin-bottom: 15px;
  }
  
  .no-slots .hint {
    font-size: 13px;
    color: #bbb;
    margin-top: 5px;
  }
  
  .field-error {
    color: #e74c3c;
    font-size: 12px;
    margin-top: 5px;
  }
  
  input.error, textarea.error {
    border-color: #e74c3c !important;
  }
  
  .success-message {
    text-align: center;
    padding: 40px 20px;
  }
  
  .success-icon {
    margin-bottom: 20px;
  }
  
  .success-icon i {
    font-size: 64px;
    color: #27ae60;
    animation: scaleIn 0.5s ease-out;
  }
  
  @keyframes scaleIn {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
  
  .success-message h2 {
    color: #27ae60;
    margin-bottom: 15px;
    font-size: 28px;
  }
  
  .booking-summary {
    background: #f8f9fa;
    border-radius: 10px;
    padding: 25px;
    margin: 30px 0;
    text-align: left;
  }
  
  .booking-summary h3 {
    text-align: center;
    margin-bottom: 20px;
    color: #2c3e50;
  }
  
  .summary-item {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px;
    background: white;
    border-radius: 8px;
    margin-bottom: 10px;
  }
  
  .summary-item i {
    font-size: 24px;
    color: #667eea;
    width: 30px;
  }
  
  .summary-item div {
    flex: 1;
  }
  
  .summary-item strong {
    display: block;
    color: #2c3e50;
    font-size: 14px;
    margin-bottom: 3px;
  }
  
  .summary-item span {
    color: #666;
    font-size: 14px;
  }
  
  .success-actions {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin: 30px 0;
    flex-wrap: wrap;
  }
  
  .secondary-btn {
    padding: 15px 30px;
    background: white;
    color: #667eea;
    border: 2px solid #667eea;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .secondary-btn:hover {
    background: #667eea;
    color: white;
  }
  
  .secondary-btn i,
  .primary-btn i {
    margin-right: 8px;
  }
  
  .success-note {
    background: #e8f4fd;
    border-left: 4px solid #3498db;
    padding: 15px;
    border-radius: 5px;
    text-align: left;
    margin-top: 30px;
  }
  
  .success-note i {
    color: #3498db;
    margin-right: 10px;
  }
  
  .success-note p {
    margin: 0;
    color: #555;
    font-size: 14px;
  }
  
  .success-note a {
    color: #3498db;
    text-decoration: none;
  }
  
  .success-note a:hover {
    text-decoration: underline;
  }
  
  @keyframes confettiFall {
    to {
      transform: translateY(100vh) rotate(360deg);
      opacity: 0;
    }
  }
  
  .notification-toast {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 10000;
    max-width: 400px;
    animation: slideInRight 0.3s ease-out;
  }
  
  @keyframes slideInRight {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .notification-toast.fade-out {
    animation: slideOutRight 0.3s ease-out;
  }
  
  @keyframes slideOutRight {
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
  
  .notification-toast i {
    font-size: 20px;
  }
  
  .notification-success {
    border-left: 4px solid #27ae60;
  }
  
  .notification-success i {
    color: #27ae60;
  }
  
  .notification-error {
    border-left: 4px solid #e74c3c;
  }
  
  .notification-error i {
    color: #e74c3c;
  }
  
  .notification-warning {
    border-left: 4px solid #f39c12;
  }
  
  .notification-warning i {
    color: #f39c12;
  }
  
  .notification-info {
    border-left: 4px solid #3498db;
  }
  
  .notification-info i {
    color: #3498db;
  }
  
  .notification-close {
    background: none;
    border: none;
    color: #999;
    cursor: pointer;
    padding: 5px;
    font-size: 16px;
  }
  
  .notification-close:hover {
    color: #333;
  }
  
  .back-btn {
    background: transparent;
    border: 1px solid #ddd;
    color: #666;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    margin-bottom: 20px;
    transition: all 0.3s;
    font-size: 14px;
  }
  
  .back-btn:hover {
    border-color: #667eea;
    color: #667eea;
  }
  
  .back-btn i {
    margin-right: 8px;
  }
  
  @media (max-width: 640px) {
    .notification-toast {
      left: 10px;
      right: 10px;
      max-width: none;
    }
    
    .success-actions {
      flex-direction: column;
    }
    
    .success-actions button {
      width: 100%;
    }
  }
`;
document.head.appendChild(additionalStyles);

// ==================== Console Message ====================
console.log('%c NOVUS Meeting Scheduler ', 'background: #667eea; color: white; font-size: 16px; padding: 8px; font-weight: bold;');
console.log('Scheduler initialized successfully');

// ==================== Export for Testing ====================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    selectDate,
    selectTimeSlot,
    formatTime,
    validateForm
  };
}