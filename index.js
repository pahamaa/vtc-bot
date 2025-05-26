const login = async (page) => {
  console.log('[+] Chargement de la page d’accueil...')
  await page.goto('https://www.vends-ta-culotte.com/', {
    waitUntil: 'networkidle0',
    timeout: 60000
  })

  console.log('[+] Clic sur "Déjà membre ?"')
  await page.waitForSelector('.btn-deja-membre', { timeout: 10000 })
  await page.click('.btn-deja-membre')

  console.log('[+] Attente du popup de connexion...')
  await page.waitForSelector('form#loginform input[name="email"]', { timeout: 10000 })

  console.log('[+] Remplissage du formulaire...')
  await page.type('form#loginform input[name="email"]', process.env.USERNAME, { delay: 100 })
  await page.type('form#loginform input[name="password"]', process.env.PASSWORD, { delay: 100 })

  await Promise.all([
    page.click('form#loginform button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ])

  console.log('[+] Connecté.')
}
