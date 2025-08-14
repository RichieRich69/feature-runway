// edit.js - logic for edit.html
// Modal logic for alerts and confirms
function showModal(message, options = {}) {
  const overlay = document.getElementById('modalOverlay');
  const msg = document.getElementById('modalMessage');
  const okBtn = document.getElementById('modalOkBtn');
  const cancelBtn = document.getElementById('modalCancelBtn');
  msg.textContent = message;
  overlay.style.display = 'flex';
  let resolved = false;
  function cleanup() {
    overlay.style.display = 'none';
    okBtn.onclick = null;
    cancelBtn.onclick = null;
    cancelBtn.style.display = 'none';
  }
  if (options.confirm) {
    cancelBtn.style.display = '';
    okBtn.onclick = () => {
      if (!resolved) options.onConfirm && options.onConfirm();
      resolved = true;
      cleanup();
    };
    cancelBtn.onclick = () => {
      resolved = true;
      cleanup();
    };
  } else {
    cancelBtn.style.display = 'none';
    okBtn.onclick = () => {
      cleanup();
    };
  }
}

function showAlert(message) {
  showModal(message);
}

function showConfirm(message, onConfirm) {
  showModal(message, { confirm: true, onConfirm });
}
(function () {
        'use strict';
        /*** Constants ***/
        const ENVIRONMENTS = [
          {
            name: 'Feature 1 BW',
            url: 'https://capricornro-retail-feature1-bw.azurewebsites.net/home',
          },
          {
            name: 'Feature 1 BG',
            url: 'https://capricornro-retail-feature1.azurewebsites.net/home',
          },
          {
            name: 'Feature 2 BW',
            url: 'https://capricornro-retail-feature2-bw.azurewebsites.net/home',
          },
          {
            name: 'Feature 2 BG',
            url: 'https://capricornro-retail-feature2.azurewebsites.net/home',
          },
          {
            name: 'Feature 3 BW',
            url: 'https://capricornro-retail-feature3-bw.azurewebsites.net/home',
          },
          {
            name: 'Feature 3 BG',
            url: 'https://capricornro-retail-feature3.azurewebsites.net/home',
          },
          {
            name: 'Feature 4 BW',
            url: 'https://capricornro-retail-feature4-bw.azurewebsites.net/home',
          },
          {
            name: 'Feature 4 BG',
            url: 'https://capricornro-retail-feature4.azurewebsites.net/home',
          },
          { name: 'Demo BW', url: 'https://capricornro-retail-demo-bw.azurewebsites.net/home' },
          { name: 'Demo BG', url: 'https://capricornro-retail-demo-bg.azurewebsites.net/home' },
        ];
        const STATUS = {
          available: { emoji: '🟢', label: 'Available' },
          testing: { emoji: '🟡', label: 'Testing' },
          locked: { emoji: '🔴', label: 'Locked Ready for ART Demo' },
          nextup: { emoji: '🆕', label: 'Next-up' },
        };
        const LS_KEY = 'feb-embedded-v1';
        const ZONE = 'Africa/Windhoek'; // for the Changed datetime
        let __TEST_MODE = false; // self-tests skip persistence

        /*** Helpers ***/
        function truncate(t, n) {
          return t.length > n ? t.slice(0, n - 1) + '…' : t;
        }
        function escapeHtml(s) {
          return String(s).replace(
            /[&<>"']/g,
            (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m])
          );
        }
        function nowStamp() {
          const d = new Date();
          return d.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: ZONE,
          });
        }

        async function save() {
          if (__TEST_MODE) return;
          try {
            await fetch('/api/page-data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ data: state }),
            });
          } catch (e) {
            console.warn('Failed to save to server', e);
          }
        }

        async function load() {
          try {
            const res = await fetch('/api/page-data');
            if (res.ok) {
              const json = await res.json();
              return json.data;
            }
          } catch (e) {
            console.warn('Failed to load from server', e);
          }
          return null;
        }

        function seed() {
          const stories = [];
          const rows = {};
          ENVIRONMENTS.forEach(
            (env) =>
              (rows[env] = { status: 'available', storyId: '', qa: '', dev: '', changed: '' })
          );
          const qaPeople = [];
          const devPeople = [];
          return { rows, stories, qaPeople, devPeople };
        }

        /*** State ***/
        let state = null;
        (async function () {
          state = await load();
          if (!state) state = seed();
          // After state is loaded, continue initializing UI
          renderTable();
        })();

        /*** DOM ***/
        const boardBody = document.getElementById('boardBody');
        const envSel = document.getElementById('env');
        const statusSel = document.getElementById('status');
        const storySel = document.getElementById('story');
        const qaSel = document.getElementById('qa');
        const devSel = document.getElementById('dev');
        const submitBtn = document.getElementById('submit');
        const resetSeed = document.getElementById('resetSeed');

        // Story admin DOM
        const storyTitleIn = document.getElementById('storyTitleIn');
        const storyUrlIn = document.getElementById('storyUrlIn');
        const storyIdIn = document.getElementById('storyIdIn');
        const storyAddBtn = document.getElementById('storyAddBtn');
        const storyList = document.getElementById('storyList');

        // People admin DOM
        const qaAddIn = document.getElementById('qaAddIn');
        const qaAddBtn = document.getElementById('qaAddBtn');
        const devAddIn = document.getElementById('devAddIn');
        const devAddBtn = document.getElementById('devAddBtn');
        const qaList = document.getElementById('qaList');
        const devList = document.getElementById('devList');

        /*** Render table ***/
        function renderTable() {
          const rowsHtml = ENVIRONMENTS.map((envObj) => {
            const env = envObj.name;
            const envUrl = envObj.url;
            const r = state.rows[env] || {
              status: 'available',
              storyId: '',
              qa: '',
              dev: '',
              changed: '',
            };
            const st = STATUS[r.status] || STATUS.available;
            const story = state.stories.find((s) => s.id === r.storyId);
            const storyHtml = story
              ? `<a class="story" href="${escapeHtml(
                  story.url
                )}" target="_blank" rel="noopener">${escapeHtml(story.title)}</a>`
              : '<span class="muted">—</span>';
            const qaHtml = r.qa ? escapeHtml(r.qa) : '<span class="muted">—</span>';
            const devHtml = r.dev ? escapeHtml(r.dev) : '<span class="muted">—</span>';
            const changedHtml = r.changed ? escapeHtml(r.changed) : '<span class="muted">—</span>';
            const envHtml = envUrl
              ? `<a href="${escapeHtml(envUrl)}" target="_blank" rel="noopener">${escapeHtml(
                  env
                )} <span title=\"Open environment\"></span></a>`
              : escapeHtml(env);
            return `<tr>
        <td>${envHtml}</td>
        <td style="text-align:center"><span class="emoji">${st.emoji}</span> <span>${escapeHtml(
              st.label
            )}</span></td>
        <td>${storyHtml}</td>
        <td>${qaHtml}</td>
        <td>${devHtml}</td>
        <td>${changedHtml}</td>
      </tr>`;
          }).join('');
          boardBody.innerHTML = rowsHtml;
        }

        /*** Add/remove handlers (kept for tests; UI now uses explicit forms) ***/
        function handlePeopleAddRemove(select, listName) {
          const v = select.value;
          if (v === '__add__') {
            const name = prompt('Add name (e.g., Andrew)');
            if (name && name.trim()) {
              const clean = name.trim();
              if (!state[listName].some((x) => x.toLowerCase() === clean.toLowerCase())) {
                state[listName].push(clean);
                save();
              }
              fillPeople(select, state[listName]);
              select.value = clean;
              select.setAttribute('data-current', clean);
            } else {
              select.value = '';
            }
          } else if (v === '__remove__') {
            const current = select.getAttribute('data-current') || '';
            if (!current) {
              alert('Select a name first, then choose “Remove selected”.');
              select.value = '';
              return;
            }
            const idx = state[listName].findIndex((x) => x.toLowerCase() === current.toLowerCase());
            if (idx > -1 && confirm(`Remove "${state[listName][idx]}" from the dropdown?`)) {
              state[listName].splice(idx, 1);
              save();
            }
            fillPeople(select, state[listName]);
            select.value = '';
            select.setAttribute('data-current', '');
          } else {
            select.setAttribute('data-current', v);
          }
        }

        function handleStoryAddRemove() {
          const v = storySel.value;
          if (v === '__add__') {
            const url = prompt('Paste Azure DevOps work item URL (optional):');
            const title = prompt('Story title:');
            if (!title || !title.trim()) {
              storySel.value = '';
              return;
            }
            const idMatch = url ? url.match(/\/edit\/(\d+)/) : null;
            const id = idMatch ? idMatch[1] : String(Date.now());
            if (!state.stories.some((s) => s.id === id)) {
              state.stories.push({ id, title: title.trim(), url: (url || '').trim() });
              save();
            }
            fillStories();
            storySel.value = id;
            storySel.setAttribute('data-current', id);
          } else if (v === '__remove__') {
            const curId = storySel.getAttribute('data-current');
            if (!curId) {
              alert('Select a story first, then choose “Remove selected story”.');
              storySel.value = '';
              return;
            }
            const idx = state.stories.findIndex((s) => s.id === curId);
            if (
              idx > -1 &&
              confirm(`Remove story "${state.stories[idx].title}" from the dropdown?`)
            ) {
              state.stories.splice(idx, 1);
              save();
            }
            fillStories();
            storySel.value = '';
            storySel.setAttribute('data-current', '');
          } else {
            storySel.setAttribute('data-current', v);
          }
        }

        /*** Admin form logic ***/
        function storyIdFromUrl(url) {
          const m = (url || '').match(/\/edit\/(\d+)/);
          return m ? m[1] : '';
        }
        function upsertStoryFromForm() {
          let id = (storyIdIn.value || '').trim();
          const url = (storyUrlIn.value || '').trim();
          const title = (storyTitleIn.value || '').trim();
          if (!title) {
            alert('Title is required.');
            return;
          }
          if (!id) id = storyIdFromUrl(url) || String(Date.now());
          const i = state.stories.findIndex((s) => s.id === id);
          const rec = { id, title, url };
          if (i >= 0) state.stories[i] = rec;
          else state.stories.push(rec);
          save();
          fillStories();
          renderStoryAdminList();
          renderTable();
          storyIdIn.value = storyUrlIn.value = storyTitleIn.value = '';
        }
        function removeStoryById(id) {
          const i = state.stories.findIndex((s) => s.id === id);
          if (i > -1) {
            state.stories.splice(i, 1);
            save();
            fillStories();
            renderStoryAdminList();
            renderTable();
          }
        }

        function addNameTo(listName, inputEl) {
          const name = (inputEl.value || '').trim();
          if (!name) {
            alert('Name is required.');
            return;
          }
          if (!state[listName].some((x) => x.toLowerCase() === name.toLowerCase()))
            state[listName].push(name);
          save();
          fillPeople(qaSel, state.qaPeople);
          fillPeople(devSel, state.devPeople);
          renderPeopleAdminLists();
          renderTable();
          inputEl.value = '';
        }
        function removeNameFrom(listName, name) {
          const idx = state[listName].findIndex((x) => x.toLowerCase() === name.toLowerCase());
          if (idx > -1) {
            state[listName].splice(idx, 1);
            save();
          }
          fillPeople(qaSel, state.qaPeople);
          fillPeople(devSel, state.devPeople);
          renderPeopleAdminLists();
          renderTable();
        }

        /*** Initial render ***/
        renderTable();
        renderStoryAdminList();
        renderPeopleAdminLists();
        storySel.setAttribute('data-current', '');
        qaSel.setAttribute('data-current', '');
        devSel.setAttribute('data-current', '');

        /*** Self-tests (console) — keep existing, add more for new forms ***/
        function runTests() {
          try {
            __TEST_MODE = true;
            const origState = state;
            const clone = JSON.parse(JSON.stringify(state));
            state = clone;

            // Existing tests
            console.assert(escapeHtml('<b>') === '&lt;b&gt;', 'escapeHtml should escape < and >');
            console.assert(truncate('abcdefghij', 5) === 'abcd…', 'truncate should add ellipsis');

            const sel = document.createElement('select');
            fillPeople(sel, state.qaPeople);
            const oldPrompt = window.prompt;
            const oldConfirm = window.confirm;
            window.prompt = () => 'Zed';
            window.confirm = () => true;
            sel.value = '__add__';
            handlePeopleAddRemove(sel, 'qaPeople');
            console.assert(
              state.qaPeople.map((x) => x.toLowerCase()).includes('zed'),
              'person should be added'
            );
            sel.setAttribute('data-current', 'Zed');
            sel.value = '__remove__';
            handlePeopleAddRemove(sel, 'qaPeople');
            console.assert(
              !state.qaPeople.map((x) => x.toLowerCase()).includes('zed'),
              'person should be removed'
            );
            window.prompt = oldPrompt;
            window.confirm = oldConfirm;

            renderTable();
            console.assert(
              !boardBody.innerHTML.includes('&lt;span'),
              'placeholders should render, not be escaped'
            );

            // Added tests
            // Story admin add/update/remove
            storyTitleIn.value = 'A new story';
            storyUrlIn.value = 'https://example.com/workitems/edit/999999';
            storyIdIn.value = '';
            upsertStoryFromForm();
            console.assert(
              state.stories.some((s) => s.id === '999999'),
              'story should be added via admin form'
            );
            storyTitleIn.value = 'A newer title';
            storyIdIn.value = '999999';
            storyUrlIn.value = 'https://example.com/workitems/edit/999999';
            upsertStoryFromForm();
            console.assert(
              state.stories.find((s) => s.id === '999999').title === 'A newer title',
              'story should be updated via admin form'
            );
            removeStoryById('999999');
            console.assert(
              !state.stories.some((s) => s.id === '999999'),
              'story should be removed via admin function'
            );

            // People admin add/remove
            qaAddIn.value = 'QA X';
            addNameTo('qaPeople', qaAddIn);
            console.assert(state.qaPeople.includes('QA X'), 'QA should be added via admin form');
            removeNameFrom('qaPeople', 'QA X');
            console.assert(
              !state.qaPeople.includes('QA X'),
              'QA should be removed via admin function'
            );

            // Submit updates row
            envSel.value = ENVIRONMENTS[0];
            statusSel.value = 'testing';
            qaSel.value = '';
            devSel.value = '';
            storySel.value = '';
            submitBtn.click();
            console.assert(
              state.rows[ENVIRONMENTS[0]].status === 'testing',
              'submit should set status'
            );
            console.assert(
              state.rows[ENVIRONMENTS[0]].changed.length > 0,
              'submit should stamp changed datetime'
            );

            state = origState;
            __TEST_MODE = false;
            renderTable();
            console.log('[FEB] Self-tests passed');
          } catch (e) {
            try {
              __TEST_MODE = false;
              renderTable();
            } catch {}
            console.warn('[FEB] Self-tests failed', e);
          }
        }

        runTests();
      })();