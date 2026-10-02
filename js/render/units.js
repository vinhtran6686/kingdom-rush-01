// Chọn khung hình (đi / đánh / đứng / xoáy) cho nhân vật và vẽ từ bộ nhớ đệm sprite.
import { UNIT_ART, WALK_FRAMES, ATK_FRAMES } from './characters.js';
import { sprites, groundShadow } from './art.js';

const ATTACK_TIME = 0.25; // khớp với attackAnim trong logic
const IDLE_FRAMES = 8;

function frameOf(value, frames) {
  return Math.floor((((value % 1) + 1) % 1) * frames) % frames;
}

// Trả về sprite (canvas) cho trạng thái hiện tại của thực thể.
export function unitSprite(kind, ent) {
  const art = UNIT_ART[kind];
  const anim = ent.anim || 0;
  let key;
  let pose;

  if (kind === 'bat') {
    const f = frameOf(anim * 3.2, IDLE_FRAMES);
    key = `bat:${f}`;
    pose = { walk: 0, atk: -1, cyc: f / IDLE_FRAMES, moving: true, spin: -1 };
  } else if (kind === 'hero' && ent.skillAnim > 0) {
    const f = frameOf(1 - ent.skillAnim / 0.4, 6);
    key = `hero:s${f}`;
    pose = { walk: 0, atk: -1, cyc: 0, moving: false, spin: (f + 0.5) / 6 };
  } else if (ent.attackAnim > 0) {
    const f = Math.min(ATK_FRAMES - 1, Math.floor((1 - ent.attackAnim / ATTACK_TIME) * ATK_FRAMES));
    key = `${kind}:a${f}`;
    pose = { walk: 0, atk: (f + 0.5) / ATK_FRAMES, cyc: 0, moving: false, spin: -1 };
  } else if (isMoving(kind, ent)) {
    const speed = ent.def?.speed || ent.speed || 60;
    const f = frameOf(anim * (speed / 34), WALK_FRAMES);
    key = `${kind}:w${f}`;
    pose = { walk: f / WALK_FRAMES, atk: -1, cyc: f / WALK_FRAMES, moving: true, spin: -1 };
  } else {
    const f = frameOf(anim * 0.6, IDLE_FRAMES);
    key = `${kind}:i${f}`;
    pose = { walk: 0, atk: -1, cyc: f / IDLE_FRAMES, moving: false, spin: -1 };
  }
  return sprites.get(key, art.spec, (g) => art.draw(g, pose));
}

function isMoving(kind, ent) {
  if (ent.moving !== undefined) return ent.moving; // lính / anh hùng
  return !ent.blocker && !(ent.stun > 0); // quái
}

// Vẽ nhân vật tại vị trí của nó, có bóng, lật theo hướng và nháy trắng khi trúng đòn.
export function drawUnit(ctx, kind, ent, y = ent.y) {
  const c = unitSprite(kind, ent);
  const shadowR = Math.max(8, c.spec.w * 0.2);
  if (kind === 'bat') groundShadow(ctx, ent.x, ent.y, 9, 3.5, 0.22);
  else groundShadow(ctx, ent.x, ent.y, shadowR, shadowR * 0.38);
  const flip = ent.facing < 0;
  sprites.draw(ctx, c, ent.x, y, flip);
  if (ent.hitFlash > 0) {
    ctx.globalCompositeOperation = 'lighter';
    sprites.draw(ctx, c, ent.x, y, flip, 0.55);
    ctx.globalCompositeOperation = 'source-over';
  }
}

// Chiều cao hiển thị (để đặt thanh máu phía trên đầu).
export function unitHeight(kind) {
  const s = UNIT_ART[kind].spec;
  return s.ay - 4;
}
