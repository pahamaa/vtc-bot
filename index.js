import { chromium } from 'playwright'
import 'dotenv/config'

const wait = ms => new Promise(r => setTimeout(r, ms))
const randomBetween = (min, max) => {
  const value = Math.floor(Math.random() * (max - min + 1) + min)
  console.log([~] Pause aléatoire : ${value} minutes)
  return value * 60 * 1000
}

const safeGoto = async (page, url, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 })
      return
    } catch (err) {
      console.warn([!] Échec goto (tentative ${i + 1}) : ${err.message})
      await wait(3000)
    }
  }
  throw new Error('Échec navigation après plusieurs tentatives.')
}

const accounts = [
  { username: process.env.USER1_EMAIL, password: process.env.USER1_PASSWORD },
  { username: process.env.USER2_EMAIL, password: process.env.USER2_PASSWORD }
]

const run = async () => {
  while (true) {
    for (const account of accounts) {
      let browser, page
      try {
        browser = await chromium.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        })

        page = await browser.newPage()
        console.log(\n[+] Connexion avec ${account.username}...)
        await wait(3000 + Math.random() * 2000)

        await safeGoto(page, 'https://www.vends-ta-culotte.com/')

        try {
          const entrerBtn = await page.getByRole('button', { name: 'Entrer' })
          await entrerBtn.waitFor({ timeout: 3000 })
          await entrerBtn.click()
          console.log('[✓] "Entrer" cliqué.')
        } catch {
          console.log('[~] Bouton "Entrer" non trouvé, on continue...')
        }

        try {
          const dejaMembreBtn = await page.getByRole('button', { name: 'Déjà membre' })
          await dejaMembreBtn.waitFor({ timeout: 5000 })
          await dejaMembreBtn.click()
          console.log('[✓] "Déjà membre" cliqué.')
        } catch {
          console.warn('[!] Bouton "Déjà membre" introuvable. On saute ce compte.')
          await browser.close()
          continue
        }

        await page.getByRole('textbox', { name: 'Pseudo ou email' }).fill(account.username)
        await page.getByRole('textbox', { name: 'Mot de passe' }).fill(account.password)
        await page.getByRole('button', { name: 'Valider' }).click()
        console.log('[✓] Connexion validée.')

        console.log('[~] Pause entre 1 et 2 minutes...')
await wait(randomBetween(1, 2))

        console.log('[+] Déconnexion...')
        await safeGoto(page, 'https://www.vends-ta-culotte.com/')
        await page.getByRole('button', { name: 'Déconnexion' }).click()
        console.log('[✓] Déconnecté.')

        console.log('[~] Attente 10 secondes...')
        await wait(10 * 1000)

      } catch (err) {
        console.error([!] Erreur pour ${account.username} : ${err.message})
        console.log('[~] Pause 30 secondes et on continue...')
        await wait(30000)
      } finally {
        try {
          if (page) await page.close()
          if (browser) await browser.close()
        } catch (_) {}
      }
    }
  }
}

run()
