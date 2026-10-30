(function () {
  'use strict';

  var categoryLabels = {
    electronics: 'Electronics',
    phone: 'Phone',
    laptop: 'Laptop',
    wallet: 'Wallet',
    keys: 'Keys',
    bag: 'Bag',
    clothing: 'Clothing',
    books: 'Books',
    'id-card': 'ID / card',
    jewelry: 'Jewelry',
    other: 'Other',
  };

  var typeLabels = {
    lost: 'Lost',
    found: 'Found',
  };

  var statusLabels = {
    open: 'Open',
    claimed: 'Claimed',
    returned: 'Returned',
    resolved: 'Resolved',
    requested: 'Claim Requested',
    approved: 'Approved',
    rejected: 'Rejected',
  };

  var dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  var dateFormatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  });

  function makeElement(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function formatToDate(value) {
    var date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatDateTime(value) {
    var date = formatToDate(value);
    return date ? dateTimeFormatter.format(date) : '—';
  }

  function formatDate(value) {
    var date = formatToDate(value);
    return date ? dateFormatter.format(date) : '—';
  }

  function categoryLabel(value) {
    if (!value) return '—';
    return categoryLabels[value] || String(value).replace(/-/g, ' ');
  }

  function typeLabel(value) {
    return typeLabels[value] || 'Item';
  }

  function statusLabel(value) {
    return statusLabels[value] || String(value || '').replace(/-/g, ' ');
  }

  function itemStatusClass(value) {
    return 'badge badge--status-' + (value || 'open');
  }

  function claimStatusClass(value) {
    return 'badge badge--claim-' + (value || 'requested');
  }

  function showMessage(node, kind, text, link) {
    if (!node) return;

    node.className = 'form-message is-' + kind;
    node.replaceChildren(document.createTextNode(text));

    if (link) {
      var anchor = document.createElement('a');
      anchor.href = link.href;
      anchor.textContent = link.text;
      node.append(document.createTextNode(' '), anchor);
    }

    node.hidden = false;
  }

  function clearMessage(node) {
    if (!node) return;
    node.hidden = true;
    node.textContent = '';
  }

  function setBusy(button, busy) {
    if (!button) return;
    button.disabled = Boolean(busy);
    if (busy) button.setAttribute('aria-busy', 'true');
    else button.removeAttribute('aria-busy');
  }

  function appendTags(container, tags) {
    if (!container || !Array.isArray(tags)) return;
    tags.forEach(function (tag) {
      if (typeof tag === 'string' && tag.trim()) {
        container.append(makeElement('span', 'tag', tag));
      }
    });
  }

  function formatScore(value) {
    var score = Number(value);
    if (!Number.isFinite(score)) return '0';
    return score.toLocaleString(undefined, { maximumFractionDigits: 1 });
  }

  function safeNextPath(fallback) {
    var raw = new URLSearchParams(window.location.search).get('next');
    if (!raw) return fallback;

    try {
      var url = new URL(raw, window.location.href);
      if (url.origin !== window.location.origin) return fallback;
      return url.pathname + url.search + url.hash;
    } catch (error) {
      return fallback;
    }
  }

  window.LostLinkUI = {
    makeElement: makeElement,
    formatDateTime: formatDateTime,
    formatDate: formatDate,
    categoryLabel: categoryLabel,
    typeLabel: typeLabel,
    statusLabel: statusLabel,
    itemStatusClass: itemStatusClass,
    claimStatusClass: claimStatusClass,
    showMessage: showMessage,
    clearMessage: clearMessage,
    setBusy: setBusy,
    appendTags: appendTags,
    formatScore: formatScore,
    safeNextPath: safeNextPath,
  };
})();
