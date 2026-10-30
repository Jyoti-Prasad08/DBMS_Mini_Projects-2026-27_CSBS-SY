(function () {
  'use strict';

  var loading = document.getElementById('dashboardLoading');
  var errorState = document.getElementById('dashboardError');
  var emptyState = document.getElementById('dashboardEmpty');
  var statNodes = Array.prototype.slice.call(document.querySelectorAll('[data-stat]'));

  function setLoading(loadingState) {
    if (loading) loading.hidden = !loadingState;
  }

  function showError(text) {
    setLoading(false);
    if (errorState) {
      errorState.textContent = text;
      errorState.hidden = false;
    }
    if (emptyState) emptyState.hidden = true;
  }

  async function loadDashboard() {
    var user = await LostLinkAuth.ready;
    if (!user) return;

    try {
      var response = await LostLinkAuth.request('/api/dashboard');
      var result = null;
      try {
        result = await response.json();
      } catch (error) {
        result = null;
      }

      if (!response.ok) {
        throw new Error((result && result.error) || 'Could not load your dashboard (HTTP ' + response.status + ').');
      }

      var stats = result && result.stats ? result.stats : {};
      var allZero = true;

      statNodes.forEach(function (node) {
        var key = node.getAttribute('data-stat');
        var value = Number(stats[key] || 0);
        node.textContent = value.toLocaleString();
        if (value > 0) allZero = false;
      });

      setLoading(false);
      if (errorState) errorState.hidden = true;
      if (emptyState) emptyState.hidden = !allZero;
    } catch (error) {
      var reason = error && error.message ? error.message.trim() : 'Could not load your dashboard.';
      if (!/[.!?]$/.test(reason)) reason += '.';
      showError(reason + ' Check that the LostLink backend is running, then refresh this page.');
    }
  }

  loadDashboard();
})();
