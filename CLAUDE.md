# CLAUDE.md

Hướng dẫn cho Claude (và người đóng góp) khi làm việc trên repo này.

## Tổng quan

Game tower defense lấy cảm hứng từ Kingdom Rush, viết bằng **HTML + JavaScript thuần + Canvas 2D**.
Mục tiêu: dự án học tập, chạy thẳng trên **GitHub Pages**, chơi tốt trên **điện thoại** (cảm ứng, dọc/ngang).

Ràng buộc bắt buộc:

- **Không build step**: không bundler, không TypeScript, không npm dependency khi chạy. Trình duyệt tải trực tiếp file `.js` qua ES modules (`<script type="module">`).
- **Không dùng asset của game gốc**: mọi hình ảnh vẽ bằng hình khối Canvas (hoặc asset tự làm / giấy phép tự do, ghi rõ nguồn).
- Phải chạy được trên mobile: mọi tương tác qua Pointer Events, vùng chạm đủ lớn (≥ ~44px CSS).

## Cấu trúc project

```
index.html          # Khung trang: HUD (DOM), canvas, overlay thắng/thua
css/style.css       # Layout responsive; màn ngang thấp → HUD thành cột trái
js/
  main.js           # Khởi động, vòng lặp requestAnimationFrame, tốc độ x1/x2, pause
  config.js         # TẤT CẢ số liệu cân bằng: tháp, quái, wave, vàng/mạng ban đầu
  map.js            # Waypoint đường đi, ô xây tháp, đồ trang trí; createPath() với pointAt(d)
  game.js           # Trạng thái + luật chơi (Game, STATUS). Không đụng DOM/canvas
  render.js         # Vẽ mọi thứ từ trạng thái game (chỉ đọc)
  ui.js             # HUD DOM: đồng bộ số liệu, nút wave/tốc độ/pause/chơi lại
  viewport.js       # Scale thế giới 720x720 vào canvas (letterbox, devicePixelRatio)
  input.js          # Pointer Events → tap ở toạ độ thế giới
  utils.js          # Hàm toán học nhỏ, random có seed
  entities/
    enemy.js        # Quái: di chuyển theo quãng đường trên path, máu, nhận sát thương
    tower.js        # Tháp: tìm mục tiêu, hồi chiêu, tạo Projectile
    projectile.js   # Mũi tên đuổi theo mục tiêu
```

### Luồng dữ liệu

```
input.js ──tap(x,y thế giới)──▶ Game.handleTap
main.js  ──dt──▶ Game.update ──▶ enemies / towers / projectiles / effects
main.js  ──▶ render(ctx, viewport, game)   (chỉ đọc)
main.js  ──▶ hud.update()                  (chỉ đọc, ghi DOM khi giá trị đổi)
```

- **Hệ toạ độ thế giới** cố định `WORLD.width x WORLD.height` (720x720, hình vuông để vừa cả màn dọc lẫn ngang). Logic game chỉ dùng toạ độ này; `Viewport` lo chuyển đổi sang pixel màn hình.
- **Trạng thái game** (`STATUS`): `idle` (chờ bấm bắt đầu wave) → `playing` → `idle` … → `won` / `lost`.
- **Quái** di chuyển bằng `distance` (quãng đường đã đi) và `path.pointAt(distance)` — không dùng vận tốc 2D. Tháp ưu tiên quái có `distance` lớn nhất trong tầm.
- **Menu xây tháp** vẽ trên canvas; `Game.getMenuButtons()` là nguồn duy nhất cho cả vị trí vẽ lẫn vùng chạm.
- `window.game` được expose để debug trong DevTools (vd. `game.gold = 999`).

## Quy ước code

- ES modules, `import`/`export` có đuôi `.js` và đường dẫn tương đối (bắt buộc khi không có bundler).
- Tên biến/hàm/class bằng **tiếng Anh**; comment và chữ hiển thị trong game bằng **tiếng Việt**.
- `camelCase` cho biến/hàm, `PascalCase` cho class, `UPPER_SNAKE_CASE` cho hằng số cấp module.
- 2 dấu cách thụt lề, dấu chấm phẩy, nháy đơn cho chuỗi.
- **Tách logic khỏi hiển thị**: `game.js` và `entities/` không được truy cập DOM hay `ctx`. `render.js`/`ui.js` không được thay đổi trạng thái game.
- **Số liệu cân bằng để trong `config.js`**, không hard-code trong logic.
- Thời gian tính bằng **giây**, tốc độ bằng **đơn vị thế giới / giây**; mọi `update(dt)` nhận `dt` theo giây.
- Thêm loại tháp/quái mới: khai báo trong `config.js` trước, rồi mới thêm hành vi/vẽ.
- Giữ code đơn giản, dễ đọc cho người học; tránh abstraction sớm.

## Chạy & kiểm tra

ES modules không chạy qua `file://`, cần một static server:

```bash
python3 -m http.server 8000
# mở http://localhost:8000
```

Không có test tự động. Khi sửa, kiểm tra thủ công:

1. Không có lỗi trong Console.
2. Chạm ô đất → hiện nút xây → xây được tháp, trừ vàng; chạm tháp → bán được.
3. Chơi hết 3 wave: thắng hiện overlay "Chiến thắng", hết mạng hiện "Thất thủ", "Chơi lại" hoạt động.
4. Thử ở chế độ giả lập điện thoại (DevTools) cả màn dọc và ngang.

Mẹo cân bằng: có thể mô phỏng nhanh trong Console bằng cách gọi `game.update(1/60)` trong vòng lặp.

## Hướng phát triển

Gợi ý theo thứ tự tăng dần độ khó:

- [ ] Nâng cấp tháp (cấp 2, 3) qua menu khi chạm vào tháp.
- [ ] Thêm loại tháp: pháo (sát thương diện rộng), phép (xuyên giáp), doanh trại (lính chặn đường).
- [ ] Giáp vật lý/phép cho quái; quái bay (bỏ qua lính chặn).
- [ ] Nút gọi wave sớm để nhận thêm vàng; hiển thị trước loại quái của wave tiếp theo.
- [ ] Kỹ năng anh hùng / phép (mưa thiên thạch, gọi viện binh) có thời gian hồi.
- [ ] Nhiều map, mỗi map có nhiều đường; dữ liệu map tách ra JSON.
- [ ] Âm thanh (Web Audio), hiệu ứng hạt, rung màn hình.
- [ ] Lưu tiến độ/sao bằng `localStorage`.
- [ ] PWA (manifest + service worker) để cài lên màn hình chính và chơi offline.
- [ ] Test tự động cho logic thuần (`game.js`, `entities/`) — logic đã tách khỏi DOM nên có thể chạy bằng `node --test` mà không cần build.
