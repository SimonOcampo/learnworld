import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("builds a multi-skill quest with isolated simulations", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Choose the concepts/ })).toBeVisible();
  await page.getByRole("button", { name: /Sorting/ }).click();
  await expect(page.getByText("2 skills selected", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Launch quest/ }).click();
  await expect(page.getByRole("heading", { name: "Dijkstra’s algorithm", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Insertion sort", exact: true })).toBeVisible();
  const next = page.getByRole("button", { name: "Next step", exact: true });
  await next.nth(0).click();
  await expect(page.locator('[aria-live="polite"]').nth(0)).toContainText("Settle A");
  await expect(page.locator('[aria-live="polite"]').nth(1)).toContainText("Ready");
});

test("filters the complete curriculum and opens custom workshop", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("Search 32 skills…").fill("Bloom");
  await expect(page.getByRole("heading", { name: "Bloom Filters", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Custom workshop" }).click();
  await expect(page.getByRole("heading", { name: /Turn your material/ })).toBeVisible({ timeout: 20000 });
});

test("persists XP and completed lessons across quests and replays", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Launch quest/ }).click();

  const nextStep = page.getByRole("button", { name: "Next step", exact: true }).first();
  for (let step = 0; step < 30 && await nextStep.isEnabled(); step += 1) await nextStep.click();
  await expect(nextStep).toBeDisabled();
  await expect(page.getByText(/20 XP/)).toBeVisible();

  await page.getByRole("button", { name: /Edit quest/ }).click();
  await expect(page.getByRole("button", { name: /Completed.*Graph Algorithms/ })).toBeVisible();

  await page.reload();
  await expect(page.getByText(/20 XP/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Completed.*Graph Algorithms/ })).toBeVisible();

  await page.getByRole("button", { name: /Launch quest/ }).click();
  await expect(page.locator('a[href="#quest-0"] span')).toHaveText("✓");
  const replay = page.getByRole("button", { name: "Next step", exact: true }).first();
  for (let step = 0; step < 30 && await replay.isEnabled(); step += 1) await replay.click();
  await expect(page.getByText(/20 XP/)).toBeVisible();
});

test("has no serious automated accessibility violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([]);
});
