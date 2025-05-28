import { chromium } from 'playwright'
import 'dotenv/config'

const wait = ms => new Promise(r => setTimeout(r, ms))
const randomBetween = (min, max) =>
  (console.log(`[~] Pause aléatoire : ${min}-${max} min`), Math.floor(Math.random() * (max - min + 1) + min) * 60 * 1000)

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
        console.log(`\n[+] Connexion avec ${account.username}...`)

        await page.goto('https://www.vends-ta-culotte.com/', { waitUntil: 'load' })
        await page.waitForTimeout(2000)

        try {
          const entrerBtn = await page.getByRole('button', { name: 'Entrer' })
          await entrerBtn.waitFor({ timeout: 3000 })
          await entrerBtn.click()
          console.log('[✓] "Entrer" cliqué.')
        } catch {
          console.log('[~] Bouton "Entrer" non trouvé, on continue...')
        }

        const dejaMembreBtn = await page.getByRole('button', { name: 'Déjà membre' })
        await dejaMembreBtn.waitFor({ timeout: 5000 })
        await dejaMembreBtn.click()
        console.log('[✓] "Déjà membre" cliqué.')

        await page.getByRole('textbox', { name: 'Pseudo ou email' }).fill(account.username)
        await page.getByRole('textbox', { name: 'Mot de passe' }).fill(account.password)
        await page.getByRole('button', { name: 'Valider' }).click()
        console.log('[✓] Connexion validée.')

        console.log('[~] Pause entre 3 et 6 minutes...')
        await wait(randomBetween(3, 6))

        console.log('[+] Déconnexion...')
        await page.goto('https://www.vends-ta-culotte.com/', { waitUntil: 'load' })
        await page.getByRole('button', { name: 'Déconnexion' }).click()
        console.log('[✓] Déconnecté.')

        console.log('[~] Attente 10 secondes...')
        await wait(10 * 1000)

      } catch (err) {
        console.error(`[!] Erreur pour ${account.username} : ${err.message}`)
        console.log('[~] Pause 30 secondes et on continue...')
        await wait(30 * 1000)
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
