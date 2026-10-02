// Dữ liệu màn chơi. Thế giới 720x720.
// paths: danh sách đường đi (waypoint sẽ được làm mượt). Điểm đầu nằm ngoài màn hình.
// spots: vị trí xây tháp. heroSpawn: nơi anh hùng xuất hiện.
// waves: mỗi wave là danh sách nhóm { type, count, interval, delay, path }.

const g = (type, count, interval, delay = 0, path = 0) => ({ type, count, interval, delay, path });

export const LEVELS = [
  {
    id: 'valley',
    name: 'Thung Lũng Sương',
    subtitle: 'Bầy yêu tinh tràn xuống từ rừng phía tây.',
    theme: 'meadow',
    startGold: 280,
    lives: 20,
    paths: [
      [
        { x: -40, y: 170 }, { x: 120, y: 170 }, { x: 220, y: 110 }, { x: 380, y: 120 },
        { x: 470, y: 200 }, { x: 460, y: 330 }, { x: 330, y: 380 }, { x: 200, y: 380 },
        { x: 120, y: 460 }, { x: 150, y: 580 }, { x: 300, y: 630 }, { x: 470, y: 600 },
        { x: 580, y: 500 }, { x: 760, y: 480 },
      ],
    ],
    spots: [
      { x: 290, y: 170 }, { x: 380, y: 240 }, { x: 180, y: 250 }, { x: 240, y: 520 },
      { x: 460, y: 480 }, { x: 390, y: 560 }, { x: 530, y: 400 }, { x: 580, y: 580 },
      { x: 130, y: 90 },
    ],
    heroSpawn: { x: 300, y: 380 },
    waves: [
      [g('goblin', 6, 1.4)],
      [g('goblin', 8, 1.0), g('wolf', 3, 1.5, 6)],
      [g('bandit', 4, 2.0), g('goblin', 8, 0.8, 3)],
      [g('wolf', 8, 0.8), g('bandit', 5, 1.8, 5)],
      [g('goblin', 12, 0.6), g('shaman', 2, 4, 4), g('bandit', 5, 2, 8)],
      [g('troll', 2, 8), g('bandit', 6, 1.5, 4), g('wolf', 8, 0.7, 10), g('shaman', 2, 3, 12)],
    ],
  },
  {
    id: 'crossing',
    name: 'Ngã Ba Thu Phong',
    subtitle: 'Hai cánh quân hội tụ ở cây cầu gỗ. Coi chừng dơi đêm!',
    theme: 'autumn',
    startGold: 330,
    lives: 20,
    paths: [
      [
        { x: -40, y: 140 }, { x: 140, y: 150 }, { x: 260, y: 240 }, { x: 360, y: 330 },
        { x: 360, y: 450 }, { x: 300, y: 560 }, { x: 360, y: 660 }, { x: 380, y: 760 },
      ],
      [
        { x: 760, y: 180 }, { x: 600, y: 170 }, { x: 470, y: 250 }, { x: 360, y: 330 },
        { x: 360, y: 450 }, { x: 300, y: 560 }, { x: 360, y: 660 }, { x: 380, y: 760 },
      ],
    ],
    spots: [
      { x: 380, y: 540 }, { x: 290, y: 420 }, { x: 430, y: 350 }, { x: 360, y: 230 },
      { x: 260, y: 630 }, { x: 250, y: 320 }, { x: 240, y: 520 }, { x: 450, y: 460 },
      { x: 420, y: 640 }, { x: 590, y: 250 },
    ],
    heroSpawn: { x: 360, y: 450 },
    waves: [
      [g('goblin', 8, 1.0, 0, 0), g('goblin', 6, 1.2, 4, 1)],
      [g('wolf', 6, 0.9, 0, 1), g('bandit', 4, 2, 3, 0)],
      [g('bat', 6, 1.2, 0, 0), g('goblin', 10, 0.7, 2, 1)],
      [g('bandit', 6, 1.6, 0, 0), g('bandit', 6, 1.6, 0, 1), g('shaman', 2, 4, 6, 0)],
      [g('wolf', 10, 0.6, 0, 0), g('bat', 8, 1.0, 4, 1)],
      [g('troll', 2, 6, 0, 0), g('goblin', 16, 0.5, 2, 1), g('shaman', 3, 3, 6, 1)],
      [g('bat', 10, 0.8, 0, 1), g('bandit', 8, 1.2, 3, 0), g('wolf', 8, 0.7, 8, 1)],
      [g('troll', 3, 5, 0, 1), g('troll', 2, 6, 6, 0), g('shaman', 4, 2.5, 4, 0), g('bat', 10, 0.8, 10, 0)],
    ],
  },
  {
    id: 'pass',
    name: 'Đèo Băng Giá',
    subtitle: 'Cự Thạch Vương đã thức giấc. Đây là trận chiến cuối cùng.',
    theme: 'snow',
    startGold: 550,
    lives: 20,
    paths: [
      [
        { x: 120, y: -40 }, { x: 130, y: 120 }, { x: 240, y: 220 }, { x: 200, y: 360 },
        { x: 120, y: 470 }, { x: 180, y: 600 }, { x: 330, y: 640 }, { x: 460, y: 620 },
        { x: 540, y: 760 },
      ],
      [
        { x: 600, y: -40 }, { x: 590, y: 110 }, { x: 480, y: 200 }, { x: 520, y: 330 },
        { x: 600, y: 440 }, { x: 560, y: 560 }, { x: 460, y: 620 }, { x: 540, y: 760 },
      ],
    ],
    spots: [
      { x: 500, y: 520 }, { x: 560, y: 640 }, { x: 390, y: 560 }, { x: 230, y: 510 },
      { x: 560, y: 270 }, { x: 130, y: 280 }, { x: 500, y: 410 }, { x: 210, y: 110 },
      { x: 490, y: 100 }, { x: 90, y: 390 }, { x: 250, y: 400 },
    ],
    heroSpawn: { x: 400, y: 630 },
    waves: [
      [g('goblin', 10, 0.8, 0, 0), g('goblin', 10, 0.8, 2, 1)],
      [g('bandit', 6, 1.5, 0, 0), g('wolf', 8, 0.8, 3, 1)],
      [g('bat', 8, 1.0, 0, 1), g('shaman', 3, 3, 2, 0), g('goblin', 12, 0.6, 4, 0)],
      [g('troll', 2, 6, 0, 0), g('bandit', 8, 1.2, 2, 1)],
      [g('wolf', 10, 0.6, 0, 0), g('wolf', 10, 0.6, 2, 1)],
      [g('bat', 8, 0.9, 0, 0), g('troll', 2, 6, 3, 1), g('shaman', 3, 2, 5, 1)],
      [g('bandit', 9, 1.1, 0, 0), g('bandit', 9, 1.1, 0, 1), g('shaman', 3, 3, 6, 0)],
      [g('troll', 3, 5, 0, 1), g('goblin', 18, 0.5, 2, 0), g('bat', 8, 0.9, 6, 1)],
      [g('troll', 3, 5, 0, 0), g('troll', 3, 5, 2, 1), g('wolf', 12, 0.6, 6, 0), g('shaman', 3, 2, 8, 1)],
      [g('golem', 1, 1, 6, 0), g('bandit', 8, 1.2, 0, 1), g('troll', 2, 6, 10, 1), g('bat', 8, 1, 14, 0)],
    ],
  },
];
