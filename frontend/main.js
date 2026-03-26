import './style.css';
import { onAuthChange, loginUser, registerUser, logoutUser } from './src/auth.js';
import { renderUserDashboard } from './src/userView.js';
import { renderAdminDashboard } from './src/adminView.js';

// DOM Elements
const navLinks = document.getElementById('nav-links');
const authModal = document.getElementById('auth-modal');
const closeAuth = document.getElementById('close-auth');
const authForm = document.getElementById('auth-form');
const appContainer = document.getElementById('app');

// Auth Modal state
let isLoginMode = false;
const authTitle = document.getElementById('auth-title');
const authToggleLink = document.getElementById('auth-toggle-link');
const roleSelection = document.getElementById('role-selection');
const authError = document.getElementById('auth-error');

function showModal() {
  authModal.classList.remove('hidden');
}

function hideModal() {
  authModal.classList.add('hidden');
  authError.classList.add('hidden');
}

closeAuth.addEventListener('click', hideModal);

authToggleLink.addEventListener('click', () => {
  isLoginMode = !isLoginMode;
  authTitle.textContent = isLoginMode ? 'Welcome Back' : 'Create an Account';
  document.getElementById('auth-submit').textContent = isLoginMode ? 'Log In' : 'Sign Up';
  authToggleLink.textContent = isLoginMode ? 'Sign Up' : 'Log In';
  document.getElementById('auth-toggle-text').innerHTML = isLoginMode ?
    `Don't have an account? <span id="auth-toggle-link" class="link">Sign Up</span>` :
    `Already have an account? <span id="auth-toggle-link" class="link">Log In</span>`;

  // Re-bind event
  document.getElementById('auth-toggle-link').addEventListener('click', () => authToggleLink.click());

  if (isLoginMode) {
    roleSelection.classList.add('hidden');
  } else {
    roleSelection.classList.remove('hidden');
  }
});

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authError.classList.add('hidden');
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  const roleEl = document.querySelector('input[name="role"]:checked');
  const role = roleEl ? roleEl.value : 'user';

  try {
    if (isLoginMode) {
      await loginUser(email, password);
    } else {
      await registerUser(email, password, role);
    }
    hideModal();
  } catch (error) {
    authError.textContent = error.message;
    authError.classList.remove('hidden');
  }
});

function renderNav(user, role) {
  navLinks.innerHTML = '';
  if (!user) {
    const loginBtn = document.createElement('button');
    loginBtn.className = 'btn outline-btn';
    loginBtn.textContent = 'Login / Sign Up';
    loginBtn.onclick = showModal;
    navLinks.appendChild(loginBtn);
    renderHome();
  } else {
    if (role === 'admin') {
      const adminLink = document.createElement('a');
      adminLink.textContent = 'Admin Dashboard';
      adminLink.href = '#';
      navLinks.appendChild(adminLink);
      renderAdminDashboard(appContainer);
    } else {
      const userLink = document.createElement('a');
      userLink.textContent = 'Adopt a Pet';
      userLink.href = '#';
      navLinks.appendChild(userLink);
      renderUserDashboard(appContainer);
    }

    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'btn primary-btn';
    logoutBtn.textContent = 'Logout';
    logoutBtn.onclick = logoutUser;
    navLinks.appendChild(logoutBtn);
  }
}

onAuthChange((user, role) => {
  renderNav(user, role);
});

// Placeholder render functions
function renderHome() {
  appContainer.innerHTML = `
    <div class="hero slide-up">
      <h1>Find Your New Best Friend</h1>
      <p>Browse our selection of adorable pets waiting for a home. Start your adoption journey today.</p>
      <button class="btn primary-btn large" onclick="document.getElementById('auth-modal').classList.remove('hidden')">Get Started</button>
    </div>
  `;
}

// Initial render
renderHome();
