import { chromium } from 'playwright'
import 'dotenv/config'

const wait = ms => new Promise(r => setTimeout(r, ms))

const randomBetween = (min, max) => {
  const value = Math.floor(Math.random() * (max - min + 1)) + min
  console.log(`[~] Pause aléatoire : ${value} minutes`)
  return value * 60 * 1000
}

// Liste des comptes à alterner
const accounts = [
  { username: process.env.USER1_EMAIL, password: process.env.USER1_PASSWORD },
  { username: process.env.USER2_EMAIL, password: process.env.USER2_PASSWORD }
]

const run = async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()

  while (true) {
    for (const account of accounts) {
      try {
        console.log(`[+] Connexion avec ${account.username}...`)
        await page.goto('https://www.vends-ta-culotte.com/')
        await page.waitForTimeout(3000)

        // étape 1 : cliquer sur "Entrer" si présent
        try {
          const entrerBtn = await page.getByRole('button', { name: 'Entrer' })
          await entrerBtn.waitFor({ timeout: 3000 })
          await entrerBtn.click()
          console.log('[✓] "Entrer" cliqué.')
        } catch {
          console.log('[~] Pas de bouton "Entrer", on continue...')
        }

        // étape 2 : cliquer sur "Déjà membre"
        const dejaMembreBtn = await page.getByRole('button', { name: 'Déjà membre' })
        await dejaMembreBtn.waitFor({ timeout: 5000 })
        await dejaMembreBtn.click()
        console.log('[✓] "Déjà membre" cliqué.')

        // étape 3 : login
        await page.getByRole('textbox', { name: 'Pseudo ou email' }).fill(account.username)
        await page.getByRole('textbox', { name: 'Mot de passe' }).fill(account.password)
        await page.getByRole('button', { name: 'Valider' }).click()
        console.log('[✓] Connexion validée.')

        // étape 4 : pause entre 3 et 6 minutes
        console.log('[~] Pause entre 3 et 6 minutes...')
        await wait(randomBetween(3, 6))

        // étape 5 : déconnexion
        console.log('[+] Déconnexion...')
        await page.goto('https://www.vends-ta-culotte.com/')
        await page.getByRole('button', { name: 'Déconnexion' }).click()
        console.log('[✓] Déconnecté.')

        // pause entre utilisateurs
        console.log('[~] Pause 2 minutes avant le prochain compte...')
        await wait(2 * 60 * 1000)
      } catch (err) {
        console.error(`[!] Erreur pour ${account.username} :`, err.message)
        console.log('[~] Reload de la page + pause 30 sec...')
        try {
          await page.reload({ waitUntil: 'networkidle' })
        } catch (_) {}
        await wait(30 * 1000)
      }
    }
  }

  // await browser.close()
}

run()
