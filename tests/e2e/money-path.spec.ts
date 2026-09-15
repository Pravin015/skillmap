import { expect, test } from "@playwright/test";
import { E2E, inDays, login, recall, remember } from "./helpers";

/**
 * The full commercial path: post → apply → award → work order → PO → invoice → paid → PO closed.
 * One serial test so each step builds on the ids from the previous one.
 */
test.describe.serial("money path", () => {
  const title = `E2E Kubernetes bootcamp ${Date.now()}`;

  test("company posts a requirement", async ({ page }) => {
    await login(page, E2E.owner);
    await page.goto("/requirements/new");
    await page.fill("input[name=title]", title);
    await page.selectOption("select[name=categoryId]", { index: 1 });
    await page.getByRole("button", { name: /^Kubernetes$/ }).click();
    await page.fill("textarea[name=description]", "Three-day hands-on Kubernetes operations bootcamp for the platform team, covering cluster setup, networking, storage and day-2 operations with labs.");
    await page.fill("input[name=participants]", "12");
    await page.selectOption("select[name=mode]", "VIRTUAL");
    await page.fill("input[name=startDate]", inDays(30));
    await page.fill("input[name=endDate]", inDays(32));
    await page.fill("input[name=budgetMax]", "35000");
    await page.getByRole("button", { name: /publish|post requirement/i }).click();
    await expect(page).toHaveURL(/\/requirements\/(?!new$)[a-z0-9]+$/);
    remember({ requirementId: page.url().split("/").pop()! });
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
  });

  test("trainer applies", async ({ page }) => {
    await login(page, E2E.trainer);
    await page.goto(`/requirements/${recall("requirementId")}`);
    await page.fill("textarea[name=coverNote]", "I have delivered twelve Kubernetes operations batches for platform teams and bring a full lab environment with me.");
    await page.fill("input[name=proposedRate]", "30000");
    const agree = page.locator("input[name=acceptAgreement]"); // first application: accept the Trainer Agreement inline
    if (await agree.count()) await agree.check();
    await page.getByRole("button", { name: "Send application" }).click();
    await expect(page.getByText(/applied|application sent|awaiting/i).first()).toBeVisible();
  });

  test("company awards and sends a signed work order", async ({ page }) => {
    await login(page, E2E.owner);
    await page.goto(`/dashboard/requirements/${recall("requirementId")}/applicants`);
    await page.getByRole("button", { name: "Award engagement" }).click();
    await expect(page.getByText(/awarded/i).first()).toBeVisible();
    await page.goto(`/requirements/${recall("requirementId")}/work-order`);
    await page.fill("input[name=dayRate]", "30000");
    await page.fill("input[name=signedName]", "E2E Owner");
    await page.getByRole("button", { name: "Send to trainer" }).click();
    await expect(page.getByText(/Sent to E2E Trainer/)).toBeVisible();
  });

  test("trainer accepts the work order", async ({ page }) => {
    await login(page, E2E.trainer);
    await page.goto(`/requirements/${recall("requirementId")}/work-order`);
    await page.fill("input[name=signedName]", "E2E Trainer");
    await page.getByRole("button", { name: "Accept work order" }).click();
    await expect(page.getByText(/Accepted · v1/)).toBeVisible(); // the response card disappears once accepted; the status badge flips
  });

  test("company issues a purchase order", async ({ page }) => {
    await login(page, E2E.owner);
    await page.goto(`/requirements/${recall("requirementId")}/work-order`);
    await page.getByRole("button", { name: "Issue purchase order" }).click();
    await expect(page).toHaveURL(/\/purchase-orders\/[a-z0-9]+\?edit=1/);
    remember({ poId: page.url().split("/purchase-orders/")[1].split("?")[0] });
    await expect(page.getByText(/Draft against WO-/)).toBeVisible();
    await page.getByRole("button", { name: "Issue purchase order" }).click();
    await expect(page.getByText(/issued to E2E Trainer/)).toBeVisible();
    await expect(page.getByText(/E2E\/\d\d-\d\d\/\d{4}/).first()).toBeVisible();
  });

  test("trainer accepts the PO and invoices against it", async ({ page }) => {
    await login(page, E2E.trainer);
    await page.goto(`/purchase-orders/${recall("poId")}`);
    await page.fill("input[name=signedName]", "E2E Trainer");
    await page.getByRole("button", { name: "Accept purchase order" }).click();
    await expect(page.getByText(/Accepted · v1/)).toBeVisible();
    await page.getByRole("link", { name: "Raise invoice against this PO" }).click();
    await expect(page).toHaveURL(/\/dashboard\/invoices\/new/);
    await expect(page.getByText(/IGST @ 18%/)).toBeVisible(); // Karnataka trainer → Maharashtra buyer
    const bank = page.locator("textarea[name=paymentDetails]");
    if (await bank.count()) await bank.fill("Account name: E2E Trainer\nAccount number: 123456789012\nIFSC code: HDFC0000001");
    await page.getByRole("button", { name: "Send invoice" }).click();
    await expect(page).toHaveURL(/\/invoices\/[a-z0-9]+\?sent=1/);
    remember({ invoiceId: page.url().split("/invoices/")[1].split("?")[0] });
    await expect(page.getByText(/TAX INVOICE/)).toBeVisible();
    await expect(page.getByText(/Amount in words:/)).toBeVisible();
  });

  test("invoice PDF downloads", async ({ page }) => {
    await login(page, E2E.trainer);
    const res = await page.request.get(`/api/documents/invoice/${recall("invoiceId")}`);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("application/pdf");
    expect((await res.body()).length).toBeGreaterThan(5000);
  });

  test("company records payment and the PO closes", async ({ page }) => {
    await login(page, E2E.owner);
    await page.goto(`/invoices/${recall("invoiceId")}`);
    await page.fill("input[name=reference]", "UTR-E2E-0001");
    await page.getByRole("button", { name: "Mark as paid" }).click();
    await expect(page.getByText(/PAID/).first()).toBeVisible();
    await page.goto(`/purchase-orders/${recall("poId")}`);
    await expect(page.getByText(/Closed · v1/)).toBeVisible();
    await expect(page.getByText(/remaining ₹0/)).toBeVisible();
  });
});
