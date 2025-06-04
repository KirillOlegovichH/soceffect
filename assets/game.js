const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Fullscreen canvas ---
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', () => {
  resizeCanvas();
  ship.x = canvas.width/2;
  ship.y = canvas.height - 70;
  stars = makeStars();
});

// === Основные корабли ===
const ship = {
  x: canvas.width/2,
  y: canvas.height-70,
  w: 40, h: 20, speed: 7,
  health: 5, maxHealth: 5,
  name: "Кирилл"
};
const dashaShip = {
  xOffset: 38, yOffset: 15, w: 22, h: 11,
  helper: true, shooting: false, shootTimer: 0,
  health: 3, maxHealth: 3, name: "Даша",
  disabled: false, disabledTimer: 0
};
const levaShip = {
  xOffset: -38, yOffset: 15, w: 22, h: 11,
  helper: true, shooting: false, shootTimer: 0,
  health: 3, maxHealth: 3, name: "Лёва",
  disabled: false, disabledTimer: 0
};
const HELPER_DISABLED_TIME = 4000;

// === Враги ===
const cometTypes = [
  { color: "#fc0", damage: 1, score: 1, r: 15, speed: 2, shadow: "#fff" },
  { color: "#ff4e4e", damage: 2, score: 2, r: 20, speed: 1.2, shadow: "#ffbaba" },
  { color: "#40ff96", damage: 1, score: 2, r: 13, speed: 3.2, shadow: "#caffc1" },
  { color: "#8e43ff", damage: 3, score: 3, r: 26, speed: 1, shadow: "#e0d1ff" }
];
const comets = [];
let cometTimer = 0;

// === Пули ===
const bullets = [];

// === Бонусы ===
const bonuses = [];
let bonusTimer = 0;
let bonusInterval = 600;
let fireRateBonus = 250;
let fireRateActive = false;
let fireRateBonusTimer = 0;
let helperShootActive = false;
let helperBonusTimer = 0;
const BONUS_DURATION = 8000;

// === Света с бокалом шампанского и тёмным клубным фоном ===
let sveta = {
  visible: false,
  timer: 0,
  duration: 3000,
  x: 0,
  y: 0,
  nextTime: Date.now() + 5000 + Math.random()*12000,
  fade: 0,
  radius: 18,
  wasShot: false
};

let invincible = false;
let invincibleTimer = 0;
const INVINCIBLE_DURATION = 5000; // 5 секунд неуязвимости

function drawClubBackground(x, y, r=45) {
  ctx.save();
  for (let i = 0; i < 9; i++) {
    ctx.beginPath();
    ctx.arc(x, y, r*(1-i*0.10), 0, 2*Math.PI);
    ctx.globalAlpha = 0.07 + 0.045*Math.sin(Date.now()/300 + i);
    ctx.fillStyle = `hsl(${(Date.now()/13 + i*40)%360},60%,23%)`;
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(x, y+10, r*0.5, 0, 2*Math.PI);
  ctx.globalAlpha = 0.09 + 0.03*Math.sin(Date.now()/900);
  ctx.fillStyle = "#555";
  ctx.fill();
  ctx.globalAlpha = 1.0;
  ctx.restore();
}

function updateSveta() {
  const now = Date.now();
  if (!sveta.visible && now > sveta.nextTime) {
    sveta.visible = true;
    sveta.timer = sveta.duration;
    sveta.wasShot = false;
    sveta.x = 70 + Math.random() * (canvas.width - 140);
    sveta.y = 90 + Math.random() * (canvas.height/2 - 100);
    sveta.nextTime = now + 9000 + Math.random() * 9000;
    sveta.fade = 0;
  }
  if (sveta.visible) {
    const dt = now - lastUpdate;
    // Fade-in
    if (!sveta.wasShot && sveta.timer > sveta.duration - 300) {
      sveta.fade = Math.min(1, sveta.fade + dt / 300);
    // Fade-out
    } else if (sveta.wasShot || sveta.timer < 300) {
      sveta.fade = Math.max(0, sveta.fade - dt / 200); // быстрее исчезает при выстреле
    } else {
      sveta.fade = 1;
    }
    sveta.timer -= (now - lastUpdate);
    if (sveta.timer <= 0 || (sveta.wasShot && sveta.fade <= 0)) {
      sveta.visible = false;
    }
  }
}

function drawSveta() {
  if (!sveta.visible || sveta.fade <= 0) return;
  ctx.save();
  ctx.globalAlpha = sveta.fade;
  ctx.translate(sveta.x, sveta.y);

  // Клубный фон (стал меньше и темнее)
  drawClubBackground(0, 0, 38);

  // Света (меньше)
  ctx.globalAlpha *= 0.9 + 0.1*Math.sin(Date.now()/250);
  ctx.beginPath();
  ctx.arc(0, 0, sveta.radius, 0, 2*Math.PI);
  ctx.fillStyle = "#fff9d2";
  ctx.shadowColor = "#fff6b7";
  ctx.shadowBlur = 10 + Math.random()*4;
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 3);
  ctx.lineTo(-4.2, 10);
  ctx.lineTo(4.2, 10);
  ctx.closePath();
  ctx.fillStyle = "#ffcbf7";
  ctx.shadowBlur = 0;
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(0, -3, 3.5, 0, 2*Math.PI);
  ctx.fillStyle = "#ffeccd";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, -5, 3.5, Math.PI*0.2, Math.PI*0.8, false);
  ctx.lineTo(0, -5);
  ctx.closePath();
  ctx.fillStyle = "#ffe96a";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(-1, -4, 0.5, 0, 2*Math.PI);
  ctx.arc(1, -4, 0.5, 0, 2*Math.PI);
  ctx.fillStyle = "#824300";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, -2, 1, Math.PI*0.1, Math.PI*0.9);
  ctx.lineWidth = 0.5;
  ctx.strokeStyle = "#a16236";
  ctx.stroke();

  // Бокал
  ctx.save();
  ctx.strokeStyle = "#ffeccd";
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(2, 0);
  ctx.lineTo(7, -4);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(8.7, -5.2, 1.1, 2, -0.5, 0, 2*Math.PI);
  ctx.fillStyle = "#fffbe4";
  ctx.globalAlpha = 0.8;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.moveTo(8.7, -3.2);
  ctx.lineTo(8.7, -1.5);
  ctx.strokeStyle = "#d9cfff";
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(8.7, -5.7, 0.7, Math.PI*0.4, Math.PI*1.6, false);
  ctx.strokeStyle = "#eccd7b";
  ctx.globalAlpha = 0.7;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();

  ctx.font = "bold 8px Arial";
  ctx.fillStyle = "#ff4ec2";
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.textAlign = "center";
  ctx.strokeText("Света", 0, 20);
  ctx.fillText("Света", 0, 20);

  ctx.restore();
}

function checkSvetaHit(bullet) {
  if (
    sveta.visible && !sveta.wasShot &&
    Math.hypot(bullet.x - sveta.x, bullet.y - sveta.y) < sveta.radius + 4
  ) {
    sveta.wasShot = true;
    sveta.timer = Math.min(sveta.timer, 250);
    sveta.fade = Math.max(0.3, sveta.fade);
    // Включить неуязвимость
    invincible = true;
    invincibleTimer = INVINCIBLE_DURATION;
    return true;
  }
  return false;
}

function drawInvincibleAura() {
  if (!invincible) return;
  ctx.save();
  ctx.globalAlpha = 0.26 + 0.14 * Math.sin(Date.now()/220);
  ctx.beginPath();
  ctx.arc(ship.x, ship.y, 54 + 8*Math.sin(Date.now()/110), 0, 2*Math.PI);
  ctx.fillStyle = '#ffe19d';
  ctx.shadowColor = "#fff9d6";
  ctx.shadowBlur = 16;
  ctx.fill();
  ctx.restore();
}

// === Другое ===
let score = 0;
let gameOver = false;
function makeStars() {
  return Array.from({length: 50}, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.5 + 0.5,
    speed: Math.random() * 1.5 + 0.5
  }));
}
let stars = makeStars();
let leftPressed = false;
let rightPressed = false;

// === Фон ===
function drawStars() {
  ctx.save();
  ctx.fillStyle = '#fff';
  for (const star of stars) {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, 2 * Math.PI);
    ctx.fill();
  }
  ctx.restore();
}
function updateStars() {
  for (const star of stars) {
    star.y += star.speed;
    if (star.y > canvas.height) {
      star.y = 0;
      star.x = Math.random() * canvas.width;
    }
  }
}

// === Кометы ===
function spawnComet() {
  const type = cometTypes[Math.floor(Math.random() * cometTypes.length)];
  comets.push({
    ...type,
    x: Math.random() * (canvas.width - 40) + 20,
    y: -type.r,
    w: type.r * 2,
    h: type.r * 2,
    tail: Array.from({length: 10}, (_, i) => ({dx: 0, dy: i * 8}))
  });
}
function drawComets() {
  for (const comet of comets) {
    for (let i = comet.tail.length - 1; i >= 0; i--) {
      const t = comet.tail[i];
      ctx.beginPath();
      ctx.arc(comet.x - t.dx, comet.y - t.dy, comet.r * (1 - i/comet.tail.length) * 0.7, 0, 2 * Math.PI);
      ctx.fillStyle = comet.color + (comet.color.length === 4 ? "4a" : "22");
      ctx.fill();
    }
    ctx.save();
    ctx.beginPath();
    ctx.arc(comet.x, comet.y, comet.r, 0, 2 * Math.PI);
    ctx.fillStyle = comet.color;
    ctx.shadowColor = comet.shadow;
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    ctx.save();
    ctx.font = "bold 15px Arial";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText("−" + comet.damage, comet.x, comet.y + 6);
    ctx.restore();
  }
}
function updateComets() {
  for (const comet of comets) {
    comet.y += comet.speed;
  }
  for (let i = comets.length - 1; i >= 0; i--) {
    if (comets[i].y > canvas.height + 40) comets.splice(i, 1);
  }
}

// === Бонусы ===
function spawnBonus() {
  const types = ['fast', 'helper'];
  const type = types[Math.floor(Math.random()*types.length)];
  bonuses.push({
    type,
    x: Math.random() * (canvas.width - 40) + 20,
    y: -20,
    r: 14,
    speed: 2 + Math.random()*1.5
  });
}
function drawBonuses() {
  for (const bonus of bonuses) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(bonus.x, bonus.y, bonus.r, 0, 2 * Math.PI);
    if (bonus.type === 'fast') {
      ctx.fillStyle = "#f5ff3a";
      ctx.shadowColor = "#fff600";
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#aeac00";
      ctx.font = "bold 18px Arial";
      ctx.textAlign = "center";
      ctx.fillText("💥", bonus.x, bonus.y+7);
    } else if (bonus.type === 'helper') {
      ctx.fillStyle = "#aafffd";
      ctx.shadowColor = "#00fff0";
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#009ca8";
      ctx.font = "bold 15px Arial";
      ctx.textAlign = "center";
      ctx.fillText("👾", bonus.x, bonus.y+6);
    }
    ctx.restore();
  }
}
function updateBonuses() {
  for (const bonus of bonuses) {
    bonus.y += bonus.speed;
  }
  for (let i = bonuses.length - 1; i >= 0; i--) {
    if (bonuses[i].y > canvas.height + 20) bonuses.splice(i, 1);
  }
}

// === Корабли ===
function drawShip() {
  ctx.save();
  ctx.translate(ship.x, ship.y);

  ctx.shadowColor = '#0ff';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.moveTo(0, -24);
  ctx.lineTo(16, 16);
  ctx.lineTo(8, 16);
  ctx.lineTo(0, 6);
  ctx.lineTo(-8, 16);
  ctx.lineTo(-16, 16);
  ctx.closePath();
  ctx.fillStyle = "#3191ff";
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(0, -8, 7, 9, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#7fffff";
  ctx.globalAlpha = 0.85;
  ctx.fill();
  ctx.globalAlpha = 1.0;

  ctx.beginPath();
  ctx.moveTo(-16, 16);
  ctx.lineTo(-18, 24);
  ctx.lineTo(-8, 16);
  ctx.closePath();
  ctx.fillStyle = "#fff";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(16, 16);
  ctx.lineTo(18, 24);
  ctx.lineTo(8, 16);
  ctx.closePath();
  ctx.fillStyle = "#fff";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-6, 16);
  ctx.lineTo(0, 28 + Math.random()*6);
  ctx.lineTo(6, 16);
  ctx.closePath();
  ctx.fillStyle = "orange";
  ctx.globalAlpha = 0.8;
  ctx.fill();
  ctx.globalAlpha = 1.0;

  ctx.restore();

  drawNameAndHealthBar(ship.x, ship.y - 28, ship.name, ship.health, ship.maxHealth, 44);
}
function drawDashaShip() {
  drawHelperShip(
    dashaShip,
    "#f389ff", "#ffe3fd", "#ffb6ff", "#ff8aff"
  );
}
function drawLevaShip() {
  drawHelperShip(
    levaShip,
    "#3ef3ff", "#e1feff", "#b6feff", "#8affff"
  );
}
function drawHelperShip(shipInfo, colorBody, colorCabin, colorFire, colorShadow) {
  const x = ship.x + shipInfo.xOffset;
  const y = ship.y + shipInfo.yOffset;
  ctx.save();
  ctx.globalAlpha = shipInfo.disabled ? 0.4 : 1.0;
  ctx.translate(x, y);

  ctx.shadowColor = colorShadow;
  ctx.shadowBlur = 10;

  ctx.beginPath();
  ctx.moveTo(0, -13);
  ctx.lineTo(7, 8);
  ctx.lineTo(3.5, 8);
  ctx.lineTo(0, 2);
  ctx.lineTo(-3.5, 8);
  ctx.lineTo(-7, 8);
  ctx.closePath();
  ctx.fillStyle = colorBody;
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(0, -4, 3.5, 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = colorCabin;
  ctx.globalAlpha = shipInfo.disabled ? 0.5 : 0.85;
  ctx.fill();
  ctx.globalAlpha = shipInfo.disabled ? 0.4 : 1.0;

  ctx.beginPath();
  ctx.moveTo(-7, 8);
  ctx.lineTo(-8, 13);
  ctx.lineTo(-3.5, 8);
  ctx.closePath();
  ctx.fillStyle = "#fff";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(7, 8);
  ctx.lineTo(8, 13);
  ctx.lineTo(3.5, 8);
  ctx.closePath();
  ctx.fillStyle = "#fff";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-2.5, 8);
  ctx.lineTo(0, 15 + Math.random()*4);
  ctx.lineTo(2.5, 8);
  ctx.closePath();
  ctx.fillStyle = colorFire;
  ctx.globalAlpha = shipInfo.disabled ? 0.15 : 0.7;
  ctx.fill();
  ctx.globalAlpha = 1.0;

  if (shipInfo.disabled) {
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, 2 * Math.PI);
    ctx.strokeStyle = "#a6fff7";
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.7;
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }

  ctx.restore();
  drawNameAndHealthBar(
    x, y - 18, shipInfo.name, shipInfo.health, shipInfo.maxHealth, 24, shipInfo.disabled, shipInfo.disabledTimer
  );
}
function drawNameAndHealthBar(x, y, name, health, maxHealth, width, disabled, disabledTimer) {
  ctx.save();
  ctx.font = "bold 13px Arial";
  ctx.textAlign = "center";
  ctx.strokeStyle = "#222";
  ctx.lineWidth = 2;
  ctx.strokeText(name, x, y - 3);
  ctx.fillStyle = "#fff";
  ctx.fillText(name, x, y - 3);
  ctx.strokeStyle = "#222";
  ctx.lineWidth = 2;
  ctx.strokeRect(x - width/2, y + 2, width, 7);
  ctx.fillStyle = disabled ? "#888" : "#0f0";
  ctx.fillRect(x - width/2, y + 2, width * Math.max(0, health) / maxHealth, 7);

  if (disabled && disabledTimer > 0) {
    ctx.font = "11px Arial";
    ctx.fillStyle = "#aafffd";
    ctx.fillText("Восстановление: " + (disabledTimer/1000).toFixed(1), x, y + 17);
  }
  ctx.restore();
}

// === Пули ===
function drawBullets() {
  ctx.fillStyle = '#ff0';
  bullets.forEach(b => {
    ctx.save();
    ctx.shadowColor = b.helper ? '#8affff' : '#ff0';
    ctx.shadowBlur = 8;
    ctx.fillRect(b.x-2, b.y, 4, 10);
    ctx.restore();
  });
}

// === Таймеры бонусов и восстановления помощников ===
function updateBonusTimers(dt) {
  if (fireRateActive) {
    fireRateBonusTimer -= dt;
    if (fireRateBonusTimer <= 0) {
      fireRateActive = false;
      fireRateBonus = 250;
      fireRateBonusTimer = 0;
    }
  }
  if (helperShootActive) {
    helperBonusTimer -= dt;
    if (helperBonusTimer <= 0) {
      helperShootActive = false;
      dashaShip.shooting = false;
      levaShip.shooting = false;
      helperBonusTimer = 0;
    }
  }
  if (dashaShip.disabled) {
    dashaShip.disabledTimer -= dt;
    if (dashaShip.disabledTimer <= 0) {
      dashaShip.disabled = false;
      dashaShip.health = dashaShip.maxHealth;
      dashaShip.disabledTimer = 0;
    }
  }
  if (levaShip.disabled) {
    levaShip.disabledTimer -= dt;
    if (levaShip.disabledTimer <= 0) {
      levaShip.disabled = false;
      levaShip.health = levaShip.maxHealth;
      levaShip.disabledTimer = 0;
    }
  }
}

// === Столкновения ===
function checkCollisions() {
  // --- Света ---
  for (let j = bullets.length - 1; j >= 0; j--) {
    if (checkSvetaHit(bullets[j])) {
      bullets.splice(j,1);
      break;
    }
  }

  // --- Остальные столкновения ---
  for (let i = comets.length - 1; i >= 0; i--) {
    const comet = comets[i];
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      const dx = comet.x - b.x;
      const dy = comet.y - b.y;
      if (Math.hypot(dx, dy) < comet.r + 5) {
        comets.splice(i, 1);
        bullets.splice(j, 1);
        score += comet.score;
        break;
      }
    }
    // Неуязвимость
    if (
      comet.y + comet.r > ship.y &&
      comet.x > ship.x - ship.w/2 &&
      comet.x < ship.x + ship.w/2 &&
      ship.health > 0
    ) {
      if (!invincible) {
        ship.health -= comet.damage;
        if (ship.health <= 0) gameOver = true;
      }
      comets.splice(i, 1);
      continue;
    }
    // Помощники (без изменений)
    const dashaX = ship.x + dashaShip.xOffset;
    const dashaY = ship.y + dashaShip.yOffset;
    if (
      !dashaShip.disabled &&
      dashaShip.health > 0 &&
      Math.abs(comet.x - dashaX) < dashaShip.w/2 + comet.r &&
      Math.abs(comet.y - dashaY) < dashaShip.h/2 + comet.r
    ) {
      dashaShip.health -= comet.damage;
      comets.splice(i, 1);
      if (dashaShip.health <= 0) {
        dashaShip.health = 0;
        dashaShip.disabled = true;
        dashaShip.disabledTimer = HELPER_DISABLED_TIME;
      }
      continue;
    }
    const levaX = ship.x + levaShip.xOffset;
    const levaY = ship.y + levaShip.yOffset;
    if (
      !levaShip.disabled &&
      levaShip.health > 0 &&
      Math.abs(comet.x - levaX) < levaShip.w/2 + comet.r &&
      Math.abs(comet.y - levaY) < levaShip.h/2 + comet.r
    ) {
      levaShip.health -= comet.damage;
      comets.splice(i, 1);
      if (levaShip.health <= 0) {
        levaShip.health = 0;
        levaShip.disabled = true;
        levaShip.disabledTimer = HELPER_DISABLED_TIME;
      }
      continue;
    }
  }
  // --- Бонусы (без изменений) ---
  for (let i = bonuses.length - 1; i >= 0; i--) {
    const bonus = bonuses[i];
    if (
      bonus.y + bonus.r > ship.y &&
      bonus.x > ship.x - ship.w/2 &&
      bonus.x < ship.x + ship.w/2
    ) {
      if (bonus.type === 'fast') {
        fireRateBonus = 110;
        fireRateActive = true;
        fireRateBonusTimer = BONUS_DURATION;
      }
      if (bonus.type === 'helper') {
        helperShootActive = true;
        dashaShip.shooting = true;
        levaShip.shooting = true;
        helperBonusTimer = BONUS_DURATION;
      }
      bonuses.splice(i, 1);
    }
  }
}

// === Помощники стреляют ===
function helpersShoot() {
  if (!helperShootActive) return;
  if (dashaShip.shooting && dashaShip.health > 0 && !dashaShip.disabled) {
    dashaShip.shootTimer = (dashaShip.shootTimer || 0) + fireRateBonus;
    if (dashaShip.shootTimer >= 500) {
      bullets.push({ x: ship.x + dashaShip.xOffset, y: ship.y + dashaShip.yOffset - 10, helper: true });
      dashaShip.shootTimer = 0;
    }
  }
  if (levaShip.shooting && levaShip.health > 0 && !levaShip.disabled) {
    levaShip.shootTimer = (levaShip.shootTimer || 0) + fireRateBonus;
    if (levaShip.shootTimer >= 500) {
      bullets.push({ x: ship.x + levaShip.xOffset, y: ship.y + levaShip.yOffset - 10, helper: true });
      levaShip.shootTimer = 0;
    }
  }
}

// === Таймер неуязвимости ===
function updateInvincible(dt) {
  if (invincible) {
    invincibleTimer -= dt;
    if (invincibleTimer <= 0) {
      invincible = false;
    }
  }
}

// === Игровой цикл ===
let lastUpdate = Date.now();
function update() {
  if (gameOver) return;
  const now = Date.now();
  const dt = now - lastUpdate;
  lastUpdate = now;

  if (leftPressed) ship.x -= ship.speed;
  if (rightPressed) ship.x += ship.speed;
  ship.x = Math.max(20, Math.min(canvas.width - 20, ship.x));

  bullets.forEach(b => b.y -= 8);
  for (let i = bullets.length - 1; i >= 0; i--) {
    if (bullets[i].y < -10) bullets.splice(i, 1);
  }

  cometTimer++;
  if (cometTimer > 50) {
    spawnComet();
    cometTimer = 0;
  }
  updateComets();

  bonusTimer++;
  if (bonusTimer > bonusInterval) {
    spawnBonus();
    bonusTimer = 0;
  }
  updateBonuses();

  updateStars();
  checkCollisions();
  updateSveta();
  helpersShoot();
  updateBonusTimers(dt);
  updateInvincible(dt);
}

let lastFireTime = 0;
function tryToFire() {
  const now = Date.now();
  if (now - lastFireTime >= fireRateBonus && !gameOver) {
    bullets.push({ x: ship.x, y: ship.y });
    lastFireTime = now;
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawStars();
  drawSveta();
  drawInvincibleAura();
  drawShip();
  drawDashaShip();
  drawLevaShip();
  drawBullets();
  drawComets();
  drawBonuses();

  ctx.fillStyle = '#fff';
  ctx.font = "20px Arial";
  ctx.fillText("Очки: "+score, 10, 30);

  ctx.font = "15px Arial";
  if (fireRateActive) {
    ctx.fillStyle = "#f5ff3a";
    ctx.fillText("Скорость стрельбы: ↑", 178, 28);
    ctx.font = "12px Arial";
    ctx.fillText("Быстро: " + (fireRateBonusTimer/1000).toFixed(1) + " сек", 178, 43);
  }
  if (helperShootActive) {
    ctx.font = "15px Arial";
    ctx.fillStyle = "#aafffd";
    ctx.fillText("Помощники стреляют!", 178, 62);
    ctx.font = "12px Arial";
    ctx.fillText("Время: " + (helperBonusTimer/1000).toFixed(1) + " сек", 178, 77);
  }
  if (invincible) {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#ffe19d";
    ctx.fillText("Неуязвимость: " + (invincibleTimer/1000).toFixed(1), 10, 54);
  }

  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, canvas.height/2-40, canvas.width, 80);
    ctx.fillStyle = "#fff";
    ctx.font = "36px Arial";
    ctx.fillText("Игра окончена", 80, canvas.height/2);
    ctx.font = "20px Arial";
    ctx.fillText("Ваш счет: "+score, 130, canvas.height/2+30);
  }
}

function gameLoop() {
  update();
  render();
  if (!gameOver) requestAnimationFrame(gameLoop);
}

function restartGame() {
  comets.length = 0;
  bullets.length = 0;
  ship.x = canvas.width/2;
  ship.y = canvas.height - 70;
  score = 0;
  gameOver = false;
  cometTimer = 0;
  bonusTimer = 0;
  fireRateBonus = 250;
  fireRateActive = false;
  fireRateBonusTimer = 0;
  helperShootActive = false;
  helperBonusTimer = 0;
  dashaShip.shooting = false;
  levaShip.shooting = false;
  lastFireTime = 0;
  ship.health = ship.maxHealth;
  dashaShip.health = dashaShip.maxHealth;
  levaShip.health = levaShip.maxHealth;
  dashaShip.disabled = false;
  levaShip.disabled = false;
  dashaShip.disabledTimer = 0;
  levaShip.disabledTimer = 0;
  lastUpdate = Date.now();
  invincible = false;
  invincibleTimer = 0;
  stars = makeStars();
  gameLoop();
}

setInterval(() => {
  tryToFire();
}, 20);

window.addEventListener('keydown', e => {
  if (e.code === 'ArrowLeft') leftPressed = true;
  if (e.code === 'ArrowRight') rightPressed = true;
  if (e.code === 'Space' && gameOver) restartGame();
});
window.addEventListener('keyup', e => {
  if (e.code === 'ArrowLeft') leftPressed = false;
  if (e.code === 'ArrowRight') rightPressed = false;
});

canvas.addEventListener('touchstart', e => {
  if (gameOver) {
    restartGame();
    return;
  }
  const touchX = e.touches[0].clientX;
  if (touchX < canvas.width / 2) leftPressed = true;
  else rightPressed = true;
});
canvas.addEventListener('touchend', () => {
  leftPressed = false;
  rightPressed = false;
});

restartGame();
