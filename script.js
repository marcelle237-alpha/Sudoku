const SIZE = 9;
const BOX_ROWS = 3;
const BOX_COLS = 3;
const LEVELS = ["easy", "medium", "hard"];

const puzzles = {
  easy: [
    {
      puzzle: "530070000600195000098000060800060003400803001700020006060000280000419005000080079",
      solution: "534678912672195348198342567859761423426853791713924856961537284287419635345286179"
    }
  ],
  medium: [
    {
      puzzle: "009000000080605020501078000000000700706040102004000000000720903090301080000000600",
      solution: "239416875478695321561278439125983746786547192934162558657824913492351687813759264"
    }
  ],
  hard: [
    {
      puzzle: "100489006730000040000001295007120600500703008006095700914600000020000037800512004",
      solution: "152489376739256841648371295387124659591763428426895713914637582265948137873512964"
    }
  ]
};

const boardEl = document.querySelector("#board");
const padEl = document.querySelector("#numberPad");
const statusText = document.querySelector("#statusText");
const timerEl = document.querySelector("#timer");
const mistakesEl = document.querySelector("#mistakes");
const notesToggle = document.querySelector("#notesToggle");
const levelSelect = document.querySelector("#levelSelect");
const newGameBtn = document.querySelector("#newGameBtn");
const checkBtn = document.querySelector("#checkBtn");
const hintBtn = document.querySelector("#hintBtn");
const eraseBtn = document.querySelector("#eraseBtn");
const finishDialog = document.querySelector("#finishDialog");
const finishMessage = document.querySelector("#finishMessage");
const restartBtn = document.querySelector("#restartBtn");
const nextLevelBtn = document.querySelector("#nextLevelBtn");

let puzzle = "";
let solution = "";
let values = [];
let givens = [];
let notes = [];
let selected = null;
let mistakes = 0;
let seconds = 0;
let timerId = null;
let solved = false;

function startGame() {
  const levelPuzzles = puzzles[levelSelect.value];
  const game = levelPuzzles[Math.floor(Math.random() * levelPuzzles.length)];
  puzzle = game.puzzle;
  solution = game.solution;
  values = puzzle.split("").map((value) => (value === "0" ? "" : value));
  givens = puzzle.split("").map((value) => value !== "0");
  notes = Array.from({ length: SIZE * SIZE }, () => new Set());
  selected = null;
  mistakes = 0;
  seconds = 0;
  solved = false;
  finishDialog.hidden = true;
  statusText.textContent = `${capitalize(levelSelect.value)} 9x9 puzzle ready.`;
  mistakesEl.textContent = "0 mistakes";
  renderBoard();
  updateTimer();
  clearInterval(timerId);
  timerId = setInterval(() => {
    seconds += 1;
    updateTimer();
  }, 1000);
}

function renderBoard() {
  boardEl.innerHTML = "";
  for (let index = 0; index < SIZE * SIZE; index += 1) {
    const cell = document.createElement("button");
    cell.className = "cell";
    cell.type = "button";
    cell.setAttribute("role", "gridcell");
    cell.setAttribute("aria-label", `Row ${Math.floor(index / SIZE) + 1}, column ${(index % SIZE) + 1}`);
    cell.dataset.index = index;
    cell.addEventListener("click", () => selectCell(index));
    boardEl.append(cell);
  }
  renderCells();
}

function renderCells() {
  [...boardEl.children].forEach((cell, index) => {
    cell.className = "cell";
    cell.innerHTML = "";
    addBoxBorders(cell, index);

    if (givens[index]) {
      cell.classList.add("given");
    }

    if (selected !== null) {
      const selectedRow = Math.floor(selected / SIZE);
      const selectedCol = selected % SIZE;
      const row = Math.floor(index / SIZE);
      const col = index % SIZE;

      if (row === selectedRow || col === selectedCol || sameBox(selected, index)) {
        cell.classList.add("related");
      }

      if (values[selected] && values[index] === values[selected]) {
        cell.classList.add("same");
      }

      if (index === selected) {
        cell.classList.add("selected");
      }
    }

    if (values[index]) {
      cell.textContent = values[index];
      if (!givens[index] && values[index] !== solution[index]) {
        cell.classList.add("error");
      }
    } else if (notes[index].size) {
      const grid = document.createElement("span");
      grid.className = "notes";
      for (let number = 1; number <= SIZE; number += 1) {
        const slot = document.createElement("span");
        slot.textContent = notes[index].has(String(number)) ? number : "";
        grid.append(slot);
      }
      cell.append(grid);
    }
  });
}

function addBoxBorders(cell, index) {
  const row = Math.floor(index / SIZE);
  const col = index % SIZE;
  if ((col + 1) % BOX_COLS === 0 && col !== SIZE - 1) {
    cell.classList.add("box-right");
  }
  if ((row + 1) % BOX_ROWS === 0 && row !== SIZE - 1) {
    cell.classList.add("box-bottom");
  }
}

function sameBox(first, second) {
  const firstRow = Math.floor(first / SIZE);
  const firstCol = first % SIZE;
  const secondRow = Math.floor(second / SIZE);
  const secondCol = second % SIZE;
  return Math.floor(firstRow / BOX_ROWS) === Math.floor(secondRow / BOX_ROWS)
    && Math.floor(firstCol / BOX_COLS) === Math.floor(secondCol / BOX_COLS);
}

function renderPad() {
  padEl.innerHTML = "";
  for (let number = 1; number <= SIZE; number += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = number;
    button.addEventListener("click", () => enterNumber(String(number)));
    padEl.append(button);
  }
}

function selectCell(index) {
  if (solved) {
    return;
  }
  selected = index;
  statusText.textContent = givens[index] ? "That number is fixed." : "Choose a number from 1 to 9.";
  renderCells();
}

function enterNumber(number) {
  if (solved) {
    return;
  }

  if (selected === null) {
    statusText.textContent = "Choose a square first.";
    return;
  }

  if (givens[selected]) {
    statusText.textContent = "Fixed squares cannot be changed.";
    return;
  }

  if (notesToggle.checked) {
    if (values[selected]) {
      values[selected] = "";
    }
    if (notes[selected].has(number)) {
      notes[selected].delete(number);
    } else {
      notes[selected].add(number);
    }
    renderCells();
    return;
  }

  values[selected] = number;
  notes[selected].clear();

  if (number !== solution[selected]) {
    mistakes += 1;
    mistakesEl.textContent = `${mistakes} ${mistakes === 1 ? "mistake" : "mistakes"}`;
    statusText.textContent = "That square needs another look.";
  } else {
    statusText.textContent = "Nice. Keep going.";
    clearSolvedNumberNotes(number, selected);
  }

  renderCells();
  checkWin();
}

function clearSolvedNumberNotes(number, index) {
  const row = Math.floor(index / SIZE);
  const col = index % SIZE;

  notes.forEach((set, noteIndex) => {
    const noteRow = Math.floor(noteIndex / SIZE);
    const noteCol = noteIndex % SIZE;
    if (noteRow === row || noteCol === col || sameBox(index, noteIndex)) {
      set.delete(number);
    }
  });
}

function eraseSelected() {
  if (solved || selected === null || givens[selected]) {
    return;
  }
  values[selected] = "";
  notes[selected].clear();
  statusText.textContent = "Square cleared.";
  renderCells();
}

function checkPuzzle() {
  const empty = values.filter((value) => !value).length;
  const wrong = values.some((value, index) => value && value !== solution[index]);

  if (wrong) {
    statusText.textContent = "Some filled squares are not correct yet.";
  } else if (empty) {
    statusText.textContent = `${empty} empty ${empty === 1 ? "square" : "squares"} left.`;
  } else {
    finishGame();
  }
}

function giveHint() {
  if (solved) {
    return;
  }

  const open = values
    .map((value, index) => (givens[index] || value === solution[index] ? null : index))
    .filter((index) => index !== null);

  if (!open.length) {
    checkPuzzle();
    return;
  }

  const index = open[Math.floor(Math.random() * open.length)];
  selected = index;
  values[index] = solution[index];
  notes[index].clear();
  statusText.textContent = "A hint has been placed.";
  renderCells();
  checkWin();
}

function checkWin() {
  if (values.join("") === solution) {
    finishGame();
  }
}

function finishGame() {
  if (solved) {
    return;
  }
  solved = true;
  clearInterval(timerId);
  statusText.textContent = "Super!";
  finishMessage.textContent = `You solved it in ${timerEl.textContent}. Restart or go to the next level?`;
  finishDialog.hidden = false;
}

function goToNextLevel() {
  const currentIndex = LEVELS.indexOf(levelSelect.value);
  const nextIndex = (currentIndex + 1) % LEVELS.length;
  levelSelect.value = LEVELS[nextIndex];
  startGame();
}

function updateTimer() {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  timerEl.textContent = `${minutes}:${secs}`;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

document.addEventListener("keydown", (event) => {
  if (/^[1-9]$/.test(event.key)) {
    enterNumber(event.key);
  }
  if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
    eraseSelected();
  }
  if (event.key === "Escape" && !finishDialog.hidden) {
    finishDialog.hidden = true;
  }
});

levelSelect.addEventListener("change", startGame);
newGameBtn.addEventListener("click", startGame);
checkBtn.addEventListener("click", checkPuzzle);
hintBtn.addEventListener("click", giveHint);
eraseBtn.addEventListener("click", eraseSelected);
restartBtn.addEventListener("click", startGame);
nextLevelBtn.addEventListener("click", goToNextLevel);

renderPad();
startGame();
