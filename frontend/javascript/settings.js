const SETTINGS_KEY = "ntc1y_settings"
const JOURNAL_KEY = "ntc1y_hear"
const PROGRESS_KEY = "ntc1y_progress"
const GROUP_KEY = "ntc1y_group"

const DEFAULT_SETTINGS = {
  features: {
    journal: true,
    speak: true,
    group: false,
    discussions: false,
  },
  discussionTheme: "light",
  siteTheme: "light",
}

// --- Settings storage ---

function getSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}")
    return {
      features: { ...DEFAULT_SETTINGS.features, ...(stored.features || {}) },
      discussionTheme: stored.discussionTheme || DEFAULT_SETTINGS.discussionTheme,
      siteTheme: stored.siteTheme || DEFAULT_SETTINGS.siteTheme,
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  applyFeatureVisibility()
}

// --- Site theme ---

function applySiteTheme() {
  const settings = getSettings()
  document.documentElement.setAttribute("data-theme", settings.siteTheme)
}

// --- Feature visibility ---

function applyFeatureVisibility() {
  const settings = getSettings()
  document.querySelectorAll("[data-feature]").forEach(el => {
    const feature = el.dataset.feature
    if (feature in settings.features) {
      el.style.display = settings.features[feature] ? "" : "none"
    }
  })
}

// --- Journal data helpers ---

function getJournalData() {
  try {
    return JSON.parse(localStorage.getItem(JOURNAL_KEY) || "{}")
  } catch {
    return {}
  }
}

function journalEntryCount() {
  return Object.keys(getJournalData()).length
}

function validateJournalData(data) {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return false
  for (const [key, entry] of Object.entries(data)) {
    if (typeof entry !== "object" || entry === null) return false
    // Must have at least one of h, e, a, r as strings
    const fields = ["h", "e", "a", "r"]
    const hasField = fields.some(f => typeof entry[f] === "string")
    if (!hasField) return false
  }
  return true
}

// --- Progress data helpers ---

function getProgressData() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}")
  } catch {
    return {}
  }
}

function progressItemCount() {
  return Object.keys(getProgressData()).length
}

function validateProgressData(data) {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return false
  for (const [key, value] of Object.entries(data)) {
    if (typeof value !== "string") return false
  }
  return true
}

// --- Download helper ---

function downloadJSON(data, filename) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// --- Journal export/import/clear ---

function exportJournal() {
  const data = getJournalData()
  const count = Object.keys(data).length
  if (count === 0) {
    showStatus("No journal entries to export.")
    return
  }

  const today = new Date().toISOString().split("T")[0]
  downloadJSON(data, `ntc1y-journal-${today}.json`)
  showStatus(`Exported ${count} journal ${count === 1 ? "entry" : "entries"}.`)
}

function importJournal(file) {
  const reader = new FileReader()
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result)
      if (!validateJournalData(data)) {
        showStatus("Invalid journal file. Expected H.E.A.R. journal entries.")
        return
      }

      const count = Object.keys(data).length
      if (count === 0) {
        showStatus("The file contains no journal entries.")
        return
      }

      const existing = journalEntryCount()
      let msg = `Import ${count} journal ${count === 1 ? "entry" : "entries"}?`
      if (existing > 0) {
        msg += ` This will replace your current ${existing} ${existing === 1 ? "entry" : "entries"}.`
      }

      if (window.confirm(msg)) {
        localStorage.setItem(JOURNAL_KEY, JSON.stringify(data))
        showStatus(`Imported ${count} journal ${count === 1 ? "entry" : "entries"}.`)
        updateJournalInfo()
        updateStorageInfo()
      }
    } catch {
      showStatus("Could not read file. Make sure it is a valid JSON file.")
    }
  }
  reader.readAsText(file)
}

function clearJournal() {
  const count = journalEntryCount()
  if (count === 0) {
    showStatus("No journal entries to clear.")
    return
  }

  const msg = `This will permanently delete ${count} journal ${count === 1 ? "entry" : "entries"} from this browser. This cannot be undone.\n\nContinue?`
  if (window.confirm(msg)) {
    localStorage.removeItem(JOURNAL_KEY)
    showStatus("All journal entries have been cleared.")
    updateJournalInfo()
    updateStorageInfo()
  }
}

// --- Progress export/import/clear ---

function exportProgress() {
  const data = getProgressData()
  const count = Object.keys(data).length
  if (count === 0) {
    showStatus("No progress data to export.")
    return
  }

  const today = new Date().toISOString().split("T")[0]
  downloadJSON(data, `ntc1y-progress-${today}.json`)
  showStatus(`Exported progress data (${count} ${count === 1 ? "item" : "items"}).`)
}

function importProgress(file) {
  const reader = new FileReader()
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result)
      if (!validateProgressData(data)) {
        showStatus("Invalid progress file. Expected completion dates keyed by item.")
        return
      }

      const count = Object.keys(data).length
      if (count === 0) {
        showStatus("The file contains no progress data.")
        return
      }

      const existing = progressItemCount()
      let msg = `Import progress for ${count} ${count === 1 ? "item" : "items"}?`
      if (existing > 0) {
        msg += ` This will replace your current progress (${existing} ${existing === 1 ? "item" : "items"}).`
      }

      if (window.confirm(msg)) {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(data))
        showStatus(`Imported progress for ${count} ${count === 1 ? "item" : "items"}.`)
        updateProgressInfo()
        updateStorageInfo()
      }
    } catch {
      showStatus("Could not read file. Make sure it is a valid JSON file.")
    }
  }
  reader.readAsText(file)
}

function clearProgress() {
  const count = progressItemCount()
  if (count === 0) {
    showStatus("No progress data to clear.")
    return
  }

  const msg = `This will permanently delete all progress tracking (${count} completed ${count === 1 ? "item" : "items"}) from this browser. This cannot be undone.\n\nContinue?`
  if (window.confirm(msg)) {
    localStorage.removeItem(PROGRESS_KEY)
    showStatus("All progress data has been cleared.")
    updateProgressInfo()
    updateStorageInfo()
  }
}

// --- Group member management ---

function getGroupMembers() {
  try {
    return JSON.parse(localStorage.getItem(GROUP_KEY) || "[]")
  } catch {
    return []
  }
}

function saveGroupMembers(members) {
  localStorage.setItem(GROUP_KEY, JSON.stringify(members))
  updateGroupInfo()
  updateStorageInfo()
}

function renderGroupMemberList() {
  const list = document.getElementById("group-member-list")
  if (!list) return

  const members = getGroupMembers()
  list.innerHTML = ""

  if (members.length === 0) {
    const empty = document.createElement("p")
    empty.className = "settings-info"
    empty.textContent = "No group members yet. Add someone to get started."
    list.appendChild(empty)
    return
  }

  members.forEach((member, index) => {
    const row = document.createElement("div")
    row.className = "group-member-row"

    const info = document.createElement("span")
    info.className = "group-member-info"
    info.textContent = member.name ? `${member.name} — ${member.email}` : member.email

    const removeBtn = document.createElement("button")
    removeBtn.className = "group-member-remove"
    removeBtn.textContent = "Remove"
    removeBtn.addEventListener("click", () => {
      const current = getGroupMembers()
      current.splice(index, 1)
      saveGroupMembers(current)
      renderGroupMemberList()
    })

    row.appendChild(info)
    row.appendChild(removeBtn)
    list.appendChild(row)
  })
}

function initGroupMemberForm() {
  const addBtn = document.getElementById("group-add-member")
  const nameInput = document.getElementById("group-member-name")
  const emailInput = document.getElementById("group-member-email")
  if (!addBtn || !nameInput || !emailInput) return

  function addMember() {
    const name = nameInput.value.trim()
    const email = emailInput.value.trim()

    if (!email) {
      showStatus("Please enter an email address.")
      return
    }

    const members = getGroupMembers()
    if (members.some(m => m.email.toLowerCase() === email.toLowerCase())) {
      showStatus("That email address is already in your group.")
      return
    }

    members.push({ name, email })
    saveGroupMembers(members)
    renderGroupMemberList()

    nameInput.value = ""
    emailInput.value = ""
    nameInput.focus()

    showStatus(`Added ${name || email} to your group.`)
  }

  addBtn.addEventListener("click", addMember)
  emailInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); addMember() }
  })
}

function updateGroupInfo() {
  const infoEl = document.getElementById("settings-group-info")
  if (!infoEl) return

  const count = getGroupMembers().length
  if (count === 0) {
    infoEl.textContent = "No group members."
  } else {
    infoEl.textContent = `${count} ${count === 1 ? "member" : "members"} in your study group.`
  }
}

function exportGroup() {
  const members = getGroupMembers()
  if (members.length === 0) {
    showStatus("No group members to export.")
    return
  }

  const today = new Date().toISOString().split("T")[0]
  downloadJSON(members, `ntc1y-group-${today}.json`)
  showStatus(`Exported ${members.length} group ${members.length === 1 ? "member" : "members"}.`)
}

function importGroup(file) {
  const reader = new FileReader()
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result)
      if (!Array.isArray(data)) {
        showStatus("Invalid group file. Expected an array of members.")
        return
      }
      const valid = data.every(m => typeof m === "object" && m !== null && typeof m.email === "string")
      if (!valid) {
        showStatus("Invalid group file. Each member must have an email address.")
        return
      }

      const count = data.length
      if (count === 0) {
        showStatus("The file contains no group members.")
        return
      }

      const existing = getGroupMembers().length
      let msg = `Import ${count} group ${count === 1 ? "member" : "members"}?`
      if (existing > 0) {
        msg += ` This will replace your current ${existing} ${existing === 1 ? "member" : "members"}.`
      }

      if (window.confirm(msg)) {
        saveGroupMembers(data)
        renderGroupMemberList()
        showStatus(`Imported ${count} group ${count === 1 ? "member" : "members"}.`)
      }
    } catch {
      showStatus("Could not read file. Make sure it is a valid JSON file.")
    }
  }
  reader.readAsText(file)
}

function clearGroup() {
  const count = getGroupMembers().length
  if (count === 0) {
    showStatus("No group members to clear.")
    return
  }

  const msg = `This will remove all ${count} ${count === 1 ? "member" : "members"} from your study group. This cannot be undone.\n\nContinue?`
  if (window.confirm(msg)) {
    localStorage.removeItem(GROUP_KEY)
    renderGroupMemberList()
    updateGroupInfo()
    updateStorageInfo()
    showStatus("All group members have been removed.")
  }
}

// --- Status display ---

function showStatus(message) {
  const el = document.getElementById("settings-status")
  if (!el) return
  el.textContent = message
  el.classList.add("visible")
  setTimeout(() => el.classList.remove("visible"), 4000)
}

// --- Journal info display ---

function updateJournalInfo() {
  const infoEl = document.getElementById("settings-journal-info")
  if (!infoEl) return

  const count = journalEntryCount()
  if (count === 0) {
    infoEl.textContent = "No journal entries stored."
  } else {
    infoEl.textContent = `${count} journal ${count === 1 ? "entry" : "entries"} stored in this browser.`
  }
}

// --- Progress info display ---

function updateProgressInfo() {
  const infoEl = document.getElementById("settings-progress-info")
  if (!infoEl) return

  const count = progressItemCount()
  if (count === 0) {
    infoEl.textContent = "No progress data stored."
  } else {
    infoEl.textContent = `${count} completed ${count === 1 ? "item" : "items"} stored in this browser.`
  }
}

// --- Storage usage ---

function updateStorageInfo() {
  const el = document.getElementById("settings-storage-info")
  if (!el) return

  try {
    let totalBytes = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith("ntc1y")) {
        totalBytes += localStorage.getItem(key).length * 2 // UTF-16
      }
    }
    const kb = (totalBytes / 1024).toFixed(1)
    el.textContent = `Storage used: ${kb} KB`
  } catch {
    el.textContent = ""
  }
}

// --- Settings page init ---

function initSettingsPage() {
  const page = document.getElementById("settings-page")
  if (!page) return

  const settings = getSettings()

  // Feature toggles
  const toggles = {
    "setting-journal": "journal",
    "setting-speak": "speak",
    "setting-group": "group",
    "setting-discussions": "discussions",
  }

  for (const [id, feature] of Object.entries(toggles)) {
    const el = document.getElementById(id)
    if (!el) continue

    el.checked = settings.features[feature] !== false
    el.addEventListener("change", () => {
      const s = getSettings()
      s.features[feature] = el.checked
      saveSettings(s)
    })
  }

  // Journal data actions
  const exportBtn = document.getElementById("settings-export-journal")
  if (exportBtn) exportBtn.addEventListener("click", exportJournal)

  const importBtn = document.getElementById("settings-import-journal")
  const importFile = document.getElementById("settings-import-journal-file")
  if (importBtn && importFile) {
    importBtn.addEventListener("click", () => importFile.click())
    importFile.addEventListener("change", () => {
      if (importFile.files.length > 0) {
        importJournal(importFile.files[0])
        importFile.value = ""
      }
    })
  }

  const clearBtn = document.getElementById("settings-clear-journal")
  if (clearBtn) clearBtn.addEventListener("click", clearJournal)

  // Progress data actions
  const exportProgressBtn = document.getElementById("settings-export-progress")
  if (exportProgressBtn) exportProgressBtn.addEventListener("click", exportProgress)

  const importProgressBtn = document.getElementById("settings-import-progress")
  const importProgressFile = document.getElementById("settings-import-progress-file")
  if (importProgressBtn && importProgressFile) {
    importProgressBtn.addEventListener("click", () => importProgressFile.click())
    importProgressFile.addEventListener("change", () => {
      if (importProgressFile.files.length > 0) {
        importProgress(importProgressFile.files[0])
        importProgressFile.value = ""
      }
    })
  }

  const clearProgressBtn = document.getElementById("settings-clear-progress")
  if (clearProgressBtn) clearProgressBtn.addEventListener("click", clearProgress)

  // Group member management
  initGroupMemberForm()
  renderGroupMemberList()

  const exportGroupBtn = document.getElementById("settings-export-group")
  if (exportGroupBtn) exportGroupBtn.addEventListener("click", exportGroup)

  const importGroupBtn = document.getElementById("settings-import-group")
  const importGroupFile = document.getElementById("settings-import-group-file")
  if (importGroupBtn && importGroupFile) {
    importGroupBtn.addEventListener("click", () => importGroupFile.click())
    importGroupFile.addEventListener("change", () => {
      if (importGroupFile.files.length > 0) {
        importGroup(importGroupFile.files[0])
        importGroupFile.value = ""
      }
    })
  }

  const clearGroupBtn = document.getElementById("settings-clear-group")
  if (clearGroupBtn) clearGroupBtn.addEventListener("click", clearGroup)

  // Discussion theme selector
  const themeSelect = document.getElementById("setting-discussion-theme")
  if (themeSelect) {
    themeSelect.value = settings.discussionTheme || "light"
    themeSelect.addEventListener("change", () => {
      const s = getSettings()
      s.discussionTheme = themeSelect.value
      saveSettings(s)
      showStatus(`Discussion theme set to "${themeSelect.value}". Changes apply on the next page load.`)
    })
  }

  // Site theme selector
  const siteThemeSelect = document.getElementById("setting-site-theme")
  if (siteThemeSelect) {
    siteThemeSelect.value = settings.siteTheme || "light"
    siteThemeSelect.addEventListener("change", () => {
      const s = getSettings()
      s.siteTheme = siteThemeSelect.value
      saveSettings(s)
      applySiteTheme()
      showStatus(`Site theme set to "${siteThemeSelect.options[siteThemeSelect.selectedIndex].text}".`)
    })
  }

  // Info displays
  updateJournalInfo()
  updateProgressInfo()
  updateGroupInfo()
  updateStorageInfo()
}

// --- Init ---

document.addEventListener("DOMContentLoaded", () => {
  applySiteTheme()
  applyFeatureVisibility()
  initSettingsPage()
})
