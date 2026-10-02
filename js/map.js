// Định nghĩa bản đồ: đường đi của quái, vị trí đặt tháp và đồ trang trí.
import { WORLD } from './config.js';
import { distToSegment, dist, seededRandom } from './utils.js';

export const PATH_WIDTH = 46;
export const SPOT_RADIUS = 32;

// Các điểm mốc (waypoint) của đường đi. Điểm đầu/cuối nằm ngoài màn hình
// để quái "đi vào" và "đi ra" tự nhiên.
const WAYPOINTS = [
  { x: -40, y: 120 },
  { x: 480, y: 120 },
  { x: 480, y: 300 },
  { x: 180, y: 300 },
  { x: 180, y: 500 },
  { x: 560, y: 500 },
  { x: 560, y: WORLD.height + 40 },
];

// Vị trí có thể xây tháp.
const BUILD_SPOTS = [
  { x: 330, y: 210 },
  { x: 590, y: 220 },
  { x: 80, y: 400 },
  { x: 370, y: 605 },
];

// Tạo đối tượng đường đi với độ dài từng đoạn được tính sẵn,
// để có thể lấy vị trí theo "quãng đường đã đi" (distance).
function createPath(points) {
  const segments = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const length = dist(a.x, a.y, b.x, b.y);
    segments.push({ a, b, length, start: total, angle: Math.atan2(b.y - a.y, b.x - a.x) });
    total += length;
  }

  return {
    points,
    segments,
    length: total,
    // Trả về {x, y, angle} tại quãng đường d tính từ điểm đầu.
    pointAt(d) {
      const clamped = Math.max(0, Math.min(total, d));
      for (const s of segments) {
        if (clamped <= s.start + s.length) {
          const t = s.length === 0 ? 0 : (clamped - s.start) / s.length;
          return {
            x: s.a.x + (s.b.x - s.a.x) * t,
            y: s.a.y + (s.b.y - s.a.y) * t,
            angle: s.angle,
          };
        }
      }
      const last = segments[segments.length - 1];
      return { x: last.b.x, y: last.b.y, angle: last.angle };
    },
    // Khoảng cách ngắn nhất từ một điểm tới đường đi.
    distanceFrom(x, y) {
      let min = Infinity;
      for (const s of segments) {
        min = Math.min(min, distToSegment(x, y, s.a.x, s.a.y, s.b.x, s.b.y));
      }
      return min;
    },
  };
}

// Sinh cây/đá trang trí ngẫu nhiên (có seed) nhưng tránh đường đi và ô xây tháp.
function createDecorations(path, spots) {
  const rand = seededRandom(1234);
  const items = [];
  let attempts = 0;
  while (items.length < 38 && attempts < 2000) {
    attempts++;
    const x = 20 + rand() * (WORLD.width - 40);
    const y = 20 + rand() * (WORLD.height - 40);
    if (path.distanceFrom(x, y) < PATH_WIDTH / 2 + 22) continue;
    if (spots.some((s) => dist(x, y, s.x, s.y) < SPOT_RADIUS + 30)) continue;
    if (items.some((it) => dist(x, y, it.x, it.y) < 30)) continue;
    const kind = rand() < 0.75 ? 'tree' : 'rock';
    items.push({ x, y, kind, size: kind === 'tree' ? 13 + rand() * 7 : 6 + rand() * 5 });
  }
  // Vẽ từ trên xuống dưới để vật phía dưới che vật phía trên.
  return items.sort((a, b) => a.y - b.y);
}

export function createMap() {
  const path = createPath(WAYPOINTS);
  const spots = BUILD_SPOTS.map((s, i) => ({ id: i, x: s.x, y: s.y, tower: null }));
  return {
    path,
    spots,
    decorations: createDecorations(path, spots),
  };
}
