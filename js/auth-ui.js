export class AuthUI {
  constructor(auth) {
    this.auth = auth;
    this.container = document.getElementById('auth-container');
  }

  showLoginForm() {
    this.container.innerHTML = `
      <div class="auth-form">
        <div class="google-logo">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/1280px-Gmail_icon_%282020%29.svg.png" alt="Gmail Logo">
        </div>
        <h1>Sign in</h1>
        <h2>to continue to Elizabeth's English Learning</h2>
        <form id="login-form">
          <div class="form-group">
            <input type="email" id="login-email" required>
            <label for="login-email">Email</label>
          </div>
          <div class="form-group">
            <input type="password" id="login-password" required>
            <label for="login-password">Password</label>
          </div>
          <div class="form-actions">
            <button type="button" class="text-button" onclick="authUI.showRegisterForm()">Create account</button>
            <button type="submit" class="primary-button">Next</button>
          </div>
        </form>
      </div>
    `;

    this.setupLoginHandler();
  }

  showRegisterForm() {
    this.container.innerHTML = `
      <div class="auth-form">
        <div class="google-logo">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/1280px-Gmail_icon_%282020%29.svg.png" alt="Gmail Logo">
        </div>
        <h1>Create your Account</h1>
        <h2>to continue to Elizabeth's English Learning</h2>
        <form id="register-form">
          <div class="form-group">
            <input type="text" id="register-name" required>
            <label for="register-name">Name</label>
          </div>
          <div class="form-group">
            <input type="email" id="register-email" required>
            <label for="register-email">Email</label>
          </div>
          <div class="form-group">
            <input type="password" id="register-password" required>
            <label for="register-password">Password</label>
          </div>
          <div class="form-group">
            <input type="password" id="register-confirm-password" required>
            <label for="register-confirm-password">Confirm Password</label>
          </div>
          <div class="form-actions">
            <button type="button" class="text-button" onclick="authUI.showLoginForm()">Sign in instead</button>
            <button type="submit" class="primary-button">Next</button>
          </div>
        </form>
      </div>
    `;

    this.setupRegisterHandler();
  }

  showWelcomeMessage(name) {
    const overlay = document.createElement('div');
    overlay.className = 'welcome-overlay';
    overlay.innerHTML = `
      <div class="welcome-message">
        <div class="welcome-icon">
          <i class="ph ph-check-circle"></i>
        </div>
        <h2>¡Welcome, ${name}!</h2>
        <p>Your account has been created successfully.</p>
        <button class="primary-button">Continue to Sign In</button>
      </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => {
      overlay.classList.add('show');
    });

    overlay.querySelector('button').onclick = () => {
      overlay.classList.remove('show');
      setTimeout(() => {
        overlay.remove();
        this.showLoginForm();
      }, 300);
    };
  }

  showLogoutConfirmation(callback) {
    const modal = document.createElement('div');
    modal.className = 'logout-modal';
    modal.innerHTML = `
      <div class="logout-modal-content">
        <div class="logout-icon">
          <i class="ph ph-sign-out"></i>
        </div>
        <h3>Sign Out?</h3>
        <p>Are you sure you want to sign out from your account?</p>
        <div class="logout-modal-buttons">
          <button class="cancel-button">
            <i class="ph ph-x"></i>
            Cancel
          </button>
          <button class="confirm-button">
            <i class="ph ph-sign-out"></i>
            Sign Out
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    requestAnimationFrame(() => {
      modal.classList.add('show');
    });

    const handleClose = () => {
      modal.classList.remove('show');
      setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector('.cancel-button').onclick = handleClose;
    modal.querySelector('.confirm-button').onclick = () => {
      handleClose();
      callback();
    };

    modal.onclick = (e) => {
      if (e.target === modal) handleClose();
    };
  }

  setupLoginHandler() {
    const form = document.getElementById('login-form');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      try {
        const user = await this.auth.loginUser(email, password);
        localStorage.setItem('userId', user.id);
        localStorage.setItem('userName', user.name);
        this.hideAuthContainer();
        location.reload();
      } catch (error) {
        this.showError('login-email', 'Invalid credentials');
      }
    };
  }

  setupRegisterHandler() {
    const form = document.getElementById('register-form');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const name = document.getElementById('register-name').value;
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;
      const confirmPassword = document.getElementById('register-confirm-password').value;

      if (password !== confirmPassword) {
        this.showError('register-confirm-password', 'Passwords do not match');
        return;
      }

      try {
        const userId = await this.auth.registerUser(name, email, password);
        this.showWelcomeMessage(name);
      } catch (error) {
        this.showError('register-email', 'Registration failed. Email might already be in use.');
      }
    };
  }

  showError(inputId, message) {
    const input = document.getElementById(inputId);
    const formGroup = input.closest('.form-group');
    formGroup.classList.add('error');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    formGroup.appendChild(errorDiv);

    setTimeout(() => {
      formGroup.classList.remove('error');
      errorDiv.remove();
    }, 3000);
  }

  hideAuthContainer() {
    this.container.style.display = 'none';
    document.querySelector('.app').style.display = 'block';
  }

  showAuthContainer() {
    this.container.style.display = 'flex';
    document.querySelector('.app').style.display = 'none';
  }
}