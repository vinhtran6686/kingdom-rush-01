// Đồng bộ HUD (DOM) với trạng thái game. Chỉ ghi vào DOM khi giá trị thay đổi.
import { STATUS } from './game.js';

export class HUD {
  constructor(game, controls) {
    this.game = game;
    this.controls = controls; // { speed, paused, togglePause, toggleSpeed }
    this.el = {
      lives: document.getElementById('lives'),
      gold: document.getElementById('gold'),
      wave: document.getElementById('wave'),
      btnWave: document.getElementById('btn-wave'),
      btnSpeed: document.getElementById('btn-speed'),
      btnPause: document.getElementById('btn-pause'),
      overlay: document.getElementById('overlay'),
      overlayTitle: document.getElementById('overlay-title'),
      overlayText: document.getElementById('overlay-text'),
      btnRestart: document.getElementById('btn-restart'),
    };
    this.cache = {};

    this.el.btnWave.addEventListener('click', () => game.startNextWave());
    this.el.btnSpeed.addEventListener('click', () => controls.toggleSpeed());
    this.el.btnPause.addEventListener('click', () => controls.togglePause());
    this.el.btnRestart.addEventListener('click', () => controls.restart());
  }

  set(key, value, apply) {
    if (this.cache[key] === value) return;
    this.cache[key] = value;
    apply(value);
  }

  update() {
    const g = this.game;
    const el = this.el;

    this.set('lives', g.lives, (v) => (el.lives.textContent = v));
    this.set('gold', g.gold, (v) => (el.gold.textContent = v));
    this.set('wave', `${Math.max(0, g.waveIndex + 1)}/${g.totalWaves}`, (v) => (el.wave.textContent = v));

    let waveLabel;
    if (g.status === STATUS.PLAYING) waveLabel = `Wave ${g.waveIndex + 1}…`;
    else if (g.canStartWave) waveLabel = `Bắt đầu wave ${g.waveIndex + 2}`;
    else waveLabel = 'Hết wave';
    this.set('waveLabel', waveLabel, (v) => (el.btnWave.textContent = v));
    this.set('waveEnabled', g.canStartWave, (v) => (el.btnWave.disabled = !v));

    this.set('speed', this.controls.speed, (v) => (el.btnSpeed.textContent = `x${v}`));
    this.set('paused', this.controls.paused, (v) => (el.btnPause.textContent = v ? '▶' : '⏸'));

    const ended = g.status === STATUS.WON || g.status === STATUS.LOST;
    this.set('overlay', ended ? g.status : null, (v) => {
      el.overlay.hidden = !v;
      if (v === STATUS.WON) {
        el.overlayTitle.textContent = '🏆 Chiến thắng!';
        el.overlayText.textContent = `Bạn đã giữ vững vương quốc với ${g.lives} mạng còn lại.`;
      } else if (v === STATUS.LOST) {
        el.overlayTitle.textContent = '💀 Thất thủ!';
        el.overlayText.textContent = `Quái đã tràn qua ở wave ${g.waveIndex + 1}.`;
      }
    });
  }
}
