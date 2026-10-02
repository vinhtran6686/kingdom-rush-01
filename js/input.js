// Gom chuột và cảm ứng về một sự kiện "tap" duy nhất bằng Pointer Events.
// Chỉ coi là tap nếu ngón tay không bị kéo đi quá xa.
const MAX_TAP_MOVE = 14; // px màn hình

export function setupInput(canvas, viewport, onTap) {
  let start = null;

  canvas.addEventListener('pointerdown', (e) => {
    if (!e.isPrimary) return;
    start = { x: e.clientX, y: e.clientY, id: e.pointerId };
  });

  canvas.addEventListener('pointerup', (e) => {
    if (!start || e.pointerId !== start.id) return;
    const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y);
    start = null;
    if (moved > MAX_TAP_MOVE) return;
    const p = viewport.screenToWorld(e.clientX, e.clientY);
    onTap(p.x, p.y);
  });

  canvas.addEventListener('pointercancel', () => {
    start = null;
  });

  // Chặn menu chuột phải / nhấn giữ trên mobile.
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}
