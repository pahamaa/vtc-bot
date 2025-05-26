import puppeteer from 'puppeteer'
import 'dotenv/config'

const wait = ms => new Promise(r => setTimeout(r, ms))

const login = async (page) => {
  console.log('[+] Ouverture de la page...')
  await page.goto('https://www.vends-ta-culotte.com/', {
    waitUntil: 'networkidle0',
    timeout: 60000
  })

  console.log('[+] Clic sur "Déjà membre ?"')
  await page.waitForSelector('.btn-deja-membre', { timeout: 15000 })
  await page.click('.btn-deja-membre')

  console.log('[+] Attente du formulaire...')
  await page.waitForSelector('#loginform input[name="email"]', { timeout: 15000 })
  await page.waitForSelector('#loginform input[name="password"]', { timeout: 5000 })

  console.log('[+] Remplissage email/pwd')
  await page.type('#loginform input[name="email"]', process.env.USERNAME, { delay: 100 })
  await page.type('#loginform input[name="password"]', process.env.PASSWORD, { delay: 100 })

  console.log('[+] Clic sur "Valider"')
  await Promise.all([
    page.click('#loginform button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ])

  console.log('[+] Connecté.')
}

const logout = async (page) => {
  console.log('[+] Déconnexion...')
  await page.waitForSelector('a[href="/fr/deconnexion"]', { timeout: 15000 })
  await Promise.all([
    page.click('a[href="/fr/deconnexion"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ])
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
    console.log('[~] Attente de 20 minutes...')
    await wait(20 * 60 * 1000)

    await logout(page)
    console.log('[~] Attente de 2 minutes avant de recommencer...')
    await wait(2 * 60 * 1000)
  }
}

run()
