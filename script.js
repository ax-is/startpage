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
      --search-bg-opacity: ${(config.searchOpacity !== undefined ? config.searchOpacity : DEFAULT_CONFIG.searchOpacity) / 100};
      --search-blur: ${(config.searchBlur !== undefined ? config.searchBlur : DEFAULT_CONFIG.searchBlur)}px;
    }
    #globe { color: ${config.asciiColor || color}; opacity: ${(parseFloat(config.asciiOpacity !== undefined ? config.asciiOpacity : DEFAULT_CONFIG.asciiOpacity)) / 100}; }
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

  // Apply icon theme classes
  document.body.classList.remove('icon-theme-accent-glow', 'icon-theme-original-colors', 'icon-theme-frosted-orbit', 'icon-theme-cyber-organic', 'icon-theme-favicons-only');
  const theme = config.iconTheme || 'accent-glow';
  document.body.classList.add(`icon-theme-${theme}`);
}

/* ---------- Greeting & Quotes ---------- */

// QUOTES is defined in quotes.js (loaded before this file).

function getRandomQuoteIndex(length) {
  if (length <= 1) return 0;

  const interval = config.quoteInterval || DEFAULT_CONFIG.quoteInterval;

  // "on refresh" mode: change every time, uses sessionStorage to avoid same-as-last
  if (interval === 'refresh') {
    let newIndex = Math.floor(Math.random() * length);
    const lastIndex = sessionStorage.getItem('lastQuoteIndex');
    if (lastIndex !== null && parseInt(lastIndex) === newIndex) {
      newIndex = (newIndex + 1) % length;
    }
    sessionStorage.setItem('lastQuoteIndex', newIndex);
    return newIndex;
  }

  // Timer modes: stay persistent until interval is up
  if (interval !== 'none') {
    const now = Date.now();
    const stored = localStorage.getItem('persistentQuote');
    const intervalMs = (parseInt(interval) || DEFAULT_CONFIG.quoteInterval) * 60000;

    if (stored) {
      try {
        const { index, timestamp } = JSON.parse(stored);
        // If the index is valid and we're within the interval, keep it
        if (index < length && (now - timestamp) < intervalMs) {
          return index;
        }
      } catch (e) {
        console.warn("Failed to parse persistent quote", e);
      }
    }

    // Pick new and store
    const newIndex = Math.floor(Math.random() * length);
    localStorage.setItem('persistentQuote', JSON.stringify({ index: newIndex, timestamp: now }));
    return newIndex;
  }

  return Math.floor(Math.random() * length);
}

let currentQuoteIndex = 0; // Will be set in init/initQuotes

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

    // Update persistent storage so this manual/timer change sticks on refresh
    const interval = config.quoteInterval || DEFAULT_CONFIG.quoteInterval;
    if (interval !== 'none' && interval !== 'refresh') {
      localStorage.setItem('persistentQuote', JSON.stringify({
        index: currentQuoteIndex,
        timestamp: Date.now()
      }));
    }
  }, 800);
}

function initQuotes() {
  const el = document.getElementById('quote');
  if (!el) return;

  const applyInitialQuote = () => {
    currentQuoteIndex = getRandomQuoteIndex(QUOTES.length);
    el.textContent = QUOTES[currentQuoteIndex];
    el.classList.add('fade-in');

    const interval = config.quoteInterval || DEFAULT_CONFIG.quoteInterval;

    if (interval === 'none') {
      // Show the current quote statically — no auto-rotation, no timer.
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

    if (quoteIntervalId) clearInterval(quoteIntervalId);

    // Only start timer if it's not "refresh" only
    if (interval !== 'refresh') {
      const minutes = parseInt(interval) || DEFAULT_CONFIG.quoteInterval;
      quoteIntervalId = setInterval(showNextQuote, minutes * 60000);
    }
  };

  // Load custom quotes if available
  if (config.quoteFile) {
    try {
      if (config.quoteFile.startsWith('data:')) {
        fetch(config.quoteFile)
          .then(res => res.text())
          .then(text => {
            const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            if (lines.length > 0) {
              QUOTES = lines;
              applyInitialQuote();
            }
          })
          .catch(err => {
            console.error('Failed to load quote file', err);
            applyInitialQuote();
          });
      } else {
        const lines = config.quoteFile.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length > 0) {
          QUOTES = lines;
        }
        applyInitialQuote();
      }
    } catch (e) {
      console.error('Invalid quote file data', e);
      applyInitialQuote();
    }
  } else {
    applyInitialQuote();
  }

  const nextBtn = document.getElementById('next-quote-btn');
  if (nextBtn) {
    nextBtn.onclick = () => {
      // Add rotation animation class
      nextBtn.classList.add('rotating');

      // Cleanup class after animation completes (matching CSS duration)
      nextBtn.addEventListener('animationend', () => {
        nextBtn.style.transition = 'none';
        nextBtn.classList.remove('rotating');
        // Force reflow or wait a frame
        setTimeout(() => {
          nextBtn.style.transition = '';
        }, 10);
      }, { once: true });

      showNextQuote();
      const interval = config.quoteInterval || DEFAULT_CONFIG.quoteInterval;
      if (quoteIntervalId && interval !== 'refresh') {
        const minutes = parseInt(interval) || DEFAULT_CONFIG.quoteInterval;
        clearInterval(quoteIntervalId);
        quoteIntervalId = setInterval(showNextQuote, minutes * 60000);
      }
    };
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
  ':config': () => { toggleConfig(); },
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

function calculateRelevanceScore(bookmark, query) {
  const lowerQuery = query.toLowerCase();
  const lowerName = bookmark.name.toLowerCase();
  const lowerUrl = bookmark.url.toLowerCase();
  let score = 0;

  // Exact Name Match
  if (lowerName === lowerQuery) score += 1000;
  // Name Starts With
  else if (lowerName.startsWith(lowerQuery)) score += 600;
  // Name Contains
  else if (lowerName.includes(lowerQuery)) score += 200;

  // Tag Matches
  bookmark.tags.forEach(tag => {
    const lowerTag = tag.toLowerCase();
    if (lowerTag === lowerQuery) score += 800;
    else if (lowerTag.startsWith(lowerQuery)) score += 400;
    else if (lowerTag.includes(lowerQuery)) score += 100;
  });

  // URL Match
  const displayUrl = lowerUrl.replace(/^https?:\/\//, '').replace(/^www\./, '');
  if (displayUrl.includes(lowerQuery)) score += 50;

  return score;
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

  // Filter and then sort by relevance score
  filteredBookmarks = bookmarks
    .map(b => ({ ...b, _score: calculateRelevanceScore(b, query) }))
    .filter(b => b._score > 0)
    .sort((a, b) => b._score - a._score);

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
const SIMPLE_ICONS_CDN = 'https://unpkg.com/simple-icons@v11/icons';

// Fallback icon renderer — defined at top level to avoid recreating per bookmark
function applyIconFallback(link, bm) {
  try {
    const validUrl = (bm.url.startsWith('http://') || bm.url.startsWith('https://')) ? bm.url : 'https://' + bm.url;
    const hostname = new URL(validUrl).hostname;
    link.innerHTML = `<img src="https://www.google.com/s2/favicons?domain=${hostname}&sz=64" alt="${bm.name}" style="width: 24px; height: 24px; border-radius: 4px; transition: transform 0.2s;">`;
  } catch (e) {
    const initial = bm.name ? bm.name.trim().charAt(0).toUpperCase() : '?';
    link.innerHTML = `<span style="font-weight: 700; font-size: 24px; font-family: var(--font-main);">${initial}</span>`;
  }
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
    const brandColor = ICON_BRAND_COLORS[slug];
    const currentTheme = config.iconTheme || 'accent-glow';

    if (brandColor) {
      link.style.setProperty('--brand-color', brandColor);
      if (currentTheme === 'original-colors' || currentTheme === 'frosted-orbit' || currentTheme === 'cyber-organic') {
        link.style.color = brandColor;
      } else if (currentTheme === 'accent-glow') {
        link.style.color = 'var(--color-accent)';
      }
    } else if (currentTheme === 'accent-glow') {
      link.style.color = 'var(--color-accent)';
    }

    // Fetch raw SVG from Simple Icons unpkg CDN
    const skipSvg = currentTheme === 'favicons-only';

    if (skipSvg) {
      applyIconFallback(link, bm);
    } else {
      fetch(`${SIMPLE_ICONS_CDN}/${slug}.svg`)
        .then(res => {
          if (!res.ok) throw new Error('Icon not found');
          return res.text();
        })
        .then(svgText => {
          link.innerHTML = svgText;
        })
        .catch(() => {
          applyIconFallback(link, bm);
        });
    }

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

function createSearchIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.classList.add('suggestion-icon');
  svg.innerHTML = '<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>';
  return svg;
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

    const content = document.createElement('div');
    content.className = 'suggestion-content';
    content.appendChild(createSearchIcon());
    content.appendChild(createTextElement('bookmark-name', sug));

    item.appendChild(content);

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
  const isConfigOpen = document.getElementById('config-overlay')?.classList.contains('open');

  if (!focused && noMod && !e.altKey && e.key.length === 1 && e.key !== ' ' && !isConfigOpen) {
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
    // Reload bookmarks and config in case they were edited in another tab/page
    const data = await loadSharedData();
    if (data.bookmarks) {
      bookmarks = data.bookmarks;
      if (showingAllBookmarks) { filteredBookmarks = bookmarks; renderResults(); }
      renderIconDock();
    }
    updateGreeting();
    // Re-focus the search input
    setTimeout(() => {
      if (document.activeElement !== searchInput) {
        searchInput.focus();
        updateSmoothCaret();
      }
    }, 50);
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

function updateClock() {
  const clockEl = document.getElementById('clock-watermark');
  if (!clockEl) return;
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  clockEl.textContent = `${hours}:${minutes}`;
}

async function init() {
  await loadData();
  applyConfig();
  updateGreeting();
  initQuotes();
  updateClock();
  setInterval(updateClock, 10000); // Update every 10s

  // Clean the URL in the address bar (hide index.html and autofocus param)
  try {
    // Reverted to a safer version that keeps index.html so you can still reload
    window.history.replaceState(null, '', 'index.html');
  } catch (e) {
    console.warn('URL cleanup failed:', e);
  }

  // Aggressively attempt to focus the input area
  const focusSearch = () => {
    if (document.activeElement !== searchInput) {
      searchInput.focus();
      updateSmoothCaret();
    }
  };

  setTimeout(focusSearch, 100);
}

init();


// Config Overlay Logic
function toggleConfig() {
  const overlay = document.getElementById('config-overlay');
  const btn = document.getElementById('toggleConfigBtn');
  const isOpen = overlay?.classList.toggle('open');
  if (isOpen) btn?.classList.add('active');
  else btn?.classList.remove('active');
}

document.getElementById('toggleConfigBtn')?.addEventListener('click', toggleConfig);

window.addEventListener('configUpdated', (e) => {
  config = e.detail;
  applyConfig();
  renderIconDock();
});

// Refresh icon dock when returning from bookmarks.html via back button (bfcache)
window.addEventListener('pageshow', async (e) => {
  if (e.persisted) {
    const data = await loadSharedData();
    if (data.bookmarks) {
      bookmarks = data.bookmarks;
      renderIconDock();
    }
  }
});
