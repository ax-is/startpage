/* ============================================
   Background Animations System
   Extracted from script.js for maintainability
   ============================================ */

let activeAnimationFrame = null;

const Animations = {
  stop() {
    if (activeAnimationFrame) {
      cancelAnimationFrame(activeAnimationFrame);
      activeAnimationFrame = null;
    }
    const el = document.getElementById('globe');
    if (el) el.textContent = '';
  },

  start(name) {
    this.stop();
    const el = document.getElementById('globe');
    if (!el || name === 'none') return;
    const renderer = this.renderers[name];
    if (renderer) renderer(el);
  },

  renderers: {
    /* ====== GLOBE ====== */
    globe(el) {
      const width = 80, height = 40;
      const chars = '.,-~:;=!*#$@'.split('');
      const continents = [
        [30, 70, -140, -60], [25, 50, -130, -80], [50, 72, -170, -50],
        [-55, 10, -80, -35], [-20, 5, -70, -40],
        [35, 70, -10, 40], [40, 60, -10, 50],
        [-35, 37, -20, 50], [-10, 25, 10, 42],
        [10, 70, 40, 140], [25, 55, 60, 130], [0, 20, 95, 115],
        [-40, -10, 110, 155], [20, 45, 125, 150], [-10, 5, 95, 140]
      ];
      function isLand(lat, lon) {
        for (const [a, b, c, d] of continents)
          if (lat >= a && lat <= b && lon >= c && lon <= d) return true;
        return false;
      }
      let angle = 0;
      let lastTime = 0;
      (function render(now) {
        // speed scaling: 50 is default speed
        const speedRatio = (config.asciiSpeed !== undefined ? config.asciiSpeed : 50) / 50;

        let out = '';
        for (let j = 0; j < height; j++) {
          for (let i = 0; i < width; i++) {
            const x = (2 * i - width) / width, y = (2 * j - height) / height;
            const r2 = x * x + y * y * 4;
            if (r2 > 1) { out += ' '; continue; }
            const z = Math.sqrt(1 - r2);
            const cosA = Math.cos(angle), sinA = Math.sin(angle);
            const rx = x * cosA + z * sinA, rz = -x * sinA + z * cosA;
            const lat = Math.asin(-(2 * j - height) / height * 2 / Math.sqrt(r2 + (1 - r2))) * 180 / Math.PI;
            const lon = Math.atan2(rx, rz) * 180 / Math.PI;
            const light = Math.max(0, rz * 0.6 + rx * 0.4);
            if (isLand(lat, lon)) {
              out += chars[Math.max(0, Math.min(chars.length - 1, Math.floor(light * chars.length * 1.2)))];
            } else {
              const oc = ' .·'; out += oc[Math.min(oc.length - 1, Math.max(0, Math.floor(light * oc.length)))];
            }
          }
          out += '\n';
        }
        el.textContent = out;

        const delta = now - lastTime || 16.66;
        lastTime = now;
        angle += 0.003 * speedRatio * (delta / 16.66);

        activeAnimationFrame = requestAnimationFrame(render);
      })();
    },

    /* ====== MATRIX RAIN ====== */
    matrix(el) {
      const cols = 90, rows = 40;
      const charset = 'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ0123456789'.split('');
      const drops = Array.from({ length: cols }, () => ({
        y: Math.random() * rows * -2,
        speed: 0.15 + Math.random() * 0.35,
        trail: 6 + Math.floor(Math.random() * 12)
      }));
      const grid = Array.from({ length: rows }, () => Array(cols).fill(' '));
      let lastTime = 0;
      (function render(now) {
        const speedRatio = (config.asciiSpeed !== undefined ? config.asciiSpeed : 50) / 50;
        const delta = now - lastTime || 16.66;
        lastTime = now;
        const timeScale = speedRatio * (delta / 16.66);

        for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols; c++) grid[r][c] = ' ';
        for (let c = 0; c < cols; c++) {
          const d = drops[c];
          d.y += d.speed * timeScale;
          if (d.y - d.trail > rows) {
            d.y = Math.random() * rows * -1;
            d.speed = 0.15 + Math.random() * 0.35;
            d.trail = 6 + Math.floor(Math.random() * 12);
          }
          for (let t = 0; t < d.trail; t++) {
            const row = Math.floor(d.y - t);
            if (row >= 0 && row < rows)
              grid[row][c] = t < 3 ? charset[Math.floor(Math.random() * charset.length)] : '.';
          }
        }
        el.textContent = grid.map(r => r.join('')).join('\n');
        activeAnimationFrame = requestAnimationFrame(render);
      })();
    },

    /* ====== CONSTELLATION ====== */
    constellation(el) {
      const cols = 90, rows = 40, numStars = 35, connectDist = 18;
      const stars = Array.from({ length: numStars }, () => ({
        x: Math.random() * cols, y: Math.random() * rows,
        vx: (Math.random() - 0.5) * 0.04, vy: (Math.random() - 0.5) * 0.02
      }));
      let lastTime = 0;
      (function render(now) {
        const speedRatio = (config.asciiSpeed !== undefined ? config.asciiSpeed : 50) / 50;
        const delta = now - lastTime || 16.66;
        lastTime = now;
        const timeScale = speedRatio * (delta / 16.66);

        const grid = Array.from({ length: rows }, () => Array(cols).fill(' '));
        for (const s of stars) {
          s.x += s.vx * timeScale; s.y += s.vy * timeScale;
          if (s.x < 0) s.x += cols; if (s.x >= cols) s.x -= cols;
          if (s.y < 0) s.y += rows; if (s.y >= rows) s.y -= rows;
        }
        for (let i = 0; i < numStars; i++) {
          for (let j = i + 1; j < numStars; j++) {
            const dx = stars[i].x - stars[j].x, dy = (stars[i].y - stars[j].y) * 2;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < connectDist) {
              const steps = Math.floor(dist / 1.5);
              for (let s = 0; s <= steps; s++) {
                const t = s / (steps || 1);
                const lx = Math.round(stars[i].x + (stars[j].x - stars[i].x) * t);
                const ly = Math.round(stars[i].y + (stars[j].y - stars[i].y) * t);
                if (lx >= 0 && lx < cols && ly >= 0 && ly < rows) grid[ly][lx] = '·';
              }
            }
          }
        }
        for (const s of stars) {
          const sx = Math.round(s.x), sy = Math.round(s.y);
          if (sx >= 0 && sx < cols && sy >= 0 && sy < rows) grid[sy][sx] = '◦';
        }
        el.textContent = grid.map(r => r.join('')).join('\n');
        activeAnimationFrame = requestAnimationFrame(render);
      })();
    },

    /* ====== FLOATING PARTICLES ====== */
    particles(el) {
      const cols = 90, rows = 40, num = 50;
      const pts = Array.from({ length: num }, () => ({
        x: Math.random() * cols, y: Math.random() * rows,
        vx: (Math.random() - 0.5) * 0.03, vy: -0.01 - Math.random() * 0.03,
        char: '·.˙°*∘'[Math.floor(Math.random() * 6)]
      }));
      let lastTime = 0;
      let totalTime = 0;
      (function render(now) {
        const speedRatio = (config.asciiSpeed !== undefined ? config.asciiSpeed : 50) / 50;
        const delta = now - lastTime || 16.66;
        lastTime = now;
        const timeScale = speedRatio * (delta / 16.66);
        totalTime += timeScale;

        const grid = Array.from({ length: rows }, () => Array(cols).fill(' '));
        for (const p of pts) {
          p.x += (p.vx + Math.sin(p.y * 0.3 + (totalTime * 0.05)) * 0.01) * timeScale;
          p.y += p.vy * timeScale;
          if (p.y < 0) { p.y = rows - 1; p.x = Math.random() * cols; }
          if (p.x < 0) p.x += cols; if (p.x >= cols) p.x -= cols;
          const px = Math.round(p.x), py = Math.round(p.y);
        }
        el.textContent = grid.map(r => r.join('')).join('\n');
        activeAnimationFrame = requestAnimationFrame(render);
      })();
    },

    /* ====== 3D SPINNING DONUT (TORUS) ====== */
    donut(el) {
      const cols = 90, rows = 40;
      let A = 0, B = 0;
      let lastTime = 0;
      const chars = '.,-~:;=!*#$@'.split('');

      (function render(now) {
        const speedRatio = (config.asciiSpeed !== undefined ? config.asciiSpeed : 50) / 50;
        const delta = now - lastTime || 16.66;
        lastTime = now;
        const timeScale = speedRatio * (delta / 16.66);

        const b = Array(cols * rows).fill(' ');
        const z = Array(cols * rows).fill(0);

        // Donut Math
        for (let j = 0; j < 6.28; j += 0.07) {
          for (let i = 0; i < 6.28; i += 0.02) {
            const c = Math.sin(i), d = Math.cos(j), e = Math.sin(A), f = Math.sin(j), g = Math.cos(A),
              h = d + 2, D = 1 / (c * h * e + f * g + 5), l = Math.cos(i),
              m = Math.cos(B), n = Math.sin(B),
              t = c * h * g - f * e;

            const x = Math.floor(45 + 30 * D * (l * h * m - t * n)); // 45 is cols/2
            const y = Math.floor(20 + 15 * D * (l * h * n + t * m)); // 20 is rows/2
            const o = x + cols * y;
            const N = Math.floor(8 * ((f * e - c * d * g) * m - c * d * e - f * g - l * d * n));

            if (y >= 0 && y < rows && x >= 0 && x < cols && D > z[o]) {
              z[o] = D;
              b[o] = chars[N > 0 ? N : 0];
            }
          }
        }

        let out = '';
        for (let k = 0; k < cols * rows; k++) {
          out += k % cols === cols - 1 ? b[k] + '\n' : b[k];
        }
        el.textContent = out;

        A += 0.04 * timeScale;
        B += 0.02 * timeScale;
        activeAnimationFrame = requestAnimationFrame(render);
      })();
    },

    /* ====== FLOWING SINE WAVES ====== */
    waves(el) {
      const cols = 90, rows = 40;
      let time = 0;
      let lastTime = 0;
      const chars = ' .:-=+*#%@';

      (function render(now) {
        const speedRatio = (config.asciiSpeed !== undefined ? config.asciiSpeed : 50) / 50;
        const delta = now - lastTime || 16.66;
        lastTime = now;
        const timeScale = speedRatio * (delta / 16.66);

        let out = '';
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const nx = x / cols * 10;
            const ny = y / rows * 10;
            const val = Math.sin(nx + time) + Math.cos(ny + time * 0.5) + Math.sin(nx * 0.5 + ny * 0.5 - time);
            const normVal = Math.max(0, Math.min(1, (val + 3) / 6));
            out += chars[Math.floor(normVal * (chars.length - 1))];
          }
          out += '\n';
        }
        el.textContent = out;

        time += 0.05 * timeScale;
        activeAnimationFrame = requestAnimationFrame(render);
      })();
    }
  }
};
