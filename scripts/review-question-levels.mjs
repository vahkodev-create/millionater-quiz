import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { stdin as input } from "node:process";

const QUESTIONS_DIR = path.resolve("questions/categories");
const LEVELS = {
  1: "easy",
  2: "average",
  3: "hard",
};
const LEVEL_LABELS = {
  easy: "1 easy",
  average: "2 medium",
  hard: "3 hard",
};

function categoryFileHeader(filePath, questions) {
  const category = questions[0]?.category || path.basename(filePath, ".js");
  return `// Category: ${category}`;
}

function readCategoryFile(filePath) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(filePath, "utf8"), context, { filename: filePath });

  const questions = context.window.MILLIONAIRE_QUESTIONS || [];
  return questions.map((question) => ({ ...question, __filePath: filePath }));
}

function readQuestionFiles() {
  if (!fs.existsSync(QUESTIONS_DIR)) {
    throw new Error("questions/categories folder was not found.");
  }

  const filePaths = fs
    .readdirSync(QUESTIONS_DIR)
    .filter((file) => file.endsWith(".js"))
    .sort()
    .map((file) => path.join(QUESTIONS_DIR, file));

  const questions = filePaths.flatMap(readCategoryFile);
  return { filePaths, questions };
}

function cleanQuestion(question) {
  const { __filePath, ...cleaned } = question;
  return cleaned;
}

function saveCategoryFile(filePath, questions) {
  const cleanQuestions = questions.map(cleanQuestion);
  fs.writeFileSync(
    filePath,
    [
      categoryFileHeader(filePath, cleanQuestions),
      "window.MILLIONAIRE_QUESTIONS = window.MILLIONAIRE_QUESTIONS || [];",
      `window.MILLIONAIRE_QUESTIONS.push(...${JSON.stringify(cleanQuestions, null, 2)});`,
      "",
    ].join("\n"),
  );
}

function saveAllQuestions(filePaths, questions) {
  const questionsByFile = new Map(filePaths.map((filePath) => [filePath, []]));
  for (const question of questions) {
    questionsByFile.get(question.__filePath)?.push(question);
  }

  for (const [filePath, fileQuestions] of questionsByFile.entries()) {
    saveCategoryFile(filePath, fileQuestions);
  }
}

function saveQuestionFile(filePaths, questions, filePath) {
  if (!filePaths.includes(filePath)) return;
  saveCategoryFile(
    filePath,
    questions.filter((question) => question.__filePath === filePath),
  );
}

function parseStartIndex() {
  const startArg = process.argv.find((arg) => arg.startsWith("--start="));
  if (!startArg) return 0;

  const start = Number.parseInt(startArg.split("=")[1], 10);
  if (!Number.isInteger(start) || start < 1) {
    throw new Error("Use --start with a 1-based question number, for example --start=25");
  }

  return start - 1;
}

function printQuestion(question, index, total, message = "") {
  console.clear();
  console.log(`Question ${index + 1} / ${total}`);
  console.log(`Current level: ${LEVEL_LABELS[question.level] || question.level || "unknown"}`);
  console.log(`Category: ${question.category || "No category"}`);
  console.log(`File: ${path.relative(process.cwd(), question.__filePath)}`);
  console.log("");
  console.log(question.prompt);
  console.log("");

  question.answers.forEach((answer, answerIndex) => {
    const marker = answerIndex === question.correctIndex ? "*" : " ";
    console.log(`${marker} ${answerIndex + 1}. ${answer}`);
  });

  if (question.explanation) {
    console.log("");
    console.log(`Explanation: ${question.explanation}`);
  }

  console.log("");
  console.log("Press: 1 easy, 2 medium, 3 hard, 4 delete, Space keep, b back, q quit");
  if (message) console.log(message);
}

function emitFinalSaveMessage(index) {
  console.log("");
  console.log(`Saved. Resume with: npm run review:levels -- --start=${index + 1}`);
}

let { filePaths, questions } = readQuestionFiles();
let index = Math.min(parseStartIndex(), questions.length - 1);
let message = "";

if (questions.length === 0) {
  console.log("No questions found.");
  process.exit(0);
}

input.setEncoding("utf8");
if (input.isTTY) input.setRawMode(true);
input.resume();

function stop(exitCode = 0) {
  if (input.isTTY) input.setRawMode(false);
  input.pause();
  process.exit(exitCode);
}

function render() {
  if (index >= questions.length) {
    saveAllQuestions(filePaths, questions);
    console.clear();
    console.log("Done. All questions were reviewed and saved.");
    stop();
    return;
  }

  printQuestion(questions[index], index, questions.length, message);
  message = "";
}

input.on("data", (key) => {
  if (key === "\u0003") {
    saveAllQuestions(filePaths, questions);
    emitFinalSaveMessage(index);
    stop();
    return;
  }

  const answer = key.toLowerCase();

  if (answer === "q") {
    saveAllQuestions(filePaths, questions);
    emitFinalSaveMessage(index);
    stop();
    return;
  }

  if (answer === "b") {
    index = Math.max(0, index - 1);
    render();
    return;
  }

  if (answer === " " || answer === "\r" || answer === "\n") {
    index += 1;
    render();
    return;
  }

  if (answer === "4") {
    const [deleted] = questions.splice(index, 1);
    saveQuestionFile(filePaths, questions, deleted.__filePath);
    message = "Deleted.";
    render();
    return;
  }

  if (LEVELS[answer]) {
    questions[index].level = LEVELS[answer];
    saveQuestionFile(filePaths, questions, questions[index].__filePath);
    index += 1;
    render();
    return;
  }

  message = "Invalid key. Press 1, 2, 3, 4, Space, b, or q.";
  render();
});

render();
