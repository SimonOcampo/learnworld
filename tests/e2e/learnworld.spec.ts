import { expect, test } from "@playwright/test";

const concepts = [
  { button: "graph lab Dijkstra’s algorithm Find shortest paths through a weighted graph.", heading: "Dijkstra’s algorithm", firstEvent: "Settle A; distance 0 is now final." },
  { button: "graph lab Breadth-first search Explore a graph one level at a time.", heading: "Breadth-first search", firstEvent: "BFS visits A from the front of the queue." },
  { button: "graph lab Depth-first search Follow a path deeply, then backtrack.", heading: "Depth-first search", firstEvent: "DFS visits A from the top of the stack." },
  { button: "array lab Binary search Repeatedly halve a sorted search range.", heading: "Binary search", firstEvent: "Compare target 31 with midpoint value 24." },
  { button: "array lab Insertion sort Grow a sorted prefix one item at a time.", heading: "Insertion sort", firstEvent: "Compare 8 with key 3." },
] as const;

for (const concept of concepts) {
  test(`launches and steps through ${concept.heading}`, async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Don’t read the concept/ })).toBeVisible();
    await page.getByRole("button", { name: concept.button, exact: true }).click();
    await page.getByRole("button", { name: "Skip upload and use a curated lesson", exact: true }).click();
    await expect(page.getByRole("heading", { name: concept.heading, exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Next step", exact: true }).click();
    await expect(page.locator('[aria-live="polite"]')).toHaveText(concept.firstEvent);
    await page.getByRole("button", { name: "Back to concepts", exact: true }).click();
    await expect(page.getByText("The studio", { exact: true })).toBeVisible();
  });
}

test("edits Dijkstra weights and scores a deterministic challenge locally", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Skip upload and use a curated lesson", exact: true }).click();
  const weight = page.getByRole("spinbutton", { name: "Edge weight", exact: true });
  await weight.fill("1");
  await expect(weight).toHaveValue("1");
  await page.getByRole("button", { name: "Challenge me", exact: true }).click();
  await expect(page.getByText("Which node or index is the focus of the next deterministic event?", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "A", exact: true }).click();
  await expect(page.getByText("Correct — that matches the deterministic next event.", { exact: true })).toBeVisible();
});
