(function () {
  'use strict';

  var loading = document.getElementById('itemLoading');
  var errorState = document.getElementById('itemError');
  var view = document.getElementById('itemView');
  var badges = document.getElementById('itemBadges');
  var actions = document.getElementById('itemActions');
  var title = document.getElementById('itemTitle');
  var subtitle = document.getElementById('itemSubtitle');
  var details = document.getElementById('itemDetails');
  var description = document.getElementById('itemDescription');
  var tags = document.getElementById('itemTags');
  var owner = document.getElementById('itemOwner');
  var created = document.getElementById('itemCreated');

  var itemId = new URLSearchParams(window.location.search).get('id');

  function showError(text) {
    if (loading) loading.hidden = true;
    if (view) view.hidden = true;
    if (errorState) {
      errorState.textContent = text;
      errorState.hidden = false;
    }
  }

  function appendDetail(label, value) {
    var row = document.createElement('div');
    row.append(
      window.LostLinkUI.makeElement('dt', null, label),
      window.LostLinkUI.makeElement('dd', null, value)
    );
    details.append(row);
  }

  function appendAction(link, className, text) {
    link.className = className;
    link.textContent = text;
    actions.append(link);
  }

  function renderItem(item, canManage, user) {
    badges.replaceChildren(
      window.LostLinkUI.makeElement(
        'span',
        'badge badge--' + (item.type === 'found' ? 'found' : 'lost'),
        window.LostLinkUI.typeLabel(item.type)
      ),
      window.LostLinkUI.makeElement(
        'span',
        window.LostLinkUI.itemStatusClass(item.status),
        window.LostLinkUI.statusLabel(item.status)
      )
    );

    title.textContent = item.title || 'Untitled report';
    subtitle.textContent =
      window.LostLinkUI.categoryLabel(item.category) +
      ' · ' +
      (item.location || 'Location not provided');

    details.replaceChildren();
    appendDetail('Category', window.LostLinkUI.categoryLabel(item.category));
    appendDetail('Color', item.color || '—');
    appendDetail('Brand', item.brand || 'Not provided');
    appendDetail('Campus location', item.location || '—');
    appendDetail('Date and time', window.LostLinkUI.formatDateTime(item.dateTime));
    appendDetail('Status', window.LostLinkUI.statusLabel(item.status));
    appendDetail('Reported', window.LostLinkUI.formatDateTime(item.createdAt));

    description.textContent = item.description || 'No description provided.';

    tags.replaceChildren();
    window.LostLinkUI.appendTags(tags, item.tags);
    tags.hidden = !tags.childElementCount;

    owner.textContent = item.ownerName || 'Campus user';
    created.textContent = 'Reported ' + window.LostLinkUI.formatDateTime(item.createdAt);

    actions.replaceChildren();

    if (canManage) {
      if (item.status === 'open') {
        var edit = document.createElement('a');
        edit.href = 'report.html?id=' + encodeURIComponent(item.id);
        appendAction(edit, 'button button--primary button--compact', 'Edit Report');
      }

      var mine = document.createElement('a');
      mine.href = 'my-reports.html';
      appendAction(mine, 'button button--secondary button--compact', 'My Reports');

      var matches = document.createElement('a');
      matches.href = 'matches.html';
      appendAction(matches, 'subtle-link', 'View potential matches');

      if (item.status !== 'open') {
        actions.append(
          window.LostLinkUI.makeElement(
            'span',
            'item-detail__note',
            'This report has moved into the claim workflow.'
          )
        );
      }
    } else if (user) {
      var check = document.createElement('a');
      if (item.type === 'found') {
        check.href = 'matches.html';
        appendAction(check, 'button button--secondary button--compact', 'Check Your Potential Matches');
      } else {
        check.href = 'report.html?type=found';
        appendAction(check, 'button button--secondary button--compact', 'Report a Found Item');
      }
    } else {
      var signIn = document.createElement('a');
      signIn.href = 'login.html?next=' + encodeURIComponent('matches.html');
      appendAction(signIn, 'button button--secondary button--compact', 'Sign In to Check Matches');
    }

    document.title = (item.title || 'Item Details') + ' — LostLink';
    if (loading) loading.hidden = true;
    if (errorState) errorState.hidden = true;
    view.hidden = false;
  }

  async function loadItem() {
    if (!itemId) {
      showError('No item was selected. Return to Explore Items and choose a report.');
      return;
    }

    var user = await LostLinkAuth.ready;

    try {
      var response = await fetch('/api/items/' + encodeURIComponent(itemId), {
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
        throw new Error((result && result.error) || 'This report could not be loaded (HTTP ' + response.status + ').');
      }

      if (!result || !result.item) {
        throw new Error('This report could not be loaded.');
      }

      renderItem(result.item, Boolean(result.canManage), user);
    } catch (error) {
      var reason = error && error.message ? error.message.trim() : 'This report could not be loaded.';
      if (!/[.!?]$/.test(reason)) reason += '.';
      showError(reason + ' It may have been removed.');
    }
  }

  loadItem();
})();
