const login = async (page) => {
  console.log('[+] Ouverture de la page...')
  await page.goto('https://www.vends-ta-culotte.com/', {
    waitUntil: 'networkidle0',
    timeout: 60000
  })

  console.log('[+] Clic sur "Déjà membre ?" (via texte visible)')
  const [loginBtn] = await page.$x("//a[contains(text(), 'Déjà membre')]")
  if (!loginBtn) {
    console.log('[!] Bouton "Déjà membre" introuvable. Capture d’écran...')
    await page.screenshot({ path: 'no-login-button.png', fullPage: true })
    throw new Error('Bouton "Déjà membre ?" non trouvé')
  }
  await loginBtn.click()

  console.log('[+] Attente du formulaire...')
  await page.waitForSelector('#loginform input[name="email"]', { timeout: 15000 })

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
