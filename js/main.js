// API Base URL - Change this to your deployed backend URL
const API_BASE_URL = 'http://localhost:3000/api';

// Countdown Timer
function updateCountdown() {
  fetch(`${API_BASE_URL}/countdown`)
    .then(response => response.json())
    .then(data => {
      if (data.expired) {
        document.querySelectorAll('.countdown-number').forEach(el => {
          el.textContent = '00';
        });
        // Optionally disable registration
        const registerBtns = document.querySelectorAll('button[type="submit"], a[href*="registration"]');
        registerBtns.forEach(btn => {
          btn.disabled = true;
          btn.classList.add('opacity-50', 'cursor-not-allowed');
          if (btn.tagName === 'BUTTON') {
            btn.textContent = 'REGISTRATION CLOSED';
          }
        });
        return;
      }

      // Update countdown display
      const countdownElements = document.querySelectorAll('.countdown-display');
      countdownElements.forEach(container => {
        const daysEl = container.querySelector('[data-days]');
        const hoursEl = container.querySelector('[data-hours]');
        const minutesEl = container.querySelector('[data-minutes]');
        const secondsEl = container.querySelector('[data-seconds]');

        if (daysEl) daysEl.textContent = String(data.days).padStart(2, '0');
        if (hoursEl) hoursEl.textContent = String(data.hours).padStart(2, '0');
        if (minutesEl) minutesEl.textContent = String(data.minutes).padStart(2, '0');
        if (secondsEl) secondsEl.textContent = String(data.seconds).padStart(2, '0');
      });
    })
    .catch(error => {
      console.error('Countdown fetch error:', error);
      // Fallback to client-side calculation
      calculateCountdownLocally();
    });
}

// Fallback client-side countdown
function calculateCountdownLocally() {
  const targetDate = new Date('2025-12-05T23:59:59+05:30');
  const now = new Date();
  const diff = targetDate - now;

  if (diff <= 0) {
    document.querySelectorAll('.countdown-number').forEach(el => {
      el.textContent = '00';
    });
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const countdownElements = document.querySelectorAll('.countdown-display');
  countdownElements.forEach(container => {
    const daysEl = container.querySelector('[data-days]');
    const hoursEl = container.querySelector('[data-hours]');
    const minutesEl = container.querySelector('[data-minutes]');
    const secondsEl = container.querySelector('[data-seconds]');

    if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
    if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
  });
}

// Contact Form Handler
function setupContactForm() {
  const form = document.querySelector('#contact form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'SENDING...';

    const formData = {
      name: form.querySelector('[name="name"]').value,
      email: form.querySelector('[name="email"]').value,
      subject: form.querySelector('[name="subject"]').value,
      message: form.querySelector('[name="message"]').value
    };

    try {
      const response = await fetch(`${API_BASE_URL}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        // Show success message
        showNotification('Message sent successfully! We\'ll get back to you soon.', 'success');
        form.reset();
      } else {
        showNotification(data.message || 'Failed to send message. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      showNotification('Network error. Please check your connection and try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

// Registration Form Handler
function setupRegistrationForm() {
  const form = document.getElementById('registration-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'REGISTERING...';

    // Collect form data
    const formData = {
      teamName: form.querySelector('[name="teamName"]').value,
      track: form.querySelector('[name="track"]').value,
      members: [],
      problem: form.querySelector('[name="problem"]').value
    };

    // Collect all member data
    const memberInputs = form.querySelectorAll('[name^="members"]');
    const membersData = {};
    
    memberInputs.forEach(input => {
      const match = input.name.match(/members\[(\d+)\]\[(\w+)\]/);
      if (match) {
        const [, index, field] = match;
        if (!membersData[index]) membersData[index] = {};
        membersData[index][field] = input.value;
      }
    });

    formData.members = Object.values(membersData).filter(member => 
      member.name && member.email && member.college && member.regNo && member.gender
    );

    // Validation
    if (formData.members.length < 2) {
      showNotification('Please add at least 2 team members', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      return;
    }

    if (formData.members.length > 5) {
      showNotification('Maximum 5 members allowed per team', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        // Store registration ID in sessionStorage
        sessionStorage.setItem('registrationId', data.registrationId);
        sessionStorage.setItem('teamName', data.teamName);
        // Redirect to success page
        window.location.href = 'success.html';
      } else {
        showNotification(data.message || 'Registration failed. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      showNotification('Network error. Please check your connection and try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

// Success page - display registration ID from session
function setupSuccessPage() {
  const regIdElement = document.getElementById('reg-id');
  if (!regIdElement) return;

  const registrationId = sessionStorage.getItem('registrationId');
  if (registrationId) {
    regIdElement.textContent = registrationId;
  } else {
    // Fallback to random if not found
    regIdElement.textContent = Math.floor(100000 + Math.random() * 900000);
  }
}

// Notification system
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `fixed top-24 right-4 z-50 max-w-md p-4 rounded-lg border-2 transform translate-x-0 transition-all duration-300 ${
    type === 'success' ? 'bg-card-surface border-accent-yellow' : 
    type === 'error' ? 'bg-card-surface border-red-500' : 
    'bg-card-surface border-border-color'
  }`;
  
  notification.innerHTML = `
    <div class="flex items-start gap-3">
      <span class="material-symbols-outlined ${
        type === 'success' ? 'text-accent-yellow' : 
        type === 'error' ? 'text-red-500' : 
        'text-text-secondary'
      }">
        ${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info'}
      </span>
      <div class="flex-1">
        <p class="text-text-default text-sm">${message}</p>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" class="text-text-secondary hover:text-text-default">
        <span class="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  `;

  document.body.appendChild(notification);

  // Auto remove after 5 seconds
  setTimeout(() => {
    notification.style.transform = 'translateX(400px)';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  // Start countdown timer
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // Setup forms
  setupContactForm();
  setupRegistrationForm();
  setupSuccessPage();

  console.log('✅ IEEE Hackathon 2025 - System Initialized');
}