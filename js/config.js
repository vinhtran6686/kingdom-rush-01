// Toàn bộ số liệu cân bằng game nằm ở đây — chỉnh file này để thay đổi độ khó
// mà không cần đụng tới logic.

// Kích thước "thế giới" (đơn vị logic). Canvas sẽ tự scale để vừa màn hình.
export const WORLD = { width: 720, height: 720 };

export const START = {
  gold: 150,
  lives: 20,
};

export const TOWERS = {
  archer: {
    name: 'Tháp cung',
    cost: 70,
    range: 140,
    damage: 8,
    fireInterval: 0.7, // giây giữa 2 phát bắn
    projectileSpeed: 420, // đơn vị/giây
    sellRatio: 0.6, // bán lại được 60% giá
  },
};

export const ENEMIES = {
  grunt: {
    name: 'Lính',
    hp: 45,
    speed: 50,
    reward: 5,
    livesCost: 1,
    radius: 12,
    color: '#c0392b',
  },
  runner: {
    name: 'Trinh sát',
    hp: 26,
    speed: 90,
    reward: 4,
    livesCost: 1,
    radius: 10,
    color: '#f39c12',
  },
  brute: {
    name: 'Đô vật',
    hp: 180,
    speed: 32,
    reward: 15,
    livesCost: 2,
    radius: 17,
    color: '#8e44ad',
  },
};

// Mỗi wave gồm nhiều nhóm; mỗi nhóm sinh `count` quái loại `type`,
// cách nhau `interval` giây, bắt đầu sau `delay` giây kể từ lúc wave bắt đầu.
// `bonus`: vàng thưởng khi dọn sạch wave.
export const WAVES = [
  {
    bonus: 25,
    groups: [{ type: 'grunt', count: 8, interval: 1.2, delay: 0 }],
  },
  {
    bonus: 35,
    groups: [
      { type: 'grunt', count: 10, interval: 1.0, delay: 0 },
      { type: 'runner', count: 6, interval: 0.8, delay: 5 },
    ],
  },
  {
    bonus: 0,
    groups: [
      { type: 'grunt', count: 14, interval: 0.8, delay: 0 },
      { type: 'runner', count: 8, interval: 0.7, delay: 4 },
      { type: 'brute', count: 3, interval: 3.0, delay: 8 },
    ],
  },
];
