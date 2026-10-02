// Lưu tiến độ (số sao mỗi màn) và cài đặt vào localStorage.
const KEY = 'kingdom-rush-01:save';

function load() {
  try {
    return { stars: {}, muted: false, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { stars: {}, muted: false };
  }
}

const data = load();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Trình duyệt chặn lưu trữ (chế độ riêng tư...) — bỏ qua.
  }
}

export const save = {
  getStars(levelId) {
    return data.stars[levelId] || 0;
  },
  setStars(levelId, stars) {
    if (stars > this.getStars(levelId)) {
      data.stars[levelId] = stars;
      persist();
    }
  },
  get muted() {
    return data.muted;
  },
  set muted(v) {
    data.muted = v;
    persist();
  },
  reset() {
    data.stars = {};
    persist();
  },
};
