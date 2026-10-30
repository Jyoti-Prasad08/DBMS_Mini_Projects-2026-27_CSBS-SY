(function () {
  'use strict';

  var list = document.getElementById('claimList');
  var loading = document.getElementById('claimsLoading');
  var emptyState = document.getElementById('claimsEmpty');
  var errorState = document.getElementById('claimsError');
  var message = document.getElementById('claimsMessage');

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

  function statusCopy(claim) {
    if (claim.status === 'requested') {
      return claim.role === 'finder'
        ? 'Review the private details submitted by the claimant, then approve or reject.'
        : 'Waiting for the finder to verify your private identifying details.';
    }
    if (claim.status === 'approved') {
      return claim.role === 'finder'
        ? 'Approved. Mark the item returned after you hand it over.'
        : 'Approved. The finder will mark the item returned after handover.';
    }
    if (claim.status === 'rejected') {
      return claim.role === 'finder'
        ? 'You rejected this claim. The found item remains open.'
        : 'The finder rejected this claim.';
    }
    if (claim.status === 'returned') {
      return 'The item has been marked returned. This claim is complete.';
    }
    return '';
  }

  function appendItemBlock(container, label, item) {
    if (!item) return;

    var block = window.LostLinkUI.makeElement('div', 'claim-item');
    block.append(window.LostLinkUI.makeElement('span', 'claim-item__label', label));
    var link = window.LostLinkUI.makeElement('a', 'claim-item__title', item.title || 'Untitled report');
    link.href = 'item.html?id=' + encodeURIComponent(item.id);
    block.append(
      link,
      window.LostLinkUI.makeElement(
        'span',
        'claim-item__meta',
        window.LostLinkUI.typeLabel(item.type) + ' · ' + (item.location || 'No location') + ' · ' + window.LostLinkUI.statusLabel(item.status)
      )
    );
    container.append(block);
  }

  async function performAction(claim, action, button) {
    var confirmMessage = '';

    if (action === 'approve') {
      confirmMessage = 'Approve this claim? The lost and found items will be marked as claimed.';
    } else if (action === 'reject') {
      confirmMessage = 'Reject this claim? The found item will remain open.';
    } else if (action === 'return') {
      confirmMessage = 'Mark this item as returned? This completes the claim and updates both reports.';
    }

    if (!window.confirm(confirmMessage)) return;

    var body = undefined;
    if (action === 'reject') {
      var note = window.prompt('Optional note to the claimant. Leave blank to skip:', '');
      if (note === null) return;
      body = JSON.stringify({ reviewNote: note.trim() });
    }

    window.LostLinkUI.clearMessage(message);
    window.LostLinkUI.setBusy(button, true);

    try {
      var response = await LostLinkAuth.request(
        '/api/claims/' + encodeURIComponent(claim.id) + '/' + action,
        {
          method: 'PATCH',
          headers: body ? { 'Content-Type': 'application/json' } : undefined,
          body: body,
        }
      );

      var result = null;
      try {
        result = await response.json();
      } catch (error) {
        result = null;
      }

      if (!response.ok) {
        throw new Error((result && result.error) || 'The claim could not be updated (HTTP ' + response.status + ').');
      }

      var successText = action === 'approve'
        ? 'Claim approved. The item is now marked as claimed.'
        : action === 'reject'
          ? 'Claim rejected. The found item remains open.'
          : 'Claim completed. Both reports are marked as returned.';

      window.LostLinkUI.showMessage(message, 'success', successText);
      await loadClaims();
    } catch (error) {
      var reason = error && error.message ? error.message.trim() : 'The claim could not be updated.';
      if (!/[.!?]$/.test(reason)) reason += '.';
      window.LostLinkUI.showMessage(message, 'error', reason);
    } finally {
      window.LostLinkUI.setBusy(button, false);
    }
  }

  function createClaimCard(claim) {
    var card = window.LostLinkUI.makeElement('article', 'claim-card');

    var top = window.LostLinkUI.makeElement('div', 'claim-card__top');
    top.append(
      window.LostLinkUI.makeElement(
        'span',
        window.LostLinkUI.claimStatusClass(claim.status),
        window.LostLinkUI.statusLabel(claim.status)
      ),
      window.LostLinkUI.makeElement(
        'span',
        'claim-card__role',
        claim.role === 'finder' ? 'Claim on your found item' : 'Claim you requested'
      )
    );

    var title = claim.foundItem ? claim.foundItem.title : 'Claim';
    card.append(top, window.LostLinkUI.makeElement('h2', null, title));

    var items = window.LostLinkUI.makeElement('div', 'claim-items');
    appendItemBlock(
      items,
      claim.role === 'finder' ? 'Your found item' : 'Found item',
      claim.foundItem
    );
    appendItemBlock(
      items,
      claim.role === 'finder' ? 'Claimant’s lost report' : 'Your lost report',
      claim.lostItem
    );
    card.append(items);

    var meta = window.LostLinkUI.makeElement('div', 'claim-meta');
    meta.append(
      window.LostLinkUI.makeElement(
        'span',
        null,
        'Requested ' + window.LostLinkUI.formatDateTime(claim.createdAt)
      ),
      window.LostLinkUI.makeElement(
        'span',
        null,
        claim.match ? 'Match score ' + window.LostLinkUI.formatScore(claim.match.score) + '%' : 'Match score unavailable'
      ),
      window.LostLinkUI.makeElement(
        'span',
        null,
        claim.role === 'finder' ? 'Claimant: ' + claim.claimantName : 'Finder: ' + claim.finderName
      )
    );
    card.append(meta);

    var privateBox = window.LostLinkUI.makeElement('section', 'claim-private');
    privateBox.append(
      window.LostLinkUI.makeElement('h3', null, 'Private identifying details'),
      window.LostLinkUI.makeElement('p', null, claim.verificationDetails || 'No details provided.')
    );
    card.append(privateBox);

    if (claim.reviewNote) {
      var note = window.LostLinkUI.makeElement('p', 'claim-review-note');
      note.append(
        window.LostLinkUI.makeElement('strong', null, 'Review note: '),
        document.createTextNode(claim.reviewNote)
      );
      card.append(note);
    }

    card.append(window.LostLinkUI.makeElement('p', 'claim-status-copy', statusCopy(claim)));

    var actions = window.LostLinkUI.makeElement('div', 'claim-actions');

    if (claim.canApprove) {
      var approve = window.LostLinkUI.makeElement('button', 'button button--primary button--compact', 'Approve Claim');
      approve.type = 'button';
      approve.addEventListener('click', function () {
        performAction(claim, 'approve', approve);
      });
      actions.append(approve);
    }

    if (claim.canReject) {
      var reject = window.LostLinkUI.makeElement('button', 'button button--danger button--compact', 'Reject Claim');
      reject.type = 'button';
      reject.addEventListener('click', function () {
        performAction(claim, 'reject', reject);
      });
      actions.append(reject);
    }

    if (claim.canReturn) {
      var markReturned = window.LostLinkUI.makeElement('button', 'button button--primary button--compact', 'Mark as Returned');
      markReturned.type = 'button';
      markReturned.addEventListener('click', function () {
        performAction(claim, 'return', markReturned);
      });
      actions.append(markReturned);
    }

    if (actions.childElementCount) card.append(actions);
    return card;
  }

  function renderClaims(claims) {
    list.replaceChildren();
    if (errorState) errorState.hidden = true;

    if (!claims.length) {
      list.hidden = true;
      if (emptyState) emptyState.hidden = false;
      setLoading(false);
      return;
    }

    claims.forEach(function (claim) {
      list.append(createClaimCard(claim));
    });

    list.hidden = false;
    if (emptyState) emptyState.hidden = true;
    setLoading(false);
  }

  async function loadClaims() {
    var user = await LostLinkAuth.ready;
    if (!user) return;

    setLoading(true);
    if (errorState) errorState.hidden = true;

    try {
      var response = await LostLinkAuth.request('/api/claims');
      var result = null;
      try {
        result = await response.json();
      } catch (error) {
        result = null;
      }

      if (!response.ok) {
        throw new Error((result && result.error) || 'Could not load claims (HTTP ' + response.status + ').');
      }

      renderClaims(result && Array.isArray(result.claims) ? result.claims : []);
    } catch (error) {
      var reason = error && error.message ? error.message.trim() : 'Could not load claims.';
      if (!/[.!?]$/.test(reason)) reason += '.';
      showError(reason + ' Check that the LostLink backend is running, then refresh this page.');
    }
  }

  loadClaims();
})();
