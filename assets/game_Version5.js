const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const ship = { x: 200, y: 550, w: 40, h: 20, speed: 5 };
const bullets = [];
let leftPressed = false;
let rightPressed = false;

function drawShip() {
  ctx.fillStyle = '#0ff';
  ctx.fillRect(ship.x - ship.w/2, ship.y, ship.w, ship.h);
}

function drawBullets() {
  ctx.fillStyle = '#ff0';
  bullets.forEach(b => ctx.fillRect(b.x-2, b.y, 4, 10));
}

function update() {
  // Move ship
  if (leftPressed) ship.x -= ship.speed;
  if (rightPressed) ship.x += ship.speed;
  ship.x = Math.max(ship.w/2, Math.min(canvas.width - ship.w/2, ship.x));
  
  // Move bullets
  bullets.forEach(b => b.y -= 8);
  // Remove bullets that are off screen
  for (let i = bullets.length - 1; i >= 0; i--) {
    if (bullets[i].y < -10) bullets.splice(i, 1);
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawShip();
  drawBullets();
}

function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

// Auto shoot
setInterval(() => {
  bullets.push({ x: ship.x, y: ship.y });
}, 250);

// Keyboard controls
window.addEventListener('keydown', e => {
  if (e.code === 'ArrowLeft') leftPressed = true;
  if (e.code === 'ArrowRight') rightPressed = true;
});
window.addEventListener('keyup', e => {
  if (e.code === 'ArrowLeft') leftPressed = false;
  if (e.code === 'ArrowRight') rightPressed = false;
});

// Touch controls for mobile
canvas.addEventListener('touchstart', e => {
  const touchX = e.touches[0].clientX;
  if (touchX < canvas.width / 2) leftPressed = true;
  else rightPressed = true;
});
canvas.addEventListener('touchend', () => {
  leftPressed = false;
  rightPressed = false;
});

gameLoop();