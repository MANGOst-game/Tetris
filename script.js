const grid = document.getElementById('tetris-grid');
const width = 10;
const height = 20;
const cells = [];
let score = 0;
let dropInterval;
let currentPiece, currentRotation, currentPosition;
let nextPiece, heldPiece = null;
let holdUsed = false;
let gameRunning = false;

for (let i = 0; i < width * height; i++) {
  const cell = document.createElement('div');
  grid.appendChild(cell);
  cells.push(cell);
}

const tetrominoes = {
  I: [[[1,0],[1,1],[1,2],[1,3]],[[0,2],[1,2],[2,2],[3,2]],[[2,0],[2,1],[2,2],[2,3]],[[0,1],[1,1],[2,1],[3,1]]],
  J: [[[0,0],[1,0],[1,1],[1,2]],[[0,1],[0,2],[1,1],[2,1]],[[1,0],[1,1],[1,2],[2,2]],[[0,1],[1,1],[2,0],[2,1]]],
  L: [[[0,2],[1,0],[1,1],[1,2]],[[0,1],[1,1],[2,1],[2,2]],[[1,0],[1,1],[1,2],[2,0]],[[0,0],[0,1],[1,1],[2,1]]],
  O: [[[0,0],[0,1],[1,0],[1,1]]],
  S: [[[1,0],[1,1],[0,1],[0,2]],[[0,1],[1,1],[1,2],[2,2]]],
  T: [[[0,1],[1,0],[1,1],[1,2]],[[0,1],[1,1],[1,2],[2,1]],[[1,0],[1,1],[1,2],[2,1]],[[0,1],[1,0],[1,1],[2,1]]],
  Z: [[[0,0],[0,1],[1,1],[1,2]],[[0,2],[1,1],[1,2],[2,1]]]
};

function draw() {
  clear();
  for (const [r, c] of currentPiece[currentRotation]) {
    const index = (currentPosition.row + r) * width + (currentPosition.col + c);
    if (cells[index]) cells[index].style.backgroundColor = 'aqua';
  }
}

function clear() {
  for (let cell of cells) {
    if (!cell.classList.contains('fixed')) cell.style.backgroundColor = '#111';
  }
}

function fixPiece() {
  for (const [r, c] of currentPiece[currentRotation]) {
    const index = (currentPosition.row + r) * width + (currentPosition.col + c);
    if (cells[index]) {
      cells[index].classList.add('fixed');
      cells[index].style.backgroundColor = 'gray';
    }
  }
}

function isValidMove(shape, pos) {
  return shape.every(([r, c]) => {
    const newRow = pos.row + r;
    const newCol = pos.col + c;
    if (newRow >= height || newCol < 0 || newCol >= width) return false;
    const index = newRow * width + newCol;
    return !cells[index].classList.contains('fixed');
  });
}

function clearLines() {
  for (let r = height - 1; r >= 0; r--) {
    const start = r * width;
    const row = cells.slice(start, start + width);
    if (row.every(cell => cell.classList.contains('fixed'))) {
      for (let i = start - 1; i >= 0; i--) {
        cells[i + width].className = cells[i].className;
        cells[i + width].style.backgroundColor = cells[i].style.backgroundColor;
      }
      for (let i = 0; i < width; i++) {
        cells[i].className = '';
        cells[i].style.backgroundColor = '#111';
      }
      r++;
      score += 100;
      document.getElementById('score').textContent = score;
    }
  }
}

function moveDown() {
  const nextPos = {row: currentPosition.row + 1, col: currentPosition.col};
  if (isValidMove(currentPiece[currentRotation], nextPos)) {
    currentPosition = nextPos;
    draw();
  } else {
    fixPiece();
    clearLines();
    spawnTetromino();
  }
}

function hardDrop() {
  while (isValidMove(currentPiece[currentRotation], {row: currentPosition.row + 1, col: currentPosition.col})) {
    currentPosition.row++;
  }
  draw();
  fixPiece();
  clearLines();
  spawnTetromino();
}

function holdCurrent() {
  if (holdUsed) return;
  holdUsed = true;

  if (!heldPiece) {
    heldPiece = currentPiece;
    spawnTetromino();
  } else {
    const temp = heldPiece;
    heldPiece = currentPiece;
    currentPiece = temp;
    currentRotation = 0;
    currentPosition = {row: 0, col: 3};
    if (!isValidMove(currentPiece[currentRotation], currentPosition)) {
      endGame();
    } else {
      draw();
    }
  }
  renderPreview(heldPiece, 'hold-preview');
}

function randomPiece() {
  const keys = Object.keys(tetrominoes);
  const key = keys[Math.floor(Math.random() * keys.length)];
  return tetrominoes[key];
}

function renderPreview(piece, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  const size = 3;
  const previewGrid = [];
  for (let i = 0; i < size * size; i++) {
    const cell = document.createElement('div');
    container.appendChild(cell);
    previewGrid.push(cell);
  }
  if (!piece) return;
  for (const [r, c] of piece[0]) {
    const index = r * size + c;
    if (previewGrid[index]) previewGrid[index].style.backgroundColor = 'aqua';
  }
}

function spawnTetromino() {
  currentPiece = nextPiece || randomPiece();
  nextPiece = randomPiece();
  currentRotation = 0;
  currentPosition = {row: 0, col: 3};
  holdUsed = false;

  if (!isValidMove(currentPiece[currentRotation], currentPosition)) {
    endGame();
  } else {
    draw();
    renderPreview(nextPiece, 'next-preview');
    renderPreview(heldPiece, 'hold-preview');
  }
}

function startGame() {
  document.querySelector('.game-container').style.display = 'flex';
  document.getElementById('start-screen').style.display = 'none';
  document.getElementById('game-over-screen').style.display = 'none';
  score = 0;
  document.getElementById('score').textContent = score;
  cells.forEach(cell => {
    cell.className = '';
    cell.style.backgroundColor = '#111';
  });
  gameRunning = true;
  nextPiece = null;
  spawnTetromino();
  dropInterval = setInterval(moveDown, 500);
}

function endGame() {
  clearInterval(dropInterval);
  gameRunning = false;
  document.getElementById('game-over-screen').style.display = 'block';
  sendScore(score);
}

document.addEventListener('keydown', (e) => {
  if (!gameRunning) return;
  if (e.key === 'ArrowLeft') {
    const next = {row: currentPosition.row, col: currentPosition.col - 1};
    if (isValidMove(currentPiece[currentRotation], next)) {
      currentPosition = next;
      draw();
    }
  } else if (e.key === 'ArrowRight') {
    const next = {row: currentPosition.row, col: currentPosition.col + 1};
    if (isValidMove(currentPiece[currentRotation], next)) {
      currentPosition = next;
      draw();
    }
  } else if (e.key === 'ArrowDown') {
    moveDown();
  } else if (e.key === 'ArrowUp') {
    const nextRot = (currentRotation + 1) % currentPiece.length;
    if (isValidMove(currentPiece[nextRot], currentPosition)) {
      currentRotation = nextRot;
      draw();
    }
  } else if (e.code === 'Space') {
    hardDrop();
  } else if (e.key === 'c' || e.key === 'C') {
    holdCurrent();
  }
});
// 1. 로그인된 유저 정보 가져오기
async function getDiscordUser() {
  try {
    const res = await fetch("http://localhost:5000/me", {
      credentials: "include"  // ✅ 세션 쿠키 포함해서 보내야 함
    });
    if (!res.ok) throw new Error("Not logged in");
    return await res.json();  // { id, username }
  } catch (err) {
    alert("로그인이 필요합니다!");
    return null;
  }
}

// 2. 점수 서버로 전송
async function sendScore(score) {
  const user = await getDiscordUser();
  if (!user) return;

  fetch("http://localhost:5000/api/tetris-score", {
    method: "POST",
    credentials: "include",  // 🔥 세션 공유 유지
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      score: score  // ID는 서버가 세션으로 처리함!
    })
  }).then(res => res.json())
    .then(data => {
      alert(`💰 ${user.username}님에게 ${score}점 → ${data.money}원 지급됨!`);
    });
}


document.getElementById('start-button').onclick = startGame;
document.getElementById('retry-button').onclick = startGame;
