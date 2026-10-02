// Số liệu tháp. Mỗi tháp có 3 cấp; mảng `levels[i]` là chỉ số ở cấp i+1.
// damage: [min, max]; interval: giây giữa 2 đòn; range: đơn vị thế giới.
// damageType: 'physical' (bị giáp giảm) | 'magic' (bị kháng phép giảm).

export const TOWER_ORDER = ['archer', 'barracks', 'mage', 'artillery'];

export const TOWERS = {
  archer: {
    name: 'Tháp Cung Thủ',
    short: 'Cung',
    desc: 'Bắn nhanh, bắn được quái bay.',
    damageType: 'physical',
    hitsFlying: true,
    levels: [
      { cost: 70, damage: [4, 7], interval: 0.8, range: 140 },
      { cost: 110, damage: [7, 11], interval: 0.7, range: 155 },
      { cost: 160, damage: [11, 17], interval: 0.6, range: 170 },
    ],
  },
  barracks: {
    name: 'Doanh Trại',
    short: 'Lính',
    desc: '3 binh sĩ ra chặn đường quái dưới đất.',
    damageType: 'physical',
    hitsFlying: false,
    levels: [
      { cost: 70, soldierHp: 60, damage: [2, 4], armor: 0, interval: 1.0, range: 150 },
      { cost: 110, soldierHp: 100, damage: [4, 7], armor: 0.15, interval: 1.0, range: 160 },
      { cost: 150, soldierHp: 150, damage: [7, 11], armor: 0.3, interval: 1.0, range: 170 },
    ],
    soldiers: 3,
    respawn: 10,
  },
  mage: {
    name: 'Tháp Pháp Sư',
    short: 'Phép',
    desc: 'Sát thương phép lớn, xuyên giáp.',
    damageType: 'magic',
    hitsFlying: true,
    levels: [
      { cost: 100, damage: [10, 18], interval: 1.5, range: 130 },
      { cost: 160, damage: [22, 38], interval: 1.5, range: 140 },
      { cost: 240, damage: [40, 66], interval: 1.5, range: 150 },
    ],
  },
  artillery: {
    name: 'Pháo Đài',
    short: 'Pháo',
    desc: 'Đạn nổ lan, không bắn được quái bay.',
    damageType: 'physical',
    hitsFlying: false,
    levels: [
      { cost: 125, damage: [8, 16], interval: 3.0, range: 150, splash: 52 },
      { cost: 200, damage: [18, 32], interval: 3.0, range: 160, splash: 56 },
      { cost: 300, damage: [32, 54], interval: 3.0, range: 175, splash: 62 },
    ],
  },
};

export const SELL_RATIO = 0.6;
