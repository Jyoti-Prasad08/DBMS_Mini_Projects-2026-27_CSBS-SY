(function () {
  'use strict';

  var form = document.getElementById('reportForm');
  if (!form) return;

  var typeField = document.getElementById('typeField');
  var pageTitle = document.getElementById('pageTitle');
  var pageIntro = document.getElementById('pageIntro');
  var typeSwitch = document.getElementById('typeSwitch');
  var switchLost = document.getElementById('switchLost');
  var switchFound = document.getElementById('switchFound');
  var editModeNote = document.getElementById('editModeNote');
  var submitButton = document.getElementById('submitButton');
  var submitLabel = document.getElementById('submitLabel');
  var secondaryLink = document.getElementById('secondaryLink');
  var message = document.getElementById('formMessage');
  var dateTime = document.getElementById('dateTime');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var params = new URLSearchParams(window.location.search);
  var editId = params.get('id');
  var isEdit = Boolean(editId);
  var requestedType = params.get('type');
  var activeType = requestedType === 'found' ? 'found' : 'lost';
  var locked = false;

  var copy = {
    lost: {
      title: 'Report a Lost Item',
      intro: 'Tell us what went missing and where it was last seen. Your report will appear in the campus listings.',
      submit: 'Submit Lost Report',
    },
    found: {
      title: 'Report a Found Item',
      intro: 'Log what you found and where you found it. The owner may spot it in the campus listings.',
      submit: 'Submit Found Report',
    },
  };

  function toLocalInputValue(date) {
    var offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
  }

  function applyType() {
    var isFound = activeType === 'found';

    typeField.value = activeType;

    if (isEdit) {
      pageTitle.textContent = isFound ? 'Edit Found Item' : 'Edit Lost Item';
      pageIntro.textContent = 'Update the details below. Changes are saved only after the server confirms them.';
      submitLabel.textContent = 'Save Changes';
      document.title = (isFound ? 'Edit Found Item' : 'Edit Lost Item') + ' — LostLink';
    } else {
      pageTitle.textContent = copy[activeType].title;
      pageIntro.textContent = copy[activeType].intro;
      submitLabel.textContent = copy[activeType].submit;
      document.title = copy[activeType].title + ' — LostLink';
    }

    switchLost.classList.toggle('is-active', !isFound);
    switchFound.classList.toggle('is-active', isFound);

    if (isFound) {
      switchFound.setAttribute('aria-current', 'page');
      switchLost.removeAttribute('aria-current');
    } else {
      switchLost.setAttribute('aria-current', 'page');
      switchFound.removeAttribute('aria-current');
    }
  }

  function showMessage(kind, text, link) {
    window.LostLinkUI.showMessage(message, kind, text, link);
    message.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'nearest',
    });
  }

  function hideMessage() {
    window.LostLinkUI.clearMessage(message);
  }

  function setField(name, value) {
    var field = form.elements.namedItem(name);
    if (field) field.value = value === undefined || value === null ? '' : String(value);
  }

  function lockForm(text) {
    locked = true;
    Array.prototype.forEach.call(form.querySelectorAll('input, select, textarea, button'), function (field) {
      field.disabled = true;
    });
    submitButton.hidden = true;
    showMessage('error', text);
  }

  function populateForm(item) {
    setField('title', item.title);
    setField('category', item.category);
    setField('color', item.color);
    setField('brand', item.brand);
    setField('location', item.location);
    setField('description', item.description);
    setField('tags', Array.isArray(item.tags) ? item.tags.join(', ') : '');

    var itemDate = new Date(item.dateTime);
    if (!Number.isNaN(itemDate.getTime())) {
      dateTime.value = toLocalInputValue(itemDate);
    }

    activeType = item.type === 'found' ? 'found' : 'lost';
    applyType();
  }

  async function loadForEdit() {
    try {
      var response = await LostLinkAuth.request('/api/items/' + encodeURIComponent(editId));
      var result = null;
      try {
        result = await response.json();
      } catch (error) {
        result = null;
      }

      if (!response.ok) {
        throw new Error((result && result.error) || 'This report could not be loaded (HTTP ' + response.status + ').');
      }

      if (!result || !result.item) {
        throw new Error('This report could not be loaded.');
      }

      if (!result.canManage) {
        lockForm('You can only edit reports that belong to your account.');
        return false;
      }

      populateForm(result.item);
      typeSwitch.hidden = true;
      editModeNote.hidden = false;
      secondaryLink.href = 'my-reports.html';
      secondaryLink.textContent = 'Cancel editing';

      if (result.item.status !== 'open') {
        lockForm('This report has moved into the claim workflow and can no longer be edited.');
        return false;
      }

      return true;
    } catch (error) {
      var reason = error && error.message ? error.message.trim() : 'This report could not be loaded.';
      if (!/[.!?]$/.test(reason)) reason += '.';
      lockForm(reason);
      return false;
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (locked || submitButton.disabled) return;

    hideMessage();

    var data = new FormData(form);
    var dateValue = String(data.get('dateTime') || '');
    var parsedDate = new Date(dateValue);

    if (!dateValue || Number.isNaN(parsedDate.getTime())) {
      showMessage('error', 'Choose a valid date and time for the item.');
      dateTime.focus();
      return;
    }

    var payload = {
      type: activeType,
      title: String(data.get('title') || '').trim(),
      category: String(data.get('category') || '').trim(),
      description: String(data.get('description') || '').trim(),
      color: String(data.get('color') || '').trim(),
      brand: String(data.get('brand') || '').trim(),
      location: String(data.get('location') || '').trim(),
      dateTime: parsedDate.toISOString(),
      tags: String(data.get('tags') || '')
        .split(',')
        .map(function (tag) { return tag.trim(); })
        .filter(Boolean),
    };

    window.LostLinkUI.setBusy(submitButton, true);
    submitLabel.textContent = isEdit ? 'Saving changes…' : 'Saving report…';

    try {
      var response = await LostLinkAuth.request(
        isEdit ? '/api/items/' + encodeURIComponent(editId) : '/api/items',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      var result = null;
      try {
        result = await response.json();
      } catch (error) {
        result = null;
      }

      if (!response.ok) {
        var details = result && Array.isArray(result.details)
          ? result.details.filter(function (detail) { return typeof detail === 'string'; })
          : [];
        var base = (result && result.error) || 'The report could not be saved (HTTP ' + response.status + ').';
        showMessage('error', details.length ? base + ' ' + details.join(' ') : base);
        return;
      }

      var savedItem = result && result.item;
      var savedTitle = savedItem && savedItem.title ? savedItem.title : 'your report';
      var link = savedItem && savedItem.id
        ? { href: 'item.html?id=' + encodeURIComponent(savedItem.id), text: 'View the saved report.' }
        : null;

      if (isEdit) {
        showMessage('success', 'Changes saved for “' + savedTitle + '”.', link);
      } else {
        form.reset();
        dateTime.value = toLocalInputValue(new Date());
        applyType();
        showMessage('success', 'Report saved for “' + savedTitle + '”.', link);
      }
    } catch (error) {
      showMessage(
        'error',
        'Could not reach the server. Check that the LostLink backend is running, then try again.'
      );
    } finally {
      window.LostLinkUI.setBusy(submitButton, false);
      submitLabel.textContent = isEdit ? 'Save Changes' : copy[activeType].submit;
    }
  }

  applyType();
  if (!isEdit && !dateTime.value) {
    dateTime.value = toLocalInputValue(new Date());
  }

  LostLinkAuth.ready.then(async function (user) {
    if (!user) return;

    if (isEdit) {
      var canEdit = await loadForEdit();
      if (!canEdit) return;
    }

    form.addEventListener('submit', handleSubmit);
  });
})();
