// Bộ công cụ vẽ "tranh vẽ tay": khối có viền đậm, đổ khối sáng-tối bằng gradient,
// cùng bộ nhớ đệm sprite để chỉ vẽ mỗi khung hình một lần rồi dùng lại (nhẹ cho điện thoại).

export const INK = '#2a1b12';

// Làm sáng (amt > 0) hoặc tối (amt < 0) một màu hex.
export function tint(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(amt > 0 ? c + (255 - c) * amt : c * (1 + amt))));
  const r = f(n >> 16);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

// Tô một hình đã dựng sẵn bằng `build()`: màu nền + gradient khối (sáng trên-trái, tối dưới-phải) + viền.
function paintPath(ctx, build, base, box, opts = {}) {
  const { outline = INK, lw = 1.6, light = 0.35, dark = 0.4, noShade = false } = opts;
  ctx.beginPath();
  build();
  ctx.fillStyle = base;
  ctx.fill();
  if (!noShade) {
    const g = ctx.createLinearGradient(box.x, box.y, box.x + box.w * 0.6, box.y + box.h);
    g.addColorStop(0, tint(base, light));
    g.addColorStop(0.45, base);
    g.addColorStop(1, tint(base, -dark));
    ctx.fillStyle = g;
    ctx.fill();
  }
  if (outline) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = outline;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
}

export function blob(ctx, x, y, rx, ry, base, opts) {
  paintPath(ctx, () => ctx.ellipse(x, y, rx, ry, opts?.rot || 0, 0, Math.PI * 2), base, { x: x - rx, y: y - ry, w: rx * 2, h: ry * 2 }, opts);
}

export function rrect(ctx, x, y, w, h, r, base, opts) {
  paintPath(ctx, () => ctx.roundRect(x, y, w, h, r), base, { x, y, w, h }, opts);
}

export function poly(ctx, pts, base, opts) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [px, py] of pts) {
    minX = Math.min(minX, px);
    minY = Math.min(minY, py);
    maxX = Math.max(maxX, px);
    maxY = Math.max(maxY, py);
  }
  paintPath(
    ctx,
    () => {
      pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
      ctx.closePath();
    },
    base,
    { x: minX, y: minY, w: maxX - minX || 1, h: maxY - minY || 1 },
    opts,
  );
}

// Hình tự do: build(ctx) dựng path, box = khung bao để đặt gradient.
export function shape(ctx, build, base, box, opts) {
  paintPath(ctx, () => build(ctx), base, box, opts);
}

export function line(ctx, pts, color, width, cap = 'round') {
  ctx.beginPath();
  pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = cap;
  ctx.lineJoin = 'round';
  ctx.stroke();
}

// Chi có viền: vẽ nét đậm màu mực rồi nét màu bên trong.
export function limb(ctx, pts, color, width) {
  line(ctx, pts, INK, width + 2.6);
  line(ctx, pts, color, width);
}

export function glow(ctx, x, y, r, rgb, alpha = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${alpha})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

export function groundShadow(ctx, x, y, rx, ry, alpha = 0.3) {
  ctx.fillStyle = `rgba(20,12,6,${alpha})`;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ---------- Bộ nhớ đệm sprite ----------
// Mỗi sprite là một canvas nhỏ vẽ ở độ phân giải màn hình hiện tại.
// spec: { w, h, ax, ay } — kích thước (đơn vị thế giới) và điểm neo (thường là chân nhân vật).

export class SpriteCache {
  constructor() {
    this.scale = 1;
    this.map = new Map();
  }

  setScale(scale) {
    const q = Math.max(1, Math.round(scale * 4) / 4);
    if (q !== this.scale) {
      this.scale = q;
      this.map.clear();
    }
  }

  get(key, spec, draw) {
    let c = this.map.get(key);
    if (!c) {
      c = document.createElement('canvas');
      c.width = Math.ceil(spec.w * this.scale);
      c.height = Math.ceil(spec.h * this.scale);
      const g = c.getContext('2d');
      g.scale(this.scale, this.scale);
      g.translate(spec.ax, spec.ay);
      draw(g);
      c.spec = spec;
      this.map.set(key, c);
    }
    return c;
  }

  // Vẽ sprite với chân tại (x, y); flip = true để quay mặt sang trái.
  draw(ctx, c, x, y, flip = false, alpha = 1) {
    const s = c.spec;
    if (alpha !== 1) ctx.globalAlpha = alpha;
    if (flip) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(-1, 1);
      ctx.drawImage(c, -s.ax, -s.ay, s.w, s.h);
      ctx.restore();
    } else {
      ctx.drawImage(c, x - s.ax, y - s.ay, s.w, s.h);
    }
    if (alpha !== 1) ctx.globalAlpha = 1;
  }
}

export const sprites = new SpriteCache();
