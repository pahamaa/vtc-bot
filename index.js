import { chromium } from 'playwright'
import 'dotenv/config'

const wait = ms => new Promise(r => setTimeout(r, ms))

const randomBetween = (min, max) => {
  const value = Math.floor(Math.random() * (max - min + 1)) + min
  console.log(`[~] Pause aléatoire : ${value} minutes`)
  return value * 60 * 1000 // convert to milliseconds
}

const run = async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  const page = await browser.newPage()

  while (true) {
    console.log('[+] Connexion...')
    await page.goto('https://www.vends-ta-culotte.com/')
    await page.waitForTimeout(5000) // sécurité chargement
    await page.getByRole('button', { name: 'Entrer' }).click()
    await page.getByRole('button', { name: 'Déjà membre' }).click()
    await page.getByRole('textbox', { name: 'Pseudo ou email' }).fill(process.env.USERNAME)
    await page.getByRole('textbox', { name: 'Mot de passe' }).fill(process.env.PASSWORD)
    await page.getByRole('button', { name: 'Valider' }).click()

    console.log('[~] Connecté, pause entre 5 et 10 minutes...')
    await wait(randomBetween(5, 10)) // PAUSE ALÉATOIRE

    console.log('[+] Déconnexion...')
    await page.goto('https://www.vends-ta-culotte.com/')
    await page.getByRole('button', { name: 'Déconnexion' }).click()

    console.log('[~] Déconnecté, attente 2 minutes...')
    await wait(2 * 60 * 1000)
  }

  // await browser.close() // jamais atteint à cause de la boucle
}

run()
