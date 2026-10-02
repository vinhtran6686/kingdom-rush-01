// Đường đi của quái: làm mượt waypoint bằng Catmull-Rom rồi lấy mẫu thành
// polyline dày, cho phép tra vị trí theo quãng đường đã đi (distance).
import { dist, distToSegment } from '../core/utils.js';

function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  const f = (a, b, c, d) =>
    0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  return { x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) };
}

function smooth(waypoints) {
  const out = [];
  const n = waypoints.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = waypoints[Math.max(0, i - 1)];
    const p1 = waypoints[i];
    const p2 = waypoints[i + 1];
    const p3 = waypoints[Math.min(n - 1, i + 2)];
    const steps = Math.max(2, Math.ceil(dist(p1.x, p1.y, p2.x, p2.y) / 8));
    for (let s = 0; s < steps; s++) out.push(catmullRom(p0, p1, p2, p3, s / steps));
  }
  out.push({ ...waypoints[n - 1] });
  return out;
}

export function createPath(waypoints) {
  const points = smooth(waypoints);
  const cum = [0];
  for (let i = 1; i < points.length; i++) {
    cum.push(cum[i - 1] + dist(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y));
  }
  const length = cum[cum.length - 1];

  function indexAt(d) {
    // Tìm nhị phân đoạn chứa quãng đường d.
    let lo = 0;
    let hi = cum.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] <= d) lo = mid;
      else hi = mid;
    }
    return lo;
  }

  return {
    waypoints,
    points,
    length,
    // {x, y, angle} tại quãng đường d; `lateral` lệch sang ngang so với tim đường.
    pointAt(d, lateral = 0) {
      const dd = Math.max(0, Math.min(length, d));
      const i = indexAt(dd);
      const a = points[i];
      const b = points[Math.min(i + 1, points.length - 1)];
      const segLen = cum[Math.min(i + 1, cum.length - 1)] - cum[i];
      const t = segLen > 0 ? (dd - cum[i]) / segLen : 0;
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      return {
        x: a.x + (b.x - a.x) * t - Math.sin(angle) * lateral,
        y: a.y + (b.y - a.y) * t + Math.cos(angle) * lateral,
        angle,
      };
    },
    distanceFrom(x, y) {
      let min = Infinity;
      for (let i = 0; i < points.length - 1; i++) {
        const a = points[i];
        const b = points[i + 1];
        min = Math.min(min, distToSegment(x, y, a.x, a.y, b.x, b.y));
      }
      return min;
    },
    // Quãng đường d của điểm trên đường gần (x, y) nhất.
    nearestDistance(x, y) {
      let best = 0;
      let bestD = Infinity;
      for (let i = 0; i < points.length; i++) {
        const d = dist(x, y, points[i].x, points[i].y);
        if (d < bestD) {
          bestD = d;
          best = cum[i];
        }
      }
      return best;
    },
  };
}
