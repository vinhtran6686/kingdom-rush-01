// Mũi tên bay đuổi theo mục tiêu. Nếu mục tiêu chết giữa chừng,
// mũi tên bay tới vị trí cuối cùng rồi biến mất.
export class Projectile {
  constructor(x, y, target, damage, speed) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.damage = damage;
    this.speed = speed;
    this.tx = target.x;
    this.ty = target.y;
    this.angle = Math.atan2(this.ty - y, this.tx - x);
    this.done = false;
  }

  update(dt) {
    if (this.done) return;
    if (this.target.alive) {
      this.tx = this.target.x;
      this.ty = this.target.y;
    }
    const dx = this.tx - this.x;
    const dy = this.ty - this.y;
    const d = Math.hypot(dx, dy);
    const step = this.speed * dt;
    this.angle = Math.atan2(dy, dx);

    if (d <= step || d < 4) {
      this.x = this.tx;
      this.y = this.ty;
      if (this.target.alive) this.target.takeDamage(this.damage);
      this.done = true;
      return;
    }
    this.x += (dx / d) * step;
    this.y += (dy / d) * step;
  }
}
