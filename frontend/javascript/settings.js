const SETTINGS_KEY = "ntc1y_settings"
const JOURNAL_KEY = "ntc1y_hear"
const PROGRESS_KEY = "ntc1y_progress"

const DEFAULT_SETTINGS = {
  features: {
    journal: true,
    speak: true,
  }
}

// --- Settings storage ---

function getSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}")
    return {
      features: { ...DEFAULT_SETTINGS.features, ...(stored.features || {}) }
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  applyFeatureVisibility()
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

  // Info displays
  updateJournalInfo()
  updateProgressInfo()
  updateStorageInfo()
}

// --- Init ---

document.addEventListener("DOMContentLoaded", () => {
  applyFeatureVisibility()
  initSettingsPage()
})
