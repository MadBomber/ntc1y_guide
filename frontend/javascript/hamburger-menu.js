document.addEventListener("DOMContentLoaded", () => {
  const btn = document.querySelector(".hamburger-btn")
  const menu = document.querySelector(".hamburger-menu")
  if (!btn || !menu) return

  btn.addEventListener("click", (e) => {
    e.stopPropagation()
    const isOpen = menu.classList.toggle("open")
    btn.setAttribute("aria-expanded", isOpen)
  })

  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && !btn.contains(e.target)) {
      menu.classList.remove("open")
      btn.setAttribute("aria-expanded", "false")
    }
  })

  menu.addEventListener("click", () => {
    menu.classList.remove("open")
    btn.setAttribute("aria-expanded", "false")
  })
})
