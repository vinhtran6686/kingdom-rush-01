import { ENEMIES } from '../config.js';

export class Enemy {
  constructor(type, path) {
    this.type = type;
    this.def = ENEMIES[type];
    this.path = path;
    this.maxHp = this.def.hp;
    this.hp = this.def.hp;
    this.distance = 0; // quãng đường đã đi dọc theo path
    this.dead = false;
    this.escaped = false;
    this.hitFlash = 0; // thời gian nháy trắng khi trúng tên
    this.walkTime = Math.random() * 10; // lệch pha animation bước đi
    this.syncPosition();
  }

  get alive() {
    return !this.dead && !this.escaped;
  }

  get radius() {
    return this.def.radius;
  }

  syncPosition() {
    const p = this.path.pointAt(this.distance);
    this.x = p.x;
    this.y = p.y;
    this.angle = p.angle;
  }

  update(dt) {
    if (!this.alive) return;
    this.distance += this.def.speed * dt;
    this.walkTime += dt;
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    if (this.distance >= this.path.length) {
      this.escaped = true;
      return;
    }
    this.syncPosition();
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.hp -= amount;
    this.hitFlash = 0.08;
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
    }
  }
}
