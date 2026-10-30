(function () {
  'use strict';

  var list = document.getElementById('matchList');
  var loading = document.getElementById('matchesLoading');
  var emptyState = document.getElementById('matchesEmpty');
  var errorState = document.getElementById('matchesError');
  var message = document.getElementById('matchesMessage');

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

  function createItemSide(item, side, isYours) {
    var box = window.LostLinkUI.makeElement('div', 'match-item');
    var top = window.LostLinkUI.makeElement('div', 'match-item__top');
    top.append(
      window.LostLinkUI.makeElement(
        'span',
        'badge badge--' + (side === 'found' ? 'found' : 'lost'),
        side === 'found' ? 'Found' : 'Lost'
      ),
      window.LostLinkUI.makeElement(
        'span',
        window.LostLinkUI.itemStatusClass(item.status),
        window.LostLinkUI.statusLabel(item.status)
      )
    );

    if (isYours) {
      top.append(window.LostLinkUI.makeElement('span', 'match-item__yours', 'Your report'));
    }

    var link = window.LostLinkUI.makeElement('a', 'match-item__title', item.title || 'Untitled report');
    link.href = 'item.html?id=' + encodeURIComponent(item.id);

    var meta = window.LostLinkUI.makeElement('div', 'match-item__meta');
    meta.append(
      window.LostLinkUI.makeElement('span', null, item.location || 'Location not provided'),
      window.LostLinkUI.makeElement('span', null, window.LostLinkUI.formatDate(item.dateTime))
    );

    box.append(top, link, meta);
    return box;
  }

  function createAttributeChips(attributes) {
    var wrap = window.LostLinkUI.makeElement('div', 'match-attributes');
    wrap.append(window.LostLinkUI.makeElement('span', 'match-attributes__label', 'Matched attributes'));

    var chips = window.LostLinkUI.makeElement('div', 'match-attribute-list');
    attributes.forEach(function (attribute) {
      if (!attribute || Number(attribute.points) <= 0) return;
      var chip = window.LostLinkUI.makeElement(
        'span',
        'match-attribute',
        attribute.label + ' +' + window.LostLinkUI.formatScore(attribute.points)
      );
      if (attribute.detail) chip.title = attribute.detail;
      chips.append(chip);
    });

    if (!chips.childElementCount) {
      chips.append(window.LostLinkUI.makeElement('span', 'match-attribute', 'No attribute details available'));
    }

    wrap.append(chips);
    return wrap;
  }

  function createClaimBlock(match) {
    var wrap = window.LostLinkUI.makeElement('div', 'match-claim');
    var claim = match.claim;

    if (claim) {
      var statusLine = window.LostLinkUI.makeElement('div', 'match-claim__status');
      statusLine.append(
        window.LostLinkUI.makeElement('span', 'match-claim__label', 'Claim status'),
        window.LostLinkUI.makeElement(
          'span',
          window.LostLinkUI.claimStatusClass(claim.status),
          window.LostLinkUI.statusLabel(claim.status)
        )
      );
      wrap.append(statusLine);

      if (claim.status === 'requested') {
        wrap.append(
          window.LostLinkUI.makeElement(
            'p',
            'match-claim__copy',
            match.role === 'foundOwner'
              ? 'A claim is waiting for your review. Open Claims to verify the private details.'
              : 'Your claim is waiting for the finder to verify the private details.'
          )
        );
      } else if (claim.status === 'approved') {
        wrap.append(
          window.LostLinkUI.makeElement(
            'p',
            'match-claim__copy',
            match.role === 'foundOwner'
              ? 'You approved this claim. Mark the item returned once you have handed it over.'
              : 'The finder approved your claim. Arrange the return; the finder will mark it returned.'
          )
        );
      } else if (claim.status === 'returned') {
        wrap.append(window.LostLinkUI.makeElement('p', 'match-claim__copy', 'This item has been marked returned.'));
      } else if (claim.status === 'rejected') {
        wrap.append(
          window.LostLinkUI.makeElement(
            'p',
            'match-claim__copy',
            match.role === 'foundOwner'
              ? 'You rejected this claim. The found item remains open.'
              : 'The finder rejected this claim. You can submit a new claim with clearer identifying details.'
          )
        );
      }
    }

    if (match.canReview) {
      var reviewLink = window.LostLinkUI.makeElement('a', 'button button--primary button--compact', 'Review Claim');
      reviewLink.href = 'claims.html';
      wrap.append(reviewLink);
    }

    if (!match.canClaim) {
      if (!claim && match.role === 'lostOwner') {
        var noClaimText;

        if (match.activeClaimOnLostItem) {
          noClaimText = 'You already have an active claim for this lost report. Finish or resolve that claim first.';
        } else if (match.activeClaimOnFoundItem) {
          noClaimText = 'Another claim is already in progress for this found item.';
        } else if (match.foundItem.status !== 'open' || match.lostItem.status !== 'open') {
          noClaimText = 'One of these reports is no longer open for a claim.';
        } else {
          noClaimText = 'No claim requested yet.';
        }

        wrap.append(
          window.LostLinkUI.makeElement('p', 'match-claim__copy', noClaimText)
        );
      } else if (!claim && match.role === 'foundOwner') {
        wrap.append(
          window.LostLinkUI.makeElement(
            'p',
            'match-claim__copy',
            'No claim request yet. You will be able to review it here when someone requests this found item.'
          )
        );
      }
      return wrap;
    }

    var toggle = window.LostLinkUI.makeElement('button', 'button button--primary button--compact', 'Request Claim');
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', 'false');

    var form = window.LostLinkUI.makeElement('form', 'claim-request-form');
    form.hidden = true;

    var field = window.LostLinkUI.makeElement('label', 'field');
    field.append(window.LostLinkUI.makeElement('span', null, 'Private identifying details'));
    var textarea = document.createElement('textarea');
    textarea.name = 'verificationDetails';
    textarea.minLength = 10;
    textarea.maxLength = 1000;
    textarea.required = true;
    textarea.placeholder = 'Describe a detail only the owner would know, such as a mark, contents, or serial number.';
    field.append(textarea);

    var hint = window.LostLinkUI.makeElement(
      'p',
      'claim-request-form__hint',
      'Only you and the finder can see this. It is never shown in public listings.'
    );

    var formMessage = window.LostLinkUI.makeElement('div', 'form-message');
    formMessage.setAttribute('role', 'status');
    formMessage.setAttribute('aria-live', 'polite');
    formMessage.hidden = true;

    var submit = window.LostLinkUI.makeElement('button', 'button button--primary button--compact', 'Send Claim Request');
    submit.type = 'submit';

    form.append(field, hint, formMessage, submit);

    toggle.addEventListener('click', function () {
      form.hidden = !form.hidden;
      toggle.setAttribute('aria-expanded', String(!form.hidden));
      if (!form.hidden) textarea.focus();
    });

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      window.LostLinkUI.clearMessage(formMessage);

      if (!form.reportValidity()) return;

      var details = textarea.value.trim();
      if (details.length < 10) {
        window.LostLinkUI.showMessage(formMessage, 'error', 'Add at least 10 characters of identifying detail.');
        textarea.focus();
        return;
      }

      window.LostLinkUI.setBusy(submit, true);

      try {
        var response = await LostLinkAuth.request('/api/claims', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            matchId: match.id,
            verificationDetails: details,
          }),
        });

        var result = null;
        try {
          result = await response.json();
        } catch (error) {
          result = null;
        }

        if (!response.ok) {
          throw new Error((result && result.error) || 'The claim could not be requested (HTTP ' + response.status + ').');
        }

        form.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
        window.LostLinkUI.showMessage(
          message,
          'success',
          'Claim requested. The finder can now review your private identifying details.'
        );
        await loadMatches();
      } catch (error) {
        var reason = error && error.message ? error.message.trim() : 'The claim could not be requested.';
        if (!/[.!?]$/.test(reason)) reason += '.';
        window.LostLinkUI.showMessage(formMessage, 'error', reason);
      } finally {
        window.LostLinkUI.setBusy(submit, false);
      }
    });

    wrap.append(toggle, form);
    return wrap;
  }

  function createMatchCard(match) {
    var card = window.LostLinkUI.makeElement('article', 'match-card');

    var top = window.LostLinkUI.makeElement('div', 'match-card__top');
    var score = window.LostLinkUI.makeElement('div', 'match-score');
    score.append(
      window.LostLinkUI.makeElement('strong', 'match-score__value', window.LostLinkUI.formatScore(match.score) + '%'),
      window.LostLinkUI.makeElement('span', 'match-score__label', 'Potential Match')
    );

    var role = window.LostLinkUI.makeElement(
      'span',
      'match-card__role',
      match.role === 'foundOwner' ? 'Your found report is involved' : 'Your lost report is involved'
    );

    top.append(score, role);

    var bar = window.LostLinkUI.makeElement('div', 'match-score__bar');
    var fill = window.LostLinkUI.makeElement('span');
    fill.style.width = Math.max(0, Math.min(100, Number(match.score) || 0)) + '%';
    bar.append(fill);
    score.append(bar);

    var pair = window.LostLinkUI.makeElement('div', 'match-pair');
    pair.append(
      createItemSide(match.lostItem, 'lost', match.role === 'lostOwner'),
      createItemSide(match.foundItem, 'found', match.role === 'foundOwner')
    );

    card.append(
      top,
      pair,
      createAttributeChips(Array.isArray(match.attributes) ? match.attributes : []),
      createClaimBlock(match)
    );

    return card;
  }

  function renderMatches(matches) {
    list.replaceChildren();
    if (errorState) errorState.hidden = true;

    if (!matches.length) {
      list.hidden = true;
      if (emptyState) emptyState.hidden = false;
      setLoading(false);
      return;
    }

    matches.forEach(function (match) {
      list.append(createMatchCard(match));
    });

    list.hidden = false;
    if (emptyState) emptyState.hidden = true;
    setLoading(false);
  }

  async function loadMatches() {
    var user = await LostLinkAuth.ready;
    if (!user) return;

    setLoading(true);
    if (errorState) errorState.hidden = true;

    try {
      var response = await LostLinkAuth.request('/api/matches');
      var result = null;
      try {
        result = await response.json();
      } catch (error) {
        result = null;
      }

      if (!response.ok) {
        throw new Error((result && result.error) || 'Could not load potential matches (HTTP ' + response.status + ').');
      }

      renderMatches(result && Array.isArray(result.matches) ? result.matches : []);
    } catch (error) {
      var reason = error && error.message ? error.message.trim() : 'Could not load potential matches.';
      if (!/[.!?]$/.test(reason)) reason += '.';
      showError(reason + ' Check that the LostLink backend is running, then refresh this page.');
    }
  }

  loadMatches();
})();
