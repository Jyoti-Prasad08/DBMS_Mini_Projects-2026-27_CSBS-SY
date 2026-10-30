(function () {
  'use strict';

  var list = document.getElementById('reportList');
  var loading = document.getElementById('reportsLoading');
  var emptyState = document.getElementById('reportsEmpty');
  var errorState = document.getElementById('reportsError');
  var message = document.getElementById('reportsMessage');

  function setLoading(loadingState) {
    if (loading) loading.hidden = !loadingState;
  }

  function showError(text) {
    setLoading(false);
    if (errorState) {
      errorState.textContent = text;
      errorState.hidden = false;
    }
    if (list) list.hidden = true;
    if (emptyState) emptyState.hidden = true;
  }

  function appendDetail(container, label, value) {
    var row = document.createElement('div');
    row.append(
      window.LostLinkUI.makeElement('dt', null, label),
      window.LostLinkUI.makeElement('dd', null, value)
    );
    container.append(row);
  }

  function createReportCard(item) {
    var card = window.LostLinkUI.makeElement('article', 'report-card');
    var top = window.LostLinkUI.makeElement('div', 'report-card__top');
    var type = window.LostLinkUI.makeElement(
      'span',
      'badge badge--' + (item.type === 'found' ? 'found' : 'lost'),
      window.LostLinkUI.typeLabel(item.type)
    );
    var status = window.LostLinkUI.makeElement(
      'span',
      window.LostLinkUI.itemStatusClass(item.status),
      window.LostLinkUI.statusLabel(item.status)
    );
    top.append(type, status);

    var heading = window.LostLinkUI.makeElement('h2', null, item.title || 'Untitled report');
    var meta = window.LostLinkUI.makeElement('dl', 'report-card__meta');
    appendDetail(meta, 'Category', window.LostLinkUI.categoryLabel(item.category));
    appendDetail(meta, 'Location', item.location || '—');
    appendDetail(meta, 'Date', window.LostLinkUI.formatDateTime(item.dateTime));

    var footer = window.LostLinkUI.makeElement('div', 'report-card__footer');
    var viewLink = window.LostLinkUI.makeElement('a', 'subtle-link', 'View public details');
    viewLink.href = 'item.html?id=' + encodeURIComponent(item.id);

    var actions = window.LostLinkUI.makeElement('div', 'report-card__actions');
    actions.append(viewLink);

    if (item.status === 'open') {
      var editLink = window.LostLinkUI.makeElement('a', 'button button--secondary button--compact', 'Edit');
      editLink.href = 'report.html?id=' + encodeURIComponent(item.id);

      var deleteButton = window.LostLinkUI.makeElement('button', 'button button--danger button--compact', 'Delete');
      deleteButton.type = 'button';
      deleteButton.addEventListener('click', function () {
        deleteReport(item, deleteButton);
      });

      actions.append(editLink, deleteButton);
    } else {
      footer.append(
        window.LostLinkUI.makeElement(
          'p',
          'report-card__locked',
          'This report is part of a claim and can no longer be edited or deleted.'
        )
      );
    }

    footer.append(actions);
    card.append(top, heading, meta, footer);
    return card;
  }

  function renderReports(items) {
    list.replaceChildren();
    if (errorState) errorState.hidden = true;

    if (!items.length) {
      list.hidden = true;
      if (emptyState) emptyState.hidden = false;
      setLoading(false);
      return;
    }

    items.forEach(function (item) {
      list.append(createReportCard(item));
    });

    list.hidden = false;
    if (emptyState) emptyState.hidden = true;
    setLoading(false);
  }

  async function deleteReport(item, button) {
    var confirmed = window.confirm(
      'Delete “' + (item.title || 'this report') + '”? This cannot be undone.'
    );
    if (!confirmed) return;

    window.LostLinkUI.clearMessage(message);
    window.LostLinkUI.setBusy(button, true);

    try {
      var response = await LostLinkAuth.request('/api/items/' + encodeURIComponent(item.id), {
        method: 'DELETE',
      });
      var result = null;
      try {
        result = await response.json();
      } catch (error) {
        result = null;
      }

      if (!response.ok) {
        throw new Error((result && result.error) || 'The report could not be deleted (HTTP ' + response.status + ').');
      }

      window.LostLinkUI.showMessage(message, 'success', 'Report deleted.');
      await loadReports();
    } catch (error) {
      var reason = error && error.message ? error.message.trim() : 'The report could not be deleted.';
      if (!/[.!?]$/.test(reason)) reason += '.';
      window.LostLinkUI.showMessage(message, 'error', reason);
    } finally {
      window.LostLinkUI.setBusy(button, false);
    }
  }

  async function loadReports() {
    var user = await LostLinkAuth.ready;
    if (!user) return;

    setLoading(true);
    if (errorState) errorState.hidden = true;

    try {
      var response = await LostLinkAuth.request('/api/items/mine');
      var result = null;
      try {
        result = await response.json();
      } catch (error) {
        result = null;
      }

      if (!response.ok) {
        throw new Error((result && result.error) || 'Could not load your reports (HTTP ' + response.status + ').');
      }

      renderReports(result && Array.isArray(result.items) ? result.items : []);
    } catch (error) {
      var reason = error && error.message ? error.message.trim() : 'Could not load your reports.';
      if (!/[.!?]$/.test(reason)) reason += '.';
      showError(reason + ' Check that the LostLink backend is running, then refresh this page.');
    }
  }

  loadReports();
})();
