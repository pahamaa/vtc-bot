import { chromium } from 'playwright'
import 'dotenv/config'
import fs from 'fs'

const BASE_URL = 'https://www.vends-ta-culotte.com/'
const BIRTH_YEAR = process.env.BIRTH_YEAR || '1980'

const DEBUG_BOT = process.env.DEBUG_BOT === '1'

const wait = ms => new Promise(r => setTimeout(r, ms))

const randomBetweenMinutes = (min, max) => {
  const value = Math.floor(Math.random() * (max - min + 1) + min)
  console.log(`[~] Pause aléatoire : ${value} minutes`)
  return value * 60 * 1000
}

const accounts = [
  { username: process.env.USER1_EMAIL, password: process.env.USER1_PASSWORD },
  { username: process.env.USER2_EMAIL, password: process.env.USER2_PASSWORD }
].filter(a => a.username && a.password)

if (!accounts.length) {
  throw new Error('Aucun compte trouvé. Vérifie USER1_EMAIL / USER1_PASSWORD dans Railway.')
}

async function safeGoto(page, url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[~] Navigation vers ${url}`)
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 45000
      })
      await wait(2000)
      return true
    } catch (err) {
      console.warn(`[!] Échec navigation tentative ${i + 1}/${retries} : ${err.message}`)
      await wait(4000)
    }
  }

  throw new Error('Échec navigation après plusieurs tentatives.')
}

async function debugPage(page, label) {
  console.log(`\n========== DEBUG ${label} ==========`)
  console.log(`[URL] ${page.url()}`)

  try {
    const title = await page.title()
    console.log(`[TITLE] ${title}`)
  } catch {}

  try {
    const bodyText = await page.locator('body').innerText({ timeout: 5000 })
    console.log('[BODY TEXT]')
    console.log(bodyText.replace(/\s+/g, ' ').slice(0, 1800))
  } catch {
    console.log('[!] Impossible de lire le texte de la page.')
  }

  if (DEBUG_BOT) {
    try {
      const path = `/tmp/debug-${label}-${Date.now()}.png`
      await page.screenshot({ path, fullPage: true })
      console.log(`[+] Screenshot debug créé : ${path}`)
    } catch {
      console.log('[!] Screenshot impossible.')
    }
  }

  console.log('====================================\n')
}

async function visible(locator, timeout = 1500) {
  try {
    await locator.first().waitFor({ state: 'visible', timeout })
    return true
  } catch {
    return false
  }
}

async function clickAny(page, label, candidates, timeout = 3000) {
  for (const makeLocator of candidates) {
    try {
      const locator = makeLocator(page).first()
      await locator.waitFor({ state: 'visible', timeout })
      await locator.scrollIntoViewIfNeeded().catch(() => {})
      await locator.click({ timeout })
      console.log(`[✓] ${label} cliqué.`)
      await wait(1500)
      return true
    } catch {}
  }

  console.log(`[~] ${label} introuvable avec les sélecteurs classiques.`)
  return false
}

async function clickByVisibleTextJS(page, label, possibleTexts) {
  try {
    const result = await page.evaluate((texts) => {
      const normalize = str => String(str || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()

      const wanted = texts.map(normalize)

      const isVisible = el => {
        const style = window.getComputedStyle(el)
        const rect = el.getBoundingClientRect()

        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          rect.width > 0 &&
          rect.height > 0
        )
      }

      const candidates = Array.from(document.querySelectorAll(
        'button, a, input[type="button"], input[type="submit"], [role="button"], label'
      ))

      for (const el of candidates) {
        const text = normalize(
          el.innerText ||
          el.textContent ||
          el.value ||
          el.getAttribute('aria-label') ||
          ''
        )

        if (!isVisible(el)) continue

        const match = wanted.some(w => text.includes(w))

        if (match) {
          el.scrollIntoView({ block: 'center', inline: 'center' })
          el.click()

          return {
            clicked: true,
            tag: el.tagName,
            text: text
          }
        }
      }

      return { clicked: false }
    }, possibleTexts)

    if (result.clicked) {
      console.log(`[✓] ${label} cliqué via fallback JS. Élément : ${result.tag} / ${result.text}`)
      await wait(1500)
      return true
    }

    console.log(`[~] ${label} introuvable même avec fallback JS.`)
    return false
  } catch (err) {
    console.warn(`[!] Fallback JS impossible pour ${label} : ${err.message}`)
    return false
  }
}

async function acceptCookiesIfPresent(page) {
  await clickAny(page, 'Cookies', [
    p => p.getByRole('button', { name: /accepter|j.accepte|tout accepter|ok/i }),
    p => p.locator('button:has-text("Accepter")'),
    p => p.locator('button:has-text("Tout accepter")'),
    p => p.locator('button:has-text("OK")'),
    p => p.locator('input[type="submit"][value*="Accepter"]')
  ], 1200).catch(() => {})
}

async function selectBirthYearIfPresent(page) {
  const selects = page.locator('select')
  const count = await selects.count().catch(() => 0)

  if (!count) {
    console.log('[~] Aucun champ année trouvé.')
    return false
  }

  for (let i = 0; i < count; i++) {
    const select = selects.nth(i)

    try {
      if (!(await select.isVisible())) continue

      const selected = await select.evaluate((el, desiredYear) => {
        const options = Array.from(el.options || [])

        const target =
          options.find(o => o.value === desiredYear) ||
          options.find(o => String(o.textContent || '').trim() === desiredYear) ||
          options.find(o => /19[0-9]{2}/.test(o.value) || /19[0-9]{2}/.test(o.textContent || '')) ||
          options.find(o => /2000/.test(o.value) || /2000/.test(o.textContent || ''))

        if (!target) return false

        el.value = target.value
        el.dispatchEvent(new Event('input', { bubbles: true }))
        el.dispatchEvent(new Event('change', { bubbles: true }))

        return true
      }, BIRTH_YEAR)

      if (selected) {
        console.log(`[✓] Année sélectionnée : ${BIRTH_YEAR}`)
        await wait(500)
        return true
      }
    } catch {}
  }

  console.log('[~] Champ année trouvé, mais impossible de sélectionner une année.')
  return false
}

async function passAgeGate(page) {
  console.log('[~] Vérification de la page adulte / age gate...')

  await acceptCookiesIfPresent(page)
  await selectBirthYearIfPresent(page)

  let clicked = await clickAny(page, 'Bouton Entrer', [
    p => p.getByRole('button', { name: /^entrer$/i }),
    p => p.getByText(/^entrer$/i),
    p => p.locator('button:has-text("Entrer")'),
    p => p.locator('a:has-text("Entrer")'),
    p => p.locator('input[type="submit"][value="Entrer"]'),
    p => p.locator('input[type="button"][value="Entrer"]'),
    p => p.locator('[role="button"]:has-text("Entrer")')
  ], 2500)

  if (!clicked) {
    clicked = await clickByVisibleTextJS(page, 'Bouton Entrer', ['Entrer'])
  }

  if (clicked) {
    console.log('[✓] Age gate passé ou tentative effectuée.')
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {})
    await wait(2500)
  } else {
    console.log('[~] Pas de bouton Entrer visible. Peut-être déjà passé.')
  }

  await acceptCookiesIfPresent(page)
}

async function hasLoginFields(page) {
  const emailField = page.locator(
    'input[type="email"], input[name*="email" i], input[name*="login" i], input[name*="pseudo" i], input[name*="username" i], input[placeholder*="email" i], input[placeholder*="pseudo" i]'
  )

  const passwordField = page.locator(
    'input[type="password"], input[name*="password" i], input[name*="pass" i], input[placeholder*="passe" i], input[placeholder*="password" i]'
  )

  return (await visible(emailField, 1000)) && (await visible(passwordField, 1000))
}

async function isLoggedIn(page) {
  const logoutVisible = await visible(page.getByText(/déconnexion|deconnexion|se déconnecter|se deconnecter/i), 1500)
  if (logoutVisible) return true

  const body = await page.locator('body').innerText({ timeout: 3000 }).catch(() => '')
  return /déconnexion|deconnexion|mon compte|profil/i.test(body)
}

async function openLogin(page) {
  console.log('[~] Recherche de la zone connexion...')

  if (await hasLoginFields(page)) {
    console.log('[✓] Les champs de connexion sont déjà visibles.')
    return true
  }

  let clicked = await clickAny(page, 'Déjà membre / Connexion', [
    p => p.getByRole('button', { name: /déjà membre|deja membre|connexion|se connecter|login/i }),
    p => p.getByRole('link', { name: /déjà membre|deja membre|connexion|se connecter|login/i }),
    p => p.getByText(/déjà membre|deja membre|connexion|se connecter|login/i),
    p => p.locator('button:has-text("Déjà membre")'),
    p => p.locator('a:has-text("Déjà membre")'),
    p => p.locator('button:has-text("Connexion")'),
    p => p.locator('a:has-text("Connexion")'),
    p => p.locator('button:has-text("Se connecter")'),
    p => p.locator('a:has-text("Se connecter")'),
    p => p.locator('a[href*="login" i]'),
    p => p.locator('a[href*="connexion" i]'),
    p => p.locator('a[href*="compte" i]')
  ], 4000)

  if (!clicked) {
    clicked = await clickByVisibleTextJS(page, 'Déjà membre / Connexion', [
      'Déjà membre',
      'Deja membre',
      'Connexion',
      'Se connecter',
      'Login',
      'Mon compte'
    ])
  }

  if (clicked) {
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {})
    await wait(2500)
  }

  if (await hasLoginFields(page)) {
    console.log('[✓] Formulaire de connexion trouvé.')
    return true
  }

  console.warn('[!] Formulaire de connexion introuvable après clic.')
  await debugPage(page, 'login-introuvable')
  return false
}

async function fillLogin(page, account) {
  console.log('[~] Remplissage du formulaire...')

  const emailField = page.locator(
    'input[type="email"], input[name*="email" i], input[name*="login" i], input[name*="pseudo" i], input[name*="username" i], input[placeholder*="email" i], input[placeholder*="pseudo" i]'
  ).first()

  const passwordField = page.locator(
    'input[type="password"], input[name*="password" i], input[name*="pass" i], input[placeholder*="passe" i], input[placeholder*="password" i]'
  ).first()

  try {
    await emailField.waitFor({ state: 'visible', timeout: 8000 })
    await emailField.fill(account.username)
  } catch {
    throw new Error('Champ email / pseudo introuvable.')
  }

  try {
    await passwordField.waitFor({ state: 'visible', timeout: 8000 })
    await passwordField.fill(account.password)
  } catch {
    throw new Error('Champ mot de passe introuvable.')
  }

  let submitted = await clickAny(page, 'Bouton validation connexion', [
    p => p.getByRole('button', { name: /continuer|connexion|se connecter|valider|entrer/i }),
    p => p.locator('button:has-text("Continuer")'),
    p => p.locator('button:has-text("Connexion")'),
    p => p.locator('button:has-text("Se connecter")'),
    p => p.locator('button:has-text("Valider")'),
    p => p.locator('input[type="submit"]'),
    p => p.locator('[role="button"]:has-text("Continuer")')
  ], 4000)

  if (!submitted) {
    submitted = await clickByVisibleTextJS(page, 'Validation connexion', [
      'Continuer',
      'Connexion',
      'Se connecter',
      'Valider',
      'Entrer'
    ])
  }

  if (!submitted) {
    throw new Error('Bouton de validation connexion introuvable.')
  }

  await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {})
  await wait(4000)

  console.log('[✓] Formulaire envoyé.')
}

async function logout(page) {
  console.log('[+] Déconnexion...')

  await safeGoto(page, BASE_URL)
  await acceptCookiesIfPresent(page)

  let clicked = await clickAny(page, 'Déconnexion', [
    p => p.getByRole('button', { name: /déconnexion|deconnexion|se déconnecter|se deconnecter/i }),
    p => p.getByRole('link', { name: /déconnexion|deconnexion|se déconnecter|se deconnecter/i }),
    p => p.getByText(/déconnexion|deconnexion|se déconnecter|se deconnecter/i),
    p => p.locator('button:has-text("Déconnexion")'),
    p => p.locator('a:has-text("Déconnexion")'),
    p => p.locator('a[href*="logout" i]'),
    p => p.locator('a[href*="deconnexion" i]')
  ], 4000)

  if (!clicked) {
    clicked = await clickByVisibleTextJS(page, 'Déconnexion', [
      'Déconnexion',
      'Deconnexion',
      'Se déconnecter',
      'Se deconnecter'
    ])
  }

  if (clicked) {
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {})
    await wait(3000)
    console.log('[✓] Déconnecté ou tentative de déconnexion effectuée.')
  } else {
    console.warn('[~] Déconnexion introuvable. Peut-être déjà déconnecté.')
    await debugPage(page, 'deconnexion-introuvable')
  }
}

async function processAccount(account) {
  let browser
  let context
  let page

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    })

    context = await browser.newContext({
      locale: 'fr-FR',
      viewport: { width: 1365, height: 900 }
    })

    page = await context.newPage()

    console.log(`\n[+] Connexion avec ${account.username}...`)

    await safeGoto(page, BASE_URL)
    await debugPage(page, 'arrivee-site')

    await passAgeGate(page)
    await debugPage(page, 'apres-age-gate')

    if (await isLoggedIn(page)) {
      console.log('[~] Le compte semble déjà connecté.')
    } else {
      const loginOpened = await openLogin(page)

      if (!loginOpened) {
        console.warn(`[!] Impossible d’ouvrir la connexion pour ${account.username}. On saute ce compte.`)
        return
      }

      await fillLogin(page, account)
      await debugPage(page, 'apres-login')

      if (await isLoggedIn(page)) {
        console.log('[✓] Connexion confirmée.')
      } else {
        console.warn('[!] Connexion envoyée, mais pas confirmée clairement.')
        await debugPage(page, 'connexion-non-confirmee')
      }
    }

    const pauseMin = Number(process.env.PAUSE_MIN || 1)
    const pauseMax = Number(process.env.PAUSE_MAX || 2)

    console.log(`[~] Pause entre ${pauseMin} et ${pauseMax} minutes...`)
    await wait(randomBetweenMinutes(pauseMin, pauseMax))

    await logout(page)

    console.log('[~] Attente 10 secondes...')
    await wait(10 * 1000)

  } catch (err) {
    console.error(`[!] Erreur pour ${account.username} : ${err.message}`)

    if (page) {
      await debugPage(page, 'erreur-generale').catch(() => {})
    }

    console.log('[~] Pause 30 secondes et on continue...')
    await wait(30000)
  } finally {
    try {
      if (page) await page.close()
      if (context) await context.close()
      if (browser) await browser.close()
    } catch {}
  }
}

async function run() {
  console.log('[+] Bot lancé.')

  while (true) {
    for (const account of accounts) {
      await processAccount(account)
    }
  }
}

run()
