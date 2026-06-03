import { expect, test } from '@playwright/test';

/**
 * Critical happy path against the real stack (frontend + API + Postgres):
 * add a book, see it in the list, rename its title, edit its description, confirm the card
 * reflects the new state, and confirm the change history records both edits.
 */
test('add a book, edit it, and see the changes in its history', async ({ page }) => {
  const stamp = Date.now();
  const originalTitle = `E2E Original ${stamp}`;
  const renamedTitle = `E2E Renamed ${stamp}`;
  const originalDescription = 'The first description for this e2e book.';
  const newDescription = 'An updated description for this e2e book.';
  const authorName = `E2E Author ${stamp}`;

  await page.goto('/');

  // --- create a book ---
  await page.getByTestId('add-book').click();
  await page.getByTestId('book-title-input').fill(originalTitle);
  await page.getByTestId('book-description-input').fill(originalDescription);
  await page.getByTestId('book-date-input').fill('2015-06-20');
  await page.getByTestId('author-input').fill(authorName);
  await page.getByTestId('author-input').press('Enter');
  await page.getByTestId('book-save').click();

  // Dialog closes on successful create.
  await expect(page.getByTestId('book-title-input')).toHaveCount(0);

  // --- confirm it appears in the list ---
  await page.getByTestId('book-search').fill(originalTitle);
  const row = page.locator('.MuiDataGrid-row', { hasText: originalTitle });
  await expect(row).toBeVisible();

  // --- open it and rename the title ---
  await row.click();
  await expect(page.getByTestId('book-title-input')).toHaveValue(originalTitle);
  await page.getByTestId('book-title-input').fill(renamedTitle);
  await page.getByTestId('book-save').click();

  // Card reflects the new title after the change is confirmed.
  await expect(page.getByTestId('book-card-title')).toHaveText(renamedTitle);

  // --- edit the description ---
  await page.getByTestId('book-description-input').fill(newDescription);
  await page.getByTestId('book-save').click();

  // Card reflects the new description.
  await expect(page.getByTestId('book-card-description')).toHaveText(newDescription);

  // --- assert the change history shows both edits ---
  const history = page.getByTestId('change-history');
  await expect(history.getByText(`Title was changed to "${renamedTitle}"`)).toBeVisible();
  await expect(
    history.getByText(`Short description was changed to "${newDescription}"`),
  ).toBeVisible();
});
