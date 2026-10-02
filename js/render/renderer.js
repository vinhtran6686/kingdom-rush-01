// Vẽ một frame của màn chơi từ trạng thái Game (chỉ đọc, không sửa trạng thái).
import { WORLD } from '../core/utils.js';
import { TOWERS } from '../data/towers.js';
import { HERO } from '../data/hero.js';
import { bakeTerrain } from './terrain.js';
import {
  drawTower,
  drawSpot,
  drawEnemy,
  drawSoldier,
  drawHero,
  drawProjectile,
  drawHealthBar,
  enemyTop,
} from './sprites.js';

export class Renderer {
  constructor(ctx, viewport) {
    this.ctx = ctx;
    this.viewport = viewport;
    this.terrain = null;
    this.terrainKey = '';
  }

  ensureTerrain(game) {
    const scale = Math.min(3, Math.max(1, this.viewport.scale * this.viewport.dpr));
    const key = `${game.level.id}:${scale.toFixed(2)}`;
    if (key === this.terrainKey) return;
    this.terrain = bakeTerrain(game.level, game.paths, game.spots, scale);
    this.terrainKey = key;
  }

  render(game) {
    const ctx = this.ctx;
    const t = game.time;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#14181c';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    this.ensureTerrain(game);
    // Lấp vùng viền (letterbox) bằng chính bản đồ phóng to và làm tối, thay vì để nền đen.
    const cw = ctx.canvas.width;
    const ch = ctx.canvas.height;
    const cover = Math.max(cw, ch) * 1.1;
    ctx.globalAlpha = 0.35;
    ctx.drawImage(this.terrain, (cw - cover) / 2, (ch - cover) / 2, cover, cover);
    ctx.globalAlpha = 1;
    this.viewport.applyTransform(ctx);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, WORLD.width, WORLD.height);
    ctx.clip();

    ctx.drawImage(this.terrain, 0, 0, WORLD.width, WORLD.height);

    // Vết cháy nằm dưới mọi thứ.
    for (const fx of game.effects) if (fx.kind === 'scorch') drawScorch(ctx, fx);

    const sel = game.selection;
    for (const spot of game.spots) {
      if (!spot.tower) drawSpot(ctx, spot, t, sel?.ref === spot);
    }

    this.drawRanges(ctx, game);
    this.drawWaveFlags(ctx, game);

    // Sắp xếp theo y để vật ở dưới che vật ở trên.
    const list = [];
    for (const tw of game.towers) {
      list.push({ y: tw.y, d: () => drawTower(ctx, tw, t) });
      if (tw.type === 'barracks') for (const s of tw.soldiers) if (s && !s.dead) list.push({ y: s.y, d: () => drawSoldier(ctx, s) });
    }
    for (const m of game.militia) list.push({ y: m.y, d: () => drawSoldier(ctx, m) });
    for (const e of game.enemies) if (!e.flying) list.push({ y: e.y, d: () => drawEnemy(ctx, e) });
    if (!game.hero.dead) list.push({ y: game.hero.y, d: () => drawHero(ctx, game.hero, t, game.mode === 'hero') });
    for (const fx of game.effects) if (fx.kind === 'death') list.push({ y: fx.y, d: () => drawDeath(ctx, fx) });
    list.sort((a, b) => a.y - b.y);
    for (const it of list) it.d();

    // Quái bay vẽ sau cùng (ở trên cao).
    for (const e of game.enemies) if (e.flying) drawEnemy(ctx, e);
    for (const p of game.projectiles) drawProjectile(ctx, p, t);

    this.drawBars(ctx, game);
    this.drawEffects(ctx, game);
    this.drawMenu(ctx, game);
    this.drawModeHint(ctx, game);

    ctx.restore();
  }

  drawRanges(ctx, game) {
    const preview = game.getPreview();
    const sel = game.selection;
    let circle = null;
    if (preview) {
      const r = TOWERS[preview.type].levels[preview.level].range;
      circle = { x: preview.x, y: preview.y, r, color: '120,200,255' };
    } else if (sel?.kind === 'tower') {
      circle = { x: sel.ref.x, y: sel.ref.y, r: sel.ref.range, color: '255,255,255' };
    }
    if (game.mode === 'rally') {
      const tw = sel?.ref;
      if (tw) circle = { x: tw.x, y: tw.y, r: tw.range, color: '120,220,140' };
    }
    if (!circle) return;
    ctx.fillStyle = `rgba(${circle.color},0.13)`;
    ctx.strokeStyle = `rgba(${circle.color},0.75)`;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.ellipse(circle.x, circle.y, circle.r, circle.r * 0.92, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
    if (sel?.kind === 'tower' && sel.ref.type === 'barracks') {
      const tw = sel.ref;
      ctx.fillStyle = 'rgba(120,220,140,0.9)';
      ctx.beginPath();
      ctx.arc(tw.rallyX, tw.rallyY, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawWaveFlags(ctx, game) {
    const flags = game.getWaveFlags();
    if (!flags.length) return;
    const t = game.time;
    const pulse = 1 + Math.sin(t * 6) * 0.08;
    const ratio = game.nextWaveTimer === null ? 1 : game.nextWaveTimer / 22;
    for (const f of flags) {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath();
      ctx.arc(0, 0, f.r, 0, Math.PI * 2);
      ctx.fill();
      // Vòng đếm ngược
      ctx.strokeStyle = '#ffcf4a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, f.r - 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
      ctx.stroke();
      // Đầu lâu cách điệu
      ctx.fillStyle = '#f2ece0';
      ctx.beginPath();
      ctx.arc(0, -3, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-6, 3, 12, 7);
      ctx.fillStyle = '#2a1f1a';
      ctx.beginPath();
      ctx.arc(-4, -3, 3, 0, Math.PI * 2);
      ctx.arc(4, -3, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-1, 2, 2, 3);
      ctx.restore();
    }
  }

  drawBars(ctx, game) {
    for (const e of game.enemies) {
      if (e.hp >= e.maxHp && game.selection?.ref !== e) continue;
      const w = e.def.boss ? 60 : Math.max(18, e.radius * 2);
      drawHealthBar(ctx, e.x, enemyTop(e), w, e.hp / e.maxHp);
    }
    const soldiers = [...game.militia];
    for (const tw of game.towers) if (tw.type === 'barracks') soldiers.push(...tw.soldiers.filter((s) => s && !s.dead));
    for (const s of soldiers) if (s.hp < s.maxHp) drawHealthBar(ctx, s.x, s.y - 30, 16, s.hp / s.maxHp);
    const h = game.hero;
    if (!h.dead) drawHealthBar(ctx, h.x, h.y - 42, 26, h.hp / h.maxHp);
    else {
      // Bia tạm thời ở nơi hồi sinh + thời gian.
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.arc(h.spawn.x, h.spawn.y - 10, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.ceil(h.respawnTimer), h.spawn.x, h.spawn.y - 10);
    }
  }

  drawEffects(ctx, game) {
    for (const fx of game.effects) {
      const k = fx.life / fx.maxLife; // 1 → 0
      if (fx.kind === 'text') {
        ctx.globalAlpha = Math.min(1, k * 2.5);
        ctx.font = 'bold 17px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#1f1a17';
        ctx.strokeText(fx.text, fx.x, fx.y);
        ctx.fillStyle = fx.color;
        ctx.fillText(fx.text, fx.x, fx.y);
      } else if (fx.kind === 'explosion') {
        const r = fx.r * (0.4 + (1 - k) * 0.8);
        ctx.globalAlpha = k;
        const grad = ctx.createRadialGradient(fx.x, fx.y, 0, fx.x, fx.y, r);
        grad.addColorStop(0, fx.big ? '#fff3b0' : '#fff0c0');
        grad.addColorStop(0.4, fx.big ? '#ff8a2a' : '#ffaa40');
        grad.addColorStop(1, 'rgba(120,40,10,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(fx.x, fx.y - 6, r, r * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(80,70,60,${k * 0.6})`;
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(fx.x + Math.cos(a) * r * 0.7, fx.y - 6 + Math.sin(a) * r * 0.5 - (1 - k) * 14, 6 * k + 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (fx.kind === 'poof') {
        ctx.globalAlpha = k;
        ctx.fillStyle = '#e6e6e6';
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          const rr = fx.r * (1 - k) * 1.2;
          ctx.beginPath();
          ctx.arc(fx.x + Math.cos(a) * rr, fx.y + Math.sin(a) * rr * 0.6 - 6, fx.r * 0.45 * k + 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (fx.kind === 'ring' || fx.kind === 'heal' || fx.kind === 'spark') {
        const color = fx.kind === 'heal' ? '120,255,160' : fx.color;
        ctx.globalAlpha = k;
        ctx.strokeStyle = `rgba(${color},1)`;
        ctx.lineWidth = fx.kind === 'spark' ? 3 : 2.5;
        ctx.beginPath();
        const r = fx.r * (fx.kind === 'spark' ? 1 - k * 0.5 : 0.3 + (1 - k) * 0.7);
        ctx.ellipse(fx.x, fx.y, r, r * (fx.kind === 'spark' ? 1 : 0.55), 0, 0, Math.PI * 2);
        ctx.stroke();
        if (fx.kind === 'heal') {
          ctx.fillStyle = `rgba(${color},1)`;
          ctx.font = 'bold 14px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText('+', fx.x, fx.y - 26 - (1 - k) * 10);
        }
      }
      ctx.globalAlpha = 1;
    }
  }

  drawMenu(ctx, game) {
    const buttons = game.getMenuButtons();
    if (!buttons.length) return;
    const sel = game.selection.ref;
    // Vòng nền nối các nút
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(sel.x, sel.y - 14, 66, 66, 0, 0, Math.PI * 2);
    ctx.stroke();

    for (const b of buttons) {
      const active = game.pending === b.id;
      ctx.globalAlpha = b.enabled || b.action === 'none' ? 1 : 0.6;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.arc(b.x + 1.5, b.y + 2.5, b.r, 0, Math.PI * 2);
      ctx.fill();
      const base = b.action === 'sell' ? '#7a2d22' : b.action === 'upgrade' || b.action === 'none' ? '#2b5c2e' : '#2b3e5c';
      const grad = ctx.createLinearGradient(b.x, b.y - b.r, b.x, b.y + b.r);
      grad.addColorStop(0, lighten(base));
      grad.addColorStop(1, base);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = active ? 4 : 2.5;
      ctx.strokeStyle = active ? '#ffe066' : '#e9d9a6';
      ctx.stroke();

      drawButtonIcon(ctx, b);

      if (b.cost !== undefined) {
        const label = b.action === 'sell' ? `+${b.cost}` : `${b.cost}`;
        ctx.font = 'bold 12px system-ui, sans-serif';
        const w = ctx.measureText(label).width + 10;
        ctx.fillStyle = '#1f1a17';
        ctx.beginPath();
        ctx.roundRect(b.x - w / 2, b.y + b.r - 8, w, 15, 7);
        ctx.fill();
        ctx.fillStyle = b.enabled ? '#ffd34d' : '#ff7b6b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, b.x, b.y + b.r - 0.5);
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
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width + 30;
    ctx.fillStyle = 'rgba(20,16,12,0.72)';
    ctx.beginPath();
    ctx.roundRect(WORLD.width / 2 - w / 2, WORLD.height - 50, w, 34, 17);
    ctx.fill();
    ctx.fillStyle = '#fff4d6';
    ctx.fillText(text, WORLD.width / 2, WORLD.height - 33);
  }
}

function lighten(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (n >> 16) + 50);
  const g = Math.min(255, ((n >> 8) & 255) + 50);
  const b = Math.min(255, (n & 255) + 50);
  return `rgb(${r},${g},${b})`;
}

// Biểu tượng nhỏ trên nút menu.
function drawButtonIcon(ctx, b) {
  const { x } = b;
  const y = b.y - 3;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (b.action === 'build') {
    const type = b.towerType;
    if (type === 'archer') {
      ctx.strokeStyle = '#f3e3c0';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x - 3, y, 10, -Math.PI / 2.3, Math.PI / 2.3);
      ctx.stroke();
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - 1, y - 9);
      ctx.lineTo(x - 1, y + 9);
      ctx.moveTo(x - 8, y);
      ctx.lineTo(x + 10, y);
      ctx.stroke();
    } else if (type === 'barracks') {
      ctx.fillStyle = '#f3e3c0';
      ctx.beginPath();
      ctx.moveTo(x - 8, y - 9);
      ctx.lineTo(x + 8, y - 9);
      ctx.lineTo(x + 8, y + 1);
      ctx.quadraticCurveTo(x + 6, y + 8, x, y + 11);
      ctx.quadraticCurveTo(x - 6, y + 8, x - 8, y + 1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#2b3e5c';
      ctx.fillRect(x - 1.5, y - 7, 3, 14);
      ctx.fillRect(x - 6, y - 2, 12, 3);
    } else if (type === 'mage') {
      ctx.fillStyle = '#d6b8ff';
      ctx.beginPath();
      ctx.moveTo(x, y - 12);
      ctx.lineTo(x + 7, y);
      ctx.lineTo(x, y + 12);
      ctx.lineTo(x - 7, y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(x - 2, y - 6);
      ctx.lineTo(x + 1, y - 2);
      ctx.lineTo(x - 3, y);
      ctx.fill();
    } else {
      ctx.fillStyle = '#f3e3c0';
      ctx.beginPath();
      ctx.arc(x, y + 2, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f3e3c0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 5, y - 4);
      ctx.quadraticCurveTo(x + 9, y - 10, x + 6, y - 13);
      ctx.stroke();
      ctx.fillStyle = '#ffb347';
      ctx.beginPath();
      ctx.arc(x + 6, y - 13, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (b.action === 'upgrade' || b.action === 'none') {
    ctx.fillStyle = b.action === 'none' ? '#ffd34d' : '#d9f7c8';
    if (b.action === 'none') {
      ctx.font = 'bold 12px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('MAX', x, y + 3);
    } else {
      ctx.beginPath();
      ctx.moveTo(x, y - 11);
      ctx.lineTo(x + 9, y);
      ctx.lineTo(x + 4, y);
      ctx.lineTo(x + 4, y + 9);
      ctx.lineTo(x - 4, y + 9);
      ctx.lineTo(x - 4, y);
      ctx.lineTo(x - 9, y);
      ctx.closePath();
      ctx.fill();
    }
  } else if (b.action === 'sell') {
    ctx.fillStyle = '#ffd34d';
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a5a10';
    ctx.font = 'bold 13px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', x, y + 1);
  } else if (b.action === 'rally') {
    ctx.strokeStyle = '#f3e3c0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 5, y + 10);
    ctx.lineTo(x - 5, y - 10);
    ctx.stroke();
    ctx.fillStyle = '#7fdc8a';
    ctx.beginPath();
    ctx.moveTo(x - 5, y - 10);
    ctx.lineTo(x + 9, y - 5);
    ctx.lineTo(x - 5, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawScorch(ctx, fx) {
  const k = Math.min(1, fx.life / 1.5);
  ctx.fillStyle = `rgba(40,25,15,${0.35 * k})`;
  ctx.beginPath();
  ctx.ellipse(fx.x, fx.y, fx.r, fx.r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawDeath(ctx, fx) {
  const k = fx.life / fx.maxLife;
  ctx.globalAlpha = k;
  ctx.fillStyle = '#6b5a4a';
  ctx.beginPath();
  ctx.ellipse(fx.x, fx.y, fx.r * (1.4 - k * 0.4), fx.r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // "Linh hồn" bay lên
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.arc(fx.x, fx.y - 14 - (1 - k) * 26, 4 * k + 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}
