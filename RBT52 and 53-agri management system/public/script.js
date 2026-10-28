// Shared frontend logic (plain JavaScript calling the REST API)
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = v => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) ? v.slice(0, 10) : (v ?? '');
const label = (d, ent) => !d ? '-' : (ent.show.map(k => fmt(d[k])).join(' ').trim() || d._id);
const api = async (url, opts) => {
  const r = await fetch(url, opts && { headers: { 'Content-Type': 'application/json' }, ...opts });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Request failed');
  return data;
};

async function buildNav(E, current) {
  $('nav').innerHTML = '<a class="brand" href="index.html">🌾 AgriManage</a>' +
    Object.keys(E).map(k => `<a href="entity.html?e=${k}" class="${k === current ? 'active' : ''}">${esc(E[k].plural)}</a>`).join('') +
    '<a href="reports.html">📊 Reports</a>';
}

// ---------- Dashboard ----------
async function dashboard() {
  const E = await api('/api/meta'); buildNav(E);
  const { counts, revenue } = await api('/api/counts');
  $('#revenue').innerHTML = `<small>Total Sales Revenue</small><div class="num">₹ ${revenue.toLocaleString('en-IN')}</div>`;
  $('#cards').innerHTML = Object.keys(E).map(k =>
    `<a class="card" href="entity.html?e=${k}"><small>${esc(E[k].plural)}</small><div class="num">${counts[k]}</div></a>`).join('');
}

// ---------- Reports ----------
async function reports() {
  const E = await api('/api/meta'); buildNav(E);
  const data = await api('/api/reports');
  $('#reports').innerHTML = data.map(r => `<h3>${esc(r.title)}</h3><div class="tablewrap"><table>
    <tr>${r.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr>
    ${r.rows.map(row => `<tr>${row.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('') ||
      `<tr><td class="empty" colspan="9">No data</td></tr>`}</table></div>`).join('');
}

// ---------- CRUD page (works for every entity) ----------
async function entityPage() {
  const e = new URLSearchParams(location.search).get('e');
  const E = await api('/api/meta'); buildNav(E, e);
  const ent = E[e]; if (!ent) { $('main').innerHTML = '<p>Unknown entity.</p>'; return; }
  document.title = ent.plural + ' - AgriManage';
  $('#title').textContent = ent.plural; $('#addBtn').textContent = '+ Add ' + ent.label;
  let editing = null;

  async function load() {
    const docs = await api(`/api/${e}?q=${encodeURIComponent($('#q').value)}`);
    $('#thead').innerHTML = ent.fields.map(f => `<th>${esc(f[0].replace(/_/g, ' '))}</th>`).join('') + '<th></th>';
    $('#tbody').innerHTML = docs.map(d => `<tr>` + ent.fields.map(([n, t, ref]) =>
      `<td>${esc(t === 'ref' ? label(d[n], E[ref]) : fmt(d[n]))}</td>`).join('') +
      `<td style="white-space:nowrap"><button class="edit" onclick="openForm('${d._id}')">Edit</button>
       <button class="del" onclick="del('${d._id}')">Delete</button></td></tr>`).join('') ||
      `<tr><td class="empty" colspan="99">No records found</td></tr>`;
  }

  window.openForm = async id => {
    editing = id || null;
    const doc = id ? await api(`/api/${e}/${id}`) : {};
    let html = '';
    for (const [n, t, ref] of ent.fields) {
      if (t === 'auto') continue;
      const v = doc[n], name = n.replace(/_/g, ' ');
      if (t === 'ref') {
        const opts = await api(`/api/${ref}`);
        html += `<label>${name}</label><select name="${n}" required><option value="">-- select --</option>` +
          opts.map(o => `<option value="${o._id}" ${String(v) === o._id ? 'selected' : ''}>${esc(label(o, E[ref]))}</option>`).join('') + '</select>';
      } else if (t.startsWith('select')) {
        html += `<label>${name}</label><select name="${n}" required>` +
          t.slice(7).split(',').map(o => `<option ${v === o ? 'selected' : ''}>${o}</option>`).join('') + '</select>';
      } else {
        html += `<label>${name}</label><input name="${n}" type="${t}" step="any" value="${esc(fmt(v))}" required>`;
      }
    }
    if (e === 'sales') html += '<p class="note">Total amount is calculated automatically (quantity × price per unit).</p>';
    $('#fields').innerHTML = html; $('#err').textContent = '';
    $('#formTitle').textContent = (id ? 'Edit ' : 'Add ') + ent.label;
    $('#dlg').showModal();
  };
  window.del = async id => { if (confirm('Delete this record?')) { await api(`/api/${e}/${id}`, { method: 'DELETE' }); load(); } };
  $('#addBtn').onclick = () => openForm();
  $('#cancel').onclick = () => $('#dlg').close();
  $('#q').oninput = load;
  $('#form').onsubmit = async ev => {
    ev.preventDefault();
    try {
      await api(editing ? `/api/${e}/${editing}` : `/api/${e}`,
        { method: editing ? 'PUT' : 'POST', body: JSON.stringify(Object.fromEntries(new FormData(ev.target))) });
      $('#dlg').close(); load();
    } catch (err) { $('#err').textContent = err.message; }
  };
  load();
}

const page = document.body.dataset.page;
if (page === 'dashboard') dashboard(); else if (page === 'reports') reports(); else if (page === 'entity') entityPage();
