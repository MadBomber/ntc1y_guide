document.addEventListener("DOMContentLoaded", () => {
  const btn = document.querySelector(".toolbar-speak-btn")
  if (!btn || !("speechSynthesis" in window)) return

  const synth = window.speechSynthesis

  btn.addEventListener("click", () => {
    if (synth.speaking) {
      synth.cancel()
      btn.classList.remove("speaking")
      btn.dataset.tooltip = "Read page aloud"
      return
    }

    const article = document.querySelector("article")
    if (!article) return

    const text = article.innerText
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.pitch = 1.0

    utterance.onstart = () => {
      btn.classList.add("speaking")
      btn.dataset.tooltip = "Stop reading"
    }

    utterance.onend = () => {
      btn.classList.remove("speaking")
      btn.dataset.tooltip = "Read page aloud"
    }

    utterance.onerror = () => {
      btn.classList.remove("speaking")
      btn.dataset.tooltip = "Read page aloud"
    }

    synth.speak(utterance)
  })
})
