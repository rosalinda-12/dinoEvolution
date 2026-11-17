// =====================================================
//  ENDLESS RUNNER · Taller "Del juego al móvil"
//  Versión INICIAL · completa los bloques marcados con  // COMPLETA
// =====================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const restartBtn = document.getElementById('restartBtn');

// --- Configuración (unidades por SEGUNDO, no por fotograma) ---
// Así el juego corre igual en una pantalla de 60 Hz que en una de 120 Hz.
const GROUND_Y = canvas.height - 60;   // altura del suelo
const GRAVITY = 1500;                  // px/s²  (cambio suave de velocidad)
const JUMP_FORCE = -560;               // px/s   (primer salto más bajo)
const SECOND_JUMP_FORCE = -620;        // px/s   (doble salto suave)
const DOUBLE_JUMP_DELAY = 500;         // espera a que el primer salto empiece a bajar
const START_SPEED = 300;               // px/s   (velocidad inicial de los obstáculos)
const ACCELERATION = 10;               // px/s cada segundo (dificultad progresiva)
const POINTS_PER_SECOND = 10;

// --- Estado del juego ---
// 'ready' = esperando el primer toque · 'playing' = jugando · 'over' = perdiste
let state, player, obstacles, score, speed, spawnTimer, lastTime;
let doubleJumpTimer = null;
let best = Number(leerRecord()) || 0;

function initGame() {
  if (doubleJumpTimer !== null) {
    clearTimeout(doubleJumpTimer);
    doubleJumpTimer = null;
  }
  player = { x: 80, y: GROUND_Y - 40, width: 40, height: 40, vy: 0, jumping: false, jumps: 0 };
  obstacles = [];
  score = 0;
  speed = START_SPEED;
  spawnTimer = 1;          // segundos hasta el primer obstáculo
  state = 'ready';
  restartBtn.hidden = true;
  actualizarHUD();
}

// --- Entrada del usuario (teclado, mouse y pantalla táctil) ---
function onInput() {
  if (state === 'ready') { state = 'playing'; }
  if (state === 'over') { initGame(); return; }
  doubleJump();
}

function jump() {
  if (player.jumps < 2) {
    player.vy = JUMP_FORCE;
    player.jumping = true;
    player.jumps++;
  }
}

function doubleJump() {
  if (player.jumps !== 0 || doubleJumpTimer !== null) return;

  jump();

  doubleJumpTimer = setTimeout(() => {
    doubleJumpTimer = null;
    const onGround = player.y >= GROUND_Y - player.height;
    if (state === 'playing' && player.jumps === 1 && !onGround) {
      player.vy = SECOND_JUMP_FORCE;
      player.jumping = true;
      player.jumps++;
    }
  }, DOUBLE_JUMP_DELAY);
}

document.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  e.preventDefault();
  onInput();
});
canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); onInput(); });
restartBtn.addEventListener('click', initGame);

// --- Generación de obstáculos ---
function spawnObstacle() {
  // COMPLETA (Paso 3):
  //  1. Crea un ancho y un alto aleatorios entre 30 y 60 px.
  //     Pista: 30 + Math.random() * 30
  //  2. Agrega a "obstacles" un objeto { x, y, width, height } donde:
  //     x = canvas.width       (aparece en el borde derecho)
  //     y = GROUND_Y - height  (apoyado sobre el suelo)
const width = 30 + Math.random() * 30;   // entre 30 y 60 px
  const height = 30 + Math.random() * 30;  // entre 30 y 60 px
  obstacles.push({
    x: canvas.width,            // aparece en el borde derecho
    y: GROUND_Y - height,       // apoyado sobre el suelo
    width,
    height
  });
}

// --- Colisión entre dos rectángulos ---
function colisiona(a, b) {
  // COMPLETA (Paso 5):
  //  Devuelve true si los rectángulos a y b se superponen.
  //  Deben cumplirse las CUATRO condiciones a la vez (usa &&):
  //   - el borde izquierdo de a está antes del borde derecho de b
  //   - el borde derecho de a está después del borde izquierdo de b
  //   - el borde superior de a está arriba del borde inferior de b
  //   - el borde inferior de a está abajo del borde superior de b
  //  Recuerda: borde derecho = x + width · borde inferior = y + height

  //return false; // ← reemplaza esta línea
   return (
    a.x < b.x + b.width &&    // izquierda de a, antes de la derecha de b
    a.x + a.width > b.x &&    // derecha de a, después de la izquierda de b
    a.y < b.y + b.height &&   // arriba de a, sobre la base de b
    a.y + a.height > b.y      // base de a, debajo de la parte de arriba de b
  );
}

// --- Actualización: dt = segundos desde el fotograma anterior ---
function update(dt) {
  if (state !== 'playing') return;

  // Física del jugador
  player.y += player.vy * dt + 0.5 * GRAVITY * dt * dt;
  player.vy += GRAVITY * dt;
  if (player.y >= GROUND_Y - player.height) {
    player.y = GROUND_Y - player.height;
    player.vy = 0;
    player.jumping = false;
    player.jumps = 0;
  }

  // Mover obstáculos hacia la izquierda
  obstacles.forEach(o => { o.x -= speed * dt; });

  // COMPLETA (Paso 4): elimina los obstáculos que ya salieron por la izquierda.
  //  Pista: usa obstacles.filter(...) y conserva solo los que cumplan o.x + o.width > 0
  obstacles = obstacles.filter(o => o.x + o.width > 0);

  // PASO 5 · Revisar si el jugador chocó con algún obstáculo
  if (obstacles.some(o => colisiona(player, o))) {
    terminarPartida();
    return;
  }

  // Puntuación y dificultad progresiva
  score += POINTS_PER_SECOND * dt;
  speed += ACCELERATION * dt;
  actualizarHUD();

  // Dar más tiempo para reaccionar entre obstáculos
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnObstacle();
    spawnTimer = 1.8 + Math.random() * 0.8;
  }
}

function terminarPartida() {
  state = 'over';
  restartBtn.hidden = false;
  if (Math.floor(score) > best) {
    best = Math.floor(score);
    guardarRecord(best);
  }
  actualizarHUD();
}

function actualizarHUD() {
  scoreEl.textContent = 'Puntos: ' + Math.floor(score);
  bestEl.textContent = 'Récord: ' + best;
}

// --- Dibujo ---
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Suelo
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);

  // Jugador
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Obstáculos
  ctx.fillStyle = '#f87171';
  obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.width, o.height));

  // Mensajes
  if (state === 'ready') mensaje('Toca o presiona Espacio para empezar', '');
  if (state === 'over') mensaje('¡Game Over!', 'Puntos: ' + Math.floor(score) + ' · Toca para reintentar');
}

function mensaje(titulo, subtitulo) {
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#e2e8f0';
  ctx.textAlign = 'center';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillText(titulo, canvas.width / 2, canvas.height / 2);
  if (subtitulo) {
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText(subtitulo, canvas.width / 2, canvas.height / 2 + 40);
  }
}

// --- Bucle principal (siempre activo; calcula dt) ---
function loop(now) {
  // Limitamos dt a 0.05 s para que el juego no "salte" al volver de otra pestaña
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// --- Récord guardado en el dispositivo (protegido por si el almacenamiento falla) ---
function leerRecord() {
  try { return localStorage.getItem('runner-record'); } catch { return 0; }
}
function guardarRecord(valor) {
  try { localStorage.setItem('runner-record', valor); } catch { /* sin almacenamiento */ }
}

// --- Arranque ---
initGame();
requestAnimationFrame((now) => { lastTime = now; requestAnimationFrame(loop); });
