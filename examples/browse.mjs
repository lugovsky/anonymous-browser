import { createBrowser } from "@lugovsky/anonymous-browser";

const profileId = process.env.GOLOGIN_PROFILE_ID;
if (!profileId) throw new Error("Set GOLOGIN_PROFILE_ID to a disposable GoLogin profile");

const browser = createBrowser();
await browser.withSession({ profileId, headless: process.env.HEADLESS !== "false" }, async (session) => {
  const { page, human } = await session.newPage();
  await page.goto("about:blank", { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.setContent('<label>Message <textarea>Previous draft</textarea></label>');
  const input = page.getByRole("textbox", { name: "Message" });
  await human.scroll(input, { block: "center" });
  await human.clear(input);
  await human.type(input, "Hello from HumanJS");
  console.log({ text: await input.inputValue(), viewport: page.viewportSize() });
});
