function loadGiscus() {
  const container = document.querySelector(".page-discussions .giscus")
  if (!container) return

  // Check if feature is enabled and read theme preference
  let theme = "light"
  try {
    const settings = JSON.parse(localStorage.getItem("ntc1y_settings") || "{}")
    if (settings.features?.discussions !== true) return
    if (settings.discussionTheme) theme = settings.discussionTheme
  } catch { return }

  const script = document.createElement("script")
  script.src = "https://giscus.app/client.js"
  script.setAttribute("data-repo", "madbomber/ntc1y_discussions")
  script.setAttribute("data-repo-id", "R_kgDORmVELw")
  script.setAttribute("data-category", "Page Comments")
  script.setAttribute("data-category-id", "DIC_kwDORmVEL84C4Upd")
  script.setAttribute("data-mapping", "pathname")
  script.setAttribute("data-strict", "1")
  script.setAttribute("data-reactions-enabled", "1")
  script.setAttribute("data-emit-metadata", "0")
  script.setAttribute("data-input-position", "top")
  script.setAttribute("data-theme", theme)
  script.setAttribute("data-lang", "en")
  script.setAttribute("data-loading", "lazy")
  script.crossOrigin = "anonymous"
  script.async = true

  container.appendChild(script)
}

document.addEventListener("DOMContentLoaded", loadGiscus)
