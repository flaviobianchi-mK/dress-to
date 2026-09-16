const HISTORY_KEY = 'dt-looks-history';
const FAVORITES_KEY = 'dt-looks-favorites';
const MAX_HISTORY = 24;
const MAX_FAVORITES = 24;

function readList(key) {
  try {
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeList(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch (err) {
    console.warn('[looks-store] falha ao salvar', key, err);
  }
}

function snapshotPieces(pieces) {
  return (pieces || []).map((p) => ({
    id: p.id,
    ref: p.ref,
    name: p.name,
    category: p.category,
    color: p.color,
    price: p.price,
    image: p.image,
  }));
}

export function createLookRecord({ resultUrl, pieces }) {
  return {
    id: `look-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    resultUrl,
    pieces: snapshotPieces(pieces),
  };
}

export function loadHistory() {
  return readList(HISTORY_KEY);
}

export function loadFavorites() {
  return readList(FAVORITES_KEY);
}

export function addToHistory(look) {
  const next = [look, ...readList(HISTORY_KEY).filter((item) => item.id !== look.id)]
    .slice(0, MAX_HISTORY);
  writeList(HISTORY_KEY, next);
  return next;
}

export function removeFromHistory(lookId) {
  const next = readList(HISTORY_KEY).filter((item) => item.id !== lookId);
  writeList(HISTORY_KEY, next);
  return next;
}

export function clearHistory() {
  writeList(HISTORY_KEY, []);
  return [];
}

export function isFavorite(lookId) {
  return readList(FAVORITES_KEY).some((item) => item.id === lookId);
}

export function addFavorite(look) {
  const next = [look, ...readList(FAVORITES_KEY).filter((item) => item.id !== look.id)]
    .slice(0, MAX_FAVORITES);
  writeList(FAVORITES_KEY, next);
  return next;
}

export function removeFavorite(lookId) {
  const next = readList(FAVORITES_KEY).filter((item) => item.id !== lookId);
  writeList(FAVORITES_KEY, next);
  return next;
}

export function formatLookDate(ts) {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ts));
  } catch {
    return '';
  }
}

export function lookTotal(pieces) {
  return (pieces || []).reduce((sum, p) => sum + (p.price || 0), 0);
}
