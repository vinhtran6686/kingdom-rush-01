# CLAUDE.md

Hướng dẫn cho Claude (và người đóng góp) khi làm việc trên repo này.

## Tổng quan

**Pháo Đài Bình Minh** — game thủ thành (tower defense) theo phong cách các game TD cổ điển, viết bằng
**HTML + JavaScript thuần + Canvas 2D**, chạy thẳng trên **GitHub Pages**, chơi tốt trên **điện thoại**.

Tính năng: 3 màn (đồng cỏ / mùa thu / tuyết, có màn 2 đường), 4 loại tháp × 3 cấp (cung, doanh trại,
pháp sư, pháo đài), lính chặn đường, anh hùng điều khiển được, 2 phép (thiên thạch, dân quân),
7 loại quái (giáp/kháng phép/bay/hồi máu/trùm), gọi wave sớm, chấm sao, lưu tiến độ, âm thanh tổng hợp.

Ràng buộc bắt buộc:

- **Không build step**: không bundler, không TypeScript, không dependency khi chạy. Trình duyệt tải trực tiếp ES modules.
  (`package.json` chỉ để Node chạy các tool trong `tools/` dưới dạng ES module.)
- **Chỉ dùng nội dung gốc**: hình vẽ thủ tục bằng Canvas, âm thanh tổng hợp bằng Web Audio, tên/nhân vật tự đặt.
  **Không** sao chép hình ảnh, âm thanh, code hay tên nhân vật từ game thương mại hoặc các repo fan dùng asset
  của game gốc (ví dụ các bản port Kingdom Rush). Asset bên ngoài chỉ được thêm nếu có giấy phép tự do và ghi nguồn.
- Mobile trước: mọi tương tác qua Pointer Events, vùng chạm ≥ ~44px CSS, hỗ trợ cả màn dọc và ngang.

## Cấu trúc project

```
index.html            # Các màn hình (menu, chọn màn, trận) + overlay
css/style.css         # Giao diện; màn ngang thấp → HUD/action bar thành 2 cột hai bên
js/
  main.js             # Điều hướng màn hình, vòng lặp rAF, tốc độ, pause, xử lý events (âm thanh, kết thúc)
  core/
    utils.js          # WORLD (720x720), toán học, random có seed, moveToward
    viewport.js       # Scale thế giới vào canvas (letterbox, devicePixelRatio)
    input.js          # Pointer Events → tap ở toạ độ thế giới
    audio.js          # SFX tổng hợp bằng Web Audio (unlock sau lần chạm đầu)
    save.js           # localStorage: sao từng màn, tắt/bật âm
  data/               # TẤT CẢ số liệu cân bằng — chỉnh ở đây, không hard-code trong logic
    towers.js         # 4 tháp × 3 cấp, SELL_RATIO
    enemies.js        # 7 loại quái
    hero.js           # Anh hùng + 2 phép
    levels.js         # Màn chơi: waypoint, ô xây, vị trí anh hùng, danh sách wave
  game/               # Logic thuần — KHÔNG đụng DOM/canvas (chạy được trong Node)
    game.js           # Class Game: trạng thái màn, wave, kinh tế, chọn/menu, handleTap
    path.js           # Làm mượt Catmull-Rom, pointAt(distance, lateral)
    enemy.js          # Di chuyển theo path, bị chặn, giáp/kháng phép, hồi máu
    soldier.js        # Lính cận chiến (doanh trại, dân quân), lớp cha của Hero
    hero.js           # Anh hùng: di chuyển theo lệnh, kỹ năng, hồi sinh
    tower.js          # Tháp bắn + doanh trại (sinh/hồi sinh lính, điểm tập kết)
    projectiles.js    # Homing (tên, tia phép) và Lobbed (đạn pháo, thiên thạch)
  render/             # Chỉ ĐỌC trạng thái game
    renderer.js       # Vẽ một frame: nền, sắp xếp theo y, thanh máu, hiệu ứng, menu vòng tròn
    sprites.js        # Hình vẽ tháp, quái, lính, anh hùng, đạn
    terrain.js        # Bake nền bản đồ (theme, đường, cây, đá, cổng thành) vào canvas phụ
  ui/
    hud.js            # HUD DOM trong trận + bảng thông tin
    screens.js        # Menu, chọn màn (ảnh xem trước), overlay, hướng dẫn
tools/
  check-levels.js     # Kiểm tra dữ liệu màn (ô xây đè đường, path không tồn tại...)
  simulate.js         # Bot chơi tự động từng màn để kiểm tra lỗi & cân bằng
```

### Luồng dữ liệu

```
input.js ──tap(x,y thế giới)──▶ Game.handleTap        hud.js ──click──▶ Game.callWave/beginSpell/selectHero
main.js  ──dt × speed──▶ Game.update ──▶ game.events ──▶ main.js (âm thanh, banner, kết quả)
main.js  ──▶ Renderer.render(game)  +  GameUI.update()   (chỉ đọc)
```

- **Hệ toạ độ thế giới** cố định 720x720. Logic chỉ dùng toạ độ này; `Viewport` lo chuyển đổi.
- **Wave**: `STATUS.READY` → người chơi gọi wave đầu → `RUNNING`. Sau khi wave sinh xong quái, đếm ngược
  `WAVE_GAP` giây tới wave sau; gọi sớm được thưởng vàng và giảm hồi chiêu phép. Thắng khi hết wave và hết quái.
- **Chặn đường**: lính/anh hùng nhận mục tiêu thì đặt `enemy.blocker = this`; quái dừng lại đánh nhau.
  Quái bay (`flying`) không bị chặn và chỉ tháp có `hitsFlying` bắn được.
- **Sát thương**: `physical` bị `armor` giảm, `magic` bị `magicResist` giảm, `true` không bị giảm.
- **Menu vòng tròn**: `Game.getMenuButtons()` là nguồn duy nhất cho cả vị trí vẽ lẫn vùng chạm.
  Chạm 1 lần = xem trước (`game.pending`), chạm lần 2 = xác nhận.
- `window.game` được expose để debug trong DevTools (vd. `game.gold = 9999`).

## Quy ước code

- ES modules, `import` có đuôi `.js` và đường dẫn tương đối.
- Tên biến/hàm/class bằng **tiếng Anh**; comment và chữ hiển thị bằng **tiếng Việt**.
- `camelCase` biến/hàm, `PascalCase` class, `UPPER_SNAKE_CASE` hằng số module. 2 dấu cách, dấu chấm phẩy, nháy đơn.
- **Tách logic khỏi hiển thị**: `game/` không truy cập DOM/`ctx`; `render/` và `ui/` không thay đổi trạng thái game
  (ui chỉ gọi các phương thức công khai của `Game`).
- Thời gian tính bằng **giây**, tốc độ bằng **đơn vị thế giới / giây**.
- Thêm tháp/quái/màn: khai báo trong `js/data/` trước, rồi thêm hành vi (`game/`) và hình vẽ (`render/sprites.js`).
- Giữ code đơn giản, dễ đọc cho người học; tránh abstraction sớm.

## Chạy & kiểm tra

```bash
python3 -m http.server 8000      # mở http://localhost:8000 (ES modules không chạy qua file://)
node tools/check-levels.js       # kiểm tra dữ liệu màn
node tools/simulate.js 6         # bot chơi mỗi màn 6 lần: tỉ lệ thắng, mạng còn lại, wave thua
```

Sau khi sửa logic/cân bằng: chạy cả hai tool. Mục tiêu cân bằng hiện tại (bot): màn 1 thắng dễ,
màn 2 thắng phần lớn, màn 3 (trùm) khó — bot thắng ~25–40%, người chơi biết dùng anh hùng/phép sẽ thắng.

Kiểm tra thủ công: không lỗi Console; xây/nâng cấp/bán/đặt điểm tập kết; anh hùng di chuyển; 2 phép;
gọi wave sớm; thắng/thua hiện overlay; thử giả lập điện thoại cả dọc và ngang.

## Quy trình

Làm trên nhánh được giao → mở PR vào `main` → merge. GitHub Pages deploy từ `main` (thư mục root).

## Hướng phát triển

- [ ] Nhánh nâng cấp cấp 4 cho mỗi tháp (2 lựa chọn chuyên biệt).
- [ ] Thêm anh hùng (chọn trước trận), anh hùng lên cấp theo kinh nghiệm.
- [ ] Quái có kỹ năng: đào hầm, phá tháp, đánh xa; quái chia đôi khi chết.
- [ ] Chế độ thử thách (Heroic / Iron) cho mỗi màn, bảng xếp hạng thời gian.
- [ ] Bách khoa quái/tháp (encyclopedia) mở khoá khi gặp lần đầu.
- [ ] Nhạc nền tổng hợp; rung màn hình khi nổ lớn.
- [ ] PWA (manifest + service worker) để cài lên màn hình chính và chơi offline.
- [ ] Test tự động cho `game/` bằng `node --test`.
