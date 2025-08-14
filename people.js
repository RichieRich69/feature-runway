// edit.js - logic for edit.html

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
    renderPeopleAdminLists();
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

  // --- People logic ---
  function addNameTo(listName, inputEl) {
    const name = (inputEl.value || "").trim();
    if (!name) {
      alert("Name is required.");
      return;
    }
    if (!state[listName].some((x) => x.toLowerCase() === name.toLowerCase())) state[listName].push(name);
    save();
    renderPeopleAdminLists();
    inputEl.value = "";
  }
  function removeNameFrom(listName, name) {
    const idx = state[listName].findIndex((x) => x.toLowerCase() === name.toLowerCase());
    if (idx > -1) {
      state[listName].splice(idx, 1);
      save();
      renderPeopleAdminLists();
    }
  }
  function renderPeopleAdminLists() {
    qaList.innerHTML = state.qaPeople
      .filter(Boolean)
      .map((n) => `<li><span>${escapeHtml(n)}</span><div class="actions"><button class="ghost" data-n="${escapeHtml(n)}" data-list="qaPeople">Delete</button></div></li>`)
      .join("");
    devList.innerHTML = state.devPeople
      .filter(Boolean)
      .map((n) => `<li><span>${escapeHtml(n)}</span><div class="actions"><button class="ghost" data-n="${escapeHtml(n)}" data-list="devPeople">Delete</button></div></li>`)
      .join("");
  }
  qaList.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const name = b.getAttribute("data-n");
    if (confirm(`Delete ${name}?`)) removeNameFrom("qaPeople", name);
  });
  devList.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const name = b.getAttribute("data-n");
    if (confirm(`Delete ${name}?`)) removeNameFrom("devPeople", name);
  });

  // --- Button events ---
  qaAddBtn.addEventListener("click", () => addNameTo("qaPeople", qaAddIn));
  devAddBtn.addEventListener("click", () => addNameTo("devPeople", devAddIn));
})();
