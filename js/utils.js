// Các hàm toán học nhỏ dùng chung.

export function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

// Khoảng cách từ điểm P tới đoạn thẳng AB.
export function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return dist(px, py, ax + t * dx, ay + t * dy);
}

// Bộ sinh số ngẫu nhiên có seed — để trang trí bản đồ giống nhau mỗi lần tải.
export function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
