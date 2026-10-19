import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

for (const width of [1440, 390]) {
  test(`local editing, undo, reload and layout at ${width}px`, async ({ app, browser, screen }) => {
    await browser.setViewport({ width, height: 1000 });
    await app.open('/');
    await screen.getByRole('link', { name: 'Open workspace', exact: true }).click();
    await expect(screen.getByText('Saved on this device', { exact: true })).toBeVisible();
    await screen.getByRole('button', { name: 'Load example', exact: true }).click();
    const name = screen.getByRole('textbox', { name: 'Full name', exact: true });
    await expect(name).toHaveValue('Alex Morgan');
    await name.fill('Riley Synthetic');
    await screen.getByRole('button', { name: 'Undo last edit', exact: true }).click();
    await expect(name).toHaveValue('Alex Morgan');
    await screen.getByRole('button', { name: 'Redo edit', exact: true }).click();
    await expect(name).toHaveValue('Riley Synthetic');
    await expect(screen.getByText('Saved on this device', { exact: true })).toBeVisible();
    await app.open('/workspace');
    await expect(name).toHaveValue('Riley Synthetic');
    expect(await browser.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(await browser.evaluate(() => crossOriginIsolated)).toBe(true);
  });
}

test('autosave writes each settled edit once and flushes a pending edit on navigation', async ({ app, browser, screen }) => {
  await browser.addInitScript(() => {
    const original = Storage.prototype.setItem;
    (window as unknown as { draftWrites: number }).draftWrites = 0;
    Storage.prototype.setItem = function(key, value) {
      if (key === 'syntaxis.draft.v1' && JSON.parse(value).resume.name === 'Riley Save') {
        (window as unknown as { draftWrites: number }).draftWrites++;
      }
      return original.call(this, key, value);
    };
  });
  await app.open('/workspace');
  await expect(screen.getByText('Saved on this device', { exact: true })).toBeVisible();
  const name = screen.getByRole('textbox', { name: 'Full name', exact: true });
  await name.fill('Riley Save');
  await expect.poll(() => browser.evaluate(() => (window as unknown as { draftWrites: number }).draftWrites)).toBe(1);
  await expect(screen.getByText('Saved on this device', { exact: true })).toBeVisible();
  // Let the saved-status commit and its passive effects finish before checking
  // that status changes did not cause additional synchronous flushes.
  await browser.evaluate(() => new Promise<null>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(null)))));
  expect(await browser.evaluate(() => (window as unknown as { draftWrites: number }).draftWrites)).toBe(1);
  // Hold only the app's debounce timer beyond this test's timeout. Navigation
  // must flush the pending draft; a slow test cannot accidentally use autosave.
  await browser.evaluate(() => {
    const original = window.setTimeout.bind(window);
    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) =>
      original(handler, timeout === 450 ? 60000 : timeout, ...args)) as typeof window.setTimeout;
    return null;
  });
  await name.fill('Riley Pending');
  await expect(name).toHaveValue('Riley Pending');
  expect(await browser.evaluate(() => JSON.parse(localStorage.getItem('syntaxis.draft.v1')!).resume.name)).toBe('Riley Save');
  await app.open('/workspace');
  await expect(name).toHaveValue('Riley Pending');
});

test('named versions restore authored data', async ({app,screen}) => {
  await app.open('/workspace');
  const name = screen.getByRole('textbox', {name:'Full name',exact:true});
  await name.fill('Riley Version');
  await screen.getByRole('button',{name:'Save version',exact:true}).click();
  await screen.getByRole('textbox',{name:'Version name',exact:true}).fill('Synthetic snapshot');
  await screen.getByRole('dialog').getByRole('button',{name:'Save version',exact:true}).click();
  await name.fill('Changed name');
  await screen.getByRole('tab',{name:/Versions/}).click();
  await screen.getByRole('button',{name:'Restore',exact:true}).click();
  await screen.getByRole('tab',{name:'Content',exact:true}).click();
  await expect(name).toHaveValue('Riley Version');
});
