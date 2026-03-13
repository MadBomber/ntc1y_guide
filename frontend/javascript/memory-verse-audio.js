document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".mv-listen-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!("speechSynthesis" in window)) {
        return
      }

      const synth = window.speechSynthesis
      const reference = btn.dataset.reference
      const verse = btn.dataset.verse
      const label = btn.querySelector(".mv-listen-label")

      if (synth.speaking) {
        synth.cancel()
        btn.classList.remove("speaking")
        label.textContent = "Listen"
        return
      }

      const text = `${reference}. ${verse} ${reference}.`
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1.0

      utterance.onstart = () => {
        btn.classList.add("speaking")
        label.textContent = "Stop"
      }

      utterance.onend = () => {
        btn.classList.remove("speaking")
        label.textContent = "Listen"
      }

      utterance.onerror = () => {
        btn.classList.remove("speaking")
        label.textContent = "Listen"
      }

      synth.speak(utterance)
    })
  })
})
