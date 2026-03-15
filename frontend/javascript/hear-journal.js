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

// --- Study titles lookup ---

function getStudyTitles() {
  const el = document.getElementById("study-titles-data")
  if (!el) return {}
  try { return JSON.parse(el.textContent) } catch { return {} }
}

function weekTitle(week) {
  const titles = getStudyTitles()
  const w = titles[String(week)]
  return w ? w.title : ""
}

function dayTitle(week, day) {
  const titles = getStudyTitles()
  const w = titles[String(week)]
  if (!w || !w.days) return ""
  const d = w.days[String(day)]
  return d ? d.title : ""
}

function dayReading(week, day) {
  const titles = getStudyTitles()
  const w = titles[String(week)]
  if (!w || !w.days) return ""
  const d = w.days[String(day)]
  return d ? d.reading : ""
}

// --- URL mapping ---

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
  const basePath = document.body?.dataset?.basePath || ""
  return `${basePath}/${phase.path}/week-${wk}`
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

  const dTitle = title || dayTitle(week, day) || "Journal Entry"
  const dReading = reading || dayReading(week, day)
  titleEl.textContent = `Week ${week}, Day ${day}: ${dTitle}`
  if (dReading) {
    contextEl.textContent = `Reading: ${dReading}`
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

  const wTitle = weekTitle(week)
  titleEl.textContent = `Week ${week} Journal`
  if (wTitle) {
    const contextEl = document.getElementById("hear-journal-context")
    contextEl.textContent = wTitle
  }
  weekView.style.display = "block"

  const fieldDefs = [
    { key: "h", label: "Highlight", hint: "What verse or phrase stood out?", rows: 3 },
    { key: "e", label: "Explain", hint: "What did this mean to its original audience?", rows: 4 },
    { key: "a", label: "Apply", hint: "What does this mean for your life today?", rows: 4 },
    { key: "r", label: "Respond", hint: "A specific action step and a written prayer.", rows: 4 },
  ]

  for (let d = 1; d <= 5; d++) {
    const entry = getEntry(week, d) || {}

    const daySection = document.createElement("div")
    daySection.classList.add("hear-week-day")

    const dTitle = dayTitle(week, d) || entry.title || `Day ${d}`
    const dReading = dayReading(week, d) || entry.reading || ""

    const dayHeader = document.createElement("h3")
    const dayLink = document.createElement("a")
    dayLink.href = `${weekPath(week)}/day-${d}`
    dayLink.textContent = `Day ${d}: ${dTitle}`
    dayHeader.appendChild(dayLink)
    daySection.appendChild(dayHeader)

    if (dReading) {
      const readingEl = document.createElement("p")
      readingEl.classList.add("hear-week-reading")
      readingEl.textContent = dReading
      daySection.appendChild(readingEl)
    }

    const statusEl = document.createElement("div")
    statusEl.classList.add("hear-status")

    const textareas = {}

    for (const def of fieldDefs) {
      const fieldDiv = document.createElement("div")
      fieldDiv.classList.add("hear-field")

      const label = document.createElement("label")
      label.innerHTML = `<strong>${def.key.toUpperCase()}</strong> — ${def.label} <span class="hear-field-hint">${def.hint}</span>`

      const textarea = document.createElement("textarea")
      textarea.rows = def.rows
      textarea.value = entry[def.key] || ""
      textareas[def.key] = textarea

      fieldDiv.appendChild(label)
      fieldDiv.appendChild(textarea)
      daySection.appendChild(fieldDiv)
    }

    daySection.appendChild(statusEl)

    // Auto-save on input with debounce
    let saveTimeout = null
    for (const def of fieldDefs) {
      textareas[def.key].addEventListener("input", () => {
        clearTimeout(saveTimeout)
        saveTimeout = setTimeout(() => {
          const current = getEntry(week, d) || {}
          for (const fd of fieldDefs) {
            current[fd.key] = textareas[fd.key].value
          }
          current.reading = entry.reading || ""
          current.title = entry.title || ""
          saveEntry(week, d, current)
          showStatus(statusEl, "Saved")
        }, 800)
      })
    }

    entriesEl.appendChild(daySection)
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
