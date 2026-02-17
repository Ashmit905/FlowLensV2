const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')

async function run() {
  const outDir = path.join(__dirname, '..', 'demo_frames')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 1080, height: 1920 })

  console.log('Opening app at http://localhost:5174 ...')
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle2' })
  await page.waitForTimeout(800)

  let step = 0
  async function snap(name) {
    const filename = path.join(outDir, `${String(step).padStart(3,'0')}-${name}.png`)
    await page.screenshot({ path: filename })
    console.log('Saved', filename)
    step++
  }

  // Initial
  await snap('initial')

  // Click Start tutorial if present, else perform manual sequence
  const tutorialButton = await page.$x("//button[contains(., 'Start tutorial')]")
  if (tutorialButton.length > 0) {
    console.log('Starting tutorial playback...')
    await tutorialButton[0].click()
    // capture several frames during playback
    for (let i = 0; i < 14; i++) {
      await page.waitForTimeout(400)
      await snap('tutorial')
    }
  } else {
    // manual sequence: insert value X at index 1
    const valueSel = 'input[placeholder="value"]'
    const idxSel = 'input[placeholder="index (optional)"]'
    await page.waitForSelector(valueSel)
    await page.type(valueSel, 'R')
    await page.type(idxSel, '1')
    await snap('before-insert')
    const insertBtn = await page.$x("//button[contains(., 'Insert')]")
    if (insertBtn.length) await insertBtn[0].click()
    await page.waitForTimeout(500)
    await snap('after-insert')

    // delete index 2
    await page.click(idxSel, { clickCount: 3 })
    await page.type(idxSel, '2')
    const deleteBtn = await page.$x("//button[contains(., 'Delete')]")
    if (deleteBtn.length) await deleteBtn[0].click()
    await page.waitForTimeout(500)
    await snap('after-delete')
  }

  await browser.close()
  console.log('Done. Frames in', outDir)
  console.log('Use ffmpeg to assemble frames into an mp4 or gif.')
}

run().catch(err=>{console.error(err); process.exit(1)})
