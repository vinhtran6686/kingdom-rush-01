# kingdom-rush-01

Prototype game **tower defense** lấy cảm hứng từ Kingdom Rush, viết bằng HTML + JavaScript thuần + Canvas.
Không cần build, chơi được trên điện thoại (cảm ứng, màn dọc hoặc ngang).

## Cách chơi

- Chạm vào **ô đất** (có dấu +) → chạm nút xanh để **xây tháp cung** (70 vàng).
- Chạm vào tháp đã xây → nút đỏ để **bán** (hoàn 60%).
- Bấm **Bắt đầu wave** khi đã sẵn sàng. Có 3 wave; giết quái được vàng, dọn sạch wave được thưởng.
- Quái lọt qua cuối đường sẽ trừ **mạng**. Hết mạng là thua, sống sót qua wave 3 là thắng.
- `x1/x2`: đổi tốc độ game. `⏸`: tạm dừng.

## Chạy ở máy

Game dùng ES modules nên cần chạy qua một web server tĩnh (mở trực tiếp `index.html` bằng `file://` sẽ không chạy):

```bash
# Python 3
python3 -m http.server 8000

# hoặc Node.js
npx serve .
```

Rồi mở <http://localhost:8000>.

Để thử trên điện thoại trong cùng mạng Wi-Fi: mở `http://<IP-máy-tính>:8000` trên điện thoại.

## Deploy lên GitHub Pages

1. Vào **Settings → Pages** của repo.
2. **Source**: *Deploy from a branch*, chọn branch `main`, thư mục `/ (root)`.
3. Sau vài phút, game có ở `https://<username>.github.io/kingdom-rush-01/`.

Không có bước build — GitHub Pages phục vụ trực tiếp các file trong repo (file `.nojekyll` tắt xử lý Jekyll).

## Cấu trúc & phát triển

Xem [CLAUDE.md](CLAUDE.md) để biết cấu trúc thư mục, quy ước code và hướng phát triển. Số liệu cân bằng (tháp, quái, wave) nằm trong `js/config.js`.

Mọi hình ảnh đều được vẽ bằng hình khối Canvas; project không dùng asset của game gốc.
