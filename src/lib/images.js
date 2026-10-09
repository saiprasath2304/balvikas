// Image resolution order for a scene:
// 1. Picture uploaded in Admin (kept in this browser's IndexedDB)
// 2. File in /public/images (scene.image)
// 3. Generated emoji placeholder

const DB_NAME = 'ramayana-utsav-images';
const STORE = 'images';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(req?.result);
    t.onerror = () => reject(t.error);
  });
}

export const saveUpload = (id, blob) => tx('readwrite', (s) => s.put(blob, id));
export const deleteUpload = (id) => tx('readwrite', (s) => s.delete(id));
export const getUpload = (id) => tx('readonly', (s) => s.get(id)).catch(() => null);

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function placeholder(scene) {
  const W = 1200, H = 900;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const [sky = '#fde68a', ground = '#16a34a', ...emojis] = scene.art ?? [];

  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, sky);
  bg.addColorStop(0.62, '#ffffff');
  bg.addColorStop(0.63, ground);
  bg.addColorStop(1, shade(ground, -40));
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);

  // sun / halo
  g.fillStyle = 'rgba(255,255,255,0.55)';
  g.beginPath(); g.arc(W * 0.82, H * 0.18, 90, 0, Math.PI * 2); g.fill();
  // rolling hills
  g.fillStyle = shade(ground, 25);
  g.beginPath(); g.moveTo(0, H * 0.66);
  for (let x = 0; x <= W; x += 20) g.lineTo(x, H * 0.64 + Math.sin(x / 120) * 22);
  g.lineTo(W, H); g.lineTo(0, H); g.fill();

  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const spots = [
    [0.5, 0.48, 330], [0.18, 0.72, 190], [0.82, 0.70, 190], [0.2, 0.24, 150], [0.62, 0.22, 120],
  ];
  emojis.forEach((e, i) => {
    const [x, y, s] = spots[i % spots.length];
    g.font = `${s}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    g.fillText(e, W * x, H * y);
  });

  return c.toDataURL('image/png');
}


function shade(hex, amt) {
  const n = parseInt(hex.replace('#', ''), 16);
  const clamp = (v) => Math.max(0, Math.min(255, v));
  const r = clamp((n >> 16) + amt), gg = clamp(((n >> 8) & 255) + amt), b = clamp((n & 255) + amt);
  return `#${((r << 16) | (gg << 8) | b).toString(16).padStart(6, '0')}`;
}

/** Returns { src, width, height, source: 'upload' | 'file' | 'placeholder' } */
export async function resolveSceneImage(scene) {
  const blob = await getUpload(scene.id);
  if (blob) {
    const src = URL.createObjectURL(blob);
    try {
      const img = await loadImage(src);
      return { src, width: img.naturalWidth, height: img.naturalHeight, source: 'upload' };
    } catch {}
  }
  if (scene.image) {
    try {
      const img = await loadImage(scene.image);
      return { src: scene.image, width: img.naturalWidth, height: img.naturalHeight, source: 'file' };
    } catch {}
  }
  await document.fonts?.ready;
  return { src: placeholder(scene), width: 1200, height: 900, source: 'placeholder' };
}
