document.querySelectorAll('.gallery--strip').forEach((strip) => {
  strip.setAttribute('tabindex', '0')
  strip.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') strip.scrollBy({ left: -240, behavior: 'smooth' })
    if (e.key === 'ArrowRight') strip.scrollBy({ left: 240, behavior: 'smooth' })
  })
})
