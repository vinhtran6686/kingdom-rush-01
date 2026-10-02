# Pháo Đài Bình Minh

Game thủ thành (tower defense) chạy trên trình duyệt, viết bằng HTML + JavaScript thuần + Canvas.
Không cần build, chơi được trên điện thoại (cảm ứng, màn dọc hoặc ngang) và máy tính.

**Chơi ngay:** https://vinhtran6686.github.io/kingdom-rush-01/

## Tính năng

- **3 chiến trường**: Thung Lũng Sương, Ngã Ba Thu Phong (2 đường), Đèo Băng Giá (2 đường + trùm cuối).
- **4 loại tháp × 3 cấp**: 🏹 Cung thủ • 🛡️ Doanh trại (3 lính chặn đường, đặt được điểm tập kết) • 🔮 Pháp sư (xuyên giáp) • 💣 Pháo đài (nổ lan).
- **Anh hùng** Hiệp Sĩ Bình Minh: điều khiển bằng cách chạm, tự hồi máu, có kỹ năng Chém Xoáy, hồi sinh khi ngã.
- **2 phép**: ☄️ Mưa Thiên Thạch và 🛡️ Dân Quân.
- **7 loại quái**: yêu tinh, thảo khấu (giáp), sói (nhanh), pháp sư bộ lạc (kháng phép, hồi máu), dơi (bay), quỷ núi (giáp dày, tự hồi), Cự Thạch Vương (trùm).
- Xem trước wave, **gọi wave sớm** để nhận thêm vàng, tốc độ 1x/2x/3x, chấm 1–3 ⭐, lưu tiến độ trên máy.
- Toàn bộ hình ảnh vẽ bằng code, âm thanh tổng hợp bằng Web Audio — không dùng asset của bất kỳ game nào khác.

## Cách chơi

1. Chạm vào **ô đất** trống → chọn tháp (chạm 1 lần xem thông tin, chạm lần nữa để xây).
2. Chạm vào **đầu lâu** ở lối vào (hoặc nút "Bắt đầu!") để gọi wave.
3. Chạm vào tháp để **nâng cấp / bán**; doanh trại có nút 🚩 đặt điểm tập kết.
4. Chạm vào **hiệp sĩ** (hoặc nút ⚔️) rồi chạm nơi muốn tới.
5. Chọn **phép** ở thanh dưới rồi chạm lên bản đồ.

Phím tắt trên máy tính: `Space` gọi wave, `1`/`2` phép, `H` anh hùng, `Esc` tạm dừng.

## Chạy ở máy

Game dùng ES modules nên cần một web server tĩnh:

```bash
python3 -m http.server 8000
# mở http://localhost:8000
```

Công cụ cho người phát triển (cần Node.js 18+):

```bash
node tools/check-levels.js   # kiểm tra dữ liệu màn chơi
node tools/simulate.js 6     # bot tự chơi để kiểm tra cân bằng
```

## Deploy

GitHub Pages: **Settings → Pages → Deploy from a branch → `main` / `(root)`**. Không có bước build.

## Phát triển

Xem [CLAUDE.md](CLAUDE.md) để biết kiến trúc, quy ước code và hướng phát triển. Số liệu cân bằng nằm trong `js/data/`.
