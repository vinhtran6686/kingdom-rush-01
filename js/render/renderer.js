// Vẽ một frame của màn chơi từ trạng thái Game (chỉ đọc, không sửa trạng thái).
import { WORLD } from '../core/utils.js';
import { TOWERS } from '../data/towers.js';
import { HERO } from '../data/hero.js';
import { bakeTerrain, THEMES } from './terrain.js';
import { sprites, INK, tint, blob, rrect, shape, line, glow, groundShadow } from './art.js';
import { drawTower, drawSpot, drawTowerIcon } from './towers.js';
import { drawUnit, unitSprite, unitHeight } from './units.js';
import { Particles } from './particles.js';

export class Renderer {
  constructor(ctx, viewport) {
    this.ctx = ctx;
    this.viewport = viewport;
    this.terrain = null;
    this.terrainKey = '';
    this.particles = new Particles();
    this.lastTime = 0;
    this.game = null;
  }

  ensureTerrain(game) {
    const scale = Math.min(3, Math.max(1, this.viewport.scale * this.viewport.dpr));
    sprites.setScale(scale);
    const key = `${game.level.id}:${scale.toFixed(2)}`;
    if (key === this.terrainKey) return;
    this.terrain = bakeTerrain(game.level, game.paths, game.spots, scale);
    this.terrainKey = key;
  }

  render(game) {
    const ctx = this.ctx;
    const t = game.time;
    if (game !== this.game) {
      this.game = game;
      this.particles.reset();
      this.lastTime = t;
    }
    // Hạt chạy theo thời gian game (đứng yên khi tạm dừng, nhanh hơn khi x2/x3).
    const dt = Math.max(0, Math.min(0.1, t - this.lastTime));
    this.lastTime = t;
    this.particles.ingest(game.effects);
    for (const p of game.projectiles) if (p.kind === 'shell' && Math.random() < 0.6) this.particles.trail(p.x, p.y - p.height);
    this.particles.ambient(dt, THEMES[game.level.theme].ambient);
    this.particles.update(dt);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#14181c';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    this.ensureTerrain(game);
    // Lấp vùng viền (letterbox) bằng chính bản đồ phóng to và làm tối.
    const cw = ctx.canvas.width;
    const ch = ctx.canvas.height;
    const theme = THEMES[game.level.theme];
    const lb = ctx.createRadialGradient(cw / 2, ch / 2, 0, cw / 2, ch / 2, Math.max(cw, ch) * 0.7);
    lb.addColorStop(0, tint(theme.ground, -0.45));
    lb.addColorStop(1, tint(theme.ground, -0.75));
    ctx.fillStyle = lb;
    ctx.fillRect(0, 0, cw, ch);

    this.viewport.applyTransform(ctx);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, WORLD.width, WORLD.height);
    ctx.clip();
    ctx.drawImage(this.terrain, 0, 0, WORLD.width, WORLD.height);

    for (const fx of game.effects) if (fx.kind === 'scorch') drawScorch(ctx, fx);
    const sel = game.selection;
    for (const spot of game.spots) if (!spot.tower) drawSpot(ctx, spot, t, sel?.ref === spot);
    this.drawRanges(ctx, game);
    this.particles.draw(ctx, 'ground');

    // Sắp xếp theo y để vật ở dưới che vật ở trên.
    const list = [];
    for (const tw of game.towers) {
      list.push({ y: tw.y, d: () => drawTower(ctx, tw, t) });
      if (tw.type === 'barracks') for (const s of tw.soldiers) if (s && !s.dead) list.push({ y: s.y, d: () => drawUnit(ctx, 'soldier', s) });
    }
    for (const m of game.militia) list.push({ y: m.y, d: () => drawUnit(ctx, 'militia', m) });
    for (const e of game.enemies) if (!e.flying) list.push({ y: e.y, d: () => drawEnemy(ctx, e) });
    const h = game.hero;
    if (!h.dead) list.push({ y: h.y, d: () => drawHero(ctx, h, game.mode === 'hero', t) });
    for (const fx of game.effects) if (fx.kind === 'death') list.push({ y: fx.y, d: () => drawDeath(ctx, fx) });
    list.sort((a, b) => a.y - b.y);
    for (const it of list) it.d();

    for (const e of game.enemies) if (e.flying) drawEnemy(ctx, e);
    for (const p of game.projectiles) drawProjectile(ctx, p);
    this.drawFx(ctx, game);
    this.particles.draw(ctx, 'air');
    this.drawWaveFlags(ctx, game);
    this.drawBars(ctx, game);
    this.drawTexts(ctx, game);
    this.drawMenu(ctx, game);
    this.drawModeHint(ctx, game);
    ctx.restore();
  }

  drawRanges(ctx, game) {
    const preview = game.getPreview();
    const sel = game.selection;
    let c = null;
    if (preview) c = { x: preview.x, y: preview.y, r: TOWERS[preview.type].levels[preview.level].range, rgb: '120,200,255' };
    else if (sel?.kind === 'tower') c = { x: sel.ref.x, y: sel.ref.y, r: sel.ref.range, rgb: '255,240,200' };
    if (game.mode === 'rally' && sel?.ref) c = { x: sel.ref.x, y: sel.ref.y, r: sel.ref.range, rgb: '140,230,150' };
    if (!c) return;
    const ry = c.r * 0.86;
    const g = ctx.createRadialGradient(c.x, c.y, c.r * 0.55, c.x, c.y, c.r);
    g.addColorStop(0, `rgba(${c.rgb},0.04)`);
    g.addColorStop(1, `rgba(${c.rgb},0.24)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, c.r, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(${c.rgb},0.9)`;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([10, 7]);
    ctx.lineDashOffset = -game.time * 12;
    ctx.stroke();
    ctx.setLineDash([]);
    if (sel?.kind === 'tower' && sel.ref.type === 'barracks') {
      const tw = sel.ref;
      line(ctx, [[tw.rallyX, tw.rallyY], [tw.rallyX, tw.rallyY - 22]], '#3a2a1a', 2);
      shape(ctx, (g) => {
        g.moveTo(tw.rallyX, tw.rallyY - 22);
        g.lineTo(tw.rallyX + 14, tw.rallyY - 18);
        g.lineTo(tw.rallyX, tw.rallyY - 13);
        g.closePath();
      }, '#5ccf6a', { x: tw.rallyX, y: tw.rallyY - 22, w: 14, h: 9 }, { lw: 1.2 });
    }
  }

  drawWaveFlags(ctx, game) {
    const flags = game.getWaveFlags();
    if (!flags.length) return;
    const t = game.time;
    const ratio = game.nextWaveTimer === null ? 1 : Math.max(0, game.nextWaveTimer / 22);
    for (const f of flags) {
      const pulse = 1 + Math.sin(t * 5) * 0.07;
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.scale(pulse, pulse);
      glow(ctx, 0, 0, 34, '255,90,40', 0.35 + 0.2 * Math.sin(t * 5));
      blob(ctx, 0, 0, 23, 23, '#3b2a1e', { lw: 2.4 });
      ctx.strokeStyle = '#ffcf4a';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, 19, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
      ctx.stroke();
      // Đầu lâu
      blob(ctx, 0, -2, 10.5, 10, '#f2ece0', { lw: 1.4, light: 0.2 });
      rrect(ctx, -5.5, 4, 11, 7, 2, '#f2ece0', { lw: 1.4, light: 0.2 });
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.ellipse(-4, -2, 3, 3.4, 0, 0, Math.PI * 2);
      ctx.ellipse(4, -2, 3, 3.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-0.8, 3, 1.6, 2.5);
      for (const x of [-3, 0, 3]) ctx.fillRect(x - 0.5, 7, 1, 4);
      ctx.restore();
    }
  }

  drawBars(ctx, game) {
    for (const e of game.enemies) {
      if (e.hp >= e.maxHp && game.selection?.ref !== e) continue;
      const w = e.def.boss ? 64 : Math.max(20, e.radius * 2.2);
      const top = e.flying ? e.y - 50 : e.y - unitHeight(e.type);
      healthBar(ctx, e.x, top, w, e.hp / e.maxHp);
    }
    const soldiers = [...game.militia];
    for (const tw of game.towers) if (tw.type === 'barracks') soldiers.push(...tw.soldiers.filter((s) => s && !s.dead));
    for (const s of soldiers) if (s.hp < s.maxHp) healthBar(ctx, s.x, s.y - 44, 18, s.hp / s.maxHp);
    const h = game.hero;
    if (!h.dead) healthBar(ctx, h.x, h.y - 70, 30, h.hp / h.maxHp, '#ffd34d');
    else {
      // Bia mộ tạm + đồng hồ hồi sinh
      rrect(ctx, h.spawn.x - 9, h.spawn.y - 22, 18, 22, 8, '#9aa0a3');
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      outlineText(ctx, String(Math.ceil(h.respawnTimer)), h.spawn.x, h.spawn.y - 32, '#fff');
    }
  }

  drawFx(ctx, game) {
    for (const fx of game.effects) {
      const k = fx.life / fx.maxLife;
      if (fx.kind === 'explosion') {
        const r = fx.r * (0.35 + (1 - k) * 0.85);
        glow(ctx, fx.x, fx.y - 8, r * 1.3, fx.big ? '255,170,60' : '255,200,110', k);
        const g = ctx.createRadialGradient(fx.x, fx.y - 8, 0, fx.x, fx.y - 8, r);
        g.addColorStop(0, `rgba(255,250,220,${k})`);
        g.addColorStop(0.5, `rgba(255,140,40,${k * 0.9})`);
        g.addColorStop(1, 'rgba(120,40,10,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(fx.x, fx.y - 8, r, r * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        // Sóng xung kích
        ctx.strokeStyle = `rgba(255,240,200,${k * 0.7})`;
        ctx.lineWidth = 3 * k + 0.5;
        ctx.beginPath();
        ctx.ellipse(fx.x, fx.y, fx.r * (1.2 - k * 0.6), fx.r * 0.5 * (1.2 - k * 0.6), 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (fx.kind === 'ring' || fx.kind === 'heal') {
        const rgb = fx.kind === 'heal' ? '120,255,160' : fx.color;
        const r = fx.r * (0.3 + (1 - k) * 0.8);
        ctx.strokeStyle = `rgba(${rgb},${k})`;
        ctx.lineWidth = 4 * k + 1;
        ctx.beginPath();
        ctx.ellipse(fx.x, fx.y, r, r * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        if (fx.kind === 'ring' && fx.r > 40) {
          // Vệt chém xoáy của anh hùng
          ctx.strokeStyle = `rgba(255,255,255,${k * 0.8})`;
          ctx.lineWidth = 6 * k;
          ctx.beginPath();
          ctx.ellipse(fx.x, fx.y - 14, r * 0.8, r * 0.35, 0, -1 + (1 - k) * 6, 1 + (1 - k) * 6);
          ctx.stroke();
        }
      } else if (fx.kind === 'spark') {
        glow(ctx, fx.x, fx.y, fx.r * 1.4, fx.color, k);
      }
    }
  }

  drawTexts(ctx, game) {
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const fx of game.effects) {
      if (fx.kind !== 'text') continue;
      const k = fx.life / fx.maxLife;
      ctx.globalAlpha = Math.min(1, k * 2.5);
      const pop = 1 + Math.max(0, k - 0.8) * 2;
      ctx.save();
      ctx.translate(fx.x, fx.y);
      ctx.scale(pop, pop);
      if (fx.text.startsWith('+')) coin(ctx, -ctx.measureText(fx.text).width / 2 - 8, 0, 6);
      outlineText(ctx, fx.text, 0, 0, fx.color);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  drawMenu(ctx, game) {
    const buttons = game.getMenuButtons();
    if (!buttons.length) return;
    const sel = game.selection.ref;
    // Vòng gỗ nối các nút
    ctx.strokeStyle = 'rgba(42,27,18,0.85)';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(sel.x, sel.y - 14, 66, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#c9a46a';
    ctx.lineWidth = 4;
    ctx.stroke();

    for (const b of buttons) {
      const active = game.pending === b.id;
      const r = b.r * (active ? 1.12 : 1);
      ctx.globalAlpha = b.enabled || b.action === 'none' ? 1 : 0.65;
      groundShadow(ctx, b.x + 2, b.y + 4, r, r, 0.35);
      if (active) glow(ctx, b.x, b.y, r * 1.8, '255,220,110', 0.55);
      blob(ctx, b.x, b.y, r + 3, r + 3, active ? '#ffd34d' : '#c9a46a', { lw: 2.2, light: 0.5 });
      const face = b.action === 'sell' ? '#8a3324' : b.action === 'upgrade' || b.action === 'none' ? '#2f6a35' : b.action === 'rally' ? '#3a5a2a' : '#3a2a1e';
      blob(ctx, b.x, b.y, r - 1, r - 1, face, { lw: 1.4, light: 0.25, dark: 0.45 });

      if (b.action === 'build') {
        ctx.save();
        ctx.beginPath();
        ctx.arc(b.x, b.y, r - 2, 0, Math.PI * 2);
        ctx.clip();
        drawTowerIcon(ctx, b.towerType, b.x, b.y - 2, 40);
        ctx.restore();
      } else {
        drawButtonIcon(ctx, b);
      }
      if (b.cost !== undefined) {
        const label = b.action === 'sell' ? `+${b.cost}` : `${b.cost}`;
        ctx.font = 'bold 12px system-ui, sans-serif';
        const w = ctx.measureText(label).width + 18;
        rrect(ctx, b.x - w / 2, b.y + r - 6, w, 16, 8, '#2a1b12', { lw: 1.2, outline: '#c9a46a', noShade: true });
        coin(ctx, b.x - w / 2 + 7, b.y + r + 2, 4);
        ctx.fillStyle = b.enabled ? '#ffd34d' : '#ff7b6b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, b.x + 4, b.y + r + 2.5);
      }
      ctx.globalAlpha = 1;
    }
  }

  drawModeHint(ctx, game) {
    const hints = {
      meteor: 'Chạm vào bản đồ để thả Mưa Thiên Thạch',
      militia: 'Chạm lên đường để gọi Dân Quân',
      rally: 'Chạm lên đường (trong vòng tròn) để đặt điểm tập kết',
      hero: `Chạm để di chuyển ${HERO.name}`,
    };
    let text = hints[game.mode];
    if (!text && game.status === 'ready') text = 'Xây tháp rồi chạm vào đầu lâu để gọi wave đầu tiên';
    if (!text) return;
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width + 34;
    rrect(ctx, WORLD.width / 2 - w / 2, WORLD.height - 52, w, 34, 10, '#3b2a1e', { outline: '#c9a46a', lw: 2.5, light: 0.15 });
    ctx.fillStyle = '#fff4d6';
    ctx.fillText(text, WORLD.width / 2, WORLD.height - 34.5);
  }
}

// ---------- Hàm vẽ phụ ----------

function drawEnemy(ctx, e) {
  const y = e.flying ? e.y - 30 + Math.sin(e.anim * 4) * 3 : e.y;
  drawUnit(ctx, e.type, e, y);
  if (e.def.boss) glow(ctx, e.x, e.y - 50, 40, '255,120,40', 0.12);
  if (e.stun > 0) {
    const top = (e.flying ? e.y - 50 : e.y - unitHeight(e.type)) - 6;
    for (let i = 0; i < 3; i++) {
      const a = e.anim * 6 + (i * Math.PI * 2) / 3;
      star5(ctx, e.x + Math.cos(a) * 10, top + Math.sin(a) * 3, 3.2);
    }
  }
}

function drawHero(ctx, h, selected, t) {
  if (selected) {
    ctx.strokeStyle = `rgba(255,220,120,${0.7 + 0.3 * Math.sin(t * 6)})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(h.x, h.y, 19, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Vầng sáng nhẹ để dễ nhận ra anh hùng
  glow(ctx, h.x, h.y - 2, 22, '255,220,140', 0.25);
  drawUnit(ctx, 'hero', h);
}

function drawDeath(ctx, fx) {
  // Nhân vật ngã xuống và mờ dần.
  const k = fx.life / fx.maxLife;
  const c = unitSprite(fx.type, { anim: 0, attackAnim: 0, moving: false, blocker: null, def: {} });
  ctx.save();
  ctx.translate(fx.x, fx.y);
  ctx.rotate((1 - k) * 1.3 * (fx.facing || 1));
  sprites.draw(ctx, c, 0, 0, (fx.facing || 1) < 0, k * 0.9);
  ctx.restore();
}

function drawProjectile(ctx, p) {
  if (p.kind === 'arrow') {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    line(ctx, [[-12, 0], [6, 0]], '#5a3a1e', 2);
    ctx.fillStyle = '#e8edf0';
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(4, -3);
    ctx.lineTo(4, 3);
    ctx.fill();
    ctx.fillStyle = '#f2f2f2';
    ctx.beginPath();
    ctx.moveTo(-13, -3.5);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-13, 3.5);
    ctx.fill();
    ctx.restore();
  } else if (p.kind === 'bolt') {
    p.trail.forEach((q, i) => glow(ctx, q.x, q.y, 3 + i, '190,130,255', (i + 1) / (p.trail.length + 2)));
    glow(ctx, p.x, p.y, 14, '200,150,255', 0.9);
    blob(ctx, p.x, p.y, 4.5, 4.5, '#f4eaff', { outline: null, noShade: true });
  } else if (p.kind === 'shell') {
    groundShadow(ctx, p.x, p.y, 6, 2.5, 0.3);
    blob(ctx, p.x, p.y - p.height, 5.5, 5.5, '#2c3036', { lw: 1.2, light: 0.5 });
    glow(ctx, p.x + 3, p.y - p.height - 5, 4, '255,180,80', 0.9);
  } else if (p.kind === 'meteor') {
    const k = Math.min(1, p.t / p.flightTime);
    groundShadow(ctx, p.tx, p.ty, 8 + k * 16, (8 + k * 16) * 0.4, 0.35);
    const ang = Math.atan2(p.ty - p.sy, p.tx - p.sx);
    for (let i = 6; i >= 1; i--) {
      glow(ctx, p.x - Math.cos(ang) * i * 10, p.y - Math.sin(ang) * i * 10, 14 - i, `255,${110 + i * 18},40`, 0.5 - i * 0.06);
    }
    glow(ctx, p.x, p.y, 24, '255,150,50', 0.7);
    blob(ctx, p.x, p.y, 10, 10, '#5a3020', { lw: 1.8 });
    blob(ctx, p.x - 2, p.y - 2, 5, 4.5, '#ff8a2a', { outline: null, noShade: true });
  }
}

function drawScorch(ctx, fx) {
  const k = Math.min(1, fx.life / 1.5);
  const g = ctx.createRadialGradient(fx.x, fx.y, 0, fx.x, fx.y, fx.r);
  g.addColorStop(0, `rgba(30,18,10,${0.5 * k})`);
  g.addColorStop(1, 'rgba(30,18,10,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(fx.x, fx.y, fx.r, fx.r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
}

function healthBar(ctx, x, y, w, ratio, color = '#6ee05a') {
  rrect(ctx, x - w / 2 - 1.5, y - 1.5, w + 3, 7, 3, '#1b120c', { outline: null, noShade: true });
  ctx.fillStyle = '#8a1f1a';
  ctx.fillRect(x - w / 2, y, w, 4);
  ctx.fillStyle = color;
  ctx.fillRect(x - w / 2, y, w * Math.max(0, ratio), 4);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(x - w / 2, y, w * Math.max(0, ratio), 1.4);
}

function outlineText(ctx, text, x, y, color) {
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  ctx.lineJoin = 'round';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function coin(ctx, x, y, r) {
  blob(ctx, x, y, r, r, '#f2c033', { lw: 1.1, light: 0.5 });
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillRect(x - r * 0.35, y - r * 0.5, r * 0.3, r * 0.8);
}

function star5(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = '#ffe14d';
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1;
  ctx.stroke();
}

// Biểu tượng nút nâng cấp / bán / tập kết / tối đa.
function drawButtonIcon(ctx, b) {
  const { x } = b;
  const y = b.y - 3;
  if (b.action === 'none') {
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    outlineText(ctx, 'MAX', x, y + 3, '#ffd34d');
  } else if (b.action === 'upgrade') {
    shape(ctx, (g) => {
      g.moveTo(x, y - 13);
      g.lineTo(x + 11, y);
      g.lineTo(x + 5, y);
      g.lineTo(x + 5, y + 10);
      g.lineTo(x - 5, y + 10);
      g.lineTo(x - 5, y);
      g.lineTo(x - 11, y);
      g.closePath();
    }, '#8cf07a', { x: x - 11, y: y - 13, w: 22, h: 23 }, { lw: 1.8 });
  } else if (b.action === 'sell') {
    coin(ctx, x, y, 11);
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#7a5a10';
    ctx.fillText('$', x, y + 1);
  } else if (b.action === 'rally') {
    line(ctx, [[x - 6, y + 12], [x - 6, y - 12]], '#e8d9b8', 2.4);
    shape(ctx, (g) => {
      g.moveTo(x - 6, y - 12);
      g.lineTo(x + 11, y - 6);
      g.lineTo(x - 6, y);
      g.closePath();
    }, '#5ccf6a', { x: x - 6, y: y - 12, w: 17, h: 12 }, { lw: 1.4 });
  }
}
