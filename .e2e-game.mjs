const DEBUG = "http://127.0.0.1:9333";
const APP = "http://localhost:5199";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const failures = [];
const consoleErrors = [];
let passed = 0;

function check(name, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}${detail ? `  (${detail})` : ""}`);
  } else {
    failures.push(`${name}${detail ? `  (${detail})` : ""}`);
    console.log(`  FAIL  ${name}${detail ? `  (${detail})` : ""}`);
  }
}

let ws;
let msgId = 0;
const pending = new Map();

function connect(url) {
  return new Promise((resolve, reject) => {
    ws = new WebSocket(url);
    ws.onopen = resolve;
    ws.onerror = () => reject(new Error("ws error"));
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.method === "Runtime.exceptionThrown") {
        const d = msg.params.exceptionDetails;
        consoleErrors.push(d.exception?.description || d.text || "exception");
      }
      if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error") {
        consoleErrors.push(msg.params.entry.text);
      }
      if (msg.id && pending.has(msg.id)) {
        const p = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) p.reject(new Error(JSON.stringify(msg.error)));
        else p.resolve(msg.result);
      }
    };
  });
}

function send(method, params = {}) {
  msgId += 1;
  return new Promise((resolve, reject) => {
    pending.set(msgId, { resolve, reject });
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
}

async function evaluate(expression) {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) {
    throw new Error("eval exception: " + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text));
  }
  return r.result.value;
}

async function waitFor(expression, timeout = 9000, label = expression) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const v = await evaluate(expression);
      if (v) return v;
    } catch {
      /* page may be mid-navigation */
    }
    await sleep(120);
  }
  throw new Error(`TIMEOUT waiting for: ${label}`);
}

async function goto(path) {
  await send("Page.navigate", { url: `${APP}${path}` });
  await sleep(300);
}

const Q = (sel) => `document.querySelector('${sel}')`;

async function main() {
  const list = await (await fetch(`${DEBUG}/json/list`)).json();
  const target = list.find((t) => t.type === "page");
  if (!target) throw new Error("no page target");
  await connect(target.webSocketDebuggerUrl);
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Log.enable");

  /* ---------------- Test A: Number -> Words ---------------- */
  console.log("\n== A. /game/number-to-words : wrong path, submission lock, next ==");
  await goto("/game/number-to-words");
  await waitFor(`!!${Q(".q-value")}`, 12000, "question value");
  const n1 = await evaluate(`${Q(".q-value")}.textContent.trim()`);
  check("A1 question rendered", n1.length > 0, `number=${n1}`);
  check(
    "A2 prompt label present",
    (await evaluate(`${Q(".q-label")}.textContent.trim()`)) === "WRITE THIS NUMBER IN WORDS",
  );
  check("A3 hear button has text", (await evaluate(`${Q(".voice-btn")}.textContent.trim()`)).includes("Hear"));

  await evaluate(`(() => {
    const inp = ${Q(".answer-row input")};
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(inp, "zzz");
    inp.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  })()`);

  await waitFor(`!!${Q(".action-check")}`, 5000, "check button");

  for (let i = 0; i < 3; i += 1) {
    await evaluate(`(()=>{const b=${Q(".action-check")}; if(b){b.click(); return true;} return false;})()`);
    await sleep(80);
  }

  await waitFor(`${Q(".game-feedback")}?.dataset.state === 'wrong'`, 6000, "wrong feedback");
  const scoreA = await evaluate(`${Q(".score-value")}.textContent.trim()`);
  check("A4 wrong answer scores -5", scoreA === "-5", `score=${scoreA} (double-count would be -15)`);
  check("A5 red edge flash mounted", (await evaluate(`!!${Q(".edge-flash")}`)) === true);
  check("A6 Check replaced by Next", (await evaluate(`!!${Q(".action-next")}`)) === true);
  check(
    "A7 correct answer shown",
    (await evaluate(`!!${Q(".fb-correct")}`)) === true,
  );
  check("A14 your wrong answer shown", (await evaluate(`!!${Q(".fb-yours")}`)) === true);
  check("A15 red edge flash on wrong", (await evaluate(`!!${Q(".edge-flash.wrong")}`)) === true);
  check(
    "A8 input locked after submit",
    (await evaluate(`${Q(".answer-row input")}.disabled`)) === true,
  );

  const scoreBeforeNext = await evaluate(`${Q(".score-value")}.textContent.trim()`);
  await evaluate(`${Q(".action-next")}.click()`);
  await waitFor(`!!${Q(".action-check")}`, 8000, "back to answering");
  await sleep(250);
  const n2 = await evaluate(`${Q(".q-value")}.textContent.trim()`);
  const fbState = await evaluate(`${Q(".game-feedback")}.dataset.state`);
  const inputVal = await evaluate(`${Q(".answer-row input")}.value`);
  const scoreB = await evaluate(`${Q(".score-value")}.textContent.trim()`);
  check("A9 NEW question id/content", n2 !== n1, `${n1} -> ${n2}`);
  check(
    "A10 feedback reset to idle",
    (await evaluate(`document.querySelector('.game-feedback')?.dataset.state`)) === "answering" &&
      (await evaluate(`!!${Q(".fb-hint")}`)) === true &&
      (await evaluate(`!!${Q(".fb-title")}`)) === false,
    `state=${fbState}`,
  );
  check("A11 answer input reset", inputVal === "", `value="${inputVal}"`);
  check("A12 score preserved across next", scoreB === scoreBeforeNext, `score=${scoreB}`);
  check(
    "A13 empty Check disabled",
    (await evaluate(`${Q(".action-check")}.disabled`)) === true,
  );

  /* ---------------- Test B: compare, full 10-question session ---------------- */
  console.log("\n== B. /game/compare : correct answers, score, completion ==");
  await goto("/game/compare");
  await waitFor(`!!${Q(".choice-grid button")}`, 12000, "compare choices");
  const scoreStart = await evaluate(`${Q(".score-value")}.textContent.trim()`);
  check("B1 score resets on game change", scoreStart === "0", `score=${scoreStart}`);

  let completed = true;
  for (let q = 1; q <= 10; q += 1) {
    await waitFor(`!!${Q(".choice-grid button")}`, 9000, `choices q${q}`);
    const nums = await evaluate(
      `[...document.querySelectorAll('.q-list span')].map((s) => Number(s.textContent.replace(/,/g, "")))`,
    );
    const sign = nums[0] === nums[1] ? "=" : nums[0] > nums[1] ? ">" : "<";
    await evaluate(`(() => {
      const btn = [...document.querySelectorAll('.choice-grid button')]
        .find((b) => b.textContent.trim() === "${sign}");
      if (!btn) return false;
      btn.click();
      return true;
    })()`);
    await waitFor(`!!${Q(".action-check")}`, 6000, `check ready q${q}`);
    const disabled = await evaluate(`${Q(".action-check")}.disabled`);
    if (disabled) {
      completed = false;
      check(`B2.${q} check enabled after pick`, false, "still disabled");
      break;
    }
    await evaluate(`${Q(".action-check")}.click()`);
    await waitFor(`${Q(".game-feedback")}?.dataset.state === 'correct'`, 6000, `correct q${q}`);
    if (q === 1) {
      check("B11 green edge flash on correct", (await evaluate(`!!${Q(".edge-flash.correct")}`)) === true);
      const heroColor = await waitFor(
        `(() => { const c = getComputedStyle(${Q(".q-list")}).color; return c !== "rgb(255, 255, 255)" ? c : ""; })()`,
        2500,
        "hero green reaction",
      );
      check("B12 hero reacts green on correct", heroColor.length > 0, heroColor);
    }
    if (q < 10) {
      await evaluate(`${Q(".action-next")}.click()`);
      await waitFor(`!!${Q(".action-check")}`, 8000, `next ready q${q}`);
    }
  }
  check("B2 all 10 correct answered", completed);

  const scoreFinal = await evaluate(`${Q(".score-value")}.textContent.trim()`);
  check("B3 score = 100 after 10 correct", scoreFinal === "100", `score=${scoreFinal}`);
  check(
    "B4 progress shows 10 / 10",
    (await evaluate(`${Q(".gf-progress strong")}.textContent.replace(/\\s+/g,' ').trim()`)).includes("10 / 10"),
  );

  await evaluate(`${Q(".action-next")}.click()`);
  await waitFor(`!!${Q(".game-done")}`, 9000, "completion screen");
  check("B5 completion screen shown", true);
  check(
    "B6 completion summary correct",
    (await evaluate(`${Q(".done-score")}.textContent.trim().toLowerCase()`)).includes("100 points"),
    await evaluate(`${Q(".done-score")}.textContent.trim()`),
  );
  check("B7 Play Again present", (await evaluate(`[...document.querySelectorAll('.done-actions button')].some((b)=>b.textContent.includes('Play Again'))`)) === true);
  check("B8 Back to Number Lab present", (await evaluate(`[...document.querySelectorAll('.done-actions a')].some((b)=>b.textContent.includes('Number Lab'))`)) === true);
  check("B9 other games listed", (await evaluate(`document.querySelectorAll('.done-links a').length`)) >= 7);

  await evaluate(`${Q(".done-actions button")}.click()`);
  await waitFor(`!!${Q(".choice-grid button")}`, 9000, "restarted");
  const scoreRestart = await evaluate(`${Q(".score-value")}.textContent.trim()`);
  check("B10 Play Again resets score", scoreRestart === "0", `score=${scoreRestart}`);

  /* ---------------- Test C: words -> number + Hindi ---------------- */
  console.log("\n== C. /game/words-to-number : words render + Hindi ==");
  await goto("/game/words-to-number");
  await waitFor(`!!${Q(".q-words")}`, 12000, "words question");
  const words = await evaluate(`${Q(".q-words")}.textContent.trim()`);
  check("C1 English words shown", /[A-Za-z]/.test(words), words.slice(0, 60));
  check("C2 placeholder is digits", (await evaluate(`${Q(".answer-row input")}.placeholder`)).includes("7,34,22,435"));

  await evaluate(`[...document.querySelectorAll('.mini-lang button')].find((b)=>b.textContent.trim()==='हिं').click()`);
  await sleep(500);
  const hindiClass = await evaluate(`${Q(".q-words")}.className`);
  const hindiText = await evaluate(`${Q(".q-words")}.textContent.trim()`);
  check("C3 Hindi class applied", hindiClass.includes("hindi"), hindiClass);
  check("C4 Devanagari rendered", /[ऀ-ॿ]/.test(hindiText), hindiText.slice(0, 50));

  /* malformed input must fail (spec 69) */
  await evaluate(`(() => {
    const inp = ${Q(".answer-row input")};
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(inp, "12,,34,567");
    inp.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  })()`);
  await evaluate(`${Q(".action-check")}.click()`);
  await waitFor(`${Q(".game-feedback")}?.dataset.state === 'wrong'`, 6000, "malformed rejected");
  check("C5 '12,,34,567' rejected", true);

  /* ---------------- Test D0: sticky score ---------------- */
  console.log("\n== D0. sticky score top right ==");
  await goto("/game/number-to-words");
  await waitFor(`!!${Q(".score-rail")}`, 9000, "score rail");
  const railInfo = await evaluate(`(() => {
    const rail = ${Q(".score-rail")};
    const panel = ${Q(".score-panel")};
    const cs = getComputedStyle(rail);
    const r = panel.getBoundingClientRect();
    const pageRight = document.querySelector('.page').getBoundingClientRect().right;
    return {
      position: cs.position,
      top: cs.top,
      pageGap: Math.round(pageRight - r.right),
      viewportGap: Math.round(window.innerWidth - r.right),
    };
  })()`);
  check("D0a score rail position is sticky", railInfo.position === "sticky", JSON.stringify(railInfo));
  check(
    "D0b score aligned to top-right of content",
    Math.abs(railInfo.pageGap) <= 4,
    `gap to content right edge=${railInfo.pageGap}px (viewport gutter=${railInfo.viewportGap}px)`,
  );
  await evaluate("window.scrollTo(0, 900)");
  await sleep(400);
  const stuckY = await evaluate(`Math.round(${Q(".score-panel")}.getBoundingClientRect().top)`);
  check("D0c score stays visible after scroll", stuckY >= 0 && stuckY <= 40, `top=${stuckY}px`);
  await evaluate("window.scrollTo(0, 0)");
  await sleep(200);

  /* ---------------- Test D: all routes + responsive ---------------- */
  console.log("\n== D. routes + responsive overflow ==");
  const routes = [
    "/",
    "/game/number-to-words",
    "/game/words-to-number",
    "/game/place-value",
    "/game/guess-place",
    "/game/carry",
    "/game/order",
    "/game/compare",
    "/game/hear-type",
  ];
  for (const route of routes) {
    await goto(route);
    await sleep(600);
    const rootSize = await evaluate(`document.getElementById('root').innerHTML.length`);
    check(`D1 ${route} renders`, rootSize > 400, `bytes=${rootSize}`);
  }

  const widths = [320, 360, 375, 390, 430];
  for (const width of widths) {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await goto("/game/words-to-number");
    await waitFor(`!!${Q(".q-words")}`, 9000, `words @${width}`);
    const overflow = await evaluate(
      `document.documentElement.scrollWidth - document.documentElement.clientWidth`,
    );
    check(`D2 no h-overflow @${width}px`, overflow <= 0, `overflow=${overflow}px`);

    const stageBottom = await evaluate(`(() => {
      const r = ${Q(".question-stage")}.getBoundingClientRect();
      return Math.round(r.width);
    })()`);
    check(`D3 question stage fits @${width}px`, stageBottom <= width, `width=${stageBottom}`);
  }
  await send("Emulation.clearDeviceMetricsOverride");

  /* ---------------- Console ---------------- */
  console.log("\n== E. console ==");
  check("E1 no console errors during run", consoleErrors.length === 0, consoleErrors.slice(0, 5).join(" | "));

  console.log(`\nRESULT: ${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    console.log("FAILURES:");
    failures.forEach((f) => console.log("  - " + f));
  }
  process.exit(failures.length ? 1 : 0);
}

main().catch((err) => {
  console.error("E2E ERROR:", err.message);
  console.log(`\nRESULT: ${passed} passed, ${failures.length} failed (aborted)`);
  if (consoleErrors.length) console.log("console errors:", consoleErrors.slice(0, 8));
  process.exit(1);
});
