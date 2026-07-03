import { expect, test } from "@playwright/test";

const routes = [
  "/",
  "/businesses",
  "/map",
  "/login",
  "/signup",
  "/onboarding/role",
];

for (const route of routes) {
  test(`public route ${route} loads`, async ({ page }) => {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });

    expect(response?.status(), route).toBeLessThan(400);
    await expect(page.locator("body")).toContainText(/Garemo/i);
    await expect(page.locator("body")).not.toContainText(
      /Application error|Unhandled Runtime Error|NEXT_PUBLIC_SUPABASE/i,
    );
  });
}
