/*
 * © MedioAI.com - Wynter Jones (@AI.MASSIVE)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const medioAITrackCounter = {
  load: () => {
    const observer = new MutationObserver((mutationsList, observer) => {
      for (let mutation of mutationsList) {
        if (mutation.addedNodes.length) {
          const elements = document.querySelectorAll(
            'button[id^="radix-"].inline-flex.items-center.justify-center.whitespace-nowrap.text-sm.font-medium.ring-offset-background'
          )
          const element = elements[0]
          if (element) {
            if (element.querySelector(`img`)) {
              medioAITrackCounter.init()
              medioAITrackCounter.addLyricAttribution()
              observer.disconnect()
              break
            }
          }
        }
      }
    })

    observer.observe(document, { childList: true, subtree: true })
  },

  init: () => {
    const elements = document.querySelectorAll(
      'button[id^="radix-"].inline-flex.items-center.justify-center.whitespace-nowrap.text-sm.font-medium.ring-offset-background'
    )
    const avatar = elements[0]
    if (!avatar.querySelector(`img`)) return

    const username = avatar.querySelector(`img`).alt
    const forms = document.querySelectorAll('form')
    if (!forms || forms.length < 2) return
    if (!forms[1].querySelector('a')) return
    const trackArtist = forms[1].querySelector('a').textContent

    if (username !== trackArtist) return
    if (document.querySelector('#medioAITrackCount')) return

    document
      .querySelector(
        'body > section > div.mb-\\[150px\\].flex.w-full.flex-row.justify-between > div.ml-auto.mr-4 > div.mt-\\[90px\\] > section > div > div:nth-child(1) > div > div.relative.ml-0.flex.h-full.w-full.flex-grow.flex-col.justify-between.md\\:ml-8.md\\:h-\\[300px\\].\\32 xl\\:h-\\[350px\\] > div.bottom-0.mt-5.flex.w-full.justify-between.md\\:flex-col.md\\:space-y-3 > div > div.mb-3.hidden.items-center.md\\:flex'
      )
      .insertAdjacentHTML('beforeend', medioAITrackCounter.ui)

    medioAITrackCounter.events()
  },

  events: () => {
    document.querySelector('#medioAITrackCount').addEventListener('click', () => {
      medioAITrackCounter.count()
    })
  },

  count: () => {
    document.querySelector('#medioAITrackCount span').textContent = 'Counting...'
    document.querySelector('#medioAITrackCount').classList.add('disabled')

    const id = window.location.href.split('/').pop()
    const iframe = document.createElement('iframe')
    iframe.src = 'https://www.udio.com/tree/' + id
    iframe.id = 'medioAITrackCounter'
    iframe.style.display = 'none'
    document.body.appendChild(iframe)

    iframe.onload = () => {
      const iframeDocument = iframe.contentDocument

      let clicked = 0

      function clickExpand() {
        const expandButtons = Array.from(iframeDocument.querySelectorAll('.relative.cursor-pointer')).filter(
          button => {
            return button.querySelector('svg') !== null && button.classList.length === 2
          }
        )
        if (expandButtons[clicked]) {
          expandButtons[clicked].click()
          clicked++
          setTimeout(() => {
            clickExpand()
          }, 500)
        } else {
          const total = iframeDocument.querySelectorAll('tbody tr').length
          document.querySelector('#medioAITrackCount span').textContent = `Count Credits = ${total}`
          document.querySelector('#medioAITrackCount').classList.remove('disabled')
          iframe.remove()
        }
      }

      clickExpand()
    }
  },

  addLyricAttribution: () => {
    const buttons = document.querySelectorAll('button')
    buttons.forEach(button => {
      if (button.textContent === 'Edit') {
        button.addEventListener('click', () => {
          const insertAttribution = document.getElementById('medioaiInsertAttribution')
          if (insertAttribution) {
            insertAttribution.remove()
          } else {
            setTimeout(() => {
              medioAITrackCounter.appendLyricAttribution()
            }, 400)
          }
        })
      }
    })
  },

  appendLyricAttribution: () => {
    const h2s = document.querySelectorAll('h2')

    h2s.forEach(h2 => {
      if (h2.textContent === 'Lyrics') {
        const attributionBox = document.createElement('div')
        let insertAttribution = document.getElementById('medioaiInsertAttribution')
        if (insertAttribution) return

        attributionBox.innerHTML = `<button id="medioaiInsertAttribution" class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-sm h-10 px-4 mr-3 py-0 md:block w-[120px]">Insert Attribution</button>`

        h2.setAttribute('class', 'mb-3 text-lg font-bold lg:text-xl flex items-center justify-between')

        h2.appendChild(attributionBox)
        insertAttribution = document.getElementById('medioaiInsertAttribution')
        insertAttribution.addEventListener('click', async () => {
          const text = document.querySelector('textarea[placeholder="Lyrics"]').value
          let attr = await utilitiesMedioAI.getSettings('lyricAttribution')
          if (!attr) {
            attr = 'Add your lyric attribution in the settings.'
          }
          const attribution = `${attr}\n\n`
          const textarea = document.querySelector('textarea[placeholder="Lyrics"]')
          textarea.focus()
          textarea.value = attribution + text
          textarea.dispatchEvent(new Event('input', { bubbles: true }))
        })
      }
    })
  },

  ui: /* html */ `
  <button id="medioAITrackCount" class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3" title="Count Credits" type="button" id="radix-:rac:" aria-haspopup="menu" aria-expanded="false" data-state="closed">
    ${iconsMedioAI.credits}
    <span class="ml-2">Count Credits</span>
  </button>`,
}
