// Tháp: cung thủ, pháp sư, pháo đài (bắn đạn) và doanh trại (sinh lính chặn đường).
import { TOWERS, SELL_RATIO } from '../data/towers.js';
import { dist, rollDamage } from '../core/utils.js';
import { Homing, Lobbed } from './projectiles.js';
import { Soldier } from './soldier.js';

export class Tower {
  constructor(type, spot, game) {
    this.type = type;
    this.def = TOWERS[type];
    this.spot = spot;
    this.x = spot.x;
    this.y = spot.y;
    this.level = 0; // chỉ số trong def.levels (0..2)
    this.spent = this.def.levels[0].cost;
    this.cooldown = 0.3;
    this.aim = -Math.PI / 2;
    this.shootAnim = 0;
    this.buildAnim = 0.5;

    if (type === 'barracks') {
      // Điểm tập kết mặc định: điểm trên đường gần tháp nhất.
      const rally = game.nearestPathPoint(this.x, this.y);
      this.rallyX = rally.x;
      this.rallyY = rally.y;
      this.soldiers = [];
      this.respawnTimers = [];
      for (let i = 0; i < this.def.soldiers; i++) this.spawnSoldier(i);
    }
  }

  get stats() {
    return this.def.levels[this.level];
  }

  get range() {
    return this.stats.range;
  }

  get maxed() {
    return this.level >= this.def.levels.length - 1;
  }

  get upgradeCost() {
    return this.maxed ? null : this.def.levels[this.level + 1].cost;
  }

  get sellValue() {
    return Math.floor(this.spent * SELL_RATIO);
  }

  upgrade() {
    this.level++;
    this.spent += this.stats.cost;
    this.buildAnim = 0.5;
    if (this.type === 'barracks') {
      // Lính hiện có được nâng cấp và hồi đầy máu.
      for (const s of this.soldiers) {
        if (!s) continue;
        this.applySoldierStats(s);
        s.hp = s.maxHp;
      }
    }
  }

  // ---------- Doanh trại ----------

  slotPosition(i) {
    const angle = (i / this.def.soldiers) * Math.PI * 2 - Math.PI / 2;
    return { x: this.rallyX + Math.cos(angle) * 16, y: this.rallyY + Math.sin(angle) * 12 };
  }

  applySoldierStats(s) {
    const st = this.stats;
    s.maxHp = st.soldierHp;
    s.damage = st.damage;
    s.armor = st.armor;
    s.interval = st.interval;
  }

  spawnSoldier(i) {
    const slot = this.slotPosition(i);
    const s = new Soldier({
      kind: 'soldier',
      x: this.x,
      y: this.y + 10,
      homeX: slot.x,
      homeY: slot.y,
      hp: this.stats.soldierHp,
      damage: this.stats.damage,
      armor: this.stats.armor,
      interval: this.stats.interval,
      speed: 75,
      engageRange: 62,
    });
    s.owner = this;
    this.soldiers[i] = s;
    this.respawnTimers[i] = 0;
  }

  setRally(x, y) {
    this.rallyX = x;
    this.rallyY = y;
    this.soldiers.forEach((s, i) => {
      if (!s) return;
      s.releaseTarget();
      const slot = this.slotPosition(i);
      s.setHome(slot.x, slot.y);
    });
  }

  updateBarracks(dt, game) {
    for (let i = 0; i < this.def.soldiers; i++) {
      const s = this.soldiers[i];
      if (s && !s.dead) {
        s.update(dt, game);
        continue;
      }
      if (s && s.dead) {
        this.soldiers[i] = null;
        this.respawnTimers[i] = this.def.respawn;
      }
      this.respawnTimers[i] -= dt;
      if (this.respawnTimers[i] <= 0) this.spawnSoldier(i);
    }
  }

  // ---------- Tháp bắn ----------

  findTarget(enemies) {
    let best = null;
    for (const e of enemies) {
      if (!e.alive) continue;
      if (e.flying && !this.def.hitsFlying) continue;
      if (dist(this.x, this.y, e.x, e.y) > this.range + e.radius) continue;
      if (!best || e.remaining < best.remaining) best = e;
    }
    return best;
  }

  update(dt, game) {
    this.shootAnim = Math.max(0, this.shootAnim - dt);
    this.buildAnim = Math.max(0, this.buildAnim - dt);
    if (this.type === 'barracks') {
      this.updateBarracks(dt, game);
      return;
    }

    this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.cooldown > 0) return;
    const target = this.findTarget(game.enemies);
    if (!target) return;

    this.cooldown = this.stats.interval;
    this.shootAnim = 0.2;
    const ox = this.x;
    const oy = this.y - 40;
    this.aim = Math.atan2(target.y - oy, target.x - ox);
    const damage = rollDamage(this.stats.damage);

    if (this.type === 'archer') {
      game.projectiles.push(
        new Homing({ kind: 'arrow', x: ox, y: oy, target, damage, damageType: 'physical', speed: 520 }),
      );
      game.emit('sfx', 'arrow');
    } else if (this.type === 'mage') {
      game.projectiles.push(
        new Homing({ kind: 'bolt', x: ox, y: oy - 6, target, damage, damageType: 'magic', speed: 380 }),
      );
      game.emit('sfx', 'magic');
    } else if (this.type === 'artillery') {
      // Ngắm trước vị trí quái sau thời gian bay.
      const flightTime = 0.9;
      const lead = target.blocker || target.stun > 0 ? 0 : target.def.speed * flightTime;
      const p = target.path.pointAt(target.distance + lead, target.lateral);
      game.projectiles.push(
        new Lobbed({
          kind: 'shell',
          x: ox,
          y: oy + 10,
          tx: p.x,
          ty: p.y,
          flightTime,
          arc: 90,
          damage,
          damageType: 'physical',
          splash: this.stats.splash,
        }),
      );
      game.emit('sfx', 'cannon');
    }
  }

  // Khi bán tháp: lính rời trận.
  destroy() {
    if (this.type !== 'barracks') return;
    for (const s of this.soldiers) if (s) s.releaseTarget();
  }
}
