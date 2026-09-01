const { test, expect } = require('@playwright/test');

const APP='http://127.0.0.1:4173/index.html';

test('Read Aloud renders and reads only visible learner text', async ({ page }) => {
  await page.addInitScript(() => {
    const synth=window.speechSynthesis;
    if(synth){
      synth.speak=(utterance)=>{
        window.__mmReadAloudSpoken=String(utterance.text||'');
        window.__mmReadAloudRate=Number(utterance.rate||1);
        queueMicrotask(()=>utterance.onstart?.());
      };
      synth.cancel=()=>{};
      synth.pause=()=>{};
      synth.resume=()=>{};
    }
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(APP, { waitUntil: 'domcontentloaded' });

  const host=page.locator('.mm-read-aloud');
  await expect(host).toBeVisible();
  await expect(host).toHaveAttribute('data-version','2026.09.01.1');
  await host.locator('details').evaluate(el=>{el.open=true;});

  await expect(host.locator('[data-mm-read="play"]')).toBeVisible();
  await expect(host.locator('[data-mm-read="prev"]')).toBeVisible();
  await expect(host.locator('[data-mm-read="next"]')).toBeVisible();
  await expect(host.locator('[data-mm-read="stop"]')).toBeVisible();
  await expect(host.locator('[data-mm-read="speed"]')).toHaveValue('1');

  const visibilityCheck=await page.evaluate(() => {
    const root=document.querySelector('.main')||document.querySelector('main')||document.body;
    const visible=document.createElement('p');
    visible.id='mmQaVisibleSpeech';
    visible.textContent='Read aloud visible sentinel sentence.';
    const hidden=document.createElement('p');
    hidden.id='mmQaHiddenSpeech';
    hidden.hidden=true;
    hidden.textContent='Read aloud hidden sentinel sentence.';
    root.append(visible,hidden);
    const texts=(window.MMReadAloud?.refresh?.()||[]).map(item=>item.text);
    visible.remove();hidden.remove();
    return {
      visible:texts.includes('Read aloud visible sentinel sentence.'),
      hidden:texts.includes('Read aloud hidden sentinel sentence.')
    };
  });
  expect(visibilityCheck.visible).toBeTruthy();
  expect(visibilityCheck.hidden).toBeFalsy();

  await host.locator('[data-mm-read="play"]').click();
  await expect.poll(()=>page.evaluate(()=>window.__mmReadAloudSpoken||'')).not.toBe('');
  await expect(host.locator('[data-mm-read="play"]')).toHaveText('Pause');
  await expect(host.locator('[data-mm-read="current"]')).not.toBeEmpty();

  await host.locator('[data-mm-read="play"]').click();
  await expect(host.locator('[data-mm-read="play"]')).toHaveText('Resume');
  await host.locator('[data-mm-read="play"]').click();
  await expect(host.locator('[data-mm-read="play"]')).toHaveText('Pause');

  await host.locator('[data-mm-read="speed"]').selectOption('1.25');
  await expect.poll(()=>page.evaluate(()=>window.__mmReadAloudRate)).toBe(1.25);

  await host.locator('[data-mm-read="stop"]').click();
  await expect(host.locator('[data-mm-read="play"]')).toHaveText('Listen');
  await expect(host.locator('.mm-read-status')).toHaveText('Stopped');
});
