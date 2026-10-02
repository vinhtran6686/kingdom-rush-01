// Anh hùng và phép thuật của người chơi.

export const HERO = {
  name: 'Hiệp Sĩ Bình Minh',
  hp: 420,
  damage: [12, 20],
  armor: 0.35,
  interval: 1.0,
  speed: 95,
  regen: 12, // máu hồi mỗi giây khi không đánh nhau
  respawn: 15,
  engageRange: 70,
  // Kỹ năng tự động: chém xoáy gây sát thương và làm choáng quái quanh mình.
  skill: { name: 'Chém Xoáy', cooldown: 10, radius: 65, damage: 45, stun: 1.2 },
};

export const SPELLS = {
  meteor: {
    name: 'Mưa Thiên Thạch',
    cooldown: 60,
    count: 4,
    spread: 50,
    radius: 55,
    damage: [55, 80],
  },
  militia: {
    name: 'Dân Quân',
    cooldown: 16,
    count: 2,
    hp: 70,
    damage: [2, 5],
    armor: 0,
    duration: 20,
  },
};
