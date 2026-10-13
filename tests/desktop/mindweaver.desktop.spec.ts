import {expect, test} from '@playwright/test';
import {_electron as electron} from 'playwright';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {readFile} from 'node:fs/promises';

const require = createRequire(import.meta.url);
const packagedExecutable = process.env.MINDWEAVER_DESKTOP_EXECUTABLE;
const electronExecutable = packagedExecutable || (require('electron') as string);

test('desktop app imports a backup, exports it, and keeps progress after relaunch', async () => {
  const testProfile = path.join(tmpdir(), `mindweaver-desktop-test-${process.pid}-${Date.now()}`);
  const launch = () => electron.launch({
    executablePath: electronExecutable,
    args: packagedExecutable ? [] : ['.'],
    cwd: process.cwd(),
    env: {...process.env, MINDWEAVER_TEST_USER_DATA: testProfile},
  });

  const app = await launch();
  let expectedEvents = 6;
  let expectedConnections = 5;
  try {
    const window = await app.firstWindow();
    await expect(window).toHaveTitle(/Sepulchral\{NX\}.*Cyber Event Connector/);
    await expect(window.getByText('Perimeter Drone Feed Looped').first()).toBeVisible();
    await window.screenshot({path: 'test-results-desktop/readable-ui.png'});
    await window.keyboard.press('Alt+0');
    await expect(window.getByTitle('Click to rename investigation case')).toHaveValue('UNTITLED PROJECT 10');
    await window.waitForLoadState('networkidle');
    await window.keyboard.press('Alt+1');
    await expect(window.getByText('Perimeter Drone Feed Looped').first()).toBeVisible();
    await window.getByTitle('Display size and fullscreen').click();
    await window.getByRole('button', {name: /True fullscreen/}).click();
    await expect.poll(() => app.evaluate(({BrowserWindow}) => BrowserWindow.getAllWindows()[0].isFullScreen())).toBe(true);
    await window.getByTitle('Display size and fullscreen').click();
    await window.getByRole('button', {name: /Exit fullscreen/}).click();
    await expect.poll(() => app.evaluate(({BrowserWindow}) => BrowserWindow.getAllWindows()[0].isFullScreen())).toBe(false);
    await app.evaluate(({BrowserWindow}) => {
      const contents = BrowserWindow.getAllWindows()[0].webContents;
      contents.sendInputEvent({type: 'keyDown', keyCode: 'F11'});
      contents.sendInputEvent({type: 'keyUp', keyCode: 'F11'});
    });
    await expect.poll(() => app.evaluate(({BrowserWindow}) => BrowserWindow.getAllWindows()[0].isFullScreen())).toBe(true);
    await window.getByTitle('Display size and fullscreen').click();
    await window.getByRole('button', {name: /Exit fullscreen/}).click();

    const userBackup = process.env.MINDWEAVER_BACKUP_TEST_FILE;
    if (userBackup) {
      const backup = JSON.parse(await readFile(userBackup, 'utf8'));
      expectedEvents = backup.data.caseFile.events.length;
      expectedConnections = backup.data.caseFile.connections.length;
      await window.getByRole('button', {name: 'CASES'}).click();
      const chooserPromise = window.waitForEvent('filechooser');
      await window.getByRole('button', {name: 'Restore Full Workspace Backup'}).click();
      const chooser = await chooserPromise;
      window.once('dialog', (dialog) => dialog.accept());
      const reloadPromise = window.waitForEvent('load');
      await chooser.setFiles(userBackup);
      await reloadPromise;
      await expect(window.getByTitle('Click to rename investigation case')).toHaveValue(backup.data.caseFile.title);
    }

    await expect.poll(() => window.evaluate(() => {
      const saved = localStorage.getItem('sepulchral_nx_project_pages_v1');
      return saved ? JSON.parse(saved)[0].caseFile.events.length : 0;
    })).toBe(expectedEvents);

    await window.getByTitle('Add floating timestamp tag').click();
    await window.getByLabel('Timestamp tag label').fill('10:35 AM DESKTOP');
    await window.getByRole('button', {name: 'Save tag'}).click();
    const desktopTag = window.getByTestId('floating-time-tag');
    await expect(desktopTag).toContainText('10:35 AM DESKTOP');
    await desktopTag.hover();
    const grip = await window.getByRole('button', {name: 'Resize timestamp tag from right edge'}).boundingBox();
    expect(grip).not.toBeNull();
    await window.mouse.move(grip!.x + grip!.width / 2, grip!.y + grip!.height / 2);
    await window.mouse.down();
    await window.mouse.move(grip!.x + grip!.width / 2 - 50, grip!.y + grip!.height / 2, {steps: 6});
    await window.mouse.up();
    const resizedSize = await desktopTag.locator('span').first().evaluate(element => parseFloat(getComputedStyle(element).fontSize));
    expect(resizedSize).toBeLessThan(16);

    const ollamaStatus = await window.evaluate(async () => {
      const response = await fetch('/api/ollama/tags');
      await response.json();
      return response.status;
    });
    expect([200, 503]).toContain(ollamaStatus);

    await window.getByText('Perimeter Drone Feed Looped').first().click();
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==', 'base64');
    await window.getByLabel('Attach image to node').setInputFiles({name: 'desktop-evidence.png', mimeType: 'image/png', buffer: png});
    await expect(window.getByTestId('node-image-section').getByAltText('Attached node image')).toBeVisible();
    await window.getByRole('button', {name: 'Done & Close'}).click();

    await window.getByRole('button', {name: 'CASES'}).click();
    const exportedPath = path.join(testProfile, 'workspace-export.json');
    await app.evaluate(({session}, savePath) => {
      (globalThis as any).mindweaverDownloadState = 'waiting';
      session.defaultSession.once('will-download', (_event, item) => {
        item.setSavePath(savePath);
        item.once('done', (_doneEvent, state) => {
          (globalThis as any).mindweaverDownloadState = state;
        });
      });
    }, exportedPath);
    await window.getByRole('button', {name: 'Export Full Workspace Backup'}).click();
    await expect.poll(() => app.evaluate(() => (globalThis as any).mindweaverDownloadState)).toBe('completed');
    const exported = JSON.parse(await readFile(exportedPath, 'utf8'));
    expect(exported.version).toBe(3);
    expect(exported.data.pages).toHaveLength(10);
    expect(exported.data.pages[0].caseFile.events).toHaveLength(expectedEvents);
    expect(exported.data.pages[0].caseFile.connections).toHaveLength(expectedConnections);
    expect(exported.data.pages[0].caseFile.timeTags[0].text).toBe('10:35 AM DESKTOP');
    expect(exported.data.pages[0].caseFile.timeTags[0].fontSizePx).toBe(resizedSize);
    expect(exported.data.imageAssets).toHaveLength(1);
    expect(exported.data.pages[0].caseFile.events.some((event: {imageId?: string}) => event.imageId === exported.data.imageAssets[0].id)).toBe(true);
  } finally {
    await app.close();
  }

  const reopened = await launch();
  try {
    const window = await reopened.firstWindow();
    await expect.poll(() => window.evaluate(() => {
      const saved = localStorage.getItem('sepulchral_nx_project_pages_v1');
      return saved ? JSON.parse(saved)[0].caseFile.events.length : 0;
    })).toBe(expectedEvents);
    await expect(window.getByTestId('floating-time-tag')).toContainText('10:35 AM DESKTOP');
    expect(await window.getByTestId('floating-time-tag').locator('span').first()
      .evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeLessThan(16);
    await window.getByText('Perimeter Drone Feed Looped').first().click();
    await expect(window.getByTestId('node-image-section').getByAltText('Attached node image')).toBeVisible();
  } finally {
    await reopened.close();
  }
});
