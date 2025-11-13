// ==================== Configuration ====================
const API_URL = 'http://localhost:5000/api';

// ==================== State Management ====================
let formData = {};
let isSubmitting = false;

// ==================== Initialization ====================
document.addEventListener('DOMContentLoaded', () => {
  initializeContactPage();
  console.log('%c NOVUS Contact Page Loaded ✓ ', 'background: #1000BE; color: white; font-size: 14px; padding: 6px; font-weight: bold;');
});

function initializeContactPage() {
  setupNavigation();
  setupContactForm();
  setupFAQ();
  setupCharacterCounter();
  setupFormValidation();
  setupMobileEnhancements();
  addScrollAnimations();
  setupPhoneFormatting();
}

// ==================== Navigation (Mobile Menu) ====================
function setupNavigation() {
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  const navItems = document.querySelectorAll('.nav-links a');
  
  if (hamburger && navLinks) {
    // Toggle mobile menu
    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      navLinks.classList.toggle('active');
      hamburger.classList.toggle('active');
      
      // Prevent body scroll when menu is open
      if (navLinks.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
      
      // Animate hamburger bars
      animateHamburger(hamburger.classList.contains('active'));
    });
    
    // Close menu when clicking nav items
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        navLinks.classList.remove('active');
        hamburger.classList.remove('active');
        document.body.style.overflow = '';
        animateHamburger(false);
      });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('active');
        hamburger.classList.remove('active');
        document.body.style.overflow = '';
        animateHamburger(false);
      }
    });
  }
  
  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId !== '#' && targetId !== '') {
        const target = document.querySelector(targetId);
        if (target) {
          const headerOffset = 80;
          const elementPosition = target.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    });
  });
  
  // Sticky header on scroll
  let lastScroll = 0;
  const header = document.querySelector('.header');
  
  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
    
    // Hide/show header on mobile
    if (window.innerWidth <= 768) {
      if (currentScroll > lastScroll && currentScroll > 100) {
        header.style.transform = 'translateY(-100%)';
      } else {
        header.style.transform = 'translateY(0)';
      }
    }
    
    lastScroll = currentScroll;
  }, { passive: true });
}

function animateHamburger(isActive) {
  const bars = document.querySelectorAll('.hamburger .bar');
  bars.forEach((bar, index) => {
    if (isActive) {
      if (index === 0) bar.style.transform = 'rotate(-45deg) translate(-5px, 6px)';
      if (index === 1) bar.style.opacity = '0';
      if (index === 2) bar.style.transform = 'rotate(45deg) translate(-5px, -6px)';
    } else {
      bar.style.transform = '';
      bar.style.opacity = '';
    }
  });
}

// ==================== Contact Form ====================
function setupContactForm() {
  const form = document.getElementById('contactForm');
  
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
    
    // Real-time validation for each field
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('blur', () => validateField(input));
      input.addEventListener('input', () => clearFieldError(input));
    });
  }
}


// ==================== Form Validation ====================
function validateForm(form) {
  let isValid = true;
  const requiredFields = form.querySelectorAll('[required]');
  
  requiredFields.forEach(field => {
    if (!validateField(field)) {
      isValid = false;
    }
  });
  
  return isValid;
}

function validateField(field) {
  const value = field.value.trim();
  const fieldName = field.name;
  let errorMessage = '';
  
  // Required field validation
  if (field.hasAttribute('required') && !value) {
    errorMessage = 'This field is required';
  }
  
  // Email validation
  else if (fieldName === 'email' && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      errorMessage = 'Please enter a valid email address';
    }
  }
  
  // Phone validation (optional but if provided, must be valid)
  else if (fieldName === 'phone' && value) {
    const phoneRegex = /^[\d\s\+\-\(\)]+$/;
    if (!phoneRegex.test(value) || value.replace(/\D/g, '').length < 10) {
      errorMessage = 'Please enter a valid phone number';
    }
  }
  
  // Name validation
  else if ((fieldName === 'firstName' || fieldName === 'lastName') && value) {
    if (value.length < 2) {
      errorMessage = 'Name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s\-\']+$/.test(value)) {
      errorMessage = 'Name can only contain letters, spaces, hyphens, and apostrophes';
    }
  }
  
  // Subject validation
  else if (fieldName === 'subject' && value && value.length < 5) {
    errorMessage = 'Subject must be at least 5 characters';
  }
  
  // Message validation
  else if (fieldName === 'message' && value) {
    if (value.length < 10) {
      errorMessage = 'Message must be at least 10 characters';
    } else if (value.length > 1000) {
      errorMessage = 'Message must not exceed 1000 characters';
    }
  }
  
  // Checkbox validation (terms)
  else if (field.type === 'checkbox' && field.hasAttribute('required') && !field.checked) {
    errorMessage = 'You must agree to the terms to continue';
  }
  
  // Display error or success
  if (errorMessage) {
    showFieldError(field, errorMessage);
    return false;
  } else {
    clearFieldError(field);
    return true;
  }
}

function showFieldError(field, message) {
  const formGroup = field.closest('.form-group');
  const errorElement = formGroup.querySelector('.error-message');
  
  field.classList.add('error');
  formGroup.classList.add('error');
  
  if (errorElement) {
    errorElement.textContent = message;
  }
}

function clearFieldError(field) {
  const formGroup = field.closest('.form-group');
  const errorElement = formGroup.querySelector('.error-message');
  
  field.classList.remove('error');
  formGroup.classList.remove('error');
  formGroup.classList.add('success');
  
  if (errorElement) {
    errorElement.textContent = '';
  }
  
  // Remove success class after animation
  setTimeout(() => {
    formGroup.classList.remove('success');
  }, 2000);
}

// ==================== Character Counter ====================
function setupCharacterCounter() {
  const messageField = document.getElementById('message');
  const charCount = document.getElementById('charCount');
  const maxChars = 1000;
  
  if (messageField && charCount) {
    messageField.addEventListener('input', () => {
      const currentLength = messageField.value.length;
      charCount.textContent = currentLength;
      
      // Change color based on character count
      if (currentLength > maxChars) {
        charCount.style.color = 'var(--error-color)';
        messageField.classList.add('error');
      } else if (currentLength > maxChars * 0.9) {
        charCount.style.color = 'var(--warning-color)';
        messageField.classList.remove('error');
      } else {
        charCount.style.color = 'var(--secondary-color)';
        messageField.classList.remove('error');
      }
    });
  }
}

// ==================== Phone Number Formatting ====================
function setupPhoneFormatting() {
  const phoneInput = document.getElementById('phone');
  
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      
      // Format Nigerian phone numbers
      if (value.startsWith('234')) {
        if (value.length <= 13) {
          value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{4})/, '+$1 $2 $3 $4');
        }
      } else if (value.startsWith('0')) {
        if (value.length <= 11) {
          value = value.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
        }
      }
      
      e.target.value = value;
    });
  }
}

// ==================== FAQ Accordion ====================
function setupFAQ() {
  const faqQuestions = document.querySelectorAll('.faq-question');
  
  faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
      const faqItem = question.closest('.faq-item');
      const isActive = faqItem.classList.contains('active');
      
      // Close all other FAQs
      document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
        const btn = item.querySelector('.faq-question');
        btn.setAttribute('aria-expanded', 'false');
      });
      
      // Toggle current FAQ
      if (!isActive) {
        faqItem.classList.add('active');
        question.setAttribute('aria-expanded', 'true');
      }
    });
    
    // Keyboard accessibility
    question.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        question.click();
      }
    });
  });
}

// ==================== Scroll Animations ====================
function addScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // Observe elements
  const animatedElements = document.querySelectorAll('.info-card, .faq-item, .feature-item');
  animatedElements.forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
  });
}

// ==================== Loading Overlay ====================
function showLoading(show) {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    if (show) {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    } else {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
}

// ==================== Notifications ====================
function showNotification(message, type = 'info') {
  // Remove existing notification
  const existing = document.querySelector('.notification-banner');
  if (existing) {
    existing.remove();
  }
  
  const notification = document.createElement('div');
  notification.className = `notification-banner ${type}`;
  
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };
  
  notification.innerHTML = `
    <i class="fas ${icons[type]}"></i>
    <span>${message}</span>
    <button class="close-btn" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  document.body.appendChild(notification);
  
  // Trigger animation
  setTimeout(() => notification.classList.add('show'), 10);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// ==================== Mobile Enhancements ====================
function setupMobileEnhancements() {
  // Fix iOS viewport height issue
  const setViewportHeight = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  
  setViewportHeight();
  window.addEventListener('resize', setViewportHeight);
  window.addEventListener('orientationchange', setViewportHeight);
  
  // Prevent zoom on input focus (mobile)
  if (window.innerWidth <= 768) {
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      const fontSize = window.getComputedStyle(input).fontSize;
      if (parseFloat(fontSize) < 16) {
        input.style.fontSize = '16px';
      }
    });
  }
  
  // Add touch feedback
  const interactiveElements = document.querySelectorAll(
    '.cta-button, .info-card, .faq-question, .social-icons a'
  );
  
  interactiveElements.forEach(element => {
    element.addEventListener('touchstart', function() {
      this.style.opacity = '0.8';
    }, { passive: true });
    
    element.addEventListener('touchend', function() {
      setTimeout(() => {
        this.style.opacity = '';
      }, 100);
    }, { passive: true });
  });
  
  // Optimize images for mobile
  if (window.innerWidth <= 768) {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
    });
  }
}

// ==================== Analytics Tracking ====================
function trackFormSubmission(eventName) {
  // Google Analytics 4
  if (typeof gtag !== 'undefined') {
    gtag('event', eventName, {
      event_category: 'Contact Form',
      event_label: 'Contact Page Form'
    });
  }
  
  // Facebook Pixel
  if (typeof fbq !== 'undefined') {
    fbq('track', 'Contact');
  }
  
  console.log(`Tracked event: ${eventName}`);
}

// ==================== CTA Buttons ====================
document.querySelectorAll('.cta-button, .primary-large, .nav-cta').forEach(button => {
  button.addEventListener('click', (e) => {
    const text = button.textContent.toLowerCase();
    
    if (text.includes('schedule') || text.includes('call')) {
      e.preventDefault();
      // Redirect to scheduling page or open scheduling modal
      window.location.href = 'meeting.html';
    }
  });
});

// ==================== Email & Phone Click Tracking ====================
document.querySelectorAll('a[href^="mailto:"], a[href^="tel:"]').forEach(link => {
  link.addEventListener('click', () => {
    const type = link.href.startsWith('mailto:') ? 'email' : 'phone';
    trackFormSubmission(`contact_${type}_click`);
  });
});

// ==================== Map Interaction ====================
const mapIframe = document.querySelector('.map-container iframe');
if (mapIframe) {
  mapIframe.addEventListener('load', () => {
    console.log('Map loaded successfully');
  });
}

// ==================== Accessibility Enhancements ====================
// Add skip to main content link
const skipLink = document.createElement('a');
skipLink.href = '#main-content';
skipLink.className = 'skip-to-main';
skipLink.textContent = 'Skip to main content';
document.body.insertBefore(skipLink, document.body.firstChild);

// Add main content ID
const pageHeader = document.querySelector('.page-header');
if (pageHeader) {
  pageHeader.id = 'main-content';
}

// ==================== Performance Monitoring ====================
if (window.performance && window.performance.timing) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      console.log(`Page loaded in ${pageLoadTime}ms`);
      
      if (pageLoadTime > 3000) {
        console.warn('Page load time is slow. Consider optimization.');
      }
    }, 0);
  });
}

// ==================== Network Status Handling ====================
window.addEventListener('online', () => {
  showNotification('You are back online', 'success');
});

window.addEventListener('offline', () => {
  showNotification('You are offline. Please check your internet connection.', 'warning');
});

// ==================== Error Handling ====================
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// ==================== Form Auto-save (Optional) ====================
function setupFormAutoSave() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  
  const formFields = form.querySelectorAll('input, select, textarea');
  
  // Load saved data on page load
  formFields.forEach(field => {
    const savedValue = localStorage.getItem(`contact_form_${field.name}`);
    if (savedValue && field.type !== 'checkbox') {
      field.value = savedValue;
    } else if (field.type === 'checkbox' && savedValue === 'true') {
      field.checked = true;
    }
  });
  
  // Save data on input
  formFields.forEach(field => {
    field.addEventListener('input', debounce(() => {
      if (field.type === 'checkbox') {
        localStorage.setItem(`contact_form_${field.name}`, field.checked);
      } else {
        localStorage.setItem(`contact_form_${field.name}`, field.value);
      }
    }, 500));
  });
  
  // Clear saved data on successful submission
  form.addEventListener('submit', () => {
    setTimeout(() => {
      formFields.forEach(field => {
        localStorage.removeItem(`contact_form_${field.name}`);
      });
    }, 2000);
  });
}

// Uncomment to enable auto-save
// setupFormAutoSave();

// ==================== Utility Functions ====================
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ==================== Export for Testing ====================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateField,
    validateForm,
    showNotification,
    setupContactForm
  };
}

console.log('%c Contact page features loaded successfully ', 'background: #27ae60; color: white; font-size: 12px; padding: 4px;');