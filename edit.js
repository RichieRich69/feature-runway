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
  "use strict";
  // --- Constants and helpers (copy from index.html) ---
  const LS_KEY = "feb-embedded-v1";
  const ZONE = "Africa/Windhoek";

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));
  }
  function nowStamp() {
    const d = new Date();
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: ZONE,
    });
  }
  async function save() {
    try {
      await fetch("/api/page-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: state }),
      });
    } catch (e) {
      console.warn("Failed to save to server", e);
    }
  }
  async function load() {
    try {
      const res = await fetch("/api/page-data");
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      console.warn("Failed to load from server", e);
    }
    return null;
  }

  // --- State ---
  let state = null;
  (async function () {
    state = await load();
    if (!state) state = { stories: [], qaPeople: [], devPeople: [] };
    renderStoryAdminList();
  })();

  // --- DOM ---
  const storyTitleIn = document.getElementById("storyTitleIn");
  const storyUrlIn = document.getElementById("storyUrlIn");
  const storyIdIn = document.getElementById("storyIdIn");
  const storyAddBtn = document.getElementById("storyAddBtn");
  const storyList = document.getElementById("storyList");
  const qaAddIn = document.getElementById("qaAddIn");
  const qaAddBtn = document.getElementById("qaAddBtn");
  const devAddIn = document.getElementById("devAddIn");
  const devAddBtn = document.getElementById("devAddBtn");
  const qaList = document.getElementById("qaList");
  const devList = document.getElementById("devList");

  // --- Story logic ---
  function storyIdFromUrl(url) {
    const m = (url || "").match(/\/edit\/(\d+)/);
    return m ? m[1] : "";
  }
  function upsertStoryFromForm() {
    let id = (storyIdIn.value || "").trim();
    const url = (storyUrlIn.value || "").trim();
    const title = (storyTitleIn.value || "").trim();
    if (!title) {
      showAlert("Title is required.");
      return;
    }
    if (!id) id = storyIdFromUrl(url) || String(Date.now());
    const i = state.stories.findIndex((s) => s.id === id);
    const rec = { id, title, url };
    if (i >= 0) state.stories[i] = rec;
    else state.stories.push(rec);
    save();
    renderStoryAdminList();
    storyIdIn.value = storyUrlIn.value = storyTitleIn.value = "";
  }
  function removeStoryById(id) {
    const i = state.stories.findIndex((s) => s.id === id);
    if (i > -1) {
      state.stories.splice(i, 1);
      save();
      renderStoryAdminList();
    }
  }
  function renderStoryAdminList() {
    storyList.innerHTML = state.stories
      .map(
        (s) => `<li><div style="flex:1; min-width:0"><div style="font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${escapeHtml(s.title)}</div><div class="tiny">ID: ${escapeHtml(s.id)} ${s.url ? "• " + escapeHtml(s.url) : ""}</div></div><div class="actions"><button class="ghost" data-act="edit" data-id="${escapeHtml(s.id)}">Edit</button><button class="ghost" data-act="del" data-id="${escapeHtml(s.id)}">Delete</button></div></li>`
      )
      .join("");
  }
  storyList.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const id = btn.getAttribute("data-id");
    const act = btn.getAttribute("data-act");
    const s = state.stories.find((x) => x.id === id);
    if (!s) return;
    if (act === "edit") {
      storyIdIn.value = s.id;
      storyTitleIn.value = s.title;
      storyUrlIn.value = s.url || "";
    } else if (act === "del") {
      showConfirm(`Delete story "${s.title}"?`, () => removeStoryById(id));
    }
  });

  // --- Button events ---
  storyAddBtn.addEventListener("click", upsertStoryFromForm);
})();
