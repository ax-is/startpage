let bookmarks = [];
let isDeleting = false;

async function loadConfigAndBookmarks() {
  const data = await loadSharedData();
  applySharedTheme(data.config, 'bookmarks');
  bookmarks = data.bookmarks;
  renderBookmarks();
}

let draggedIndex = null;

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function clearDragOverClass() {
  document.querySelectorAll('.bookmark-edit-item').forEach(item => {
    item.classList.remove('drag-over');
  });
}

function handleDragStart(e) {
  draggedIndex = parseInt(e.currentTarget.dataset.index);
  setTimeout(() => e.target.classList.add('dragging'), 0);
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  clearDragOverClass();
  e.currentTarget.classList.add('drag-over');
  return false;
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  clearDragOverClass();

  const dropIndex = parseInt(e.currentTarget.dataset.index);
  if (draggedIndex !== null && draggedIndex !== dropIndex) {
    const [draggedItem] = bookmarks.splice(draggedIndex, 1);
    bookmarks.splice(dropIndex, 0, draggedItem);
    saveBookmarks();
    renderBookmarks(); // Explicitly render when dropping
  }
  return false;
}

function handleDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  clearDragOverClass();
  draggedIndex = null;
}

function attachDragHandlers(item) {
  item.addEventListener('dragstart', handleDragStart);
  item.addEventListener('dragover', handleDragOver);
  item.addEventListener('drop', handleDrop);
  item.addEventListener('dragend', handleDragEnd);
}

function createBookmarkItem(bookmark, index) {
  const item = document.createElement('div');
  item.className = 'bookmark-edit-item';
  item.dataset.index = index;
  item.innerHTML = `
    <div class="drag-handle">≡</div>
    <div class="bookmark-card">
      <div class="bookmark-fields">
        <span class="bookmark-num" style="color: var(--color-muted); font-size: 0.8rem; margin-right: 8px; min-width: 20px;">${index + 1}.</span>
        <input type="text" class="bookmark-name" value="${escapeHtml(bookmark.name)}" placeholder="Name" data-index="${index}">
        <input type="text" class="bookmark-url" value="${escapeHtml(bookmark.url)}" placeholder="https://url..." data-index="${index}">
        <input type="text" class="bookmark-tags" value="${escapeHtml(bookmark.tags.join(', '))}" placeholder="tags" data-index="${index}">
      </div>
      <button class="delete-btn" data-index="${index}" title="delete">×</button>
    </div>
  `;

  const handle = item.querySelector('.drag-handle');
  handle.addEventListener('mouseenter', () => item.draggable = true);
  handle.addEventListener('mouseleave', () => item.draggable = false);

  attachDragHandlers(item);
  return item;
}

function handleInputChange() {
  if (isDeleting) return;
  validateBookmarks();
  autoSaveBookmarks();
}

function renderBookmarks() {
  const container = document.getElementById('bookmarkList');
  container.innerHTML = '';

  bookmarks.forEach((bookmark, index) => {
    container.appendChild(createBookmarkItem(bookmark, index));
  });

  // Add "Add New" button at the bottom
  const addContainer = document.createElement('div');
  addContainer.className = 'add-btn-container';
  const addBtn = document.createElement('button');
  addBtn.textContent = '+ add new bookmark';
  addBtn.onclick = () => addBookmarkAt(bookmarks.length);
  addContainer.appendChild(addBtn);
  container.appendChild(addContainer);

  document.querySelectorAll('.bookmark-name').forEach(input => {
    input.addEventListener('input', handleInputChange);
    input.addEventListener('focus', function () {
      this.select();
    });
  });

  document.querySelectorAll('.bookmark-url').forEach(input => {
    input.addEventListener('input', handleInputChange);
    input.addEventListener('focus', function () {
      this.select();
    });
    // Auto-detect name on blur if name is empty
    input.addEventListener('blur', function () {
      if (isDeleting) return;
      const index = this.dataset.index;
      const url = this.value.trim();
      const nameInput = document.querySelector(`.bookmark-name[data-index="${index}"]`);

      if (url && nameInput && (!nameInput.value || nameInput.value.trim() === '')) {
        nameInput.value = extractNameFromUrl(url);
        handleInputChange();
      }
    });
  });

  document.querySelectorAll('.bookmark-tags').forEach(input => {
    input.addEventListener('input', handleInputChange);
    input.addEventListener('focus', function () {
      this.select();
    });
    input.addEventListener('blur', (e) => {
      const normalized = normalizeTagsFormat(e.target.value);
      if (e.target.value !== normalized) {
        e.target.value = normalized;
        handleInputChange();
      }
    });
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      deleteBookmark(parseInt(e.target.dataset.index));
    });
  });

  validateBookmarks();
}

function saveBookmarks() {
  saveSharedData(STORAGE_KEYS.BOOKMARKS, bookmarks);
}

function createNewBookmark() {
  return { name: '', url: '', tags: [] };
}

function addBookmarkAt(position) {
  bookmarks.splice(position, 0, createNewBookmark());
  saveBookmarks();
  renderBookmarks(); // Explicitly render when adding
}

function deleteBookmark(index) {
  isDeleting = true;
  bookmarks.splice(index, 1);
  saveBookmarks();
  renderBookmarks(); // Explicitly render when deleting
  // Allow the DOM to settle before re-enabling input handlers to prevent ghost saves
  setTimeout(() => {
    isDeleting = false;
  }, 50);
}

function parseTags(tagsString) {
  return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
}

function extractNameFromUrl(urlStr) {
  if (!urlStr) return '';
  try {
    // Prefix with https:// just to parse it if protocol is missing
    const validUrl = (urlStr.startsWith('http://') || urlStr.startsWith('https://')) ? urlStr : 'https://' + urlStr;
    const urlObj = new URL(validUrl);
    let hostname = urlObj.hostname;

    // Remove www.
    hostname = hostname.replace('www.', '');

    // Split by dots
    const parts = hostname.split('.');

    // Handle special cases like 'gemini.google.com'
    if (parts.length > 2 && parts[parts.length - 2] === 'google') {
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }

    // Usually the second to last part is the main name (e.g., [github], [com])
    if (parts.length >= 2) {
      const mainPart = parts[parts.length - 2];
      return mainPart.charAt(0).toUpperCase() + mainPart.slice(1);
    }

    return hostname;
  } catch (e) {
    return urlStr; // Fallback to raw string if completely invalid
  }
}

function autoSaveBookmarks() {
  const nameInputs = document.querySelectorAll('.bookmark-name');
  const urlInputs = document.querySelectorAll('.bookmark-url');
  const tagsInputs = document.querySelectorAll('.bookmark-tags');

  bookmarks = Array.from(nameInputs).map((nameInput, index) => ({
    name: nameInput.value,
    url: urlInputs[index].value,
    tags: parseTags(tagsInputs[index].value)
  }));

  saveBookmarks();
}

function isValidUrl(url) {
  if (!url) return false;
  try {
    const validUrl = (url.startsWith('http://') || url.startsWith('https://')) ? url : 'https://' + url;
    new URL(validUrl);
    return true;
  } catch (e) {
    return false;
  }
}

function toggleError(input, hasError) {
  input.classList.toggle('error', hasError);
}

function validateBookmarks() {
  document.querySelectorAll('.bookmark-name').forEach(input => {
    toggleError(input, input.value.trim() === '');
  });

  document.querySelectorAll('.bookmark-url').forEach(input => {
    const url = input.value.trim();
    toggleError(input, url === '' || !isValidUrl(url));
  });

  document.querySelectorAll('.bookmark-tags').forEach(input => {
    const hasInvalidFormat = input.value && /,(?!\s|$)/.test(input.value);
    toggleError(input, hasInvalidFormat);
  });
}

function normalizeTagsFormat(tagsString) {
  if (!tagsString) return '';
  return tagsString.replace(/,\s*/g, ', ').replace(/,\s*$/, '');
}

document.addEventListener('DOMContentLoaded', () => {
  loadConfigAndBookmarks();
});
