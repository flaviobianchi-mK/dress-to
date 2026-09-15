/**
 * Clipboard helpers — imagem e texto via Clipboard API.
 * Sem integração Omnichat: Natalia cola manualmente.
 */

export async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  const el = document.createElement('textarea');
  el.value = text;
  el.setAttribute('readonly', '');
  el.style.position = 'fixed';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  el.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(el);
  if (!ok) throw new Error('Falha ao copiar texto');
  return true;
}

export async function copyImageFromUrl(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return copyImageBlob(blob);
}

export async function copyImageBlob(blob) {
  const pngBlob = blob.type === 'image/png'
    ? blob
    : await convertToPng(blob);

  if (navigator.clipboard?.write && window.ClipboardItem) {
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': pngBlob }),
    ]);
    return true;
  }
  throw new Error('Clipboard de imagem não suportado neste navegador');
}

async function convertToPng(blob) {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Falha ao converter PNG'))), 'image/png');
  });
}

/**
 * Composição mock do provador virtual (sem API externa).
 * Usa só a foto da cliente no canvas — peças ficam no painel lateral.
 * Saída fixa Full HD 9:16 (1080×1920).
 */
export async function composeTryOn(photoUrl, pieces) {
  const photo = await loadImage(photoUrl);
  const canvas = document.createElement('canvas');
  const outW = 1080;
  const outH = 1920;
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#F3F4F6';
  ctx.fillRect(0, 0, outW, outH);

  // cover 9:16 no canvas de saída
  const targetAspect = outW / outH;
  const srcAspect = photo.width / photo.height;
  let sx = 0;
  let sy = 0;
  let sw = photo.width;
  let sh = photo.height;
  if (srcAspect > targetAspect) {
    sw = photo.height * targetAspect;
    sx = (photo.width - sw) / 2;
  } else {
    sh = photo.width / targetAspect;
    sy = (photo.height - sh) / 2;
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(photo, sx, sy, sw, sh, 0, 0, outW, outH);

  // Faixa inferior só com branding — sem thumbs de produto
  const barH = Math.max(44, Math.round(outH * 0.08));
  const grad = ctx.createLinearGradient(0, outH - barH * 1.6, 0, outH);
  grad.addColorStop(0, 'rgba(26, 28, 28, 0)');
  grad.addColorStop(1, 'rgba(26, 28, 28, 0.72)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, outH - barH * 1.6, outW, barH * 1.6);

  const gap = 24;
  ctx.fillStyle = '#DC0B9F';
  ctx.font = '800 28px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('mKFashion+', gap, outH - 28);

  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
  const pieceCount = Array.isArray(pieces) ? pieces.length : 0;
  const label = pieceCount
    ? `Provador virtual · Dress To · ${pieceCount} peça${pieceCount > 1 ? 's' : ''}`
    : 'Provador virtual · Dress To';
  ctx.fillText(label, gap + 220, outH - 30);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
  return { dataUrl, blob, canvas };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (/^https?:/i.test(src)) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Falha ao carregar imagem'));
    img.src = src;
  });
}
