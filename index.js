import puppeteer from 'puppeteer'
import 'dotenv/config'

const wait = ms => new Promise(r => setTimeout(r, ms))

const login = async (page) => {
  console.log('[+] Connexion...')
  await page.goto('https://www.vends-ta-culotte.com/fr/connexion', { waitUntil: 'domcontentloaded' })

  await page.type('input[name="email"]', process.env.USERNAME, { delay: 100 })
  await page.type('input[name="password"]', process.env.PASSWORD, { delay: 100 })

  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
  ])

  console.log('[+] Connecté.')
}

const logout = async (page) => {
  console.log('[+] Déconnexion...')
  await page.goto('https://www.vends-ta-culotte.com/fr/deconnexion', { waitUntil: 'domcontentloaded' })
  console.log('[+] Déconnecté.')
}

const run = async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()

  while (true) {
    await login(page)
    await wait(5 * 60 * 1000) // 5 minutes
    await logout(page)
    await wait(10 * 1000) // 10 secondes avant de recommencer
  }

  // await browser.close()
}

run()
