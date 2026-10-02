// Điểm khởi động: điều hướng màn hình, vòng lặp game, âm thanh và lưu tiến độ.
import './core/compat.js'; // phải đứng đầu: vá API canvas cho trình duyệt cũ
import { LEVELS } from './data/levels.js';
import { Game, STATUS } from './game/game.js';
import { Viewport } from './core/viewport.js';
import { setupInput } from './core/input.js';
import { unlockAudio, playSfx, setMuted } from './core/audio.js';
import { save } from './core/save.js';
import { Renderer } from './render/renderer.js';
import { GameUI } from './ui/hud.js';
import { applyIcons } from './ui/icons.js';
import { drawMenuBackground } from './ui/screens.js';
import { showScreen, renderLevelList, showOverlay, hideOverlay, isUnlocked, HELP_HTML } from './ui/screens.js';

const MAX_DT = 1 / 20;
const SPEEDS = [1, 2, 3];

const canvas = document.getElementById('game');
const viewport = new Viewport(canvas);
const renderer = new Renderer(canvas.getContext('2d'), viewport);

const controls = { speed: 1, paused: false };
let game = null;
let levelIndex = 0;
let endTimer = null;

const ui = new GameUI({
  onPause: () => openPause(),
  onSpeed: () => {
    controls.speed = SPEEDS[(SPEEDS.indexOf(controls.speed) + 1) % SPEEDS.length];
  },
});

setupInput(canvas, viewport, (x, y) => {
  if (game && !controls.paused) game.handleTap(x, y);
});

// Trình duyệt chỉ cho phát âm thanh sau tương tác đầu tiên.
window.addEventListener('pointerdown', unlockAudio, { capture: true });
setMuted(save.muted);
updateSoundLabel();
applyIcons();
drawMenuBackground();
window.addEventListener('resize', drawMenuBackground);

// ---------- Điều hướng ----------

function goMenu() {
  hideOverlay();
  game = null;
  showScreen('menu');
  drawMenuBackground();
}

function goLevels() {
  hideOverlay();
  game = null;
  renderLevelList(startLevel);
  showScreen('levels');
}

function startLevel(i) {
  if (!isUnlocked(i)) return;
  hideOverlay();
  clearTimeout(endTimer);
  levelIndex = i;
  game = new Game(LEVELS[i]);
  controls.paused = false;
  controls.speed = 1;
  ui.setGame(game);
  showScreen('game');
  viewport.resize();
  ui.showBanner(LEVELS[i].name);
  window.game = game; // tiện debug trong DevTools
}

function openPause() {
  if (!game || game.ended) return;
  controls.paused = true;
  showOverlay(`<h2>Tạm dừng</h2><p>${LEVELS[levelIndex].name}</p>`, [
    { label: 'Tiếp tục', primary: true, onClick: resume },
    { label: 'Chơi lại', onClick: () => startLevel(levelIndex) },
    { label: soundLabel(), onClick: () => { toggleSound(); openPause(); } },
    { label: 'Bản đồ', onClick: goLevels },
    { label: 'Hướng dẫn', onClick: () => showOverlay(HELP_HTML, [{ label: 'Quay lại', primary: true, onClick: openPause }]) },
  ]);
}

function resume() {
  hideOverlay();
  controls.paused = false;
}

function showResult() {
  const won = game.status === STATUS.WON;
  if (won) save.setStars(game.level.id, game.stars);
  const stars = game.stars;
  const starHtml = [0, 1, 2].map((i) => `<span class="${i < stars ? '' : 'off'}">⭐</span>`).join('');
  const hasNext = levelIndex < LEVELS.length - 1;
  if (won) {
    showOverlay(
      `<h2>Chiến thắng!</h2><div class="result-stars">${starHtml}</div>
       <p>Còn ${game.lives} mạng • Hạ ${game.stats.kills} quái</p>
       ${hasNext ? '' : '<p>🏆 Bạn đã bảo vệ vương quốc khỏi Cự Thạch Vương!</p>'}`,
      [
        ...(hasNext ? [{ label: 'Màn tiếp ▶', primary: true, onClick: () => startLevel(levelIndex + 1) }] : []),
        { label: 'Chơi lại', primary: !hasNext, onClick: () => startLevel(levelIndex) },
        { label: 'Bản đồ', onClick: goLevels },
      ],
    );
  } else {
    showOverlay(`<h2>Thất thủ!</h2><p>Quái đã tràn qua ở wave ${game.waveIndex + 1}/${game.totalWaves}.</p>
      <p>Mẹo: dùng Doanh trại chặn đường và nâng cấp tháp sớm.</p>`, [
      { label: 'Thử lại', primary: true, onClick: () => startLevel(levelIndex) },
      { label: 'Bản đồ', onClick: goLevels },
    ]);
  }
}

// ---------- Âm thanh ----------

function soundLabel() {
  return save.muted ? '🔇 Âm thanh: Tắt' : '🔊 Âm thanh: Bật';
}

function updateSoundLabel() {
  document.getElementById('menu-sound').textContent = soundLabel();
}

function toggleSound() {
  save.muted = !save.muted;
  setMuted(save.muted);
  updateSoundLabel();
}

// ---------- Nút menu chính ----------

document.addEventListener('click', (e) => {
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (action === 'play') goLevels();
  else if (action === 'menu') goMenu();
  else if (action === 'help') showOverlay(HELP_HTML, [{ label: 'Đã hiểu', primary: true, onClick: hideOverlay }]);
  else if (action === 'toggle-sound') toggleSound();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) openPause();
});

// Phím tắt cho máy tính.
document.addEventListener('keydown', (e) => {
  if (!game) return;
  if (e.key === 'Escape' || e.key === 'p') {
    if (controls.paused) resume();
    else openPause();
  } else if (e.key === '1') game.beginSpell('meteor');
  else if (e.key === '2') game.beginSpell('militia');
  else if (e.key === 'h') game.selectHero();
  else if (e.key === ' ' || e.key === 'w') game.callWave();
});

// ---------- Vòng lặp ----------

function handleEvents() {
  for (const ev of game.events) {
    if (ev.type === 'sfx') playSfx(ev.data);
    else if (ev.type === 'wave') {
      ui.showBanner(ev.data === game.totalWaves ? 'Wave cuối!' : `Wave ${ev.data}`);
    } else if (ev.type === 'leak' && navigator.vibrate) navigator.vibrate(60);
    else if (ev.type === 'end') endTimer = setTimeout(showResult, 1400);
  }
  game.events.length = 0;
}

// Hiện lỗi ngay trên màn hình (điện thoại không có DevTools) thay vì im lặng đứng hình.
let errorShown = false;
function reportError(err) {
  console.error(err);
  if (errorShown) return;
  errorShown = true;
  controls.paused = true;
  showOverlay(`<h2>Có lỗi xảy ra</h2><p>${String(err?.message || err)}</p>
    <p>Hãy chụp màn hình này gửi cho người phát triển, rồi thử tải lại trang.</p>`, [
    { label: 'Tải lại', primary: true, onClick: () => location.reload() },
  ]);
}

let last = performance.now();
function frame(now) {
  // Đặt lịch frame sau TRƯỚC khi chạy, để một lỗi không làm dừng hẳn vòng lặp.
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, MAX_DT);
  last = now;
  if (!game) return;
  try {
    if (!controls.paused) {
      for (let i = 0; i < controls.speed; i++) game.update(dt);
    }
    handleEvents();
    renderer.render(game);
    ui.update(controls);
  } catch (err) {
    reportError(err);
  }
}
requestAnimationFrame(frame);
window.__gameBooted = true;
