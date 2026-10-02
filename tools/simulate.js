// Mô phỏng nhanh từng màn bằng một "bot" đơn giản để kiểm tra lỗi logic và cân bằng.
// Chạy: node tools/simulate.js [số lần chơi mỗi màn]
import { LEVELS } from '../js/data/levels.js';
import { TOWERS, TOWER_ORDER } from '../js/data/towers.js';
import { Game, STATUS } from '../js/game/game.js';

const runs = Number(process.argv[2] || 5);
const DT = 1 / 30;

// Chiến thuật bot: xây đủ các ô theo vòng loại tháp, rồi nâng cấp tháp rẻ nhất.
// `skill` (0..1) càng thấp bot càng chi tiêu chậm và dùng phép kém hơn.
// Độ "phủ" của một ô: số điểm trên đường nằm trong tầm 150.
const coverCache = new Map();
function coverage(game, spot) {
  const key = `${game.level.id}:${spot.id}`;
  if (!coverCache.has(key)) {
    let n = 0;
    for (const p of game.paths) for (const q of p.points) if (Math.hypot(q.x - spot.x, q.y - spot.y) < 150) n++;
    coverCache.set(key, n);
  }
  return coverCache.get(key);
}

function botStep(game, skill) {
  if (Math.random() > skill * 0.2) return;
  const free = game.spots.filter((s) => !s.tower).sort((a, b) => coverage(game, b) - coverage(game, a));
  // Xây tối đa ~70% số ô trước, sau đó ưu tiên nâng cấp rồi mới xây tiếp.
  const cap = Math.ceil(game.spots.length * 0.7);
  const up0 = game.towers.filter((t) => !t.maxed).sort((a, b) => a.upgradeCost - b.upgradeCost)[0];
  if (free.length && (game.towers.length < cap || !up0)) {
    const type = TOWER_ORDER[game.towers.length % TOWER_ORDER.length];
    const spot = free[0];
    if (game.gold >= TOWERS[type].levels[0].cost) game.build(spot, type);
    return;
  }
  const up = game.towers.filter((t) => !t.maxed).sort((a, b) => a.upgradeCost - b.upgradeCost)[0];
  if (up && game.gold >= up.upgradeCost) game.upgrade(up);
}

function botSpells(game, skill) {
  if (Math.random() > skill * 0.05) return;
  // Thả thiên thạch vào quái gần cuối đường nhất.
  const front = [...game.enemies].filter((e) => !e.flying).sort((a, b) => a.remaining - b.remaining)[0];
  if (front && game.spellReady('meteor')) game.castSpell('meteor', front.x, front.y);
  if (front && game.spellReady('militia')) game.castSpell('militia', front.x, front.y);
}

function play(level, skill) {
  const game = new Game(level);
  game.callWave();
  let steps = 0;
  while (!game.ended && steps < 60 * 60 * 30) {
    botStep(game, skill);
    botSpells(game, skill);
    game.update(DT);
    game.events.length = 0;
    steps++;
  }
  return { status: game.status, lives: game.lives, stars: game.stars, wave: game.waveIndex + 1, minutes: (steps * DT) / 60 };
}

for (const level of LEVELS) {
  for (const skill of [1, 0.4]) {
    const results = [];
    for (let i = 0; i < runs; i++) results.push(play(level, skill));
    const wins = results.filter((r) => r.status === STATUS.WON).length;
    const avgLives = results.reduce((s, r) => s + r.lives, 0) / runs;
    const lostAt = results.filter((r) => r.status !== STATUS.WON).map((r) => r.wave);
    console.log(
      `${level.id.padEnd(9)} skill=${skill} win ${wins}/${runs}  avgLives=${avgLives.toFixed(1)}  ` +
        `stars=${results.map((r) => r.stars).join(',')}  lostAtWave=[${lostAt}]  ~${results[0].minutes.toFixed(1)}min`,
    );
  }
}
