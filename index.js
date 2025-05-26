const login = async (page) => {
  console.log('[+] Connexion à la page...')
  await page.goto('https://www.vends-ta-culotte.com/fr/connexion', {
    waitUntil: 'networkidle0',
    timeout: 60000 // 60 secondes
  })

  console.log('[+] Page chargée, on attend le champ email...')

  try {
    await page.waitForSelector('input[name="email"]', { timeout: 20000 }) // attend jusqu'à 20 secondes
  } catch (err) {
    console.error('[!] Erreur: champ email introuvable. On prend une capture pour debug...')
    await page.screenshot({ path: 'debug_login.png' })
    throw err
  }

  await page.type('input[name="email"]', process.env.USERNAME, { delay: 100 })
  await page.type('input[name="password"]', process.env.PASSWORD, { delay: 100 })

  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ])

  console.log('[+] Connecté.')
}
