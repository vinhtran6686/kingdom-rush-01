// Trạng thái và luật chơi của một màn. Không đụng DOM/canvas — chạy được trong Node
// (xem tools/simulate.js). Giao tiếp ra ngoài qua `events` (âm thanh...) và các getter.
import { WORLD, dist, clamp, rollDamage, randRange } from '../core/utils.js';
import { TOWERS, TOWER_ORDER } from '../data/towers.js';
import { SPELLS } from '../data/hero.js';
import { createPath } from './path.js';
import { Enemy } from './enemy.js';
import { Tower } from './tower.js';
import { Hero } from './hero.js';
import { Soldier } from './soldier.js';
import { Lobbed } from './projectiles.js';

export const STATUS = {
  READY: 'ready', // chưa gọi wave đầu
  RUNNING: 'running',
  WON: 'won',
  LOST: 'lost',
};

const WAVE_GAP = 22; // giây chờ giữa 2 wave (có thể gọi sớm)
const EARLY_BONUS_PER_SEC = 1.5;
const SPOT_RADIUS = 30;
const BUTTON_RADIUS = 25;
const MENU_RADIUS = 66;

export class Game {
  constructor(level) {
    this.level = level;
    this.reset();
  }

  reset() {
    const L = this.level;
    this.paths = L.paths.map(createPath);
    this.spots = L.spots.map((s, i) => ({ id: i, x: s.x, y: s.y, tower: null }));
    this.gold = L.startGold;
    this.lives = L.lives;
    this.status = STATUS.READY;
    this.time = 0;
    this.waveIndex = -1;
    this.waveEndAt = 0;
    this.nextWaveTimer = null;
    this.spawnQueue = [];

    this.enemies = [];
    this.towers = [];
    this.projectiles = [];
    this.effects = [];
    this.militia = [];
    this.hero = new Hero(L.heroSpawn);

    this.spellCd = { meteor: 10, militia: 0 };
    this.selection = null; // { kind: 'spot'|'tower'|'enemy'|'hero', ref }
    this.pending = null; // id nút menu đang xem trước (chạm lần 2 để xác nhận)
    this.mode = null; // 'meteor' | 'militia' | 'rally' | 'hero' — đang chờ chạm chọn vị trí
    this.events = [];
    this.stats = { kills: 0, goldEarned: 0 };
  }

  get totalWaves() {
    return this.level.waves.length;
  }

  get ended() {
    return this.status === STATUS.WON || this.status === STATUS.LOST;
  }

  get stars() {
    if (this.status !== STATUS.WON) return 0;
    if (this.lives >= 18) return 3;
    if (this.lives >= 6) return 2;
    return 1;
  }

  emit(type, data) {
    this.events.push({ type, data });
  }

  addEffect(fx) {
    this.effects.push(fx);
  }

  addText(x, y, text, color = '#fff', life = 1) {
    this.effects.push({ kind: 'text', x, y, text, color, life, maxLife: life });
  }

  nearestPathPoint(x, y) {
    let best = null;
    let bestD = Infinity;
    for (const p of this.paths) {
      const pt = p.pointAt(p.nearestDistance(x, y));
      const d = dist(x, y, pt.x, pt.y);
      if (d < bestD) {
        bestD = d;
        best = pt;
      }
    }
    return best;
  }

  distanceToPath(x, y) {
    return Math.min(...this.paths.map((p) => p.distanceFrom(x, y)));
  }

  // ---------- Wave ----------

  get canCallWave() {
    if (this.ended) return false;
    return this.status === STATUS.READY || this.nextWaveTimer !== null;
  }

  // Các loại quái (và số lượng) của wave sắp tới — để hiển thị xem trước.
  nextWavePreview() {
    const wave = this.level.waves[this.waveIndex + 1];
    if (!wave) return [];
    const counts = {};
    for (const g of wave) counts[g.type] = (counts[g.type] || 0) + g.count;
    return Object.entries(counts).map(([type, count]) => ({ type, count }));
  }

  callWave() {
    if (!this.canCallWave) return;
    if (this.nextWaveTimer !== null && this.nextWaveTimer > 1) {
      const bonus = Math.round(this.nextWaveTimer * EARLY_BONUS_PER_SEC);
      this.gold += bonus;
      // Gọi sớm cũng giảm thời gian hồi phép.
      for (const k in this.spellCd) this.spellCd[k] = Math.max(0, this.spellCd[k] - this.nextWaveTimer * 0.5);
      const flag = this.getWaveFlags()[0];
      if (flag) this.addText(flag.x, flag.y - 30, `+${bonus}`, '#ffd32a', 1.4);
    }
    this.status = STATUS.RUNNING;
    this.nextWaveTimer = null;
    this.waveIndex++;
    const wave = this.level.waves[this.waveIndex];
    let end = this.time;
    for (const g of wave) {
      for (let i = 0; i < g.count; i++) {
        const at = this.time + g.delay + i * g.interval;
        this.spawnQueue.push({ at, type: g.type, path: g.path });
        end = Math.max(end, at);
      }
    }
    this.spawnQueue.sort((a, b) => a.at - b.at);
    this.waveEndAt = end;
    this.emit('sfx', 'horn');
    this.emit('wave', this.waveIndex + 1);
  }

  // Cờ gọi wave ở lối vào của những đường có quái trong wave tới.
  getWaveFlags() {
    if (!this.canCallWave) return [];
    const wave = this.level.waves[this.waveIndex + 1];
    if (!wave) return [];
    const used = [...new Set(wave.map((g) => g.path))];
    return used.map((pi) => {
      const path = this.paths[pi];
      // Điểm đầu tiên trên đường nằm hẳn trong màn hình.
      let d = 0;
      let p = path.pointAt(0);
      while (d < path.length && (p.x < 34 || p.x > WORLD.width - 34 || p.y < 34 || p.y > WORLD.height - 34)) {
        d += 8;
        p = path.pointAt(d);
      }
      return { x: p.x, y: p.y, path: pi, r: 24 };
    });
  }

  // ---------- Vòng lặp ----------

  update(dt) {
    this.time += dt;
    this.updateEffects(dt);
    if (this.ended) return;

    while (this.spawnQueue.length && this.spawnQueue[0].at <= this.time) {
      const s = this.spawnQueue.shift();
      this.enemies.push(new Enemy(s.type, this.paths[s.path], s.path));
      if (this.enemies[this.enemies.length - 1].def.boss) this.emit('sfx', 'boss');
    }

    if (
      this.status === STATUS.RUNNING &&
      this.nextWaveTimer === null &&
      this.waveIndex < this.totalWaves - 1 &&
      this.time >= this.waveEndAt
    ) {
      this.nextWaveTimer = WAVE_GAP;
    }
    if (this.nextWaveTimer !== null && this.status === STATUS.RUNNING) {
      this.nextWaveTimer -= dt;
      if (this.nextWaveTimer <= 0) this.callWave();
    }

    for (const k in this.spellCd) this.spellCd[k] = Math.max(0, this.spellCd[k] - dt);

    for (const e of this.enemies) e.update(dt, this);
    this.hero.update(dt, this);
    for (const t of this.towers) t.update(dt, this);
    for (const m of this.militia) m.update(dt, this);
    this.militia = this.militia.filter((m) => !m.dead);
    for (const p of this.projectiles) p.update(dt, this);
    this.projectiles = this.projectiles.filter((p) => !p.done);

    for (const e of this.enemies) {
      if (e.dead) {
        this.gold += e.def.gold;
        this.stats.kills++;
        this.stats.goldEarned += e.def.gold;
        this.addText(e.x, e.y - 24, `+${e.def.gold}`, '#ffd32a', 0.9);
        this.addEffect({ kind: 'death', x: e.x, y: e.y, r: e.radius, type: e.type, facing: e.facing, life: 0.6, maxLife: 0.6 });
        this.emit('sfx', e.def.boss ? 'bossDie' : 'die');
        if (e.blocker) e.blocker.target = null;
      } else if (e.escaped) {
        this.lives = Math.max(0, this.lives - e.def.lives);
        this.emit('sfx', 'leak');
        this.emit('leak', e.def.lives);
        if (e.blocker) e.blocker.target = null;
      }
    }
    this.enemies = this.enemies.filter((e) => e.alive);
    if (this.selection?.kind === 'enemy' && !this.selection.ref.alive) this.clearSelection();

    if (this.lives <= 0) {
      this.status = STATUS.LOST;
      this.clearSelection();
      this.emit('sfx', 'defeat');
      this.emit('end', STATUS.LOST);
      return;
    }
    if (this.waveIndex === this.totalWaves - 1 && !this.spawnQueue.length && !this.enemies.length) {
      this.status = STATUS.WON;
      this.clearSelection();
      this.emit('sfx', 'victory');
      this.emit('end', STATUS.WON);
    }
  }

  updateEffects(dt) {
    for (const fx of this.effects) {
      fx.life -= dt;
      if (fx.kind === 'text') fx.y -= 22 * dt;
    }
    this.effects = this.effects.filter((fx) => fx.life > 0);
  }

  // ---------- Xây / nâng cấp / bán ----------

  build(spot, type) {
    const cost = TOWERS[type].levels[0].cost;
    if (spot.tower || this.gold < cost) return false;
    this.gold -= cost;
    spot.tower = new Tower(type, spot, this);
    this.towers.push(spot.tower);
    this.emit('sfx', 'build');
    return true;
  }

  upgrade(tower) {
    const cost = tower.upgradeCost;
    if (cost === null || this.gold < cost) return false;
    this.gold -= cost;
    tower.upgrade();
    this.emit('sfx', 'build');
    return true;
  }

  sell(tower) {
    this.gold += tower.sellValue;
    this.addText(tower.x, tower.y - 50, `+${tower.sellValue}`, '#ffd32a');
    tower.destroy();
    tower.spot.tower = null;
    this.towers = this.towers.filter((t) => t !== tower);
    this.addEffect({ kind: 'poof', x: tower.x, y: tower.y - 10, r: 26, life: 0.5, maxLife: 0.5 });
    this.emit('sfx', 'sell');
  }

  // ---------- Phép & anh hùng ----------

  spellReady(name) {
    return this.spellCd[name] <= 0 && !this.ended;
  }

  beginSpell(name) {
    if (!this.spellReady(name)) return;
    this.clearSelection();
    this.mode = this.mode === name ? null : name;
  }

  castSpell(name, x, y) {
    if (!this.spellReady(name)) return false;
    const S = SPELLS[name];
    if (name === 'meteor') {
      for (let i = 0; i < S.count; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = i === 0 ? 0 : randRange(S.spread * 0.4, S.spread);
        const tx = x + Math.cos(a) * r;
        const ty = y + Math.sin(a) * r;
        this.projectiles.push(
          new Lobbed({
            kind: 'meteor',
            x: tx + 120,
            y: ty - 420,
            tx,
            ty,
            flightTime: 0.7 + i * 0.22,
            arc: 0,
            damage: rollDamage(S.damage),
            damageType: 'true',
            splash: S.radius,
          }),
        );
      }
      this.emit('sfx', 'meteorCast');
    } else if (name === 'militia') {
      for (let i = 0; i < S.count; i++) {
        const ox = (i - (S.count - 1) / 2) * 22;
        const m = new Soldier({
          kind: 'militia',
          x: x + ox,
          y: y - 6,
          homeX: x + ox,
          homeY: y,
          hp: S.hp,
          damage: S.damage,
          armor: S.armor,
          speed: 70,
          engageRange: 70,
          lifetime: S.duration,
        });
        this.militia.push(m);
      }
      this.addEffect({ kind: 'ring', x, y, r: 30, color: '255,255,255', life: 0.4, maxLife: 0.4 });
      this.emit('sfx', 'militia');
    }
    this.spellCd[name] = S.cooldown;
    return true;
  }

  selectHero() {
    if (this.ended || this.hero.dead) return;
    this.clearSelection();
    this.selection = { kind: 'hero', ref: this.hero };
    this.mode = 'hero';
  }

  clearSelection() {
    this.selection = null;
    this.pending = null;
    if (this.mode === 'rally' || this.mode === 'hero') this.mode = null;
  }

  // ---------- Menu vòng tròn quanh ô xây ----------

  getMenuButtons() {
    const sel = this.selection;
    if (!sel || (sel.kind !== 'spot' && sel.kind !== 'tower') || this.mode === 'rally') return [];
    const { x, y } = sel.ref;
    const at = (deg) => {
      const a = (deg * Math.PI) / 180;
      return {
        x: clamp(x + Math.cos(a) * MENU_RADIUS, BUTTON_RADIUS + 2, WORLD.width - BUTTON_RADIUS - 2),
        y: clamp(y - 14 + Math.sin(a) * MENU_RADIUS, BUTTON_RADIUS + 2, WORLD.height - BUTTON_RADIUS - 2),
      };
    };

    if (sel.kind === 'spot') {
      const angles = [-135, -45, 135, 45];
      return TOWER_ORDER.map((type, i) => {
        const cost = TOWERS[type].levels[0].cost;
        return {
          id: `build:${type}`,
          action: 'build',
          towerType: type,
          ...at(angles[i]),
          r: BUTTON_RADIUS,
          cost,
          enabled: this.gold >= cost,
        };
      });
    }

    const t = sel.ref;
    const buttons = [];
    if (!t.maxed) {
      buttons.push({
        id: 'upgrade',
        action: 'upgrade',
        ...at(-90),
        r: BUTTON_RADIUS,
        cost: t.upgradeCost,
        enabled: this.gold >= t.upgradeCost,
      });
    } else {
      buttons.push({ id: 'maxed', action: 'none', ...at(-90), r: BUTTON_RADIUS, enabled: false });
    }
    buttons.push({ id: 'sell', action: 'sell', ...at(90), r: BUTTON_RADIUS, cost: t.sellValue, enabled: true });
    if (t.type === 'barracks') {
      buttons.push({ id: 'rally', action: 'rally', ...at(180), r: BUTTON_RADIUS, enabled: true });
    }
    return buttons;
  }

  // Tháp/cấp đang được xem trước (để vẽ tầm bắn và hiện thông tin).
  getPreview() {
    if (!this.pending || !this.selection) return null;
    if (this.pending.startsWith('build:')) {
      const type = this.pending.slice(6);
      return { type, level: 0, x: this.selection.ref.x, y: this.selection.ref.y };
    }
    if (this.pending === 'upgrade') {
      const t = this.selection.ref;
      return { type: t.type, level: t.level + 1, x: t.x, y: t.y };
    }
    return null;
  }

  runButton(btn) {
    const sel = this.selection;
    if (btn.action === 'build') {
      if (this.build(sel.ref, btn.towerType)) this.clearSelection();
    } else if (btn.action === 'upgrade') {
      if (this.upgrade(sel.ref)) this.clearSelection();
    } else if (btn.action === 'sell') {
      this.sell(sel.ref);
      this.clearSelection();
    } else if (btn.action === 'rally') {
      this.mode = 'rally';
      this.pending = null;
    }
  }

  // ---------- Xử lý chạm ----------

  handleTap(x, y) {
    if (this.ended) return;

    if (this.mode === 'meteor' || this.mode === 'militia') {
      const name = this.mode;
      this.mode = null;
      if (name === 'militia' && this.distanceToPath(x, y) > 40) {
        this.addText(x, y - 20, 'Phải đặt trên đường!', '#ff7675');
        return;
      }
      this.castSpell(name, x, y);
      return;
    }

    if (this.mode === 'rally') {
      const t = this.selection?.ref;
      this.mode = null;
      if (t && dist(t.x, t.y, x, y) <= t.range && this.distanceToPath(x, y) <= 40) {
        t.setRally(x, y);
        this.addEffect({ kind: 'ring', x, y, r: 20, color: '120,200,255', life: 0.4, maxLife: 0.4 });
        this.emit('sfx', 'click');
      } else {
        this.addText(x, y - 20, 'Ngoài tầm!', '#ff7675');
      }
      this.clearSelection();
      return;
    }

    if (this.mode === 'hero') {
      this.mode = null;
      this.selection = null;
      // Chạm lại vào anh hùng = bỏ chọn.
      if (dist(x, y, this.hero.x, this.hero.y - 12) < 26) return;
      const tx = clamp(x, 10, WORLD.width - 10);
      const ty = clamp(y, 10, WORLD.height - 10);
      this.hero.moveTo(tx, ty);
      this.addEffect({ kind: 'ring', x: tx, y: ty, r: 16, color: '255,220,120', life: 0.45, maxLife: 0.45 });
      this.emit('sfx', 'click');
      return;
    }

    // Nút menu: chạm lần 1 xem trước, lần 2 xác nhận.
    for (const btn of this.getMenuButtons()) {
      if (dist(x, y, btn.x, btn.y) > btn.r + 8) continue;
      if (btn.action === 'none') return;
      if (btn.action === 'rally' || this.pending === btn.id) {
        if (btn.enabled) this.runButton(btn);
        else this.addText(btn.x, btn.y - 34, 'Không đủ vàng!', '#ff7675');
      } else {
        this.pending = btn.id;
        this.emit('sfx', 'click');
      }
      return;
    }

    for (const flag of this.getWaveFlags()) {
      if (dist(x, y, flag.x, flag.y) <= flag.r + 10) {
        this.callWave();
        return;
      }
    }

    if (!this.hero.dead && dist(x, y, this.hero.x, this.hero.y - 12) < 24) {
      this.selectHero();
      this.emit('sfx', 'click');
      return;
    }

    for (const spot of this.spots) {
      if (dist(x, y, spot.x, spot.y - (spot.tower ? 16 : 0)) > SPOT_RADIUS + 10) continue;
      const same = this.selection?.ref === (spot.tower || spot);
      this.clearSelection();
      if (!same) {
        this.selection = spot.tower ? { kind: 'tower', ref: spot.tower } : { kind: 'spot', ref: spot };
        this.emit('sfx', 'click');
      }
      return;
    }

    let picked = null;
    for (const e of this.enemies) {
      const ey = e.y - (e.flying ? 26 : e.radius);
      if (dist(x, y, e.x, ey) <= e.radius + 14) picked = e;
    }
    this.clearSelection();
    if (picked) this.selection = { kind: 'enemy', ref: picked };
  }
}
