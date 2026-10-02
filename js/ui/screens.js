// Các màn hình ngoài trận: menu, chọn màn, cửa sổ tạm dừng / kết quả / hướng dẫn.
import { LEVELS } from '../data/levels.js';
import { createPath } from '../game/path.js';
import { bakeTerrain } from '../render/terrain.js';
import { save } from '../core/save.js';

const $ = (id) => document.getElementById(id);

export function showScreen(name) {
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('active', s.id === `screen-${name}`);
}

export function isUnlocked(index) {
  return index === 0 || save.getStars(LEVELS[index - 1].id) > 0;
}

const previews = new Map();
function levelPreview(level) {
  if (!previews.has(level.id)) {
    const paths = level.paths.map(createPath);
    const spots = level.spots.map((s) => ({ ...s }));
    previews.set(level.id, bakeTerrain(level, paths, spots, 0.6));
  }
  return previews.get(level.id);
}

export function renderLevelList(onPick) {
  const list = $('level-list');
  list.innerHTML = '';
  let total = 0;
  LEVELS.forEach((level, i) => {
    const stars = save.getStars(level.id);
    total += stars;
    const unlocked = isUnlocked(i);
    const card = document.createElement('button');
    card.className = 'level-card';
    card.disabled = !unlocked;
    const canvas = document.createElement('canvas');
    canvas.width = 432;
    canvas.height = 243;
    const img = levelPreview(level);
    // Cắt khung 16:9 ở giữa bản đồ vuông.
    const sh = (img.width * 9) / 16;
    canvas.getContext('2d').drawImage(img, 0, (img.height - sh) / 2, img.width, sh, 0, 0, 432, 243);
    card.appendChild(canvas);
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.innerHTML = `<h3>${i + 1}. ${level.name}${unlocked ? '' : ' 🔒'}</h3>
      <p>${level.subtitle}</p>
      <div class="stars">${'⭐'.repeat(stars)}<span style="opacity:.3">${'⭐'.repeat(3 - stars)}</span></div>`;
    card.appendChild(meta);
    card.addEventListener('click', () => onPick(i));
    list.appendChild(card);
  });
  $('total-stars').textContent = `⭐ ${total}/${LEVELS.length * 3}`;
}

// Hiện cửa sổ phủ với nội dung HTML và danh sách nút [{ label, primary, onClick }].
export function showOverlay(html, buttons = []) {
  const overlay = $('overlay');
  const panel = $('panel');
  panel.innerHTML = html;
  const row = document.createElement('div');
  row.className = 'buttons';
  for (const b of buttons) {
    const btn = document.createElement('button');
    btn.className = `btn${b.primary ? ' primary' : ''}`;
    btn.textContent = b.label;
    btn.addEventListener('click', b.onClick);
    row.appendChild(btn);
  }
  panel.appendChild(row);
  overlay.hidden = false;
}

export function hideOverlay() {
  $('overlay').hidden = true;
}

export const HELP_HTML = `<h2>Hướng dẫn</h2>
<ul class="help">
  <li><b>Xây tháp:</b> chạm vào ô đất trống → chọn loại tháp. Chạm 1 lần để xem thông tin, chạm lần nữa để xây.</li>
  <li><b>4 loại tháp:</b> 🏹 Cung (bắn nhanh, bắn được quái bay) • 🛡️ Doanh trại (lính chặn đường) • 🔮 Pháp sư (xuyên giáp) • 💣 Pháo đài (nổ lan).</li>
  <li><b>Nâng cấp / bán:</b> chạm vào tháp. Doanh trại có thêm nút 🚩 đặt điểm tập kết.</li>
  <li><b>Anh hùng:</b> chạm vào hiệp sĩ (hoặc nút ⚔️) rồi chạm nơi muốn tới. Hiệp sĩ tự hồi máu và hồi sinh.</li>
  <li><b>Phép:</b> ☄️ Mưa thiên thạch và 🛡️ Dân quân — chọn phép rồi chạm lên bản đồ.</li>
  <li><b>Gọi wave sớm</b> (chạm đầu lâu ở lối vào) để nhận thêm vàng và giảm hồi chiêu phép.</li>
  <li><b>Giáp</b> giảm sát thương vật lý, <b>kháng phép</b> giảm sát thương phép — chọn tháp phù hợp!</li>
  <li>Giữ ≥18 mạng để được 3 ⭐. Thắng màn trước để mở màn sau.</li>
</ul>`;

// Nền menu chính: bản đồ đầu tiên vẽ phóng to, phủ lớp tối ấm để làm nổi tiêu đề.
export function drawMenuBackground() {
  const c = document.getElementById('menu-bg');
  if (!c || !c.offsetWidth) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  c.width = Math.round(c.offsetWidth * dpr);
  c.height = Math.round(c.offsetHeight * dpr);
  const g = c.getContext('2d');
  const img = levelPreview(LEVELS[0]);
  const cover = Math.max(c.width, c.height) * 1.05;
  g.drawImage(img, (c.width - cover) / 2, (c.height - cover) / 2, cover, cover);
  const grad = g.createRadialGradient(c.width / 2, c.height * 0.42, 0, c.width / 2, c.height * 0.42, Math.max(c.width, c.height) * 0.7);
  grad.addColorStop(0, 'rgba(30,18,8,0.35)');
  grad.addColorStop(1, 'rgba(20,10,4,0.85)');
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);
}
