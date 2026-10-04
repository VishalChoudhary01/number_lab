import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import confetti from "canvas-confetti";
import { BrowserRouter, Link, Route, Routes, useLocation, useNavigate } from "react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const MIN = 0;
const MAX = 99999999;
const SPEEDS = [1, 5, 10, 15, 20, 30];
const DEFAULT_SPEED = 1;
const DEFAULT_SPEECH_RATE = 0.78;
const EASE = [0.22, 1, 0.36, 1];
const PLACE_META = [
  { key: "ones", label: "Ones", hindi: "इकाई", multiplier: 1, colorClass: "place-blue" },
  { key: "tens", label: "Tens", hindi: "दहाई", multiplier: 10, colorClass: "place-green" },
  { key: "hundreds", label: "Hundreds", hindi: "सैकड़ा", multiplier: 100, colorClass: "place-amber" },
  { key: "thousand", label: "Thousand", hindi: "हज़ार", multiplier: 1000, colorClass: "place-purple" },
  { key: "tenThousand", label: "Ten Thousand", hindi: "दस हज़ार", multiplier: 10000, colorClass: "place-violet" },
  { key: "lakh", label: "Lakh", hindi: "लाख", multiplier: 100000, colorClass: "place-pink" },
  { key: "tenLakh", label: "Ten Lakh", hindi: "दस लाख", multiplier: 1000000, colorClass: "place-rose" },
  { key: "crore", label: "Crore", hindi: "करोड़", multiplier: 10000000, colorClass: "place-red" },
];

const EN_ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const EN_TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const HI_UNDER_100 = {
  0: "", 1: "एक", 2: "दो", 3: "तीन", 4: "चार", 5: "पाँच", 6: "छह", 7: "सात", 8: "आठ", 9: "नौ",
  10: "दस", 11: "ग्यारह", 12: "बारह", 13: "तेरह", 14: "चौदह", 15: "पंद्रह", 16: "सोलह", 17: "सत्रह", 18: "अठारह", 19: "उन्नीस",
  20: "बीस", 21: "इक्कीस", 22: "बाईस", 23: "तेईस", 24: "चौबीस", 25: "पच्चीस", 26: "छब्बीस", 27: "सत्ताईस", 28: "अट्ठाईस", 29: "उनतीस",
  30: "तीस", 31: "इकतीस", 32: "बत्तीस", 33: "तैंतीस", 34: "चौंतीस", 35: "पैंतीस", 36: "छत्तीस", 37: "सैंतीस", 38: "अड़तीस", 39: "उनतालीस",
  40: "चालीस", 41: "इकतालीस", 42: "बयालीस", 43: "तैंतालीस", 44: "चवालीस", 45: "पैंतालीस", 46: "छियालीस", 47: "सैंतालीस", 48: "अड़तालीस", 49: "उनचास",
  50: "पचास", 51: "इक्यावन", 52: "बावन", 53: "तिरपन", 54: "चौवन", 55: "पचपन", 56: "छप्पन", 57: "सत्तावन", 58: "अट्ठावन", 59: "उनसठ",
  60: "साठ", 61: "इकसठ", 62: "बासठ", 63: "तिरसठ", 64: "चौंसठ", 65: "पैंसठ", 66: "छियासठ", 67: "सड़सठ", 68: "अड़सठ", 69: "उनहत्तर",
  70: "सत्तर", 71: "इकहत्तर", 72: "बहत्तर", 73: "तिहत्तर", 74: "चौहत्तर", 75: "पचहत्तर", 76: "छिहत्तर", 77: "सतहत्तर", 78: "अठहत्तर", 79: "उन्नासी",
  80: "अस्सी", 81: "इक्यासी", 82: "बयासी", 83: "तिरासी", 84: "चौरासी", 85: "पचासी", 86: "छियासी", 87: "सतासी", 88: "अट्ठासी", 89: "नवासी",
  90: "नब्बे", 91: "इक्यानवे", 92: "बानवे", 93: "तिरानवे", 94: "चौरानवे", 95: "पंचानवे", 96: "छियानवे", 97: "सत्तानवे", 98: "अट्ठानवे", 99: "निन्यानवे",
};

function twoDigitWords(number) {
  if (!number) return "";
  if (number < 20) return EN_ONES[number];
  const tens = Math.floor(number / 10);
  const ones = number % 10;
  return ones ? `${EN_TENS[tens]} ${EN_ONES[ones]}` : EN_TENS[tens];
}

function threeDigitWords(number) {
  if (!number) return "";
  const hundreds = Math.floor(number / 100);
  const remainder = number % 100;
  const parts = [];
  if (hundreds) parts.push(`${EN_ONES[hundreds]} Hundred`);
  if (remainder) parts.push(twoDigitWords(remainder));
  return parts.join(" ");
}

function indianNumberToWords(number) {
  if (number === 0) return "Zero";
  let remainder = Math.floor(number);
  const parts = [];
  const crore = Math.floor(remainder / 10000000);
  remainder %= 10000000;
  const lakh = Math.floor(remainder / 100000);
  remainder %= 100000;
  const thousand = Math.floor(remainder / 1000);
  remainder %= 1000;
  if (crore) parts.push(`${twoDigitWords(crore) || threeDigitWords(crore)} Crore`);
  if (lakh) parts.push(`${twoDigitWords(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigitWords(thousand)} Thousand`);
  if (remainder) parts.push(threeDigitWords(remainder));
  return parts.join(" ");
}

function hindiUnder100Words(number) {
  return HI_UNDER_100[number] || "";
}

function hindiThreeDigitWords(number) {
  if (!number) return "";
  const hundreds = Math.floor(number / 100);
  const remainder = number % 100;
  const parts = [];
  if (hundreds) parts.push(`${HI_UNDER_100[hundreds]} सौ`);
  if (remainder) parts.push(hindiUnder100Words(remainder));
  return parts.join(" ");
}

function indianNumberToHindiWords(number) {
  if (number === 0) return "शून्य";
  let remainder = Math.floor(number);
  const parts = [];
  const crore = Math.floor(remainder / 10000000);
  remainder %= 10000000;
  const lakh = Math.floor(remainder / 100000);
  remainder %= 100000;
  const thousand = Math.floor(remainder / 1000);
  remainder %= 1000;
  if (crore) parts.push(`${hindiUnder100Words(crore) || hindiThreeDigitWords(crore)} करोड़`);
  if (lakh) parts.push(`${hindiUnder100Words(lakh)} लाख`);
  if (thousand) parts.push(`${hindiUnder100Words(thousand)} हज़ार`);
  if (remainder) parts.push(hindiThreeDigitWords(remainder));
  return parts.join(" ");
}

function normalizeText(value) {
  return String(value)
    .toLowerCase()
    .replace(/[–—-]/g, " ")
    .replace(/[,，]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeHindi(value) {
  return normalizeText(value)
    .replaceAll("ज़", "ज़")
    .replaceAll("ز", "ज़")
    .replaceAll("हजार", "हज़ार")
    .replaceAll("करोड", "करोड़");
}

function formatIndian(number) {
  return new Intl.NumberFormat("en-IN").format(number);
}

function getDigits(number) {
  return {
    crore: Math.floor(number / 10000000) % 10,
    lakhTens: Math.floor(number / 1000000) % 10,
    lakhOnes: Math.floor(number / 100000) % 10,
    thousandTens: Math.floor(number / 10000) % 10,
    thousandOnes: Math.floor(number / 1000) % 10,
    hundreds: Math.floor(number / 100) % 10,
    tens: Math.floor(number / 10) % 10,
    ones: number % 10,
  };
}

function getChangedPlaces(previous, next) {
  const a = getDigits(previous);
  const b = getDigits(next);
  const changed = [];
  if (a.crore !== b.crore) changed.push("Crore");
  if (a.lakhTens !== b.lakhTens) changed.push("Ten Lakh");
  if (a.lakhOnes !== b.lakhOnes) changed.push("Lakh");
  if (a.thousandTens !== b.thousandTens) changed.push("Ten Thousand");
  if (a.thousandOnes !== b.thousandOnes) changed.push("Thousand");
  if (a.hundreds !== b.hundreds) changed.push("Hundreds");
  if (a.tens !== b.tens) changed.push("Tens");
  if (a.ones !== b.ones) changed.push("Ones");
  return changed;
}

function getLesson(previous, next) {
  const special = {
    "9-10": "Carry: 10 Ones make 1 Ten.",
    "99-100": "Carry: 10 Tens make 1 Hundred.",
    "999-1000": "Carry: 10 Hundreds make 1 Thousand.",
    "9999-10000": "Carry: 10 Thousands move into Ten Thousand.",
    "99999-100000": "Carry: 10 Ten-Thousands make 1 Lakh.",
    "999999-1000000": "Carry: 10 Lakhs move into Ten Lakh.",
    "9999999-10000000": "Carry: 10 Ten-Lakhs make 1 Crore.",
    "10-9": "Borrow: 1 Ten becomes 10 Ones.",
    "100-99": "Borrow: 1 Hundred becomes 10 Tens.",
    "1000-999": "Borrow: 1 Thousand becomes 10 Hundreds.",
    "10000-9999": "Borrow: 1 Ten-Thousand becomes 10 Thousands.",
    "100000-99999": "Borrow: 1 Lakh becomes 10 Ten-Thousands.",
    "1000000-999999": "Borrow: 1 Ten-Lakh becomes 10 Lakhs.",
    "10000000-9999999": "Borrow: 1 Crore becomes 10 Ten-Lakhs.",
  };
  return special[`${previous}-${next}`] || (next > previous ? `+1 ${getChangedPlaces(previous, next).join(" + ") || "number"}` : `−1 ${getChangedPlaces(previous, next).join(" + ") || "number"}`);
}

function getSpeedLabel(speed) {
  if (speed === 1) return "Normal";
  if (speed === 5) return "5×";
  if (speed === 10) return "10×";
  if (speed === 15) return "15×";
  if (speed === 20) return "20×";
  return "Rapid";
}

function getRollDuration(speed) {
  if (speed === 1) return 0.72;
  if (speed === 5) return 0.3;
  if (speed === 10) return 0.18;
  if (speed === 15) return 0.12;
  if (speed === 20) return 0.08;
  return 0.045;
}

function getModeTitle(mode) {
  const titles = {
    place: "Watch every place move.",
    read: "See it. Hear it. Say it.",
    carry: "Understand carry and borrow.",
  };
  return titles[mode] || titles.place;
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function placeLabelFromKey(key) {
  const aliases = {
    lakhTens: "Ten Lakh",
    lakhOnes: "Lakh",
    thousandTens: "Ten Thousand",
    thousandOnes: "Thousand",
  };
  const resolvedKey = aliases[key] ? PLACE_META.find((place) => place.label === aliases[key])?.key : key;
  const found = PLACE_META.find((place) => place.key === (resolvedKey || key));
  return found?.label || aliases[key] || key;
}

function getDifficultyRange(difficulty) {
  const ranges = {
    easy: [1, 100],
    medium: [100, 9999],
    hard: [10000, 99999],
    expert: [100000, 9999999],
    master: [10000000, 99999999],
    mixed: [1, 99999999],
  };
  return ranges[difficulty] || ranges.mixed;
}

function getPlaceValueQuestion(number, language = "en") {
  const candidates = PLACE_META.filter((place) => place.multiplier <= number || place.key === "ones");
  const place = candidates[getRandomNumber(0, candidates.length - 1)];
  const digit = Math.floor(number / place.multiplier) % 10;
  return {
    number,
    targetPlace: place.label,
    targetValue: digit * place.multiplier,
    targetDigit: digit,
    prompt: language === "hi" ? `${formatIndian(number)} में ${digit} का स्थान-मूल्य क्या है?` : `What is the value of ${digit} in ${formatIndian(number)}?`,
    options: Array.from(new Set([
      digit * place.multiplier,
      Math.max(0, digit * Math.max(1, place.multiplier / 10)),
      digit * place.multiplier * 10,
      digit,
    ])).filter((item) => Number.isFinite(item)).slice(0, 4),
  };
}

function createQuestion(mode, language, difficulty) {
  const [min, max] = getDifficultyRange(difficulty);
  const baseNumber = getRandomNumber(min, max);
  const words = language === "hi" ? indianNumberToHindiWords(baseNumber) : indianNumberToWords(baseNumber);

  if (mode === "number-to-words") {
    return {
      type: mode,
      number: baseNumber,
      prompt: language === "hi" ? "इस संख्या को शब्दों में लिखें" : "Write this number in words",
      display: formatIndian(baseNumber),
      answer: words,
    };
  }

  if (mode === "words-to-number") {
    return {
      type: mode,
      number: baseNumber,
      prompt: language === "hi" ? "इस संख्या को अंकों में लिखें" : "Write this number in digits",
      display: words,
      answer: baseNumber,
    };
  }

  if (mode === "place-value") {
    const question = getPlaceValueQuestion(baseNumber, language);
    return {
      type: mode,
      ...question,
      options: question.options.sort(() => Math.random() - 0.5),
      answer: question.targetValue,
    };
  }

  if (mode === "guess-place") {
    const digits = getDigits(baseNumber);
    const places = Object.entries(digits).filter(([, digit]) => digit !== 0);
    const [key, digit] = places[getRandomNumber(0, places.length - 1)] || ["ones", 1];
    const place = placeLabelFromKey(key === "lakhTens" || key === "lakhOnes" ? "lakh" : key === "thousandTens" || key === "thousandOnes" ? "thousand" : key);
    const options = Array.from(new Set([
      place,
      "Ones",
      "Tens",
      "Hundreds",
      "Thousand",
      "Lakh",
      "Crore",
    ])).slice(0, 5);
    return {
      type: mode,
      number: baseNumber,
      prompt: language === "hi" ? `अंक ${digit} किस स्थान पर है?` : `Which place contains the digit ${digit}?`,
      display: formatIndian(baseNumber),
      answer: place,
      options: options.sort(() => Math.random() - 0.5),
    };
  }

  if (mode === "carry") {
    const special = [9, 99, 999, 9999, 99999, 999999, 9999999];
    const start = special[getRandomNumber(0, special.length - 1)];
    const next = start + 1;
    const explanation = getLesson(start, next);
    const hindiExplanation = explanation
      .replace("Carry:", "ले जाने की प्रक्रिया:")
      .replace("Borrow:", "उधार:")
      .replace("Ones", "इकाई")
      .replace("Tens", "दहाई")
      .replace("Hundreds", "सैकड़ा")
      .replace("Thousand", "हज़ार")
      .replace("Ten Thousand", "दस हज़ार")
      .replace("Lakh", "लाख")
      .replace("Ten-Lakhs", "दस लाख")
      .replace("Ten-Lakh", "दस लाख")
      .replace("Crore", "करोड़")
      .replace("make 1", "मिलकर 1 बनाते हैं");
    const selectedExplanation = language === "hi" ? hindiExplanation : explanation;
    return {
      type: mode,
      number: next,
      display: `${formatIndian(start)} + 1`,
      prompt: language === "hi" ? "स्थान-मूल्य में क्या बदलाव हुआ?" : "What happened to the place values?",
      answer: selectedExplanation,
      options: language === "hi"
        ? [selectedExplanation, "संख्या उसी स्थान पर रही।", "10 इकाइयाँ 1 हज़ार बन गईं।", "1 सैकड़ा 1 इकाई बन गया।"].sort(() => Math.random() - 0.5)
        : [selectedExplanation, "The number stayed in the same place.", "10 Ones became 1 Thousand.", "1 Hundred became 1 One."].sort(() => Math.random() - 0.5),
    };
  }

  if (mode === "order") {
    const unique = [baseNumber];
    let guard = 0;
    while (unique.length < 3 && guard < 300) {
      const candidate = getRandomNumber(min, max);
      if (!unique.includes(candidate)) unique.push(candidate);
      guard += 1;
    }
    const sorted = [...unique].sort((a, b) => a - b);
    return {
      type: mode,
      display: unique,
      prompt: language === "hi" ? "संख्याओं को छोटी से बड़ी क्रम में चुनें।" : "Tap the numbers from smallest to largest.",
      answer: sorted,
      selected: [],
    };
  }

  if (mode === "compare") {
    const left = baseNumber;
    const right = getRandomNumber(min, max);
    const answer = left === right ? "=" : left > right ? ">" : "<";
    return {
      type: mode,
      display: [left, right],
      prompt: language === "hi" ? "सही चिन्ह चुनें।" : "Which sign makes the statement correct?",
      answer,
      options: ["<", ">", "="],
    };
  }

  return {
    type: "hear-type",
    number: baseNumber,
    display: words,
    prompt: language === "hi" ? "सुनें और संख्या अंकों में लिखें।" : "Listen, then type the number in digits.",
    answer: baseNumber,
  };
}

function makeChoice(question, answer) {
  if (question.type === "order") return Array.isArray(answer) && answer.join(",") === question.answer.join(",");
  if (question.type === "words-to-number" || question.type === "place-value") return Number(answer) === Number(question.answer);
  return normalizeText(answer) === normalizeText(question.answer);
}

const EN_UNIT_MAP = Object.fromEntries(EN_ONES.map((word, index) => [word.toLowerCase(), index]).filter(([word]) => word));
const EN_TENS_MAP = Object.fromEntries(EN_TENS.map((word, index) => [word.toLowerCase(), index * 10]).filter(([word]) => word));
const HI_UNIT_MAP = Object.fromEntries(Object.entries(HI_UNDER_100).map(([number, word]) => [normalizeHindi(word), Number(number)]).filter(([word]) => word));

function wordsToNumber(words, language) {
  const normalized = language === "hi" ? normalizeHindi(words) : normalizeText(words);
  if (!normalized) return null;
  const tokens = normalized.split(" ").filter(Boolean);
  let total = 0;
  let current = 0;
  const unitMap = language === "hi" ? HI_UNIT_MAP : { ...EN_UNIT_MAP, ...EN_TENS_MAP };
  const hundredWord = language === "hi" ? "सौ" : "hundred";
  const scaleMap = language === "hi"
    ? { "हज़ार": 1000, "लाख": 100000, "करोड़": 10000000 }
    : { thousand: 1000, lakh: 100000, crore: 10000000 };

  for (const token of tokens) {
    if (token === "and") continue;
    if (unitMap[token] !== undefined) {
      current += unitMap[token];
      continue;
    }
    if (token === hundredWord) {
      current = current === 0 ? 100 : current * 100;
      continue;
    }
    if (scaleMap[token]) {
      total += (current || 1) * scaleMap[token];
      current = 0;
      continue;
    }
    if (/^\d+$/.test(token)) {
      current += Number(token);
      continue;
    }
    return null;
  }
  const result = total + current;
  return Number.isFinite(result) ? result : null;
}

function DigitRoll({ digit, direction, duration, reducedMotion }) {
  return (
    <div className="digit-roll" aria-hidden="true">
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.span
          key={`${digit}-${direction}`}
          className="digit-face"
          custom={direction}
          initial={reducedMotion ? { y: 0, opacity: 1 } : { y: direction === "next" ? "105%" : "-105%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reducedMotion ? { y: 0, opacity: 0 } : { y: direction === "next" ? "-105%" : "105%", opacity: 0 }}
          transition={reducedMotion ? { duration: 0 } : { duration, ease: [0.22, 1, 0.36, 1] }}
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

function PlaceDigit({ label, digit, colorClass, active, direction, duration, reducedMotion }) {
  return (
    <motion.div
      className={`place-digit ${colorClass}${active ? " active" : ""}`}
      animate={active ? { y: -3 } : { y: 0 }}
      transition={{ duration: 0.2, ease: EASE }}
    >
      <span className="place-digit-label">{label}</span>
      <DigitRoll
        digit={digit}
        direction={direction}
        duration={duration}
        reducedMotion={reducedMotion}
      />
    </motion.div>
  );
}

function NumberDisplay({ value, previousValue, direction, speed, reducedMotion }) {
  const digits = getDigits(value);
  const previousDigits = getDigits(previousValue);
  const duration = getRollDuration(speed);
  const places = [
    { key: "crore", label: "Crore", value: digits.crore, previous: previousDigits.crore, colorClass: "place-red" },
    { key: "tenLakh", label: "Ten Lakh", value: digits.lakhTens, previous: previousDigits.lakhTens, colorClass: "place-rose" },
    { key: "lakh", label: "Lakh", value: digits.lakhOnes, previous: previousDigits.lakhOnes, colorClass: "place-pink" },
    { key: "tenThousand", label: "Ten Thousand", value: digits.thousandTens, previous: previousDigits.thousandTens, colorClass: "place-violet" },
    { key: "thousand", label: "Thousand", value: digits.thousandOnes, previous: previousDigits.thousandOnes, colorClass: "place-purple" },
    { key: "hundreds", label: "Hundreds", value: digits.hundreds, previous: previousDigits.hundreds, colorClass: "place-amber" },
    { key: "tens", label: "Tens", value: digits.tens, previous: previousDigits.tens, colorClass: "place-green" },
    { key: "ones", label: "Ones", value: digits.ones, previous: previousDigits.ones, colorClass: "place-blue" },
  ];

  return (
    <div
      className="main-number"
      aria-live="polite"
      aria-label={`${formatIndian(value)}, ${indianNumberToWords(value)}`}
    >
      {places.map((place, index) => (
        <span className="number-unit" key={place.key}>
          <PlaceDigit
            label={place.label}
            digit={place.value}
            colorClass={place.colorClass}
            active={place.value !== place.previous}
            direction={direction}
            duration={duration}
            reducedMotion={reducedMotion}
          />
          {index === 0 || index === 2 || index === 4 ? <Separator /> : null}
        </span>
      ))}
    </div>
  );
}

function Separator() {
  return <div className="group-separator">,</div>;
}

function Header({
  language,
  setLanguage,
  showLabSettings = false,
  speed = DEFAULT_SPEED,
  setSpeed = () => {},
  speechRate = DEFAULT_SPEECH_RATE,
  setSpeechRate = () => {},
  voiceName = "",
  setVoiceName = () => {},
  voices = [],
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);
  const gameRef = useRef(null);
  const controlsRef = useRef(null);

  useEffect(() => {
    if (!openMenu) return undefined;

    const handlePointerDown = (event) => {
      const inGame = gameRef.current?.contains(event.target);
      const inControls = controlsRef.current?.contains(event.target);

      if (!inGame && !inControls) {
        setOpenMenu(null);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenu]);

  const navigateTo = (path) => {
    navigate(path);
    setOpenMenu(null);
  };

  const isGame = location.pathname.startsWith("/game");
  const ui = getUiCopy(language);
  const localizedItems = getLocalizedGameItems(language);

  return (
    <header className="site-header">
      <Link
        to="/"
        className="brand-lockup"
        onClick={() => setOpenMenu(null)}
      >
        <span className="brand-mark">N</span>
        <span>
          <span className="brand-name">Number Lab</span>
          <span className="brand-meta">Indian Number System</span>
        </span>
      </Link>

      <div className="header-actions">
        <div className="dropdown-wrap" ref={gameRef}>
          <button
            type="button"
            className={`menu-button${openMenu === "game" ? " open" : ""}`}
            onClick={() =>
              setOpenMenu((current) =>
                current === "game" ? null : "game"
              )
            }
            aria-expanded={openMenu === "game"}
            aria-haspopup="menu"
          >
            <span>{ui.game}</span>
            <span className={`chevron${openMenu === "game" ? " open" : ""}`}>
              ⌄
            </span>
          </button>

          <AnimatePresence>
            {openMenu === "game" ? (
              <motion.div
                className="dropdown-menu game-menu"
                initial={{ opacity: 0, y: -7, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -7, scale: 0.985 }}
                transition={{ duration: 0.16, ease: EASE }}
                role="menu"
              >
                <div className="menu-title">{ui.practice}</div>

                {localizedItems.map(([path, title, hint]) => (
                  <button
                    key={path}
                    type="button"
                    role="menuitem"
                    className={`menu-item${
                      location.pathname === path ? " selected" : ""
                    }`}
                    onClick={() => navigateTo(path)}
                  >
                    <span>
                      <strong>{title}</strong>
                      <small>{hint}</small>
                    </span>

                    {location.pathname === path ? (
                      <span className="check">✓</span>
                    ) : null}
                  </button>
                ))}

                <div className="menu-divider" />

                <button
                  type="button"
                  role="menuitem"
                  className={`menu-item${!isGame ? " selected" : ""}`}
                  onClick={() => navigateTo("/")}
                >
                  <span>
                    <strong>{ui.numberLab}</strong>
                    <small>{ui.learnPlaceValue}</small>
                  </span>

                  {!isGame ? <span className="check">✓</span> : null}
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {showLabSettings ? (
          <div className="dropdown-wrap" ref={controlsRef}>
            <button
              type="button"
              className={`menu-button${openMenu === "controls" ? " open" : ""}`}
              onClick={() =>
                setOpenMenu((current) =>
                  current === "controls" ? null : "controls"
                )
              }
              aria-expanded={openMenu === "controls"}
              aria-haspopup="dialog"
            >
              <span>{ui.controls}</span>
              <span className={`chevron${openMenu === "controls" ? " open" : ""}`}>
                ⌄
              </span>
            </button>

            <AnimatePresence>
              {openMenu === "controls" ? (
                <motion.div
                  className="dropdown-menu settings-menu"
                  initial={{ opacity: 0, y: -7, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -7, scale: 0.985 }}
                  transition={{ duration: 0.16, ease: EASE }}
                  role="dialog"
                  aria-label="Number Lab controls"
                >
                  <div className="settings-section">
                    <div className="menu-title">{ui.language}</div>

                    <div className="settings-segmented">
                      <button
                        type="button"
                        className={language === "en" ? "active" : ""}
                        onClick={() => setLanguage("en")}
                      >
                        English
                      </button>

                      <button
                        type="button"
                        className={language === "hi" ? "active" : ""}
                        onClick={() => setLanguage("hi")}
                      >
                        हिंदी
                      </button>
                    </div>
                  </div>

                  <div className="settings-divider" />

                  <div className="settings-section">
                    <div className="menu-title">{language === "hi" ? "एनीमेशन गति" : "Animation Speed"}</div>

                    <div className="speed-options">
                      {SPEEDS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={speed === option ? "active" : ""}
                          onClick={() => setSpeed(option)}
                        >
                          {getSpeedLabel(option)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="settings-divider" />

                  <div className="settings-section">
                    <div className="menu-title">{ui.voice}</div>

                    <select
                      value={voiceName}
                      onChange={(event) => setVoiceName(event.target.value)}
                      aria-label="Voice"
                    >
                      <option value="">{ui.browserDefault}</option>
                      {voices.map((voice) => (
                        <option
                          key={`${voice.name}-${voice.lang}`}
                          value={voice.name}
                        >
                          {voice.name} · {voice.lang}
                        </option>
                      ))}
                    </select>

                    <div className="speech-row">
                      <span>Speech</span>

                      <input
                        type="range"
                        min="0.5"
                        max="1.25"
                        step="0.05"
                        value={speechRate}
                        onChange={(event) =>
                          setSpeechRate(Number(event.target.value))
                        }
                        aria-label="Speech speed"
                      />

                      <b>{speechRate.toFixed(2)}×</b>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        ) : (
          <div className="language-switch" aria-label="Language">
            <button
              type="button"
              className={language === "en" ? "active" : ""}
              onClick={() => setLanguage("en")}
            >
              EN
            </button>

            <button
              type="button"
              className={language === "hi" ? "active" : ""}
              onClick={() => setLanguage("hi")}
            >
              हिं
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function VoicePanel({ language, words, speechRate, setSpeechRate }) {
  const [voices, setVoices] = useState([]);
  const [voiceName, setVoiceName] = useState("");

  useEffect(() => {
    const load = () => {
      const available = window.speechSynthesis?.getVoices?.() || [];
      setVoices(available);
      if (!voiceName && available.length) {
        const preferred = available.find((voice) => voice.lang?.toLowerCase() === (language === "hi" ? "hi-in" : "en-in"));
        setVoiceName(preferred?.name || available.find((voice) => voice.lang?.toLowerCase().startsWith(language === "hi" ? "hi" : "en"))?.name || available[0].name);
      }
    };
    load();
    window.speechSynthesis?.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", load);
  }, [language, voiceName]);

  const suitableVoices = useMemo(() => {
    const prefix = language === "hi" ? "hi" : "en";
    const exact = voices.filter((voice) => voice.lang?.toLowerCase() === `${prefix}-in`);
    return exact.length ? exact : voices.filter((voice) => voice.lang?.toLowerCase().startsWith(prefix));
  }, [language, voices]);

  const speak = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(words);
    const selected = suitableVoices.find((voice) => voice.name === voiceName);
    if (selected) utterance.voice = selected;
    utterance.lang = selected?.lang || (language === "hi" ? "hi-IN" : "en-IN");
    utterance.rate = speechRate;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const stop = () => window.speechSynthesis?.cancel();

  return (
    <div className="voice-panel-inline">
      <div className="voice-copy">
        <span>Voice</span>
        <strong>{language === "hi" ? "हिंदी" : "English"}</strong>
      </div>
      <select value={voiceName} onChange={(event) => setVoiceName(event.target.value)} aria-label="Voice selection">
        {suitableVoices.length ? suitableVoices.map((voice) => <option key={`${voice.name}-${voice.lang}`} value={voice.name}>{voice.name} · {voice.lang}</option>) : <option value="">Browser default</option>}
      </select>
      <div className="voice-speed">
        <span>Speech</span>
        <input aria-label="Speech speed" type="range" min="0.5" max="1.25" step="0.05" value={speechRate} onChange={(event) => setSpeechRate(Number(event.target.value))} />
        <b>{speechRate.toFixed(2)}×</b>
      </div>
      <div className="voice-actions">
        <button onClick={speak}>🔊 Read</button>
        <button onClick={stop}>Stop</button>
      </div>
    </div>
  );
}

function SpeedControl({ speed, setSpeed }) {
  const index = SPEEDS.indexOf(speed);
  const adjust = (amount) => setSpeed(SPEEDS[Math.max(0, Math.min(SPEEDS.length - 1, index + amount))]);
  return (
    <div className="speed-bar">
      <div className="speed-copy">
        <span>Animation speed</span>
        <strong>{getSpeedLabel(speed)}</strong>
      </div>
      <div className="speed-control">
        <button className="speed-step" onClick={() => adjust(-1)} disabled={index <= 0}>−</button>
        <input type="range" min="0" max={SPEEDS.length - 1} step="1" value={index} onChange={(event) => setSpeed(SPEEDS[Number(event.target.value)])} aria-label="Animation speed" />
        <button className="speed-step" onClick={() => adjust(1)} disabled={index >= SPEEDS.length - 1}>+</button>
        <span className="speed-number">{speed.toFixed(2)}×</span>
      </div>
    </div>
  );
}

function PlaceValueGrid({ value, changedPlaces }) {
  const digits = getDigits(value);
  const values = {
    crore: digits.crore,
    tenLakh: digits.lakhTens,
    lakh: digits.lakhOnes,
    tenThousand: digits.thousandTens,
    thousand: digits.thousandOnes,
    hundreds: digits.hundreds,
    tens: digits.tens,
    ones: digits.ones,
  };

  return (
    <div className="place-grid">
      {PLACE_META.slice().reverse().map((place) => {
        const key = place.key;
        const active = changedPlaces.includes(place.label);
        return (
          <motion.div key={key} className={`place-card ${place.colorClass}${active ? " active" : ""}`} animate={active ? { y: -3 } : { y: 0 }}>
            <span>{place.label}</span>
            <strong>{values[key]}</strong>
            <small>{formatIndian(place.multiplier)}</small>
            <em>{place.hindi}</em>
          </motion.div>
        );
      })}
    </div>
  );
}

function NumberLab() {
  const reducedMotion = useReducedMotion();
  const [value, setValue] = useState(0);
  const [running, setRunning] = useState(false);
  const [direction, setDirection] = useState("next");
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const [language, setLanguage] = useState("en");
  const [speechRate, setSpeechRate] = useState(DEFAULT_SPEECH_RATE);
  const [voiceName, setVoiceName] = useState("");
  const [voices, setVoices] = useState([]);
  const [changedPlaces, setChangedPlaces] = useState([]);
  const [message, setMessage] = useState("Start at zero");
  const [previousValue, setPreviousValue] = useState(0);

  const timerRef = useRef(null);
  const highlightTimerRef = useRef(null);
  const valueRef = useRef(0);

  const words =
    language === "hi"
      ? indianNumberToHindiWords(value)
      : indianNumberToWords(value);

  const delay = Math.max(90, 1600 / speed);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    const load = () => {
      const available = window.speechSynthesis?.getVoices?.() || [];
      setVoices(available);
    };

    load();
    window.speechSynthesis?.addEventListener("voiceschanged", load);

    return () => {
      window.speechSynthesis?.removeEventListener("voiceschanged", load);
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(highlightTimerRef.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    const prefix = language === "hi" ? "hi" : "en";
    const current = voices.find((voice) => voice.name === voiceName);

    if (
      !current ||
      !current.lang?.toLowerCase().startsWith(prefix)
    ) {
      const preferred =
        voices.find(
          (voice) =>
            voice.lang?.toLowerCase() === `${prefix}-in`
        ) ||
        voices.find((voice) =>
          voice.lang?.toLowerCase().startsWith(prefix)
        );

      setVoiceName(preferred?.name || "");
    }
  }, [language, voiceName, voices]);

  const speakCurrentNumber = useCallback(() => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(words);
    const selected = voices.find((voice) => voice.name === voiceName);

    if (selected) {
      utterance.voice = selected;
    }

    utterance.lang =
      selected?.lang ||
      (language === "hi" ? "hi-IN" : "en-IN");

    utterance.rate = speechRate;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
  }, [language, speechRate, voiceName, voices, words]);

  const step = useCallback(
    (nextDirection) => {
      const current = valueRef.current;
      const target =
        nextDirection === "next"
          ? current + 1
          : current - 1;

      if (target < MIN || target > MAX) return;

      setDirection(nextDirection);
      setPreviousValue(current);
      setChangedPlaces(
        getChangedPlaces(current, target)
      );
      setMessage(getLesson(current, target));

      valueRef.current = target;
      setValue(target);

      clearTimeout(highlightTimerRef.current);

      highlightTimerRef.current = window.setTimeout(
        () => setChangedPlaces([]),
        reducedMotion ? 0 : Math.max(180, 700 / speed)
      );
    },
    [reducedMotion, speed],
  );

  useEffect(() => {
    clearTimeout(timerRef.current);

    if (!running) return undefined;

    if (valueRef.current >= MAX) {
      setRunning(false);
      return undefined;
    }

    timerRef.current = window.setTimeout(() => {
      step("next");
    }, delay);

    return () => clearTimeout(timerRef.current);
  }, [running, value, delay, step]);

  const start = () => {
    if (valueRef.current >= MAX) return;
    setRunning(true);
  };

  const stop = () => {
    clearTimeout(timerRef.current);
    setRunning(false);
  };

  const reset = () => {
    stop();
    clearTimeout(highlightTimerRef.current);
    window.speechSynthesis?.cancel();
    valueRef.current = 0;
    setValue(0);
    setPreviousValue(0);
    setChangedPlaces([]);
    setMessage("Start at zero");
    setDirection("next");
  };

  return (
    <div className="page number-lab-page">
      <Header
        language={language}
                showLabSettings
        speed={speed}
        setSpeed={setSpeed}
        speechRate={speechRate}
        setSpeechRate={setSpeechRate}
        voiceName={voiceName}
        setVoiceName={setVoiceName}
        voices={voices}
      />

      <main>
        <section className="hero hero-compact">
          <div className="eyebrow">Interactive learning lab</div>

          <h1>
            See the number.
            <br />
            <span>Understand the number.</span>
          </h1>

          <p>
            Learn Indian place value from Ones all the way to Crore.
          </p>
        </section>

        <section className="lab-card">
          <NumberDisplay
            value={value}
            previousValue={previousValue}
            direction={direction}
            speed={speed}
            reducedMotion={reducedMotion}
          />

          <PlaceValueGrid
            value={value}
            changedPlaces={changedPlaces}
          />

          <div className="pronunciation">
            <span className={language === "hi" ? "hindi-text" : ""}>
              {words}
            </span>

            <button
              type="button"
              onClick={speakCurrentNumber}
              aria-label="Read number aloud"
              title="Read number aloud"
            >
              🔊
            </button>
          </div>

          <div className="lesson-area">
            <span>What just happened?</span>
            <strong>{message}</strong>
            <small>
              {formatIndian(previousValue)} → {formatIndian(value)} ·{" "}
              {language === "hi"
                ? indianNumberToHindiWords(value)
                : words}
            </small>
          </div>

          <div className="controls">
            <button
              type="button"
              onClick={() => {
                stop();
                step("previous");
              }}
              disabled={value <= MIN}
            >
              ← Previous
            </button>

            <button
              type="button"
              className="primary"
              onClick={() => (running ? stop() : start())}
            >
              {running ? "Pause" : "Start"}
            </button>

            <button
              type="button"
              onClick={() => {
                stop();
                step("next");
              }}
              disabled={value >= MAX}
            >
              Next →
            </button>

            <button
              type="button"
              className="ghost"
              onClick={reset}
            >
              Go to 0
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

const GAME_STATES = {
  ANSWERING: "answering",
  CORRECT: "correct",
  WRONG: "wrong",
  TRANSITIONING: "transitioning",
  COMPLETE: "complete",
};

const TOTAL_QUESTIONS = 10;

const GAME_ITEMS = [
  ["/game/number-to-words", "Number → Words", "Write numbers as words"],
  ["/game/words-to-number", "Words → Number", "Convert words to digits"],
  ["/game/place-value", "Place Value Builder", "Find the value of a digit"],
  ["/game/guess-place", "Guess the Place", "Identify the place"],
  ["/game/carry", "Carry Challenge", "Understand regrouping"],
  ["/game/order", "Number Order", "Smallest to largest"],
  ["/game/compare", "Number Compare", "Choose <, > or ="],
  ["/game/hear-type", "Hear & Type", "Listen and type digits"],
];

const GAME_CONFIG = {
  "number-to-words": {
    gameType: "Number → Words",
    title: "Type the number in words",
    description: "Convert each Indian number into words.",
    prompt: "WRITE THIS NUMBER IN WORDS",
    answerType: "text",
    displayKind: "number",
    speak: "number",
    voiceLabel: "🔊 Hear Number",
    placeholder: "e.g. Twelve Lakh Thirty Four Thousand",
    inputLabel: "Type the number in words",
    voice: true,
  },
  "words-to-number": {
    gameType: "Words → Number",
    title: "Write the words as digits",
    description: "Convert the words back into digits.",
    prompt: "WRITE THIS NUMBER IN DIGITS",
    answerType: "text",
    displayKind: "words",
    speak: "display",
    voiceLabel: "🔊 Hear it",
    placeholder: "e.g. 7,34,22,435",
    inputLabel: "Type the number in digits",
    voice: true,
  },
  "hear-type": {
    gameType: "Hear & Type",
    title: "Listen, then type",
    description: "Hear the number and type it in digits.",
    prompt: "LISTEN, THEN TYPE THE NUMBER",
    answerType: "text",
    displayKind: "words",
    speak: "display",
    voiceLabel: "🔊 Hear it",
    placeholder: "e.g. 12,34,567",
    inputLabel: "Type the number you hear",
    voice: true,
    autoSpeak: true,
  },
  "place-value": {
    gameType: "Place Value Builder",
    title: "Find the value of a digit",
    description: "Work out what a single digit is worth.",
    prompt: "Answer the question",
    answerType: "choice",
    displayKind: "number",
    voice: false,
  },
  "guess-place": {
    gameType: "Guess the Place",
    title: "Name the place",
    description: "Identify which place a digit belongs to.",
    prompt: "Answer the question",
    answerType: "choice",
    displayKind: "number",
    voice: false,
  },
  "carry": {
    gameType: "Carry Challenge",
    title: "Catch the carry",
    description: "See what changes when a place reaches ten.",
    prompt: "Answer the question",
    answerType: "choice",
    displayKind: "number",
    voice: false,
  },
  order: {
    gameType: "Number Order",
    title: "Order the numbers",
    description: "Build the order from smallest to largest.",
    prompt: "Tap the numbers, smallest first",
    answerType: "order",
    displayKind: "list",
    voice: false,
  },
  compare: {
    gameType: "Number Compare",
    title: "Compare the two numbers",
    description: "Use place value to choose the right sign.",
    prompt: "Choose the right sign",
    answerType: "choice",
    displayKind: "list",
    voice: false,
  },
};

const EMPTY_ORDER = [];

const GAME_COPY = {
  "number-to-words": {
    en: {
      gameType: "Number → Words",
      title: "Type the number in words",
      description: "Convert each Indian number into words.",
      prompt: "Write this number in words",
      voiceLabel: "🔊 Hear Number",
      placeholder: "e.g. Twelve Lakh Thirty Four Thousand",
      inputLabel: "Type the number in words",
    },
    hi: {
      gameType: "संख्या → शब्द",
      title: "संख्या को शब्दों में लिखें",
      description: "हर भारतीय संख्या को सही शब्दों में बदलें।",
      prompt: "इस संख्या को शब्दों में लिखें",
      voiceLabel: "🔊 संख्या सुनें",
      placeholder: "जैसे: बारह लाख चौंतीस हज़ार",
      inputLabel: "संख्या को शब्दों में लिखें",
    },
  },
  "words-to-number": {
    en: {
      gameType: "Words → Number",
      title: "Write the words as digits",
      description: "Convert the words back into digits.",
      prompt: "Write this number in digits",
      voiceLabel: "🔊 Hear it",
      placeholder: "e.g. 7,34,22,435",
      inputLabel: "Type the number in digits",
    },
    hi: {
      gameType: "शब्द → संख्या",
      title: "शब्दों को अंकों में लिखें",
      description: "दिए गए शब्दों को वापस अंकों में बदलें।",
      prompt: "इस संख्या को अंकों में लिखें",
      voiceLabel: "🔊 सुनें",
      placeholder: "जैसे: 7,34,22,435",
      inputLabel: "संख्या को अंकों में लिखें",
    },
  },
  "hear-type": {
    en: {
      gameType: "Hear & Type",
      title: "Listen, then type",
      description: "Hear the number and type it in digits.",
      prompt: "Listen, then type the number",
      voiceLabel: "🔊 Hear it",
      placeholder: "e.g. 12,34,567",
      inputLabel: "Type the number you hear",
    },
    hi: {
      gameType: "सुनें और लिखें",
      title: "सुनें, फिर लिखें",
      description: "संख्या सुनें और उसे अंकों में लिखें।",
      prompt: "सुनें और संख्या अंकों में लिखें",
      voiceLabel: "🔊 सुनें",
      placeholder: "जैसे: 12,34,567",
      inputLabel: "सुनी हुई संख्या लिखें",
    },
  },
  "place-value": {
    en: {
      gameType: "Place Value Builder",
      title: "Find the value of a digit",
      description: "Work out what a single digit is worth.",
    },
    hi: {
      gameType: "स्थान-मूल्य",
      title: "अंक का स्थान-मूल्य खोजें",
      description: "जानें कि किसी अंक का सही स्थान-मूल्य क्या है।",
    },
  },
  "guess-place": {
    en: {
      gameType: "Guess the Place",
      title: "Name the place",
      description: "Identify which place a digit belongs to.",
    },
    hi: {
      gameType: "स्थान पहचानें",
      title: "स्थान बताइए",
      description: "पहचानें कि दिया गया अंक किस स्थान पर है।",
    },
  },
  "carry": {
    en: {
      gameType: "Carry Challenge",
      title: "Catch the carry",
      description: "See what changes when a place reaches ten.",
    },
    hi: {
      gameType: "कैरी चुनौती",
      title: "कैरी को समझें",
      description: "जानें कि किसी स्थान पर दस होने पर क्या बदलता है।",
    },
  },
  order: {
    en: {
      gameType: "Number Order",
      title: "Order the numbers",
      description: "Build the order from smallest to largest.",
    },
    hi: {
      gameType: "संख्या क्रम",
      title: "संख्याओं को क्रम में लगाएँ",
      description: "संख्याओं को सबसे छोटी से सबसे बड़ी तक लगाएँ।",
    },
  },
  compare: {
    en: {
      gameType: "Number Compare",
      title: "Compare the two numbers",
      description: "Use place value to choose the right sign.",
    },
    hi: {
      gameType: "संख्या तुलना",
      title: "दो संख्याओं की तुलना करें",
      description: "स्थान-मूल्य का उपयोग करके सही चिन्ह चुनें।",
    },
  },
};

const UI_COPY = {
  en: {
    game: "Game",
    practice: "Practice",
    numberLab: "Number Lab",
    learnPlaceValue: "Learn place value",
    controls: "Controls",
    language: "Language",
    english: "English",
    hindi: "हिंदी",
    difficulty: "Difficulty",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    expert: "Expert",
    master: "Master",
    mixed: "Mixed",
    voice: "Voice",
    browserDefault: "Browser default",
    speechSpeed: "Speech speed",
    score: "Score",
    correct: "correct",
    streak: "streak",
    resetScore: "{getUiCopy(language).resetScore}",
    nextQuestion: "Next Question →",
    checkAnswer: "Check Answer",
    tapSmallest: "Tap from smallest to largest",
    correctTitle: "✓ Correct",
    wrongTitle: "✕ You’re wrong",
    excellent: "Excellent!",
    yourAnswer: "Your answer",
    correctAnswer: "Correct answer",
    why: "Why",
    scoreCanGoNegative: "score can go negative",
    gameComplete: "Game complete",
    points: "points",
    accuracy: "accuracy",
    wrong: "wrong",
    bestStreak: "Best streak",
    playAgain: "{getUiCopy(language).playAgain}",
    backToLab: "{getUiCopy(language).backToLab}",
    chooseAnother: "Choose another game",
  },
  hi: {
    game: "गेम",
    practice: "अभ्यास",
    numberLab: "नंबर लैब",
    learnPlaceValue: "स्थान-मूल्य सीखें",
    controls: "कंट्रोल",
    language: "भाषा",
    english: "English",
    hindi: "हिंदी",
    difficulty: "कठिनाई",
    easy: "आसान",
    medium: "मध्यम",
    hard: "कठिन",
    expert: "विशेषज्ञ",
    master: "मास्टर",
    mixed: "मिश्रित",
    voice: "आवाज़",
    browserDefault: "ब्राउज़र डिफ़ॉल्ट",
    speechSpeed: "बोलने की गति",
    score: "स्कोर",
    correct: "सही",
    streak: "लगातार",
    resetScore: "स्कोर रीसेट",
    nextQuestion: "अगला प्रश्न →",
    checkAnswer: "उत्तर जाँचें",
    tapSmallest: "सबसे छोटी संख्या से चुनें",
    correctTitle: "✓ सही",
    wrongTitle: "✕ आपका उत्तर गलत है",
    excellent: "बहुत बढ़िया!",
    yourAnswer: "आपका उत्तर",
    correctAnswer: "सही उत्तर",
    why: "क्यों",
    scoreCanGoNegative: "स्कोर नकारात्मक हो सकता है",
    gameComplete: "गेम पूरा",
    points: "अंक",
    accuracy: "सटीकता",
    wrong: "गलत",
    bestStreak: "सबसे लंबी लगातार श्रृंखला",
    playAgain: "फिर खेलें",
    backToLab: "नंबर लैब पर जाएँ",
    chooseAnother: "दूसरा गेम चुनें",
  },
};

const GAME_MENU_COPY = {
  en: {
    "number-to-words": ["Number → Words", "Write numbers as words"],
    "words-to-number": ["Words → Number", "Convert words to digits"],
    "place-value": ["Place Value Builder", "Find the value of a digit"],
    "guess-place": ["Guess the Place", "Identify the place"],
    carry: ["Carry Challenge", "Understand regrouping"],
    order: ["Number Order", "Smallest to largest"],
    compare: ["Number Compare", "Choose <, > or ="],
    "hear-type": ["Hear & Type", "Listen and type digits"],
  },
  hi: {
    "number-to-words": ["संख्या → शब्द", "संख्या को शब्दों में लिखें"],
    "words-to-number": ["शब्द → संख्या", "शब्दों को अंकों में बदलें"],
    "place-value": ["स्थान-मूल्य", "अंक का मान खोजें"],
    "guess-place": ["स्थान पहचानें", "अंक का स्थान बताएं"],
    carry: ["कैरी चुनौती", "पुनर्गठन को समझें"],
    order: ["संख्या क्रम", "छोटी से बड़ी"],
    compare: ["संख्या तुलना", "<, > या = चुनें"],
    "hear-type": ["सुनें और लिखें", "सुनकर संख्या लिखें"],
  },
};

function getGameCopy(mode, language) {
  return GAME_COPY[mode]?.[language] || GAME_COPY[mode]?.en || GAME_COPY["number-to-words"].en;
}

function getUiCopy(language) {
  return UI_COPY[language] || UI_COPY.en;
}

function getLocalizedGameItems(language) {
  const source = GAME_MENU_COPY[language] || GAME_MENU_COPY.en;
  return GAME_ITEMS.map(([path]) => {
    const mode = path.split("/").pop();
    const [title, hint] = source[mode] || GAME_MENU_COPY.en[mode];
    return [path, title, hint];
  });
}

function getDifficultyLabel(difficulty, language) {
  return getUiCopy(language)[difficulty] || difficulty;
}

function getQuestionPrompt(question, language) {
  if (language === "hi") {
    const prompts = {
      "number-to-words": "इस संख्या को शब्दों में लिखें",
      "words-to-number": "इस संख्या को अंकों में लिखें",
      "hear-type": "सुनें और संख्या अंकों में लिखें",
      "place-value": "इस अंक का स्थान-मूल्य बताइए",
      "guess-place": `अंक ${question.targetDigit ?? ""} किस स्थान पर है?`,
      carry: "स्थान-मूल्य में क्या बदलाव हुआ?",
      order: "संख्याओं को छोटी से बड़ी क्रम में चुनें।",
      compare: "सही चिन्ह चुनें।",
    };
    return prompts[question.type] || question.prompt;
  }

  return question.prompt;
}

function translatePlaceLabel(label, language) {
  if (language !== "hi") return label;
  return PLACE_META.find((place) => place.label === label)?.hindi || label;
}

function getLocalizedOption(question, option, language) {
  if (language !== "hi") return option;
  if (question.type === "guess-place") return translatePlaceLabel(option, language);
  if (question.type === "carry") {
    const map = {
      "The number stayed in the same place.": "संख्या उसी स्थान पर रही।",
      "10 Ones became 1 Thousand.": "10 इकाइयाँ 1 हज़ार बन गईं।",
      "1 Hundred became 1 One.": "1 सैकड़ा 1 इकाई बन गया।",
    };
    return map[option] || option;
  }
  return option;
}

let questionCounter = 0;

function makeQuestionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  questionCounter += 1;
  return `q-${Date.now().toString(36)}-${questionCounter}`;
}

function buildQuestion(mode, language, difficulty, generation = 0) {
  let next = createQuestion(mode, language, difficulty);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const signature = JSON.stringify(next.display ?? next.number ?? next);
    const previous = buildQuestion.lastSignature;
    if (!previous || previous !== signature || attempt === 4) break;
    next = createQuestion(mode, language, difficulty);
  }
  buildQuestion.lastSignature = JSON.stringify(next.display ?? next.number ?? next);
  return { ...next, id: `g${generation}-${makeQuestionId()}` };
}

function normalizeNumberInput(raw) {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  if (!/^\d[\d,\s]*$/.test(value)) return null;
  if (value.includes(",")) {
    const groups = value.split(",").map((part) => part.trim());
    if (groups.some((part) => part === "" || !/^\d+$/.test(part))) return null;
    if (groups[0].length > 3) return null;
    if (groups.slice(1).some((part) => part.length < 1 || part.length > 3)) return null;
  }
  const compact = value.replace(/[\s,]/g, "");
  const parsed = Number(compact);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function evaluateAnswer(config, question, answer, selectedOrder, language) {
  if (config.answerType === "choice" && !String(answer).trim()) return false;
  if (config.answerType === "text" && !String(answer).trim()) return false;
  if (config.answerType === "order") {
    if (selectedOrder.length !== question.answer.length) return false;
    return selectedOrder.join(",") === question.answer.join(",");
  }
  if (question.type === "number-to-words") {
    const left = language === "hi" ? normalizeHindi(answer) : normalizeText(answer);
    const right = language === "hi" ? normalizeHindi(question.answer) : normalizeText(question.answer);
    return left === right;
  }
  if (question.type === "words-to-number" || question.type === "hear-type") {
    const parsed = normalizeNumberInput(answer);
    if (parsed !== null) return parsed === question.answer;
    if (!/[^\d,\s]/.test(answer)) return false;
    const asWords = wordsToNumber(answer, language);
    return asWords !== null && asWords === question.answer;
  }
  return makeChoice(question, answer);
}

function answerDisplayOf(question, language) {
  const value = question.answer;
  if (Array.isArray(value)) return value.map(formatIndian).join("  →  ");
  if (question.type === "words-to-number" || question.type === "hear-type" || question.type === "place-value") {
    return formatIndian(value);
  }
  if (question.type === "number-to-words") {
    return language === "hi" ? indianNumberToHindiWords(question.number) : indianNumberToWords(question.number);
  }
  return String(value);
}

function explainQuestion(question, language = "en") {
  const type = question.type;

  if (type === "number-to-words" || type === "words-to-number" || type === "hear-type") {
    const number = question.number;
    const crore = Math.floor(number / 10000000);
    const lakh = Math.floor(number / 100000) % 100;
    const thousand = Math.floor(number / 1000) % 100;
    const rest = number % 1000;
    const parts = [];

    if (language === "hi") {
      if (crore) parts.push(`${formatIndian(crore)} करोड़ समूह है।`);
      if (lakh) parts.push(`${formatIndian(lakh)} लाख समूह है।`);
      if (thousand) parts.push(`${formatIndian(thousand)} हज़ार समूह है।`);
      if (rest) parts.push(`${formatIndian(rest)} सैकड़ा, दहाई और इकाई का समूह है।`);
    } else {
      if (crore) parts.push(`${formatIndian(crore)} is the Crore group.`);
      if (lakh) parts.push(`${formatIndian(lakh)} is the Lakh group.`);
      if (thousand) parts.push(`${formatIndian(thousand)} is the Thousand group.`);
      if (rest) parts.push(`${formatIndian(rest)} is the Hundreds, Tens and Ones group.`);
    }

    return parts.join(" ");
  }

  if (type === "place-value") {
    return language === "hi"
      ? `${question.targetDigit} ${translatePlaceLabel(question.targetPlace, language)} स्थान पर है, इसलिए इसका मान ${formatIndian(question.targetValue)} है।`
      : `${question.targetDigit} sits in the ${question.targetPlace} place, so it is worth ${formatIndian(question.targetValue)}.`;
  }

  if (type === "guess-place") {
    return language === "hi"
      ? `${translatePlaceLabel(question.answer, language)} वह स्थान है जहाँ यह अंक है।`
      : `${question.answer} is the place where that digit lives.`;
  }

  if (type === "compare") {
    return `${formatIndian(question.display[0])} ${question.answer} ${formatIndian(question.display[1])}.`;
  }

  if (type === "order") {
    return language === "hi"
      ? `सबसे छोटी संख्या पहले: ${question.answer.map(formatIndian).join(" → ")}।`
      : `Smallest first: ${question.answer.map(formatIndian).join(" → ")}.`;
  }

  return "";
}

function useVoice({ language, rate, voiceName }) {
  const [voices, setVoices] = useState([]);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    const load = () => setVoices(window.speechSynthesis?.getVoices?.() || []);
    load();
    window.speechSynthesis?.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", load);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  useEffect(() => stop, [stop]);

  const suitableVoices = useMemo(() => {
    const prefix = language === "hi" ? "hi" : "en";
    const exact = voices.filter((voice) => voice.lang?.toLowerCase() === `${prefix}-in`);
    if (exact.length) return exact;
    const loose = voices.filter((voice) => voice.lang?.toLowerCase().startsWith(prefix));
    return loose.length ? loose : voices;
  }, [language, voices]);

  const activeVoice = useMemo(() => {
    if (voiceName) return voices.find((voice) => voice.name === voiceName) || null;
    const target = language === "hi" ? "hi-in" : "en-in";
    return (
      voices.find((voice) => voice.lang?.toLowerCase() === target) ||
      voices.find((voice) => voice.lang?.toLowerCase().startsWith(language === "hi" ? "hi" : "en")) ||
      null
    );
  }, [language, voiceName, voices]);

  const speak = useCallback(
    (text) => {
      if (!window.speechSynthesis || !text) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const target = language === "hi" ? "hi-IN" : "en-IN";
      if (activeVoice) utterance.voice = activeVoice;
      utterance.lang = activeVoice?.lang || target;
      utterance.rate = rate;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    },
    [activeVoice, language, rate],
  );

  return { voices, suitableVoices, speak, stop, speaking };
}

function useGameSession({ mode, language, difficulty, config }) {
  const configKey = `${mode}|${language}|${difficulty}`;
  const [seed, setSeed] = useState(0);
  const [progress, setProgress] = useState({ key: configKey, number: 1, phase: "playing" });
  const [answerState, setAnswerState] = useState({ id: null, value: "", order: [] });
  const [resultState, setResultState] = useState({ id: null, outcome: null });
  const [tally, setTally] = useState({ key: configKey, score: 0, streak: 0, best: 0, correct: 0, wrong: 0 });
  const [transitioning, setTransitioning] = useState(false);
  const transitionTimer = useRef(null);
  const inputRef = useRef(null);

  const question = useMemo(() => buildQuestion(mode, language, difficulty, seed), [mode, language, difficulty, seed]);

  const activeProgress = progress.key === configKey ? progress : { key: configKey, number: 1, phase: "playing" };
  const submitted = resultState.id === question.id;
  const outcome = submitted ? resultState.outcome : null;
  const answer = answerState.id === question.id ? answerState.value : "";
  const selectedOrder = answerState.id === question.id ? answerState.order : EMPTY_ORDER;

  const gameState = activeProgress.phase === "complete"
    ? GAME_STATES.COMPLETE
    : transitioning
      ? GAME_STATES.TRANSITIONING
      : submitted
        ? outcome === "correct"
          ? GAME_STATES.CORRECT
          : GAME_STATES.WRONG
        : GAME_STATES.ANSWERING;

  const sessionTally = tally.key === configKey
    ? tally
    : { key: configKey, score: 0, streak: 0, best: 0, correct: 0, wrong: 0 };

  useEffect(() => () => clearTimeout(transitionTimer.current), []);

  const setAnswer = useCallback((value) => {
    setAnswerState((current) => (current.id === question.id ? { ...current, value } : { id: question.id, value, order: [] }));
  }, [question.id]);

  const setSelectedOrder = useCallback((order) => {
    setAnswerState((current) => ({ id: question.id, value: current.id === question.id ? current.value : "", order }));
  }, [question.id]);

  const check = useCallback(() => {
    if (submitted || transitioning || activeProgress.phase !== "playing") return;
    const isCorrect = evaluateAnswer(config, question, answer, selectedOrder, language);
    setResultState({ id: question.id, outcome: isCorrect ? "correct" : "wrong" });
    setTally((current) => {
      const base = current.key === configKey
        ? current
        : { key: configKey, score: 0, streak: 0, best: 0, correct: 0, wrong: 0 };
      if (isCorrect) {
        const streak = base.streak + 1;
        return {
          ...base,
          score: base.score + 10,
          streak,
          best: Math.max(base.best, streak),
          correct: base.correct + 1,
        };
      }
      return { ...base, score: base.score - 5, streak: 0, wrong: base.wrong + 1 };
    });
    return isCorrect;
  }, [activeProgress.phase, answer, config, configKey, language, question, selectedOrder, submitted, transitioning]);

  const finishTransition = useCallback(() => {
    clearTimeout(transitionTimer.current);
    setTransitioning(false);
  }, []);

  const next = useCallback(() => {
    if (!submitted || transitioning) return;
    if (activeProgress.number >= TOTAL_QUESTIONS) {
      setProgress((current) => ({ key: configKey, number: current.key === configKey ? current.number : TOTAL_QUESTIONS, phase: "complete" }));
      return;
    }
    setTransitioning(true);
    setProgress((current) => {
      const base = current.key === configKey ? current : { key: configKey, number: 1, phase: "playing" };
      return { ...base, number: base.number + 1 };
    });
    setSeed((value) => value + 1);
    setAnswerState({ id: null, value: "", order: [] });
    setResultState({ id: null, outcome: null });
    clearTimeout(transitionTimer.current);
    transitionTimer.current = setTimeout(() => setTransitioning(false), 900);
  }, [activeProgress.number, configKey, submitted, transitioning]);

  const restart = useCallback(() => {
    clearTimeout(transitionTimer.current);
    setTransitioning(false);
    setProgress({ key: configKey, number: 1, phase: "playing" });
    setTally({ key: configKey, score: 0, streak: 0, best: 0, correct: 0, wrong: 0 });
    setAnswerState({ id: null, value: "", order: [] });
    setResultState({ id: null, outcome: null });
    setSeed((value) => value + 1);
  }, [configKey]);

  const resetScore = useCallback(() => {
    setTally((current) => ({ ...current, score: 0, streak: 0 }));
  }, []);

  return {
    config,
    question,
    gameState,
    answer,
    setAnswer,
    selectedOrder,
    setSelectedOrder,
    submitted,
    outcome,
    score: sessionTally.score,
    streak: sessionTally.streak,
    bestStreak: sessionTally.best,
    correctCount: sessionTally.correct,
    wrongCount: sessionTally.wrong,
    questionNumber: activeProgress.number,
    totalQuestions: TOTAL_QUESTIONS,
    check,
    next,
    restart,
    resetScore,
    finishTransition,
    inputRef,
  };
}

function ScorePanel({ score, correct, total, streak, tone, language = "en" }) {
  const reducedMotion = useReducedMotion();
  const ui = getUiCopy(language);
  const up = tone === "up";
  const initial = reducedMotion
    ? false
    : {
        y: tone ? (up ? 10 : -10) : 8,
        opacity: 0,
        color: tone ? (up ? "#4ade80" : "#f87171") : "#f7f7f7",
      };
  return (
    <aside className="score-panel" aria-live="polite">
      <span className="score-kicker">{ui.score}</span>
      <strong className="score-value">
        <motion.span
          key={score}
          initial={initial}
          animate={{ y: 0, opacity: 1, color: "#f7f7f7" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {score}
        </motion.span>
      </strong>
      <small>
        {correct} / {total} correct · streak {streak}
      </small>
    </aside>
  );
}

function GameHeader({ config, language }) {
  const ui = getUiCopy(language);
  return (
    <div className="game-hero">
      <div className="game-hero-copy">
        <div className="eyebrow">{config.gameType}</div>
        <h1>{config.title}</h1>
        <p>{config.description}</p>
      </div>
    </div>
  );
}

function VoiceButton({ speaking, label, onSpeak, onStop }) {
  return (
    <button
      type="button"
      className={`voice-btn${speaking ? " speaking" : ""}`}
      onClick={speaking ? onStop : onSpeak}
      title={speaking ? "Stop audio" : label.replace("🔊 ", "")}
      aria-label={speaking ? "Stop audio" : label.replace("🔊 ", "")}
    >
      {speaking ? "■ Stop" : label}
    </button>
  );
}

function VoiceSettings({ open, onToggle, onClose, language, suitableVoices, voiceName, setVoiceName, rate, setRate }) {
  const wrapRef = useRef(null);
  const ui = getUiCopy(language);

  useEffect(() => {
    if (!open) return undefined;

    const onPointer = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) onClose();
    };

    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div className="voice-settings" ref={wrapRef}>
      <button
        type="button"
        className="voice-settings-btn"
        onClick={onToggle}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {ui.voice}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="voice-pop"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: EASE }}
            role="dialog"
            aria-label={ui.voice}
          >
            <div className="voice-pop-heading">
              <span>{ui.voice}</span>
              <strong>{language === "hi" ? "हिंदी" : "English"}</strong>
            </div>

            <div className="voice-pop-row">
              <span>{ui.voice}</span>
              <select value={voiceName} onChange={(event) => setVoiceName(event.target.value)} aria-label={ui.voice}>
                <option value="">{ui.browserDefault}</option>
                {suitableVoices.map((voice) => (
                  <option key={`${voice.name}-${voice.lang}`} value={voice.name}>
                    {voice.name} · {voice.lang}
                  </option>
                ))}
              </select>
            </div>

            <div className="voice-pop-row">
              <span>{ui.speechSpeed}</span>
              <div className="rate-pills">
                {[0.6, 0.8, 1, 1.2].map((value) => (
                  <button
                    type="button"
                    key={value}
                    className={Number(rate) === value ? "active" : ""}
                    onClick={() => setRate(value)}
                  >
                    {value.toFixed(1)}×
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GameControls({ mode, config, language, difficulty, setDifficulty, voiceSlot }) {
  const isTextPair = mode === "number-to-words" || mode === "words-to-number";
  const ui = getUiCopy(language);
  return (
    <div className="game-toolbar">
      <div className="segmented">
        {isTextPair ? (
          <>
            <Link className={mode === "number-to-words" ? "active" : ""} to="/game/number-to-words">
              {language === "hi" ? "संख्या → शब्द" : "Number → Words"}
            </Link>
            <Link className={mode === "words-to-number" ? "active" : ""} to="/game/words-to-number">
              {language === "hi" ? "शब्द → संख्या" : "Words → Number"}
            </Link>
          </>
        ) : (
          <span className="seg-chip">{config.gameType}</span>
        )}
      </div>

      <div className="game-settings">
        <label className="sr-field">
          <span>{ui.difficulty}</span>
          <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} aria-label={ui.difficulty}>
            <option value="easy">{ui.easy}</option>
            <option value="medium">{ui.medium}</option>
            <option value="hard">{ui.hard}</option>
            <option value="expert">{ui.expert}</option>
            <option value="master">{ui.master}</option>
            <option value="mixed">{ui.mixed}</option>
          </select>
        </label>
        {voiceSlot}
      </div>
    </div>
  );
}

function QuestionStage({ mode, config, question, language, reducedMotion, gameState, onPick, selectedOrder, answer, locked, answered, voice }) {
  const isText = config.answerType === "text";
  const rawDisplay = question.display ?? (question.number != null ? formatIndian(question.number) : "");
  const isWords = config.displayKind === "words";
  const isCompare = config.displayKind === "list" && question.type === "compare";
  const showValue = config.displayKind !== "list" || isCompare;
  const frozen = locked || answered;
  const heroReact =
    gameState === GAME_STATES.CORRECT && !reducedMotion
      ? { scale: [1, 1.025, 1], color: ["#fff", "#4ade80", "#fff"] }
      : gameState === GAME_STATES.WRONG && !reducedMotion
        ? { x: [0, -6, 6, -4, 4, 0], color: ["#fff", "#f87171", "#fff"] }
        : { scale: 1, x: 0, color: "#fff" };
  const heroTransition =
    gameState === GAME_STATES.CORRECT || gameState === GAME_STATES.WRONG
      ? { duration: gameState === GAME_STATES.WRONG ? 0.42 : 0.5, ease: "easeOut" }
      : { duration: 0.45, ease: [0.22, 1, 0.36, 1] };

  return (
    <div className="question-stage">
      {isText ? <span className="q-label">{config.prompt}</span> : <p className="q-question">{getQuestionPrompt(question, language)}</p>}

      {showValue || config.voice ? (
        <div className="q-value-wrap">
          {isCompare ? (
            <motion.div className="q-list" animate={heroReact} transition={heroTransition}>
              <span>{formatIndian(question.display[0])}</span>
              <i>?</i>
              <span>{formatIndian(question.display[1])}</span>
            </motion.div>
          ) : isWords ? (
            <motion.p
              className={`q-words${language === "hi" ? " hindi" : ""}`}
              animate={heroReact}
              transition={heroTransition}
            >
              {rawDisplay}
            </motion.p>
          ) : showValue ? (
            <motion.p
              className="q-value"
              initial={reducedMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0, ...heroReact }}
              transition={heroTransition}
            >
              {rawDisplay}
            </motion.p>
          ) : null}
          {config.voice ? voice : null}
        </div>
      ) : null}

      {config.answerType === "choice" ? (
        <div className="choice-grid">
          {question.options.map((option) => (
            <button
              type="button"
              key={String(option)}
              className={String(option) === String(answer) ? "selected" : ""}
              onClick={() => onPick(String(option))}
              disabled={frozen}
            >
              {getLocalizedOption(question, option, language)}
            </button>
          ))}
        </div>
      ) : null}

      {config.answerType === "order" ? (
        <div className="order-area">
          <div className="order-answer">
            {selectedOrder.length ? (
              selectedOrder.map((value, index) => (
                <span key={`${value}-${index}`}>
                  {index + 1}. {formatIndian(value)}
                </span>
              ))
            ) : (
              <small>{getUiCopy(language).tapSmallest}</small>
            )}
          </div>
          <div className="order-options">
            {question.display.map((value, index) => (
              <button type="button" key={`${value}-${index}`} onClick={() => onPick(value)} disabled={frozen || selectedOrder.includes(value)}>
                {formatIndian(value)}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AnswerFeedback({ state, question, streak, correctAnswer, yourAnswer, language = "en" }) {
  const answered = state === GAME_STATES.CORRECT || state === GAME_STATES.WRONG;
  const isCorrect = state === GAME_STATES.CORRECT;
  const explanation = answered && !isCorrect ? explainQuestion(question, language) : "";
  const correctNote = answered && isCorrect ? explainQuestion(question, language) : "";
  const showExplanation = explanation && explanation !== correctAnswer;
  const contentKey = answered ? `${state}-${question.id}` : "idle";

  return (
    <div className="game-feedback" data-state={state} aria-live="polite">
      <motion.div
        key={contentKey}
        className="fb-inner"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {!answered ? (
          <span className="fb-hint">+10 {getUiCopy(language).correct} · −5 {getUiCopy(language).wrong} · {getUiCopy(language).streak} {streak} · {getUiCopy(language).scoreCanGoNegative}</span>
        ) : isCorrect ? (
          <>
            <strong className="fb-title">{getUiCopy(language).correctTitle}</strong>
            <span className="fb-delta">+10</span>
            <span className="fb-note">{correctNote || getUiCopy(language).excellent}</span>
          </>
        ) : (
          <>
            <strong className="fb-title">{getUiCopy(language).wrongTitle}</strong>
            <span className="fb-delta">−5</span>
            {yourAnswer ? (
              <span className="fb-yours">
                {getUiCopy(language).yourAnswer}: <b>{yourAnswer}</b>
              </span>
            ) : null}
            <span className="fb-correct">
              {getUiCopy(language).correctAnswer}: <b>{correctAnswer}</b>
            </span>
            {showExplanation ? <span className="fb-why">{getUiCopy(language).why}: {explanation}</span> : null}
          </>
        )}
      </motion.div>
    </div>
  );
}

function GameProgress({ questionNumber, total, difficulty, streak, onReset, language = "en" }) {
  const percent = Math.round((questionNumber / total) * 100);
  return (
    <div className="game-footer">
      <div className="gf-item">
        <span>Difficulty</span>
        <strong>{difficulty}</strong>
      </div>
      <div className="gf-item gf-progress">
        <span>{language === "hi" ? "प्रश्न" : "Question"}</span>
        <strong>
          {questionNumber} / {total}
        </strong>
        <div className="gf-track" aria-hidden="true">
          <i style={{ width: `${percent}%` }} />
        </div>
      </div>
      <div className="gf-item">
        <span>{getUiCopy(language).streak}</span>
        <strong>{streak}</strong>
      </div>
      <button type="button" className="gf-reset" onClick={onReset}>
        Reset score
      </button>
    </div>
  );
}

function GameComplete({ score, correct, wrong, best, total, onAgain, mode, language = "en" }) {
  const accuracy = total ? Math.round((correct / total) * 100) : 0;
  return (
    <div className="game-done">
      <div className="eyebrow">{getUiCopy(language).gameComplete}</div>
      <motion.strong
        className="done-score"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {score} {getUiCopy(language).points}
      </motion.strong>
      <div className="done-stats">
        <span>
          {correct} / {total} correct
        </span>
        <span>{accuracy}% {getUiCopy(language).accuracy}</span>
        <span>{wrong} {getUiCopy(language).wrong}</span>
        <span>{getUiCopy(language).bestStreak} {best}</span>
      </div>
      <div className="done-actions">
        <button type="button" className="primary" onClick={onAgain}>
          Play Again
        </button>
        <Link to="/">Back to Number Lab</Link>
      </div>
      <div className="done-more">
        <span>{getUiCopy(language).chooseAnother}</span>
        <div className="done-links">
          {getLocalizedGameItems(language).filter(([path]) => !path.endsWith(mode)).map(([path, title]) => (
            <Link key={path} to={path}>
              {title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function GamePage({ mode }) {
  const reducedMotion = useReducedMotion();
  const config = GAME_CONFIG[mode] || GAME_CONFIG["number-to-words"];

  const [language, setLanguage] = useState("en");
  const [difficulty, setDifficulty] = useState("mixed");
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceName, setVoiceName] = useState("");
  const [speechRate, setSpeechRate] = useState(0.8);
  const localizedConfig = useMemo(() => ({ ...config, ...getGameCopy(mode, language) }), [config, language, mode]);

  const { suitableVoices, speak, stop, speaking } = useVoice({ language, rate: speechRate, voiceName });

  const session = useGameSession({ mode, language, difficulty, config });
  const {
    question,
    gameState,
    answer,
    setAnswer,
    selectedOrder,
    setSelectedOrder,
    score,
    streak,
    bestStreak,
    correctCount,
    wrongCount,
    questionNumber,
    totalQuestions,
    check,
    next,
    restart,
    resetScore,
    finishTransition,
    inputRef,
  } = session;

  const speechText = useMemo(() => {
    if (!config.voice) return "";
    if (config.speak === "number") {
      return language === "hi" ? indianNumberToHindiWords(question.number) : indianNumberToWords(question.number);
    }
    return typeof question.display === "string" ? question.display : "";
  }, [config, language, question]);

  const spokenRef = useRef(null);
  useEffect(() => {
    stop();
  }, [question.id, stop]);

  useEffect(() => {
    if (!config.autoSpeak) return;
    if (spokenRef.current === question.id) return;
    spokenRef.current = question.id;
    speak(speechText);
  }, [config.autoSpeak, question.id, speak, speechText]);

  const focusRef = useRef(true);
  useEffect(() => {
    if (focusRef.current) {
      focusRef.current = false;
      return;
    }
    if (gameState === GAME_STATES.ANSWERING && config.answerType === "text") inputRef.current?.focus();
  }, [config.answerType, gameState, inputRef, question.id]);

  const answered = gameState === GAME_STATES.CORRECT || gameState === GAME_STATES.WRONG;
  const locked = gameState === GAME_STATES.TRANSITIONING || gameState === GAME_STATES.COMPLETE;
  const correctAnswer = answerDisplayOf(question, language);
  const tone = gameState === GAME_STATES.CORRECT ? "up" : gameState === GAME_STATES.WRONG ? "down" : null;
  const yourAnswer =
    config.answerType === "order"
      ? selectedOrder.length
        ? selectedOrder.map(formatIndian).join(" → ")
        : ""
      : String(answer ?? "");
  const orderComplete = config.answerType !== "order" || selectedOrder.length === question.answer.length;
  const hasText = config.answerType !== "text" || answer.trim().length > 0;
  const canCheck = !answered && !locked && orderComplete && hasText;

  const handleCheck = () => {
    const result = check();
    if (result && !reducedMotion) {
      confetti({ particleCount: 30, spread: 58, startVelocity: 22, origin: { x: 0.5, y: 0.68 }, ticks: 140 });
      confetti({ particleCount: 12, spread: 46, startVelocity: 18, origin: { x: 0.18, y: 0.76 }, ticks: 140 });
      confetti({ particleCount: 12, spread: 46, startVelocity: 18, origin: { x: 0.82, y: 0.76 }, ticks: 140 });
    }
  };

  const handlePick = (value) => {
    if (answered || locked) return;
    if (config.answerType === "order") {
      const number = typeof value === "string" ? Number(value.replace(/,/g, "")) : value;
      if (selectedOrder.includes(number)) return;
      setSelectedOrder([...selectedOrder, number]);
      return;
    }
    setAnswer(value);
  };

  const voiceButton = config.voice ? (
    <VoiceButton speaking={speaking} label={localizedConfig.voiceLabel} onSpeak={() => speak(speechText)} onStop={stop} />
  ) : null;

  if (gameState === GAME_STATES.COMPLETE) {
    return (
      <div className="page game-page">
        <Header language={language} setLanguage={setLanguage} />
        <main>
          <GameHeader config={localizedConfig} language={language} />
          <div className="score-rail">
            <ScorePanel
              score={score}
              correct={correctCount}
              total={totalQuestions}
              streak={streak}
              tone={tone}
            />
          </div>
          <section className="game-card">
            <GameComplete
              score={score}
              correct={correctCount}
              wrong={wrongCount}
              best={bestStreak}
              total={totalQuestions}
              onAgain={restart}
              mode={mode}
            />
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="page game-page">
      <Header language={language} setLanguage={setLanguage} />
      {answered && !reducedMotion ? (
        <motion.div
          key={gameState}
          className={`edge-flash ${gameState === GAME_STATES.CORRECT ? "correct" : "wrong"}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{
            duration: gameState === GAME_STATES.CORRECT ? 0.6 : 0.8,
            times: [0, 0.1, 0.5, 1],
            ease: "easeOut",
          }}
          aria-hidden="true"
        />
      ) : null}
      <main>
        <GameHeader config={localizedConfig} language={language} />
        <div className="score-rail">
          <ScorePanel language={language} score={score} correct={correctCount} total={totalQuestions} streak={streak} tone={tone} />
        </div>

        <section className={`game-card state-${gameState}`}>
          <GameControls
            mode={mode}
            config={config}
            language={language}
                        difficulty={difficulty}
            setDifficulty={setDifficulty}
            voiceSlot={
              <VoiceSettings
                open={voiceOpen}
                onToggle={() => setVoiceOpen((value) => !value)}
                onClose={() => setVoiceOpen(false)}
                language={language}
                setLanguage={setLanguage}
                suitableVoices={suitableVoices}
                voiceName={voiceName}
                setVoiceName={setVoiceName}
                rate={speechRate}
                setRate={setSpeechRate}
              />
            }
          />

          <AnimatePresence mode="wait" onExitComplete={finishTransition}>
            <motion.div
              key={question.id}
              className={`q-root ${config.answerType === "text" ? "q-text" : "q-choice"}`}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -26 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <QuestionStage
                config={config}
                question={question}
                language={language}
                reducedMotion={reducedMotion}
                gameState={gameState}
                onPick={handlePick}
                selectedOrder={selectedOrder}
                answer={answer}
                locked={locked}
                answered={answered}
                voice={voiceButton}
              />

              {config.answerType === "text" ? (
                <motion.div
                  className="answer-row"
                  animate={answered && gameState === GAME_STATES.WRONG && !reducedMotion ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                  transition={{ duration: 0.38 }}
                >
                  <input
                    ref={inputRef}
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && canCheck) handleCheck();
                    }}
                    className={gameState === GAME_STATES.WRONG ? "error-input" : gameState === GAME_STATES.CORRECT ? "success-input" : ""}
                    placeholder={localizedConfig.placeholder}
                    aria-label={localizedConfig.inputLabel}
                    disabled={answered || locked}
                    autoComplete="off"
                    spellCheck="false"
                  />
                </motion.div>
              ) : null}

              <div className="game-actions">
                {answered ? (
                  <button type="button" className="primary action-next" onClick={next}>
                    Next Question →
                  </button>
                ) : (
                  <button type="button" className="primary action-check" onClick={handleCheck} disabled={!canCheck}>
                    Check Answer
                  </button>
                )}
                {config.voice && answered ? voiceButton : null}
              </div>
            </motion.div>
          </AnimatePresence>

          <AnswerFeedback
            state={gameState}
            question={question}
            streak={streak}
            correctAnswer={correctAnswer}
            yourAnswer={yourAnswer}
          />

          <GameProgress
            questionNumber={questionNumber}
            total={totalQuestions}
            difficulty={difficulty}
            streak={streak}
            onReset={resetScore}
          />
        </section>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NumberLab />} />
        <Route path="/game/number-to-words" element={<GamePage mode="number-to-words" />} />
        <Route path="/game/words-to-number" element={<GamePage mode="words-to-number" />} />
        <Route path="/game/place-value" element={<GamePage mode="place-value" />} />
        <Route path="/game/guess-place" element={<GamePage mode="guess-place" />} />
        <Route path="/game/carry" element={<GamePage mode="carry" />} />
        <Route path="/game/order" element={<GamePage mode="order" />} />
        <Route path="/game/compare" element={<GamePage mode="compare" />} />
        <Route path="/game/hear-type" element={<GamePage mode="hear-type" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
