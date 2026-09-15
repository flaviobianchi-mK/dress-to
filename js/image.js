/** Foto do provador: Full HD vertical 9:16 */
export const PHOTO_WIDTH = 1080;
export const PHOTO_HEIGHT = 1920;
export const PHOTO_ASPECT = PHOTO_WIDTH / PHOTO_HEIGHT; // 9/16
export const PHOTO_MAX_BYTES = 12 * 1024 * 1024;

/**
 * Recorta no centro para 9:16 e redimensiona para Full HD (1080×1920).
 * @param {File|Blob} file
 * @param {string} [originalName]
 * @returns {Promise<{ file: File, blob: Blob, url: string, width: number, height: number, name: string }>}
 */
export async function normalizeToFhd916(file, originalName = 'foto.jpg') {
  const img = await loadImageFromBlob(file);
  const rect = coverCropRect(img.width, img.height, PHOTO_ASPECT);
  return cropToFhd916(file, rect, originalName);
}

/**
 * Recorta a região informada (coords da imagem fonte) para Full HD 9:16.
 * @param {File|Blob} file
 * @param {{ sx: number, sy: number, sw: number, sh: number }} rect
 * @param {string} [originalName]
 */
export async function cropToFhd916(file, rect, originalName = 'foto.jpg') {
  const img = await loadImageFromBlob(file);
  const sx = clamp(rect.sx, 0, Math.max(0, img.width - 1));
  const sy = clamp(rect.sy, 0, Math.max(0, img.height - 1));
  const sw = clamp(rect.sw, 1, img.width - sx);
  const sh = clamp(rect.sh, 1, img.height - sy);

  const canvas = document.createElement('canvas');
  canvas.width = PHOTO_WIDTH;
  canvas.height = PHOTO_HEIGHT;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#F3F4F6';
  ctx.fillRect(0, 0, PHOTO_WIDTH, PHOTO_HEIGHT);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, PHOTO_WIDTH, PHOTO_HEIGHT);

  const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
  const base = String(originalName).replace(/\.[^.]+$/, '') || 'foto';
  const name = `${base}-1080x1920.jpg`;
  const outFile = new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() });
  const url = URL.createObjectURL(blob);

  return {
    file: outFile,
    blob,
    url,
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
    name,
  };
}

export function coverCropRect(srcW, srcH, targetAspect = PHOTO_ASPECT) {
  const srcAspect = srcW / srcH;
  if (srcAspect > targetAspect) {
    const sw = srcH * targetAspect;
    return { sx: (srcW - sw) / 2, sy: 0, sw, sh: srcH };
  }
  const sh = srcW / targetAspect;
  return { sx: 0, sy: (srcH - sh) / 2, sw: srcW, sh };
}

export function loadImageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Falha ao ler a imagem'));
    };
    img.src = url;
  });
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Falha ao exportar a imagem'))),
      type,
      quality,
    );
  });
}
