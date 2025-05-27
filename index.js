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
      await page.waitForTimeout(3000) // sécurité chargement

      // 🔹 Étape 1 : cliquer sur "Entrer" si présent
      try {
        const entrerBtn = await page.getByRole('button', { name: 'Entrer' })
        await entrerBtn.waitFor({ timeout: 3000 })
        await entrerBtn.click()
        console.log('[✓] "Entrer" cliqué.')
        await page.waitForTimeout(1000)
      } catch {
        console.log('[~] Bouton "Entrer" non trouvé, on continue...')
      }

      // 🔹 Étape 2 : cliquer sur "Déjà membre"
      try {
        const dejaMembreBtn = await page.getByRole('button', { name: 'Déjà membre' })
        await dejaMembreBtn.waitFor({ timeout: 5000 })
        await dejaMembreBtn.click()
        console.log('[✓] "Déjà membre" cliqué.')
      } catch {
        throw new Error('Bouton "Déjà membre" introuvable')
      }

      // 🔹 Étape 3 : remplir les champs
      await page.getByRole('textbox', { name: 'Pseudo ou email' }).fill(process.env.USERNAME)
      await page.getByRole('textbox', { name: 'Mot de passe' }).fill(process.env.PASSWORD)

      // 🔹 Étape 4 : cliquer sur "Valider"
      try {
        const validerBtn = await page.getByRole('button', { name: 'Valider' })
        await validerBtn.waitFor({ timeout: 5000 })
        await validerBtn.click()
        console.log('[✓] Connexion validée.')
      } catch {
        throw new Error('Bouton "Valider" introuvable')
      }

      console.log('[~] Connecté, pause entre 3 et 6 minutes...')
      await wait(randomBetween(3, 6))

      console.log('[+] Déconnexion...')
      await page.goto('https://www.vends-ta-culotte.com/')
      await page.getByRole('button', { name: 'Déconnexion' }).click()

      console.log('[~] Déconnecté, attente 2 minutes...')
      await wait(2 * 60 * 1000)
    } catch (err) {
      console.error(`[!] Erreur détectée : ${err.message}`)
      console.log('[~] Tentative de rechargement dans 30 secondes...')
      try {
        await page.reload({ waitUntil: 'networkidle' })
      } catch {}
      await wait(30 * 1000)
    }
  }
}

run()
