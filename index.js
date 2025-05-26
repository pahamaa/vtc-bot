const run = async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()

  console.log('[*] Accès à la page d’accueil...')
  await page.goto('https://www.vends-ta-culotte.com/', {
    waitUntil: 'networkidle0',
    timeout: 60000
  })

  console.log('[*] Attente avant capture...')
  await page.waitForTimeout(5000) // attendre que tout charge

  console.log('[*] Capture d’écran en cours...')
  await page.screenshot({ path: 'page-load.png', fullPage: true })

  console.log('[*] Capture enregistrée. Fin du test.')
  await browser.close()
}
