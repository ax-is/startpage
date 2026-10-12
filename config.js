(function () {
  // Derived from DEFAULT_CONFIG so it always stays in sync — never edit this manually.
  const CONFIG_FIELDS = Object.keys(DEFAULT_CONFIG);

  const THEMES = {
    catppuccin: {
      backgroundColor: '#1e1e2e',
      textColor: '#cdd6f4',
      textColor2: '#a6adc8',
      accentColor: '#cba6f7',
      asciiColor: '#cba6f7'
    },
    gruvbox: {
      backgroundColor: '#282828',
      textColor: '#ebdbb2',
      textColor2: '#a89984',
      accentColor: '#fabd2f',
      asciiColor: '#fabd2f'
    },
    orbit: {
      backgroundColor: '#0a0e1a',
      textColor: '#e0e0e0',
      textColor2: '#cccccc',
      accentColor: '#4a9eff',
      asciiColor: '#4a9eff'
    },
    peppermint: {
      backgroundColor: '#05100d',
      textColor: '#e0f0e8',
      textColor2: '#b0d0c0',
      accentColor: '#43ffaf',
      asciiColor: '#43ffaf'
    }
  };

  const FONT_CANDIDATES = [
    // Monospace & Coding
    { name: 'JetBrains Mono', category: 'Monospace' },
    { name: 'Cascadia Code', category: 'Monospace' },
    { name: 'Cascadia Mono', category: 'Monospace' },
    { name: 'Consolas', category: 'Monospace' },
    { name: 'Fira Code', category: 'Monospace' },
    { name: 'Source Code Pro', category: 'Monospace' },
    { name: 'Courier New', category: 'Monospace' },
    { name: 'Lucida Console', category: 'Monospace' },
    { name: 'Menlo', category: 'Monospace' },
    { name: 'Monaco', category: 'Monospace' },
    { name: 'SF Mono', category: 'Monospace' },
    { name: 'Ubuntu Mono', category: 'Monospace' },
    { name: 'Liberation Mono', category: 'Monospace' },
    { name: 'DejaVu Sans Mono', category: 'Monospace' },
    { name: 'Inconsolata', category: 'Monospace' },
    { name: 'Hack', category: 'Monospace' },

    // Sans-Serif (Windows, macOS, Linux, Modern)
    { name: 'Segoe UI', category: 'Sans-Serif' },
    { name: 'Arial', category: 'Sans-Serif' },
    { name: 'Calibri', category: 'Sans-Serif' },
    { name: 'Trebuchet MS', category: 'Sans-Serif' },
    { name: 'Verdana', category: 'Sans-Serif' },
    { name: 'Tahoma', category: 'Sans-Serif' },
    { name: 'Candara', category: 'Sans-Serif' },
    { name: 'Corbel', category: 'Sans-Serif' },
    { name: 'Franklin Gothic Medium', category: 'Sans-Serif' },
    { name: 'Inter', category: 'Sans-Serif' },
    { name: 'Roboto', category: 'Sans-Serif' },
    { name: 'SF Pro', category: 'Sans-Serif' },
    { name: 'SF Pro Display', category: 'Sans-Serif' },
    { name: 'Helvetica Neue', category: 'Sans-Serif' },
    { name: 'Helvetica', category: 'Sans-Serif' },
    { name: 'Avenir', category: 'Sans-Serif' },
    { name: 'Avenir Next', category: 'Sans-Serif' },
    { name: 'Gill Sans', category: 'Sans-Serif' },
    { name: 'Futura', category: 'Sans-Serif' },
    { name: 'Ubuntu', category: 'Sans-Serif' },
    { name: 'Cantarell', category: 'Sans-Serif' },
    { name: 'DejaVu Sans', category: 'Sans-Serif' },
    { name: 'Liberation Sans', category: 'Sans-Serif' },
    { name: 'Noto Sans', category: 'Sans-Serif' },

    // Serif
    { name: 'Georgia', category: 'Serif' },
    { name: 'Cambria', category: 'Serif' },
    { name: 'Palatino Linotype', category: 'Serif' },
    { name: 'Times New Roman', category: 'Serif' },
    { name: 'Baskerville', category: 'Serif' },
    { name: 'Garamond', category: 'Serif' },
    { name: 'Constantia', category: 'Serif' },
    { name: 'Didot', category: 'Serif' },

    // Display
    { name: 'Impact', category: 'Display' },
    { name: 'Comic Sans MS', category: 'Display' }
  ];

  function detectInstalledFonts() {
    const testString = 'mmmmmmmmmmlliWWWW1234567890!@#$%^&*()';
    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    const baseWidths = {};
    baseFonts.forEach(base => {
      ctx.font = `72px ${base}`;
      baseWidths[base] = ctx.measureText(testString).width;
    });

    const available = [];
    FONT_CANDIDATES.forEach(item => {
      if (item.name === 'JetBrains Mono') {
        available.push(item);
        return;
      }
      let detected = false;
      for (const base of baseFonts) {
        ctx.font = `72px "${item.name}", ${base}`;
        const width = ctx.measureText(testString).width;
        if (width !== baseWidths[base]) {
          detected = true;
          break;
        }
      }
      if (detected) available.push(item);
    });
    return available;
  }

  async function getSystemFonts() {
    let detected = detectInstalledFonts();
    if (typeof window.queryLocalFonts === 'function') {
      try {
        const localFonts = await window.queryLocalFonts();
        if (localFonts && localFonts.length > 0) {
          const seen = new Set(detected.map(f => f.name.toLowerCase()));
          localFonts.forEach(f => {
            if (!seen.has(f.family.toLowerCase())) {
              seen.add(f.family.toLowerCase());
              detected.push({ name: f.family, category: 'All System Fonts' });
            }
          });
        }
      } catch (e) {
        // Fallback canvas detector works seamlessly
      }
    }
    return detected;
  }

  let _fontsPopulated = false;
  async function populateSystemFonts() {
    if (_fontsPopulated) return;
    const fontSelect = document.getElementById('fontFamilySelect');
    if (!fontSelect) return;

    const fonts = await getSystemFonts();
    fontSelect.innerHTML = '';

    const categories = {};
    fonts.forEach(f => {
      const cat = f.category || 'System Fonts';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(f.name);
    });

    if (!categories['Monospace']) categories['Monospace'] = [];
    if (!categories['Monospace'].includes('JetBrains Mono')) {
      categories['Monospace'].unshift('JetBrains Mono');
    }

    const order = ['Monospace', 'Sans-Serif', 'Serif', 'Display', 'All System Fonts'];
    const allCats = Object.keys(categories).sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });

    allCats.forEach(cat => {
      const headerOpt = document.createElement('option');
      headerOpt.disabled = true;
      headerOpt.value = '';
      headerOpt.textContent = `── ${cat} ──`;
      headerOpt.style.backgroundColor = 'var(--color-bg)';
      headerOpt.style.color = 'var(--color-accent)';
      headerOpt.style.fontWeight = '600';
      fontSelect.appendChild(headerOpt);

      categories[cat].sort((a, b) => a.localeCompare(b)).forEach(fontName => {
        const opt = document.createElement('option');
        if (cat === 'Sans-Serif') opt.value = `'${fontName}', sans-serif`;
        else if (cat === 'Serif') opt.value = `'${fontName}', serif`;
        else if (cat === 'Monospace') opt.value = `'${fontName}', monospace`;
        else opt.value = `'${fontName}', system-ui, sans-serif`;

        opt.textContent = fontName;
        opt.style.fontFamily = `'${fontName}', monospace`;
        opt.style.backgroundColor = 'var(--color-bg)';
        opt.style.color = 'var(--color-fg)';
        fontSelect.appendChild(opt);
      });
    });

    const genericHeader = document.createElement('option');
    genericHeader.disabled = true;
    genericHeader.value = '';
    genericHeader.textContent = '── Generic ──';
    genericHeader.style.backgroundColor = 'var(--color-bg)';
    genericHeader.style.color = 'var(--color-accent)';
    genericHeader.style.fontWeight = '600';
    fontSelect.appendChild(genericHeader);

    ['monospace', 'sans-serif', 'serif', 'system-ui'].forEach(gen => {
      const opt = document.createElement('option');
      opt.value = gen;
      opt.textContent = gen;
      opt.style.backgroundColor = 'var(--color-bg)';
      opt.style.color = 'var(--color-fg)';
      fontSelect.appendChild(opt);
    });

    const customHeader = document.createElement('option');
    customHeader.disabled = true;
    customHeader.value = '';
    customHeader.textContent = '── Custom ──';
    customHeader.style.backgroundColor = 'var(--color-bg)';
    customHeader.style.color = 'var(--color-accent)';
    customHeader.style.fontWeight = '600';
    fontSelect.appendChild(customHeader);

    const customOpt = document.createElement('option');
    customOpt.value = 'custom';
    customOpt.textContent = '✎ custom font...';
    customOpt.style.backgroundColor = 'var(--color-bg)';
    customOpt.style.color = 'var(--color-fg)';
    fontSelect.appendChild(customOpt);

    _fontsPopulated = true;
  }

  // Cache of DOM elements for each config field — populated once on first use.
  let _configElementCache = null;
  function getConfigElements() {
    if (!_configElementCache) {
      _configElementCache = {};
      CONFIG_FIELDS.forEach(field => {
        const el = document.getElementById(field);
        if (el) _configElementCache[field] = el;
      });
    }
    return _configElementCache;
  }

  function getConfigFromInputs() {
    const elements = getConfigElements();
    const config = CONFIG_FIELDS.reduce((acc, field) => {
      const el = elements[field];
      if (el) {
        if (el.type === 'checkbox') {
          acc[field] = el.checked;
        } else {
          acc[field] = el.value;
        }
      }
      return acc;
    }, {});

    // Handle quote interval (select + optional custom input)
    const qtiSelect = document.getElementById('quoteIntervalSelect');
    const qtiCustom = document.getElementById('quoteIntervalCustom');
    if (qtiSelect) {
      if (qtiSelect.value === 'custom' && qtiCustom) {
        config.quoteInterval = qtiCustom.value;
      } else {
        config.quoteInterval = qtiSelect.value;
      }
    }

    // Handle search engine (select + optional custom input)
    const searchSelect = document.getElementById('searchEngineSelect');
    const searchInput = document.getElementById('searchEngine');
    if (searchSelect && searchInput) {
      if (searchSelect.value === 'custom') {
        config.searchEngine = searchInput.value;
      } else {
        config.searchEngine = searchSelect.value;
      }
    }

    // Handle font family (select + optional custom input)
    const fontSelect = document.getElementById('fontFamilySelect');
    const fontInput = document.getElementById('fontFamily');
    if (fontSelect && fontInput) {
      if (fontSelect.value === 'custom') {
        config.fontFamily = fontInput.value;
      } else {
        config.fontFamily = fontSelect.value;
      }
    }

    return config;
  }

  function updateSliderValue(sliderId, valueId) {
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueId);
    if (slider && valueDisplay) valueDisplay.textContent = slider.value;
  }

  function setInputsFromConfig(config) {
    CONFIG_FIELDS.forEach(field => {
      const el = document.getElementById(field);
      if (el && config[field] !== undefined) {
        if (el.type === 'checkbox') {
          el.checked = !!config[field];
        } else {
          el.value = config[field] || '';
        }
      }
    });

    // Handle quote interval inputs
    const interval = config.quoteInterval || 30;
    const select = document.getElementById('quoteIntervalSelect');
    const custom = document.getElementById('quoteIntervalCustom');

    if (select && custom) {
      if (['none', 'refresh', '15', '30', '60'].includes(String(interval))) {
        select.value = String(interval);
        custom.style.display = 'none';
      } else {
        select.value = 'custom';
        custom.value = interval;
        custom.style.display = 'block';
      }
    }

    // Handle search engine inputs
    const engine = config.searchEngine || 'https://www.google.com/search?q=';
    const searchSelect = document.getElementById('searchEngineSelect');
    const searchInput = document.getElementById('searchEngine');
    const searchCustomRow = document.getElementById('customEngineRow');

    if (searchSelect && searchInput && searchCustomRow) {
      const options = Array.from(searchSelect.options).map(opt => opt.value);
      if (options.includes(engine)) {
        searchSelect.value = engine;
        searchCustomRow.style.display = 'none';
      } else {
        searchSelect.value = 'custom';
        searchInput.value = engine;
        searchCustomRow.style.display = 'flex';
      }
    }

    // Handle font family inputs
    const currentFont = config.fontFamily || DEFAULT_CONFIG.fontFamily;
    const fontSelect = document.getElementById('fontFamilySelect');
    const fontInput = document.getElementById('fontFamily');
    const fontCustomRow = document.getElementById('customFontRow');

    if (fontSelect && fontInput) {
      fontInput.value = currentFont;
      if (fontCustomRow) {
        const norm = s => (s || '').replace(/['",]/g, '').trim().toLowerCase();
        const target = norm(currentFont);
        let match = Array.from(fontSelect.options).find(opt => !opt.disabled && opt.value !== 'custom' && norm(opt.value) === target);
        if (!match) {
          match = Array.from(fontSelect.options).find(opt => !opt.disabled && opt.value !== 'custom' && (norm(opt.textContent) === target || target.includes(norm(opt.textContent)) || norm(opt.textContent).includes(target)));
        }
        if (match) {
          fontSelect.value = match.value;
          fontCustomRow.style.display = 'none';
        } else {
          fontSelect.value = 'custom';
          fontCustomRow.style.display = 'flex';
        }
      }
    }

    // Update quote file name display
    const quoteFileNameSpan = document.getElementById('quoteFileName');
    if (quoteFileNameSpan && config.quoteFileName) {
      quoteFileNameSpan.textContent = config.quoteFileName;
    }

    updateSliderValue('backgroundBlur', 'blurValue');
    updateSliderValue('backgroundBrightness', 'brightnessValue');
    updateSliderValue('asciiOpacity', 'opacityValue');
    updateSliderValue('asciiSpeed', 'speedValue');
    updateSliderValue('searchOpacity', 'searchOpacityValue');
    updateSliderValue('searchBlur', 'searchBlurValue');
    updateSliderValue('baseFontSize', 'fontSizeDisplay');
  }

  async function loadSettings() {
    await populateSystemFonts();
    const data = await loadSharedData();
    const config = data.config;
    setInputsFromConfig(config);

    const pickQuoteBtn = document.getElementById('pickQuoteBtn');
    if (config.quoteFile && config.quoteFile.length > 0 && pickQuoteBtn) {
      pickQuoteBtn.innerText = '✅ loaded';
    }
    applySharedTheme(config, 'index');
    window.dispatchEvent(new CustomEvent('configUpdated', { detail: config }));
    if (config.tabIcon) applySharedFavicon(config.tabIcon);
  }

  function showStatus(msg) {
    const el = document.getElementById('statusMsg');
    if (el) {
      el.textContent = msg;
      el.style.opacity = '1';
      setTimeout(() => { el.style.opacity = '0'; }, 2500);
    }
  }

  function saveSettings(isAuto = false) {
    try {
      const config = getConfigFromInputs();
      saveSharedData(STORAGE_KEYS.CONFIG, config);
      applySharedTheme(config, 'index');
      window.dispatchEvent(new CustomEvent('configUpdated', { detail: config }));

      if (!isAuto) {
        showStatus('settings saved ✓');
        setTimeout(() => {
          const status = document.getElementById('statusMsg');
          if (status) status.style.opacity = '0';
        }, 2000);
      }
    } catch (e) {
      console.error('saveSettings failed:', e);
      if (!isAuto) showStatus('save failed ❌');
    }
  }

  function resetSettings() {
    saveSharedData(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG);
    setInputsFromConfig(DEFAULT_CONFIG);
    applySharedTheme(DEFAULT_CONFIG, 'index');
    window.dispatchEvent(new CustomEvent('configUpdated', { detail: DEFAULT_CONFIG }));
    showStatus('reset successful ↺');
  }

  // Helper to prevent excessive storage writes during rapid input
  let saveDebounceTimer = null;
  function debouncedSave() {
    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(() => {
      saveSettings(true); // Silent save
    }, 400);
  }

  document.addEventListener('DOMContentLoaded', () => {

    CONFIG_FIELDS.forEach(field => {
      const element = document.getElementById(field);
      if (!element) return;

      // Use 'input' for immediate feedback, 'change' for final value
      element.addEventListener('input', () => {
        const config = getConfigFromInputs();
        applySharedTheme(config, 'index');
        window.dispatchEvent(new CustomEvent('configUpdated', { detail: config }));

        // If manually changing a color, set theme selector to custom
        if (['backgroundColor', 'textColor', 'textColor2', 'accentColor', 'asciiColor'].includes(field)) {
          const themeSelect = document.getElementById('themePresetSelect');
          if (themeSelect) themeSelect.value = 'custom';
        }

        if (field === 'tabIcon') applySharedFavicon(element.value);

        // Auto-save: Immediate for non-text, debounced for text
        if (element.type === 'range' || element.type === 'color' || element.type === 'checkbox' || element.tagName === 'SELECT') {
          debouncedSave();
        }
      });

      if (element.type === 'text') {
        element.addEventListener('focus', function () { this.select(); });
        element.addEventListener('input', debouncedSave);
      }
    });

    const blurSlider = document.getElementById('backgroundBlur');
    if (blurSlider) blurSlider.addEventListener('input', () => updateSliderValue('backgroundBlur', 'blurValue'));

    const brightnessSlider = document.getElementById('backgroundBrightness');
    if (brightnessSlider) brightnessSlider.addEventListener('input', () => updateSliderValue('backgroundBrightness', 'brightnessValue'));

    const opacSlider = document.getElementById('asciiOpacity');
    if (opacSlider) opacSlider.addEventListener('input', () => updateSliderValue('asciiOpacity', 'opacityValue'));

    const speedSlider = document.getElementById('asciiSpeed');
    if (speedSlider) speedSlider.addEventListener('input', () => updateSliderValue('asciiSpeed', 'speedValue'));

    const sOpacitySlider = document.getElementById('searchOpacity');
    if (sOpacitySlider) {
      sOpacitySlider.addEventListener('input', () => {
        updateSliderValue('searchOpacity', 'searchOpacityValue');
        saveSettings();
      });
    }

    const sBlurSlider = document.getElementById('searchBlur');
    if (sBlurSlider) {
      sBlurSlider.addEventListener('input', () => {
        updateSliderValue('searchBlur', 'searchBlurValue');
        saveSettings();
      });
    }

    const fontSizeSlider = document.getElementById('baseFontSize');
    if (fontSizeSlider) fontSizeSlider.addEventListener('input', () => updateSliderValue('baseFontSize', 'fontSizeDisplay'));

    // Font family dropdown handler
    const fontSelect = document.getElementById('fontFamilySelect');
    if (fontSelect) {
      fontSelect.addEventListener('change', (e) => {
        const customRow = document.getElementById('customFontRow');
        const input = document.getElementById('fontFamily');
        if (customRow && input) {
          if (e.target.value === 'custom') {
            customRow.style.display = 'flex';
            input.focus();
          } else {
            customRow.style.display = 'none';
            input.value = e.target.value;
          }
          const config = getConfigFromInputs();
          applySharedTheme(config, 'index');
          window.dispatchEvent(new CustomEvent('configUpdated', { detail: config }));
          saveSettings(true);
        }
      });
    }

    const applyFontBtn = document.getElementById('applyFontBtn');
    const fontFamilyInput = document.getElementById('fontFamily');
    if (applyFontBtn && fontFamilyInput) {
      applyFontBtn.addEventListener('click', async () => {
        const newFont = fontFamilyInput.value;
        const data = await loadSharedData();
        data.config.fontFamily = newFont;

        // Save and Apply
        await saveSharedData(STORAGE_KEYS.CONFIG, data.config);
        applySharedTheme(data.config, 'index');
        window.dispatchEvent(new CustomEvent('configUpdated', { detail: data.config }));

        const status = document.getElementById('statusMsg');
        if (status) {
          status.textContent = 'font applied ✓';
          status.style.opacity = '1';
          setTimeout(() => status.style.opacity = '0', 1500);
        }
      });
    }

    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) saveBtn.addEventListener('click', saveSettings);

    const rtBtn = document.getElementById('resetBtn');
    if (rtBtn) rtBtn.addEventListener('click', resetSettings);

    // Image file picker
    const pickImgBtn = document.getElementById('pickImageBtn');
    if (pickImgBtn) {
      pickImgBtn.addEventListener('click', () => {
        document.getElementById('imageFilePicker').click();
      });
    }

    const imgFilePicker = document.getElementById('imageFilePicker');
    if (imgFilePicker) {
      imgFilePicker.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10485760) {
          showStatus('file too large (<10MB) ❌');
          return;
        }

        const reader = new FileReader();
        reader.onload = (evt) => {
          document.getElementById('backgroundImage').value = evt.target.result;
          const config = getConfigFromInputs();
          applySharedTheme(config, 'index');
          window.dispatchEvent(new CustomEvent('configUpdated', { detail: config }));
          showStatus('image loaded ✓');
        };
        reader.readAsDataURL(file);
      });
    }

    // Quote file picker
    const pickQtBtn = document.getElementById('pickQuoteBtn');
    if (pickQtBtn) {
      pickQtBtn.addEventListener('click', () => {
        document.getElementById('quoteFilePicker').click();
      });
    }

    const qtFilePicker = document.getElementById('quoteFilePicker');
    if (qtFilePicker) {
      qtFilePicker.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
          // Store the raw text content directly
          const textContent = e.target.result;

          if (textContent.length > 500000) {
            showStatus('file too large (<500KB) ❌');
            return;
          }

          // Create or find hidden input for content
          let hidden = document.getElementById('quoteFile');
          if (!hidden) {
            hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.id = 'quoteFile';
            document.body.appendChild(hidden);
          }
          hidden.value = textContent;

          // Use existing visible input for filename display
          const filenameDisplay = document.getElementById('quoteFileNameInput');
          if (filenameDisplay) {
            filenameDisplay.value = file.name;
          }

          document.getElementById('pickQuoteBtn').innerText = '✅ loaded';

          // Auto-save to ensure it persists
          saveSettings();
        };
        reader.readAsText(file); // Read as text, not DataURL
      });
    }

    // Quote interval handler
    const qtIntervalSelect = document.getElementById('quoteIntervalSelect');
    if (qtIntervalSelect) {
      qtIntervalSelect.addEventListener('change', (e) => {
        const custom = document.getElementById('quoteIntervalCustom');
        if (custom) {
          if (e.target.value === 'custom') {
            custom.style.display = 'block';
            custom.focus();
          } else {
            custom.style.display = 'none';
            saveSettings(true);
          }
        }
      });
    }

    // Theme preset handler
    const themeSelect = document.getElementById('themePresetSelect');
    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        const theme = THEMES[e.target.value];
        if (theme) {
          Object.keys(theme).forEach(key => {
            const el = document.getElementById(key);
            if (el) el.value = theme[key];
          });
          const config = getConfigFromInputs();
          applySharedTheme(config, 'index');
          window.dispatchEvent(new CustomEvent('configUpdated', { detail: config }));
        }
      });
    }

    // Search engine handler
    const engineSelect = document.getElementById('searchEngineSelect');
    if (engineSelect) {
      engineSelect.addEventListener('change', (e) => {
        const customRow = document.getElementById('customEngineRow');
        const input = document.getElementById('searchEngine');
        if (customRow && input) {
          if (e.target.value === 'custom') {
            customRow.style.display = 'flex';
            input.focus();
          } else {
            customRow.style.display = 'none';
            input.value = e.target.value;
          }
          // Apply theme immediately to update engine logic in shared state
          const config = getConfigFromInputs();
          applySharedTheme(config, 'index');
          window.dispatchEvent(new CustomEvent('configUpdated', { detail: config }));
          saveSettings(true);
        }
      });
    }

    // Clear Image Handler
    const clrImgBtn = document.getElementById('clearImageBtn');
    if (clrImgBtn) {
      clrImgBtn.addEventListener('click', () => {
        document.getElementById('backgroundImage').value = '';
        const preview = document.getElementById('imgPreview');
        if (preview) preview.src = '';
        saveSettings();
      });
    }

    // Clear Quote Handler
    const clrQtBtn = document.getElementById('clearQuoteBtn');
    if (clrQtBtn) {
      clrQtBtn.addEventListener('click', () => {
        const qInput = document.getElementById('quoteFileNameInput');
        if (qInput) qInput.value = '';

        const qFile = document.getElementById('quoteFile');
        if (qFile) qFile.value = '';

        saveSettings();
      });
    }

    loadSettings();
  });
})();
