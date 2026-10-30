(function () {
  'use strict';

  var form = document.getElementById('filterForm');
  if (!form) return;

  var grid = document.getElementById('itemGrid');
  var resultsMeta = document.getElementById('resultsMeta');
  var emptyState = document.getElementById('emptyState');
  var emptyMessage = document.getElementById('emptyMessage');
  var errorState = document.getElementById('errorState');
  var clearButton = document.getElementById('clearFilters');
  var searchField = form.querySelector('input[name="search"]');
  var locationField = form.querySelector('input[name="location"]');
  var requestId = 0;
  var searchTimer = null;

  var makeElement = window.LostLinkUI.makeElement;

  function hasActiveFilters() {
    var values = new FormData(form);
    var active = false;

    values.forEach(function (value) {
      if (typeof value === 'string' && value.trim()) active = true;
    });

    return active;
  }

  function appendMeta(list, label, value) {
    if (value === undefined || value === null || value === '') return;

    var row = document.createElement('div');
    row.append(makeElement('dt', null, label), makeElement('dd', null, value));
    list.append(row);
  }

  function createCard(item) {
    var card = makeElement('article', 'item-card');
    var top = makeElement('div', 'item-card__top');
    var type = item.type === 'found' ? 'found' : 'lost';

    top.append(
      makeElement('span', 'badge badge--' + type, window.LostLinkUI.typeLabel(type)),
      makeElement(
        'span',
        window.LostLinkUI.itemStatusClass(item.status),
        window.LostLinkUI.statusLabel(item.status)
      )
    );

    card.append(top);
    card.append(makeElement('h2', null, item.title || 'Untitled report'));

    if (item.description) {
      card.append(makeElement('p', 'item-card__description', item.description));
    }

    var meta = makeElement('dl', 'item-card__meta');
    appendMeta(meta, 'Category', window.LostLinkUI.categoryLabel(item.category));
    appendMeta(meta, 'Location', item.location);
    appendMeta(meta, 'Color', item.color);
    appendMeta(meta, 'Brand', item.brand);
    appendMeta(meta, 'Date', window.LostLinkUI.formatDate(item.dateTime));
    card.append(meta);

    if (Array.isArray(item.tags) && item.tags.length) {
      var tags = makeElement('div', 'item-card__tags');
      window.LostLinkUI.appendTags(tags, item.tags);
      if (tags.childElementCount) card.append(tags);
    }

    var footer = makeElement('div', 'item-card__footer');
    var detailsLink = makeElement('a', 'item-card__link', 'View details');
    detailsLink.href = 'item.html?id=' + encodeURIComponent(item.id);
    footer.append(detailsLink);
    card.append(footer);

    return card;
  }

  function renderItems(items) {
    var filtered = hasActiveFilters();

    grid.replaceChildren();
    errorState.hidden = true;

    if (!items.length) {
      grid.hidden = true;
      emptyState.hidden = false;
      emptyMessage.textContent = filtered
        ? 'No reports match these filters. Try clearing a filter or widening your search.'
        : 'There are no lost or found reports yet. Start the first one.';
      resultsMeta.textContent = filtered ? 'No matching reports' : 'No reports yet';
      return;
    }

    emptyState.hidden = true;
    grid.hidden = false;
    items.forEach(function (item) {
      grid.append(createCard(item));
    });

    if (!filtered && items.length === 100) {
      resultsMeta.textContent = 'Showing the 100 most recent reports';
    } else {
      resultsMeta.textContent =
        items.length + (items.length === 1 ? ' report' : ' reports') + (filtered ? ' match your filters' : ' shown');
    }
  }

  function showError(text) {
    grid.replaceChildren();
    grid.hidden = true;
    emptyState.hidden = true;
    errorState.textContent = text;
    errorState.hidden = false;
    resultsMeta.textContent = 'Reports unavailable';
  }

  async function loadItems() {
    var currentRequest = ++requestId;
    var params = new URLSearchParams();
    var values = new FormData(form);

    values.forEach(function (value, key) {
      if (typeof value === 'string' && value.trim()) {
        params.set(key, value.trim());
      }
    });

    grid.setAttribute('aria-busy', 'true');
    errorState.hidden = true;
    resultsMeta.textContent = 'Loading reports…';

    try {
      var query = params.toString();
      var response = await fetch('/api/items' + (query ? '?' + query : ''), {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });

      var result = null;
      try {
        result = await response.json();
      } catch (error) {
        result = null;
      }

      if (!response.ok) {
        throw new Error(
          (result && result.error) || 'Could not load reports (HTTP ' + response.status + ').'
        );
      }

      if (currentRequest !== requestId) return;

      var items = result && Array.isArray(result.items) ? result.items : [];
      renderItems(items);
    } catch (error) {
      if (currentRequest !== requestId) return;
      var reason = error && error.message ? error.message.trim() : 'Could not load reports.';
      if (!/[.!?]$/.test(reason)) reason += '.';
      showError(reason + ' Check that the LostLink backend is running, then refresh this page.');
    } finally {
      if (currentRequest === requestId) {
        grid.setAttribute('aria-busy', 'false');
      }
    }
  }

  function debounceLoad() {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(loadItems, 350);
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    window.clearTimeout(searchTimer);
    loadItems();
  });

  form.addEventListener('change', function (event) {
    if (event.target instanceof HTMLSelectElement) {
      window.clearTimeout(searchTimer);
      loadItems();
    }
  });

  if (searchField) searchField.addEventListener('input', debounceLoad);
  if (locationField) locationField.addEventListener('input', debounceLoad);

  clearButton.addEventListener('click', function () {
    window.clearTimeout(searchTimer);
    form.reset();
    loadItems();
    if (searchField) searchField.focus();
  });

  loadItems();
})();
