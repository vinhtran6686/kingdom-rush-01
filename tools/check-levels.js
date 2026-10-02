// Kiểm tra dữ liệu màn chơi: ô xây không đè lên đường, không chồng nhau, nằm trong màn hình.
// Chạy: node tools/check-levels.js
import { LEVELS } from '../js/data/levels.js';
import { ENEMIES } from '../js/data/enemies.js';
import { createPath } from '../js/game/path.js';
import { WORLD, dist } from '../js/core/utils.js';

let errors = 0;
const fail = (msg) => {
  errors++;
  console.error('✗', msg);
};

for (const L of LEVELS) {
  const paths = L.paths.map(createPath);
  L.spots.forEach((s, i) => {
    const d = Math.min(...paths.map((p) => p.distanceFrom(s.x, s.y)));
    if (d < 55) fail(`${L.id}: ô #${i} quá sát đường (${d.toFixed(0)})`);
    if (s.x < 40 || s.y < 60 || s.x > WORLD.width - 40 || s.y > WORLD.height - 30) fail(`${L.id}: ô #${i} sát mép`);
    L.spots.forEach((o, j) => {
      if (j > i && dist(s.x, s.y, o.x, o.y) < 90) fail(`${L.id}: ô #${i} và #${j} quá gần`);
    });
  });
  L.waves.forEach((w, wi) =>
    w.forEach((g) => {
      if (!ENEMIES[g.type]) fail(`${L.id}: wave ${wi + 1} có loại quái lạ "${g.type}"`);
      if (!paths[g.path]) fail(`${L.id}: wave ${wi + 1} dùng path ${g.path} không tồn tại`);
    }),
  );
  const hd = Math.min(...paths.map((p) => p.distanceFrom(L.heroSpawn.x, L.heroSpawn.y)));
  if (hd > 30) fail(`${L.id}: heroSpawn cách đường ${hd.toFixed(0)}`);
  console.log(`${L.id}: ${L.spots.length} ô, ${L.waves.length} wave, đường dài ${paths.map((p) => Math.round(p.length)).join('/')}`);
}

if (errors) process.exit(1);
console.log('OK');
