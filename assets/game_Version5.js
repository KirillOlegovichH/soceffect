const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// === Основные корабли ===
const ship = { 
  x: 200, y: 550, w: 40, h: 20, speed: 5, 
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

// === Спецкорабли ===
const policeShip = {
  x: -60,
  y: 80,
  w: 46,
  h: 20,
  speed: 3.5,
  visible: false,
  side: 'left',
  timer: 0
};
const POLICE_INTERVAL = 4500 + Math.random() * 8000;
let policeNextTime = Date.now() + POLICE_INTERVAL;

const fireShip = {
  x: -60,
  y: 135,
  w: 48,
  h: 21,
  speed: 3,
  visible: false,
  side: 'left',
  timer: 0
};
const FIRE_INTERVAL = 7000 + Math.random() * 9000;
let fireNextTime = Date.now() + FIRE_INTERVAL;

// === Аня и Маша на коляске ===
const strollerShips = [
  {
    name: "Аня",
    y: 600,
    x: 80,
    w: 28,
    h: 22,
    speed: 1.1,
    state: "waiting",
    timer: 0
  },
  {
    name: "Маша 👶",
    y: 600,
    x: 115,
    w: 28,
    h: 22,
    speed: 1.1,
    state: "waiting",
    timer: 0
  }
];
let nextStrollerTime = Date.now() + 5000 + Math.random()*9000;

// === Космические станции ===
const stations = [
  { name: "Уралмаш", color: "#e0fffd" },
  { name: "Казахстан", color: "#fffbb0" },
  { name: "Кузино", color: "#ffdabf" },
  { name: "Уктус", color: "#e8e8ff" },
  { name: "Тайланд", color: "#eaffd6" }
];
let currentStation = null;
let stationY = -120;
let stationX = 80;
let stationTimer = 0;
let nextStationTime = Date.now() + 9000 + Math.random()*12000;

// === Света с бокалом шампанского ===
let sveta = {
  visible: false,
  timer: 0,
  duration: 700,
  x: 0,
  y: 0,
  nextTime: Date.now() + 5000 + Math.random()*12000
};

// === Другое ===
let score = 0;
let gameOver = false;
const stars = Array.from({length: 50}, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  r: Math.random() * 1.5 + 0.5,
  speed: Math.random() * 1.5 + 0.5
}));
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

// === Космические станции ===
function updateStation() {
  const now = Date.now();
  if (!currentStation && now > nextStationTime) {
    currentStation = stations[Math.floor(Math.random() * stations.length)];
    stationY = -120;
    stationX = 60 + Math.random() * (canvas.width - 120);
    stationTimer = 0;
    nextStationTime = now + 14000 + Math.random()*15000;
  }
  if (currentStation) {
    stationY += 1.25;
    if (stationY > canvas.height + 80) {
      currentStation = null;
    }
  }
}
function drawStation() {
  if (!currentStation) return;
  ctx.save();
  ctx.translate(stationX, stationY);

  // Основной корпус (овал)
  ctx.beginPath();
  ctx.ellipse(0, 0, 52, 16, 0, 0, 2 * Math.PI);
  ctx.fillStyle = currentStation.color;
  ctx.shadowColor = "#fff";
  ctx.shadowBlur = 14;
  ctx.fill();

  // Центральная башня
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, -12, 13, 18, 0, 0, 2 * Math.PI);
  ctx.fillStyle = "#b7bfcf";
  ctx.shadowBlur = 0;
  ctx.fill();
  ctx.restore();

  // Парные "солнечные панели"
  for (const dx of [-40, 40]) {
    ctx.save();
    ctx.translate(dx, 0);
    ctx.beginPath();
    ctx.rect(-11, -8, 22, 16);
    ctx.fillStyle = "#2386d2";
    ctx.globalAlpha = 0.65;
    ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.restore();
  }

  // Окна и детали
  for (let i = -24; i <= 24; i += 12) {
    ctx.beginPath();
    ctx.arc(i, 5, 4, 0, 2*Math.PI);
    ctx.fillStyle = "#3fffd5";
    ctx.globalAlpha = 0.4 + Math.random()*0.5;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Имя станции
  ctx.font = "bold 16px Arial";
  ctx.strokeStyle = "#222";
  ctx.lineWidth = 4;
  ctx.textAlign = "center";
  ctx.shadowBlur = 0;
  ctx.strokeText(currentStation.name, 0, 38);
  ctx.fillStyle = "#000";
  ctx.fillText(currentStation.name, 0, 38);

  // Казахстан: Ирина, Артем, Дима, Аська в колпаке
  if (currentStation.name === "Казахстан") {
    // Ирина
    ctx.save();
    ctx.translate(-24, -32);
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.lineTo(-5, 23);
    ctx.lineTo(5, 23);
    ctx.closePath();
    ctx.fillStyle = "#d3a7ff";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffeccd";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -4, 6, Math.PI*0.2, Math.PI*0.8, false);
    ctx.lineTo(0, -4);
    ctx.closePath();
    ctx.fillStyle = "#ffe96a";
    ctx.fill();
    ctx.font = "bold 11px Arial";
    ctx.fillStyle = "#a800ff";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeText("Ирина", 0, 29);
    ctx.fillText("Ирина", 0, 29);
    ctx.restore();
    // Артем
    ctx.save();
    ctx.translate(-7, -27);
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(-4, 18);
    ctx.lineTo(4, 18);
    ctx.closePath();
    ctx.fillStyle = "#8ec7ff";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffeccd";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -3, 5, Math.PI*0.1, Math.PI*0.9, false);
    ctx.lineTo(0, -3);
    ctx.closePath();
    ctx.fillStyle = "#b48f61";
    ctx.fill();
    ctx.font = "bold 10px Arial";
    ctx.fillStyle = "#0077c2";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeText("Артём", 0, 25);
    ctx.fillText("Артём", 0, 25);
    ctx.restore();
    // Дима
    ctx.save();
    ctx.translate(8, -23);
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.lineTo(-3, 14);
    ctx.lineTo(3, 14);
    ctx.closePath();
    ctx.fillStyle = "#8aff85";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 4.8, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffeccd";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -2.8, 4.8, Math.PI*0.1, Math.PI*0.9, false);
    ctx.lineTo(0, -2.8);
    ctx.closePath();
    ctx.fillStyle = "#444";
    ctx.fill();
    ctx.font = "bold 10px Arial";
    ctx.fillStyle = "#169600";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeText("Дима", 0, 22);
    ctx.fillText("Дима", 0, 22);
    ctx.restore();
    // Аська (поварской колпак)
    ctx.save();
    ctx.translate(23, -35);
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.lineTo(-5, 20);
    ctx.lineTo(5, 20);
    ctx.closePath();
    ctx.fillStyle = "#ffe5c4";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 5.5, 0, 2 * Math.PI);
    ctx.fillStyle = "#fff1dc";
    ctx.fill();
    // Поварской колпак
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, -6.5, 6, Math.PI*0.8, Math.PI*2.2, false);
    ctx.lineTo(0, -10);
    ctx.closePath();
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "#eee";
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.restore();
    ctx.font = "bold 10px Arial";
    ctx.fillStyle = "#d77e00";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeText("Аська", 0, 25);
    ctx.fillText("Аська", 0, 25);
    ctx.restore();
  }

  // Уктус: Данька, Лида, Алиса
  if (currentStation.name === "Уктус") {
    // Данька
    ctx.save();
    ctx.translate(-19, -27);
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(-4, 18);
    ctx.lineTo(4, 18);
    ctx.closePath();
    ctx.fillStyle = "#ffe98a";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 5.2, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffeccd";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -3, 5.2, Math.PI*0.1, Math.PI*0.95, false);
    ctx.lineTo(0, -3);
    ctx.closePath();
    ctx.fillStyle = "#d1a45d";
    ctx.fill();
    ctx.font = "bold 10px Arial";
    ctx.fillStyle = "#b38600";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeText("Данька", 0, 25);
    ctx.fillText("Данька", 0, 25);
    ctx.restore();
    // Лида
    ctx.save();
    ctx.translate(0, -33);
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.lineTo(-5, 20);
    ctx.lineTo(5, 20);
    ctx.closePath();
    ctx.fillStyle = "#ffbde8";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, 2 * Math.PI);
    ctx.fillStyle = "#fff7e0";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -4, 6, Math.PI*0.2, Math.PI*0.8, false);
    ctx.lineTo(0, -4);
    ctx.closePath();
    ctx.fillStyle = "#e4bfff";
    ctx.fill();
    ctx.font = "bold 11px Arial";
    ctx.fillStyle = "#ad00a7";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeText("Лида", 0, 29);
    ctx.fillText("Лида", 0, 29);
    ctx.restore();
    // Алиса
    ctx.save();
    ctx.translate(19, -27);
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.lineTo(-3, 14);
    ctx.lineTo(3, 14);
    ctx.closePath();
    ctx.fillStyle = "#e7f8ff";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffeccd";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -2.4, 5, Math.PI*0.15, Math.PI*0.85, false);
    ctx.lineTo(0, -2.4);
    ctx.closePath();
    ctx.fillStyle = "#d0eaff";
    ctx.fill();
    ctx.font = "bold 10px Arial";
    ctx.fillStyle = "#0077c2";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeText("Алиса", 0, 22);
    ctx.fillText("Алиса", 0, 22);
    ctx.restore();
  }

  // Тайланд: Юра
  if (currentStation.name === "Тайланд") {
    ctx.save();
    ctx.translate(0, -32);
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.lineTo(-5, 20);
    ctx.lineTo(5, 20);
    ctx.closePath();
    ctx.fillStyle = "#65ffba";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffeccd";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -5, 7, Math.PI*0.2, Math.PI*0.8, false);
    ctx.lineTo(0, -5);
    ctx.closePath();
    ctx.fillStyle = "#402c13";
    ctx.fill();
    ctx.font = "bold 13px Arial";
    ctx.fillStyle = "#00b168";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeText("Юра", 0, 25);
    ctx.fillText("Юра", 0, 25);
    ctx.restore();
  }

  ctx.restore();
}

// === Спецкорабли ===
function updatePoliceShip() {
  const now = Date.now();
  if (!policeShip.visible && now > policeNextTime) {
    policeShip.visible = true;
    policeShip.side = Math.random() < 0.5 ? 'left' : 'right';
    policeShip.y = 60 + Math.random() * 120;
    if (policeShip.side === 'left') {
      policeShip.x = -policeShip.w;
    } else {
      policeShip.x = canvas.width + policeShip.w;
    }
    policeShip.timer = 0;
    policeNextTime = now + POLICE_INTERVAL + Math.random() * 8000;
  }
  if (policeShip.visible) {
    if (policeShip.side === 'left') {
      policeShip.x += policeShip.speed;
      if (policeShip.x > canvas.width + policeShip.w) policeShip.visible = false;
    } else {
      policeShip.x -= policeShip.speed;
      if (policeShip.x < -policeShip.w) policeShip.visible = false;
    }
  }
}
function updateFireShip() {
  const now = Date.now();
  if (!fireShip.visible && now > fireNextTime) {
    fireShip.visible = true;
    fireShip.side = Math.random() < 0.5 ? 'left' : 'right';
    fireShip.y = 120 + Math.random() * 100;
    if (fireShip.side === 'left') {
      fireShip.x = -fireShip.w;
    } else {
      fireShip.x = canvas.width + fireShip.w;
    }
    fireShip.timer = 0;
    fireNextTime = now + FIRE_INTERVAL + Math.random() * 9000;
  }
  if (fireShip.visible) {
    if (fireShip.side === 'left') {
      fireShip.x += fireShip.speed;
      if (fireShip.x > canvas.width + fireShip.w) fireShip.visible = false;
    } else {
      fireShip.x -= fireShip.speed;
      if (fireShip.x < -fireShip.w) fireShip.visible = false;
    }
  }
}
function drawPoliceShip() {
  if (!policeShip.visible) return;
  ctx.save();
  ctx.translate(policeShip.x, policeShip.y);
  ctx.shadowColor = "#fff";
  ctx.shadowBlur = 14;

  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(22, 10);
  ctx.lineTo(12, 10);
  ctx.lineTo(0, 2);
  ctx.lineTo(-12, 10);
  ctx.lineTo(-22, 10);
  ctx.closePath();
  ctx.fillStyle = "#a7b7cc";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-18, 8);
  ctx.lineTo(-6, 8);
  ctx.lineTo(0, 0);
  ctx.lineTo(6, 8);
  ctx.lineTo(18, 8);
  ctx.lineTo(0, -8);
  ctx.closePath();
  ctx.fillStyle = "#4a8aff";
  ctx.globalAlpha = 0.85;
  ctx.fill();
  ctx.globalAlpha = 1.0;

  ctx.beginPath();
  ctx.ellipse(0, -7, 7, 7, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#f6fbff";
  ctx.globalAlpha = 0.6;
  ctx.fill();
  ctx.globalAlpha = 1.0;

  ctx.beginPath();
  ctx.arc(-10, -12, 2, 0, 2 * Math.PI);
  ctx.fillStyle = "#1e9cff";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(10, -12, 2, 0, 2 * Math.PI);
  ctx.fillStyle = "#ff3b3b";
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.font = "bold 14px Arial";
  ctx.fillStyle = "#1e4b91";
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.textAlign = "center";
  ctx.strokeText("Жека", 0, 18);
  ctx.fillText("Жека", 0, 18);

  ctx.restore();
}
function drawFireShip() {
  if (!fireShip.visible) return;
  ctx.save();
  ctx.translate(fireShip.x, fireShip.y);
  ctx.shadowColor = "#ffa800";
  ctx.shadowBlur = 14;

  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(23, 10);
  ctx.lineTo(12, 10);
  ctx.lineTo(0, 2);
  ctx.lineTo(-12, 10);
  ctx.lineTo(-23, 10);
  ctx.closePath();
  ctx.fillStyle = "#ff5252";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-18, 8);
  ctx.lineTo(-6, 8);
  ctx.lineTo(0, 0);
  ctx.lineTo(6, 8);
  ctx.lineTo(18, 8);
  ctx.lineTo(0, -8);
  ctx.closePath();
  ctx.fillStyle = "#ffe04a";
  ctx.globalAlpha = 0.85;
  ctx.fill();
  ctx.globalAlpha = 1.0;

  ctx.beginPath();
  ctx.ellipse(0, -7, 7, 7, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#fff7e0";
  ctx.globalAlpha = 0.65;
  ctx.fill();
  ctx.globalAlpha = 1.0;

  ctx.beginPath();
  ctx.arc(-10, -12, 2, 0, 2 * Math.PI);
  ctx.fillStyle = "#ffa800";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(10, -12, 2, 0, 2 * Math.PI);
  ctx.fillStyle = "#ff5252";
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.font = "bold 14px Arial";
  ctx.fillStyle = "#b86413";
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.textAlign = "center";
  ctx.strokeText("Паша", 0, 18);
  ctx.fillText("Паша", 0, 18);

  ctx.restore();
}

// === Света с бокалом шампанского ===
function updateSveta() {
  const now = Date.now();
  if (!sveta.visible && now > sveta.nextTime) {
    sveta.visible = true;
    sveta.timer = sveta.duration;
    sveta.x = 70 + Math.random() * (canvas.width - 140);
    sveta.y = 90 + Math.random() * 80;
    sveta.nextTime = now + 7000 + Math.random() * 14000;
  }
  if (sveta.visible) {
    sveta.timer -= (Date.now() - lastUpdate);
    if (sveta.timer <= 0) {
      sveta.visible = false;
    }
  }
}
function drawSveta() {
  if (!sveta.visible) return;
  ctx.save();
  ctx.translate(sveta.x, sveta.y);

  ctx.globalAlpha = 0.7 + 0.3*Math.random();
  ctx.beginPath();
  ctx.arc(0, 0, 48, 0, 2*Math.PI);
  ctx.fillStyle = "#fff9d2";
  ctx.shadowColor = "#fff6b7";
  ctx.shadowBlur = 30 + Math.random()*10;
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.lineTo(-13, 28);
  ctx.lineTo(13, 28);
  ctx.closePath();
  ctx.fillStyle = "#ffcbf7";
  ctx.shadowBlur = 0;
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(0, -8, 9, 0, 2*Math.PI);
  ctx.fillStyle = "#ffeccd";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, -13, 9, Math.PI*0.2, Math.PI*0.8, false);
  ctx.lineTo(0, -13);
  ctx.closePath();
  ctx.fillStyle = "#ffe96a";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(-3, -10, 1.3, 0, 2*Math.PI);
  ctx.arc(3, -10, 1.3, 0, 2*Math.PI);
  ctx.fillStyle = "#824300";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -7, 2.5, Math.PI*0.1, Math.PI*0.9);
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = "#a16236";
  ctx.stroke();

  ctx.save();
  ctx.strokeStyle = "#ffeccd";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(5, -1);
  ctx.lineTo(18, -10);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(21, -12, 3, 5, -0.5, 0, 2*Math.PI);
  ctx.fillStyle = "#fffbe4";
  ctx.globalAlpha = 0.8;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.moveTo(21, -7);
  ctx.lineTo(21, -3);
  ctx.strokeStyle = "#d9cfff";
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(21, -11, 2, Math.PI*0.4, Math.PI*1.6, false);
  ctx.strokeStyle = "#eccd7b";
  ctx.globalAlpha = 0.7;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();

  ctx.font = "bold 15px Arial";
  ctx.fillStyle = "#ff4ec2";
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3;
  ctx.textAlign = "center";
  ctx.strokeText("Света", 0, 48);
  ctx.fillText("Света", 0, 48);

  ctx.restore();
}

// === Аня и Маша на коляске ===
function updateStrollerShips() {
  const now = Date.now();
  if (
    strollerShips.every(s => s.state === "waiting") &&
    now > nextStrollerTime
  ) {
    for (let s of strollerShips) {
      s.y = canvas.height + 32 + Math.random() * 32;
      s.state = "flying";
      s.timer = 0;
    }
    strollerShips[0].x = 80;
    strollerShips[1].x = 115;
    nextStrollerTime = now + 12000 + Math.random() * 10000;
  }
  for (let i = 0; i < strollerShips.length; ++i) {
    const s = strollerShips[i];
    if (s.state === "flying") {
      s.y -= s.speed + 0.2 * i;
      if (i === 1) s.x += Math.sin(Date.now()/180) * 0.4;
      if (s.y < -40) {
        s.state = "waiting";
        s.y = canvas.height + 32;
      }
    }
  }
}
function drawStrollerShips() {
  const anya = strollerShips[0];
  if (anya.state === "flying") {
    ctx.save();
    ctx.translate(anya.x, anya.y);

    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#d3a7ff";
    ctx.shadowColor = "#f8e7ff";
    ctx.shadowBlur = 8;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, -9, 5.5, 0, 2 * Math.PI);
    ctx.fillStyle = "#fff7e0";
    ctx.shadowBlur = 0;
    ctx.fill();

    ctx.strokeStyle = "#ffb6c7";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-3, -6); ctx.lineTo(-9, 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(3, -6); ctx.lineTo(9, 2); ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, -11, 4, Math.PI, 2*Math.PI);
    ctx.fillStyle = "#f8d2a6";
    ctx.fill();

    ctx.font = "bold 12px Arial";
    ctx.fillStyle = "#c18cff";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeText("Аня", 0, 21);
    ctx.fillText("Аня", 0, 21);

    ctx.restore();
  }
  const masha = strollerShips[1];
  if (masha.state === "flying") {
    ctx.save();
    ctx.translate(masha.x, masha.y);

    ctx.beginPath();
    ctx.ellipse(0, 6, 10, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#b2d7ff";
    ctx.shadowColor = "#d0f1ff";
    ctx.shadowBlur = 7;
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 3, 10.5, Math.PI*0.8, Math.PI*2.2, false);
    ctx.lineTo(0, 3);
    ctx.closePath();
    ctx.fillStyle = "#8eb7e3";
    ctx.globalAlpha = 0.7;
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(0, 1, 5, 0, 2*Math.PI);
    ctx.fillStyle = "#fff7e0";
    ctx.shadowBlur = 0;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, -0.7, 3.5, Math.PI, 2*Math.PI);
    ctx.fillStyle = "#e6d9be";
    ctx.fill();

    ctx.strokeStyle = "#ffc1c5";
    ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(-2, 4); ctx.lineTo(-7, 9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2, 4); ctx.lineTo(7, 9); ctx.stroke();

    ctx.save();
    for (let dx of [-6, 6]) {
      ctx.beginPath();
      ctx.arc(dx, 13, 2.5, 0, 2 * Math.PI);
      ctx.fillStyle = "#444";
      ctx.fill();
    }
    ctx.restore();

    ctx.font = "bold 11px Arial";
    ctx.fillStyle = "#5f8df2";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeText("Маша 👶", 0, 23);
    ctx.fillText("Маша 👶", 0, 23);

    ctx.restore();
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

// === Стрельба помощников ===
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
    if (
      comet.y + comet.r > ship.y &&
      comet.x > ship.x - ship.w/2 &&
      comet.x < ship.x + ship.w/2 &&
      ship.health > 0
    ) {
      ship.health -= comet.damage;
      comets.splice(i, 1);
      if (ship.health <= 0) gameOver = true;
      continue;
    }
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

  updatePoliceShip();
  updateFireShip();
  updateStrollerShips();
  updateStation();
  updateSveta();

  updateStars();
  checkCollisions();
  helpersShoot();
  updateBonusTimers(dt);
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
  drawPoliceShip();
  drawFireShip();
  drawStation();
  drawStrollerShips();
  drawSveta();
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
  ship.x = 200;
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
