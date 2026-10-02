// Điểm khởi động: nối Game (logic) + Viewport/Input + Renderer + HUD và chạy vòng lặp.
import { Game } from './game.js';
import { Viewport } from './viewport.js';
import { setupInput } from './input.js';
import { render } from './render.js';
import { HUD } from './ui.js';

const MAX_DT = 1 / 20; // tránh "nhảy cóc" khi tab bị treo rồi quay lại
const SPEEDS = [1, 2];

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const viewport = new Viewport(canvas);
const game = new Game();

const controls = {
  speed: 1,
  paused: false,
  toggleSpeed() {
    this.speed = SPEEDS[(SPEEDS.indexOf(this.speed) + 1) % SPEEDS.length];
  },
  togglePause() {
    this.paused = !this.paused;
  },
  restart() {
    game.reset();
    this.paused = false;
  },
};

const hud = new HUD(game, controls);
setupInput(canvas, viewport, (x, y) => {
  if (!controls.paused) game.handleTap(x, y);
});

// Tự tạm dừng khi chuyển tab / khoá màn hình.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) controls.paused = true;
});

let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, MAX_DT);
  last = now;

  if (!controls.paused) {
    // Chạy nhiều bước nhỏ khi tăng tốc để va chạm vẫn chính xác.
    for (let i = 0; i < controls.speed; i++) game.update(dt);
  }
  render(ctx, viewport, game);
  hud.update();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Tiện debug trong DevTools: window.game.gold = 999
window.game = game;
