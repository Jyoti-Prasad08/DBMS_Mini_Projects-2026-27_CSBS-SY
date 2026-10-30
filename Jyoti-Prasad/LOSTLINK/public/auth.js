(function () {
  'use strict';

  var root = document.documentElement;
  var showcase = document.getElementById('authShowcase');
  var loginForm = document.getElementById('loginForm');
  var registerForm = document.getElementById('registerForm');
  if (!showcase || !loginForm || !registerForm) return;

  var forms = { login: loginForm, register: registerForm };
  var panels = {
    login: document.getElementById('loginPanel'),
    register: document.getElementById('registerPanel'),
  };
  var messages = {
    login: document.getElementById('loginMessage'),
    register: document.getElementById('registerMessage'),
  };
  var buttons = {
    login: document.getElementById('loginButton'),
    register: document.getElementById('registerButton'),
  };
  var labels = {
    login: document.getElementById('loginButtonLabel'),
    register: document.getElementById('registerButtonLabel'),
  };
  var promos = {
    login: document.querySelector('[data-promo="login"]'),
    register: document.querySelector('[data-promo="register"]'),
  };
  var switchLinks = Array.prototype.slice.call(document.querySelectorAll('[data-auth-switch]'));
  var busy = { login: false, register: false };
  var redirecting = false;

  function normalizeMode(value) {
    return value === 'register' ? 'register' : 'login';
  }

  function modeFromLocation() {
    var path = window.location.pathname.toLowerCase();
    var queryMode = new URLSearchParams(window.location.search).get('mode');
    return /\/register(?:\.html)?$/.test(path) || queryMode === 'register'
      ? 'register'
      : 'login';
  }

  function updateUrl(mode) {
    var url = new URL(window.location.href);
    url.pathname = url.pathname.replace(/[^/]*$/, mode === 'register' ? 'register.html' : 'login.html');
    url.searchParams.delete('mode');
    window.history.pushState({ authMode: mode }, '', url.pathname + url.search + url.hash);
  }

  function focusFirstInput(mode) {
    var input = forms[mode] && forms[mode].querySelector('input:not([type="hidden"])');
    if (!input) return;

    window.requestAnimationFrame(function () {
      input.focus({ preventScroll: true });
    });
  }

  function clearAllMessages() {
    window.LostLinkUI.clearMessage(messages.login);
    window.LostLinkUI.clearMessage(messages.register);
  }

  function applyMode(value, options) {
    var mode = normalizeMode(value);
    var settings = options || {};

    root.setAttribute('data-auth-mode', mode);
    showcase.setAttribute('data-mode', mode);
    document.title = mode === 'register' ? 'Create Account — LostLink' : 'Sign In — LostLink';

    Object.keys(panels).forEach(function (key) {
      var panel = panels[key];
      var isActive = key === mode;
      if (panel) {
        panel.inert = !isActive;
        panel.setAttribute('aria-hidden', String(!isActive));
      }

      var promo = promos[key];
      if (promo) promo.setAttribute('aria-hidden', String(!isActive));
    });

    if (settings.clearMessages) clearAllMessages();

    if (settings.push) updateUrl(mode);
    if (settings.focus) focusFirstInput(mode);
  }

  function setMode(mode) {
    if (busy.login || busy.register) return;
    applyMode(mode, { push: true, focus: true, clearMessages: true });
  }

  function setBusy(mode, value) {
    busy[mode] = Boolean(value);

    var button = buttons[mode];
    var label = labels[mode];
    var panel = panels[mode];

    if (button) {
      button.disabled = Boolean(value);
      if (value) button.setAttribute('aria-busy', 'true');
      else button.removeAttribute('aria-busy');
    }

    if (label) {
      label.textContent = value
        ? mode === 'login' ? 'Signing in…' : 'Creating account…'
        : mode === 'login' ? 'Sign In' : 'Create Account';
    }

    if (panel) {
      panel.classList.toggle('is-busy', Boolean(value));
      panel.querySelectorAll('[data-auth-switch]').forEach(function (link) {
        link.setAttribute('aria-disabled', String(Boolean(value)));
      });
    }
  }

  function showServerError(mode, result, fallback) {
    var details = result && Array.isArray(result.details)
      ? result.details.filter(function (detail) { return typeof detail === 'string'; })
      : [];
    var base = result && result.error ? result.error : fallback;
    var text = details.length ? base + ' ' + details.join(' ') : base;
    window.LostLinkUI.showMessage(messages[mode], 'error', text);
  }

  function readJson(response) {
    return response.json().catch(function () { return null; });
  }

  function clearInvalid(input) {
    if (!input) return;
    input.removeAttribute('aria-invalid');
    var control = input.closest('.auth-field__control');
    if (control) control.classList.remove('is-invalid');
  }

  async function submitForm(mode, event) {
    event.preventDefault();
    if (busy[mode] || redirecting) return;

    var form = forms[mode];
    var message = messages[mode];
    window.LostLinkUI.clearMessage(message);

    if (!form.reportValidity()) return;

    var data = new FormData(form);
    var payload;

    if (mode === 'login') {
      payload = {
        email: String(data.get('email') || '').trim(),
        password: String(data.get('password') || ''),
      };
    } else {
      var password = String(data.get('password') || '');
      var confirmPassword = String(data.get('confirmPassword') || '');
      var confirmInput = form.querySelector('input[name="confirmPassword"]');

      if (password !== confirmPassword) {
        clearInvalid(confirmInput);
        if (confirmInput) {
          confirmInput.setAttribute('aria-invalid', 'true');
          var control = confirmInput.closest('.auth-field__control');
          if (control) control.classList.add('is-invalid');
          confirmInput.focus();
        }
        window.LostLinkUI.showMessage(message, 'error', 'The two passwords do not match.');
        return;
      }

      payload = {
        name: String(data.get('name') || '').trim(),
        email: String(data.get('email') || '').trim(),
        password: password,
      };
    }

    setBusy(mode, true);
    var succeeded = false;

    try {
      if (!window.LostLinkAuth) {
        throw new Error('Authentication is still loading. Refresh the page and try again.');
      }

      var user = await window.LostLinkAuth.ready;
      if (user) {
        window.location.replace('dashboard.html');
        return;
      }

      var response = await fetch(mode === 'login' ? '/api/auth/login' : '/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'same-origin',
        cache: 'no-store',
      });

      var result = await readJson(response);
      if (!response.ok) {
        showServerError(
          mode,
          result,
          mode === 'login'
            ? 'Sign in failed (HTTP ' + response.status + ').'
            : 'Account creation failed (HTTP ' + response.status + ').'
        );
        return;
      }

      succeeded = true;
      window.LostLinkUI.showMessage(
        message,
        'success',
        mode === 'login'
          ? 'Signed in. Taking you to your dashboard…'
          : 'Account created. Taking you to your dashboard…'
      );

      window.setTimeout(function () {
        window.location.assign(window.LostLinkUI.safeNextPath('dashboard.html'));
      }, 450);
    } catch (error) {
      window.LostLinkUI.showMessage(
        message,
        'error',
        error && error.message
          ? error.message
          : 'Could not reach the server. Check that the LostLink backend is running, then try again.'
      );
    } finally {
      if (!succeeded) setBusy(mode, false);
    }
  }

  switchLinks.forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      if (busy.login || busy.register) return;
      setMode(link.getAttribute('data-auth-switch'));
    });
  });

  document.querySelectorAll('[data-password-toggle]').forEach(function (button) {
    button.addEventListener('click', function () {
      var input = document.getElementById(button.getAttribute('data-password-toggle'));
      if (!input) return;

      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      button.setAttribute('aria-pressed', String(show));

      var fieldName = input.name === 'confirmPassword' ? 'confirm password' : 'password';
      button.setAttribute('aria-label', (show ? 'Hide ' : 'Show ') + fieldName);

      var use = button.querySelector('use');
      if (use) use.setAttribute('href', show ? '#icon-eye-off' : '#icon-eye');
    });
  });

  Object.keys(forms).forEach(function (mode) {
    forms[mode].addEventListener('submit', function (event) {
      submitForm(mode, event);
    });

    forms[mode].addEventListener('input', function (event) {
      if (!busy[mode]) window.LostLinkUI.clearMessage(messages[mode]);
      if (event.target && event.target.name === 'confirmPassword') {
        clearInvalid(event.target);
      }
    });
  });

  window.addEventListener('popstate', function () {
    applyMode(modeFromLocation(), { push: false, focus: false, clearMessages: false });
  });

  applyMode(root.getAttribute('data-auth-mode') || modeFromLocation(), {
    push: false,
    focus: false,
    clearMessages: false,
  });
})();
