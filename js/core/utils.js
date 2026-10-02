// Các hàm toán học nhỏ dùng chung. Không phụ thuộc DOM để chạy được cả trong Node.

export const WORLD = { width: 720, height: 720 };

export function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

export function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function randRange(min, max) {
  return min + Math.random() * (max - min);
}

// [min, max] → số nguyên ngẫu nhiên trong khoảng.
export function rollDamage([min, max]) {
  return Math.round(randRange(min, max));
}

// Khoảng cách từ điểm P tới đoạn thẳng AB.
export function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = clamp(t, 0, 1);
  return dist(px, py, ax + t * dx, ay + t * dy);
}

// Bộ sinh số ngẫu nhiên có seed — để bản đồ trang trí giống nhau mỗi lần tải.
export function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Di chuyển (x, y) về phía (tx, ty) tối đa `step`. Trả về true nếu đã tới nơi.
export function moveToward(obj, tx, ty, step) {
  const dx = tx - obj.x;
  const dy = ty - obj.y;
  const d = Math.hypot(dx, dy);
  if (d <= step || d < 0.5) {
    obj.x = tx;
    obj.y = ty;
    return true;
  }
  obj.x += (dx / d) * step;
  obj.y += (dy / d) * step;
  return false;
}
