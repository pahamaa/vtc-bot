import { chromium } from 'playwright'
import 'dotenv/config'

const wait = ms => new Promise(r => setTimeout(r, ms))

const run = async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  while (true) {
    console.log('[+] Connexion...')
    await page.goto('https://www.vends-ta-culotte.com/')
    await page.getByRole('button', { name: 'Entrer' }).click()
    await page.getByRole('button', { name: 'Déjà membre' }).click()
    await page.getByRole('textbox', { name: 'Pseudo ou email' }).fill(process.env.USERNAME)
    await page.getByRole('textbox', { name: 'Mot de passe' }).fill(process.env.PASSWORD)
    await page.getByRole('button', { name: 'Valider' }).click()

    console.log('[~] Connecté, attente 20 minutes...')
    await wait(20 * 60 * 1000)

    console.log('[+] Déconnexion...')
    await page.goto('https://www.vends-ta-culotte.com/')
    await page.getByRole('button', { name: 'Déconnexion' }).click()

    console.log('[~] Déconnecté, attente 2 minutes...')
    await wait(2 * 60 * 1000)
  }

  // await browser.close() // jamais atteint
}

run()
