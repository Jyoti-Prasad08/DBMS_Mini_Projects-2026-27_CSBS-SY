(function () {
  'use strict';

  var state = {
    user: null,
  };
  var resolveReady;
  var ready = new Promise(function (resolve) {
    resolveReady = resolve;
  });

  function currentPath() {
    return window.location.pathname + window.location.search;
  }

  function applyUser(user) {
    document.querySelectorAll('[data-auth="guest"]').forEach(function (node) {
      node.hidden = Boolean(user);
    });

    document.querySelectorAll('[data-auth="user"]').forEach(function (node) {
      node.hidden = !user;
    });

    document.querySelectorAll('[data-user-name]').forEach(function (node) {
      node.textContent = user ? user.name : '';
    });

    document.body.classList.toggle('is-authenticated', Boolean(user));
  }

  async function fetchCurrentUser() {
    try {
      var response = await fetch('/api/auth/me', {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) return null;

      var result = await response.json();
      return result && result.user ? result.user : null;
    } catch (error) {
      return null;
    }
  }

  async function request(url, options) {
    var settings = options || {};
    var headers = new Headers(settings.headers || {});
    headers.set('Accept', 'application/json');

    if (settings.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    var response = await fetch(url, {
      ...settings,
      headers: headers,
      cache: 'no-store',
    });

    if (response.status === 401) {
      window.location.replace('login.html?next=' + encodeURIComponent(currentPath()));
      throw new Error('Please sign in to continue.');
    }

    return response;
  }

  async function logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
    } finally {
      window.location.href = 'index.html';
    }
  }

  async function init() {
    state.user = await fetchCurrentUser();
    applyUser(state.user);

    if (!state.user && document.body.dataset.requireAuth === 'true') {
      window.location.replace('login.html?next=' + encodeURIComponent(currentPath()));
      resolveReady(null);
      return;
    }

    if (state.user && document.body.dataset.guestOnly === 'true') {
      window.location.replace('dashboard.html');
      resolveReady(state.user);
      return;
    }

    resolveReady(state.user);
  }

  document.addEventListener('DOMContentLoaded', init);

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-logout]');
    if (!button) return;

    event.preventDefault();
    if (button.disabled) return;

    button.disabled = true;
    button.textContent = 'Logging out…';
    logout();
  });

  window.LostLinkAuth = {
    ready: ready,
    request: request,
    logout: logout,
    getUser: function () {
      return state.user;
    },
  };
})();
