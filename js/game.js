// Trạng thái game và luật chơi. Không biết gì về DOM hay canvas —
// chỉ nhận dt (update) và toạ độ chạm trong hệ toạ độ thế giới (handleTap).
import { START, TOWERS, WAVES } from './config.js';
import { createMap, SPOT_RADIUS } from './map.js';
import { dist } from './utils.js';
import { Enemy } from './entities/enemy.js';
import { Tower } from './entities/tower.js';

export const STATUS = {
  IDLE: 'idle', // đang chờ người chơi bấm bắt đầu wave
  PLAYING: 'playing', // wave đang chạy
  WON: 'won',
  LOST: 'lost',
};

const MENU_BUTTON_RADIUS = 30;
const TAP_SLOP = 10; // nới rộng vùng chạm cho ngón tay

export class Game {
  constructor() {
    this.reset();
  }

  reset() {
    this.map = createMap();
    this.gold = START.gold;
    this.lives = START.lives;
    this.waveIndex = -1; // wave hiện tại (0-based); -1 = chưa bắt đầu
    this.status = STATUS.IDLE;
    this.time = 0;

    this.enemies = [];
    this.towers = [];
    this.projectiles = [];
    this.effects = []; // chữ nổi, hiệu ứng trúng đòn...
    this.spawnQueue = []; // [{ at, type }] sắp xếp theo thời gian
    this.waveTime = 0;

    this.selectedSpot = null;
  }

  get totalWaves() {
    return WAVES.length;
  }

  get canStartWave() {
    return this.status === STATUS.IDLE && this.waveIndex < WAVES.length - 1;
  }

  // ---------- Wave ----------

  startNextWave() {
    if (!this.canStartWave) return;
    this.waveIndex++;
    const wave = WAVES[this.waveIndex];
    this.spawnQueue = [];
    for (const g of wave.groups) {
      for (let i = 0; i < g.count; i++) {
        this.spawnQueue.push({ at: g.delay + i * g.interval, type: g.type });
      }
    }
    this.spawnQueue.sort((a, b) => a.at - b.at);
    this.waveTime = 0;
    this.status = STATUS.PLAYING;
  }

  updateSpawning(dt) {
    this.waveTime += dt;
    while (this.spawnQueue.length && this.spawnQueue[0].at <= this.waveTime) {
      const { type } = this.spawnQueue.shift();
      this.enemies.push(new Enemy(type, this.map.path));
    }
  }

  checkWaveEnd() {
    if (this.status !== STATUS.PLAYING) return;
    if (this.spawnQueue.length || this.enemies.length) return;

    const wave = WAVES[this.waveIndex];
    if (this.waveIndex >= WAVES.length - 1) {
      this.status = STATUS.WON;
      return;
    }
    if (wave.bonus) {
      this.gold += wave.bonus;
      this.addText(360, 360, `Hoàn thành wave! +${wave.bonus} vàng`, '#ffeaa7', 2);
    }
    this.status = STATUS.IDLE;
  }

  // ---------- Vòng lặp ----------

  update(dt) {
    this.time += dt;
    this.updateEffects(dt);
    if (this.status !== STATUS.PLAYING) return;

    this.updateSpawning(dt);

    for (const e of this.enemies) e.update(dt);

    for (const t of this.towers) {
      const projectile = t.update(dt, this.enemies);
      if (projectile) this.projectiles.push(projectile);
    }

    for (const p of this.projectiles) p.update(dt);
    this.projectiles = this.projectiles.filter((p) => !p.done);

    // Xử lý quái chết hoặc lọt qua.
    for (const e of this.enemies) {
      if (e.dead) {
        this.gold += e.def.reward;
        this.addText(e.x, e.y - 20, `+${e.def.reward}`, '#ffd32a');
        this.effects.push({ kind: 'poof', x: e.x, y: e.y, r: e.radius, life: 0.35, maxLife: 0.35 });
      } else if (e.escaped) {
        this.lives = Math.max(0, this.lives - e.def.livesCost);
      }
    }
    this.enemies = this.enemies.filter((e) => e.alive);

    if (this.lives <= 0) {
      this.status = STATUS.LOST;
      this.selectedSpot = null;
      return;
    }
    this.checkWaveEnd();
  }

  updateEffects(dt) {
    for (const fx of this.effects) {
      fx.life -= dt;
      if (fx.kind === 'text') fx.y -= 24 * dt;
    }
    this.effects = this.effects.filter((fx) => fx.life > 0);
  }

  addText(x, y, text, color = '#fff', life = 1) {
    this.effects.push({ kind: 'text', x, y, text, color, life, maxLife: life });
  }

  // ---------- Xây / bán tháp ----------

  build(spot, type) {
    const def = TOWERS[type];
    if (spot.tower) return false;
    if (this.gold < def.cost) {
      this.addText(spot.x, spot.y - 40, 'Không đủ vàng!', '#ff7675');
      return false;
    }
    this.gold -= def.cost;
    spot.tower = new Tower(type, spot);
    this.towers.push(spot.tower);
    return true;
  }

  sell(spot) {
    const tower = spot.tower;
    if (!tower) return;
    this.gold += tower.sellValue;
    this.addText(spot.x, spot.y - 40, `+${tower.sellValue}`, '#ffd32a');
    this.towers = this.towers.filter((t) => t !== tower);
    spot.tower = null;
  }

  // ---------- Menu xây dựng (vẽ bằng canvas) ----------

  // Danh sách nút của menu đang mở. Renderer và handleTap dùng chung hàm này
  // để vị trí vẽ và vùng chạm luôn khớp nhau.
  getMenuButtons() {
    const spot = this.selectedSpot;
    if (!spot) return [];
    // Mặc định hiện phía trên ô; nếu sát mép trên thì hiện phía dưới.
    const y = spot.y - 72 < MENU_BUTTON_RADIUS ? spot.y + 72 : spot.y - 72;

    if (!spot.tower) {
      const def = TOWERS.archer;
      return [
        {
          action: 'build',
          towerType: 'archer',
          x: spot.x,
          y,
          r: MENU_BUTTON_RADIUS,
          label: `${def.cost}`,
          enabled: this.gold >= def.cost,
        },
      ];
    }
    return [
      {
        action: 'sell',
        x: spot.x,
        y,
        r: MENU_BUTTON_RADIUS,
        label: `+${spot.tower.sellValue}`,
        enabled: true,
      },
    ];
  }

  // Xử lý một lần chạm/click tại toạ độ thế giới (x, y).
  handleTap(x, y) {
    if (this.status === STATUS.WON || this.status === STATUS.LOST) return;

    // 1. Ưu tiên nút menu đang mở.
    for (const btn of this.getMenuButtons()) {
      if (dist(x, y, btn.x, btn.y) <= btn.r + TAP_SLOP) {
        if (btn.action === 'build') this.build(this.selectedSpot, btn.towerType);
        else if (btn.action === 'sell') this.sell(this.selectedSpot);
        this.selectedSpot = null;
        return;
      }
    }

    // 2. Chạm vào ô xây tháp → mở/đóng menu.
    for (const spot of this.map.spots) {
      if (dist(x, y, spot.x, spot.y) <= SPOT_RADIUS + TAP_SLOP) {
        this.selectedSpot = this.selectedSpot === spot ? null : spot;
        return;
      }
    }

    // 3. Chạm ra ngoài → đóng menu.
    this.selectedSpot = null;
  }
}
