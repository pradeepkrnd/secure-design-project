'use strict';
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { server, CSP } = require('../server.js');
(async () => {
  await new Promise(resolve => server.listen(3000, '127.0.0.1', resolve));
  let browser;
  try { browser = await chromium.launch({headless:true}); }
  catch (error) { await new Promise(resolve => server.close(resolve)); throw error; }
  const page = await browser.newPage({viewport:{width:1100,height:980}});
  const log = [];
  const xss = `<img src="/missing" onerror="document.querySelector('#marker').textContent='XSS executed'">`;
  const injection = `document.querySelector('#marker').textContent='EVAL executed'; 5`;
  try {
    await page.goto('http://127.0.0.1:3000/vulnerable');
    await page.fill('#comment', xss); await page.click('#render');
    await page.waitForFunction(() => document.querySelector('#marker').textContent === 'XSS executed');
    log.push('PASS: vulnerable innerHTML executes injected event handler');
    await page.fill('#expression', '2 + 3'); await page.click('#calculate');
    assert.equal(await page.locator('#result').textContent(), '5');
    log.push('PASS: vulnerable eval computes 2 + 3 = 5');
    await page.fill('#expression', injection); await page.click('#calculate');
    assert.equal(await page.locator('#marker').textContent(), 'EVAL executed');
    log.push('PASS: vulnerable eval executes injected statement');
    await page.screenshot({path:'evidence/vulnerable.png'});
    const response = await page.goto('http://127.0.0.1:3000/secure');
    assert.equal(response.headers()['content-security-policy'], CSP);
    log.push('PASS: secure response sends enforced CSP header');
    await page.fill('#comment', xss); await page.click('#render');
    assert.equal(await page.locator('#preview').textContent(), xss);
    assert.equal(await page.locator('#preview img').count(), 0);
    log.push('PASS: secure preview retains literal input and creates no img element');
    await page.fill('#expression', '{"a":2,"b":3,"op":"add"}');
    await page.click('#calculate'); assert.equal(await page.locator('#result').textContent(), '5');
    log.push('PASS: secure validated calculator returns 5');
    await page.fill('#expression', injection); await page.click('#calculate');
    assert.equal(await page.locator('#result').textContent(), 'Enter a valid JSON object.');
    assert.equal(await page.locator('#marker').textContent(), 'No injected script has executed');
    log.push('PASS: secure calculator rejects script without executing it');
    // A trusted external script attempts eval and an unsafe DOM sink,
    // verifying browser policy separately from the repaired code paths.
    await page.route('**/csp-probe.js', route => route.fulfill({
      contentType:'text/javascript', body:`
        try { eval('window.evalProbe = true'); }
        catch (e) { window.evalBlocked = e.name === 'EvalError'; }
        const box = document.createElement('div');
        box.innerHTML = '<img src="/missing" onerror="window.inlineProbe=true">';
        document.body.appendChild(box);
      `
    }));
    await page.evaluate(() => new Promise(resolve => {
      const script = document.createElement('script');
      script.src='/csp-probe.js'; script.onload=resolve; document.head.appendChild(script);
    }));
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => window.evalBlocked), true);
    assert.equal(await page.evaluate(() => window.evalProbe), undefined);
    assert.equal(await page.evaluate(() => window.inlineProbe), undefined);
    log.push('PASS: CSP independently blocks eval and injected inline handler');
    await page.screenshot({path:'evidence/secure.png'});
    fs.writeFileSync('evidence/browser-results.txt', log.join('\n')+'\n');
    console.log(log.join('\n'));
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => {console.error(error); process.exitCode=1;});
