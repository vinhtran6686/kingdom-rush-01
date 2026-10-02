// HUD trong trận (DOM): chỉ số, nút anh hùng/phép/gọi wave, bảng thông tin.
// Chỉ đọc trạng thái game và gọi các phương thức công khai của Game.
import { TOWERS } from '../data/towers.js';
import { HERO, SPELLS } from '../data/hero.js';
import { STATUS } from '../game/game.js';
import { enemyIcon } from './icons.js';

const $ = (id) => document.getElementById(id);


const pct = (v) => `${Math.round(v * 100)}%`;
const dmg = ([a, b]) => `${a}–${b}`;

export class GameUI {
  constructor({ onPause, onSpeed }) {
    this.game = null;
    this.cache = {};
    this.el = {
      lives: $('hud-lives'),
      gold: $('hud-gold'),
      wave: $('hud-wave'),
      speed: $('btn-speed'),
      pause: $('btn-pause'),
      hero: $('btn-hero'),
      heroHp: $('hero-hp'),
      heroCd: $('hero-cd'),
      meteor: $('btn-meteor'),
      meteorCd: $('meteor-cd'),
      militia: $('btn-militia'),
      militiaCd: $('militia-cd'),
      waveBtn: $('btn-wave'),
      waveLabel: $('wave-label'),
      wavePreview: $('wave-preview'),
      info: $('info'),
      banner: $('banner'),
    };
    this.el.pause.addEventListener('click', onPause);
    this.el.speed.addEventListener('click', onSpeed);
    this.el.hero.addEventListener('click', () => {
      const g = this.game;
      if (!g) return;
      if (g.mode === 'hero') g.clearSelection();
      else g.selectHero();
    });
    this.el.meteor.addEventListener('click', () => this.game?.beginSpell('meteor'));
    this.el.militia.addEventListener('click', () => this.game?.beginSpell('militia'));
    this.el.waveBtn.addEventListener('click', () => this.game?.callWave());
  }

  setGame(game) {
    this.game = game;
    this.cache = {};
    this.el.banner.hidden = true;
  }

  set(key, value, apply) {
    if (this.cache[key] === value) return;
    this.cache[key] = value;
    apply(value);
  }

  showBanner(text) {
    const b = this.el.banner;
    b.hidden = true;
    b.textContent = text;
    void b.offsetWidth; // khởi động lại animation CSS
    b.hidden = false;
    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => (b.hidden = true), 2000);
  }

  update(controls) {
    const g = this.game;
    if (!g) return;
    const el = this.el;

    this.set('lives', g.lives, (v) => (el.lives.textContent = v));
    this.set('gold', g.gold, (v) => (el.gold.textContent = v));
    this.set('wave', `${Math.max(0, g.waveIndex + 1)}/${g.totalWaves}`, (v) => (el.wave.textContent = v));
    this.set('speed', controls.speed, (v) => (el.speed.textContent = `${v}x`));

    // Anh hùng
    const h = g.hero;
    this.set('heroHp', Math.round((h.hp / h.maxHp) * 100), (v) => (el.heroHp.style.width = `${v}%`));
    const heroCd = h.dead ? Math.ceil(h.respawnTimer) : 0;
    this.set('heroCd', heroCd, (v) => {
      el.heroCd.textContent = v ? v : '';
      el.heroCd.style.setProperty('--p', v ? (v / HERO.respawn) * 100 : 0);
    });
    this.set('heroSel', g.mode === 'hero', (v) => el.hero.classList.toggle('selected', v));

    // Phép
    for (const name of ['meteor', 'militia']) {
      const cd = g.spellCd[name];
      const total = SPELLS[name].cooldown;
      this.set(`${name}Cd`, Math.ceil(cd), (v) => {
        el[`${name}Cd`].textContent = v > 0 ? v : '';
        el[`${name}Cd`].style.setProperty('--p', v > 0 ? Math.min(100, (cd / total) * 100) : 0);
      });
      this.set(`${name}Sel`, g.mode === name, (v) => el[name].classList.toggle('selected', v));
    }

    // Nút gọi wave + xem trước
    let label;
    if (g.status === STATUS.READY) label = 'Bắt đầu!';
    else if (g.nextWaveTimer !== null) label = `Gọi sớm +${Math.round(g.nextWaveTimer * 1.5)}🪙`;
    else if (g.waveIndex >= g.totalWaves - 1) label = 'Wave cuối!';
    else label = `Wave ${g.waveIndex + 1}`;
    this.set('waveLabel', label, (v) => (el.waveLabel.textContent = v));
    this.set('waveEnabled', g.canCallWave, (v) => (el.waveBtn.disabled = !v));
    const preview = g.canCallWave
      ? g.nextWavePreview().map((p) => `<span class="foe"><img src="${enemyIcon(p.type)}" alt="">×${p.count}</span>`).join('')
      : '';
    this.set('wavePreview', preview, (v) => (el.wavePreview.innerHTML = v));

    this.set('info', this.infoHtml(), (v) => {
      el.info.hidden = !v;
      el.info.innerHTML = v || '';
    });
  }

  infoHtml() {
    const g = this.game;
    const preview = g.getPreview();
    if (preview) return towerInfo(preview.type, preview.level, true);
    const sel = g.selection;
    if (!sel) return '';
    if (sel.kind === 'tower') return towerInfo(sel.ref.type, sel.ref.level, false);
    if (sel.kind === 'enemy') {
      const e = sel.ref;
      const d = e.def;
      return `<h4>${d.name}</h4>
        <div class="row"><span>❤️ ${Math.ceil(e.hp)}/${e.maxHp}</span><span>⚔️ ${dmg(d.damage)}</span>
        <span>🛡️ Giáp ${pct(d.armor)}</span><span>✨ Kháng phép ${pct(d.magicResist)}</span>
        <span>💔 −${d.lives} mạng</span></div><div class="desc">${d.desc}</div>`;
    }
    if (sel.kind === 'hero') {
      const h = sel.ref;
      return `<h4>${HERO.name}</h4>
        <div class="row"><span>❤️ ${Math.ceil(h.hp)}/${h.maxHp}</span><span>⚔️ ${dmg(HERO.damage)}</span>
        <span>🛡️ Giáp ${pct(HERO.armor)}</span></div>
        <div class="desc">Kỹ năng ${HERO.skill.name}: gây ${HERO.skill.damage} sát thương quanh mình và làm choáng. Chạm lên bản đồ để di chuyển.</div>`;
    }
    return '';
  }
}

function towerInfo(type, level, isPreview) {
  const def = TOWERS[type];
  const s = def.levels[level];
  const head = `${def.name} ${'★'.repeat(level + 1)}${isPreview ? ' <small>(chạm lần nữa để xác nhận)</small>' : ''}`;
  let row;
  if (type === 'barracks') {
    row = `<span>👥 ${def.soldiers} lính</span><span>❤️ ${s.soldierHp}</span><span>⚔️ ${dmg(s.damage)}</span><span>🛡️ ${pct(s.armor)}</span>`;
  } else {
    const kind = def.damageType === 'magic' ? '✨' : '⚔️';
    row = `<span>${kind} ${dmg(s.damage)}</span><span>⏱️ ${s.interval}s</span><span>🎯 ${s.range}</span>`;
    if (s.splash) row += `<span>💥 nổ lan</span>`;
  }
  return `<h4>${head}</h4><div class="row">${row}</div><div class="desc">${def.desc}</div>`;
}
