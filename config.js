const CONFIG_FIELDS = [
  'backgroundColor',
  'textColor',
  'textColor2',
  'accentColor',
  'searchEngine',
  'backgroundImage',
  'backgroundBlur',
  'bgAnimation',
  'asciiColor',
  'asciiOpacity',
  'userName',
  'customGreeting',
  'quoteInterval',
  'quoteFile',
  'quoteFileName',
  'tabName',
  'asciiSpeed'
];


function getConfigFromInputs() {
  const config = CONFIG_FIELDS.reduce((acc, field) => {
    const el = document.getElementById(field);
    if (el) acc[field] = el.value;
    return acc;
  }, {});

  // Handle quote interval
  const select = document.getElementById('quoteIntervalSelect');
  const custom = document.getElementById('quoteIntervalCustom');
  if (select && select.value === 'custom' && custom) {
    config.quoteInterval = custom.value || 30;
  } else if (select) {
    config.quoteInterval = select.value;
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
    if (el && config[field] !== undefined) el.value = config[field] || '';
  });

  // Handle quote interval inputs
  const interval = config.quoteInterval || 30;
  const select = document.getElementById('quoteIntervalSelect');
  const custom = document.getElementById('quoteIntervalCustom');

  if (select && custom) {
    if (['none', '15', '30', '60'].includes(String(interval))) {
      select.value = String(interval);
      custom.style.display = 'none';
    } else {
      select.value = 'custom';
      custom.value = interval;
      custom.style.display = 'block';
    }
  }

  // Update quote file name display
  const quoteFileNameSpan = document.getElementById('quoteFileName');
  if (quoteFileNameSpan && config.quoteFileName) {
    quoteFileNameSpan.textContent = config.quoteFileName;
  }

  updateSliderValue('backgroundBlur', 'blurValue');
  updateSliderValue('asciiOpacity', 'opacityValue');
  updateSliderValue('asciiSpeed', 'speedValue');
}

async function loadSettings() {
  const data = await loadSharedData();
  const config = data.config;
  setInputsFromConfig(config);

  const pickQuoteBtn = document.getElementById('pickQuoteBtn');
  if (config.quoteFile && config.quoteFile.length > 0 && pickQuoteBtn) {
    pickQuoteBtn.innerText = '✅ loaded';
  }
  applySharedTheme(config, 'config');
}

function showStatus(msg) {
  const el = document.getElementById('statusMsg');
  if (el) {
    el.textContent = msg;
    el.style.opacity = '1';
    setTimeout(() => { el.style.opacity = '0'; }, 2500);
  }
}

function saveSettings() {
  const config = getConfigFromInputs();
  saveSharedData(STORAGE_KEYS.CONFIG, config);
  applySharedTheme(config, 'config');
  showStatus('settings saved ✓');
}

function resetSettings() {
  saveSharedData(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG);
  setInputsFromConfig(DEFAULT_CONFIG);
  applySharedTheme(DEFAULT_CONFIG, 'config');
  showStatus('reset successful ↺');
}

document.addEventListener('DOMContentLoaded', () => {

  CONFIG_FIELDS.forEach(field => {
    const element = document.getElementById(field);
    if (!element) return;
    element.addEventListener('input', () => {
      const config = getConfigFromInputs();
      applySharedTheme(config, 'config');
    });
    if (element.type === 'text') {
      element.addEventListener('focus', function () { this.select(); });
    }
  });

  const blurSlider = document.getElementById('backgroundBlur');
  if (blurSlider) blurSlider.addEventListener('input', () => updateSliderValue('backgroundBlur', 'blurValue'));

  const opacSlider = document.getElementById('asciiOpacity');
  if (opacSlider) opacSlider.addEventListener('input', () => updateSliderValue('asciiOpacity', 'opacityValue'));

  const speedSlider = document.getElementById('asciiSpeed');
  if (speedSlider) speedSlider.addEventListener('input', () => updateSliderValue('asciiSpeed', 'speedValue'));

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

      if (file.size > 2500000) {
        showStatus('file too large (<2.5MB) ❌');
        return;
      }

      const reader = new FileReader();
      reader.onload = (evt) => {
        document.getElementById('backgroundImage').value = evt.target.result;
        const config = getConfigFromInputs();
        applySharedTheme(config, 'config');
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

        // Create hidden input for content
        let hidden = document.getElementById('quoteFile');
        if (!hidden) {
          hidden = document.createElement('input');
          hidden.type = 'hidden';
          hidden.id = 'quoteFile';
          document.body.appendChild(hidden);
        }
        hidden.value = textContent;

        // Store filename for display
        let hiddenName = document.getElementById('quoteFileNameInput');
        if (!hiddenName) {
          hiddenName = document.createElement('input');
          hiddenName.type = 'hidden';
          hiddenName.id = 'quoteFileNameInput'; // distinct ID
          document.body.appendChild(hiddenName);
        }
        hiddenName.value = file.name;

        document.getElementById('pickQuoteBtn').innerText = '✅ loaded';
        document.getElementById('quoteFileName').textContent = file.name;

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
        }
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

      const qName = document.getElementById('quoteFileName');
      if (qName) qName.textContent = ''; // Clear legacy span if exists
      saveSettings();
    });
  }

  loadSettings();
});
