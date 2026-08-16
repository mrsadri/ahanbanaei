const toggle = document.querySelector('.nav-toggle')
const nav = document.getElementById('site-nav')

if (toggle && nav) {
  const close = () => {
    toggle.setAttribute('aria-expanded', 'false')
    nav.classList.remove('is-open')
  }
  const open = () => {
    toggle.setAttribute('aria-expanded', 'true')
    nav.classList.add('is-open')
  }

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true'
    isOpen ? close() : open()
  })

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      close()
      toggle.focus()
    }
  })

  document.addEventListener('click', (e) => {
    if (toggle.getAttribute('aria-expanded') !== 'true') return
    if (!nav.contains(e.target) && !toggle.contains(e.target)) close()
  })

  nav.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') close()
  })
}
