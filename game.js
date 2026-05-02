const PRIZES = [
  5000, 7500, 10000, 15000, 25000, 50000, 100000, 250000, 450000, 700000, 1000000,
  2000000, 3000000, 5000000, 10000000,
];

const SAFE_LEVELS = new Set([4, 9]);
const DIFFICULTIES = ["easy", "average", "hard"];
const ANSWER_LABELS = ["Ա", "Բ", "Գ", "Դ"];
const STORAGE_KEY = "million-road-progress-v1";
const SETTINGS_KEY = "million-road-settings-v1";
const ASKED_KEY = "million-road-asked-questions-v2";

function trackEvent(name, params = {}) {
  window.MillionaterAnalytics?.trackEvent(name, params);
}

const onboardingSlides = [
  {
    title: "Հաղթահարիր հարցերը հերթով",
    text: "Պատասխանիր հարցերին և մոտեցիր գլխավոր մրցանակին",
  },
  {
    title: "Օգտագործիր օգնությունները խելացի",
    text: "Հեռացրու սխալ տարբերակներ կամ հարցրու հանդիսատեսին",
  },
  {
    title: "Մնա հանգիստ",
    text: "Մտածիր արագ, բայց ընտրիր ուշադիր",
  },
];

const elements = {
  splashScreen: document.querySelector("#splashScreen"),
  onboardingScreen: document.querySelector("#onboardingScreen"),
  homeScreen: document.querySelector("#homeScreen"),
  gameScreen: document.querySelector("#gameScreen"),
  resultScreen: document.querySelector("#resultScreen"),
  onboardingStep: document.querySelector("#onboardingStep"),
  onboardingTitle: document.querySelector("#onboardingTitle"),
  onboardingText: document.querySelector("#onboardingText"),
  onboardingDots: document.querySelector("#onboardingDots"),
  skipOnboardingButton: document.querySelector("#skipOnboardingButton"),
  nextOnboardingButton: document.querySelector("#nextOnboardingButton"),
  classicButton: document.querySelector("#classicButton"),
  homeSoundButton: document.querySelector("#homeSoundButton"),
  homeVibrationButton: document.querySelector("#homeVibrationButton"),
  pauseButton: document.querySelector("#pauseButton"),
  questionCounter: document.querySelector("#questionCounter"),
  questionProgress: document.querySelector("#questionProgress"),
  ladderButton: document.querySelector("#ladderButton"),
  questionCard: document.querySelector("#questionCard"),
  categoryLabel: document.querySelector("#categoryLabel"),
  questionText: document.querySelector("#questionText"),
  answers: document.querySelector("#answers"),
  confirmationBar: document.querySelector("#confirmationBar"),
  changeAnswerButton: document.querySelector("#changeAnswerButton"),
  lockButton: document.querySelector("#lockButton"),
  feedbackCard: document.querySelector("#feedbackCard"),
  feedbackTitle: document.querySelector("#feedbackTitle"),
  feedbackText: document.querySelector("#feedbackText"),
  feedbackLadderButton: document.querySelector("#feedbackLadderButton"),
  nextQuestionButton: document.querySelector("#nextQuestionButton"),
  fiftyButton: document.querySelector("#fiftyButton"),
  audienceButton: document.querySelector("#audienceButton"),
  friendButton: document.querySelector("#friendButton"),
  swapButton: document.querySelector("#swapButton"),
  resultKicker: document.querySelector("#resultKicker"),
  resultTitle: document.querySelector("#resultTitle"),
  resultText: document.querySelector("#resultText"),
  runCorrectLabel: document.querySelector("#runCorrectLabel"),
  runStreakLabel: document.querySelector("#runStreakLabel"),
  runTimeLabel: document.querySelector("#runTimeLabel"),
  runLifelinesLabel: document.querySelector("#runLifelinesLabel"),
  resultHomeButton: document.querySelector("#resultHomeButton"),
  playAgainButton: document.querySelector("#playAgainButton"),
  ladderDialog: document.querySelector("#ladderDialog"),
  ladderList: document.querySelector("#ladderList"),
  pauseDialog: document.querySelector("#pauseDialog"),
  soundButton: document.querySelector("#soundButton"),
  vibrationButton: document.querySelector("#vibrationButton"),
  quitButton: document.querySelector("#quitButton"),
  messageDialog: document.querySelector("#messageDialog"),
  messageTitle: document.querySelector("#messageTitle"),
  messageText: document.querySelector("#messageText"),
};

const state = {
  screen: "splash",
  onboardingIndex: 0,
  questions: [],
  questionIndex: 0,
  selectedIndex: null,
  locked: false,
  removedAnswers: new Set(),
  audienceShares: null,
  lifelines: { fifty: false, audience: false, friend: false, swap: false },
  pendingResult: null,
  nextQuestionTimer: null,
  trackedQuestionId: null,
  startedAt: 0,
  questionStartedAt: 0,
  run: {
    correct: 0,
    streak: 0,
    bestStreak: 0,
    lifelinesUsed: 0,
  },
  progress: readProgress(),
  settings: readSettings(),
  asked: readAsked(),
};

function readProgress() {
  try {
    return {
      games: 0,
      bestPrize: 0,
      totalCorrect: 0,
      totalAnswered: 0,
      lifelinesUsed: 0,
      xp: 0,
      coins: 0,
      streak: 0,
      onboardingDone: false,
      ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"),
    };
  } catch {
    return {
      games: 0,
      bestPrize: 0,
      totalCorrect: 0,
      totalAnswered: 0,
      lifelinesUsed: 0,
      xp: 0,
      coins: 0,
      streak: 0,
      onboardingDone: false,
    };
  }
}

function readSettings() {
  try {
    return {
      sound: true,
      vibration: true,
      ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"),
    };
  } catch {
    return { sound: true, vibration: true };
  }
}

function readAsked() {
  try {
    const raw = JSON.parse(localStorage.getItem(ASKED_KEY) || "{}");
    if (!raw || typeof raw !== "object") return {};
    return raw;
  } catch {
    return {};
  }
}

function saveAsked() {
  localStorage.setItem(ASKED_KEY, JSON.stringify(state.asked));
}

function questionId(question) {
  const level = question?.level ?? "";
  const category = typeof question?.category === "string" ? question.category : "";
  const prompt = typeof question?.prompt === "string" ? question.prompt : "";
  return `${level}||${category}||${prompt}`;
}

function questionCategory(question) {
  return typeof question?.category === "string" ? question.category : "";
}

function markQuestionAsked(question) {
  const id = questionId(question);
  if (!id || state.asked[id]) return;

  state.asked[id] = Date.now();
  saveAsked();
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

function formatDram(value) {
  return `${value.toLocaleString("hy-AM")} դրամ`;
}

function formatTime(milliseconds) {
  const seconds = Math.max(0, Math.round(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60);
  const rest = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}

function formatPrompt(prompt) {
  let text = typeof prompt === "string" ? prompt.trim() : "";
  if (!text) return "";

  // Strip common “intro” phrases some question sets include.
  const prefixMatchers = [
    // Ընտրիր ճիշտ պատասխանը (optionally "... գրականությունից")
    /^Ընտրիր ճիշտ պատասխանը(?:\s+[^:.\u0589\u2024]+)?\s*[:.\u0589\u2024]\s*/u,
    // Ո՞րն է ճիշտ․
    /^Ո\?՞րն է ճիշտ\s*[:.\u0589\u2024]\s*/u,
    // Մշակույթի հարց․
    /^Մշակույթի հարց\s*[:.\u0589\u2024]\s*/u,
  ];

  for (let pass = 0; pass < 3; pass += 1) {
    const before = text;
    for (const matcher of prefixMatchers) text = text.replace(matcher, "");
    text = text.trimStart();
    if (text === before) break;
  }

  return text;
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function withShuffledAnswers(question) {
  const answers = shuffle(question.answers.map((answer, index) => ({ answer, index })));
  return {
    ...question,
    answers: answers.map(({ answer }) => answer),
    correctIndex: answers.findIndex(({ index }) => index === question.correctIndex),
  };
}

function questionPool() {
  return (window.MILLIONAIRE_QUESTIONS || []).filter(
    (question) =>
      (typeof question.level === "string" && ["easy", "average", "hard"].includes(question.level)) &&
      typeof question.prompt === "string" &&
      Array.isArray(question.answers) &&
      question.answers.length === 4 &&
      Number.isInteger(question.correctIndex) &&
      question.correctIndex >= 0 &&
      question.correctIndex <= 3,
  );
}

function alternativeQuestionForCurrentLevel() {
  const current = currentQuestion();
  if (!current) return null;
  const usedIds = new Set(state.questions.map(questionId));
  const difficulty = DIFFICULTIES[Math.floor(state.questionIndex / 5)];
  const options = shuffle(questionPool()).filter(
    (question) =>
      question.level === difficulty &&
      questionId(question) !== questionId(current) &&
      !usedIds.has(questionId(question)),
  );
  const unseen = options.filter((question) => !state.asked[questionId(question)]);

  return unseen[0] || options[0] || null;
}

function buildQuestionSet() {
  const pool = questionPool();
  const grouped = new Map();
  for (const question of shuffle(pool)) {
    if (!grouped.has(question.level)) grouped.set(question.level, []);
    grouped.get(question.level).push(question);
  }

  const picked = [];
  let previousCategory = null;

  for (let index = 0; index < PRIZES.length; index += 1) {
    const difficulty = DIFFICULTIES[Math.floor(index / 5)];
    const options = grouped.get(difficulty) || [];

    if (!options.length) {
      const fallback = pool[index % pool.length];
      picked.push(fallback);
      previousCategory = fallback?.category ?? previousCategory;
      continue;
    }

    const pickedIds = new Set(picked.map(questionId));
    const available = options.filter((question) => !pickedIds.has(questionId(question)));
    const unseen = available.filter((question) => !state.asked[questionId(question)]);
    const candidates = unseen.length ? unseen : available;
    const differsFromPrevious = (question) => !previousCategory || questionCategory(question) !== previousCategory;
    const shuffledCandidates = shuffle(candidates.length ? candidates : options);
    const chosen = shuffledCandidates.find(differsFromPrevious) || shuffledCandidates[0];

    picked.push(chosen);
    previousCategory = questionCategory(chosen) || previousCategory;
  }

  return picked.filter(Boolean).map(withShuffledAnswers);
}

function currentQuestion() {
  return state.questions[state.questionIndex];
}

function currentSafePrize() {
  if (state.questionIndex > 9) return PRIZES[9];
  if (state.questionIndex > 4) return PRIZES[4];
  return 0;
}

function currentWalkAwayPrize() {
  if (state.questionIndex === 0) return 0;
  return PRIZES[state.questionIndex - 1];
}

function vibrate(pattern = 18) {
  if (state.settings.vibration && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

let sharedAudioContext = null;

function playTone(type) {
  if (!state.settings.sound) return;
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) return;

  if (!sharedAudioContext) {
    sharedAudioContext = new AudioContextConstructor();
  }
  
  if (sharedAudioContext.state === "suspended") {
    sharedAudioContext.resume();
  }

  const context = sharedAudioContext;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const frequency = type === "correct" ? 760 : type === "wrong" ? 170 : 430;
  oscillator.frequency.value = frequency;
  oscillator.type = "sine";
  gain.gain.setValueAtTime(0.001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.07, context.currentTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.2);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.22);
}

function showScreen(screen) {
  state.screen = screen;
  const screenMap = {
    splash: elements.splashScreen,
    onboarding: elements.onboardingScreen,
    home: elements.homeScreen,
    game: elements.gameScreen,
    result: elements.resultScreen,
  };

  for (const [name, element] of Object.entries(screenMap)) {
    if (!element) continue;
    element.classList.toggle("is-hidden", name !== screen);
  }
}

function openDialog(dialog) {
  if (dialog.open) return;
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  }
}

function showMessage(title, text) {
  elements.messageTitle.textContent = title;
  elements.messageText.textContent = text;
  openDialog(elements.messageDialog);
}

function renderOnboarding() {
  const slide = onboardingSlides[state.onboardingIndex];
  elements.onboardingStep.textContent = `${state.onboardingIndex + 1} / ${onboardingSlides.length}`;
  elements.onboardingTitle.textContent = slide.title;
  elements.onboardingText.textContent = slide.text;
  elements.nextOnboardingButton.textContent =
    state.onboardingIndex === onboardingSlides.length - 1 ? "Սկսել խաղը" : "Հաջորդը";
  elements.onboardingDots.replaceChildren(
    ...onboardingSlides.map((_, index) => {
      const dot = document.createElement("span");
      dot.classList.toggle("is-active", index === state.onboardingIndex);
      return dot;
    }),
  );
}

function completeOnboarding() {
  state.progress.onboardingDone = true;
  saveProgress();
  trackEvent("onboarding_complete");
  renderProgress();
  showScreen("home");
}

function renderProgress() {
  const soundLabel = `Ձայնը՝ ${state.settings.sound ? "միացված" : "անջատված"}`;
  const vibrationLabel = `Վիբրացիա՝ ${state.settings.vibration ? "միացված" : "անջատված"}`;

  if (elements.soundButton) elements.soundButton.textContent = soundLabel;
  if (elements.vibrationButton) elements.vibrationButton.textContent = vibrationLabel;
  if (elements.homeSoundButton) elements.homeSoundButton.textContent = soundLabel;
  if (elements.homeVibrationButton) elements.homeVibrationButton.textContent = vibrationLabel;
}

function fitTextToBox(element, minFontSize = 10) {
  if (!element || !element.isConnected) return;

  element.style.fontSize = "";
  const maxFontSize = parseFloat(window.getComputedStyle(element).fontSize);
  if (!Number.isFinite(maxFontSize)) return;

  let low = minFontSize;
  let high = maxFontSize;
  let best = minFontSize;

  for (let pass = 0; pass < 8; pass += 1) {
    const next = (low + high) / 2;
    element.style.fontSize = `${next}px`;

    if (element.scrollHeight <= element.clientHeight + 1 && element.scrollWidth <= element.clientWidth + 1) {
      best = next;
      low = next;
    } else {
      high = next;
    }
  }

  element.style.fontSize = `${best}px`;
}

function fitVisibleText() {
  if (state.screen !== "game") return;

  fitTextToBox(elements.questionText, 10);
  document.querySelectorAll(".answer-text").forEach((element) => fitTextToBox(element, 9));
}

function resetQuestionState() {
  window.clearTimeout(state.nextQuestionTimer);
  state.nextQuestionTimer = null;
  state.selectedIndex = null;
  state.locked = false;
  state.removedAnswers = new Set();
  state.audienceShares = null;
  state.pendingResult = null;
  elements.confirmationBar.classList.add("is-hidden");
  elements.feedbackCard.classList.add("is-hidden");
  elements.questionCard.classList.remove("is-shaking");
}

function startClassicGame() {
  state.questions = buildQuestionSet();
  state.questionIndex = 0;
  state.trackedQuestionId = null;
  state.lifelines = { fifty: false, audience: false, friend: false, swap: false };
  state.startedAt = Date.now();
  state.run = { correct: 0, streak: 0, bestStreak: 0, lifelinesUsed: 0 };
  resetQuestionState();
  showScreen("game");
  renderGame();
  trackEvent("game_start", {
    question_count: state.questions.length,
    total_games: state.progress.games,
  });
}

function renderGame() {
  const question = currentQuestion();
  if (!question) {
    showMessage("Հարցեր չկան", "questions/categories թղթապանակում ավելացրու առնվազն մեկ հարց յուրաքանչյուր մակարդակի համար։");
    return;
  }

  const prize = PRIZES[state.questionIndex];
  elements.questionCounter.textContent = `Հարց ${state.questionIndex + 1} / ${PRIZES.length}`;
  elements.questionProgress.style.width = `${((state.questionIndex + 1) / PRIZES.length) * 100}%`;
  elements.ladderButton.textContent = formatDram(prize);
  elements.categoryLabel.textContent = question.category || "Ընդհանուր գիտելիքներ";
  elements.questionText.textContent = formatPrompt(question.prompt);
  const currentQuestionId = questionId(question);
  if (state.trackedQuestionId !== currentQuestionId) {
    state.trackedQuestionId = currentQuestionId;
    markQuestionAsked(question);
    trackEvent("question_shown", {
      question_level: state.questionIndex + 1,
      question_category: question.category || "Ընդհանուր գիտելիքներ",
      prize_amount: prize,
    });
    state.questionStartedAt = Date.now();
  }
  elements.fiftyButton.disabled = state.locked || state.lifelines.fifty;
  elements.audienceButton.disabled = state.locked || state.lifelines.audience;
  elements.friendButton.disabled = state.locked || state.lifelines.friend;
  elements.swapButton.disabled = state.locked || state.lifelines.swap || !alternativeQuestionForCurrentLevel();
  elements.fiftyButton.classList.toggle("is-used", state.lifelines.fifty);
  elements.audienceButton.classList.toggle("is-used", state.lifelines.audience);
  elements.friendButton.classList.toggle("is-used", state.lifelines.friend);
  elements.swapButton.classList.toggle("is-used", state.lifelines.swap);
  renderAnswers();
  renderLadder();
  window.requestAnimationFrame(fitVisibleText);
}

function renderAnswers() {
  const question = currentQuestion();
  elements.answers.replaceChildren();

  question.answers.forEach((answer, index) => {
    const button = document.createElement("button");
    button.className = "answer-button";
    button.type = "button";
    button.disabled = state.locked || state.removedAnswers.has(index);
    button.classList.toggle("is-selected", state.selectedIndex === index);
    button.classList.toggle("is-removed", state.removedAnswers.has(index));

    if (state.locked && index === question.correctIndex) {
      button.classList.add("is-correct");
    }
    if (state.locked && index === state.selectedIndex && index !== question.correctIndex) {
      button.classList.add("is-wrong");
    }

    const letter = document.createElement("span");
    letter.className = "answer-letter";
    letter.textContent = ANSWER_LABELS[index];

    const text = document.createElement("span");
    text.className = "answer-text";
    text.textContent = answer;

    button.append(letter, text);

    if (state.audienceShares) {
      const bar = document.createElement("span");
      bar.className = "audience-bar";
      const fill = document.createElement("span");
      fill.style.width = `${state.audienceShares[index]}%`;
      bar.append(fill);
      button.append(bar);
      button.setAttribute(
        "aria-label",
        `${ANSWER_LABELS[index]} ${answer}, ${state.audienceShares[index]} տոկոս`,
      );
    }

    button.addEventListener("click", () => selectAnswer(index));
    elements.answers.append(button);
  });
}

function renderLadder() {
  elements.ladderList.replaceChildren();

  for (let prizeIndex = PRIZES.length - 1; prizeIndex >= 0; prizeIndex -= 1) {
    const item = document.createElement("li");
    const status = document.createElement("span");
    const number = document.createElement("strong");
    const prize = document.createElement("span");

    item.classList.toggle("is-current", prizeIndex === state.questionIndex);
    item.classList.toggle("is-complete", prizeIndex < state.questionIndex);
    item.classList.toggle("is-safe", SAFE_LEVELS.has(prizeIndex));

    status.textContent = prizeIndex < state.questionIndex ? "✓" : SAFE_LEVELS.has(prizeIndex) ? "◆" : "";
    number.textContent = String(prizeIndex + 1);
    prize.textContent = formatDram(PRIZES[prizeIndex]);
    item.append(number, prize, status);
    elements.ladderList.append(item);
  }
}

function selectAnswer(index) {
  if (state.locked || state.removedAnswers.has(index)) return;
  const question = currentQuestion();
  const selectedIsCorrect = index === question?.correctIndex;
  const confirmChance = selectedIsCorrect ? 0.1 : 0.2;
  const shouldConfirm = Math.random() < confirmChance;

  state.selectedIndex = index;
  playTone("select");
  vibrate(12);
  if (shouldConfirm) {
    elements.confirmationBar.classList.remove("is-hidden");
    renderGame();
    return;
  }

  lockAnswer();
}

function changeAnswer() {
  state.selectedIndex = null;
  elements.confirmationBar.classList.add("is-hidden");
  renderGame();
}

function lockAnswer() {
  if (state.selectedIndex === null || state.locked) return;

  const question = currentQuestion();
  const selectedIsCorrect = state.selectedIndex === question.correctIndex;
  state.locked = true;
  elements.confirmationBar.classList.add("is-hidden");
  state.progress.totalAnswered += 1;
  trackEvent("question_answered", {
    question_level: state.questionIndex + 1,
    question_category: question.category || "Ընդհանուր գիտելիքներ",
    selected_answer: ANSWER_LABELS[state.selectedIndex],
    correct_answer: ANSWER_LABELS[question.correctIndex],
    is_correct: selectedIsCorrect,
    prize_amount: PRIZES[state.questionIndex],
    time_taken_seconds: Math.round((Date.now() - state.questionStartedAt) / 1000),
  });

  if (selectedIsCorrect) {
    state.run.correct += 1;
    state.run.streak += 1;
    state.run.bestStreak = Math.max(state.run.bestStreak, state.run.streak);
    state.progress.totalCorrect += 1;
    playTone("correct");
    vibrate([20, 30, 20]);
    showCorrectFeedback();
  } else {
    state.run.streak = 0;
    playTone("wrong");
    vibrate([40, 30, 40]);
    showWrongFeedback();
  }

  renderGame();
}

function showCorrectFeedback() {
  const prize = PRIZES[state.questionIndex];
  elements.feedbackTitle.textContent = "Ճիշտ է";
  elements.feedbackText.textContent = SAFE_LEVELS.has(state.questionIndex)
    ? `Դու հասար ${formatDram(prize)} շեմին։ Սա անվտանգ շեմ է։`
    : `Դու հասար ${formatDram(prize)}։ Հաջորդ հարցը ավելի բարդ է լինելու։`;
  elements.nextQuestionButton.textContent =
    state.questionIndex === PRIZES.length - 1 ? "Ավարտել" : "Հաջորդ հարցը";
  elements.feedbackCard.classList.remove("is-hidden");
  state.nextQuestionTimer = window.setTimeout(advanceAfterFeedback, 1500);
}

function showWrongFeedback() {
  const question = currentQuestion();
  const prize = currentSafePrize();
  state.pendingResult = {
    kicker: "Սխալ պատասխան",
    prize,
    text: `Ճիշտ պատասխանը՝ ${ANSWER_LABELS[question.correctIndex]}։ ${question.explanation || ""}`,
  };
  elements.questionCard.classList.add("is-shaking");
  elements.feedbackTitle.textContent = "Սխալ պատասխան";
  elements.feedbackText.textContent = `Ճիշտ պատասխանը՝ ${ANSWER_LABELS[question.correctIndex]}։ ${question.explanation || ""
    }`;
  elements.nextQuestionButton.textContent = "Շարունակել";
  elements.feedbackCard.classList.remove("is-hidden");
}

function advanceAfterFeedback() {
  window.clearTimeout(state.nextQuestionTimer);
  state.nextQuestionTimer = null;

  if (state.screen !== "game") return;

  if (state.pendingResult) {
    finishGame(state.pendingResult.kicker, state.pendingResult.prize, state.pendingResult.text);
    return;
  }

  if (state.questionIndex === PRIZES.length - 1) {
    finishGame("Դու հասար գագաթին", PRIZES[PRIZES.length - 1], "Բոլոր 15 հարցերին պատասխանեցիր ճիշտ։");
    return;
  }

  state.questionIndex += 1;
  resetQuestionState();
  renderGame();
}

function useFifty() {
  if (state.lifelines.fifty || state.locked) return;
  const question = currentQuestion();
  const wrongAnswers = shuffle([0, 1, 2, 3].filter((index) => index !== question.correctIndex));
  state.removedAnswers = new Set(wrongAnswers.slice(0, 2));
  if (state.removedAnswers.has(state.selectedIndex)) state.selectedIndex = null;
  state.lifelines.fifty = true;
  state.run.lifelinesUsed += 1;
  state.progress.lifelinesUsed += 1;
  saveProgress();
  trackEvent("lifeline_used", {
    lifeline_name: "fifty",
    question_level: state.questionIndex + 1,
    question_category: question.category || "Ընդհանուր գիտելիքներ",
  });
  vibrate(18);
  renderGame();
}

function useAudience() {
  if (state.lifelines.audience || state.locked) return;
  const question = currentQuestion();
  const shares = [0, 0, 0, 0];
  const correctShare = Math.max(38, 76 - state.questionIndex * 3 + Math.floor(Math.random() * 10));
  let remaining = 100 - correctShare;
  shares[question.correctIndex] = correctShare;

  const visibleWrong = shuffle(
    [0, 1, 2, 3].filter((index) => index !== question.correctIndex && !state.removedAnswers.has(index)),
  );

  visibleWrong.forEach((index, position) => {
    const share = position === visibleWrong.length - 1 ? remaining : Math.floor(Math.random() * (remaining + 1));
    shares[index] = share;
    remaining -= share;
  });

  state.audienceShares = shares;
  state.lifelines.audience = true;
  state.run.lifelinesUsed += 1;
  state.progress.lifelinesUsed += 1;
  saveProgress();
  trackEvent("lifeline_used", {
    lifeline_name: "audience",
    question_level: state.questionIndex + 1,
    question_category: question.category || "Ընդհանուր գիտելիքներ",
  });
  vibrate(18);
  renderGame();
}

function useFriend() {
  if (state.lifelines.friend || state.locked) return;
  const question = currentQuestion();
  const visibleAnswers = [0, 1, 2, 3].filter((index) => !state.removedAnswers.has(index));
  const visibleWrongAnswers = visibleAnswers.filter((index) => index !== question.correctIndex);
  const roll = Math.random();
  let message = "Ընկերդ ասում է․ «Չգիտեմ, վստահ չեմ պատասխանի վրա»։";

  if (roll < 0.8 || !visibleWrongAnswers.length) {
    message = `Ընկերդ ասում է․ «Ես կընտրեի ${ANSWER_LABELS[question.correctIndex]} տարբերակը՝ ${question.answers[question.correctIndex]
      }»։`;
  } else if (roll < 0.9) {
    const suggestedIndex = visibleWrongAnswers[Math.floor(Math.random() * visibleWrongAnswers.length)];
    message = `Ընկերդ ասում է․ «Ես կընտրեի ${ANSWER_LABELS[suggestedIndex]} տարբերակը՝ ${question.answers[suggestedIndex]
      }»։`;
  }

  state.lifelines.friend = true;
  state.run.lifelinesUsed += 1;
  state.progress.lifelinesUsed += 1;
  saveProgress();
  trackEvent("lifeline_used", {
    lifeline_name: "friend",
    question_level: state.questionIndex + 1,
    question_category: question.category || "Ընդհանուր գիտելիքներ",
    friend_result: roll < 0.8 || !visibleWrongAnswers.length ? "correct" : roll < 0.9 ? "wrong" : "unknown",
  });
  vibrate(18);
  renderGame();
  showMessage("Զանգ ընկերոջը", message);
}

function useSwapQuestion() {
  if (state.lifelines.swap || state.locked) return;
  const replacement = alternativeQuestionForCurrentLevel();

  if (!replacement) {
    showMessage("Հարց չկա", "Այս մակարդակի համար փոխարինող հարց այլևս չկա։");
    return;
  }

  state.lifelines.swap = true;
  state.run.lifelinesUsed += 1;
  state.progress.lifelinesUsed += 1;
  state.questions[state.questionIndex] = withShuffledAnswers(replacement);
  saveProgress();
  trackEvent("lifeline_used", {
    lifeline_name: "swap",
    question_level: state.questionIndex + 1,
    question_category: replacement.category || "Ընդհանուր գիտելիքներ",
  });
  vibrate(18);
  resetQuestionState();
  renderGame();
}

function finishGame(kicker, prize, text) {
  window.clearTimeout(state.nextQuestionTimer);
  state.nextQuestionTimer = null;

  const elapsed = Date.now() - state.startedAt;
  const answeredCount = state.run.correct + (state.pendingResult ? 1 : 0);
  const wrongCount = state.pendingResult ? 1 : 0;
  state.progress.games += 1;
  state.progress.bestPrize = Math.max(state.progress.bestPrize, prize);
  state.progress.coins += Math.round(prize / 100);
  state.progress.xp += 80 + state.run.correct * 20;
  state.progress.streak += 1;
  saveProgress();

  elements.resultKicker.textContent = kicker;
  elements.resultTitle.textContent = `Դու հասար ${formatDram(prize)}`;
  elements.resultText.textContent = text;
  elements.runCorrectLabel.textContent = `${state.run.correct} / ${PRIZES.length}`;
  elements.runStreakLabel.textContent = state.run.bestStreak.toLocaleString("hy-AM");
  elements.runTimeLabel.textContent = formatTime(elapsed);
  elements.runLifelinesLabel.textContent = state.run.lifelinesUsed.toLocaleString("hy-AM");
  renderProgress();
  showScreen("result");
  trackEvent("game_finish", {
    result_type: kicker,
    prize_amount: prize,
    correct_count: state.run.correct,
    wrong_count: wrongCount,
    answered_count: answeredCount,
    best_streak: state.run.bestStreak,
    lifelines_used: state.run.lifelinesUsed,
    elapsed_seconds: Math.round(elapsed / 1000),
  });
}

function walkOutToHome() {
  const prize = currentWalkAwayPrize();
  finishGame("Խաղն ավարտվեց", prize, `Դու կանգ առար և պահեցիր ${formatDram(prize)}։`);
}

function toggleSound() {
  state.settings.sound = !state.settings.sound;
  saveSettings();
  renderProgress();
  trackEvent("setting_changed", {
    setting_name: "sound",
    enabled: state.settings.sound,
  });
}

function toggleVibration() {
  state.settings.vibration = !state.settings.vibration;
  saveSettings();
  renderProgress();
  trackEvent("setting_changed", {
    setting_name: "vibration",
    enabled: state.settings.vibration,
  });
}

function registerServiceWorker() {
  if (window.location.protocol === "file:") return;
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker.register("service-worker.js").then((registration) => registration.update());
}

function boot() {
  renderOnboarding();
  renderProgress();
  registerServiceWorker();
  window.setTimeout(() => {
    if (state.progress.onboardingDone) {
      showScreen("home");
    } else {
      showScreen("onboarding");
    }
  }, 800);
}

elements.nextOnboardingButton.addEventListener("click", () => {
  if (state.onboardingIndex === onboardingSlides.length - 1) {
    completeOnboarding();
    return;
  }
  state.onboardingIndex += 1;
  renderOnboarding();
});

elements.skipOnboardingButton.addEventListener("click", completeOnboarding);
elements.classicButton.addEventListener("click", startClassicGame);
elements.pauseButton.addEventListener("click", () => openDialog(elements.pauseDialog));
elements.ladderButton.addEventListener("click", () => openDialog(elements.ladderDialog));
elements.feedbackLadderButton.addEventListener("click", () => openDialog(elements.ladderDialog));
elements.changeAnswerButton.addEventListener("click", changeAnswer);
elements.lockButton.addEventListener("click", lockAnswer);
elements.nextQuestionButton.addEventListener("click", advanceAfterFeedback);
elements.fiftyButton.addEventListener("click", useFifty);
elements.audienceButton.addEventListener("click", useAudience);
elements.friendButton.addEventListener("click", useFriend);
elements.swapButton.addEventListener("click", useSwapQuestion);
elements.playAgainButton.addEventListener("click", startClassicGame);
elements.resultHomeButton.addEventListener("click", () => showScreen("home"));
elements.soundButton.addEventListener("click", toggleSound);
elements.vibrationButton.addEventListener("click", toggleVibration);
if (elements.homeSoundButton) elements.homeSoundButton.addEventListener("click", toggleSound);
if (elements.homeVibrationButton) elements.homeVibrationButton.addEventListener("click", toggleVibration);
elements.quitButton.addEventListener("click", () => {
  if (window.confirm("Եթե դուրս գաս հիմա, այս խաղը կավարտվի։")) {
    elements.pauseDialog.close();
    walkOutToHome();
  }
});

boot();
