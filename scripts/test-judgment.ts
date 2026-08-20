import { demoDesk, DEMO_MAGIC_DRAFT } from "../src/lib/demo-seed";
import { assertAphorismSafe, inferFunction, judgeDraft } from "../src/lib/judgment";

const APHORISM =
  "The machines can imitate an image long before the culture learns how to recognize a new medium.";

function main() {
  const fn = inferFunction(APHORISM);
  if (fn !== "aphorism" && fn !== "proposition") {
    throw new Error(`expected aphorism/proposition, got ${fn}`);
  }
  const j = judgeDraft(APHORISM, demoDesk().profile, demoDesk().posts, demoDesk().memories);
  assertAphorismSafe(j);
  if (j.verdict === "hold") {
    throw new Error("aphorism should not be auto-held");
  }
  console.log("aphorism:", j.fn, j.verdict);
  console.log(j.why);

  const desk = demoDesk();
  const magic = judgeDraft(DEMO_MAGIC_DRAFT, desk.profile, desk.posts, desk.memories);
  if (magic.verdict !== "wait") {
    throw new Error(`magic draft expected wait, got ${magic.verdict}: ${magic.why}`);
  }
  if (!/fourth defensive explanation/i.test(magic.why)) {
    throw new Error(`magic why missed the moment: ${magic.why}`);
  }
  if (!/film example/i.test(magic.why)) {
    throw new Error(`magic why missed the film example: ${magic.why}`);
  }
  console.log("magic:", magic.verdict);
  console.log(magic.why);
}

main();
