import {expect, test} from '@playwright/test';
import {readFile} from 'node:fs/promises';

test('loads the board and preserves the active case title after reload', async ({page}) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Sepulchral\{NX\}.*Cyber Event Connector/);
  await expect(page.getByText('Perimeter Drone Feed Looped').first()).toBeVisible();

  const caseTitle = page.getByTitle('Click to rename investigation case');
  await caseTitle.fill('PLAYWRIGHT RECOVERY CASE');
  await expect(caseTitle).toHaveValue('PLAYWRIGHT RECOVERY CASE');

  await page.reload();
  await expect(page.getByTitle('Click to rename investigation case')).toHaveValue('PLAYWRIGHT RECOVERY CASE');
});

test('keeps the legend inside the viewport with a themed scrollbar', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button', {name: 'COLOR & LINE LEGEND'}).click();

  const legendHeading = page.getByRole('heading', {name: 'INVESTIGATION STORYBOARD LEGEND'});
  await expect(legendHeading).toBeVisible();

  const geometry = await legendHeading.evaluate((heading) => {
    const panel = heading.closest('.absolute');
    if (!panel) throw new Error('Legend panel container was not found.');
    const rect = panel.getBoundingClientRect();
    const styles = getComputedStyle(panel);
    return {
      bottom: rect.bottom,
      left: rect.left,
      right: rect.right,
      scrollbarColor: styles.scrollbarColor,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
    };
  });

  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewportHeight);
  expect(geometry.scrollbarColor).toContain('rgb(5, 255, 161)');
  expect(geometry.scrollbarColor).toContain('rgb(1, 3, 4)');
});

test('updates page and panel scrollbar color with the project theme', async ({page}) => {
  await page.goto('/');
  await page.getByTitle('Project Pages, Operational Schemes & Screen Optics').click();
  await page.getByTitle('Switch to THE M.I.R.E. BIOSITE (Quick Command: Alt+2)').click();

  await expect.poll(() => page.evaluate(() => (
    getComputedStyle(document.documentElement).getPropertyValue('--scrollbar-accent').trim()
  ))).toBe('#ffb000');

  const rootScrollbar = await page.locator('html').evaluate((root) => getComputedStyle(root).scrollbarColor);
  expect(rootScrollbar).toContain('rgb(255, 176, 0)');
  expect(rootScrollbar).toContain('rgb(1, 3, 4)');
});

test('Alt+1 through Alt+0 open independent saved projects', async ({page}) => {
  await page.goto('/');
  await page.getByTitle('Project Pages, Operational Schemes & Screen Optics').click();
  await expect(page.locator('button[title^="Switch to "]')).toHaveCount(10);
  await page.getByTitle('Project Pages, Operational Schemes & Screen Optics').click();
  const title = page.getByTitle('Click to rename investigation case');
  await title.fill('PAGE ONE INVESTIGATION');
  await title.press('Tab');
  await page.keyboard.press('Alt+2');
  await expect(title).toHaveValue('UNTITLED PROJECT 02');
  await expect(page.getByText('Perimeter Drone Feed Looped')).toHaveCount(0);
  await title.fill('PAGE TWO INVESTIGATION');
  await title.press('Tab');
  await page.keyboard.press('Alt+0');
  await expect(title).toHaveValue('UNTITLED PROJECT 10');
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--scrollbar-accent').trim())).toBe('#a3e635');
  await page.keyboard.press('Alt+1');
  await expect(title).toHaveValue('PAGE ONE INVESTIGATION');
  await expect(page.getByText('Perimeter Drone Feed Looped').first()).toBeVisible();
  await page.keyboard.press('Alt+2');
  await expect(title).toHaveValue('PAGE TWO INVESTIGATION');
  await page.reload();
  await expect(title).toHaveValue('PAGE TWO INVESTIGATION');
});

test('floating time tags stay readable at 40% and survive movement, page switches and JSON export', async ({page}) => {
  await page.goto('/');
  await page.getByTitle('Add floating timestamp tag').click();
  await page.getByLabel('Timestamp tag type').selectOption('range');
  await page.getByLabel('Timestamp tag label').fill('10:00–11:30 AM');
  await page.getByLabel('Timestamp tag color').fill('#38bdf8');
  await page.getByRole('button', {name: 'Save tag'}).click();

  const tag = page.getByTestId('floating-time-tag');
  await expect(tag).toContainText('10:00–11:30 AM');
  const before = await tag.boundingBox();
  expect(before).not.toBeNull();
  await page.mouse.move(before!.x + 35, before!.y + 15);
  await page.mouse.down();
  await page.mouse.move(before!.x + 135, before!.y + 85, {steps: 6});
  await page.mouse.up();
  const after = await tag.boundingBox();
  expect(after!.x).toBeGreaterThan(before!.x + 70);

  await page.getByLabel('Board zoom preset').selectOption('0.75');
  for (let i = 0; i < 3; i++) await page.getByTitle('Zoom Out (or Right-Click & Pull / Mouse Wheel)').click();
  await expect(page.getByText('40%', {exact: true}).first()).toBeVisible();
  const fontSize = await tag.locator('span').first().evaluate(element => parseFloat(getComputedStyle(element).fontSize));
  expect(fontSize).toBeGreaterThanOrEqual(16);

  await page.reload();
  await expect(page.getByTestId('floating-time-tag')).toContainText('10:00–11:30 AM');
  await page.keyboard.press('Alt+2');
  await expect(page.getByTestId('floating-time-tag')).toHaveCount(0);
  await page.keyboard.press('Alt+1');
  await expect(page.getByTestId('floating-time-tag')).toContainText('10:00–11:30 AM');

  await page.getByRole('button', {name: 'CASES'}).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', {name: 'Export Case (JSON)'}).click();
  const download = await downloadPromise;
  const exported = JSON.parse(await readFile((await download.path())!, 'utf8'));
  expect(exported.timeTags).toHaveLength(1);
  expect(exported.timeTags[0]).toMatchObject({kind: 'range', text: '10:00–11:30 AM', color: '#38bdf8'});
  expect(exported.events[0].time).toBe('01:14:22 AM');
});

test('edge resizing sets a saved screen size that does not follow board zoom', async ({page}) => {
  await page.goto('/');
  await page.getByTitle('Add floating timestamp tag').click();
  await page.getByRole('button', {name: 'Save tag'}).click();

  const tag = page.getByTestId('floating-time-tag');
  const label = tag.locator('span').first();
  await expect.poll(() => label.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBe(16);
  await page.getByLabel('Board zoom preset').selectOption('0.75');
  for (let i = 0; i < 3; i++) await page.getByTitle('Zoom Out (or Right-Click & Pull / Mouse Wheel)').click();
  await expect(page.getByText('40%', {exact: true}).first()).toBeVisible();
  await tag.hover();
  const right = await page.getByRole('button', {name: 'Resize timestamp tag from right edge'}).boundingBox();
  expect(right).not.toBeNull();
  await page.mouse.move(right!.x + right!.width / 2, right!.y + right!.height / 2);
  await page.mouse.down();
  await page.mouse.move(right!.x + right!.width / 2 - 38, right!.y + right!.height / 2, {steps: 6});
  await page.mouse.up();

  const chosenSize = await label.evaluate(element => parseFloat(getComputedStyle(element).fontSize));
  expect(chosenSize).toBeLessThan(16);
  expect(chosenSize).toBeGreaterThanOrEqual(8);
  const chosenWidth = (await tag.boundingBox())!.width;

  await page.getByLabel('Board zoom preset').selectOption('1.5');
  expect(await label.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBe(chosenSize);
  expect((await tag.boundingBox())!.width).toBeCloseTo(chosenWidth, 0);
  await page.getByLabel('Board zoom preset').selectOption('0.75');
  expect(await label.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBe(chosenSize);
  expect((await tag.boundingBox())!.width).toBeCloseTo(chosenWidth, 0);
  await tag.hover();
  const top = await page.getByRole('button', {name: 'Resize timestamp tag from top edge'}).boundingBox();
  expect(top).not.toBeNull();
  await page.mouse.move(top!.x + top!.width / 2, top!.y + top!.height / 2);
  await page.mouse.down();
  await page.mouse.move(top!.x + top!.width / 2, top!.y + top!.height / 2 - 12, {steps: 6});
  await page.mouse.up();
  const verticalSize = await label.evaluate(element => parseFloat(getComputedStyle(element).fontSize));
  expect(verticalSize).toBeGreaterThan(chosenSize);
  await page.reload();
  await expect.poll(() => label.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBe(verticalSize);

  await page.getByRole('button', {name: 'CASES'}).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', {name: 'Export Case (JSON)'}).click();
  const download = await downloadPromise;
  const exported = JSON.parse(await readFile((await download.path())!, 'utf8'));
  expect(exported.timeTags[0].fontSizePx).toBe(verticalSize);
});

test('save slots restore floating tags without changing event timestamps', async ({page}) => {
  await page.goto('/');
  await page.getByTitle('Add floating timestamp tag').click();
  await page.getByLabel('Timestamp tag label').fill('10:35 AM');
  await page.getByRole('button', {name: 'Save tag'}).click();
  await page.getByRole('button', {name: /SAVES/}).first().click();
  await page.getByTitle('Save current board to this slot').first().click();
  await page.getByRole('button', {name: 'Close'}).click();
  await page.getByTitle('Edit timestamp tag').click();
  await page.getByTitle('Delete timestamp tag').click();
  await expect(page.getByTestId('floating-time-tag')).toHaveCount(0);
  await page.getByRole('button', {name: /SAVES/}).first().click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByTitle('Load and restore this state').last().click();
  await expect(page.getByTestId('floating-time-tag')).toContainText('10:35 AM');
  await expect.poll(() => page.evaluate(() => {
    const pages = JSON.parse(localStorage.getItem('sepulchral_nx_project_pages_v1')!);
    return pages[0].caseFile.events[0].time;
  })).toBe('01:14:22 AM');
});

test('sound off mutes every cue from both controls, including after reload', async ({page}) => {
  await page.addInitScript(() => {
    const tracked = window as typeof window & {__soundStarts: number; __masterGain?: GainNode};
    tracked.__soundStarts = 0;
    const originalStart = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function(this: OscillatorNode, when?: number) {
      tracked.__soundStarts++;
      originalStart.call(this, when);
    };
    const originalCreateGain = AudioContext.prototype.createGain;
    AudioContext.prototype.createGain = function(this: AudioContext) {
      const gain = originalCreateGain.call(this);
      tracked.__masterGain ??= gain;
      return gain;
    };
  });

  const starts = () => page.evaluate(() => (window as typeof window & {__soundStarts: number}).__soundStarts);
  const masterLevel = () => page.evaluate(() => (window as typeof window & {__masterGain?: GainNode}).__masterGain?.gain.value);
  await page.goto('/');
  await page.getByTitle('Block Borders Bloom Color & Luminous Aura Controls').click();
  expect(await starts()).toBe(0);

  await page.getByRole('button', {name: 'SOUND OFF'}).click();
  await expect(page.getByRole('button', {name: 'SOUND ON'})).toBeVisible();
  await expect.poll(starts).toBeGreaterThan(0);
  await expect.poll(masterLevel).toBeGreaterThan(0);
  const enabledCount = await starts();
  await page.getByTitle('Block Borders Bloom Color & Luminous Aura Controls').click();
  expect(await starts()).toBeGreaterThan(enabledCount);

  await page.getByTitle('Toggle all sounds and reactor hum').click();
  await expect(page.getByRole('button', {name: 'SOUND OFF'})).toBeVisible();
  await expect.poll(masterLevel).toBe(0);
  const mutedCount = await starts();
  await page.getByTitle('Block Borders Bloom Color & Luminous Aura Controls').click();
  expect(await starts()).toBe(mutedCount);

  await page.reload();
  await expect(page.getByRole('button', {name: 'SOUND OFF'})).toBeVisible();
  await page.getByTitle('Block Borders Bloom Color & Luminous Aura Controls').click();
  expect(await starts()).toBe(0);
});

test('migrates the existing one-board save into page 1 without overwriting it', async ({page}) => {
  await page.addInitScript(() => {
    localStorage.setItem('sepulchral_nx_case_data_v3', JSON.stringify({
      id: 'legacy-case', title: 'MY PREVIOUS BOARD', caseNumber: 'LEGACY-001',
      leadInvestigator: 'NICK', description: 'Migration test', events: [], connections: [],
    }));
  });
  await page.goto('/');
  await expect(page.getByTitle('Click to rename investigation case')).toHaveValue('MY PREVIOUS BOARD');
  await page.keyboard.press('Alt+2');
  await expect(page.getByTitle('Click to rename investigation case')).toHaveValue('UNTITLED PROJECT 02');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('sepulchral_nx_case_data_v3')!).title)).toBe('MY PREVIOUS BOARD');
});

test('offers board-size presets and real browser fullscreen', async ({page}) => {
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('readable-ui'))).toBe(true);
  const textStyle = await page.getByTitle('Display size and fullscreen').evaluate(button => ({
    font: getComputedStyle(button).fontFamily,
    size: getComputedStyle(button).fontSize,
  }));
  expect(textStyle.font).toContain('Segoe UI');
  expect(parseFloat(textStyle.size)).toBeGreaterThanOrEqual(12);
  await page.getByLabel('Board zoom preset').selectOption('1.25');
  await expect(page.getByText('125%', {exact: true}).first()).toBeVisible();
  await page.getByLabel('Board zoom preset').selectOption('1');
  await expect(page.getByText('100%', {exact: true}).first()).toBeVisible();
  await page.getByTitle('Display size and fullscreen').click();
  await page.getByRole('button', {name: /True fullscreen/}).click();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
  await page.getByTitle('Display size and fullscreen').click();
  await page.getByRole('button', {name: /Exit fullscreen/}).click();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);
});

test('exports the active case as valid JSON', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button', {name: 'CASES'}).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', {name: 'Export Case (JSON)'}).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();

  expect(downloadPath).not.toBeNull();
  const exportedCase = JSON.parse(await readFile(downloadPath!, 'utf8'));
  expect(Array.isArray(exportedCase.events)).toBe(true);
  expect(Array.isArray(exportedCase.connections)).toBe(true);
  expect(exportedCase.events).toHaveLength(6);
});

test('exports and restores a complete workspace backup', async ({page}) => {
  await page.goto('/');
  const caseTitle = page.getByTitle('Click to rename investigation case');
  const originalTitle = await caseTitle.inputValue();

  await page.getByRole('button', {name: 'CASES'}).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', {name: 'Export Full Workspace Backup'}).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();

  const backup = JSON.parse(await readFile(downloadPath!, 'utf8'));
  expect(backup.format).toBe('sepulchral-nx-mindweaver-workspace');
  expect(backup.version).toBe(3);
  expect(backup.data.pages).toHaveLength(10);
  expect(backup.data.pages[0].caseFile.title).toBe(originalTitle);
  expect(Array.isArray(backup.data.pages[0].saveStates)).toBe(true);
  expect(Array.isArray(backup.data.pages[0].folders)).toBe(true);

  await caseTitle.fill('CHANGED AFTER BACKUP');
  await expect(caseTitle).toHaveValue('CHANGED AFTER BACKUP');

  await page.getByRole('button', {name: 'CASES'}).click();
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', {name: 'Restore Full Workspace Backup'}).click();
  const chooser = await chooserPromise;
  page.once('dialog', (dialog) => dialog.accept());
  await chooser.setFiles(downloadPath!);

  await expect(caseTitle).toHaveValue(originalTitle);
});

test('shows a safe offline state when Ollama is unavailable', async ({page}) => {
  await page.route('http://localhost:11434/**', (route) => route.abort('connectionrefused'));
  await page.route('**/api/ollama/tags', (route) => route.fulfill({
    status: 503,
    contentType: 'application/json',
    body: JSON.stringify({error: 'Ollama unavailable during test'}),
  }));

  await page.goto('/');
  await page.getByRole('button', {name: /AI AUTOFILL/}).click();
  await expect(page.getByText(/Ollama is not reachable at http:\/\/localhost:11434/)).toBeVisible();
});

test('attaches one optional image to an existing node and carries it through export and restore', async ({page}) => {
  // Inspect generated JSON inside the page; this also works when a sandboxed browser blocks OS downloads.
  await page.addInitScript(() => {
    const tracked = window as typeof window & { __exportedJson: unknown[] };
    tracked.__exportedJson = [];
    const originalClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function(this: HTMLAnchorElement) {
      if (this.download.endsWith('.json')) {
        void fetch(this.href).then(response => response.json()).then(data => tracked.__exportedJson.push(data));
      } else originalClick.call(this);
    };
  });
  await page.goto('/');
  await page.getByText('Perimeter Drone Feed Looped').first().click();
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==', 'base64');
  await page.getByLabel('Attach image to node').setInputFiles({name: 'evidence.png', mimeType: 'image/png', buffer: png});
  await expect(page.getByTestId('node-image-section').getByAltText('Attached node image')).toBeVisible();
  await page.getByRole('button', {name: 'Done & Close'}).click();
  await page.reload();
  await page.getByText('Perimeter Drone Feed Looped').first().click();
  await expect(page.getByTestId('node-image-section').getByAltText('Attached node image')).toBeVisible();
  await page.getByRole('button', {name: 'Done & Close'}).click();

  await page.getByRole('button', {name: 'CASES'}).click();
  await page.getByRole('button', {name: 'Export Case (JSON)'}).click();
  await expect.poll(() => page.evaluate(() => (window as any).__exportedJson.length)).toBe(1);
  const caseFile = await page.evaluate(() => (window as any).__exportedJson[0]);
  expect(caseFile.imageAssets).toHaveLength(1);
  expect(caseFile.events[0].imageId).toBe(caseFile.imageAssets[0].id);
  expect(caseFile.imageAssets[0].dataUrl).toContain('data:image/png;base64,');

  await page.getByRole('button', {name: 'CASES'}).click();
  await page.getByRole('button', {name: 'Export Full Workspace Backup'}).click();
  await expect.poll(() => page.evaluate(() => (window as any).__exportedJson.length)).toBe(2);
  const backupData = await page.evaluate(() => (window as any).__exportedJson[1]);
  expect(backupData.data.imageAssets).toHaveLength(1);

  await page.getByText('Perimeter Drone Feed Looped').first().click();
  await page.getByRole('button', {name: 'Remove from node'}).click();
  await expect(page.getByTestId('node-image-section').getByAltText('Attached node image')).toHaveCount(0);
  await page.getByRole('button', {name: 'Done & Close'}).click();
  await page.getByRole('button', {name: 'CASES'}).click();
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', {name: 'Restore Full Workspace Backup'}).click();
  const chooser = await chooserPromise;
  page.once('dialog', dialog => dialog.accept());
  await chooser.setFiles({name: 'mindweaver-backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backupData))});
  await page.getByText('Perimeter Drone Feed Looped').first().click();
  await expect(page.getByTestId('node-image-section').getByAltText('Attached node image')).toBeVisible();
});

test('local convergence and chat cite board records without editing them', async ({page}) => {
  let receivedBody: any;
  await page.addInitScript(() => {
    const tracked = window as typeof window & { __spoken?: string; __voiceCancelled?: number };
    tracked.__voiceCancelled = 0;
    Object.defineProperty(window, 'speechSynthesis', {configurable: true, value: {
      getVoices: () => [{name: 'Local test voice', lang: 'en-US', localService: true}],
      speak: (utterance: SpeechSynthesisUtterance) => { tracked.__spoken = utterance.text; },
      cancel: () => { tracked.__voiceCancelled = (tracked.__voiceCancelled || 0) + 1; },
    }});
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {configurable: true, value: class {text: string; voice?: SpeechSynthesisVoice; rate?: number; constructor(text: string) {this.text = text;} }});
  });
  await page.route('http://localhost:11434/api/tags', route => route.fulfill({contentType: 'application/json', body: JSON.stringify({models: [{name: 'test-local'}]})}));
  await page.route('http://localhost:11434/api/chat', async route => {
    receivedBody = route.request().postDataJSON();
    await route.fulfill({contentType: 'application/json', body: JSON.stringify({message: {content: 'Possible convergence: event evt_1 and connection conn_1. Proposed wires remain hypotheses.'}})});
  });
  await page.goto('/');
  const originalCount = await page.getByText('Perimeter Drone Feed Looped').count();
  await page.getByRole('button', {name: 'ANALYZE / CHAT'}).click();
  await expect(page.getByLabel('Analysis model')).toHaveValue('test-local');
  await page.getByTestId('analyze-convergence').click();
  await expect(page.getByText(/Possible convergence: event/)).toBeVisible();
  await expect(page.getByRole('button', {name: 'Read response 2 aloud'})).toBeDisabled();
  await page.getByRole('button', {name: 'SOUND OFF'}).click();
  await page.getByRole('button', {name: 'Read response 2 aloud'}).click();
  expect(await page.evaluate(() => (window as any).__spoken)).toContain('Possible convergence');
  await page.getByRole('button', {name: 'SOUND ON'}).click();
  expect(await page.evaluate(() => (window as any).__voiceCancelled)).toBeGreaterThan(0);
  expect(receivedBody.messages[0].content).toContain('chronological wire indicates order only');
  expect(receivedBody.messages[1].content).toContain('Perimeter Drone Feed Looped');
  await page.getByLabel('Ask about this board').fill('Which links are proposed?');
  await page.getByRole('button', {name: 'Ask', exact: true}).click();
  await expect(page.getByText('Which links are proposed?')).toBeVisible();
  expect(await page.getByText('Perimeter Drone Feed Looped').count()).toBe(originalCount);
});
