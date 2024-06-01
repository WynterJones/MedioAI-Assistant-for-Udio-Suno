/*
 * © MedioAI.com - Wynter Jones (@AI.MASSIVE)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const songStudioMedioAI = {
  isOpen: false,

  init: async () => {
    const modal = document.createElement('div')
    modal.id = 'medioAI-songstudio'
    const animate = await utilitiesMedioAI.getSettings('slideanimation')
    if (animate === 'on') {
      modal.style.transition = 'transform 0.3s'
    }
    modal.innerHTML = await uiMedioAI.songStudio()
    document.body.appendChild(modal)

    songStudioMedioAI.load(() => {
      utilitiesMedioAI.quill()
      songStudioMedioAI.events()
      songStudioMedioAI.tabs()
    })

    songStudioMedioAI.spaceKeyDown = event => {
      if (songStudioMedioAI.isOpen && event.code === 'Space') {
        const tagName = event.target.tagName.toLowerCase()
        if (tagName !== 'input' && tagName !== 'textarea') {
          event.preventDefault()
          event.stopImmediatePropagation()
          event.stopPropagation()

          const range = utilitiesMedioAI.quill.getSelection()
          if (range) {
            utilitiesMedioAI.quill.insertText(range.index, ' ')
            utilitiesMedioAI.quill.setSelection(range.index + 1)
          }
        }
      }
    }
    window.addEventListener('keydown', songStudioMedioAI.spaceKeyDown)

    songStudioMedioAI.playlist()
    songStudioMedioAI.appButtons()
    setTimeout(() => {
      songStudioMedioAI.seedBox()
    }, 2000)

    const keepAdvancedSettings = await utilitiesMedioAI.getSettings('keepAdvancedSettings')
    if (keepAdvancedSettings === 'on') {
      setTimeout(() => {
        songStudioMedioAI.keepAdvancedSettings()
      }, 2000)
    }
  },

  load: callback => {
    const commandsJson = chrome.runtime.getURL('database/songstudio/commands.json')
    const extrasJson = chrome.runtime.getURL('database/songstudio/extras.json')
    const structuresJson = chrome.runtime.getURL('database/songstudio/structures.json')
    const instrumentsJson = chrome.runtime.getURL('database/songstudio/instruments.json')

    const commandsPromise = utilitiesMedioAI.populateSelect(commandsJson, 'medioaiCommands', 'Command')
    const extrasPromise = utilitiesMedioAI.populateSelect(extrasJson, 'medioextraCommands', 'Extra')
    const structurePromise = utilitiesMedioAI.populateSelect(structuresJson, 'medioaiStructures', 'Structure')
    const instrumentsPromise = utilitiesMedioAI.populateSelect(
      instrumentsJson,
      'medioaiInstruments',
      'Instrument'
    )

    Promise.all([commandsPromise, extrasPromise, structurePromise, instrumentsPromise]).then(() => {
      callback()
    })
  },

  events: () => {
    const close = document.getElementById('close-medioai')
    close.addEventListener('click', () => {
      songStudioMedioAI.close()
    })

    const findRhymes = document.getElementById('medioai-findRhyme')
    findRhymes.addEventListener('click', () => {
      apiMedioAI.checkRhymes()
    })

    const findRhymesClear = document.getElementById('medioai-findRhymeClear')
    findRhymesClear.addEventListener('click', () => {
      document.getElementById('wordInput').value = ''
      document.getElementById('results').innerHTML = ''
      document.getElementById('results').style.display = 'none'
      document.getElementById('medioRhymeExplainer').style.display = 'block'
    })

    const wordInput = document.getElementById('wordInput')
    wordInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        apiMedioAI.checkRhymes()
      }
    })

    const saveLyrics = document.getElementById('save-lyrics')
    saveLyrics.addEventListener('click', () => {
      saveLyrics.querySelector('span').innerHTML = 'Saving...'
      saveLyrics.disabled = true
      songStudioMedioAI.save()
    })

    const clearLyrics = document.getElementById('clear-lyrics')
    clearLyrics.addEventListener('click', e => {
      songStudioMedioAI.clear(e)
    })

    const allPremadeQuestions = document.querySelectorAll('.medioAskAIPremadeQuestion')
    allPremadeQuestions.forEach(question => {
      question.addEventListener('click', e => {
        const text = e.target.innerText
        const askInput = document.getElementById('medioaskai')
        askInput.value = text
      })
    })

    const medioaiSendMessage = document.getElementById('medioaiSendMessage')
    medioaiSendMessage.addEventListener('click', async () => {
      const key = document.querySelector('#medioaichat').getAttribute('data-key')
      await apiMedioAI.sendMessage(key)
    })

    const medioaiSendMessageBox = document.getElementById('medioaiMessageBox')
    medioaiSendMessageBox.addEventListener('keydown', async e => {
      if (e.key === 'Enter') {
        const key = document.querySelector('#medioaichat').getAttribute('data-key')
        await apiMedioAI.sendMessage(key)
      }
    })

    const viewpastChats = document.getElementById('medioAskChatList')
    viewpastChats.addEventListener('click', async e => {
      document.querySelector('#medioask').style.display = 'none'
      document.querySelector('#mediochats').style.display = 'block'
      paginationMedioAI.init('medioaiChats', 'mediochats', item => {
        if (item) {
          document.querySelector('#mediochattab').style.display = 'block'
          document.querySelector('#mediochats').style.display = 'none'
          document.querySelector('#medioaichat').innerHTML = ''
          document.querySelector('#medioaichat').setAttribute('data-id', item.id)
          document.querySelector('#medioaichat').setAttribute('data-key', 'medioaiChats')
          item.messages.forEach((message, index) => {
            if (!index) return

            const newMessage = document.createElement('div')
            newMessage.classList.add('medioaimessage')
            newMessage.classList.add(`medioai${message.role}`)
            newMessage.innerHTML = message.content
            document.querySelector('#medioaichat').append(newMessage)
          })
        }
      })
    })

    const askAIQuestion = document.getElementById('medioAskAIQuestion')
    askAIQuestion.addEventListener('click', async e => {
      document.querySelector('#medioaichat').setAttribute('data-key', 'medioaiChats')
      apiMedioAI.askQuestion()
    })

    document.addEventListener('keydown', e => {
      utilitiesMedioAI.setHotKeys(e)
    })

    const openStudio = document.getElementById('medioai-link')
    openStudio.addEventListener('click', e => {
      songStudioMedioAI.open(e)
    })

    const medioWriteSong = document.getElementById('medioWriteSong')
    medioWriteSong.addEventListener('click', e => {
      document.querySelector('#mediowizard').style.display = 'none'
      document.querySelector('#mediochattab').style.display = 'block'
      document.querySelector('#medioaichat').innerHTML = ''
      document.querySelector('#medioaichat').setAttribute('data-key', 'medioaiSongChats')
      apiMedioAI.writeSong(e)
    })

    const medioSongRollDice = document.getElementById('medioSongRollDice')
    medioSongRollDice.addEventListener('click', e => {
      if (medioSongRollDice.classList.contains('disabled')) return
      medioSongRollDice.classList.add('disabled')
      medioSongRollDice.querySelector('span').innerHTML = 'Generating...'
      apiMedioAI.randomSong(e)
    })

    const medioSongClear = document.getElementById('medioSongClear')
    medioSongClear.addEventListener('click', e => {
      if (medioSongClear.classList.contains('confirmClear')) {
        document.getElementById('mediowriterSongTitle').value = ''
        document.getElementById('mediowriterTags').value = ''
        document.getElementById('mediowriterEmotion').value = ''
        document.getElementById('mediowriterTheme').value = ''
        document.getElementById('mediowriterStructure').value = 'standard'
        utilitiesMedioAI.showNotification('Cleared.')
        medioSongClear.classList.remove('confirmClear')
      } else {
        medioSongClear.classList.add('confirmClear')
        setTimeout(() => {
          medioSongClear.classList.remove('confirmClear')
        }, 3000)
      }
    })

    const medioSongChatList = document.getElementById('medioSongChatList')
    medioSongChatList.addEventListener('click', e => {
      document.querySelector('#mediowizard').style.display = 'none'
      document.querySelector('#mediochats').style.display = 'block'

      paginationMedioAI.init('medioaiSongChats', 'mediochats', item => {
        if (item) {
          document.querySelector('#mediochattab').style.display = 'block'
          document.querySelector('#mediochats').style.display = 'none'
          document.querySelector('#medioaichat').innerHTML = ''
          document.querySelector('#medioaichat').setAttribute('data-id', item.id)
          document.querySelector('#medioaichat').setAttribute('data-key', 'medioaiSongChats')
          item.messages.forEach((message, index) => {
            if (!index) return

            const newMessage = document.createElement('div')
            newMessage.classList.add('medioaimessage')
            newMessage.classList.add(`medioai${message.role}`)
            newMessage.innerHTML = message.content
            document.querySelector('#medioaichat').append(newMessage)
          })
        }
      })
    })
  },

  open: e => {
    e.preventDefault()
    songStudioMedioAI.isOpen = true

    if (!document.getElementById('medioAI-songstudio')) {
      document.body.style.overflow = 'auto'
    } else {
      document.body.style.overflow = 'hidden'
      const songstudio = document.getElementById('medioAI-songstudio')
      songstudio.style.transform = 'translateX(0)'

      const savedButton = document.querySelector('.lyric-tab-button[data-tab="library"]')
      if (savedButton.classList.contains('bg-black')) {
        savedButton.click()
      }
    }
  },

  close: () => {
    const modal = document.getElementById('medioAI-songstudio')
    modal.style.transform = 'translateX(-100%)'
    document.body.style.overflow = 'auto'
    songStudioMedioAI.isOpen = false
  },

  clear: e => {
    if (e.target.classList.contains('confirmClear')) {
      document.getElementById('lyric-id').value = ''
      document.getElementById('lyric-title').value = ''
      utilitiesMedioAI.quill.root.innerHTML = ''
      utilitiesMedioAI.showNotification('Song lyrics cleared.')
      e.target.classList.remove('confirmClear')
    } else {
      e.target.classList.add('confirmClear')
      setTimeout(() => {
        e.target.classList.remove('confirmClear')
      }, 3000)
    }
  },

  save: () => {
    const title = document.getElementById('lyric-title').value
    const id = document.getElementById('lyric-id').value
    const saveLyrics = document.getElementById('save-lyrics')

    if (!id) {
      const lyrics = {
        title: title || 'Untitled',
        content: utilitiesMedioAI.quill.root.innerHTML,
        id: utilitiesMedioAI.uuidv4(),
        created_at: new Date().toISOString(),
      }
      chrome.storage.local.get(['medioLyrics'], function (result) {
        const medioLyrics = result.medioLyrics || []
        medioLyrics.unshift(lyrics)
        document.getElementById('lyric-id').value = lyrics.id
        chrome.storage.local.set({ medioLyrics }, function () {
          utilitiesMedioAI.showNotification('Added new song to your library.')
          saveLyrics.querySelector('span').innerHTML = 'Save'
          saveLyrics.disabled = false
        })
      })
    } else {
      chrome.storage.local.get(['medioLyrics'], function (result) {
        const medioLyrics = result.medioLyrics || []
        const lyrics = medioLyrics.find(lyric => lyric.id === id)
        lyrics.title = title || 'Untitled'
        lyrics.content = utilitiesMedioAI.quill.root.innerHTML

        chrome.storage.local.set({ medioLyrics }, function () {
          utilitiesMedioAI.showNotification('Updated song lyrics.')
          saveLyrics.querySelector('span').innerHTML = 'Save'
          saveLyrics.disabled = false
        })
      })
    }
  },

  tabs: () => {
    const tabButtons = document.querySelectorAll('.lyric-tab-button')

    tabButtons.forEach(button => {
      button.addEventListener('click', async e => {
        const tab = e.target.dataset.tab
        const tabs = document.querySelectorAll('.lyric-tab')

        const className =
          'lyric-tab-button inline-flex items-center justify-center whitespace-nowrap rounded-sm py-1.5 text-sm font-medium ring-offset-background transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 px-3'

        tabButtons.forEach(button => {
          button.setAttribute('class', className)
        })

        document.getElementById('medioCharactersSelected').style.display = 'none'
        e.target.setAttribute('class', className + ' bg-black')

        tabs.forEach(tab => {
          tab.style.display = 'none'
        })

        const selectedTab = document.querySelector(`.lyric-tab[data-tab=${tab}]`)
        selectedTab.style.display = 'block'
        document.querySelector('#mediochattab').style.display = 'none'
        document.querySelector('#mediochats').style.display = 'none'

        if (tab === 'rhyme') {
          document.getElementById('wordInput').focus()
          document.getElementById('wordInput').select()
        } else if (tab === 'ask') {
          const openaikey = await utilitiesMedioAI.getSettings('openaikey')

          if (openaikey) {
            document.querySelector('#medioapiExplainerask').style.display = 'none'
            document.querySelector('#medioask').style.display = 'block'
            document.querySelector('[data-tab="ask"]').style.display = 'block'
          } else {
            document.querySelector('#medioapiExplainerask').style.display = 'block'
            document.querySelector('#medioask').style.display = 'none'
          }
        } else if (tab === 'wizard') {
          const openaikey = await utilitiesMedioAI.getSettings('openaikey')

          if (openaikey) {
            document.querySelector('#medioapiExplainerwizard').style.display = 'none'
            document.querySelector('[data-tab="wizard"]').style.display = 'block'
            document.querySelector('#mediowizard').style.display = 'block'
          } else {
            document.querySelector('#medioapiExplainerwizard').style.display = 'block'
            document.querySelector('#mediowizard').style.display = 'none'
          }
        } else if (tab === 'library') {
          paginationMedioAI.init('medioLyrics', 'medio-library-items', item => {
            if (item) {
              document.getElementById('lyric-id').value = item.id
              document.getElementById('lyric-title').value = item.title
              utilitiesMedioAI.quill.root.innerHTML = item.content

              const firstTab = document.querySelector('.lyric-tab-button')
              firstTab.click()
              utilitiesMedioAI.showNotification(`Opened Song: "${item.title}"`)
            }
          })
        }
      })
    })
  },

  appButtons: () => {
    const medioaiSettings = document.getElementById('medioaiSettings')
    medioaiSettings.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'appButtons' })
    })

    const medioaiTools = document.getElementById('medioaiTools')
    medioaiTools.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'openApp' })
    })

    const medioaiChallenge = document.getElementById('medioaiChallenge')
    medioaiChallenge.addEventListener('click', () => {
      songStudioMedioAI.challenge()
    })
  },

  challenge: async () => {
    const modal = document.createElement('div')
    modal.id = 'medioAI-challenge'
    modal.innerHTML = `<div id="medioAI-challenge" class="fixed inset-0 bg-black">
      <button id="medioAI-challenge-close" class="absolute top-4 right-4 text-white">&times;</button>
      <button id="medioAI-challenge-generate" class="bg-black text-white px-4 py-2 rounded-md mb-8 border rounded">Regenerate</button>
      <h4 class="text-lg text-gray-400 mb-2 text-center">Write a song about...</h4>
      <h2 class="text-2xl text-center">${await songStudioMedioAI.newChallenge()}</h2>
    </div>`
    document.body.appendChild(modal)

    const close = document.getElementById('medioAI-challenge-close')
    close.addEventListener('click', () => {
      modal.remove()
    })

    const generate = document.getElementById('medioAI-challenge-generate')
    generate.addEventListener('click', async () => {
      document.querySelector('#medioAI-challenge h2').innerHTML = await songStudioMedioAI.newChallenge()
    })
  },

  newChallenge: async () => {
    const json = chrome.runtime.getURL('database/songstudio/challenges.json')

    const current = await fetch(json)
      .then(response => response.json())
      .then(data => {
        return data
      })

    return current[Math.floor(Math.random() * current.length)]
  },

  playlist: () => {
    const callback = function (mutationsList, observer) {
      const element = document.querySelector(
        'aside nav [dir="ltr"].relative.overflow-hidden.flex.w-full.flex-col'
      )

      if (element) {
        element.style.maxHeight = 'calc(-630px + 100vh)'

        const buttons = document.querySelectorAll('aside nav button')

        const othersPlaylistButton = Array.from(buttons).find(
          button => button.textContent.trim() === 'By others'
        )
        const yourPlaylistButton = Array.from(buttons).find(button => button.textContent.trim() === 'By you')

        if (othersPlaylistButton) {
          othersPlaylistButton.addEventListener('click', () => {
            const element = document.querySelector(
              'aside nav [dir="ltr"].relative.overflow-hidden.flex.w-full.flex-col'
            )
            element.style.maxHeight = 'calc(-630px + 100vh)'
          })

          yourPlaylistButton.addEventListener('click', () => {
            const element = document.querySelector(
              'aside nav [dir="ltr"].relative.overflow-hidden.flex.w-full.flex-col'
            )
            element.style.maxHeight = 'calc(-630px + 100vh)'
          })
          const button = document.createElement('button')
          button.innerHTML = iconsMedioAI.expand
          button.setAttribute(
            'class',
            'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 font-medium ring-offset-background transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-xs sm:text-base'
          )

          button.addEventListener('click', () => {
            const overlay = document.createElement('div')
            overlay.id = 'medioaiPLaylistOverlay'
            overlay.style.position = 'fixed'
            overlay.style.top = '0'
            overlay.style.left = '0'
            overlay.style.width = '100%'
            overlay.style.height = '100%'
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
            overlay.style.zIndex = '99999999999'

            const modal = document.createElement('div')
            modal.style.position = 'absolute'
            modal.style.top = '50%'
            modal.style.left = '50%'
            modal.style.transform = 'translate(-50%, -50%)'
            modal.style.width = '40%'
            modal.style.height = '100%'
            modal.style.backgroundColor = '#000'
            modal.style.padding = '20px'
            modal.style.borderRadius = '20px'
            modal.style.boxShadow = '20px 20px 60px #000, -20px -20px 60px #000'
            modal.innerHTML = `<button id='medioaiClosePlaylist' style="
                position: absolute;
                top: 16px;
                right: 16px;
                background: none;
                border: none;
                color: #fff;
                font-size: 34px;
                cursor: pointer;
                background: #000;
                border-radius: 100%;
                padding: 6px 12px;
                z-index: 99999999999;
              ">
                &times;
              </button>`

            const medioaiClosePlaylist = modal.querySelector('#medioaiClosePlaylist')
            medioaiClosePlaylist.addEventListener('click', () => {
              overlay.remove()
            })

            window.addEventListener('keydown', e => {
              const overlay = document.getElementById('medioaiPLaylistOverlay')
              if (e.key === 'Escape' && overlay) {
                overlay.remove()
              }
            })

            const copiedPlaylist = button.closest('[data-orientation="horizontal"].mt-4').cloneNode(true)
            const sidebarPlaylist = copiedPlaylist.querySelector(
              '[dir="ltr"].relative.overflow-hidden.flex.w-full.flex-col'
            )
            sidebarPlaylist.style.maxHeight = 'calc(100vh - 40px)'
            sidebarPlaylist.style.overflow = 'visible'
            copiedPlaylist.querySelector('[role="tablist"]').remove()

            modal.appendChild(copiedPlaylist)
            overlay.appendChild(modal)
            document.body.appendChild(overlay)
          })

          othersPlaylistButton.after(button)
        }

        observer.disconnect()
      }
    }

    const observer = new MutationObserver(callback)
    observer.observe(document, { childList: true, subtree: true })
  },

  keepAdvancedSettings: () => {
    const buttons = document.querySelectorAll('button')
    buttons.forEach(button => {
      if (button.textContent === 'Advanced Features') {
        button.addEventListener('click', () => {
          setTimeout(() => {
            songStudioMedioAI.applyAdvancedSettings(button)
          }, 200)
        })
      } else if (
        button.textContent === 'Create' ||
        button.textContent === 'Extend' ||
        button.textContent === 'Remix'
      ) {
        button.addEventListener('click', () => {
          const buttons = document.querySelectorAll('button')
          buttons.forEach(button => {
            if (button.textContent === 'Advanced Features') {
              const wrapper = button.closest('h3').nextElementSibling
              const allInputs = wrapper.querySelectorAll('input')
              if (!allInputs[0]) return

              songStudioMedioAI.setAdvancedSettings({ seed: allInputs[0].value, quality: allInputs[1].value })
            }
          })
        })
      }
    })
  },

  applyAdvancedSettings: async button => {
    const wrapper = button.closest('h3').nextElementSibling
    if (!wrapper) return

    const allInputs = wrapper.querySelectorAll('input')
    const settings = await songStudioMedioAI.getAdvancedSettings()

    if (settings.seed === undefined) {
      settings.seed = -1
      settings.quality = 0.5
    }

    if (!allInputs[0]) return

    allInputs[0].value = settings.seed
    allInputs[1].value = settings.quality

    function adjustQualitySlider(percentage) {
      const slider = document.querySelector('.MuiSlider-root .MuiSlider-rail')
      if (!slider) return

      const sliderRect = slider.getBoundingClientRect()
      const clickX = sliderRect.left + percentage * sliderRect.width - 100
      const clickY = sliderRect.top + sliderRect.height / 2
      songStudioMedioAI.simulateMouseClick(slider, clickX, clickY)
    }

    songStudioMedioAI.simulateMouseClick(allInputs[0])
    adjustQualitySlider(settings.quality)
  },

  simulateMouseClick(element, clickX, clickY) {
    const mouseClickEvents = ['mousedown', 'click', 'mouseup', 'change', 'input']
    mouseClickEvents.forEach(mouseEventType => {
      const event = {
        view: window,
        bubbles: true,
        cancelable: true,
        buttons: 1,
      }
      if (clickX && clickY) {
        event.clientX = clickX
        event.clientY = clickY
      }
      element.dispatchEvent(new MouseEvent(mouseEventType, event))
    })
  },

  getAdvancedSettings: () => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['medioAIAdvancedSettings'], function (result) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
        } else {
          resolve(result.medioAIAdvancedSettings)
        }
      })
    })
  },

  setAdvancedSettings: settings => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ medioAIAdvancedSettings: settings }, function () {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
        } else {
          resolve()
        }
      })
    })
  },

  seedBox: () => {
    let buttons = document.querySelectorAll('button[type="button"]')
    buttons.forEach(button => {
      if (button.textContent === 'Advanced Features') {
        button.addEventListener('click', () => {
          setTimeout(() => {
            songStudioMedioAI.appendSeedBox(button)
          }, 200)
        })
      }
    })
  },

  appendSeedBox: button => {
    const wrapper = button.closest('h3').nextElementSibling
    if (!wrapper) return

    const allInputs = wrapper.querySelectorAll('input')
    const seedInput = allInputs[0]
    const inputWrapper = seedInput.closest('div.relative.flex.h-full.w-full.flex-col')
    if (!inputWrapper) return

    const seedBox = document.createElement('div')
    seedBox.innerHTML = `<div class="absolute top-4 right-3 flex items-center justify-center text-white text-xs font-medium rounded-r-md">
      <button id="medioAIEditSeeds" class="rounded border text-sm text-sm p-2 mr-1">${iconsMedioAI.edit}</button>
      <button id="medioAISaveSeed" class="rounded border text-sm text-sm p-2 mr-1">${iconsMedioAI.save}</button>
      <button id="medioAIRandomSeed" class="rounded border text-sm text-sm p-2 mr-1">${iconsMedioAI.dice}</button>
      <select id="medioAISeedbank" class="rounded border text-sm p-1 w-full" style="width: 120px"></select>
    </div>`
    inputWrapper.appendChild(seedBox)

    const medioAIRandomSeed = document.getElementById('medioAIRandomSeed')
    medioAIRandomSeed.addEventListener('click', () => {
      seedInput.value = Math.floor(Math.random() * 9999999999999) + 1
      songStudioMedioAI.simulateMouseClick(seedInput)
    })

    const medioAISeedbank = document.getElementById('medioAISeedbank')
    medioAISeedbank.addEventListener('change', () => {
      seedInput.value = medioAISeedbank.value
      songStudioMedioAI.simulateMouseClick(seedInput)
      medioAISeedbank.value = ''
    })

    function populateOptions() {
      chrome.storage.local.get(['medioAISeeds'], function (result) {
        const seeds = result.medioAISeeds || []
        medioAISeedbank.innerHTML = ''
        seeds.forEach(seed => {
          let label = seed.label
          if (label !== seed.value) {
            label = `${seed.label} - ${seed.value}`
          }
          const option = document.createElement('option')
          option.value = seed.value
          option.innerHTML = label
          medioAISeedbank.appendChild(option)
        })
      })
    }
    populateOptions()

    const medioAISaveSeed = document.getElementById('medioAISaveSeed')
    medioAISaveSeed.addEventListener('click', () => {
      const seed = seedInput.value
      chrome.storage.local.get(['medioAISeeds'], function (result) {
        const seeds = result.medioAISeeds || []
        seeds.push({
          value: seed,
          label: seed,
        })
        chrome.storage.local.set({ medioAISeeds: seeds }, function () {
          utilitiesMedioAI.showNotification('Seed saved.')
          populateOptions()
        })
      })
    })

    const medioAIEditSeeds = document.getElementById('medioAIEditSeeds')
    medioAIEditSeeds.addEventListener('click', () => {
      chrome.storage.local.get(['medioAISeeds'], function (result) {
        const seeds = result.medioAISeeds || []
        const modal = document.createElement('div')
        modal.id = 'medioAISeedOverlay'
        modal.innerHTML = `<div id="medioAISeedModal" class="fixed inset-0 bg-black text-white">
          <h2 class="text-xl font-bold  mb-4">Manage Your Seedbank</h2>
          <ul id="medioAISeedList" class="list-disc"></ul>

          <button id="medioAISeedModalClose" style="font-size: 32px" class="absolute top-4 right-4 text-white">&times;</button>
        </div>`

        const medioAISeedModalClose = modal.querySelector('#medioAISeedModalClose')
        medioAISeedModalClose.addEventListener('click', () => {
          populateOptions()
          modal.remove()
        })

        function loadSeedList() {
          const medioAISeedList = modal.querySelector('#medioAISeedList')
          seeds.forEach((seed, index) => {
            const listItem = document.createElement('li')
            let label = seed.label
            if (label === seed.value) {
              label = ''
            }
            listItem.innerHTML = `<div data-index="${index}" class="medioaiSeedItem flex space-x-2 mb-1">
            <div class="w-1/2">
              <input type="text" value="${label}" placeholder="Label" class="medioaiInputSeedLabel w-full px-2 py-1 border rounded" />
            </div>
            <div class="w-1/2 flex space-x-2">
              <input type="text" value="${seed.value}" placeholder="Seed Number" class="medioaiInputSeedNumber w-full px-2 py-1 border rounded" />
              <button class="medioaiRemoveSeed rounded border text-sm text-sm p-2">${iconsMedioAI.trash}</button>
            </div>
          </div>`
            medioAISeedList.appendChild(listItem)
          })
        }

        loadSeedList()

        const medioaiInputSeedLabel = modal.querySelectorAll('.medioaiInputSeedLabel')
        medioaiInputSeedLabel.forEach(input => {
          input.addEventListener('change', e => {
            const index = e.target.closest('.medioaiSeedItem').dataset.index
            seeds[index].label = e.target.value

            chrome.storage.local.set({ medioAISeeds: seeds }, function () {
              utilitiesMedioAI.showNotification('Seed updated.')
            })
          })
        })

        const medioaiInputSeedNumber = modal.querySelectorAll('.medioaiInputSeedNumber')
        medioaiInputSeedNumber.forEach(input => {
          input.addEventListener('change', e => {
            const index = e.target.closest('.medioaiSeedItem').dataset.index
            seeds[index].value = e.target.value

            chrome.storage.local.set({ medioAISeeds: seeds }, function () {
              utilitiesMedioAI.showNotification('Seed updated.')
            })
          })
        })

        const medioaiRemoveSeed = modal.querySelectorAll('.medioaiRemoveSeed')
        medioaiRemoveSeed.forEach(button => {
          button.addEventListener('click', e => {
            const index = e.target.closest('.medioaiSeedItem').dataset.index
            seeds.splice(index, 1)
            chrome.storage.local.set({ medioAISeeds: seeds }, function () {
              populateOptions()
              medioAISeedList.innerHTML = ''
              loadSeedList()
              utilitiesMedioAI.showNotification('Seed removed.')
            })
          })
        })

        document.body.appendChild(modal)
      })
    })
  },
}
