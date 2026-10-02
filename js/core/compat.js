// Bổ sung API còn thiếu trên trình duyệt cũ. Import file này TRƯỚC mọi module vẽ.

// ctx.roundRect chỉ có từ Safari/iOS 16, Chrome 99. Game chỉ dùng bán kính là 1 số.
function roundRectPolyfill(x, y, w, h, r = 0) {
  const rr = Math.max(0, Math.min(Number(r) || 0, Math.abs(w) / 2, Math.abs(h) / 2));
  this.moveTo(x + rr, y);
  this.lineTo(x + w - rr, y);
  this.arcTo(x + w, y, x + w, y + rr, rr);
  this.lineTo(x + w, y + h - rr);
  this.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  this.lineTo(x + rr, y + h);
  this.arcTo(x, y + h, x, y + h - rr, rr);
  this.lineTo(x, y + rr);
  this.arcTo(x, y, x + rr, y, rr);
  this.closePath();
}

if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = roundRectPolyfill;
}
