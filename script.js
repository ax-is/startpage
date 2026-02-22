/* ============================================
   TUI STARTPAGE — Artistic Minimal Redesign
   ============================================ */

let bookmarks = [];
let config = {};
let filteredBookmarks = [];
let selectedIndex = 0;
let currentCommandSuggestions = [];
let currentSearchSuggestions = [];
let showingAllBookmarks = false;

const searchInput = document.getElementById('search-input');
const resultsContainer = document.getElementById('results');
const resultsBox = document.getElementById('results-box');
const iconDock = document.getElementById('icon-dock');



let quoteIntervalId = null;

const STYLE_CONSTANTS = {
  HOVER_OPACITY: 0.06,
  SELECTED_OPACITY: 0.1
};

/* ============================================
   Background Animations System
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
/* ---------- Data Loading ---------- */

async function loadData() {
  const data = await loadSharedData();
  config = data.config;
  bookmarks = data.bookmarks;
  renderIconDock();
}

/* ---------- Style Helpers ---------- */

function getOrCreateStyleElement(id) {
  let element = document.getElementById(id);
  if (!element) {
    element = document.createElement('style');
    element.id = id;
    document.head.appendChild(element);
  }
  return element;
}

/* ---------- Config Application ---------- */

function applyConfig() {
  applySharedTheme(config, 'index');

  const color = config.accentColor || DEFAULT_CONFIG.accentColor;
  const style = getOrCreateStyleElement('dynamic-style');
  style.textContent = `
    :root {
      --color-accent: ${color};
      --glow-accent: 0 0 12px ${hexToRgba(color, 0.15)};
      --glow-accent-strong: 0 0 20px ${hexToRgba(color, 0.3)};
    }
    #globe { color: ${config.asciiColor || color}; opacity: ${(parseInt(config.asciiOpacity) || DEFAULT_CONFIG.asciiOpacity) / 100}; }
    #username { text-shadow: 0 0 30px ${hexToRgba(color, 0.15)}; }
    #greeting { color: ${config.textColor2 || DEFAULT_CONFIG.textColor2}; }
    #quote { color: ${config.textColor2 || DEFAULT_CONFIG.textColor2}; }
    #search-input { caret-color: transparent; }
    #search-input:focus {
      border-bottom-color: ${color};
      box-shadow: 0 1px 0 ${hexToRgba(color, 0.3)},
                  0 4px 20px -4px ${hexToRgba(color, 0.1)};
    }
    .bookmark-item:hover {
      border-left-color: ${color};
      background-color: ${hexToRgba(color, STYLE_CONSTANTS.HOVER_OPACITY)};
    }
    .bookmark-item.selected {
      border-left-color: ${color};
      background-color: ${hexToRgba(color, STYLE_CONSTANTS.SELECTED_OPACITY)};
      box-shadow: inset 3px 0 12px -3px ${hexToRgba(color, 0.15)};
    }
    .dock-icon:hover {
      color: ${color};
      opacity: 1;
      transform: scale(1.15);
      filter: drop-shadow(0 0 8px ${hexToRgba(color, 0.6)});
    }
    .tag { color: ${hexToRgba(color, 0.4)}; }
    a { color: ${color}; }
    a:hover { text-shadow: 0 0 8px ${hexToRgba(color, 0.5)}; }
  `;

  updateGreeting();
  Animations.start(config.bgAnimation || DEFAULT_CONFIG.bgAnimation);
}

/* ---------- Greeting & Quotes ---------- */

let QUOTES = [
  "\"Pay attention to how your left hemisphere is letting go of the walls around you\" — Inspirobot",
  "\"Acid is awesome all the time, but so are you\" — Inspirobot",
  "\"Simplicity is the ultimate sophistication.\" — Leonardo da Vinci",
  "\"Know yourself and you will know the universe and the gods.\" — Socrates",
  "\"Clothes make the man. Naked people have little or no influence in society.\" — Mark Twain",
  "\"There are no facts, only interpretations.\" — Friedrich Nietzsche",
  "\"The code is more what you'd call 'guidelines' than actual rules\". — Captain Jack Sparrow",
  "\"You have power over your mind - not outside events. Realize this, and you will find strength.\" — Marcus Aurelius",
  "\"I write differently from what I speak, I speak differently from what I think, I think differently from the way I ought to think, and so it all proceeds into deepest darkness.\" — Franz Kafka",
  "\"We suffer more often in imagination than in reality.\" — Seneca",
  "\"I am a cage, in search of a bird.\" — Franz Kafka",
  "\"He who has a why to live for can bear almost any how.\" — Friedrich Nietzsche",
  "\"In the midst of chaos, there is also opportunity.\" — Sun Tzu",
  "\"It's not what happens to you, but how you react to it that matters.\" — Epictetus",
  "\"The impediment to action advances action. What stands in the way becomes the way.\" — Marcus Aurelius",
  "\"To go wrong in one's own way is better than to go right in someone else's.\" — Fyodor Dostoevsky",
  "\"A ship in harbor is safe, but that is not what ships are built for.\" — John A. Shedd",
  "\"Avoid silence, and you will achieve the past.\" — Inspirobot",
  "\"Force yourself to loosen your body.\" — Inspirobot",
  "\"Isn't it pleasing to observe how your ego is melting together with humanity itself?\" — Inspirobot",
  "\"We're more ghosts than people.\" — Arthur Morgan",
  "\"Take a gamble that love exists, and do a loving act.\" — Arthur Morgan",
  "\"The greatest trick the devil ever pulled was convincing the world he didn't exist.\" — Verbal Kint",
  "\"I know that I know nothing.\" — Socrates",
  "\"Creativity takes courage.\" — Henri Matisse"
];

let currentQuoteIndex = Math.floor(Math.random() * QUOTES.length);

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return 'good night,';
  if (hour < 12) return 'good morning,';
  if (hour < 17) return 'good afternoon,';
  if (hour < 21) return 'good evening,';
  return 'good night,';
}

function updateGreeting() {
  const el = document.getElementById('greeting');
  if (el) {
    const custom = config.customGreeting;
    el.textContent = custom ? custom : getGreeting();
  }
  const nameEl = document.getElementById('username');
  if (nameEl) nameEl.textContent = config.userName || DEFAULT_CONFIG.userName;
}

function showNextQuote() {
  const el = document.getElementById('quote');
  if (!el) return;

  el.classList.add('fade-out');
  el.classList.remove('fade-in');

  setTimeout(() => {
    currentQuoteIndex = (currentQuoteIndex + 1) % QUOTES.length;
    el.textContent = QUOTES[currentQuoteIndex];
    el.classList.remove('fade-out');
    el.classList.add('fade-in');
  }, 800);
}

function initQuotes() {
  const el = document.getElementById('quote');
  if (!el) return;

  // Load custom quotes if available
  if (config.quoteFile) {
    try {
      // Check if it's a Data URL (base64) or raw text
      if (config.quoteFile.startsWith('data:')) {
        fetch(config.quoteFile)
          .then(res => res.text())
          .then(text => {
            const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            if (lines.length > 0) {
              QUOTES = lines;
              // Update display immediately
              currentQuoteIndex = Math.floor(Math.random() * QUOTES.length);
              el.textContent = QUOTES[currentQuoteIndex];
            }
          })
          .catch(err => console.error('Failed to load quote file', err));
      } else {
        // Assume it's raw text content if not a data URL (legacy or direct text)
        const lines = config.quoteFile.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length > 0) {
          QUOTES = lines;
          currentQuoteIndex = Math.floor(Math.random() * QUOTES.length);
          el.textContent = QUOTES[currentQuoteIndex];
        } else {
          // File was set but is empty or invalid? 
          // If user explicitly set a file, we shouldn't show defaults?
          // For now, let's just log it. 
          console.log('Custom quote file is empty/invalid');
        }
      }
    } catch (e) {
      console.error('Invalid quote file data', e);
    }
  }

  if (config.quoteInterval === 'none') {
    el.textContent = '';
    el.style.display = 'none';
    const nextBtn = document.getElementById('next-quote-btn');
    if (nextBtn) nextBtn.style.display = 'none';
    if (quoteIntervalId) {
      clearInterval(quoteIntervalId);
      quoteIntervalId = null;
    }
    return;
  } else {
    el.style.display = '';
    const nextBtn = document.getElementById('next-quote-btn');
    if (nextBtn) nextBtn.style.display = '';
  }

  el.textContent = QUOTES[currentQuoteIndex];
  el.classList.add('fade-in');

  if (quoteIntervalId) clearInterval(quoteIntervalId);
  const minutes = parseInt(config.quoteInterval) || DEFAULT_CONFIG.quoteInterval;
  quoteIntervalId = setInterval(showNextQuote, minutes * 60000);

  const nextBtn = document.getElementById('next-quote-btn');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      showNextQuote();
      // Reset timer so it doesn't skip immediately after manual change
      if (quoteIntervalId) clearInterval(quoteIntervalId);
      quoteIntervalId = setInterval(showNextQuote, minutes * 60000);
    });
  }
}

/* ---------- Commands ---------- */

const commands = [
  { name: ':list', description: 'Show all bookmarks' },
  { name: ':config', description: 'Open settings' },
  { name: ':bookmark', description: 'Edit bookmarks' },
  { name: ':export', description: 'Export settings and bookmarks' },
  { name: ':import', description: 'Import settings and bookmarks' },
  { name: ':help', description: 'Show help' },
  { name: ':reset', description: 'Reset all settings and bookmarks' }
];

const commandHandlers = {
  ':config': () => { window.location.href = 'config.html'; },
  ':bookmark': () => { window.location.href = 'bookmarks.html'; },
  ':help': () => { toggleHelp(); },
  ':list': async () => {
    const data = await loadSharedData();
    if (data.bookmarks) bookmarks = data.bookmarks;
    showingAllBookmarks = true;
    filteredBookmarks = bookmarks;
    selectedIndex = 0;
    renderResults();
    searchInput.value = '';
    searchInput.focus();
  },
  ':reset': () => {
    if (confirm('Reset all settings and bookmarks to default? This cannot be undone.')) {
      removeSharedData(STORAGE_KEYS.CONFIG);
      removeSharedData(STORAGE_KEYS.BOOKMARKS);
      window.location.reload();
    }
  },
  ':export': () => { exportData(); },
  ':import': () => { importData(); }
};

function executeCommand(query) {
  const handler = commandHandlers[query];
  if (handler) { handler(); return true; }
  return false;
}

/* ---------- Export / Import ---------- */

async function exportData() {
  const data = await loadSharedData();
  const exportFormat = {
    config: data.config,
    bookmarks: data.bookmarks,
    exportDate: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(exportFormat, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `startpage-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.style.display = 'none';
  document.body.appendChild(input);

  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      document.body.removeChild(input);
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.config) saveSharedData(STORAGE_KEYS.CONFIG, data.config);
        if (data.bookmarks) saveSharedData(STORAGE_KEYS.BOOKMARKS, data.bookmarks);

        searchInput.value = 'Import successful! Reloading...';
        setTimeout(() => window.location.reload(), 800);
      } catch (error) {
        searchInput.value = 'Failed to import: Invalid file format';
      }
      document.body.removeChild(input);
    };
    reader.readAsText(file);
  };

  // Clean up if the user cancels the dialog (focus returns to window)
  window.addEventListener('focus', function cleanup() {
    setTimeout(() => {
      if (input.parentNode) {
        document.body.removeChild(input);
      }
    }, 1000);
    window.removeEventListener('focus', cleanup);
  });

  input.click();
}

/* ---------- Search & Filter ---------- */

function bookmarkMatches(bookmark, lowerQuery) {
  return bookmark.name.toLowerCase().includes(lowerQuery) ||
    bookmark.url.toLowerCase().includes(lowerQuery) ||
    bookmark.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
}

let activeSuggestController = null;
let currentSuggestId = 0;

async function fetchSearchSuggestions(query) {
  const reqId = ++currentSuggestId;

  if (activeSuggestController) activeSuggestController.abort();
  activeSuggestController = new AbortController();

  try {
    const res = await fetch(`https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`, {
      signal: activeSuggestController.signal
    });
    const data = await res.json();
    if (currentSuggestId !== reqId) return [];
    return data[1] || [];
  } catch (e) {
    if (e.name === 'AbortError') return [];

    // JSONP Fallback for standard web (Vercel CORS bypass)
    return new Promise((resolve) => {
      const callbackName = `google_cb_${reqId}`;
      const scriptId = `google_script_${reqId}`;

      window[callbackName] = function (data) {
        delete window[callbackName];
        const scriptEl = document.getElementById(scriptId);
        if (scriptEl) scriptEl.remove();

        if (currentSuggestId !== reqId) {
          resolve([]);
          return;
        }

        if (data && Array.isArray(data) && Array.isArray(data[1])) {
          resolve(data[1]);
        } else {
          resolve([]);
        }
      };

      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}&callback=${callbackName}`;

      // Failsafe timeout
      setTimeout(() => {
        if (window[callbackName]) {
          delete window[callbackName];
          if (script.parentNode) script.remove();
          if (currentSuggestId === reqId) resolve([]);
        }
      }, 3000);

      document.body.appendChild(script);
    });
  }
}

function filterBookmarks(query) {
  if (!query) {
    filteredBookmarks = showingAllBookmarks ? bookmarks : [];
    currentCommandSuggestions = [];
    selectedIndex = 0;
    renderResults();
    return;
  }

  if (query.startsWith(':')) {
    showingAllBookmarks = false;
    const matched = commands.filter(cmd => cmd.name.startsWith(query.toLowerCase()));
    currentCommandSuggestions = matched;
    currentSearchSuggestions = [];
    selectedIndex = 0;
    renderCommandSuggestions(matched);
    return;
  }

  currentCommandSuggestions = [];
  currentSearchSuggestions = [];
  filteredBookmarks = bookmarks.filter(b => bookmarkMatches(b, query.toLowerCase()));
  selectedIndex = 0;

  if (filteredBookmarks.length === 0 && !isUrl(query) && query.trim().length > 0) {
    if (activeSuggestController) activeSuggestController.abort();
    renderResults();

    fetchSearchSuggestions(query).then(suggestions => {
      if (searchInput.value.trim().toLowerCase() !== query.trim().toLowerCase()) return;
      currentSearchSuggestions = suggestions.slice(0, 6);
      selectedIndex = 0;
      renderSearchSuggestions(currentSearchSuggestions);
    });
  } else {
    if (activeSuggestController) {
      activeSuggestController.abort();
      activeSuggestController = null;
    }
    renderResults();
  }
}

/* ---------- Rendering ---------- */

function createTextElement(cls, text) {
  const el = document.createElement('div');
  el.className = cls;
  el.textContent = text;
  return el;
}

function createResultItem(isSelected, onClick) {
  const item = document.createElement('div');
  item.className = 'bookmark-item' + (isSelected ? ' selected' : '');
  item.addEventListener('click', onClick);
  return item;
}

function createTagsElement(tags) {
  const container = document.createElement('div');
  container.className = 'bookmark-tags';
  tags.forEach(tag => {
    const span = document.createElement('span');
    span.className = 'tag';
    span.textContent = `#${tag}`;
    container.appendChild(span);
  });
  return container;
}

function getIconSlugForUrl(url) {
  if (!url) return 'internetexplorer';

  try {
    const validUrl = (url.startsWith('http://') || url.startsWith('https://')) ? url.toLowerCase() : 'https://' + url.toLowerCase();
    const urlObj = new URL(validUrl);
    let hostname = urlObj.hostname.replace(/^www\./, '');

    // Exact matches or specific overrides
    if (hostname === 'x.com' || hostname === 'twitter.com') return 'x';
    if (hostname.includes('chatgpt.com') || hostname.includes('openai.com')) return 'openai';
    if (hostname.includes('gemini.google.com') || hostname.includes('gemini.com')) return 'googlegemini';
    if (hostname.includes('mail.google.com')) return 'gmail';

    // Dynamic extraction for everything else
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      return parts[parts.length - 2].replace(/[^a-z0-9]/g, '');
    }
    return hostname.replace(/[^a-z0-9]/g, '');
  } catch (e) {
    return 'internetexplorer';
  }
}

function ensureAbsoluteUrl(url) {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return 'https://' + url;
}

function renderIconDock() {
  if (!iconDock) return;
  iconDock.innerHTML = '';

  // Create icons for the first 6 bookmarks
  const topBookmarks = bookmarks.slice(0, 6);
  if (topBookmarks.length === 0) return;

  topBookmarks.forEach(bm => {
    const link = document.createElement('a');
    link.className = 'dock-icon';
    link.href = ensureAbsoluteUrl(bm.url);
    link.title = bm.name;

    const slug = getIconSlugForUrl(bm.url);

    // Fetch raw SVG from Simple Icons unpkg CDN
    fetch(`https://unpkg.com/simple-icons@v11/icons/${slug}.svg`)
      .then(res => {
        if (!res.ok) throw new Error('Icon not found');
        return res.text();
      })
      .then(svgText => {
        link.innerHTML = svgText;
      })
      .catch(err => {
        // Fallback 1: Google Favicon API
        try {
          const validUrl = (bm.url.startsWith('http://') || bm.url.startsWith('https://')) ? bm.url : 'https://' + bm.url;
          const hostname = new URL(validUrl).hostname;
          link.innerHTML = `<img src="https://www.google.com/s2/favicons?domain=${hostname}&sz=64" alt="${bm.name}" style="width: 24px; height: 24px; border-radius: 4px; transition: transform 0.2s;">`;
        } catch (e) {
          // Fallback 2: Site initials
          const initial = bm.name ? bm.name.trim().charAt(0).toUpperCase() : '?';
          link.innerHTML = `<span style="font-weight: 700; font-size: 24px; font-family: var(--font-primary, sans-serif);">${initial}</span>`;
        }
      });

    iconDock.appendChild(link);
  });
}

function showResultsBox() { resultsBox.style.display = ''; }
function hideResultsBox() { resultsBox.style.display = 'none'; }

function renderCommandSuggestions(matched) {
  resultsContainer.innerHTML = '';
  if (matched.length === 0) { hideResultsBox(); return; }
  showResultsBox();
  matched.forEach((cmd, i) => {
    const item = createResultItem(i === selectedIndex, () => {
      searchInput.value = cmd.name;
      executeCommand(cmd.name);
    });
    item.appendChild(createTextElement('bookmark-name', cmd.name));
    item.appendChild(createTextElement('bookmark-url', cmd.description));
    resultsContainer.appendChild(item);
  });
  updateScrollFade();
}

function renderSearchSuggestions(suggestions) {
  resultsContainer.innerHTML = '';
  if (suggestions.length === 0) { hideResultsBox(); return; }
  showResultsBox();

  suggestions.forEach((sug, i) => {
    const item = createResultItem(i === selectedIndex, () => {
      searchInput.value = sug;
      window.location.href = (config.searchEngine || DEFAULT_CONFIG.searchEngine) + encodeURIComponent(sug);
    });
    item.appendChild(createTextElement('bookmark-name', sug));

    // We optionally remove URL subtitle and tags to keep it clean.

    resultsContainer.appendChild(item);
  });
  updateScrollFade();
}

function renderResults() {
  resultsContainer.innerHTML = '';
  if (filteredBookmarks.length === 0) { hideResultsBox(); return; }
  showResultsBox();
  filteredBookmarks.forEach((bm, i) => {
    const item = createResultItem(i === selectedIndex, () => openBookmark(bm));
    item.appendChild(createTextElement('bookmark-name', bm.name));
    item.appendChild(createTextElement('bookmark-url', bm.url));
    item.appendChild(createTagsElement(bm.tags));
    resultsContainer.appendChild(item);
  });
  updateScrollFade();
}

function openBookmark(bookmark) { window.location.href = ensureAbsoluteUrl(bookmark.url); }

/* ---------- Help Overlay ---------- */

function toggleHelp() {
  const existing = document.getElementById('help-overlay');
  if (existing) { existing.remove(); return; }

  const overlay = document.createElement('div');
  overlay.id = 'help-overlay';
  overlay.className = 'help-overlay';

  const content = document.createElement('div');
  content.className = 'help-content';

  const items = [
    [':', 'Show command suggestions'],
    [':list', 'Show all bookmarks'],
    [':config', 'Open settings'],
    [':bookmark', 'Edit bookmarks'],
    [':export', 'Export data'],
    [':import', 'Import data'],
    [':reset', 'Reset everything'],
    [':help', 'Toggle this help'],
    ['↓ / ↑', 'Navigate results'],
    ['Enter', 'Open / Search'],
    ['Esc', 'Clear / Close']
  ];

  content.innerHTML = `
    <h2>Shortcuts</h2>
    ${items.map(([k, d]) => `<div class="help-row"><span class="help-key">${k}</span><span class="help-desc">${d}</span></div>`).join('')}
    <div class="help-footer">Press Esc to close</div>
  `;

  overlay.appendChild(content);
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

/* ---------- Scroll Fade ---------- */

function updateScrollFade() {
  const st = resultsContainer.scrollTop;
  const sh = resultsContainer.scrollHeight;
  const ch = resultsContainer.clientHeight;
  if (sh <= ch) { resultsContainer.classList.remove('has-scroll-top', 'has-scroll-bottom'); return; }
  resultsContainer.classList.toggle('has-scroll-top', st > 10);
  resultsContainer.classList.toggle('has-scroll-bottom', st < sh - ch - 10);
}

function scrollSelectedIntoView() {
  const el = resultsContainer.querySelector('.bookmark-item.selected');
  if (!el) return;
  const center = resultsContainer.clientHeight / 2 - el.offsetHeight / 2;
  resultsContainer.scrollTo({ top: el.offsetTop - center, behavior: 'smooth' });
  setTimeout(updateScrollFade, 100);
}

/* ---------- Navigation ---------- */

function moveSelection(dir) {
  let items = [];
  if (currentCommandSuggestions.length > 0) items = currentCommandSuggestions;
  else if (filteredBookmarks.length > 0) items = filteredBookmarks;
  else if (currentSearchSuggestions.length > 0) items = currentSearchSuggestions;

  if (items.length === 0) return;
  const delta = dir === 'down' ? 1 : -1;
  const next = selectedIndex + delta;
  if (next < 0 || next >= items.length) return;

  // Swap selected class without re-rendering
  const domItems = resultsContainer.querySelectorAll('.bookmark-item');
  if (domItems[selectedIndex]) domItems[selectedIndex].classList.remove('selected');
  selectedIndex = next;
  if (domItems[selectedIndex]) domItems[selectedIndex].classList.add('selected');
  scrollSelectedIntoView();
}

/* ---------- Event Listeners ---------- */

searchInput.addEventListener('input', (e) => {
  filterBookmarks(e.target.value);
  updateSmoothCaret();
});
searchInput.addEventListener('focus', () => { updateSmoothCaret(); });
searchInput.addEventListener('blur', () => {
  const caret = document.getElementById('smooth-caret');
  if (caret) caret.classList.remove('visible');
});
searchInput.addEventListener('click', () => updateSmoothCaret());
searchInput.addEventListener('keyup', () => updateSmoothCaret());
resultsContainer.addEventListener('scroll', updateScrollFade);

/* ---------- Smooth Caret ---------- */

const _caretCanvas = document.createElement('canvas');
const _caretCtx = _caretCanvas.getContext('2d');

function measureText(text, font) {
  _caretCtx.font = font;
  return _caretCtx.measureText(text).width;
}

function updateSmoothCaret() {
  const caret = document.getElementById('smooth-caret');
  if (!caret || document.activeElement !== searchInput) return;

  const style = getComputedStyle(searchInput);
  const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const letterSpacing = parseFloat(style.letterSpacing) || 0;

  const text = searchInput.value;
  const cursorPos = searchInput.selectionStart || 0;
  const textBefore = text.substring(0, cursorPos);

  // Measure text width up to cursor, including letter-spacing
  let textWidth = measureText(textBefore, font);
  textWidth += letterSpacing * textBefore.length;

  // Full text width for centering calculation
  const fullText = text || searchInput.placeholder;
  let fullWidth = measureText(text, font);
  fullWidth += letterSpacing * text.length;

  // Input geometry
  const inputRect = searchInput.getBoundingClientRect();
  const areaRect = searchInput.parentElement.getBoundingClientRect();
  const paddingLeft = parseFloat(style.paddingLeft) || 0;

  // Center-aligned: offset from middle
  const inputCenter = inputRect.width / 2;
  const caretX = inputCenter - (fullWidth / 2) + textWidth + paddingLeft - 2;

  // Position relative to search-area
  const offsetLeft = inputRect.left - areaRect.left;
  caret.style.left = (offsetLeft + caretX) + 'px';
  caret.classList.add('visible');
}

document.addEventListener('keydown', (e) => {
  const focused = document.activeElement === searchInput;
  const noMod = !e.ctrlKey && !e.metaKey;

  if (!focused && noMod && !e.altKey && e.key.length === 1 && e.key !== ' ') {
    searchInput.focus();
    return;
  }

  if (focused) {
    if (e.key === 'ArrowDown' && noMod) { e.preventDefault(); moveSelection('down'); }
    else if (e.key === 'ArrowUp' && noMod) { e.preventDefault(); moveSelection('up'); }
    else if (e.key === 'Enter') { e.preventDefault(); handleEnterKey(); }
    else if (e.key === 'Escape') { e.preventDefault(); handleEscapeKey(); }
  }
});

/* ---------- URL Detection ---------- */

function isUrl(q) {
  if (q.startsWith('http://') || q.startsWith('https://')) return true;
  // Match standard domains (e.g. example.com), localhost, or IPs, with optional ports and paths
  const urlRegex = /^(localhost|(\d{1,3}\.){3}\d{1,3}|([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})(:\d+)?(\/.*)?$/;
  return urlRegex.test(q);
}

/* ---------- Key Handlers ---------- */

function handleEnterKey() {
  const query = searchInput.value.trim();

  if (currentCommandSuggestions.length > 0) {
    const cmd = currentCommandSuggestions[selectedIndex];
    searchInput.value = cmd.name;
    currentCommandSuggestions = [];
    currentSearchSuggestions = [];
    executeCommand(cmd.name);
    return;
  }

  if (currentSearchSuggestions.length > 0) {
    const sug = currentSearchSuggestions[selectedIndex];
    window.location.href = (config.searchEngine || DEFAULT_CONFIG.searchEngine) + encodeURIComponent(sug);
    return;
  }

  if (executeCommand(query)) return;

  if (filteredBookmarks.length > 0) {
    openBookmark(filteredBookmarks[selectedIndex]);
  } else if (query && !query.startsWith(':')) {
    if (isUrl(query)) {
      window.location.href = query.startsWith('http') ? query : `https://${query}`;
    } else {
      window.location.href = (config.searchEngine || DEFAULT_CONFIG.searchEngine) + encodeURIComponent(query);
    }
  }
}

function handleEscapeKey() {
  const help = document.getElementById('help-overlay');
  if (help) { help.remove(); }
  else {
    showingAllBookmarks = false;
    searchInput.value = '';
    filterBookmarks('');
    searchInput.focus();
  }
}

/* ---------- Visibility Change ---------- */

document.addEventListener('visibilitychange', async () => {
  if (!document.hidden) {
    const data = await loadSharedData();
    if (data.bookmarks) {
      bookmarks = data.bookmarks;
      if (showingAllBookmarks) { filteredBookmarks = bookmarks; renderResults(); }
      renderIconDock();
    }
    updateGreeting();
  }
});

window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEYS.CONFIG && e.newValue) {
    try {
      config = JSON.parse(e.newValue);
      applyConfig();
    } catch (err) {
      console.error('Failed to parse updated config:', err);
    }
  } else if (e.key === STORAGE_KEYS.BOOKMARKS && e.newValue) {
    try {
      bookmarks = JSON.parse(e.newValue);
      if (showingAllBookmarks) { filteredBookmarks = bookmarks; renderResults(); }
      renderIconDock();
    } catch (err) {
      console.error('Failed to parse updated bookmarks:', err);
    }
  }
});

/* ---------- Init ---------- */

async function init() {
  await loadData();
  applyConfig();
  updateGreeting();
  initQuotes();

  // Aggressively attempt to focus the input area
  const focusSearch = () => {
    if (document.activeElement !== searchInput) {
      searchInput.focus();
      updateSmoothCaret();
    }
  };

  setTimeout(focusSearch, 100);

  // Focus when the tab becomes visible again
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      setTimeout(focusSearch, 50);
    }
  });
}

init();
