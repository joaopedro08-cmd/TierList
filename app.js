/* =========================================================
   SiterList — interactive prototype
   Vanilla SPA. localStorage (5 MB) for structured state, IndexedDB for assets,
   cookies as a small recovery mirror.
   ========================================================= */

'use strict';

const APP_VERSION = '0.1.0';
const COOKIE_PREFIX = 'ts_';
const COOKIE_CHUNK_SIZE = 1200;
const COOKIE_DAYS = 400;
const STORAGE_BUDGET = 5 * 1024 * 1024;
const COOKIE_MIRROR_LIMIT = 32 * 1024;
const LOCAL_BACKUP_KEY = 'tierlist-studio-backup-v1';
const NOTICE_COOKIE = 'ts_notice';
const MAX_TIERS = 12;
const MAX_ITEMS = 200;

/* ---------- Utilities ---------- */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function icon(name, className = '') {
  return `<svg class="icon ${className}" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
}

function debounce(fn, wait = 400) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

function formatRelative(iso) {
  if (!iso) return 'agora';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'agora';
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ontem';
  if (days < 30) return `há ${days} dias`;
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date);
}

function formatTime(date = new Date()) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date);
}

function formatDateLong(date = new Date()) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
}

function pluralize(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function hexToRgb(hex) {
  const clean = String(hex || '').replace('#', '').trim();
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  if (!/^[0-9a-f]{6}$/i.test(full)) return { r: 20, g: 20, b: 20 };
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const channels = [r, g, b].map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastInk(hex) {
  return luminance(hex) > 0.46 ? '#0a0a0d' : '#ffffff';
}

/* ---------- Constants ---------- */

const TIER_PALETTE = [
  { label: 'S', color: '#ff7a6b' },
  { label: 'A', color: '#ffb86b' },
  { label: 'B', color: '#ffe66d' },
  { label: 'C', color: '#8ce99a' },
  { label: 'D', color: '#74c0fc' },
  { label: 'E', color: '#b197fc' },
  { label: 'F', color: '#f783ac' },
  { label: 'G', color: '#63e6be' },
  { label: 'H', color: '#ffd43b' },
  { label: 'I', color: '#a9e34b' },
  { label: 'J', color: '#66d9e8' },
  { label: 'K', color: '#e599f7' },
];

const COVER_PRESETS = [
  { id: 'aurora', name: 'Aurora', accent: '#6ee7c7' },
  { id: 'sunset', name: 'Sunset', accent: '#ffb067' },
  { id: 'midnight', name: 'Midnight', accent: '#8ab4ff' },
  { id: 'forest', name: 'Forest', accent: '#a3e635' },
  { id: 'rose', name: 'Rose', accent: '#fb7185' },
  { id: 'mono', name: 'Mono', accent: '#d4d4d8' },
];

const THEMES = [
  { id: 'studio', name: 'Studio', description: 'Neutro e sofisticado', colors: ['#141414', '#f4f4f5', '#a1a1aa'] },
  { id: 'vinyl', name: 'Vinyl', description: 'Quente e analógico', colors: ['#17110d', '#e8a15b', '#f7ead8'] },
  { id: 'neon', name: 'Neon', description: 'Elétrico e noturno', colors: ['#06070b', '#7cffcb', '#ff5fd2'] },
  { id: 'paper', name: 'Paper', description: 'Claro e editorial', colors: ['#f5f0e6', '#b45309', '#171613'] },
  { id: 'mono', name: 'Mono', description: 'Monocromático', colors: ['#0b0b0b', '#f5f5f5', '#a1a1aa'] },
];

const ACCENT_SWATCHES = ['#f4f4f5', '#d4d4d8', '#a1a1aa', '#71717a', '#3f3f46', '#7cffcb', '#8ab4ff', '#fb7185'];

const DEMO_ALBUMS = [
  { title: 'Neon Cathedral', artist: 'Violet Hours', cover: 1 },
  { title: 'After the Rain', artist: 'Mira Vale', cover: 2 },
  { title: 'Soft Machines', artist: 'The Quiet Arc', cover: 3 },
  { title: 'Golden Hour', artist: 'Lena Ortiz', cover: 4 },
  { title: 'Static Bloom', artist: 'Northbound', cover: 5 },
  { title: 'Paper Moons', artist: 'Elias Kane', cover: 6 },
  { title: 'Low Tide', artist: 'Harbor Lights', cover: 7 },
  { title: 'Velvet Noise', artist: 'Sora', cover: 8 },
  { title: 'Midnight Archive', artist: 'The Common', cover: 9 },
  { title: 'Echoes in Blue', artist: 'Maya Sol', cover: 10 },
  { title: 'Glasshouse', artist: 'The Parallel', cover: 11 },
  { title: 'Slow Motion', artist: 'Iris Lane', cover: 12 },
  { title: 'Heatwave', artist: 'Juno Park', cover: 13 },
  { title: 'Silver Lining', artist: 'Aria Nova', cover: 14 },
  { title: 'Concrete Garden', artist: 'Low Season', cover: 15 },
  { title: 'Distant Lights', artist: 'Kite', cover: 16 },
  { title: 'Blue Hour', artist: 'Noa Rivers', cover: 1 },
  { title: 'Fever Dream', artist: 'Cassette Club', cover: 6 },
  { title: 'Northern Soul', artist: 'The Alps', cover: 3 },
  { title: 'Sunday Morning', artist: 'Clara Blue', cover: 4 },
];

/* ---------- Data helpers ---------- */

function defaultTiers(count = 5) {
  return TIER_PALETTE.slice(0, clamp(count, 1, MAX_TIERS)).map((tier, index) => ({
    id: uid('tr'),
    label: tier.label,
    color: tier.color,
    order: index,
  }));
}

function defaultSettings() {
  return {
    layout: 'comfortable',
    size: 'medium',
    showArtist: false,
    showTitle: true,
    showNote: true,
    background: 'texture',
  };
}

function normalizeState(input) {
  if (!input || !Array.isArray(input.lists)) return null;
  const settings = {
    themeMode: ['light', 'system', 'dark', 'mel'].includes(input.settings?.themeMode) ? input.settings.themeMode : 'dark',
    reducedMotion: Boolean(input.settings?.reducedMotion),
    defaultTemplate: clamp(Number(input.settings?.defaultTemplate) || 5, 1, MAX_TIERS),
  };
  const lists = input.lists.filter((list) => list && list.id && list.title).map((list) => ({
    ...list,
    description: list.description || '',
    cover: list.cover || { type: 'gradient', value: 'aurora' },
    theme: THEMES.some((theme) => theme.id === list.theme) ? list.theme : 'studio',
    accent: list.accent || '#a1a1aa',
    favorite: Boolean(list.favorite),
    tiers: Array.isArray(list.tiers) && list.tiers.length
      ? list.tiers.slice(0, MAX_TIERS).map((tier, index) => ({
        id: tier.id || uid('tr'),
        label: String(tier.label || TIER_PALETTE[index]?.label || '?').slice(0, 20),
        color: /^#[0-9a-f]{6}$/i.test(tier.color || '') ? tier.color : (TIER_PALETTE[index]?.color || '#8ce99a'),
        order: index,
      }))
      : defaultTiers(5),
    items: Array.isArray(list.items)
      ? list.items.slice(0, MAX_ITEMS).map((item, index) => ({
        id: item.id || uid('it'),
        tierId: item.tierId || null,
        order: Number.isFinite(item.order) ? item.order : index,
        title: String(item.title || 'Item sem título').slice(0, 100),
        artist: String(item.artist || '').slice(0, 100),
        cover: item.cover || { type: 'gradient', value: `cv-${(index % 16) + 1}` },
        note: String(item.note || '').slice(0, 500),
        createdAt: item.createdAt || new Date().toISOString(),
      }))
      : [],
    settings: { ...defaultSettings(), ...(list.settings || {}) },
    createdAt: list.createdAt || new Date().toISOString(),
    updatedAt: list.updatedAt || new Date().toISOString(),
  }));
  return { version: 1, lists, settings };
}

function makeDemoItem(album, tierId, order, note = '') {
  return {
    id: uid('it'),
    tierId,
    order,
    title: album.title,
    artist: album.artist,
    cover: { type: 'gradient', value: `cv-${album.cover}` },
    note,
    createdAt: new Date().toISOString(),
  };
}

function seedState() {
  const now = Date.now();
  const iso = (offsetMs) => new Date(now - offsetMs).toISOString();

  const tiersA = defaultTiers(5);
  const idsA = tiersA.map((tier) => tier.id);
  const albumsA = DEMO_ALBUMS.slice(0, 13);
  const itemsA = [
    makeDemoItem(albumsA[0], idsA[0], 0, 'O que abriu o ano.'),
    makeDemoItem(albumsA[1], idsA[0], 1),
    makeDemoItem(albumsA[2], idsA[1], 0, 'Produção impecável.'),
    makeDemoItem(albumsA[3], idsA[1], 1),
    makeDemoItem(albumsA[4], idsA[1], 2),
    makeDemoItem(albumsA[5], idsA[2], 0),
    makeDemoItem(albumsA[6], idsA[2], 1),
    makeDemoItem(albumsA[7], idsA[2], 2),
    makeDemoItem(albumsA[8], idsA[3], 0),
    makeDemoItem(albumsA[9], idsA[3], 1),
    makeDemoItem(albumsA[10], idsA[4], 0),
    makeDemoItem(albumsA[11], null, 0),
    makeDemoItem(albumsA[12], null, 1),
  ];

  const tiersB = defaultTiers(6);
  const idsB = tiersB.map((tier) => tier.id);
  const albumsB = DEMO_ALBUMS.slice(4, 15);
  const itemsB = albumsB.map((album, index) => {
    const tierIndex = [0, 0, 1, 1, 2, 2, 2, 3, 3, 4, null][index] ?? null;
    return makeDemoItem(album, tierIndex === null ? null : idsB[tierIndex], index % 3);
  });

  const tiersC = defaultTiers(4);
  const idsC = tiersC.map((tier) => tier.id);
  const albumsC = DEMO_ALBUMS.slice(14, 20);
  const itemsC = albumsC.map((album, index) => {
    const tierIndex = [0, 0, 1, 1, 2, 3][index] ?? null;
    return makeDemoItem(album, tierIndex === null ? null : idsC[tierIndex], index % 2);
  });

  return {
    version: 1,
    settings: { themeMode: 'dark', reducedMotion: false, defaultTemplate: 5 },
    lists: [
      {
        id: uid('tl'),
        title: 'Favoritos de 2026',
        description: 'O que ficou comigo até aqui — sem ordem de chegada, só de afeto.',
        cover: { type: 'gradient', value: 'aurora' },
        theme: 'studio',
        accent: '#a1a1aa',
        favorite: true,
        tiers: tiersA,
        items: itemsA,
        settings: defaultSettings(),
        createdAt: iso(1000 * 60 * 60 * 24 * 21),
        updatedAt: iso(1000 * 60 * 60 * 2),
      },
      {
        id: uid('tl'),
        title: 'Clássicos que definiram minha vida',
        description: 'Uma lista que muda de humor, mas nunca de essência.',
        cover: { type: 'gradient', value: 'sunset' },
        theme: 'vinyl',
        accent: '#a1a1aa',
        favorite: false,
        tiers: tiersB,
        items: itemsB,
        settings: { ...defaultSettings(), layout: 'comfortable', background: 'plain' },
        createdAt: iso(1000 * 60 * 60 * 24 * 90),
        updatedAt: iso(1000 * 60 * 60 * 24 * 2),
      },
      {
        id: uid('tl'),
        title: 'Descobertas recentes',
        description: 'Para a hora em que a cidade fica mais lenta.',
        cover: { type: 'gradient', value: 'midnight' },
        theme: 'paper',
        accent: '#71717a',
        favorite: false,
        tiers: tiersC,
        items: itemsC,
        settings: { ...defaultSettings(), size: 'small', background: 'grid' },
        createdAt: iso(1000 * 60 * 60 * 24 * 45),
        updatedAt: iso(1000 * 60 * 60 * 24 * 6),
      },
    ],
  };
}

/* ---------- Cookie storage ---------- */

function setCookie(name, value, days = COOKIE_DAYS) {
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax; Max-Age=${Math.floor(days * 86400)}${secure}`;
}

function getCookie(name) {
  const prefix = `${name}=`;
  const item = document.cookie.split('; ').find((cookie) => cookie.startsWith(prefix));
  if (!item) return null;
  try {
    return decodeURIComponent(item.slice(prefix.length));
  } catch {
    return null;
  }
}

function deleteCookie(name) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function loadState() {
  try {
    const local = localStorage.getItem(LOCAL_BACKUP_KEY);
    if (local) {
      const normalized = normalizeState(JSON.parse(local));
      if (normalized) return normalized;
    }
  } catch (error) {
    console.warn('Estado local inválido; tentando o espelho em cookies.', error);
  }

  try {
    const metaRaw = getCookie(`${COOKIE_PREFIX}meta`);
    if (metaRaw) {
      const meta = JSON.parse(metaRaw);
      if (meta.storage === 'local' || !meta.chunks) return null;
      let json = '';
      for (let i = 0; i < meta.chunks; i += 1) {
        const chunk = getCookie(`${COOKIE_PREFIX}${i}`);
        if (chunk === null) throw new Error('Chunk ausente');
        json += chunk;
      }
      const parsed = JSON.parse(json);
      const normalized = normalizeState(parsed);
      if (normalized) return normalized;
    }
  } catch (error) {
    console.warn('Não foi possível carregar o espelho em cookies.', error);
  }
  return null;
}

let saveTimer = null;
let lastSaveAt = null;

function saveState({ immediate = false } = {}) {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }

  try {
    const json = JSON.stringify(state);
    const bytes = new Blob([json]).size;
    if (bytes > STORAGE_BUDGET) {
      throw new Error('O limite de 5 MB foi atingido. Exporte um backup e remova itens.');
    }
    localStorage.setItem(LOCAL_BACKUP_KEY, json);

    let oldChunks = 0;
    try {
      const oldMeta = getCookie(`${COOKIE_PREFIX}meta`);
      if (oldMeta) oldChunks = Number(JSON.parse(oldMeta).chunks) || 0;
    } catch {
      oldChunks = 0;
    }

    if (bytes <= COOKIE_MIRROR_LIMIT) {
      const chunks = [];
      for (let i = 0; i < json.length; i += COOKIE_CHUNK_SIZE) {
        chunks.push(json.slice(i, i + COOKIE_CHUNK_SIZE));
      }
      chunks.forEach((chunk, index) => setCookie(`${COOKIE_PREFIX}${index}`, chunk));
      setCookie(`${COOKIE_PREFIX}meta`, JSON.stringify({
        version: 1,
        storage: 'cookies',
        chunks: chunks.length,
        bytes,
        savedAt: new Date().toISOString(),
      }));
      for (let i = chunks.length; i < oldChunks; i += 1) deleteCookie(`${COOKIE_PREFIX}${i}`);
    } else {
      for (let i = 0; i < oldChunks; i += 1) deleteCookie(`${COOKIE_PREFIX}${i}`);
      setCookie(`${COOKIE_PREFIX}meta`, JSON.stringify({
        version: 1,
        storage: 'local',
        chunks: 0,
        bytes,
        savedAt: new Date().toISOString(),
      }));
    }

    lastSaveAt = new Date();
    setSaveStatus('saved');
    updateStorageUI();
    return true;
  } catch (error) {
    console.error('Falha ao salvar estado.', error);
    setSaveStatus('error');
    toast(error.message || 'Não foi possível salvar. Exporte um backup e libere espaço.', 'error');
    return false;
  }
}

function scheduleSave() {
  setSaveStatus('saving');
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveState(), 480);
}

function formatStorageSize(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
  }
  return `${(bytes / 1024).toFixed(1).replace('.', ',')} KB`;
}

function stateUsageBytes() {
  try {
    return new Blob([JSON.stringify(state)]).size;
  } catch {
    return 0;
  }
}

function updateStorageUI() {
  const bytes = stateUsageBytes();
  const percent = clamp((bytes / STORAGE_BUDGET) * 100, 0, 100);
  const percentLabel = bytes > 0 && percent < 1 ? '<1%' : `${Math.round(percent)}%`;
  const sizeLabel = formatStorageSize(bytes);
  const storagePct = $('#storage-pct');
  const storageBar = $('#storage-bar');
  const storageLabel = $('#storage-label');
  const storageMeter = $('#storage-meter');
  if (storagePct) storagePct.textContent = percentLabel;
  if (storageBar) storageBar.style.width = `${Math.max(percent, bytes > 0 ? 0.6 : 0)}%`;
  if (storageLabel) storageLabel.textContent = `${sizeLabel} de 5 MB`;
  if (storageMeter) {
    storageMeter.setAttribute('aria-valuenow', String(Math.round(percent * 10) / 10));
    storageMeter.setAttribute('aria-valuetext', `${sizeLabel} de 5 MB`);
  }

  const usageValue = $('#usage-value');
  const usageBar = $('#usage-bar');
  const usageMeta = $('#usage-meta');
  const usageLists = $('#usage-lists');
  if (usageValue) usageValue.textContent = sizeLabel;
  if (usageBar) usageBar.style.width = `${Math.max(percent, bytes > 0 ? 0.6 : 0)}%`;
  if (usageMeta) usageMeta.textContent = `${percentLabel} de 5 MB`;
  if (usageLists) usageLists.textContent = `${state.lists.length} listas · ${state.lists.reduce((sum, list) => sum + list.items.length, 0)} itens`;
}

function setSaveStatus(status) {
  const node = $('#save-status');
  if (!node) return;
  node.classList.remove('is-saving', 'is-error');
  if (status === 'saving') {
    node.classList.add('is-saving');
    node.innerHTML = `<span class="status-dot"></span> Salvando...`;
  } else if (status === 'error') {
    node.classList.add('is-error');
    node.innerHTML = `<span class="status-dot"></span> Erro ao salvar`;
  } else {
    node.innerHTML = `<span class="status-dot"></span> Salvo${lastSaveAt ? ` às ${formatTime(lastSaveAt)}` : ''}`;
  }
}

/* ---------- IndexedDB assets ---------- */

const ASSET_DB_NAME = 'tierlist-studio-assets';
const ASSET_STORE = 'assets';
const assetUrls = new Map();
let assetDbPromise = null;

function openAssetDB() {
  if (assetDbPromise) return assetDbPromise;
  assetDbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB indisponível'));
      return;
    }
    const request = indexedDB.open(ASSET_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ASSET_STORE)) db.createObjectStore(ASSET_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return assetDbPromise;
}

async function putAsset(id, blob) {
  const db = await openAssetDB();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(ASSET_STORE, 'readwrite');
    transaction.objectStore(ASSET_STORE).put(blob, id);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
}

async function getAsset(id) {
  const db = await openAssetDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ASSET_STORE, 'readonly');
    const request = transaction.objectStore(ASSET_STORE).get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function getAssetUrl(id) {
  if (!id) return null;
  if (assetUrls.has(id)) return assetUrls.get(id);
  try {
    const blob = await getAsset(id);
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    assetUrls.set(id, url);
    return url;
  } catch (error) {
    console.warn('Asset não encontrado.', id, error);
    return null;
  }
}

async function clearAssets() {
  assetUrls.forEach((url) => URL.revokeObjectURL(url));
  assetUrls.clear();
  try {
    const db = await openAssetDB();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(ASSET_STORE, 'readwrite');
      transaction.objectStore(ASSET_STORE).clear();
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.warn('Não foi possível limpar os assets.', error);
  }
}

function fallbackImage() {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#2b2b2f"/><stop offset="1" stop-color="#141416"/>
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#g)"/>
      <circle cx="100" cy="90" r="22" fill="none" stroke="#8a8a93" stroke-width="3"/>
      <circle cx="100" cy="90" r="5" fill="#8a8a93"/>
      <text x="100" y="142" text-anchor="middle" fill="#8a8a93" font-family="sans-serif" font-size="11">sem capa</text>
    </svg>
  `)}`;
}

async function hydrateAssets(root = document) {
  const nodes = $$('[data-asset-id]', root);
  for (const node of nodes) {
    if (!(node instanceof HTMLImageElement)) continue;
    const id = node.dataset.assetId;
    if (!id || node.dataset.assetLoaded === '1') continue;
    const url = await getAssetUrl(id);
    node.src = url || fallbackImage();
    node.dataset.assetLoaded = '1';
  }
}

/* ---------- Responsive labels ---------- */

function fitLabelText(text, container, reserveY = 0) {
  if (!text || !container || !text.isConnected || !container.clientHeight) return;

  text.style.fontSize = '';
  text.classList.remove('is-overflowing');
  const containerStyle = getComputedStyle(container);
  const baseSize = parseFloat(getComputedStyle(text).fontSize) || 16;
  const availableWidth = container.clientWidth
    - (parseFloat(containerStyle.paddingLeft) || 0)
    - (parseFloat(containerStyle.paddingRight) || 0);
  const availableHeight = container.clientHeight
    - (parseFloat(containerStyle.paddingTop) || 0)
    - (parseFloat(containerStyle.paddingBottom) || 0)
    - reserveY;

  if (availableWidth <= 0 || availableHeight <= 0) return;

  const fits = (size) => {
    text.style.fontSize = `${size}px`;
    return text.scrollWidth <= availableWidth + 0.75
      && text.scrollHeight <= availableHeight + 0.75;
  };

  let size = baseSize;
  if (!fits(size)) {
    let low = Math.min(6, baseSize);
    let high = baseSize;
    let best = low;
    for (let step = 0; step < 10; step += 1) {
      const mid = (low + high) / 2;
      if (fits(mid)) {
        best = mid;
        low = mid;
      } else {
        high = mid;
      }
    }
    size = best;
  }

  text.style.fontSize = `${size}px`;
  const overflowing = text.scrollWidth > availableWidth + 0.75
    || text.scrollHeight > availableHeight + 0.75;
  text.classList.toggle('is-overflowing', overflowing);
}

function fitTierLabels(root = document) {
  $$('.tier-label', root).forEach((label) => {
    const count = $('small', label);
    const reserveY = count && getComputedStyle(count).display !== 'none'
      ? count.offsetHeight + 3
      : 0;
    fitLabelText($('.tier-label-text', label), label, reserveY);
  });

  $$('.export-tier-label', root).forEach((label) => {
    fitLabelText($('.export-tier-label-text', label), label);
  });
}

/* ---------- Image processing ---------- */

function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Imagem inválida'));
    };
    image.src = objectUrl;
  });
}

async function fileToAsset(file, { width = 512, height = 512, quality = 0.86 } = {}) {
  if (!file || !file.type.startsWith('image/')) throw new Error('O arquivo não é uma imagem.');
  if (file.size > 10 * 1024 * 1024) throw new Error('A imagem deve ter no máximo 10 MB.');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Use JPEG, PNG ou WebP.');
  }
  const image = await loadImageElement(file);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  const targetRatio = width / height;
  const sourceRatio = image.width / image.height;
  let sourceWidth = image.width;
  let sourceHeight = image.height;
  let sourceX = 0;
  let sourceY = 0;

  if (sourceRatio > targetRatio) {
    sourceWidth = image.height * targetRatio;
    sourceX = (image.width - sourceWidth) / 2;
  } else {
    sourceHeight = image.width / targetRatio;
    sourceY = (image.height - sourceHeight) / 2;
  }

  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
  if (!blob) throw new Error('Não foi possível processar a imagem.');
  const assetId = uid('as');
  await putAsset(assetId, blob);
  return { type: 'asset', assetId };
}

/* ---------- Theme ---------- */

function effectiveTheme() {
  const mode = state.settings.themeMode;
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

function applyTheme() {
  const theme = effectiveTheme();
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle('reduce-motion', Boolean(state.settings.reducedMotion));
  const meta = document.querySelector('meta[name="theme-color"]');
  const themeColors = { dark: '#09090b', light: '#f5f5f4', mel: '#fff5f8' };
  if (meta) meta.setAttribute('content', themeColors[theme] || '#09090b');
}

/* ---------- Cover and album markup ---------- */

function coverValue(cover) {
  if (!cover) return 'aurora';
  const value = String(cover.value || 'aurora').replace('cover-', '');
  return COVER_PRESETS.some((preset) => preset.id === value) ? value : 'aurora';
}

function coverAccent(cover) {
  if (!cover) return '#a1a1aa';
  if (cover.type === 'gradient') {
    return COVER_PRESETS.find((preset) => preset.id === coverValue(cover))?.accent || '#a1a1aa';
  }
  return '#a1a1aa';
}

function coverMarkup(cover, alt = 'Capa da tier list', extraClass = '') {
  const safeAlt = escapeAttr(alt);
  if (cover?.type === 'asset') {
    const cached = assetUrls.get(cover.assetId) || '';
    return `<span class="cover-art cover-mono ${extraClass}" aria-hidden="true"></span><img class="cover-image ${extraClass}" src="${cached}" data-asset-id="${escapeAttr(cover.assetId)}" alt="${safeAlt}" />`;
  }
  if (cover?.type === 'url' && cover.url) {
    return `<span class="cover-art cover-mono ${extraClass}" aria-hidden="true"></span><img class="cover-image ${extraClass}" src="${escapeAttr(cover.url)}" alt="${safeAlt}" referrerpolicy="no-referrer" crossorigin="anonymous" />`;
  }
  return `<span class="cover-art cover-${coverValue(cover)} ${extraClass}" aria-hidden="true"></span>`;
}

function albumArtMarkup(cover, alt = 'Capa do item') {
  const safeAlt = escapeAttr(alt);
  if (cover?.type === 'asset') {
    const cached = assetUrls.get(cover.assetId) || '';
    return `<div class="album-art"><img class="album-cover" src="${cached}" data-asset-id="${escapeAttr(cover.assetId)}" alt="${safeAlt}" loading="lazy" /></div>`;
  }
  if (cover?.type === 'url' && cover.url) {
    return `<div class="album-art"><img class="album-cover" src="${escapeAttr(cover.url)}" alt="${safeAlt}" loading="lazy" referrerpolicy="no-referrer" crossorigin="anonymous" /></div>`;
  }
  const value = String(cover?.value || 'cv-1').replace('cv-', '');
  const index = clamp(Number(value) || 1, 1, 16);
  return `<div class="album-art"><span class="album-cover cv-${index}" aria-hidden="true"></span></div>`;
}

/* ---------- App state ---------- */

let state = loadState();
const seededState = !state;
if (!state) {
  state = seedState();
}

const ui = {
  homeFilter: 'all',
  homeSearch: '',
  homeSort: 'recent',
  poolSearch: '',
  drawerItemId: null,
  editingTierId: null,
  targetTierId: null,
  draft: null,
  exportOptions: { scale: 2, background: 'theme' },
  history: [],
  redo: [],
  dragJustEnded: false,
};

let draggedItemId = null;
let currentListId = null;
let lastFocusedElement = null;

/* ---------- Navigation ---------- */

const THEME_ACCENTS = {
  studio: '#a1a1aa',
  vinyl: '#e8a15b',
  neon: '#7cffcb',
  paper: '#b45309',
  mono: '#f5f5f5',
};

const ROUTE_TITLES = {
  home: 'Biblioteca',
  new: 'Nova tier list',
  settings: 'Configurações',
  help: 'Ajuda e atalhos',
  export: 'Exportar',
};

let currentRoute = { name: 'home' };

function parseRoute() {
  const hash = location.hash.replace(/^#/, '') || '/';
  const parts = hash.split('/').filter(Boolean);
  if (!parts.length) return { name: 'home' };
  if (parts[0] === 'new') return { name: 'new' };
  if (parts[0] === 'list' && parts[1]) {
    if (parts[2] === 'export') return { name: 'export', id: parts[1] };
    return { name: 'list', id: parts[1] };
  }
  if (parts[0] === 'settings') return { name: 'settings' };
  if (parts[0] === 'help') return { name: 'help' };
  return { name: 'home' };
}

function getList(id) {
  return state.lists.find((list) => list.id === id) || null;
}

function activeList() {
  return getList(currentListId) || getList(currentRoute.id);
}

function touchList(list) {
  list.updatedAt = new Date().toISOString();
}

function byOrder(a, b) {
  return (a.order ?? 0) - (b.order ?? 0);
}

function tierItems(list, tierId) {
  return list.items.filter((item) => (item.tierId || null) === (tierId || null)).sort(byOrder);
}

function updateNav() {
  const active = currentRoute.name === 'new'
    ? 'new'
    : currentRoute.name === 'settings'
      ? 'settings'
      : currentRoute.name === 'help'
        ? 'help'
        : 'home';
  $$('[data-nav]').forEach((link) => {
    link.classList.toggle('active', link.dataset.nav === active);
  });
}

function handleRouteChange() {
  const previousRoute = currentRoute;
  currentRoute = parseRoute();

  if ((currentRoute.name === 'list' || currentRoute.name === 'export') && !getList(currentRoute.id)) {
    currentRoute = { name: 'home' };
    history.replaceState(null, '', '#/');
    toast('Essa tier list não existe mais.', 'error');
  }

  currentListId = currentRoute.name === 'list' ? currentRoute.id : null;

  if (previousRoute.id !== currentRoute.id) {
    ui.history = [];
    ui.redo = [];
  }

  closeOverlay(true);
  closePopover();
  ui.poolSearch = '';
  ui.returnToAppearance = false;

  if (currentRoute.name === 'new' && !ui.draft) ui.draft = makeDraft();

  renderView();
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

function renderView() {
  const view = $('#view');
  if (!view) return;

  view.className = 'view';

  switch (currentRoute.name) {
    case 'new':
      view.innerHTML = renderCreate();
      break;
    case 'list': {
      const list = getList(currentRoute.id);
      if (!list) {
        renderView();
        return;
      }
      view.classList.add('view-editor');
      view.innerHTML = renderEditor(list);
      wireDragAndDrop();
      applyPoolFilter();
      refreshHistoryButtons();
      break;
    }
    case 'export': {
      const list = getList(currentRoute.id);
      if (!list) {
        renderView();
        return;
      }
      view.innerHTML = renderExport(list);
      break;
    }
    case 'settings':
      view.innerHTML = renderSettings();
      break;
    case 'help':
      view.innerHTML = renderHelp();
      break;
    default:
      view.innerHTML = renderHome();
  }

  updateNav();
  updateStorageUI();
  hydrateAssets(view);
  fitTierLabels(view);

  const list = currentRoute.id ? getList(currentRoute.id) : null;
  document.title = list && (currentRoute.name === 'list' || currentRoute.name === 'export')
    ? `${list.title} — SiterList`
    : `${ROUTE_TITLES[currentRoute.name] || 'Biblioteca'} — SiterList`;

  if (currentRoute.name === 'list') {
    const titleInput = $('#cover-title-input');
    if (titleInput && document.activeElement !== titleInput && lastFocusedElement?.id !== 'cover-title-input') {
      // O foco é restaurado naturalmente após edições.
    }
  }
}

/* ---------- Home ---------- */

function getVisibleLists() {
  let lists = state.lists.slice();

  if (ui.homeFilter === 'fav') lists = lists.filter((list) => list.favorite);

  const query = ui.homeSearch.trim().toLowerCase();
  if (query) {
    lists = lists.filter((list) => {
      const haystack = [
        list.title,
        list.description,
        ...list.items.map((item) => `${item.title} ${item.artist}`),
      ].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }

  if (ui.homeSort === 'name') {
    lists.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
  } else if (ui.homeSort === 'albums') {
    lists.sort((a, b) => b.items.length - a.items.length);
  } else {
    lists.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  return lists;
}

function renderHome() {
  if (!state.lists.length) {
    return `
      <header class="page-head page-head-home">
        <div>
          <span class="eyebrow">Biblioteca local · sem contas</span>
          <h1 class="page-title">Biblioteca</h1>
          <p class="page-sub">Crie rankings de álbuns, jogos, filmes ou qualquer coisa que você queira organizar.</p>
        </div>
        <div class="head-actions">
          <button class="btn btn-secondary" type="button" data-action="import-backup">
            ${icon('upload')}<span class="btn-label">Importar</span>
          </button>
          <a class="btn btn-primary" href="#/new">${icon('plus')}<span class="btn-label">Nova tier list</span></a>
        </div>
      </header>
      <section class="empty-panel">
        <span class="new-card-icon">${icon('grid', 'icon-lg')}</span>
        <h2>Sua biblioteca está vazia.</h2>
        <p>Comece uma tier list e adicione itens com uma foto. Nome e detalhes podem vir depois.</p>
        <div class="empty-actions">
          <a class="btn btn-primary btn-lg" href="#/new">${icon('plus')} Criar primeira tier list</a>
          <button class="btn btn-secondary btn-lg" type="button" data-action="import-backup">Importar backup</button>
        </div>
      </section>`;
  }

  const visible = getVisibleLists();

  return `
    <header class="page-head page-head-home">
      <div>
        <span class="eyebrow">Biblioteca local · ${pluralize(state.lists.length, 'tier list', 'tier lists')}</span>
        <h1 class="page-title">Biblioteca</h1>
      </div>
      <div class="head-actions">
        <button class="btn btn-secondary" type="button" data-action="import-backup">
          ${icon('upload')}<span class="btn-label">Importar</span>
        </button>
        <a class="btn btn-primary" href="#/new">${icon('plus')}<span class="btn-label">Nova tier list</span><kbd>N</kbd></a>
      </div>
    </header>

    <section aria-labelledby="library-title">
      <div class="library-toolbar">
        <h2 class="section-title" id="library-title">Tier lists <span class="count" id="library-count">${visible.length}</span></h2>
        <div class="library-tools">
          <div class="filter-chips" role="group" aria-label="Filtrar tier lists">
            <button class="chip ${ui.homeFilter === 'all' ? 'is-active' : ''}" type="button" data-action="home-filter" data-filter="all">Todas</button>
            <button class="chip ${ui.homeFilter === 'fav' ? 'is-active' : ''}" type="button" data-action="home-filter" data-filter="fav">Favoritas</button>
          </div>
          <div class="input-wrap search-field">
            ${icon('search')}
            <input class="input ${ui.homeSearch ? 'has-clear' : ''}" id="home-search" type="search" value="${escapeAttr(ui.homeSearch)}" placeholder="Buscar tier list" aria-label="Buscar tier list" />
            <button class="input-clear" type="button" id="home-search-clear" data-action="clear-home-search" aria-label="Limpar busca" ${ui.homeSearch ? '' : 'hidden'}>${icon('x', 'icon-sm')}</button>
          </div>
          <select class="select sort-select" id="home-sort" aria-label="Ordenar tier lists">
            <option value="recent" ${ui.homeSort === 'recent' ? 'selected' : ''}>Recentes</option>
            <option value="name" ${ui.homeSort === 'name' ? 'selected' : ''}>Nome</option>
            <option value="albums" ${ui.homeSort === 'albums' ? 'selected' : ''}>Itens</option>
          </select>
        </div>
      </div>
      <div id="library-results">${homeResultsMarkup(visible)}</div>
    </section>`;
}

function homeResultsMarkup(lists) {
  if (!lists.length) {
    return `
      <div class="empty-panel" style="min-height:260px">
        <span class="new-card-icon">${icon('search')}</span>
        <h2>Nada por aqui.</h2>
        <p>Nenhuma tier list corresponde à sua busca. Tente outro termo ou crie uma nova.</p>
        <div class="empty-actions">
          <button class="btn btn-secondary" type="button" data-action="clear-home-search">Limpar busca</button>
          <a class="btn btn-primary" href="#/new">${icon('plus')} Nova tier list</a>
        </div>
      </div>`;
  }

  return `
    <div class="list-grid">
      ${lists.map(listCardMarkup).join('')}
    </div>`;
}

function listCardMarkup(list) {
  const theme = THEMES.find((item) => item.id === list.theme) || THEMES[0];
  return `
    <article class="list-card" data-open-list="${list.id}">
      <div class="list-cover">
        ${coverMarkup(list.cover, list.title)}
        <span class="cover-badge"><span class="tier-dot" style="--tier-color:${escapeAttr(list.accent)}"></span>${theme.name}</span>
        <button class="icon-btn list-card-menu" type="button" data-action="list-menu" data-list-id="${list.id}" aria-label="Opções de ${escapeAttr(list.title)}">${icon('more', 'icon-sm')}</button>
      </div>
      <div class="list-body">
        <div class="list-title-row">
          <h3 class="list-title">${escapeHtml(list.title)}</h3>
          <button class="fav-btn ${list.favorite ? 'is-fav' : ''}" type="button" data-action="toggle-favorite" data-list-id="${list.id}" aria-label="${list.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}" aria-pressed="${list.favorite}">${icon('star', 'icon-sm')}</button>
        </div>
        <div class="list-meta">
          <span>${pluralize(list.items.length, 'item', 'itens')}</span>
          <span class="dot"></span>
          <span>${pluralize(list.tiers.length, 'tier', 'tiers')}</span>
        </div>
        <div class="list-footer">
          <span class="list-updated">Atualizada ${formatRelative(list.updatedAt)}</span>
          <a class="list-open" href="#/list/${list.id}">Abrir ${icon('arrow-right', 'icon-xs')}</a>
        </div>
      </div>
    </article>`;
}

function renderHomeResults() {
  const container = $('#library-results');
  if (!container) return;
  const visible = getVisibleLists();
  container.innerHTML = homeResultsMarkup(visible);
  const count = $('#library-count');
  if (count) count.textContent = String(visible.length);
  hydrateAssets(container);
}

/* ---------- Create ---------- */

function makeDraft() {
  const count = clamp(Number(state.settings.defaultTemplate) || 5, 1, MAX_TIERS);
  return {
    title: '',
    description: '',
    cover: { type: 'gradient', value: 'aurora' },
    theme: 'studio',
    accent: THEME_ACCENTS.studio,
    tierCount: count,
    tiers: defaultTiers(count),
    demo: false,
  };
}

function renderCreate() {
  const draft = ui.draft || (ui.draft = makeDraft());
  const tiers = draft.tiers;

  return `
    <header class="page-head">
      <div>
        <span class="eyebrow">Novo projeto</span>
        <h1 class="page-title">Nova tier list</h1>
        <p class="page-sub">Defina a identidade e a estrutura agora — tudo pode mudar depois, inclusive a capa e os tiers.</p>
      </div>
      <div class="head-actions">
        <a class="btn btn-ghost" href="#/">${icon('arrow-left')}<span class="btn-label">Voltar</span></a>
      </div>
    </header>

    <div class="create-layout">
      <div class="create-form">
        <section class="form-section">
          <div class="section-kicker"><span class="section-number">01</span><h2>Identidade</h2></div>
          <p>O nome aparece na capa, na biblioteca e na exportação.</p>
          <div class="field-stack">
            <label class="field">
              <span class="field-label">Nome da tier list <span class="field-hint" id="create-title-count">${draft.title.length}/90</span></span>
              <input class="input" id="create-title" maxlength="90" value="${escapeAttr(draft.title)}" placeholder="Ex.: Meus favoritos de 2026" autofocus />
            </label>
            <label class="field">
              <span class="field-label">Descrição <span class="field-hint">Opcional</span></span>
              <textarea class="textarea" id="create-desc" maxlength="160" placeholder="Uma frase sobre o critério, o momento ou a vibe da lista.">${escapeHtml(draft.description)}</textarea>
            </label>
          </div>
        </section>

        <section class="form-section">
          <div class="section-kicker"><span class="section-number">02</span><h2>Capa</h2></div>
          <p>Escolha um gradiente autoral ou envie uma imagem sua. A capa é o rosto da lista.</p>
          <div class="cover-preset-grid" id="create-cover-grid">
            ${COVER_PRESETS.map((preset) => `
              <button class="cover-preset ${draft.cover.type === 'gradient' && coverValue(draft.cover) === preset.id ? 'is-selected' : ''}" type="button" data-action="create-cover" data-cover="${preset.id}" aria-label="Usar capa ${preset.name}" aria-pressed="${draft.cover.type === 'gradient' && coverValue(draft.cover) === preset.id}">
                <span class="cover-art cover-${preset.id}" aria-hidden="true"></span>
                <span class="cover-label">${preset.name}</span>
                <span class="cover-preset-check">${icon('check', 'icon-xs')}</span>
              </button>`).join('')}
          </div>
          <div class="upload-row">
            <button class="btn btn-secondary btn-sm" type="button" data-action="create-upload-cover">${icon('upload', 'icon-sm')} Enviar imagem</button>
            <span class="tiny">JPEG, PNG ou WebP · até 10 MB</span>
          </div>
        </section>

        <section class="form-section">
          <div class="section-kicker"><span class="section-number">03</span><h2>Estilo</h2></div>
          <p>O tema define o clima do quadro. A cor de destaque guia detalhes e estados.</p>
          <div class="theme-grid" id="create-theme-grid">
            ${THEMES.map((theme) => `
              <button class="theme-option ${draft.theme === theme.id ? 'is-selected' : ''}" type="button" data-action="create-theme" data-theme="${theme.id}" aria-pressed="${draft.theme === theme.id}">
                <span class="theme-swatch">${theme.colors.map((color) => `<i style="background:${color}"></i>`).join('')}</span>
                <strong>${theme.name}</strong>
                <span>${theme.description}</span>
              </button>`).join('')}
          </div>
          <div class="swatch-grid" style="margin-top:12px" aria-label="Cor de destaque">
            ${ACCENT_SWATCHES.map((color) => `
              <button class="swatch ${draft.accent.toLowerCase() === color.toLowerCase() ? 'is-selected' : ''}" type="button" data-action="create-accent" data-color="${color}" style="--swatch:${color}" aria-label="Usar cor ${color}" aria-pressed="${draft.accent.toLowerCase() === color.toLowerCase()}">
                ${draft.accent.toLowerCase() === color.toLowerCase() ? icon('check') : ''}
              </button>`).join('')}
          </div>
        </section>

        <section class="form-section">
          <div class="section-kicker"><span class="section-number">04</span><h2>Estrutura</h2></div>
          <p>Quantos tiers a lista terá. Você pode renomear, recolorir e adicionar mais depois.</p>
          <div class="tier-count-options" id="create-tier-options">
            ${[3, 4, 5, 6, 7].map((count) => `
              <button class="choice-pill ${draft.tierCount === count ? 'is-active' : ''}" type="button" data-action="create-tier-count" data-count="${count}" aria-pressed="${draft.tierCount === count}">${count} tiers</button>`).join('')}
            <input class="input custom-tier-input" id="create-custom-tiers" type="number" min="1" max="${MAX_TIERS}" value="${draft.tierCount > 7 ? draft.tierCount : ''}" placeholder="8–12" aria-label="Quantidade personalizada de tiers" />
          </div>
          <div class="tier-preview-pills" id="create-tier-preview">
            ${tiers.map((tier) => `<span class="tier-pill" style="--tier-color:${tier.color};--tier-ink:${contrastInk(tier.color)}">${escapeHtml(tier.label)}</span>`).join('')}
          </div>
        </section>

        <section class="form-section">
          <div class="section-kicker"><span class="section-number">05</span><h2>Primeiros itens</h2></div>
          <p>Prefere começar com a mão na massa? Adicionamos 12 itens de exemplo ao campo de não ranqueados.</p>
          <div class="tier-count-options">
            <button class="choice-pill ${draft.demo ? 'is-active' : ''}" type="button" data-action="create-demo" data-demo="1" aria-pressed="${draft.demo}">12 itens de exemplo</button>
            <button class="choice-pill ${!draft.demo ? 'is-active' : ''}" type="button" data-action="create-demo" data-demo="0" aria-pressed="${!draft.demo}">Começar vazia</button>
          </div>
        </section>

        <div class="create-actions">
          <button class="btn btn-primary btn-lg" type="button" data-action="create-submit">${icon('sparkles')} Criar tier list</button>
          <a class="btn btn-ghost btn-lg" href="#/">Cancelar</a>
        </div>
      </div>

      <div class="preview-sticky">
        <div class="preview-card">
          <div id="create-preview-cover">
            ${createPreviewCoverMarkup(draft)}
          </div>
          <div id="create-preview-body">
            ${createPreviewBodyMarkup(draft)}
          </div>
        </div>
        <p class="tiny" style="margin-top:12px;text-align:center">Prévia ao vivo · atualize os campos para ver o resultado</p>
      </div>
    </div>`;
}

function createPreviewCoverMarkup(draft) {
  return `
    <div class="preview-cover">
      ${coverMarkup(draft.cover, draft.title || 'Sua nova tier list')}
      <div class="preview-cover-content">
        <span class="eyebrow">Prévia ao vivo</span>
        <h3>${escapeHtml(draft.title || 'Sua nova tier list')}</h3>
        <p>${escapeHtml(draft.description || 'Uma frase sobre esta seleção')}</p>
      </div>
    </div>`;
}

function createPreviewBodyMarkup(draft) {
  const theme = THEMES.find((item) => item.id === draft.theme) || THEMES[0];
  return `
    <div class="preview-body">
      ${draft.tiers.slice(0, 7).map((tier) => `
        <div class="preview-mini-tier">
          <span class="preview-mini-label" style="--tier-color:${tier.color};--tier-ink:${contrastInk(tier.color)}">${escapeHtml(tier.label)}</span>
          <span class="preview-mini-drop">arraste itens para cá</span>
        </div>`).join('')}
      ${draft.tiers.length > 7 ? `<p class="tiny" style="padding:6px 2px 0">+ ${draft.tiers.length - 7} tiers</p>` : ''}
    </div>
    <div class="preview-foot">
      <span>${theme.name} · ${draft.accent}</span>
      <span>${draft.demo ? '12 itens de exemplo' : 'começa vazia'} · ${pluralize(draft.tiers.length, 'tier', 'tiers')}</span>
    </div>`;
}

function refreshCreatePreview() {
  const draft = ui.draft;
  if (!draft) return;
  const cover = $('#create-preview-cover');
  const body = $('#create-preview-body');
  if (cover) cover.innerHTML = createPreviewCoverMarkup(draft);
  if (body) body.innerHTML = createPreviewBodyMarkup(draft);
  hydrateAssets($('#create-preview-cover'));
}

function applyDraftTierCount(count) {
  const draft = ui.draft;
  if (!draft) return;
  const safe = clamp(Number(count) || 5, 1, MAX_TIERS);
  draft.tierCount = safe;
  draft.tiers = defaultTiers(safe);

  $$('#create-tier-options [data-action="create-tier-count"]').forEach((button) => {
    const isActive = Number(button.dataset.count) === safe;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  const preview = $('#create-tier-preview');
  if (preview) {
    preview.innerHTML = draft.tiers.map((tier) => `<span class="tier-pill" style="--tier-color:${tier.color};--tier-ink:${contrastInk(tier.color)}">${escapeHtml(tier.label)}</span>`).join('');
  }

  refreshCreatePreview();
}

function uploadDraftCover() {
  pickFile({
    accept: 'image/jpeg,image/png,image/webp',
    onFile: async (file) => {
      try {
        const asset = await fileToAsset(file, { width: 1200, height: 675, quality: 0.86 });
        ui.draft.cover = asset;
        $$('#create-cover-grid .cover-preset').forEach((button) => {
          button.classList.remove('is-selected');
          button.setAttribute('aria-pressed', 'false');
        });
        refreshCreatePreview();
        toast('Capa adicionada.');
      } catch (error) {
        console.error(error);
        toast(error.message || 'Não foi possível usar essa imagem.', 'error');
      }
    },
  });
}

function createListFromDraft() {
  const draft = ui.draft;
  if (!draft) return;

  const title = draft.title.trim();
  if (!title) {
    toast('Dê um nome à sua tier list para continuar.', 'error');
    $('#create-title')?.focus();
    return;
  }

  const now = new Date().toISOString();
  const list = {
    id: uid('tl'),
    title,
    description: draft.description.trim(),
    cover: draft.cover,
    theme: draft.theme,
    accent: draft.accent,
    favorite: false,
    tiers: draft.tiers.map((tier, index) => ({ ...tier, order: index })),
    items: draft.demo
      ? DEMO_ALBUMS.slice(0, 12).map((album, index) => ({
        ...makeDemoItem(album, null, index),
        createdAt: now,
      }))
      : [],
    settings: defaultSettings(),
    createdAt: now,
    updatedAt: now,
  };

  state.lists.unshift(list);
  ui.draft = null;
  saveState({ immediate: true });
  toast('Tier list criada. Agora é só ranquear.');
  location.hash = `#/list/${list.id}`;
}

/* ---------- Editor ---------- */

function boardShellClasses(list) {
  const settings = list.settings;
  const classes = [
    'board-shell',
    `theme-${list.theme}`,
    `layout-${settings.layout}`,
    `size-${settings.size}`,
    `bg-${settings.background}`,
  ];
  if (!settings.showArtist) classes.push('hide-artist');
  if (!settings.showTitle) classes.push('hide-title');
  if (!settings.showNote) classes.push('hide-note');
  return classes.join(' ');
}

function renderEditor(list) {
  const theme = THEMES.find((item) => item.id === list.theme) || THEMES[0];
  return `
    <div class="editor-page">
      <header class="editor-topbar">
        <div class="topbar-left">
          <a class="topbar-back" href="#/" aria-label="Voltar para a biblioteca">${icon('arrow-left', 'icon-sm')}</a>
          <nav class="breadcrumb" aria-label="Trilha de navegação">
            <a href="#/">Biblioteca</a>
            <span class="sep">/</span>
            <strong id="breadcrumb-title">${escapeHtml(list.title)}</strong>
          </nav>
        </div>
        <div class="topbar-center">
          <span class="save-status" id="save-status"><span class="status-dot"></span> ${lastSaveAt ? `Salvo às ${formatTime(lastSaveAt)}` : 'Salvo neste navegador'}</span>
          <div class="history-actions">
            <button class="icon-btn" type="button" id="undo-btn" data-action="undo" aria-label="Desfazer" title="Desfazer (Ctrl+Z)">${icon('undo', 'icon-sm')}</button>
            <button class="icon-btn" type="button" id="redo-btn" data-action="redo" aria-label="Refazer" title="Refazer (Ctrl+Shift+Z)">${icon('redo', 'icon-sm')}</button>
          </div>
        </div>
        <div class="topbar-right">
          <div class="topbar-actions">
            <a class="btn btn-secondary" href="#/list/${list.id}/export">${icon('download', 'icon-sm')}<span class="btn-label">Exportar</span></a>
            <button class="btn btn-primary" type="button" data-action="appearance-open">${icon('palette', 'icon-sm')}<span class="btn-label">Aparência</span></button>
            <button class="icon-btn" type="button" data-action="editor-menu" data-list-id="${list.id}" aria-label="Mais opções da tier list">${icon('more', 'icon-sm')}</button>
          </div>
        </div>
      </header>

      <div class="editor-content">
        <section class="editor-cover" aria-label="Capa da tier list">
          ${coverMarkup(list.cover, list.title)}
          <div class="editor-cover-top">
            <button class="btn" type="button" data-action="edit-cover">${icon('image', 'icon-sm')}<span>Trocar capa</span></button>
          </div>
          <div class="editor-cover-content">
            <input class="cover-title-input" id="cover-title-input" value="${escapeAttr(list.title)}" maxlength="90" aria-label="Título da tier list" />
            <input class="cover-desc-input" id="cover-desc-input" value="${escapeAttr(list.description)}" maxlength="160" placeholder="Adicione uma descrição curta..." aria-label="Descrição da tier list" />
            <div class="cover-meta">
              <span>${icon('sparkles')} ${theme.name}</span>
              <span>${icon('grid')} ${pluralize(list.items.length, 'item', 'itens')}</span>
              <span>${icon('sliders')} ${pluralize(list.tiers.length, 'tier', 'tiers')}</span>
              <span><span class="status-dot"></span> atualizada ${formatRelative(list.updatedAt)}</span>
            </div>
          </div>
        </section>

        ${boardMarkup(list)}

        <footer class="editor-footer">
          <span>${icon('shield', 'icon-xs')} Salvo neste navegador · até 5 MB · imagens no IndexedDB</span>
          <span>${icon('keyboard', 'icon-xs')} Arraste para ranquear · <kbd>Ctrl</kbd><kbd>Z</kbd> desfaz</span>
        </footer>
      </div>
    </div>`;
}

function boardMarkup(list) {
  return `
    <section class="${boardShellClasses(list)}" style="--board-accent:${escapeAttr(list.accent)}" aria-label="Ranking da tier list">
      <div class="board-toolbar">
        <div class="board-toolbar-left">
          <h2 class="section-title">Ranking <span class="count" id="board-count">${list.items.length}</span></h2>
        </div>
        <div class="board-toolbar-actions">
          <button class="btn" type="button" data-action="add-tier">${icon('plus', 'icon-sm')}<span>Novo tier</span></button>
          <button class="btn" type="button" data-action="add-album">${icon('plus', 'icon-sm')}<span>Adicionar item</span></button>
        </div>
      </div>

      <div class="board">
        ${list.tiers.map((tier) => tierRowMarkup(list, tier)).join('')}
      </div>

      ${poolMarkup(list)}
    </section>`;
}

function tierRowMarkup(list, tier) {
  const items = tierItems(list, tier.id);
  const ink = contrastInk(tier.color);
  return `
    <div class="tier-row" data-tier-row="${tier.id}">
      <button class="tier-label" type="button" style="--tier-color:${tier.color};--tier-ink:${ink}" data-action="edit-tier" data-tier-id="${tier.id}" title="Editar tier ${escapeAttr(tier.label)}">
        <span class="tier-label-text">${escapeHtml(tier.label)}</span>
        <small>${items.length}</small>
        <span class="tier-label-edit">editar</span>
      </button>
      <div class="tier-items" data-drop-tier="${tier.id}">
        ${items.map((item) => albumCardMarkup(item, list)).join('')}
        ${items.length ? '' : `<span class="tier-empty-hint">${icon('grip')} Arraste itens para cá</span>`}
        <button class="tier-add" type="button" data-action="add-album" data-tier-id="${tier.id}" aria-label="Adicionar item no tier ${escapeAttr(tier.label)}">
          ${icon('plus')}<span>item</span>
        </button>
      </div>
    </div>`;
}

function poolMarkup(list) {
  const items = tierItems(list, null);
  return `
    <div class="pool">
      <div class="pool-head">
        <div class="pool-head-left">
          <span class="pool-title">Não ranqueados</span>
          <span class="pool-count">${items.length}</span>
        </div>
        <div class="pool-head-actions">
          <div class="input-wrap pool-search">
            ${icon('search')}
            <input class="input" id="pool-search" type="search" value="${escapeAttr(ui.poolSearch)}" placeholder="Filtrar itens" aria-label="Filtrar itens não ranqueados" />
          </div>
          <button class="btn" type="button" data-action="add-album">${icon('plus', 'icon-sm')}<span>Adicionar</span></button>
        </div>
      </div>
      <div class="pool-body" id="pool-body" data-drop-tier="">
        ${items.map((item) => albumCardMarkup(item, list)).join('')}
        ${items.length ? '' : `<div class="pool-empty">${icon('check')} Tudo ranqueado. Adicione novos itens para continuar.</div>`}
        <div class="pool-empty" id="pool-no-results" hidden>${icon('search')} Nenhum item corresponde ao filtro.</div>
      </div>
    </div>`;
}

function albumCardMarkup(item, list) {
  const hasCaption = list.settings.showTitle || list.settings.showArtist;
  const search = `${item.title} ${item.artist}`.toLowerCase();
  return `
    <div class="album-card ${hasCaption ? 'has-caption' : ''}" draggable="true" tabindex="0" role="button" data-action="open-item" data-item-id="${item.id}" data-search="${escapeAttr(search)}" aria-label="${escapeAttr(item.title)}${item.artist ? `, de ${escapeAttr(item.artist)}` : ''}. Abrir detalhes.">
      ${albumArtMarkup(item.cover, item.title)}
      <span class="album-drag-hint" aria-hidden="true">${icon('grip')}</span>
      ${item.note && list.settings.showNote ? `<span class="album-note-dot" title="Este item tem uma nota"></span>` : ''}
      ${list.settings.showTitle ? `<span class="album-title">${escapeHtml(item.title)}</span>` : ''}
      ${list.settings.showArtist && item.artist ? `<span class="album-artist">${escapeHtml(item.artist)}</span>` : ''}
    </div>`;
}

function wireDragAndDrop() {
  const root = $('#view');
  if (!root) return;

  $$('.album-card', root).forEach((card) => {
    card.addEventListener('dragstart', (event) => {
      draggedItemId = card.dataset.itemId;
      card.classList.add('is-dragging');
      ui.dragJustEnded = false;
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        try {
          event.dataTransfer.setData('text/plain', draggedItemId || '');
        } catch {
          // Alguns navegadores restringem o payload; o estado interno basta.
        }
      }
    });

    card.addEventListener('dragend', () => {
      draggedItemId = null;
      card.classList.remove('is-dragging');
      clearDropIndicators();
      ui.dragJustEnded = true;
      setTimeout(() => { ui.dragJustEnded = false; }, 140);
    });

    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openAlbumDrawer(card.dataset.itemId || null);
      }
    });
  });

  $$('[data-drop-tier]', root).forEach((zone) => {
    zone.addEventListener('dragover', (event) => {
      if (!draggedItemId) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
      $$('.tier-items.is-drag-over, .pool-body.is-drag-over').forEach((other) => {
        if (other !== zone) other.classList.remove('is-drag-over');
      });
      zone.classList.add('is-drag-over');
      clearDropIndicators();
      const target = event.target.closest('.album-card');
      if (target && zone.contains(target)) target.classList.add('is-drop-before');
    });

    zone.addEventListener('dragleave', (event) => {
      if (!zone.contains(event.relatedTarget)) {
        zone.classList.remove('is-drag-over');
        clearDropIndicators();
      }
    });

    zone.addEventListener('drop', (event) => {
      if (!draggedItemId) return;
      event.preventDefault();
      const tierId = zone.dataset.dropTier || null;
      const beforeId = computeDropTarget(event, zone);
      const itemId = draggedItemId;
      zone.classList.remove('is-drag-over');
      clearDropIndicators();
      draggedItemId = null;
      moveItem(itemId, tierId, beforeId);
    });
  });
}

function clearDropIndicators() {
  $$('.album-card.is-drop-before, .tier-items.is-drag-over, .pool-body.is-drag-over').forEach((node) => {
    node.classList.remove('is-drop-before');
    if (node.matches('.tier-items, .pool-body')) node.classList.remove('is-drag-over');
  });
}

function computeDropTarget(event, zone) {
  const card = event.target.closest('.album-card');
  if (!card || !zone.contains(card)) return null;
  const rect = card.getBoundingClientRect();
  const comesAfter = event.clientX > rect.left + rect.width / 2;
  if (!comesAfter) return card.dataset.itemId || null;
  let next = card.nextElementSibling;
  while (next && !next.classList.contains('album-card')) next = next.nextElementSibling;
  return next?.dataset.itemId || null;
}

function reindexTier(list, tierId) {
  tierItems(list, tierId).forEach((item, index) => {
    item.order = index;
  });
}

function moveItem(itemId, targetTierId, beforeItemId) {
  const list = activeList();
  if (!list) return;
  const item = list.items.find((entry) => entry.id === itemId);
  if (!item) return;

  const sourceTierId = item.tierId || null;
  const destinationTierId = targetTierId || null;
  if (sourceTierId === destinationTierId && item.id === beforeItemId) return;

  pushHistory(list);
  item.tierId = destinationTierId;

  const siblings = list.items
    .filter((entry) => entry.id !== item.id && (entry.tierId || null) === destinationTierId)
    .sort(byOrder);
  let index = beforeItemId ? siblings.findIndex((entry) => entry.id === beforeItemId) : siblings.length;
  if (index < 0) index = siblings.length;
  siblings.splice(index, 0, item);
  siblings.forEach((entry, position) => { entry.order = position; });

  if (sourceTierId !== destinationTierId) reindexTier(list, sourceTierId);

  touchList(list);
  scheduleSave();
  renderView();
  toast(destinationTierId ? 'Item movido de tier.' : 'Item devolvido aos não ranqueados.');
}

function applyPoolFilter() {
  const body = $('#pool-body');
  if (!body) return;
  const query = ui.poolSearch.trim().toLowerCase();
  let visible = 0;
  $$('.album-card', body).forEach((card) => {
    const matches = !query || (card.dataset.search || '').includes(query);
    card.hidden = !matches;
    if (matches) visible += 1;
  });
  const emptyState = $('#pool-no-results');
  if (emptyState) emptyState.hidden = !query || visible > 0;
}

/* ---------- Undo / redo ---------- */

function pushHistory(list) {
  if (!list) return;
  ui.history.push({ listId: list.id, data: JSON.stringify(list) });
  if (ui.history.length > 40) ui.history.shift();
  ui.redo = [];
  refreshHistoryButtons();
}

function refreshHistoryButtons() {
  const undoButton = $('#undo-btn');
  const redoButton = $('#redo-btn');
  if (undoButton) undoButton.disabled = !ui.history.length;
  if (redoButton) redoButton.disabled = !ui.redo.length;
}

function undo() {
  const list = activeList();
  const entry = ui.history[ui.history.length - 1];
  if (!list || !entry || entry.listId !== list.id) {
    toast('Nada para desfazer nesta lista.', 'error');
    return;
  }
  ui.history.pop();
  ui.redo.push({ listId: list.id, data: JSON.stringify(list) });
  Object.assign(list, JSON.parse(entry.data));
  saveState({ immediate: true });
  renderView();
  toast('Alteração desfeita.');
}

function redo() {
  const list = activeList();
  const entry = ui.redo[ui.redo.length - 1];
  if (!list || !entry || entry.listId !== list.id) {
    toast('Nada para refazer nesta lista.', 'error');
    return;
  }
  ui.redo.pop();
  ui.history.push({ listId: list.id, data: JSON.stringify(list) });
  Object.assign(list, JSON.parse(entry.data));
  saveState({ immediate: true });
  renderView();
  toast('Alteração refeita.');
}

/* ---------- Overlay basics ---------- */

function mountOverlay(html, onReady) {
  closePopover();
  const root = $('#overlay-root');
  if (!root) return null;
  if (!root.innerHTML.trim()) {
    lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }
  root.innerHTML = html;
  document.body.classList.add('overlay-open');
  document.body.style.overflow = 'hidden';

  $$('[data-close]', root).forEach((button) => {
    button.addEventListener('click', () => closeOverlay());
  });

  if (onReady) onReady(root);

  const focusTarget = root.querySelector('[autofocus], .modal input, .drawer input, .modal select, .drawer select');
  if (focusTarget) {
    setTimeout(() => {
      try { focusTarget.focus({ preventScroll: true }); } catch { focusTarget.focus(); }
    }, 60);
  }

  hydrateAssets(root);
  return root;
}

function closeOverlay(forceRestore = false) {
  const root = $('#overlay-root');
  if (!root || !root.innerHTML.trim()) return;
  root.innerHTML = '';
  document.body.classList.remove('overlay-open');
  document.body.style.overflow = '';
  if (!forceRestore && lastFocusedElement && lastFocusedElement.isConnected) {
    try { lastFocusedElement.focus({ preventScroll: true }); } catch { lastFocusedElement.focus(); }
  }
  lastFocusedElement = null;
}

function toast(message, type = 'success') {
  const root = $('#toast-root');
  if (!root) return;
  const element = document.createElement('div');
  element.className = `toast${type === 'error' ? ' is-error' : ''}`;
  element.innerHTML = `<span class="toast-icon">${icon(type === 'error' ? 'x' : 'check')}</span><span>${escapeHtml(message)}</span>`;
  root.appendChild(element);
  setTimeout(() => {
    element.classList.add('is-leaving');
    setTimeout(() => element.remove(), 220);
  }, 3400);
}

function pickFile({ accept = '', onFile }) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = accept;
  input.style.position = 'fixed';
  input.style.left = '-9999px';
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    input.remove();
    if (file && onFile) onFile(file);
  }, { once: true });
  document.body.appendChild(input);
  input.click();
}

/* ---------- Popover ---------- */

let activePopover = null;
let activePopoverAnchor = null;
let popoverCleanup = null;

function closePopover() {
  if (activePopover) activePopover.remove();
  activePopover = null;
  if (activePopoverAnchor) activePopoverAnchor.classList.remove('is-active');
  activePopoverAnchor = null;
  if (popoverCleanup) {
    popoverCleanup();
    popoverCleanup = null;
  }
}

function openPopover(anchor, items) {
  closePopover();
  const popover = document.createElement('div');
  popover.className = 'popover';
  popover.setAttribute('role', 'menu');
  popover.innerHTML = items.map((item, index) => {
    if (item.separator) return '<div class="menu-sep"></div>';
    return `
      <button class="menu-item ${item.danger ? 'is-danger' : ''}" type="button" role="menuitem" data-menu-index="${index}">
        ${item.icon ? icon(item.icon, 'icon-sm') : ''}
        <span>${escapeHtml(item.label)}</span>
        ${item.shortcut ? `<kbd style="margin-left:auto">${escapeHtml(item.shortcut)}</kbd>` : ''}
      </button>`;
  }).join('');

  document.body.appendChild(popover);
  const rect = anchor.getBoundingClientRect();
  const width = popover.offsetWidth;
  const height = popover.offsetHeight;
  let left = Math.min(rect.right - width, window.innerWidth - width - 8);
  left = Math.max(8, left);
  let top = rect.bottom + 6;
  if (top + height > window.innerHeight - 8) top = Math.max(8, rect.top - height - 6);
  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;

  items.forEach((item, index) => {
    if (item.separator) return;
    popover.querySelector(`[data-menu-index="${index}"]`)?.addEventListener('click', (event) => {
      event.stopPropagation();
      closePopover();
      item.action?.();
    });
  });

  const handleOutside = (event) => {
    if (popover.contains(event.target) || anchor.contains(event.target)) return;
    closePopover();
  };
  const handleReposition = () => closePopover();
  setTimeout(() => {
    document.addEventListener('pointerdown', handleOutside, true);
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition, true);
  }, 0);

  popoverCleanup = () => {
    document.removeEventListener('pointerdown', handleOutside, true);
    window.removeEventListener('scroll', handleReposition, true);
    window.removeEventListener('resize', handleReposition, true);
  };

  activePopover = popover;
  activePopoverAnchor = anchor;
  anchor.classList.add('is-active');
}

/* ---------- List menus and actions ---------- */

function openListMenu(anchor, listId) {
  const list = getList(listId);
  if (!list) return;
  openPopover(anchor, [
    { label: 'Abrir tier list', icon: 'play', action: () => { location.hash = `#/list/${list.id}`; } },
    { label: 'Exportar imagem', icon: 'download', action: () => { location.hash = `#/list/${list.id}/export`; } },
    { separator: true },
    { label: list.favorite ? 'Remover dos favoritos' : 'Favoritar', icon: 'star', action: () => toggleFavorite(list.id) },
    { label: 'Renomear', icon: 'pencil', action: () => openRenameListModal(list) },
    { label: 'Duplicar', icon: 'copy', action: () => duplicateList(list.id) },
    { separator: true },
    { label: 'Excluir tier list', icon: 'trash', danger: true, action: () => deleteList(list.id) },
  ]);
}

function openEditorMenu(anchor, listId) {
  const list = getList(listId);
  if (!list) return;
  openPopover(anchor, [
    { label: list.favorite ? 'Remover dos favoritos' : 'Favoritar', icon: 'star', action: () => toggleFavorite(list.id) },
    { label: 'Renomear tier list', icon: 'pencil', action: () => openRenameListModal(list) },
    { label: 'Duplicar', icon: 'copy', action: () => duplicateList(list.id) },
    { label: 'Exportar imagem', icon: 'download', action: () => { location.hash = `#/list/${list.id}/export`; } },
    { separator: true },
    { label: 'Excluir tier list', icon: 'trash', danger: true, action: () => deleteList(list.id) },
  ]);
}

function toggleFavorite(listId) {
  const list = getList(listId);
  if (!list) return;
  list.favorite = !list.favorite;
  list.updatedAt = new Date().toISOString();
  saveState({ immediate: true });
  renderView();
  toast(list.favorite ? 'Adicionada aos favoritos.' : 'Removida dos favoritos.');
}

function duplicateList(listId) {
  const original = getList(listId);
  if (!original) return;

  const now = new Date().toISOString();
  const tierIdMap = new Map();
  const tiers = original.tiers.map((tier) => {
    const id = uid('tr');
    tierIdMap.set(tier.id, id);
    return { ...tier, id };
  });
  const items = original.items.map((item) => ({
    ...item,
    id: uid('it'),
    tierId: item.tierId ? tierIdMap.get(item.tierId) || null : null,
    createdAt: now,
  }));
  const copy = {
    ...JSON.parse(JSON.stringify(original)),
    id: uid('tl'),
    title: `${original.title} (cópia)`,
    favorite: false,
    tiers,
    items,
    createdAt: now,
    updatedAt: now,
  };
  state.lists.unshift(copy);
  saveState({ immediate: true });
  renderView();
  toast('Tier list duplicada.');
}

function deleteList(listId) {
  const list = getList(listId);
  if (!list) return;
  openConfirm({
    title: 'Excluir esta tier list?',
    message: `"${list.title}" e seu ranking serão removidos deste navegador. Essa ação não pode ser desfeita.`,
    confirmLabel: 'Excluir tier list',
    danger: true,
    onConfirm: () => {
      state.lists = state.lists.filter((entry) => entry.id !== listId);
      saveState({ immediate: true });
      if (currentRoute.id === listId) {
        history.replaceState(null, '', '#/');
        currentRoute = { name: 'home' };
        currentListId = null;
      }
      renderView();
      toast('Tier list excluída.');
    },
  });
}

function openRenameListModal(list) {
  mountOverlay(`
    <div class="scrim" data-close></div>
    <div class="modal modal-sm" role="dialog" aria-modal="true" aria-labelledby="rename-title">
      <div class="modal-head">
        <div><h2 id="rename-title">Renomear tier list</h2><p>O novo nome aparece em toda a interface.</p></div>
        <button class="icon-btn modal-close" type="button" data-close aria-label="Fechar">${icon('x')}</button>
      </div>
      <div class="modal-body">
        <label class="field">
          <span class="field-label">Nome <span class="field-hint">até 90 caracteres</span></span>
          <input class="input" id="rename-list-input" maxlength="90" value="${escapeAttr(list.title)}" autofocus />
        </label>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" type="button" data-close>Cancelar</button>
        <button class="btn btn-primary" type="button" id="rename-list-save">Salvar nome</button>
      </div>
    </div>`, (root) => {
    const input = $('#rename-list-input', root);
    const save = () => {
      const value = input.value.trim();
      if (!value) {
        toast('O nome não pode ficar vazio.', 'error');
        input.focus();
        return;
      }
      list.title = value;
      list.updatedAt = new Date().toISOString();
      saveState({ immediate: true });
      closeOverlay();
      renderView();
      toast('Nome atualizado.');
    };
    $('#rename-list-save', root)?.addEventListener('click', save);
    input?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') save();
    });
  });
}

function openConfirm({ title, message, confirmLabel = 'Confirmar', danger = false, onConfirm }) {
  mountOverlay(`
    <div class="scrim" data-close></div>
    <div class="modal modal-sm" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div class="modal-head">
        <div><h2 id="confirm-title">${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p></div>
        <button class="icon-btn modal-close" type="button" data-close aria-label="Fechar">${icon('x')}</button>
      </div>
      <div class="modal-body">
        <div class="modal-note">${icon('info')} ${danger ? 'Esta ação é permanente neste navegador.' : 'Confirme para continuar.'}</div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" type="button" data-close>Cancelar</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" type="button" id="confirm-action">${escapeHtml(confirmLabel)}</button>
      </div>
    </div>`, (root) => {
    $('#confirm-action', root)?.addEventListener('click', () => {
      closeOverlay();
      onConfirm?.();
    });
  });
}

/* ---------- Cover modal ---------- */

function openCoverModal() {
  const list = activeList();
  if (!list) return;

  let draftCover = JSON.parse(JSON.stringify(list.cover || { type: 'gradient', value: 'aurora' }));

  const previewMarkup = () => `
    <div class="preview-cover" id="cover-modal-preview">
      ${coverMarkup(draftCover, list.title)}
      <div class="preview-cover-content">
        <span class="eyebrow">Prévia da capa</span>
        <h3>${escapeHtml(list.title)}</h3>
        <p>${escapeHtml(list.description || `${pluralize(list.items.length, 'item', 'itens')} · ${pluralize(list.tiers.length, 'tier', 'tiers')}`)}</p>
      </div>
    </div>`;

  mountOverlay(`
    <div class="scrim" data-close></div>
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="cover-modal-title">
      <div class="modal-head">
        <div><h2 id="cover-modal-title">Capa da tier list</h2><p>Use um gradiente do estúdio ou envie uma imagem sua.</p></div>
        <button class="icon-btn modal-close" type="button" data-close aria-label="Fechar">${icon('x')}</button>
      </div>
      <div class="modal-body">
        ${previewMarkup()}
        <div class="cover-preset-grid" style="margin-top:14px">
          ${COVER_PRESETS.map((preset) => `
            <button class="cover-preset ${draftCover.type === 'gradient' && coverValue(draftCover) === preset.id ? 'is-selected' : ''}" type="button" data-preset="${preset.id}" aria-label="Usar capa ${preset.name}">
              <span class="cover-art cover-${preset.id}" aria-hidden="true"></span>
              <span class="cover-label">${preset.name}</span>
              <span class="cover-preset-check">${icon('check', 'icon-xs')}</span>
            </button>`).join('')}
        </div>
        <div class="upload-row">
          <button class="btn btn-secondary" type="button" id="cover-modal-upload">${icon('upload', 'icon-sm')} Enviar imagem</button>
          <button class="btn btn-ghost" type="button" id="cover-modal-reset">Usar gradiente</button>
        </div>
        <p class="tiny" style="margin-top:10px">Imagens são otimizadas e guardadas no IndexedDB deste navegador.</p>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" type="button" data-close>Cancelar</button>
        <button class="btn btn-primary" type="button" id="cover-modal-save">Usar esta capa</button>
      </div>
    </div>`, (root) => {
    const refresh = () => {
      $('#cover-modal-preview', root)?.remove();
      root.querySelector('.modal-body')?.insertAdjacentHTML('afterbegin', previewMarkup());
      hydrateAssets(root);
      $$('[data-preset]', root).forEach((button) => {
        const selected = draftCover.type === 'gradient' && button.dataset.preset === coverValue(draftCover);
        button.classList.toggle('is-selected', selected);
      });
    };

    $$('[data-preset]', root).forEach((button) => {
      button.addEventListener('click', () => {
        draftCover = { type: 'gradient', value: button.dataset.preset };
        refresh();
      });
    });

    $('#cover-modal-reset', root)?.addEventListener('click', () => {
      draftCover = { type: 'gradient', value: 'aurora' };
      refresh();
    });

    $('#cover-modal-upload', root)?.addEventListener('click', () => {
      pickFile({
        accept: 'image/jpeg,image/png,image/webp',
        onFile: async (file) => {
          try {
            draftCover = await fileToAsset(file, { width: 1200, height: 675, quality: 0.86 });
            refresh();
            toast('Imagem de capa pronta.');
          } catch (error) {
            console.error(error);
            toast(error.message || 'Não foi possível usar a imagem.', 'error');
          }
        },
      });
    });

    $('#cover-modal-save', root)?.addEventListener('click', () => {
      pushHistory(list);
      list.cover = draftCover;
      touchList(list);
      scheduleSave();
      closeOverlay();
      renderView();
      toast('Capa atualizada.');
    });
  });
}

/* ---------- Appearance drawer ---------- */

function openAppearanceDrawer() {
  const list = activeList();
  if (!list) return;

  mountOverlay(`
    <div class="scrim" data-close></div>
    <aside class="drawer drawer-lg" id="appearance-drawer" role="dialog" aria-modal="true" aria-labelledby="appearance-title">
      <div class="drawer-head">
        <div><h2 id="appearance-title">Aparência</h2><p>Theme Studio, layout dos cards e edição dos tiers.</p></div>
        <button class="icon-btn modal-close" type="button" data-close aria-label="Fechar">${icon('x')}</button>
      </div>
      <div class="drawer-body" id="appearance-body">${appearanceBodyMarkup(list)}</div>
      <div class="drawer-foot">
        <button class="btn btn-primary btn-block" type="button" data-close>${icon('check')} Concluir</button>
      </div>
    </aside>`);
}

function refreshAppearanceDrawer() {
  const body = $('#appearance-body');
  const list = activeList();
  if (!body || !list) return;
  const scroll = body.scrollTop;
  body.innerHTML = appearanceBodyMarkup(list);
  body.scrollTop = scroll;
  hydrateAssets(body);
}

function appearanceBodyMarkup(list) {
  const settings = list.settings;
  const theme = THEMES.find((item) => item.id === list.theme) || THEMES[0];
  const tiers = list.tiers;
  return `
    <section class="drawer-section">
      <div class="drawer-section-head"><h3>Theme Studio</h3><span>${theme.name} selecionado</span></div>
      <div class="theme-choice-grid">
        ${THEMES.map((item) => `
          <button class="theme-choice ${list.theme === item.id ? 'is-selected' : ''}" type="button" data-action="appearance-theme" data-theme-id="${item.id}" aria-pressed="${list.theme === item.id}">
            <span class="theme-swatch">${item.colors.map((color) => `<i style="background:${color}"></i>`).join('')}</span>
            <strong>${item.name}</strong>
            <span>${item.description}</span>
          </button>`).join('')}
      </div>
    </section>

    <section class="drawer-section">
      <div class="drawer-section-head"><h3>Cor de destaque</h3><span>${escapeHtml(list.accent)}</span></div>
      <div class="swatch-grid">
        ${ACCENT_SWATCHES.map((color) => `
          <button class="swatch ${list.accent.toLowerCase() === color.toLowerCase() ? 'is-selected' : ''}" type="button" data-action="appearance-accent" data-color="${color}" style="--swatch:${color}" aria-label="Usar cor ${color}" aria-pressed="${list.accent.toLowerCase() === color.toLowerCase()}">
            ${list.accent.toLowerCase() === color.toLowerCase() ? icon('check') : ''}
          </button>`).join('')}
      </div>
      <div class="accent-row" style="margin-top:9px">
        <input class="color-input" type="color" value="${escapeAttr(list.accent)}" id="appearance-accent-custom" data-appearance-accent aria-label="Cor de destaque personalizada" />
        <button class="btn btn-secondary btn-sm" type="button" data-action="accent-from-cover">${icon('sparkles', 'icon-sm')} Puxar da capa</button>
      </div>
    </section>

    <section class="drawer-section">
      <div class="drawer-section-head"><h3>Layout dos cards</h3><span>${settings.layout}</span></div>
      <div class="option-grid">
        <button class="option-tile ${settings.layout === 'comfortable' ? 'is-selected' : ''}" type="button" data-action="appearance-layout" data-value="comfortable" aria-pressed="${settings.layout === 'comfortable'}">${icon('menu')} Confortável</button>
        <button class="option-tile ${settings.layout === 'compact' ? 'is-selected' : ''}" type="button" data-action="appearance-layout" data-value="compact" aria-pressed="${settings.layout === 'compact'}">${icon('grid')} Compacto</button>
        <button class="option-tile ${settings.layout === 'poster' ? 'is-selected' : ''}" type="button" data-action="appearance-layout" data-value="poster" aria-pressed="${settings.layout === 'poster'}">${icon('image')} Pôster</button>
      </div>
      <div class="drawer-section-head" style="margin-top:14px"><h3>Tamanho</h3><span>${settings.size}</span></div>
      <div class="option-grid">
        <button class="option-tile ${settings.size === 'small' ? 'is-selected' : ''}" type="button" data-action="appearance-size" data-value="small" aria-pressed="${settings.size === 'small'}">Pequeno</button>
        <button class="option-tile ${settings.size === 'medium' ? 'is-selected' : ''}" type="button" data-action="appearance-size" data-value="medium" aria-pressed="${settings.size === 'medium'}">Médio</button>
        <button class="option-tile ${settings.size === 'large' ? 'is-selected' : ''}" type="button" data-action="appearance-size" data-value="large" aria-pressed="${settings.size === 'large'}">Grande</button>
      </div>
    </section>

    <section class="drawer-section">
      <div class="drawer-section-head"><h3>Fundo do quadro</h3><span>${settings.background}</span></div>
      <div class="option-grid">
        <button class="option-tile ${settings.background === 'plain' ? 'is-selected' : ''}" type="button" data-action="appearance-bg" data-value="plain" aria-pressed="${settings.background === 'plain'}">${icon('check')} Lisa</button>
        <button class="option-tile ${settings.background === 'grid' ? 'is-selected' : ''}" type="button" data-action="appearance-bg" data-value="grid" aria-pressed="${settings.background === 'grid'}">${icon('grid')} Grade</button>
        <button class="option-tile ${settings.background === 'texture' ? 'is-selected' : ''}" type="button" data-action="appearance-bg" data-value="texture" aria-pressed="${settings.background === 'texture'}">${icon('sparkles')} Textura</button>
      </div>
    </section>

    <section class="drawer-section">
      <div class="drawer-section-head"><h3>Conteúdo do card</h3><span>legendas</span></div>
      <div class="toggle-row">
        <span>Mostrar detalhe</span>
        <button class="switch" type="button" role="switch" aria-checked="${settings.showArtist}" data-action="appearance-toggle" data-setting="showArtist" aria-label="Mostrar detalhe"></button>
      </div>
      <div class="toggle-row">
        <span>Mostrar nome do item</span>
        <button class="switch" type="button" role="switch" aria-checked="${settings.showTitle}" data-action="appearance-toggle" data-setting="showTitle" aria-label="Mostrar nome do item"></button>
      </div>
      <div class="toggle-row">
        <span>Indicar itens com nota</span>
        <button class="switch" type="button" role="switch" aria-checked="${settings.showNote}" data-action="appearance-toggle" data-setting="showNote" aria-label="Indicar itens com nota"></button>
      </div>
    </section>

    <section class="drawer-section">
      <div class="drawer-section-head"><h3>Tiers</h3><span>${tiers.length} de ${MAX_TIERS}</span></div>
      <div class="tier-manage-list">
        ${tiers.map((tier, index) => {
          const count = tierItems(list, tier.id).length;
          return `
            <div class="tier-manage-row">
              <span class="tier-manage-swatch" style="--tier-color:${tier.color};--tier-ink:${contrastInk(tier.color)}">${escapeHtml(tier.label)}</span>
              <span class="tier-manage-copy"><strong>${escapeHtml(tier.label)}</strong><small>${pluralize(count, 'item', 'itens')}</small></span>
              <span class="tier-manage-actions">
                <button class="icon-btn" type="button" data-action="appearance-tier-up" data-tier-id="${tier.id}" aria-label="Mover tier para cima" ${index === 0 ? 'disabled' : ''}>${icon('arrow-up', 'icon-sm')}</button>
                <button class="icon-btn" type="button" data-action="appearance-tier-down" data-tier-id="${tier.id}" aria-label="Mover tier para baixo" ${index === tiers.length - 1 ? 'disabled' : ''}>${icon('arrow-down', 'icon-sm')}</button>
                <button class="icon-btn" type="button" data-action="appearance-tier-edit" data-tier-id="${tier.id}" aria-label="Editar tier ${escapeAttr(tier.label)}">${icon('pencil', 'icon-sm')}</button>
              </span>
            </div>`;
        }).join('')}
      </div>
      <button class="btn btn-secondary btn-sm btn-block" style="margin-top:8px" type="button" data-action="appearance-add-tier" ${tiers.length >= MAX_TIERS ? 'disabled' : ''}>${icon('plus', 'icon-sm')} Adicionar tier</button>
      <p class="form-note" style="margin-top:7px">Tiers vazios podem ser removidos no editor do próprio tier.</p>
    </section>`;
}

function setListTheme(themeId) {
  const list = activeList();
  if (!list) return;
  const theme = THEMES.find((item) => item.id === themeId);
  if (!theme) return;
  pushHistory(list);
  list.theme = theme.id;
  list.accent = THEME_ACCENTS[theme.id] || list.accent;
  touchList(list);
  scheduleSave();
  renderView();
  refreshAppearanceDrawer();
}

function setListAccent(color) {
  const list = activeList();
  if (!list || !/^#[0-9a-f]{6}$/i.test(color)) return;
  pushHistory(list);
  list.accent = color;
  touchList(list);
  scheduleSave();
  renderView();
  refreshAppearanceDrawer();
}

async function setAccentFromCover() {
  const list = activeList();
  if (!list) return;
  const color = await extractCoverAccent(list.cover);
  if (!color) {
    toast('Não foi possível extrair uma cor desta capa.', 'error');
    return;
  }
  setListAccent(color);
  toast(`Cor ${color} aplicada da capa.`);
}

function updateBoardSettings(patch) {
  const list = activeList();
  if (!list) return;
  pushHistory(list);
  list.settings = { ...list.settings, ...patch };
  touchList(list);
  scheduleSave();
  renderView();
  refreshAppearanceDrawer();
}

function addTier({ fromAppearance = false } = {}) {
  const list = activeList();
  if (!list) return;
  if (list.tiers.length >= MAX_TIERS) {
    toast(`O limite é de ${MAX_TIERS} tiers por lista.`, 'error');
    return;
  }

  const usedLabels = new Set(list.tiers.map((tier) => tier.label.toUpperCase()));
  let next = TIER_PALETTE.find((tier) => !usedLabels.has(tier.label));
  if (!next) {
    next = { label: `T${list.tiers.length + 1}`, color: TIER_PALETTE[list.tiers.length % TIER_PALETTE.length].color };
  }

  pushHistory(list);
  const tier = { id: uid('tr'), label: next.label, color: next.color, order: list.tiers.length };
  list.tiers.push(tier);
  touchList(list);
  scheduleSave();
  renderView();
  if (fromAppearance) refreshAppearanceDrawer();
  openTierModal(tier.id, { fromAppearance });
}

function moveTier(tierId, direction) {
  const list = activeList();
  if (!list) return;
  const index = list.tiers.findIndex((tier) => tier.id === tierId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= list.tiers.length) return;
  pushHistory(list);
  const [tier] = list.tiers.splice(index, 1);
  list.tiers.splice(target, 0, tier);
  list.tiers.forEach((entry, position) => { entry.order = position; });
  touchList(list);
  scheduleSave();
  renderView();
  refreshAppearanceDrawer();
}

/* ---------- Tier modal ---------- */

function finishTierEditing(reopen) {
  closeOverlay();
  if (reopen) {
    setTimeout(() => openAppearanceDrawer(), 20);
  }
}

function openTierModal(tierId, { fromAppearance = false } = {}) {
  const list = activeList();
  if (!list) return;
  const tier = list.tiers.find((entry) => entry.id === tierId);
  if (!tier) return;

  let draftLabel = tier.label;
  let draftColor = tier.color;
  const count = tierItems(list, tier.id).length;
  const colors = Array.from(new Set([
    ...TIER_PALETTE.map((entry) => entry.color),
    '#ffffff', '#a1a1aa', '#0a0a0d', '#f59f00', '#22b8cf', '#e64980',
  ]));

  const root = mountOverlay(`
    <div class="scrim" data-close></div>
    <div class="modal modal-sm" role="dialog" aria-modal="true" aria-labelledby="tier-modal-title">
      <div class="modal-head">
        <div><h2 id="tier-modal-title">Editar tier</h2><p>${pluralize(count, 'item', 'itens')} neste tier. O nome também pode ser uma palavra.</p></div>
        <button class="icon-btn modal-close" type="button" data-close aria-label="Fechar">${icon('x')}</button>
      </div>
      <div class="modal-body">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">
          <span class="tier-pill" id="tier-draft-swatch" style="--tier-color:${draftColor};--tier-ink:${contrastInk(draftColor)};min-width:58px;height:58px;font-size:25px">${escapeHtml(draftLabel || '?')}</span>
          <div><strong style="font-size:12px">${escapeHtml(draftLabel || 'Sem nome')}</strong><p class="tiny">${pluralize(count, 'item', 'itens')} · arraste para reorganizar</p></div>
        </div>
        <label class="field" style="margin-bottom:16px">
          <span class="field-label">Nome do tier <span class="field-hint">até 20 caracteres</span></span>
          <input class="input" id="tier-label-input" maxlength="20" value="${escapeAttr(draftLabel)}" autofocus />
        </label>
        <div class="field">
          <span class="field-label">Cor <span class="field-hint" id="tier-color-label">${draftColor}</span></span>
          <div class="color-swatches">
            ${colors.map((color) => `<button class="color-swatch ${color.toLowerCase() === draftColor.toLowerCase() ? 'is-selected' : ''}" type="button" data-tier-color="${color}" style="--swatch:${color}" aria-label="Cor ${color}"></button>`).join('')}
          </div>
          <div class="accent-row" style="margin-top:9px">
            <input class="color-input" type="color" id="tier-color-input" value="${draftColor}" aria-label="Cor personalizada do tier" />
            <span class="tiny">Escolha uma cor da paleta ou personalize.</span>
          </div>
        </div>
      </div>
      <div class="modal-foot">
        ${list.tiers.length > 1 ? `<button class="btn btn-danger btn-sm" type="button" id="tier-delete">${icon('trash', 'icon-sm')} Excluir tier</button>` : ''}
        <button class="btn btn-ghost" type="button" data-close>Cancelar</button>
        <button class="btn btn-primary" type="button" id="tier-save">Salvar tier</button>
      </div>
    </div>`, (rootElement) => {
    const labelInput = $('#tier-label-input', rootElement);
    const colorInput = $('#tier-color-input', rootElement);

    const syncDraft = () => {
      draftLabel = labelInput.value;
      const swatch = $('#tier-draft-swatch', rootElement);
      if (swatch) {
        swatch.textContent = draftLabel.trim() || '?';
        swatch.style.setProperty('--tier-color', draftColor);
        swatch.style.setProperty('--tier-ink', contrastInk(draftColor));
      }
      const colorLabel = $('#tier-color-label', rootElement);
      if (colorLabel) colorLabel.textContent = draftColor;
      $$('[data-tier-color]', rootElement).forEach((button) => {
        button.classList.toggle('is-selected', button.dataset.tierColor.toLowerCase() === draftColor.toLowerCase());
      });
      colorInput.value = draftColor;
    };

    labelInput?.addEventListener('input', syncDraft);
    colorInput?.addEventListener('input', () => {
      draftColor = colorInput.value;
      syncDraft();
    });
    $$('[data-tier-color]', rootElement).forEach((button) => {
      button.addEventListener('click', () => {
        draftColor = button.dataset.tierColor;
        syncDraft();
      });
    });

    $$('[data-close]', rootElement).forEach((button) => {
      button.addEventListener('click', () => {
        if (fromAppearance) setTimeout(() => openAppearanceDrawer(), 20);
      });
    });

    $('#tier-save', rootElement)?.addEventListener('click', () => {
      const label = (labelInput.value || '').trim() || 'Tier';
      pushHistory(list);
      tier.label = label.slice(0, 20);
      tier.color = draftColor;
      touchList(list);
      scheduleSave();
      finishTierEditing(fromAppearance);
      renderView();
      toast('Tier atualizado.');
    });

    $('#tier-delete', rootElement)?.addEventListener('click', () => {
      const reopen = fromAppearance;
      openConfirm({
        title: `Excluir o tier ${tier.label}?`,
        message: count
          ? `${pluralize(count, 'item', 'itens')} voltarão para os não ranqueados.`
          : 'O tier será removido da estrutura da lista.',
        confirmLabel: 'Excluir tier',
        danger: true,
        onConfirm: () => {
          pushHistory(list);
          list.tiers = list.tiers.filter((entry) => entry.id !== tier.id);
          list.items.forEach((item) => {
            if (item.tierId === tier.id) {
              item.tierId = null;
              item.order = Number.MAX_SAFE_INTEGER;
            }
          });
          list.tiers.forEach((entry, position) => { entry.order = position; });
          reindexTier(list, null);
          touchList(list);
          saveState({ immediate: true });
          renderView();
          if (reopen) setTimeout(() => openAppearanceDrawer(), 20);
          toast('Tier excluído.');
        },
      });
    });
  });
}

/* ---------- Album drawer ---------- */

function gradientIndex(cover) {
  if (!cover || cover.type !== 'gradient') return 0;
  const value = String(cover.value || '').replace('cv-', '');
  return clamp(Number(value) || 0, 0, 16);
}

function openAlbumDrawer(itemId = null, targetTierId = null) {
  const list = activeList();
  if (!list) return;

  const existing = itemId ? list.items.find((item) => item.id === itemId) : null;
  const editing = Boolean(existing);

  const draft = {
    title: existing?.title || '',
    artist: existing?.artist || '',
    note: existing?.note || '',
    cover: existing
      ? JSON.parse(JSON.stringify(existing.cover))
      : null,
    tierId: existing ? (existing.tierId || '') : (targetTierId || ''),
  };

  const tierOptions = `
    <option value="" ${!draft.tierId ? 'selected' : ''}>Não ranqueado</option>
    ${list.tiers.map((tier) => `<option value="${tier.id}" ${draft.tierId === tier.id ? 'selected' : ''}>${escapeHtml(tier.label)}</option>`).join('')}`;

  mountOverlay(`
    <div class="scrim" data-close></div>
    <aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="album-drawer-title">
      <div class="drawer-head">
        <div>
          <h2 id="album-drawer-title">${editing ? 'Editar item' : 'Adicionar item'}</h2>
          <p>${editing ? 'Ajuste os detalhes ou mova para outro tier.' : 'Envie uma foto. Nome, detalhe e nota podem ficar para depois.'}</p>
        </div>
        <button class="icon-btn modal-close" type="button" data-close aria-label="Fechar">${icon('x')}</button>
      </div>
      <div class="drawer-body">
        <div class="detail-cover-large${editing ? '' : ' is-photo-empty'}" id="album-preview">
          ${editing
            ? albumArtMarkup(draft.cover, draft.title || 'Prévia do item')
            : `<div class="item-photo-empty">${icon('image')}<strong>Envie uma foto</strong><span>É o único passo para adicionar.</span></div>`}
        </div>
        <div class="detail-cover-actions">
          <button class="btn ${editing ? 'btn-secondary' : 'btn-primary'} btn-sm" type="button" id="album-upload">${icon('upload', 'icon-sm')} ${editing ? 'Trocar foto' : 'Escolher foto'}</button>
        </div>
        ${editing ? '' : '<p class="form-note" style="text-align:center;margin:-7px 0 4px">A foto é tudo o que você precisa. O resto pode ficar para depois.</p>'}

        ${editing ? `
        <div class="album-form">
          <label class="field">
            <span class="field-label">Nome do item <span class="field-hint">opcional</span></span>
            <input class="input" id="album-title" maxlength="100" value="${escapeAttr(draft.title)}" placeholder="Ex.: Blonde, Elden Ring, Interestelar" />
          </label>
          <div class="field-row">
            <label class="field">
              <span class="field-label">Detalhe</span>
              <input class="input" id="album-artist" maxlength="100" value="${escapeAttr(draft.artist)}" placeholder="Ex.: Frank Ocean, FromSoftware, 2014" />
            </label>
            <label class="field">
              <span class="field-label">Tier</span>
              <select class="select" id="album-tier">${tierOptions}</select>
            </label>
          </div>
          <label class="field">
            <span class="field-label">Nota pessoal <span class="field-hint">opcional</span></span>
            <textarea class="textarea" id="album-note" maxlength="500" placeholder="Por que esse item está aqui?">${escapeHtml(draft.note)}</textarea>
          </label>
        </div>

        <div class="drawer-section">
          <div class="drawer-section-head"><h3>Capas do estúdio</h3><span>16 gradientes</span></div>
          <div class="cover-chip-grid" id="album-cover-chips">
            ${Array.from({ length: 16 }, (_, index) => index + 1).map((index) => `
              <button class="cover-chip ${draft.cover?.type === 'gradient' && gradientIndex(draft.cover) === index ? 'is-selected' : ''}" type="button" data-cover-index="${index}" aria-label="Usar gradiente ${index}">
                <span class="cv-${index}" aria-hidden="true"></span>
              </button>`).join('')}
          </div>
        </div>` : ''}
      </div>
      <div class="drawer-foot" style="display:flex;gap:7px">
        ${editing ? `<button class="btn btn-danger btn-sm" type="button" id="album-delete" style="margin-right:auto">${icon('trash', 'icon-sm')} Excluir</button>` : ''}
        <button class="btn btn-ghost" type="button" data-close>Cancelar</button>
        <button class="btn btn-primary" type="button" id="album-save"${editing ? '' : ' disabled'}>${editing ? 'Salvar item' : 'Adicionar item'}</button>
      </div>
    </aside>`, (root) => {
    const titleInput = $('#album-title', root);
    const artistInput = $('#album-artist', root);
    const noteInput = $('#album-note', root);
    const tierSelect = $('#album-tier', root);
    const saveButton = $('#album-save', root);

    const refreshSaveState = () => {
      if (!saveButton || editing) return;
      saveButton.disabled = !(draft.cover?.type === 'asset' || draft.cover?.type === 'url');
    };

    const syncPreview = () => {
      const preview = $('#album-preview', root);
      if (preview) {
        preview.innerHTML = editing || draft.cover
          ? albumArtMarkup(draft.cover, draft.title || 'Prévia do item')
          : `<div class="item-photo-empty">${icon('image')}<strong>Envie uma foto</strong><span>É o único passo para adicionar.</span></div>`;
      }
      hydrateAssets(root);
      $$('[data-cover-index]', root).forEach((button) => {
        button.classList.toggle('is-selected', draft.cover?.type === 'gradient' && gradientIndex(draft.cover) === Number(button.dataset.coverIndex));
      });
      refreshSaveState();
    };

    if (!editing) {
      const preview = $('#album-preview', root);
      const openPicker = () => $('#album-upload', root)?.click();
      if (preview) {
        preview.setAttribute('role', 'button');
        preview.setAttribute('tabindex', '0');
        preview.setAttribute('aria-label', 'Escolher foto do item');
        preview.addEventListener('click', openPicker);
        preview.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openPicker();
          }
        });
      }
    }

    $$('[data-cover-index]', root).forEach((button) => {
      button.addEventListener('click', () => {
        draft.cover = { type: 'gradient', value: `cv-${button.dataset.coverIndex}` };
        syncPreview();
      });
    });

    $('#album-upload', root)?.addEventListener('click', () => {
      pickFile({
        accept: 'image/jpeg,image/png,image/webp',
        onFile: async (file) => {
          try {
            draft.cover = await fileToAsset(file, { width: 512, height: 512, quality: 0.86 });
            const cleanName = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
            if (cleanName && (!titleInput || !titleInput.value.trim())) {
              draft.title = cleanName.slice(0, 100);
              if (titleInput) titleInput.value = draft.title;
            }
            syncPreview();
            toast('Foto pronta. Só falta adicionar.');
          } catch (error) {
            console.error(error);
            toast(error.message || 'Não foi possível usar essa imagem.', 'error');
          }
        },
      });
    });

    $('#album-save', root)?.addEventListener('click', () => {
      if (!editing && !(draft.cover?.type === 'asset' || draft.cover?.type === 'url')) {
        toast('Escolha uma foto para adicionar o item.', 'error');
        return;
      }
      if (editing) {
        draft.title = titleInput.value.trim() || 'Sem título';
        draft.artist = artistInput.value.trim();
        draft.note = noteInput.value.trim();
        draft.tierId = tierSelect.value || '';
      } else {
        draft.title = (draft.title || '').trim() || 'Sem título';
        draft.artist = '';
        draft.note = '';
      }
      pushHistory(list);

      if (existing) {
        const previousTier = existing.tierId || null;
        const nextTier = draft.tierId || null;
        existing.title = draft.title;
        existing.artist = draft.artist;
        existing.note = draft.note;
        existing.cover = draft.cover;
        existing.tierId = nextTier;
        if (previousTier !== nextTier) {
          existing.order = list.items.filter((item) => item.id !== existing.id && (item.tierId || null) === nextTier).length;
          reindexTier(list, previousTier);
        }
        reindexTier(list, nextTier);
      } else {
        const nextTier = draft.tierId || null;
        list.items.push({
          id: uid('it'),
          tierId: nextTier,
          order: list.items.filter((item) => (item.tierId || null) === nextTier).length,
          title: draft.title,
          artist: draft.artist,
          cover: draft.cover,
          note: draft.note,
          createdAt: new Date().toISOString(),
        });
      }

      touchList(list);
      scheduleSave();
      closeOverlay();
      renderView();
      toast(editing ? 'Item atualizado.' : 'Item adicionado.');
    });

    $('#album-delete', root)?.addEventListener('click', () => {
      if (!existing) return;
      openConfirm({
        title: 'Excluir este item?',
        message: `"${existing.title}" sai da tier list. A foto enviada pode continuar disponível no navegador.`,
        confirmLabel: 'Excluir item',
        danger: true,
        onConfirm: () => {
          pushHistory(list);
          list.items = list.items.filter((item) => item.id !== existing.id);
          reindexTier(list, existing.tierId || null);
          touchList(list);
          saveState({ immediate: true });
          renderView();
          toast('Item excluído.');
        },
      });
    });
  });
}

/* ---------- Color extraction ---------- */

function rgbToHex(red, green, blue) {
  const toHex = (value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0');
  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

function rgbToHsl(red, green, blue) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const delta = max - min;
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    if (max === r) h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / delta + 2) / 6;
    else h = ((r - g) / delta + 4) / 6;
  }
  return { h: h * 360, s, l };
}

function hslToHex(hue, saturation, lightness) {
  const h = ((hue % 360) + 360) % 360 / 360;
  const s = clamp(saturation, 0, 1);
  const l = clamp(lightness, 0, 1);
  if (s === 0) {
    const value = Math.round(l * 255);
    return rgbToHex(value, value, value);
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t) => {
    let temp = t;
    if (temp < 0) temp += 1;
    if (temp > 1) temp -= 1;
    if (temp < 1 / 6) return p + (q - p) * 6 * temp;
    if (temp < 1 / 2) return q;
    if (temp < 2 / 3) return p + (q - p) * (2 / 3 - temp) * 6;
    return p;
  };
  return rgbToHex(channel(h + 1 / 3) * 255, channel(h) * 255, channel(h - 1 / 3) * 255);
}

function tuneAccent(red, green, blue) {
  const { h, s, l } = rgbToHsl(red, green, blue);
  return hslToHex(h, Math.max(0.46, s), clamp(l, 0.46, 0.72));
}

function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Imagem indisponível'));
    image.src = url;
  });
}

async function extractCoverAccent(cover) {
  if (!cover) return null;
  if (cover.type === 'gradient') return coverAccent(cover);

  let url = null;
  try {
    if (cover.type === 'asset') url = await getAssetUrl(cover.assetId);
    else if (cover.type === 'url') url = cover.url;
    if (!url) return null;

    const image = await loadImageFromUrl(url);
    const canvas = document.createElement('canvas');
    canvas.width = 24;
    canvas.height = 24;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, 24, 24);
    const data = context.getImageData(0, 0, 24, 24).data;
    let red = 0;
    let green = 0;
    let blue = 0;
    let samples = 0;
    let fallbackRed = 0;
    let fallbackGreen = 0;
    let fallbackBlue = 0;
    let fallbackSamples = 0;

    for (let index = 0; index < data.length; index += 4) {
      const alpha = data[index + 3];
      if (alpha < 180) continue;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      fallbackRed += r;
      fallbackGreen += g;
      fallbackBlue += b;
      fallbackSamples += 1;
      const { s, l } = rgbToHsl(r, g, b);
      if (s > 0.24 && l > 0.12 && l < 0.9) {
        red += r;
        green += g;
        blue += b;
        samples += 1;
      }
    }

    if (samples) return tuneAccent(red / samples, green / samples, blue / samples);
    if (fallbackSamples) return tuneAccent(fallbackRed / fallbackSamples, fallbackGreen / fallbackSamples, fallbackBlue / fallbackSamples);
  } catch (error) {
    console.warn('Não foi possível extrair a cor da capa.', error);
  }
  return null;
}

/* ---------- Export ---------- */

function slugify(value) {
  return String(value || 'tierlist')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'tierlist';
}

function exportBackgroundClass(list) {
  const background = ui.exportOptions.background;
  if (background === 'transparent') return 'is-transparent';
  if (background === 'light') return 'is-light';
  return list.theme === 'paper' ? 'is-light' : '';
}

function renderExportSheet(list) {
  const background = ui.exportOptions.background;
  const themeClasses = exportBackgroundClass(list);
  const pool = tierItems(list, null);
  const rows = list.tiers.map((tier) => {
    const items = tierItems(list, tier.id);
    return `
      <div class="export-tier">
        <div class="export-tier-label" style="--tier-color:${tier.color};--tier-ink:${contrastInk(tier.color)}"><span class="export-tier-label-text">${escapeHtml(tier.label)}</span></div>
        <div class="export-tier-items">
          ${items.length ? items.map((item) => `<div class="export-album">${albumArtMarkup(item.cover, item.title)}</div>`).join('') : '<span class="tiny">Sem itens</span>'}
        </div>
      </div>`;
  }).join('');

  const poolRow = pool.length ? `
    <div class="export-tier">
      <div class="export-tier-label" style="--tier-color:#3f3f46;--tier-ink:#ffffff"><span class="export-tier-label-text">N/R</span></div>
      <div class="export-tier-items">
        ${pool.map((item) => `<div class="export-album">${albumArtMarkup(item.cover, item.title)}</div>`).join('')}
      </div>
    </div>` : '';

  return `
    <div class="export-sheet ${themeClasses}" id="export-sheet">
      <div class="export-cover">
        ${coverMarkup(list.cover, list.title)}
        <div class="export-cover-content">
          <h1>${escapeHtml(list.title)}</h1>
          <p>${escapeHtml(list.description || `${pluralize(list.items.length, 'item', 'itens')} · ${pluralize(list.tiers.length, 'tier', 'tiers')}`)}</p>
        </div>
      </div>
      <div class="export-tiers">${rows}${poolRow}</div>
      <div class="export-foot">
        <span>SITERLIST${background === 'transparent' ? '' : ' · FEITO À MÃO'}</span>
        <span>${formatDateLong()}</span>
      </div>
    </div>`;
}

function renderExport(list) {
  const options = ui.exportOptions;
  const activeFormat = options.format || 'png';
  return `
    <header class="page-head">
      <div>
        <span class="eyebrow">Publicar · ${pluralize(list.items.length, 'item', 'itens')}</span>
        <h1 class="page-title">Exportar</h1>
        <p class="page-sub">Uma imagem pronta para compartilhar, com a mesma identidade que você montou no estúdio.</p>
      </div>
      <div class="head-actions">
        <a class="btn btn-secondary" href="#/list/${list.id}">${icon('arrow-left')}<span class="btn-label">Voltar ao editor</span></a>
      </div>
    </header>

    <div class="export-layout">
      <div class="export-preview-wrap" id="export-preview-wrap">
        ${renderExportSheet(list)}
      </div>
      <aside class="export-options">
        <div class="export-option-group">
          <span>Formato</span>
          <div class="segmented">
            <button type="button" class="${activeFormat === 'png' ? 'is-active' : ''}" data-action="export-format" data-value="png">PNG</button>
            <button type="button" class="${activeFormat === 'webp' ? 'is-active' : ''}" data-action="export-format" data-value="webp">WebP</button>
          </div>
        </div>
        <div class="export-option-group">
          <span>Resolução</span>
          <div class="segmented">
            ${[1, 2, 3].map((scale) => `<button type="button" class="${Number(options.scale) === scale ? 'is-active' : ''}" data-action="export-scale" data-value="${scale}">${scale}×</button>`).join('')}
          </div>
        </div>
        <div class="export-option-group">
          <span>Fundo</span>
          <div class="segmented">
            <button type="button" class="${options.background === 'theme' ? 'is-active' : ''}" data-action="export-background" data-value="theme">Tema</button>
            <button type="button" class="${options.background === 'light' ? 'is-active' : ''}" data-action="export-background" data-value="light">Claro</button>
            <button type="button" class="${options.background === 'transparent' ? 'is-active' : ''}" data-action="export-background" data-value="transparent">Vazio</button>
          </div>
        </div>
        <button class="btn btn-primary btn-block" type="button" data-action="export-download">${icon('download')} Baixar imagem</button>
        <button class="btn btn-secondary btn-block" type="button" data-action="export-copy">${icon('copy')} Copiar como texto</button>
        <p class="export-note">A exportação usa as imagens deste navegador. Capas externas podem exigir CORS. Para um backup completo da estrutura, use Configurações → Exportar backup.</p>
      </aside>
    </div>`;
}

function refreshExportOptions() {
  const groupButtons = $$('.export-option-group [data-action]');
  groupButtons.forEach((button) => {
    const action = button.dataset.action;
    const value = button.dataset.value;
    let active = false;
    if (action === 'export-format') active = value === (ui.exportOptions.format || 'png');
    if (action === 'export-scale') active = Number(value) === Number(ui.exportOptions.scale);
    if (action === 'export-background') active = value === ui.exportOptions.background;
    button.classList.toggle('is-active', active);
  });

  const list = getList(currentRoute.id);
  const sheet = $('#export-sheet');
  if (list && sheet) {
    sheet.className = `export-sheet ${exportBackgroundClass(list)}`.trim();
  }
}

async function waitForSheetAssets(sheet) {
  if (!sheet) return;
  await hydrateAssets(sheet);
  if (document.fonts?.ready) {
    try { await document.fonts.ready; } catch { /* segue */ }
  }
  const images = $$('img', sheet);
  await Promise.all(images.map((image) => {
    if (image.complete) return Promise.resolve();
    return new Promise((resolve) => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', resolve, { once: true });
    });
  }));
}

async function downloadExport() {
  const list = getList(currentRoute.id);
  const sheet = $('#export-sheet');
  if (!list || !sheet) return;

  if (typeof window.html2canvas !== 'function') {
    toast('O renderizador de imagem ainda está carregando. Tente novamente em instantes.', 'error');
    return;
  }

  const button = $('[data-action="export-download"]');
  const original = button?.innerHTML;
  if (button) {
    button.disabled = true;
    button.innerHTML = `${icon('sparkles')} Renderizando...`;
  }

  try {
    await waitForSheetAssets(sheet);
    const format = ui.exportOptions.format || 'png';
    const scale = clamp(Number(ui.exportOptions.scale) || 2, 1, 3);
    const transparent = ui.exportOptions.background === 'transparent';
    const light = exportBackgroundClass(list).includes('is-light');

    const canvas = await window.html2canvas(sheet, {
      scale,
      backgroundColor: transparent ? null : (light ? '#f6f1e8' : '#101014'),
      useCORS: true,
      allowTaint: false,
      logging: false,
      width: sheet.scrollWidth,
      height: sheet.scrollHeight,
    });

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, format === 'webp' ? 'image/webp' : 'image/png', 0.96));
    if (!blob) throw new Error('Não foi possível gerar o arquivo.');

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${slugify(list.title)}.${format === 'webp' ? 'webp' : 'png'}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast('Imagem exportada.');
  } catch (error) {
    console.error(error);
    toast('Não foi possível gerar a imagem. Verifique as capas externas e tente novamente.', 'error');
  } finally {
    if (button) {
      button.disabled = false;
      button.innerHTML = original;
    }
  }
}

async function copyListAsText() {
  const list = getList(currentRoute.id);
  if (!list) return;
  const lines = [list.title];
  if (list.description) lines.push(list.description);
  lines.push('');
  list.tiers.forEach((tier) => {
    const items = tierItems(list, tier.id);
    lines.push(`${tier.label.toUpperCase()}${items.length ? `: ${items.map((item) => `${item.title} — ${item.artist}`).join(' · ')}` : ': —'}`);
  });
  const pool = tierItems(list, null);
  if (pool.length) lines.push(`NÃO RANQUEADOS: ${pool.map((item) => item.title).join(' · ')}`);
  lines.push('', 'Feito no SiterList.');
  const text = lines.join('\n');

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      throw new Error('Clipboard indisponível');
    }
    toast('Ranking copiado como texto.');
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      toast('Ranking copiado como texto.');
    } catch {
      toast('Não foi possível copiar o ranking.', 'error');
    }
    textarea.remove();
  }
}

/* ---------- Settings ---------- */

function melCatSvg() {
  return `
    <svg class="mel-cat-svg" viewBox="0 0 190 150" aria-hidden="true">
      <defs>
        <linearGradient id="mel-fur" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fffdfd"/>
          <stop offset="1" stop-color="#ffe3ed"/>
        </linearGradient>
        <linearGradient id="mel-ear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffd9e6"/>
          <stop offset="1" stop-color="#f6b7cc"/>
        </linearGradient>
      </defs>
      <path d="M143 34c5-9 15-11 22-5 7 6 8 16 2 23-5 6-15 8-22 2-7-6-7-14-2-20Z" fill="#f3a9c2" opacity=".55"/>
      <path d="M159 28c1.8-3.3 6.2-4 8.9-1.4 2.6 2.5 2.4 6.6-.4 8.9-2.3 1.9-5.7 1.7-7.7-.5-2-2.1-2.1-5.1-.8-7Z" fill="#fff7fa"/>
      <path d="M47 56 37 19l38 20Z" fill="url(#mel-ear)" stroke="#d98aa5" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M143 56l10-37-38 20Z" fill="url(#mel-ear)" stroke="#d98aa5" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M43 62c0-26 23-43 52-43s52 17 52 43v27c0 25-23 39-52 39S43 114 43 89Z" fill="url(#mel-fur)" stroke="#d98aa5" stroke-width="2.8"/>
      <path d="M55 43c7-13 19-21 36-23" fill="none" stroke="#f9cad9" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="73" cy="72" rx="4.6" ry="6" fill="#5a3342"/>
      <ellipse cx="117" cy="72" rx="4.6" ry="6" fill="#5a3342"/>
      <circle cx="71.5" cy="70" r="1.7" fill="#fff"/>
      <circle cx="115.5" cy="70" r="1.7" fill="#fff"/>
      <path d="M92 84c-2.8 0-4.8 1.9-4.8 3.8 0 1.9 2 3 4.8 3s4.8-1.1 4.8-3c0-1.9-2-3.8-4.8-3.8Z" fill="#e58aab"/>
      <path d="M95 91c0 4.7-4.6 7.2-9.3 5.4M95 91c0 4.7 4.6 7.2 9.3 5.4" fill="none" stroke="#b96c87" stroke-width="2.1" stroke-linecap="round"/>
      <ellipse cx="62" cy="88" rx="7.5" ry="3.6" fill="#f7b7cb" opacity=".8"/>
      <ellipse cx="128" cy="88" rx="7.5" ry="3.6" fill="#f7b7cb" opacity=".8"/>
      <path d="M52 80 29 76M52 87 27 89M138 80l23-4M138 87l25 2" stroke="#c9849c" stroke-width="1.9" stroke-linecap="round"/>
      <path d="M65 118c0-7 6-11 13-11s13 4 13 11" fill="#fffafc" stroke="#d98aa5" stroke-width="2.6"/>
      <path d="M105 118c0-7 6-11 13-11s13 4 13 11" fill="#fffafc" stroke="#d98aa5" stroke-width="2.6"/>
      <path d="M82 126c-4-6-1-13 5-13 4.5 0 7.5 3 8.5 6.5 1-3.5 4-6.5 8.5-6.5 6 0 9 7 5 13" fill="#f7b7cb" stroke="#d98aa5" stroke-width="2.3" stroke-linejoin="round"/>
    </svg>
  `;
}

function renderSettings() {
  return `
    <header class="page-head">
      <div>
        <span class="eyebrow">Preferências</span>
        <h1 class="page-title">Configurações</h1>
        <p class="page-sub">Ajuste a experiência e gerencie tudo o que vive neste navegador. Sem contas, sem servidores.</p>
      </div>
    </header>

    <div class="settings-grid">
      <div class="settings-col">
        <section class="panel">
          <div class="panel-head">
            <div><h2>Aparência</h2><p>Como o estúdio se apresenta para você.</p></div>
            ${icon('palette', 'icon-lg')}
          </div>
          <div class="panel-body">
            <div class="setting-row">
              <div class="setting-copy"><strong>Tema da interface</strong><p>Sistema segue a preferência do seu dispositivo.</p></div>
              <div class="setting-control">
                <div class="segmented">
                  <button type="button" class="${state.settings.themeMode === 'system' ? 'is-active' : ''}" data-action="set-theme-mode" data-mode="system">Sistema</button>
                  <button type="button" class="${state.settings.themeMode === 'light' ? 'is-active' : ''}" data-action="set-theme-mode" data-mode="light">Claro</button>
                  <button type="button" class="${state.settings.themeMode === 'dark' ? 'is-active' : ''}" data-action="set-theme-mode" data-mode="dark">Escuro</button>
                </div>
              </div>
            </div>
            <div class="mel-theme-card ${state.settings.themeMode === 'mel' ? 'is-active' : ''}">
              <div class="mel-theme-art">${melCatSvg()}</div>
              <div class="mel-theme-copy">
                <span class="mel-theme-eyebrow">${icon('paw', 'icon-xs')} Tema especial</span>
                <strong>Mel</strong>
                <p>Rosa pastel, patinhas e um gatinho para deixar o estúdio mais fofo.</p>
              </div>
              <button class="btn ${state.settings.themeMode === 'mel' ? 'btn-primary' : 'btn-secondary'} btn-sm mel-theme-btn" type="button" data-action="set-theme-mode" data-mode="${state.settings.themeMode === 'mel' ? 'system' : 'mel'}" aria-pressed="${state.settings.themeMode === 'mel'}" title="${state.settings.themeMode === 'mel' ? 'Desativar Mel e voltar ao tema do sistema' : 'Ativar o tema Mel'}">
                ${state.settings.themeMode === 'mel' ? `${icon('check', 'icon-sm')} Ativado` : `${icon('paw', 'icon-sm')} Ativar Mel`}
              </button>
            </div>
            <div class="setting-row">
              <div class="setting-copy"><strong>Reduzir movimento</strong><p>Desliga animações e transições decorativas.</p></div>
              <div class="setting-control">
                <button class="switch" type="button" role="switch" aria-checked="${state.settings.reducedMotion}" data-action="toggle-reduced-motion" aria-label="Reduzir movimento"></button>
              </div>
            </div>
            <div class="setting-row">
              <div class="setting-copy"><strong>Estrutura padrão</strong><p>Quantidade de tiers em novas listas.</p></div>
              <div class="setting-control">
                <select class="select" id="settings-template" aria-label="Tiers padrão">
                  ${[3, 4, 5, 6, 7, 8, 9, 10].map((count) => `<option value="${count}" ${Number(state.settings.defaultTemplate) === count ? 'selected' : ''}>${count} tiers</option>`).join('')}
                </select>
              </div>
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <div><h2>Como seus dados vivem</h2><p>Transparência sobre a persistência local.</p></div>
            ${icon('shield', 'icon-lg')}
          </div>
          <div class="panel-body padded">
            <div class="info-list">
              <div class="info-item">
                <span class="info-icon">${icon('shield', 'icon-sm')}</span>
                <div><strong>Armazenamento local</strong><p>Guarda a estrutura das listas, rankings, notas e preferências, com até 5 MB. Os cookies são um espelho pequeno de recuperação.</p></div>
              </div>
              <div class="info-item">
                <span class="info-icon">${icon('database', 'icon-sm')}</span>
                <div><strong>IndexedDB para imagens</strong><p>Capas enviadas são otimizadas em WebP e ficam neste navegador. O estado estruturado não carrega binários.</p></div>
              </div>
              <div class="info-item">
                <span class="info-icon">${icon('download', 'icon-sm')}</span>
                <div><strong>Backup portátil</strong><p>O JSON preserva listas, tiers, ranking e notas. As imagens enviadas ficam fora do backup no MVP.</p></div>
              </div>
              <div class="info-item">
                <span class="info-icon">${icon('heart', 'icon-sm')}</span>
                <div><strong>Sem rastreadores</strong><p>Não há analytics, login ou chamadas de perfil. A experiência termina onde o navegador termina.</p></div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div class="settings-col">
        <section class="panel">
          <div class="panel-head">
            <div><h2>Armazenamento local</h2><p>Estado estruturado neste navegador, com limite de 5 MB.</p></div>
            ${icon('database', 'icon-lg')}
          </div>
          <div class="panel-body padded">
            <div class="usage-card">
              <div class="usage-top"><strong id="usage-value">0 KB</strong><span id="usage-meta">0% de 5 MB</span></div>
              <div class="usage-bar"><span id="usage-bar"></span></div>
              <div class="usage-meta"><span id="usage-lists">0 listas · 0 itens</span><span>limite de 5 MB</span></div>
            </div>
            <div class="usage-actions">
              <button class="btn btn-secondary btn-sm" type="button" data-action="export-backup">${icon('download', 'icon-sm')} Exportar backup</button>
              <button class="btn btn-secondary btn-sm" type="button" data-action="import-backup">${icon('upload', 'icon-sm')} Importar backup</button>
            </div>
            <div class="danger-zone">
              <strong>Zona de risco</strong>
              <p>Apaga todas as tier lists, preferências e imagens deste navegador. Exporte um backup antes.</p>
              <button class="btn btn-danger btn-sm" type="button" data-action="clear-data">${icon('trash', 'icon-sm')} Apagar todos os dados</button>
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <div><h2>Sobre o protótipo</h2><p>Versão em desenvolvimento.</p></div>
            ${icon('info', 'icon-lg')}
          </div>
          <div class="panel-body padded">
            <div class="info-list">
              <div class="info-item">
                <span class="info-icon">${icon('sparkles', 'icon-sm')}</span>
                <div><strong>SiterList ${APP_VERSION}</strong><p>Protótipo navegável de alta fidelidade, feito para validar fluxo, personalização e identidade visual.</p></div>
              </div>
              <div class="info-item">
                <span class="info-icon">${icon('keyboard', 'icon-sm')}</span>
                <div><strong>Atalhos</strong><p>Pressione <kbd>?</kbd> em qualquer tela para ver todos os atalhos disponíveis.</p></div>
              </div>
              <div class="info-item">
                <span class="info-icon">${icon('external', 'icon-sm')}</span>
                <div><strong>Documentação do produto</strong><p><a class="text-link" href="docs/PRD.md" target="_blank" rel="noreferrer">Abrir o PRD ${icon('external', 'icon-xs')}</a></p></div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>`;
}

/* ---------- Help ---------- */

function renderHelp() {
  return `
    <header class="page-head">
      <div>
        <span class="eyebrow">Guia rápido</span>
        <h1 class="page-title">Ajuda e atalhos</h1>
        <p class="page-sub">O básico para se mover sem tirar as mãos do teclado — e o que acontece com seus dados.</p>
      </div>
      <div class="head-actions">
        <a class="btn btn-primary" href="#/new">${icon('plus')}<span class="btn-label">Nova tier list</span></a>
      </div>
    </header>

    <div class="help-grid">
      <section class="panel">
        <div class="panel-head">
          <div><h2>Atalhos de teclado</h2><p>Funcionam quando você não está digitando em um campo.</p></div>
          ${icon('keyboard', 'icon-lg')}
        </div>
        <div class="panel-body">
          <div class="shortcut-list">
            <div class="shortcut-row"><span>Nova tier list</span><span class="shortcut-keys"><kbd>N</kbd></span></div>
            <div class="shortcut-row"><span>Ir para a biblioteca</span><span class="shortcut-keys"><kbd>B</kbd></span></div>
            <div class="shortcut-row"><span>Abrir ajuda</span><span class="shortcut-keys"><kbd>?</kbd></span></div>
            <div class="shortcut-row"><span>Buscar na biblioteca</span><span class="shortcut-keys"><kbd>/</kbd></span></div>
            <div class="shortcut-row"><span>Aparência no editor</span><span class="shortcut-keys"><kbd>A</kbd></span></div>
            <div class="shortcut-row"><span>Exportar no editor</span><span class="shortcut-keys"><kbd>E</kbd></span></div>
            <div class="shortcut-row"><span>Desfazer</span><span class="shortcut-keys"><kbd>Ctrl</kbd><kbd>Z</kbd></span></div>
            <div class="shortcut-row"><span>Refazer</span><span class="shortcut-keys"><kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>Z</kbd></span></div>
            <div class="shortcut-row"><span>Fechar painéis</span><span class="shortcut-keys"><kbd>Esc</kbd></span></div>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div><h2>Como suas listas vivem</h2><p>Modelo local-first, sem login no MVP.</p></div>
          ${icon('shield', 'icon-lg')}
        </div>
        <div class="panel-body padded">
          <div class="info-list">
            <div class="info-item">
              <span class="info-icon">${icon('database', 'icon-sm')}</span>
              <div><strong>Estado no armazenamento local</strong><p>Listas, tiers, itens, ordem e preferências ficam neste navegador, com até 5 MB. Um espelho em cookies cobre estados pequenos.</p></div>
            </div>
            <div class="info-item">
              <span class="info-icon">${icon('image', 'icon-sm')}</span>
              <div><strong>Imagens no IndexedDB</strong><p>Uploads viram WebP otimizado e são lidos sob demanda. Recarregar a página mantém tudo no lugar.</p></div>
            </div>
            <div class="info-item">
              <span class="info-icon">${icon('download', 'icon-sm')}</span>
              <div><strong>Backup manual</strong><p>Em Configurações você exporta um JSON com a estrutura completa. Imagens não entram no arquivo no MVP.</p></div>
            </div>
            <div class="info-item">
              <span class="info-icon">${icon('info', 'icon-sm')}</span>
              <div><strong>Limite de espaço</strong><p>O medidor na barra lateral acompanha o limite de 5 MB. Listas muito grandes são um convite para arquivar ou exportar.</p></div>
            </div>
          </div>
          <div class="help-callout" style="margin-top:16px">
            <strong>${icon('sparkles', 'icon-sm')} Dica de estúdio</strong>
            <p>Arraste um item pela foto para qualquer tier. Dê dois cliques no rótulo de um tier para renomear e mudar a cor.</p>
          </div>
        </div>
      </section>
    </div>

    <section class="panel" style="margin-top:18px">
      <div class="panel-head">
        <div><h2>Fluxo em três passos</h2><p>Do zero ao PNG em poucos minutos.</p></div>
        ${icon('play', 'icon-lg')}
      </div>
      <div class="panel-body padded">
        <div class="info-list">
          <div class="info-item"><span class="info-icon">01</span><div><strong>Crie e dê identidade</strong><p>Nome, descrição, capa, tema e quantidade de tiers. Tudo editável depois.</p></div></div>
          <div class="info-item"><span class="info-icon">02</span><div><strong>Adicione e ranqueie</strong><p>Envie capas, escreva notas, arraste entre tiers e organize o campo de não ranqueados.</p></div></div>
          <div class="info-item"><span class="info-icon">03</span><div><strong>Exporte e guarde</strong><p>Baixe PNG ou WebP com fundo do tema, claro ou transparente. Exporte o JSON para arquivar.</p></div></div>
        </div>
      </div>
    </section>`;
}

/* ---------- Backup, import and reset ---------- */

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function exportBackupFile() {
  const payload = {
    app: 'siterlist',
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    data: state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const stamp = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `siterlist-backup-${stamp}.json`);
  toast('Backup exportado. As imagens enviadas ficam no IndexedDB.');
}

function startImportBackup() {
  pickFile({
    accept: '.json,application/json',
    onFile: async (file) => {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const raw = parsed?.data && Array.isArray(parsed.data.lists) ? parsed.data : parsed;
        const imported = normalizeState(raw);
        if (!imported) throw new Error('Formato de backup não reconhecido.');
        if (!imported.lists.length && !Array.isArray(raw?.lists)) throw new Error('O arquivo não contém listas.');
        openImportModal(imported, file.name);
      } catch (error) {
        console.error(error);
        toast(error.message || 'Não foi possível ler esse backup.', 'error');
      }
    },
  });
}

function openImportModal(imported, fileName) {
  const albumCount = imported.lists.reduce((total, list) => total + list.items.length, 0);
  mountOverlay(`
    <div class="scrim" data-close></div>
    <div class="modal modal-sm" role="dialog" aria-modal="true" aria-labelledby="import-title">
      <div class="modal-head">
        <div><h2 id="import-title">Importar backup</h2><p>${escapeHtml(fileName || 'arquivo JSON')}</p></div>
        <button class="icon-btn modal-close" type="button" data-close aria-label="Fechar">${icon('x')}</button>
      </div>
      <div class="modal-body">
        <div class="usage-card" style="margin-bottom:14px">
          <div class="usage-top"><strong>${imported.lists.length}</strong><span>${pluralize(albumCount, 'item', 'itens')}</span></div>
          <div class="usage-meta" style="margin-top:8px"><span>${pluralize(imported.lists.length, 'tier list', 'tier lists')} encontradas</span><span>JSON local</span></div>
        </div>
        <div class="modal-note">${icon('info')} Mesclar mantém o que já existe e adiciona as listas do arquivo. Substituir apaga os dados atuais.</div>
      </div>
      <div class="modal-foot" style="flex-wrap:wrap">
        <button class="btn btn-ghost" type="button" data-close>Cancelar</button>
        <button class="btn btn-secondary" type="button" id="import-merge">Mesclar</button>
        <button class="btn btn-primary" type="button" id="import-replace">Substituir tudo</button>
      </div>
    </div>`, (root) => {
    $('#import-merge', root)?.addEventListener('click', () => {
      const now = new Date().toISOString();
      const existingTitles = new Set(state.lists.map((list) => list.title.toLowerCase()));
      const incoming = imported.lists.map((list) => {
        const copy = JSON.parse(JSON.stringify(list));
        copy.id = uid('tl');
        if (existingTitles.has(copy.title.toLowerCase())) copy.title = `${copy.title} (importada)`;
        copy.createdAt = now;
        copy.updatedAt = now;
        return copy;
      });
      state.lists = [...incoming, ...state.lists];
      saveState({ immediate: true });
      closeOverlay();
      goHomeAfterImport();
      toast(`${pluralize(incoming.length, 'tier list importada', 'tier lists importadas')}.`);
    });

    $('#import-replace', root)?.addEventListener('click', () => {
      state = imported;
      applyTheme();
      saveState({ immediate: true });
      closeOverlay();
      goHomeAfterImport();
      toast('Backup restaurado.');
    });
  });
}

function goHomeAfterImport() {
  history.replaceState(null, '', '#/');
  currentRoute = { name: 'home' };
  currentListId = null;
  ui.history = [];
  ui.redo = [];
  renderView();
}

function clearAllData() {
  openConfirm({
    title: 'Apagar todos os dados?',
    message: 'Tier lists, rankings, notas, preferências e imagens enviadas serão removidos deste navegador.',
    confirmLabel: 'Apagar tudo',
    danger: true,
    onConfirm: async () => {
      state = {
        version: 1,
        lists: [],
        settings: { themeMode: 'dark', reducedMotion: false, defaultTemplate: 5 },
      };
      ui.history = [];
      ui.redo = [];
      ui.homeSearch = '';
      ui.homeFilter = 'all';
      await clearAssets();
      applyTheme();
      saveState({ immediate: true });
      history.replaceState(null, '', '#/');
      currentRoute = { name: 'home' };
      currentListId = null;
      renderView();
      toast('Todos os dados foram apagados.');
    },
  });
}

/* ---------- Global preferences ---------- */

function setThemeMode(mode) {
  if (!['system', 'light', 'dark', 'mel'].includes(mode)) return;
  state.settings.themeMode = mode;
  applyTheme();
  saveState({ immediate: true });
  renderView();
}

function toggleThemeMode() {
  state.settings.themeMode = effectiveTheme() === 'dark' ? 'light' : 'dark';
  applyTheme();
  saveState({ immediate: true });
  if (currentRoute.name === 'settings') renderView();
}

function toggleReducedMotion() {
  state.settings.reducedMotion = !state.settings.reducedMotion;
  applyTheme();
  saveState({ immediate: true });
  renderView();
}

/* ---------- Global action handler ---------- */

function handleAction(action, element, event) {
  const list = activeList();

  switch (action) {
    case 'toggle-theme':
      toggleThemeMode();
      break;

    case 'import-backup':
      startImportBackup();
      break;

    case 'export-backup':
      exportBackupFile();
      break;

    case 'clear-data':
      clearAllData();
      break;

    case 'home-filter':
      ui.homeFilter = element.dataset.filter || 'all';
      $$('[data-action="home-filter"]').forEach((button) => {
        button.classList.toggle('is-active', button.dataset.filter === ui.homeFilter);
      });
      renderHomeResults();
      break;

    case 'clear-home-search':
      ui.homeSearch = '';
      if ($('#home-search')) {
        $('#home-search').value = '';
        $('#home-search').classList.remove('has-clear');
      }
      if ($('#home-search-clear')) $('#home-search-clear').hidden = true;
      renderHomeResults();
      break;

    case 'go-new':
      location.hash = '#/new';
      break;

    case 'list-menu':
      openListMenu(element, element.dataset.listId);
      break;

    case 'toggle-favorite':
      toggleFavorite(element.dataset.listId);
      break;

    case 'create-cover':
      if (ui.draft) {
        ui.draft.cover = { type: 'gradient', value: element.dataset.cover };
        $$('#create-cover-grid .cover-preset').forEach((button) => {
          const selected = button.dataset.cover === element.dataset.cover;
          button.classList.toggle('is-selected', selected);
          button.setAttribute('aria-pressed', String(selected));
        });
        refreshCreatePreview();
      }
      break;

    case 'create-upload-cover':
      uploadDraftCover();
      break;

    case 'create-theme':
      if (ui.draft) {
        ui.draft.theme = element.dataset.theme;
        ui.draft.accent = THEME_ACCENTS[element.dataset.theme] || ui.draft.accent;
        $$('#create-theme-grid .theme-option').forEach((button) => {
          const selected = button.dataset.theme === ui.draft.theme;
          button.classList.toggle('is-selected', selected);
          button.setAttribute('aria-pressed', String(selected));
        });
        $$('.swatch-grid .swatch').forEach((button) => {
          const selected = button.dataset.color.toLowerCase() === ui.draft.accent.toLowerCase();
          button.classList.toggle('is-selected', selected);
          button.setAttribute('aria-pressed', String(selected));
          button.innerHTML = selected ? icon('check') : '';
        });
        refreshCreatePreview();
      }
      break;

    case 'create-accent':
      if (ui.draft) {
        ui.draft.accent = element.dataset.color;
        $$('.swatch-grid .swatch').forEach((button) => {
          const selected = button.dataset.color.toLowerCase() === ui.draft.accent.toLowerCase();
          button.classList.toggle('is-selected', selected);
          button.setAttribute('aria-pressed', String(selected));
          button.innerHTML = selected ? icon('check') : '';
        });
        refreshCreatePreview();
      }
      break;

    case 'create-tier-count':
      applyDraftTierCount(Number(element.dataset.count));
      break;

    case 'create-demo':
      if (ui.draft) {
        ui.draft.demo = element.dataset.demo === '1';
        $$('[data-action="create-demo"]').forEach((button) => {
          const selected = (button.dataset.demo === '1') === ui.draft.demo;
          button.classList.toggle('is-active', selected);
          button.setAttribute('aria-pressed', String(selected));
        });
        refreshCreatePreview();
      }
      break;

    case 'create-submit':
      createListFromDraft();
      break;

    case 'undo':
      undo();
      break;

    case 'redo':
      redo();
      break;

    case 'appearance-open':
      openAppearanceDrawer();
      break;

    case 'editor-menu':
      openEditorMenu(element, element.dataset.listId);
      break;

    case 'edit-cover':
      openCoverModal();
      break;

    case 'add-tier':
      addTier();
      break;

    case 'add-album':
      openAlbumDrawer(null, element.dataset.tierId || null);
      break;

    case 'open-item':
      if (ui.dragJustEnded) break;
      openAlbumDrawer(element.dataset.itemId || null);
      break;

    case 'edit-tier':
      openTierModal(element.dataset.tierId);
      break;

    case 'appearance-theme':
      setListTheme(element.dataset.themeId);
      break;

    case 'appearance-accent':
      setListAccent(element.dataset.color);
      break;

    case 'accent-from-cover':
      setAccentFromCover();
      break;

    case 'appearance-layout':
      updateBoardSettings({ layout: element.dataset.value });
      break;

    case 'appearance-size':
      updateBoardSettings({ size: element.dataset.value });
      break;

    case 'appearance-bg':
      updateBoardSettings({ background: element.dataset.value });
      break;

    case 'appearance-toggle':
      if (list) updateBoardSettings({ [element.dataset.setting]: !list.settings[element.dataset.setting] });
      break;

    case 'appearance-tier-up':
      moveTier(element.dataset.tierId, -1);
      break;

    case 'appearance-tier-down':
      moveTier(element.dataset.tierId, 1);
      break;

    case 'appearance-tier-edit':
      openTierModal(element.dataset.tierId, { fromAppearance: true });
      break;

    case 'appearance-add-tier':
      addTier({ fromAppearance: true });
      break;

    case 'export-format':
      ui.exportOptions.format = element.dataset.value;
      refreshExportOptions();
      break;

    case 'export-scale':
      ui.exportOptions.scale = Number(element.dataset.value);
      refreshExportOptions();
      break;

    case 'export-background':
      ui.exportOptions.background = element.dataset.value;
      refreshExportOptions();
      break;

    case 'export-download':
      downloadExport();
      break;

    case 'export-copy':
      copyListAsText();
      break;

    case 'set-theme-mode':
      setThemeMode(element.dataset.mode);
      break;

    case 'toggle-reduced-motion':
      toggleReducedMotion();
      break;

    default:
      break;
  }
}

/* ---------- Event wiring ---------- */

function bindGlobalEvents() {
  document.addEventListener('click', (event) => {
    const actionElement = event.target.closest('[data-action]');
    if (actionElement) {
      if (actionElement.disabled || actionElement.getAttribute('aria-disabled') === 'true') return;
      handleAction(actionElement.dataset.action, actionElement, event);
      return;
    }

    const card = event.target.closest('[data-open-list]');
    if (card && !event.target.closest('a, button')) {
      location.hash = `#/list/${card.dataset.openList}`;
    }
  });

  document.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.id === 'home-search') {
      ui.homeSearch = target.value;
      target.classList.toggle('has-clear', Boolean(target.value));
      const clear = $('#home-search-clear');
      if (clear) clear.hidden = !target.value;
      renderHomeResults();
      return;
    }

    if (target.id === 'pool-search') {
      ui.poolSearch = target.value;
      applyPoolFilter();
      return;
    }

    if (target.id === 'create-title' && ui.draft) {
      ui.draft.title = target.value;
      const count = $('#create-title-count');
      if (count) count.textContent = `${target.value.length}/90`;
      const previewTitle = $('#create-preview-cover h3');
      if (previewTitle) previewTitle.textContent = target.value || 'Sua nova tier list';
      return;
    }

    if (target.id === 'create-desc' && ui.draft) {
      ui.draft.description = target.value;
      const previewDescription = $('#create-preview-cover p');
      if (previewDescription) previewDescription.textContent = target.value || 'Uma frase sobre esta seleção';
      return;
    }

    if (target.id === 'cover-title-input' && currentRoute.name === 'list') {
      const list = getList(currentRoute.id);
      if (!list) return;
      list.title = target.value;
      touchList(list);
      const breadcrumb = $('#breadcrumb-title');
      if (breadcrumb) breadcrumb.textContent = target.value || 'Sem título';
      document.title = `${target.value || 'Sem título'} — SiterList`;
      scheduleSave();
      return;
    }

    if (target.id === 'cover-desc-input' && currentRoute.name === 'list') {
      const list = getList(currentRoute.id);
      if (!list) return;
      list.description = target.value;
      touchList(list);
      scheduleSave();
    }
  });

  document.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.id === 'home-sort') {
      ui.homeSort = target.value;
      renderHomeResults();
      return;
    }

    if (target.id === 'create-custom-tiers' && ui.draft) {
      const value = clamp(Number(target.value) || ui.draft.tierCount, 1, MAX_TIERS);
      target.value = value > 7 ? String(value) : '';
      applyDraftTierCount(value);
      return;
    }

    if (target.id === 'settings-template') {
      state.settings.defaultTemplate = clamp(Number(target.value) || 5, 1, MAX_TIERS);
      saveState({ immediate: true });
      toast('Estrutura padrão atualizada.');
      return;
    }

    if (target.id === 'appearance-accent-custom') {
      setListAccent(target.value);
      return;
    }

    if (target.id === 'cover-title-input' && currentRoute.name === 'list') {
      const list = getList(currentRoute.id);
      if (!list) return;
      if (!target.value.trim()) {
        target.value = 'Sem título';
        list.title = 'Sem título';
        renderView();
      }
    }
  });

  document.addEventListener('keydown', (event) => {
    const overlayRoot = $('#overlay-root');
    const overlayOpen = Boolean(overlayRoot?.innerHTML.trim());

    if (event.key === 'Escape') {
      if (overlayOpen) {
        event.preventDefault();
        closeOverlay();
        return;
      }
      if (activePopover) {
        event.preventDefault();
        closePopover();
        return;
      }
    }

    if (overlayOpen) return;

    const target = event.target;
    const typing = target instanceof HTMLElement && (target.matches('input, textarea, select') || target.isContentEditable);

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      if (currentRoute.name !== 'list' || typing) return;
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
      if (currentRoute.name !== 'list' || typing) return;
      event.preventDefault();
      redo();
      return;
    }

    if (event.ctrlKey || event.metaKey || event.altKey || typing) return;

    const key = event.key.toLowerCase();

    if (key === 'n') {
      event.preventDefault();
      location.hash = '#/new';
      return;
    }
    if (key === 'b') {
      event.preventDefault();
      location.hash = '#/';
      return;
    }
    if (event.key === '?') {
      event.preventDefault();
      location.hash = '#/help';
      return;
    }
    if (key === '/') {
      event.preventDefault();
      if (currentRoute.name === 'home') $('#home-search')?.focus();
      else if (currentRoute.name === 'list') $('#pool-search')?.focus();
      return;
    }
    if (currentRoute.name === 'list' && key === 'a') {
      event.preventDefault();
      openAppearanceDrawer();
      return;
    }
    if (currentRoute.name === 'list' && key === 'e') {
      event.preventDefault();
      location.hash = `#/list/${currentRoute.id}/export`;
    }
  });

  window.addEventListener('hashchange', handleRouteChange);
  window.addEventListener('resize', debounce(() => fitTierLabels(document), 120));
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => fitTierLabels(document)).catch(() => {});
  }

  const cookieBanner = $('#cookie-banner');
  if (cookieBanner && !getCookie(NOTICE_COOKIE)) {
    cookieBanner.hidden = false;
  }
  $('#cookie-accept')?.addEventListener('click', () => {
    setCookie(NOTICE_COOKIE, '1', COOKIE_DAYS);
    if (cookieBanner) cookieBanner.hidden = true;
    toast('Preferência salva. Bom proveito.');
  });

  ['#theme-toggle', '#theme-toggle-mobile'].forEach((selector) => {
    $(selector)?.addEventListener('click', () => toggleThemeMode());
  });
}

/* ---------- Boot ---------- */

function init() {
  try {
    const metaRaw = getCookie(`${COOKIE_PREFIX}meta`);
    if (metaRaw) {
      const meta = JSON.parse(metaRaw);
      if (meta?.savedAt) lastSaveAt = new Date(meta.savedAt);
    }
  } catch {
    // metadados antigos ou inválidos não impedem o boot
  }

  applyTheme();
  bindGlobalEvents();
  handleRouteChange();

  if (seededState) {
    saveState({ immediate: true });
  } else {
    updateStorageUI();
  }
}

init();

