document.addEventListener('DOMContentLoaded', function () {
    // === Get Credentials Toggle ===
const credentialsBtn = document.getElementById('showCredentialsBtn');
const credentialsCard = document.getElementById('credentialsCard');
const closeCredentials = document.getElementById('closeCredentials');

credentialsBtn.addEventListener('click', () => {
  credentialsCard.classList.add('show');
});

closeCredentials.addEventListener('click', () => {
  credentialsCard.classList.remove('show');
});

  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const rememberMe = document.getElementById('rememberMe');
  const strengthFeedback = document.getElementById('strengthFeedback');
  const loginContainer = document.querySelector('.login-container');
  const lockoutMessage = document.createElement('div');

  lockoutMessage.classList.add('lockout-timer');
  loginContainer.appendChild(lockoutMessage);

  const errorSound = new Audio('./assets/error.mp3');
  const successSound = new Audio('./assets/success.mp3');

  const LOCK_KEY = 'loginLockedUntil';
  const ATTEMPT_KEY = 'failedAttempts';
  const MAX_ATTEMPTS = 3;
  const LOCK_DURATION = 2 * 60 * 1000; 

  // Load saved username
  if (localStorage.getItem('rememberedUsername')) {
    usernameInput.value = localStorage.getItem('rememberedUsername');
    rememberMe.checked = true;
  }

  // Fade login container
  function fadeLoginContainer(visible) {
    loginContainer.style.opacity = visible ? '1' : '0';
    loginContainer.style.pointerEvents = visible ? 'auto' : 'none';
  }

  // Disable/Enable fields
  function setInputsDisabled(disabled) {
    usernameInput.disabled = disabled;
    passwordInput.disabled = disabled;
    rememberMe.disabled = disabled;
    loginForm.querySelector('button[type="submit"]').disabled = disabled;
  }

  // Lockout check
  function isLockedOut() {
    const until = parseInt(localStorage.getItem(LOCK_KEY));
    if (until && Date.now() < until) {
      startCountdown(until - Date.now());
      setInputsDisabled(true);
      return true;
    }
    localStorage.removeItem(LOCK_KEY);
    lockoutMessage.innerHTML = '';
    setInputsDisabled(false);
    return false;
  }

  // Lockout trigger
  function lockOutUser() {
    const unlockTime = Date.now() + LOCK_DURATION;
    localStorage.setItem(LOCK_KEY, unlockTime.toString());
    startCountdown(LOCK_DURATION);
    setInputsDisabled(true);
  }

  // Countdown display
  function startCountdown(ms) {
    const end = Date.now() + ms;
    const interval = setInterval(() => {
      const remaining = end - Date.now();
      if (remaining <= 0) {
        clearInterval(interval);
        lockoutMessage.innerHTML = '';
        setInputsDisabled(false);
        localStorage.removeItem(LOCK_KEY);
        return;
      }
      const m = Math.floor(remaining / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      lockoutMessage.innerHTML = `<p style="margin-top: 1rem; color: #FFD83E; font-size: 0.65rem;">Locked ⏳ ${m}:${s < 10 ? '0' : ''}${s}</p>`;
    }, 1000);
  }

  // Password Strength Meter
  passwordInput.addEventListener('input', () => {
    const result = zxcvbn(passwordInput.value);
    let message = '';
    if (passwordInput.value.length === 0) message = '';
    else if (result.score <= 1) message = 'Weak password 🟥';
    else if (result.score === 2) message = 'Moderate password 🟨';
    else message = 'Strong password 🟩';
    strengthFeedback.textContent = message;
  });

  // Handle Login
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();

    // Prevent login if locked
    if (isLockedOut()) {
      errorSound.play();
      fadeLoginContainer(false);
      Swal.fire({
        icon: 'error',
        title: 'Locked!',
        text: 'Too many failed attempts. Please try again later.'
      }).then(() => fadeLoginContainer(true));
      return;
    }

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    // Basic validation
    if (!username || !password) {
      errorSound.play();
      Swal.fire({
        icon: 'error',
        title: 'Missing Info',
        text: 'Both fields are required!'
      });
      return;
    }

    // Save Remember Me
    if (rememberMe.checked) {
      localStorage.setItem('rememberedUsername', username);
    } else {
      localStorage.removeItem('rememberedUsername');
    }

    // Dummy Auth
    const fakeUser = { username: 'celebal', password: 'celebal@2025' };

    if (username === fakeUser.username && password === fakeUser.password) {
      successSound.play();
      fadeLoginContainer(false);
      Swal.fire({
        icon: 'success',
        title: 'Login Successful!',
        text: 'Redirecting...',
        timer: 4000,
        showConfirmButton: false
      }).then(() => {
        localStorage.removeItem(ATTEMPT_KEY);
       window.location.href = 'https://www.celebaltech.com/';
      });
    } else {
      errorSound.play();
      fadeLoginContainer(false);

      let attempts = parseInt(localStorage.getItem(ATTEMPT_KEY)) || 0;
      attempts += 1;
      const attemptsLeft = MAX_ATTEMPTS - attempts;

      if (attempts >= MAX_ATTEMPTS) {
        localStorage.removeItem(ATTEMPT_KEY);
        lockOutUser();
        Swal.fire({
          icon: 'error',
          title: 'Account Locked!',
          text: 'Too many failed attempts. Locked for 2 minutes.',
          timer: 3000,
          showConfirmButton: false
        }).then(() => fadeLoginContainer(true));
      } else {
        localStorage.setItem(ATTEMPT_KEY, attempts.toString());
        Swal.fire({
          icon: 'error',
          title: 'Login Failed!',
          text: `Invalid credentials. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} left.`,
          timer: 2000,
          showConfirmButton: false
        }).then(() => fadeLoginContainer(true));
      }
    }
  });

  // Run initial lock check
  isLockedOut();
});
