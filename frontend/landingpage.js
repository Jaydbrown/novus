// ==================== Configuration ====================
const API_URL = 'http://localhost:5000/api';

// ==================== State Management ====================
let currentSlide = 0;
let isScrolling = false;
let observedElements = new Set();

// ==================== Initialization ====================
document.addEventListener('DOMContentLoaded', () => {
  initializeLandingPage();
});

function initializeLandingPage() {
  setupNavigation();
  setupForms();
  setupAnimations();
  setupTestimonialSlider();
  setupCounters();
  setupScrollEffects();
  setupCallToAction();
  
  console.log('%c NOVUS Landing Page ', 'background: #667eea; color: white; font-size: 16px; padding: 8px; font-weight: bold;');
  console.log('Landing page initialized successfully');
}

// ==================== Navigation ====================
function setupNavigation() {
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  
  // Mobile menu toggle
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      hamburger.classList.toggle('active');
      
      // Animate hamburger bars
      const bars = hamburger.querySelectorAll('.bar');
      bars.forEach((bar, index) => {
        if (hamburger.classList.contains('active')) {
          if (index === 0) bar.style.transform = 'rotate(-45deg) translate(-5px, 6px)';
          if (index === 1) bar.style.opacity = '0';
          if (index === 2) bar.style.transform = 'rotate(45deg) translate(-5px, -6px)';
        } else {
          bar.style.transform = '';
          bar.style.opacity = '';
        }
      });
    });
  }
  
  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const target = document.querySelector(targetId);
      if (target) {
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        
        // Close mobile menu
        if (navLinks) navLinks.classList.remove('active');
        if (hamburger) hamburger.classList.remove('active');
      }
    });
  });
  
  // Sticky header on scroll
  let lastScroll = 0;
  const header = document.querySelector('.header');
  
  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
      header?.classList.add('sticky');
    } else {
      header?.classList.remove('sticky');
    }
    
    lastScroll = currentScroll;
  }, { passive: true });
}

// ==================== Forms ====================
function setupForms() {
  // Hero Contact Form
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', handleContactFormSubmit);
  }
  
  // Newsletter Form
  const newsletterForms = document.querySelectorAll('.subscribe-form form');
  newsletterForms.forEach(form => {
    form.addEventListener('submit', handleNewsletterSubmit);
  });
  
  // Real-time email validation
  document.querySelectorAll('input[type="email"]').forEach(input => {
    input.addEventListener('blur', validateEmailField);
    input.addEventListener('input', clearFieldError);
  });
  
  // Real-time name validation
  document.querySelectorAll('input[placeholder*="Name"]').forEach(input => {
    input.addEventListener('blur', validateNameField);
    input.addEventListener('input', clearFieldError);
  });
}

async function handleContactFormSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const nameInput = form.querySelector('input[type="text"]');
  const emailInput = form.querySelector('input[type="email"]');
  const subjectInput = form.querySelectorAll('input[type="text"]')[1];
  const messageInput = form.querySelector('textarea');
  
  // Get values
  const name = nameInput?.value.trim();
  const email = emailInput?.value.trim();
  const subject = subjectInput?.value.trim();
  const message = messageInput?.value.trim();
  
  // Validate
  if (!validateContactForm(name, email, message)) {
    return;
  }
  
  // Get submit button
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  
  // Disable and show loading
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
  
  try {
    const response = await fetch(`${API_URL}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, subject, message })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showNotification('Thank you! Your message has been sent successfully. We\'ll get back to you soon.', 'success');
      form.reset();
    } else {
      throw new Error(data.error || 'Failed to send message');
    }
  } catch (error) {
    console.error('Contact form error:', error);
    showNotification(error.message || 'Failed to send message. Please try again or contact us directly.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

async function handleNewsletterSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const emailInput = form.querySelector('input[type="email"]');
  const email = emailInput?.value.trim();
  
  // Validate email
  if (!email || !isValidEmail(email)) {
    showNotification('Please enter a valid email address', 'error');
    emailInput?.focus();
    return;
  }
  
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subscribing...';
  
  try {
    const response = await fetch(`${API_URL}/newsletter/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showNotification('Successfully subscribed! Check your email for confirmation.', 'success');
      form.reset();
    } else if (response.status === 400 && data.error.includes('subscribed')) {
      showNotification('You\'re already subscribed to our newsletter!', 'info');
    } else {
      throw new Error(data.error || 'Subscription failed');
    }
  } catch (error) {
    console.error('Newsletter error:', error);
    showNotification(error.message || 'Failed to subscribe. Please try again later.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

// ==================== Form Validation ====================
function validateContactForm(name, email, message) {
  let isValid = true;
  
  if (!name || name.length < 2) {
    showNotification('Please enter your full name', 'error');
    isValid = false;
  }
  
  if (!email || !isValidEmail(email)) {
    showNotification('Please enter a valid email address', 'error');
    isValid = false;
  }
  
  if (!message || message.length < 10) {
    showNotification('Please enter a message (at least 10 characters)', 'error');
    isValid = false;
  }
  
  return isValid;
}

function validateEmailField(e) {
  const email = e.target.value.trim();
  if (email && !isValidEmail(email)) {
    e.target.classList.add('error');
    showFieldError(e.target, 'Please enter a valid email address');
  }
}

function validateNameField(e) {
  const name = e.target.value.trim();
  if (name && name.length < 2) {
    e.target.classList.add('error');
    showFieldError(e.target, 'Name must be at least 2 characters');
  }
}

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function showFieldError(input, message) {
  clearFieldError(input);
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'field-error-message';
  errorDiv.textContent = message;
  errorDiv.style.cssText = 'color: #e74c3c; font-size: 12px; margin-top: 5px;';
  
  input.parentNode.appendChild(errorDiv);
}

function clearFieldError(e) {
  const input = e.target || e;
  input.classList.remove('error');
  
  const errorMsg = input.parentNode.querySelector('.field-error-message');
  if (errorMsg) {
    errorMsg.remove();
  }
}

// ==================== Animations ====================
function setupAnimations() {
  // Intersection Observer for fade-in animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !observedElements.has(entry.target)) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observedElements.add(entry.target);
      }
    });
  }, observerOptions);
  
  // Apply fade-in to sections
  const sections = document.querySelectorAll('.about, .services, .stats, .case-studies, .testimonials, .blog, .contact');
  
  sections.forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    fadeInObserver.observe(section);
  });
  
  // Service cards stagger animation
  const serviceCards = document.querySelectorAll('.service-card');
  serviceCards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`;
  });
  
  const serviceObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.2 });
  
  serviceCards.forEach(card => serviceObserver.observe(card));
}

// ==================== Counter Animation ====================
function setupCounters() {
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counters = entry.target.querySelectorAll('.counter');
        counters.forEach(counter => {
          animateCounter(counter);
        });
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  
  const statsSection = document.querySelector('.stats');
  if (statsSection) {
    counterObserver.observe(statsSection);
  }
}

function animateCounter(element) {
  const target = parseInt(element.getAttribute('data-target')) || parseInt(element.textContent);
  const duration = 2000;
  const increment = target / (duration / 16);
  let current = 0;
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target + '+';
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current) + '+';
    }
  }, 16);
}

// ==================== Testimonial Slider ====================
function setupTestimonialSlider() {
  const slides = document.querySelectorAll('.testimonial-slide');
  const prevBtn = document.querySelector('.slider-prev');
  const nextBtn = document.querySelector('.slider-next');
  
  if (slides.length === 0) return;
  
  function showSlide(index) {
    slides.forEach(slide => slide.classList.remove('active'));
    
    if (index >= slides.length) {
      currentSlide = 0;
    } else if (index < 0) {
      currentSlide = slides.length - 1;
    } else {
      currentSlide = index;
    }
    
    slides[currentSlide].classList.add('active');
  }
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => showSlide(currentSlide - 1));
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => showSlide(currentSlide + 1));
  }
  
  // Auto-advance slides every 5 seconds
  setInterval(() => showSlide(currentSlide + 1), 5000);
  
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') showSlide(currentSlide - 1);
    if (e.key === 'ArrowRight') showSlide(currentSlide + 1);
  });
  
  // Touch swipe support
  let touchStartX = 0;
  let touchEndX = 0;
  
  const sliderContainer = document.querySelector('.testimonials-slider');
  if (sliderContainer) {
    sliderContainer.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    sliderContainer.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });
  }
  
  function handleSwipe() {
    if (touchEndX < touchStartX - 50) showSlide(currentSlide + 1);
    if (touchEndX > touchStartX + 50) showSlide(currentSlide - 1);
  }
}

// ==================== Scroll Effects ====================
function setupScrollEffects() {
  // Parallax effect for hero section
  const hero = document.querySelector('.hero');
  
  if (hero) {
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      const parallax = scrolled * 0.5;
      hero.style.transform = `translateY(${parallax}px)`;
    }, { passive: true });
  }
  
  // Reveal animations on scroll
  const revealElements = document.querySelectorAll('.blog-post, .case-study-card');
  
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, index * 100);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  
  revealElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    revealObserver.observe(el);
  });
}

// ==================== Call to Action ====================
function setupCallToAction() {
  const ctaButtons = document.querySelectorAll('.cta-button, .primary1');
  
  ctaButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const text = button.textContent.toLowerCase();
      
      if (text.includes('get started') || 
          text.includes('start a conversation') || 
          text.includes('contact us') ||
          text.includes('schedule')) {
        e.preventDefault();
        
        // Check if it's a contact form in the hero section
        if (button.closest('#contactForm')) {
          return; // Let the form submit naturally
        }
        
        // Redirect to meeting scheduler
        window.location.href = 'meeting.html';
      }
    });
  });
  
  // "Learn more" links smooth scroll
  document.querySelectorAll('.learn-more, .read-more').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // If it has a specific href, scroll there
      const href = link.getAttribute('href');
      if (href && href !== '#') {
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });
}

// ==================== Notifications ====================
function showNotification(message, type = 'info') {
  // Remove existing notification
  const existing = document.querySelector('.notification-banner');
  if (existing) {
    existing.remove();
  }
  
  const notification = document.createElement('div');
  notification.className = `notification-banner notification-${type}`;
  
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };
  
  const colors = {
    success: '#27ae60',
    error: '#e74c3c',
    warning: '#f39c12',
    info: '#3498db'
  };
  
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas ${icons[type]}"></i>
      <span>${message}</span>
    </div>
    <button class="notification-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    color: #333;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    border-left: 4px solid ${colors[type]};
    z-index: 10000;
    max-width: 400px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    animation: slideInRight 0.3s ease-out;
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// ==================== Lazy Loading Images ====================
if ('IntersectionObserver' in window) {
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const src = img.getAttribute('data-src');
        
        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
          img.classList.add('loaded');
          imageObserver.unobserve(img);
        }
      }
    });
  });
  
  // Observe all images with data-src attribute
  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}

// ==================== Additional Styles ====================
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
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
  
  @keyframes slideOutRight {
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
  
  .notification-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .notification-content i {
    font-size: 20px;
  }
  
  .notification-success .notification-content i { color: #27ae60; }
  .notification-error .notification-content i { color: #e74c3c; }
  .notification-warning .notification-content i { color: #f39c12; }
  .notification-info .notification-content i { color: #3498db; }
  
  .notification-close {
    background: none;
    border: none;
    color: #999;
    cursor: pointer;
    padding: 5px;
    font-size: 16px;
    transition: color 0.3s;
  }
  
  .notification-close:hover {
    color: #333;
  }
  
  .header.sticky {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 1000;
    animation: slideDown 0.3s ease-out;
  }
  
  @keyframes slideDown {
    from {
      transform: translateY(-100%);
    }
    to {
      transform: translateY(0);
    }
  }
  
  input.error, textarea.error {
    border-color: #e74c3c !important;
  }
  
  .hamburger.active .bar:nth-child(1) {
    transform: rotate(-45deg) translate(-5px, 6px);
  }
  
  .hamburger.active .bar:nth-child(2) {
    opacity: 0;
  }
  
  .hamburger.active .bar:nth-child(3) {
    transform: rotate(45deg) translate(-5px, -6px);
  }
  
  .bar {
    transition: all 0.3s ease;
  }
  
  @media (max-width: 768px) {
    .nav-links {
      position: fixed;
      left: -100%;
      top: 70px;
      flex-direction: column;
      background-color: white;
      width: 100%;
      text-align: center;
      transition: 0.3s;
      box-shadow: 0 10px 27px rgba(0,0,0,0.1);
      padding: 20px 0;
      z-index: 999;
    }
    
    .nav-links.active {
      left: 0;
    }
    
    .nav-links li {
      margin: 15px 0;
    }
    
    .notification-banner {
      left: 10px !important;
      right: 10px !important;
      max-width: none !important;
    }
  }
  
  /* Smooth scrolling */
  html {
    scroll-behavior: smooth;
  }
  
  /* Image loading effect */
  img {
    transition: opacity 0.3s ease;
  }
  
  img[data-src] {
    opacity: 0.5;
    filter: blur(5px);
  }
  
  img.loaded {
    opacity: 1;
    filter: blur(0);
  }
  
  /* Button hover effects */
  .cta-button, .primary1 {
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  
  .cta-button:hover, .primary1:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
  }
  
  .cta-button:active, .primary1:active {
    transform: translateY(0);
  }
  
  /* Card hover effects */
  .service-card, .case-study-card, .blog-post {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  .service-card:hover, .case-study-card:hover, .blog-post:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  }
  
  /* Loading animation for buttons */
  .fa-spinner {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  /* Focus styles for accessibility */
  button:focus, input:focus, textarea:focus, select:focus {
    outline: 2px solid #667eea;
    outline-offset: 2px;
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  
  /* Print styles */
  @media print {
    .header, .cta-button, .hamburger, .notification-banner {
      display: none !important;
    }
  }
`;
document.head.appendChild(additionalStyles);

// ==================== Performance Monitoring ====================
if (window.performance && window.performance.timing) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      console.log(`Page loaded in ${pageLoadTime}ms`);
    }, 0);
  });
}

// ==================== Error Handling ====================
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// ==================== Network Status ====================
window.addEventListener('online', () => {
  showNotification('Connection restored', 'success');
});

window.addEventListener('offline', () => {
  showNotification('You are offline. Some features may be unavailable.', 'warning');
});

// ==================== Export for Testing ====================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isValidEmail,
    validateContactForm,
    showNotification
  };
}

