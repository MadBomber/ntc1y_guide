const GROUP_KEY = "ntc1y_group"

function getGroupMembers() {
  try {
    return JSON.parse(localStorage.getItem(GROUP_KEY) || "[]")
  } catch {
    return []
  }
}

function buildMailtoLink() {
  const members = getGroupMembers()
  if (members.length === 0) return null

  const emails = members.map(m => m.email).join(",")

  // Build subject from page metadata
  const article = document.querySelector("article[data-week]")
  const pageTitle = document.querySelector("h1")
  let subject = "NT Study"

  if (article) {
    const week = article.dataset.week
    const day = article.dataset.day
    const title = pageTitle ? pageTitle.textContent.trim() : ""

    if (day) {
      subject = `NT Study: Week ${week}, Day ${day}`
      if (title) subject += ` — ${title}`
    } else if (article.dataset.type === "discussion") {
      subject = `NT Study: Week ${week} Discussion`
      if (title) subject += ` — ${title}`
    } else {
      subject = `NT Study: Week ${week} Overview`
      if (title) subject += ` — ${title}`
    }
  } else if (pageTitle) {
    subject = `NT Study: ${pageTitle.textContent.trim()}`
  }

  // Build body
  const parts = []
  parts.push(document.title || "A Year at His Feet")
  parts.push(window.location.href)
  parts.push("")

  // Include H.E.A.R. Highlight if available for this day
  if (article && article.dataset.week && article.dataset.day) {
    try {
      const journal = JSON.parse(localStorage.getItem("ntc1y_hear") || "{}")
      const key = `w${article.dataset.week}-d${article.dataset.day}`
      const entry = journal[key]
      if (entry && entry.h && entry.h.trim()) {
        parts.push("What stood out to me:")
        parts.push(entry.h.trim())
        parts.push("")
      }
    } catch {}
  }

  parts.push("---")
  parts.push("")

  const body = parts.join("\n")
  return `mailto:${emails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

function handleShareClick(e) {
  const members = getGroupMembers()
  if (members.length === 0) {
    e.preventDefault()
    const basePath = document.body?.dataset?.basePath || ""
    window.location.href = `${basePath}/settings/#group-members`
    return
  }

  const href = buildMailtoLink()
  if (href) {
    e.preventDefault()
    window.location.href = href
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const shareBtn = document.getElementById("toolbar-share-email")
  if (shareBtn) {
    shareBtn.addEventListener("click", handleShareClick)
  }
})
