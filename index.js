import { chromium } from 'playwright'
import 'dotenv/config'

const wait = ms => new Promise(r => setTimeout(r, ms))

const randomBetween = (min, max) => {
  const value = Math.floor(Math.random() * (max - min + 1)) + min
  console.log(`[~] Pause aléatoire : ${value} minutes`)
  return value * 60 * 1000
}

const run = async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  const page = await browser.newPage()

  while (true) {
    try {
      console.log('[+] Connexion...')
      await page.goto('https://www.vends-ta-culotte.com/')
      await page.waitForTimeout(5000) // Laisse le temps à la page de charger

      await page.getByRole('button', { name: 'Entrer' }).click()
      await page.getByRole('button', { name: 'Déjà membre' }).click()

      await page.getByRole('textbox', { name: 'Pseudo ou email' }).fill(process.env.USERNAME)
      await page.getByRole('textbox', { name: 'Mot de passe' }).fill(process.env.PASSWORD)

      await page.getByRole('button', { name: 'Valider' }).click()

      console.log('[~] Connecté, pause entre 3 et 6 minutes...')
      await wait(randomBetween(3, 6)) // ✅ entre 3 et 6 minutes

      console.log('[+] Déconnexion...')
      await page.goto('https://www.vends-ta-culotte.com/')
      await page.getByRole('button', { name: 'Déconnexion' }).click()

      console.log('[~] Déconnecté, attente 2 minutes...')
      await wait(2 * 60 * 1000)
    } catch (err) {
      console.error('[!] Une erreur est survenue :', err.message)
      console.log('[~] Pause 30 secondes avant de réessayer...')
      await wait(30 * 1000)
    }
  }

  // await browser.close() // pas exécuté à cause de la boucle infinie
}

run()
