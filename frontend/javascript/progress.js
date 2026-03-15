const STORAGE_KEY = "ntc1y_progress"

// --- Storage ---

function getProgress() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

function getDate(key) {
  return getProgress()[key] || null
}

function markComplete(key) {
  const progress = getProgress()
  if (!progress[key]) {
    progress[key] = new Date().toISOString().split("T")[0]
  }
  saveProgress(progress)
  return progress[key]
}

function markIncomplete(key) {
  const progress = getProgress()
  delete progress[key]
  saveProgress(progress)
}

// --- Keys ---

function phaseKey(p) { return `p${p}` }
function weekOverviewKey(w) { return `w${w}overview` }
function dayKey(w, d) { return `w${w}d${d}` }
function discussionKey(w) { return `w${w}discussion` }
function memoryVerseKey(w) { return `mv${w}` }

function weekItemKeys(w) {
  return [
    weekOverviewKey(w),
    dayKey(w, 1), dayKey(w, 2), dayKey(w, 3), dayKey(w, 4), dayKey(w, 5),
    discussionKey(w),
  ]
}

// --- Week/Phase completion ---

function getWeekCompletionDate(week) {
  const progress = getProgress()
  let lastDate = null
  for (const key of weekItemKeys(week)) {
    const date = progress[key]
    if (!date) return null
    if (!lastDate || date > lastDate) lastDate = date
  }
  return lastDate
}

function completedItemCount() {
  return Object.keys(getProgress()).length
}

const TOTAL_ITEMS = 6 + (52 * 7) // 6 phases + 52 weeks × 7 items = 370

// --- Base path ---

let BASE_PATH = ""

function initBasePath() {
  BASE_PATH = document.body?.dataset?.basePath || ""
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

function phasePath(phaseNum) {
  return WEEK_PHASES[phaseNum - 1].path
}

function weekPath(week) {
  const phase = WEEK_PHASES.find(p => week >= p.start && week <= p.end)
  const wk = String(week).padStart(2, "0")
  return `${BASE_PATH}/${phase.path}/week-${wk}`
}

function itemUrl(item) {
  if (item.type === "phase") return `${BASE_PATH}/${phasePath(item.phase)}/`
  if (item.type === "overview") return `${weekPath(item.week)}/overview`
  if (item.type === "day") return `${weekPath(item.week)}/day-${item.day}`
  if (item.type === "discussion") return `${weekPath(item.week)}/discussion`
  return `${BASE_PATH}/`
}

// --- Next reading ---

function findNextReading() {
  const progress = getProgress()

  for (let pi = 0; pi < WEEK_PHASES.length; pi++) {
    const phase = WEEK_PHASES[pi]
    const pNum = pi + 1

    // Phase overview first
    if (!progress[phaseKey(pNum)]) {
      return { type: "phase", phase: pNum, label: `Phase ${pNum} Overview` }
    }

    for (let w = phase.start; w <= phase.end; w++) {
      // Week overview
      if (!progress[weekOverviewKey(w)]) {
        return { type: "overview", week: w, label: `Week ${w} Overview` }
      }
      // Days 1-5
      for (let d = 1; d <= 5; d++) {
        if (!progress[dayKey(w, d)]) {
          return { type: "day", week: w, day: d, label: `Week ${w}, Day ${d}` }
        }
      }
      // Discussion
      if (!progress[discussionKey(w)]) {
        return { type: "discussion", week: w, label: `Week ${w} Discussion` }
      }
    }
  }
  return null
}

// --- UI helpers ---

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function createCheckbox(checked) {
  const cb = document.createElement("input")
  cb.type = "checkbox"
  cb.checked = checked
  cb.classList.add("progress-checkbox")
  return cb
}

function createDateSpan(dateStr) {
  const span = document.createElement("span")
  span.classList.add("progress-date")
  span.textContent = dateStr ? formatDate(dateStr) : ""
  return span
}

function addMarkCompleteButton(container, storageKey) {
  const wrapper = document.createElement("div")
  wrapper.classList.add("day-complete-container")

  const dateStr = getDate(storageKey)

  const btn = document.createElement("button")
  btn.classList.add("day-complete-btn")
  updateButton(btn, !!dateStr)

  const dateSpan = createDateSpan(dateStr)

  btn.addEventListener("click", () => {
    if (getDate(storageKey)) {
      markIncomplete(storageKey)
      dateSpan.textContent = ""
      updateButton(btn, false)
    } else {
      const date = markComplete(storageKey)
      dateSpan.textContent = formatDate(date)
      updateButton(btn, true)
    }
  })

  wrapper.appendChild(btn)
  wrapper.appendChild(dateSpan)

  // Insert before the first <hr> or append
  const hr = container.querySelector("hr")
  if (hr) {
    hr.parentNode.insertBefore(wrapper, hr)
  } else {
    container.appendChild(wrapper)
  }
}

function updateButton(btn, isComplete) {
  if (isComplete) {
    btn.textContent = "Completed"
    btn.classList.add("completed")
  } else {
    btn.textContent = "Mark Complete"
    btn.classList.remove("completed")
  }
}

// --- Home page ---

function enhanceHomePage() {
  // Today's Bible Study card
  const container = document.getElementById("todays-study")
  if (container) {
    const next = findNextReading()
    const card = document.createElement("a")
    card.classList.add("todays-study-card")

    if (next) {
      card.href = itemUrl(next)
      card.innerHTML =
        `<span class="todays-study-label">Today's Bible Study</span>` +
        `<span class="todays-study-detail">${next.label}</span>`

      const count = completedItemCount()
      if (count > 0) {
        const pct = Math.round((count / TOTAL_ITEMS) * 100)
        card.innerHTML +=
          `<span class="todays-study-progress">${count} of ${TOTAL_ITEMS} steps complete (${pct}%)</span>`
      }
    } else {
      card.href = "#"
      card.innerHTML =
        `<span class="todays-study-label">Journey Complete!</span>` +
        `<span class="todays-study-detail">You have finished the entire New Testament study</span>`
    }

    container.appendChild(card)
  }

  // Week checkboxes in tables, with phase overview row
  const tables = document.querySelectorAll("main table")
  tables.forEach(table => {
    // Find the phase number from the preceding h2 id (e.g. "phase-1")
    let phaseNum = null
    let el = table.previousElementSibling
    while (el) {
      if (el.tagName === "H2" && el.id && el.id.startsWith("phase-")) {
        phaseNum = parseInt(el.id.replace("phase-", ""), 10)
        break
      }
      el = el.previousElementSibling
    }

    const headerRow = table.querySelector("thead tr")
    if (!headerRow) return

    const thCheck = document.createElement("th")
    thCheck.textContent = ""
    headerRow.insertBefore(thCheck, headerRow.firstChild)

    const thDate = document.createElement("th")
    thDate.textContent = "Completed"
    headerRow.appendChild(thDate)

    const tbody = table.querySelector("tbody")

    // Insert phase overview row at the top
    if (phaseNum && tbody) {
      const phaseDate = getDate(phaseKey(phaseNum))
      const phaseRow = document.createElement("tr")
      phaseRow.classList.add("phase-overview-row")

      const phaseCheckTd = document.createElement("td")
      phaseCheckTd.classList.add("progress-cell")
      const phaseCb = createCheckbox(!!phaseDate)
      phaseCb.disabled = true
      phaseCb.title = phaseDate ? "Phase overview complete" : "Read the phase overview to check this off"
      phaseCheckTd.appendChild(phaseCb)

      const phaseNumTd = document.createElement("td")
      phaseNumTd.textContent = ""

      const phaseTitleTd = document.createElement("td")
      phaseTitleTd.innerHTML = `<a href="${BASE_PATH}/${phasePath(phaseNum)}/">Phase Overview</a>`

      const phaseLinkTd = document.createElement("td")
      phaseLinkTd.innerHTML = `<a href="${BASE_PATH}/${phasePath(phaseNum)}/">Read</a>`

      const phaseDateTd = document.createElement("td")
      phaseDateTd.classList.add("progress-date-cell")
      phaseDateTd.appendChild(createDateSpan(phaseDate))

      phaseRow.appendChild(phaseCheckTd)
      phaseRow.appendChild(phaseNumTd)
      phaseRow.appendChild(phaseTitleTd)
      phaseRow.appendChild(phaseLinkTd)
      phaseRow.appendChild(phaseDateTd)

      tbody.insertBefore(phaseRow, tbody.firstChild)
    }

    // Week rows
    const rows = tbody.querySelectorAll("tr:not(.phase-overview-row)")
    rows.forEach(row => {
      const firstCell = row.querySelector("td")
      if (!firstCell) return

      const weekNum = parseInt(firstCell.textContent.trim(), 10)
      if (isNaN(weekNum)) return

      const completionDate = getWeekCompletionDate(weekNum)

      const checkTd = document.createElement("td")
      checkTd.classList.add("progress-cell")
      const cb = createCheckbox(!!completionDate)
      cb.disabled = true
      cb.title = completionDate ? "All 7 items complete" : "Complete all items in this week"
      checkTd.appendChild(cb)
      row.insertBefore(checkTd, row.firstChild)

      const dateTd = document.createElement("td")
      dateTd.classList.add("progress-date-cell")
      dateTd.appendChild(createDateSpan(completionDate))
      row.appendChild(dateTd)
    })
  })
}

// --- Phase overview page ---

function enhancePhasePage(phaseNum) {
  const article = document.querySelector("[data-phase]")
  if (!article) return

  addMarkCompleteButton(article, phaseKey(phaseNum))
}

// --- Week overview page ---

function enhanceWeekPage(weekNum) {
  const article = document.querySelector("[data-week]")
  if (!article) return

  // Mark overview complete button
  addMarkCompleteButton(article, weekOverviewKey(weekNum))

  // Day checkboxes in readings table
  const table = article.querySelector("table")
  if (!table) return

  const headerRow = table.querySelector("thead tr")
  if (headerRow) {
    const thCheck = document.createElement("th")
    thCheck.textContent = ""
    headerRow.insertBefore(thCheck, headerRow.firstChild)

    const thDate = document.createElement("th")
    thDate.textContent = "Completed"
    headerRow.appendChild(thDate)
  }

  const rows = table.querySelectorAll("tbody tr")
  rows.forEach(row => {
    const firstCell = row.querySelector("td")
    if (!firstCell) return

    const dayNum = parseInt(firstCell.textContent.trim(), 10)
    if (isNaN(dayNum)) return

    const key = dayKey(weekNum, dayNum)
    const dateStr = getDate(key)

    const checkTd = document.createElement("td")
    checkTd.classList.add("progress-cell")
    const cb = createCheckbox(!!dateStr)
    const dateSpan = createDateSpan(dateStr)

    cb.addEventListener("change", () => {
      if (cb.checked) {
        const date = markComplete(key)
        dateSpan.textContent = formatDate(date)
      } else {
        markIncomplete(key)
        dateSpan.textContent = ""
      }
    })
    checkTd.appendChild(cb)
    row.insertBefore(checkTd, row.firstChild)

    const dateTd = document.createElement("td")
    dateTd.classList.add("progress-date-cell")
    dateTd.appendChild(dateSpan)
    row.appendChild(dateTd)
  })
}

// --- Day page ---

function enhanceDayPage(weekNum, dayNum) {
  const article = document.querySelector("[data-week][data-day]")
  if (!article) return

  addMarkCompleteButton(article, dayKey(weekNum, dayNum))
}

// --- Discussion page ---

function enhanceDiscussionPage(weekNum) {
  const article = document.querySelector("[data-week][data-type='discussion']")
  if (!article) return

  addMarkCompleteButton(article, discussionKey(weekNum))
}

// --- Memory verse card page ---

function enhanceMemoryVerseCard(weekNum) {
  const actions = document.querySelector(".mv-footer-actions")
  if (!actions) return

  const key = memoryVerseKey(weekNum)
  const dateStr = getDate(key)

  const btn = document.createElement("button")
  btn.classList.add("day-complete-btn")
  updateButton(btn, !!dateStr)

  const dateSpan = createDateSpan(dateStr)

  btn.addEventListener("click", () => {
    if (getDate(key)) {
      markIncomplete(key)
      dateSpan.textContent = ""
      updateButton(btn, false)
    } else {
      const date = markComplete(key)
      dateSpan.textContent = formatDate(date)
      updateButton(btn, true)
    }
  })

  actions.appendChild(btn)
  actions.appendChild(dateSpan)
}

// --- Memory verses index page ---

function enhanceMemoryVersesIndex() {
  const progress = getProgress()

  // Progress summary
  const summary = document.getElementById("mv-progress-summary")
  if (summary) {
    let memorized = 0
    for (let w = 1; w <= 52; w++) {
      if (progress[memoryVerseKey(w)]) memorized++
    }
    const pct = Math.round((memorized / 52) * 100)

    const bar = document.createElement("div")
    bar.classList.add("mv-progress-bar-container")
    bar.innerHTML =
      `<div class="mv-progress-info">` +
      `<strong>${memorized}</strong> of <strong>52</strong> verses memorized (${pct}%)` +
      `</div>` +
      `<div class="mv-progress-track">` +
      `<div class="mv-progress-fill" style="width: ${pct}%"></div>` +
      `</div>`
    summary.appendChild(bar)
  }

  // Add checkboxes to tables
  const tables = document.querySelectorAll("main table")
  tables.forEach(table => {
    const headerRow = table.querySelector("thead tr")
    if (!headerRow) return

    const thCheck = document.createElement("th")
    thCheck.textContent = ""
    headerRow.insertBefore(thCheck, headerRow.firstChild)

    const thDate = document.createElement("th")
    thDate.textContent = "Memorized"
    headerRow.appendChild(thDate)

    const rows = table.querySelectorAll("tbody tr")
    rows.forEach(row => {
      const firstCell = row.querySelector("td")
      if (!firstCell) return

      const weekNum = parseInt(firstCell.textContent.trim(), 10)
      if (isNaN(weekNum)) return

      const key = memoryVerseKey(weekNum)
      const dateStr = getDate(key)

      const checkTd = document.createElement("td")
      checkTd.classList.add("progress-cell")
      const cb = createCheckbox(!!dateStr)
      const dateSpan = createDateSpan(dateStr)

      cb.addEventListener("change", () => {
        if (cb.checked) {
          const date = markComplete(key)
          dateSpan.textContent = formatDate(date)
          updateProgressSummary()
        } else {
          markIncomplete(key)
          dateSpan.textContent = ""
          updateProgressSummary()
        }
      })
      checkTd.appendChild(cb)
      row.insertBefore(checkTd, row.firstChild)

      const dateTd = document.createElement("td")
      dateTd.classList.add("progress-date-cell")
      dateTd.appendChild(dateSpan)
      row.appendChild(dateTd)
    })
  })

  function updateProgressSummary() {
    const prog = getProgress()
    let memorized = 0
    for (let w = 1; w <= 52; w++) {
      if (prog[memoryVerseKey(w)]) memorized++
    }
    const pct = Math.round((memorized / 52) * 100)
    const info = document.querySelector(".mv-progress-info")
    if (info) {
      info.innerHTML = `<strong>${memorized}</strong> of <strong>52</strong> verses memorized (${pct}%)`
    }
    const fill = document.querySelector(".mv-progress-fill")
    if (fill) {
      fill.style.width = `${pct}%`
    }
  }
}

// --- Auto-detect and enhance ---

document.addEventListener("DOMContentLoaded", () => {
  initBasePath()
  const article = document.querySelector("article[data-phase], article[data-week]")

  // Memory verses index page
  if (document.getElementById("mv-progress-summary")) {
    enhanceMemoryVersesIndex()
    return
  }

  // Memory verse card page
  const mvCard = document.querySelector(".memory-verse-card")
  if (mvCard && mvCard.dataset.week) {
    enhanceMemoryVerseCard(parseInt(mvCard.dataset.week))
    return
  }

  if (!article) {
    // Home page
    if (document.querySelector("[data-page='home']")) {
      enhanceHomePage()
    }
    return
  }

  if (article.dataset.phase) {
    enhancePhasePage(parseInt(article.dataset.phase))
  } else if (article.dataset.type === "discussion") {
    enhanceDiscussionPage(parseInt(article.dataset.week))
  } else if (article.dataset.day) {
    enhanceDayPage(parseInt(article.dataset.week), parseInt(article.dataset.day))
  } else if (article.dataset.week) {
    enhanceWeekPage(parseInt(article.dataset.week))
  }
})
