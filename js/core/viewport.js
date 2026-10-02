// Giữ canvas sắc nét theo devicePixelRatio và scale "thế giới" cố định
// (WORLD.width x WORLD.height) vào giữa khung, giữ nguyên tỉ lệ (letterbox).
import { WORLD } from './utils.js';

export class Viewport {
  constructor(canvas) {
    this.canvas = canvas;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.dpr = 1;

    this.resize = this.resize.bind(this);
    new ResizeObserver(this.resize).observe(canvas);
    window.addEventListener('resize', this.resize);
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.canvas.width = Math.max(1, Math.round(rect.width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(rect.height * this.dpr));
    this.scale = Math.min(rect.width / WORLD.width, rect.height / WORLD.height);
    this.offsetX = (rect.width - WORLD.width * this.scale) / 2;
    this.offsetY = (rect.height - WORLD.height * this.scale) / 2;
  }

  applyTransform(ctx) {
    const s = this.scale * this.dpr;
    ctx.setTransform(s, 0, 0, s, this.offsetX * this.dpr, this.offsetY * this.dpr);
  }

  screenToWorld(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - this.offsetX) / this.scale,
      y: (clientY - rect.top - this.offsetY) / this.scale,
    };
  }
}
