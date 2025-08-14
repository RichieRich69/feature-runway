// env-update.js
// Handles the logic for the Environment update form on env-update.html
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
  // --- Constants (copy from index.html as needed) ---
  const ENVIRONMENTS = [
    { name: "Feature 1 BW", url: "https://capricornro-retail-feature1-bw.azurewebsites.net/home" },
    { name: "Feature 1 BG", url: "https://capricornro-retail-feature1.azurewebsites.net/home" },
    { name: "Feature 2 BW", url: "https://capricornro-retail-feature2-bw.azurewebsites.net/home" },
    { name: "Feature 2 BG", url: "https://capricornro-retail-feature2.azurewebsites.net/home" },
    { name: "Feature 3 BW", url: "https://capricornro-retail-feature3-bw.azurewebsites.net/home" },
    { name: "Feature 3 BG", url: "https://capricornro-retail-feature3.azurewebsites.net/home" },
    { name: "Feature 4 BW", url: "https://capricornro-retail-feature4-bw.azurewebsites.net/home" },
    { name: "Feature 4 BG", url: "https://capricornro-retail-feature4.azurewebsites.net/home" },
    { name: "Demo BW", url: "https://capricornro-retail-demo-bw.azurewebsites.net/home" },
    { name: "Demo BG", url: "https://capricornro-retail-demo-bg.azurewebsites.net/home" },
  ];
  const STATUS = {
    available: { emoji: "🟢", label: "Available" },
    testing: { emoji: "🟡", label: "Testing" },
    locked: { emoji: "🔴", label: "Locked Ready for ART Demo" },
    nextup: { emoji: "🆕", label: "Next-up" },
  };
  const ZONE = "Africa/Windhoek";

  // --- Helpers ---
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

  // --- Helpers for server data ---
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

  function seed() {
    const stories = [];
    const rows = {};
    ENVIRONMENTS.forEach((env) => (rows[env.name] = { status: "available", storyId: "", qa: "", dev: "", changed: "" }));
    ["Feature 2 BW", "Feature 2 BG"].forEach((env) => (rows[env] = { status: "testing", storyId: "280305", qa: "Andrew", dev: "Richard", changed: "06 Aug 2025 09:00" }));
    ["Feature 4 BW", "Feature 4 BG"].forEach((env) => (rows[env] = { status: "testing", storyId: "284166", qa: "Andrew", dev: "Richard", changed: "11 Aug 2025 09:00" }));
    const qaPeople = ["", "Andrew", "Richard", "Dina", "Sam", "Priya"];
    const devPeople = ["", "Richard", "Andrew", "Lee", "Marta", "Kurt"];
    return { rows, stories, qaPeople, devPeople };
  }

  let state = null;

  // --- DOM ---
  const envSel = document.getElementById("env");
  const statusSel = document.getElementById("status");
  const storySel = document.getElementById("story");
  const qaSel = document.getElementById("qa");
  const devSel = document.getElementById("dev");
  const submitBtn = document.getElementById("submit");

  // --- Populate selects ---
  function fillEnv() {
    envSel.innerHTML = ENVIRONMENTS.map((e) => `<option value="${e.name}">${e.name}</option>`).join("");
  }
  function fillPeople(select, list) {
    const options = ['<option value="">— None —</option>', ...list.filter(Boolean).map((n) => `<option value="${n}">${n}</option>`)];
    select.innerHTML = options.join("");
  }
  function fillStories() {
    const opts = ['<option value="">— None —</option>', ...state.stories.map((s) => `<option value="${s.id}">${s.title.length > 90 ? s.title.slice(0, 89) + "…" : s.title}</option>`)];
    storySel.innerHTML = opts.join("");
  }

  // --- Load state and initialize form ---
  (async function () {
    state = await load();
    if (!state) state = seed();
    fillEnv();
    fillStories();
    fillPeople(qaSel, state.qaPeople);
    fillPeople(devSel, state.devPeople);
  })();

  // --- Submit handler ---
  submitBtn.addEventListener("click", async function () {
    const env = envSel.value;
    const st = statusSel.value || "available";
    let storyId = storySel.value;
    if (storyId.startsWith("__")) storyId = "";
    let qa = qaSel.value;
    if (qa.startsWith("__")) qa = "";
    let dev = devSel.value;
    if (dev.startsWith("__")) dev = "";

    const row = state.rows[env] || { status: "available", storyId: "", qa: "", dev: "", changed: "" };
    row.status = st;
    row.storyId = storyId;
    row.qa = qa;
    row.dev = dev;
    row.changed = nowStamp();
    state.rows[env] = row;
    await save();

    if (!storyId && !qa && !dev && st === "available") {
      showAlert(`Cleared ${env}<br />Environment is now available. <br /><br />Refresh page...`);
    } else {
      showAlert(`Updated ${env}<br />Status=${st}, Story=${storyId}, QA=${qa}, Dev=${dev}. <br /><br />Refresh page...`);
    }
  });
})();
