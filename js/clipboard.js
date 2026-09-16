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

/** Resultado fixo do protótipo — sempre esta foto, independente da cliente/peças. */
export const FIXED_TRY_ON_RESULT_URL = './assets/results/try-on-result.png';

/**
 * Provador virtual mock: devolve sempre a foto fixa de resultado.
 * Mantém o contrato dataUrl/blob para copiar, salvar e histórico.
 */
export async function composeTryOn(_photoUrl, _pieces) {
  const res = await fetch(FIXED_TRY_ON_RESULT_URL);
  if (!res.ok) throw new Error('Falha ao carregar resultado fixo do provador');
  const blob = await res.blob();
  const dataUrl = await blobToDataUrl(blob);
  return { dataUrl, blob };
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Falha ao ler imagem de resultado'));
    reader.readAsDataURL(blob);
  });
}
