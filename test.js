// public/script.js
const socket = io(); // เชื่อมต่อไปยัง server เดียวกับที่เสิร์ฟหน้าเว็บ

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');

// UI
const colorEl = document.getElementById('color');
const sizeEl  = document.getElementById('size');
const sizeVal = document.getElementById('sizeVal');
const clearBtn = document.getElementById('clearBtn');
const saveBtn  = document.getElementById('saveBtn');

// ปรับขนาด canvas ให้เต็มหน้าจอ + รองรับจอคมชัด (HiDPI)
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const toolbarHeight = document.querySelector('.toolbar').offsetHeight;
  const w = window.innerWidth;
  const h = window.innerHeight - toolbarHeight;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// สถานะการวาด
let drawing = false;
let lastX = 0, lastY = 0;

function getPosFromEvent(e) {
  // รองรับทั้งเมาส์และทัช
  if (e.touches && e.touches.length > 0) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  } else {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }
}

function drawLine(x1, y1, x2, y2, color, size, emit = false) {
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.closePath();

  if (emit) {
    socket.emit('draw', { x1, y1, x2, y2, color, size });
  }
}

// Mouse events
canvas.addEventListener('mousedown', (e) => {
  drawing = true;
  const pos = getPosFromEvent(e);
  lastX = pos.x;
  lastY = pos.y;
});

canvas.addEventListener('mousemove', (e) => {
  if (!drawing) return;
  const pos = getPosFromEvent(e);
  drawLine(lastX, lastY, pos.x, pos.y, colorEl.value, +sizeEl.value, true);
  lastX = pos.x;
  lastY = pos.y;
});

canvas.addEventListener('mouseup', () => (drawing = false));
canvas.addEventListener('mouseleave', () => (drawing = false));

// Touch events (มือถือ/แท็บเล็ต)
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  drawing = true;
  const pos = getPosFromEvent(e);
  lastX = pos.x;
  lastY = pos.y;
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (!drawing) return;
  const pos = getPosFromEvent(e);
  drawLine(lastX, lastY, pos.x, pos.y, colorEl.value, +sizeEl.value, true);
  lastX = pos.x;
  lastY = pos.y;
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  drawing = false;
}, { passive: false });

// UI handlers
sizeEl.addEventListener('input', () => {
  sizeVal.textContent = sizeEl.value;
});

clearBtn.addEventListener('click', () => {
  socket.emit('clear');
  clearBoard();
});

saveBtn.addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = 'board.png';
  a.click();
});

// เคลียร์กระดาน
function clearBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// รับ event จาก server
socket.on('draw', (data) => {
  const { x1, y1, x2, y2, color, size } = data;
  drawLine(x1, y1, x2, y2, color, size, false);
});

socket.on('clear', () => {
  clearBoard();
});