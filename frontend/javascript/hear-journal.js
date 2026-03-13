const HEAR_STORAGE_KEY = "ntc1y_hear"

// --- Storage ---

function getJournal() {
  try {
    const data = localStorage.getItem(HEAR_STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}

function saveJournal(journal) {
  localStorage.setItem(HEAR_STORAGE_KEY, JSON.stringify(journal))
}

function entryKey(week, day) {
  return `w${week}-d${day}`
}

function getEntry(week, day) {
  return getJournal()[entryKey(week, day)] || null
}

function saveEntry(week, day, entry) {
  const journal = getJournal()
  entry.updated = new Date().toISOString()
  journal[entryKey(week, day)] = entry
  saveJournal(journal)
}

// --- Day titles lookup (for week view when no title in storage) ---

const WEEK_PHASES = [
  { start: 1,  end: 4,  path: "phase-1-the-coming-of-christ" },
  { start: 5,  end: 11, path: "phase-2-galilean-ministry" },
  { start: 12, end: 16, path: "phase-3-road-to-jerusalem" },
  { start: 17, end: 20, path: "phase-4-passion-and-resurrection" },
  { start: 21, end: 41, path: "phase-5-the-early-church" },
  { start: 42, end: 52, path: "phase-6-letters-and-revelation" },
]

function weekPath(week) {
  const phase = WEEK_PHASES.find(p => week >= p.start && week <= p.end)
  const wk = String(week).padStart(2, "0")
  return `/${phase.path}/week-${wk}`
}

// --- Query params ---

function getParams() {
  const params = new URLSearchParams(window.location.search)
  return {
    week: params.get("week") ? parseInt(params.get("week"), 10) : null,
    day: params.get("day") ? parseInt(params.get("day"), 10) : null,
    reading: params.get("reading") || "",
    title: params.get("title") || "",
  }
}

// --- Day form ---

function initDayForm(week, day, reading, title) {
  const titleEl = document.getElementById("hear-journal-title")
  const contextEl = document.getElementById("hear-journal-context")
  const form = document.getElementById("hear-journal-day-form")
  const statusEl = document.getElementById("hear-status")

  titleEl.textContent = `Week ${week}, Day ${day}: ${title || "Journal Entry"}`
  if (reading) {
    contextEl.textContent = `Reading: ${reading}`
  }
  form.style.display = "block"

  const fields = ["hear-h", "hear-e", "hear-a", "hear-r"]
  const fieldKeys = ["h", "e", "a", "r"]

  // Load existing entry
  const existing = getEntry(week, day)
  if (existing) {
    fieldKeys.forEach((key, i) => {
      const el = document.getElementById(fields[i])
      if (el && existing[key]) el.value = existing[key]
    })
  }

  // Auto-save on input with debounce
  let saveTimeout = null
  fields.forEach((fieldId, i) => {
    const el = document.getElementById(fieldId)
    if (!el) return

    el.addEventListener("input", () => {
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        const entry = existing || {}
        fieldKeys.forEach((key, j) => {
          const field = document.getElementById(fields[j])
          entry[key] = field ? field.value : ""
        })
        entry.reading = reading
        entry.title = title
        saveEntry(week, day, entry)
        showStatus(statusEl, "Saved")
      }, 800)
    })
  })
}

function showStatus(el, message) {
  el.textContent = message
  el.classList.add("visible")
  setTimeout(() => {
    el.classList.remove("visible")
  }, 2000)
}

// --- Week view ---

function initWeekView(week) {
  const titleEl = document.getElementById("hear-journal-title")
  const weekView = document.getElementById("hear-journal-week-view")
  const entriesEl = document.getElementById("hear-week-entries")

  titleEl.textContent = `Week ${week} Journal Review`
  weekView.style.display = "block"

  const journal = getJournal()
  let hasAnyEntry = false

  for (let d = 1; d <= 5; d++) {
    const entry = journal[entryKey(week, d)]

    const daySection = document.createElement("div")
    daySection.classList.add("hear-week-day")

    const dayHeader = document.createElement("h3")
    const dayLink = document.createElement("a")
    dayLink.href = `${weekPath(week)}/day-${d}`
    const dayTitle = entry && entry.title ? entry.title : `Day ${d}`
    dayLink.textContent = `Day ${d}: ${dayTitle}`
    dayHeader.appendChild(dayLink)
    daySection.appendChild(dayHeader)

    if (entry && entry.reading) {
      const readingEl = document.createElement("p")
      readingEl.classList.add("hear-week-reading")
      readingEl.textContent = entry.reading
      daySection.appendChild(readingEl)
    }

    if (entry && (entry.h || entry.e || entry.a || entry.r)) {
      hasAnyEntry = true
      const labels = { h: "Highlight", e: "Explain", a: "Apply", r: "Respond" }
      for (const [key, label] of Object.entries(labels)) {
        if (entry[key] && entry[key].trim()) {
          const fieldDiv = document.createElement("div")
          fieldDiv.classList.add("hear-week-field")

          const fieldLabel = document.createElement("strong")
          fieldLabel.textContent = label
          fieldDiv.appendChild(fieldLabel)

          const fieldText = document.createElement("p")
          fieldText.textContent = entry[key]
          fieldDiv.appendChild(fieldText)

          daySection.appendChild(fieldDiv)
        }
      }

      if (entry.updated) {
        const dateEl = document.createElement("p")
        dateEl.classList.add("hear-week-date")
        const d2 = new Date(entry.updated)
        dateEl.textContent = `Last edited: ${d2.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
        daySection.appendChild(dateEl)
      }
    } else {
      const emptyEl = document.createElement("p")
      emptyEl.classList.add("hear-week-empty")
      emptyEl.textContent = "No journal entry yet."
      daySection.appendChild(emptyEl)
    }

    // Edit link
    const editLink = document.createElement("a")
    editLink.href = `?week=${week}&day=${d}`
    editLink.classList.add("hear-week-edit-link")
    editLink.textContent = entry && (entry.h || entry.e || entry.a || entry.r) ? "Edit entry" : "Write entry"
    daySection.appendChild(editLink)

    entriesEl.appendChild(daySection)
  }

  if (!hasAnyEntry) {
    const contextEl = document.getElementById("hear-journal-context")
    contextEl.textContent = "No journal entries for this week yet. Open a day page and use the journal icon to begin."
  }
}

// --- No params view ---

function initNoParams() {
  const noParams = document.getElementById("hear-journal-no-params")
  noParams.style.display = "block"

  const select = document.getElementById("hear-week-select")
  const journal = getJournal()

  for (let w = 1; w <= 52; w++) {
    const opt = document.createElement("option")
    opt.value = w

    // Check if any entries exist for this week
    let hasEntry = false
    for (let d = 1; d <= 5; d++) {
      if (journal[entryKey(w, d)]) { hasEntry = true; break }
    }

    opt.textContent = `Week ${w}${hasEntry ? " *" : ""}`
    select.appendChild(opt)
  }

  document.getElementById("hear-week-go").addEventListener("click", () => {
    const week = select.value
    if (week) {
      window.location.search = `?week=${week}`
    }
  })
}

// --- Init ---

document.addEventListener("DOMContentLoaded", () => {
  const journalEl = document.getElementById("hear-journal")
  if (!journalEl) return

  const { week, day, reading, title } = getParams()

  if (week && day) {
    initDayForm(week, day, reading, title)
  } else if (week) {
    initWeekView(week)
  } else {
    initNoParams()
  }
})
