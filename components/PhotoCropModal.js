import {
  cropToFhd916,
  loadImageFromBlob,
  PHOTO_WIDTH,
  PHOTO_HEIGHT,
} from '../js/image.js';

const { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } = Vue;

export default {
  name: 'PhotoCropModal',
  props: {
    sourceBlob: { type: [Blob, File], required: true },
    sourceName: { type: String, default: 'foto.jpg' },
  },
  emits: ['cancel', 'apply', 'apply-and-generate'],
  setup(props, { emit }) {
    const stageRef = ref(null);
    const sourceUrl = ref('');
    const natural = ref({ w: 0, h: 0 });
    const stageSize = ref({ w: 0, h: 0 });
    const zoom = ref(1);
    const offset = ref({ x: 0, y: 0 });
    const dragging = ref(false);
    const applying = ref(false);
    const error = ref('');

    let dragOrigin = null;
    let resizeObserver = null;

    const fit = computed(() => {
      const { w: vw, h: vh } = stageSize.value;
      const { w: iw, h: ih } = natural.value;
      if (!vw || !vh || !iw || !ih) return { scale: 1, drawW: 0, drawH: 0 };
      const base = Math.max(vw / iw, vh / ih);
      const scale = base * zoom.value;
      return { scale, drawW: iw * scale, drawH: ih * scale };
    });

    const imgStyle = computed(() => ({
      width: `${fit.value.drawW}px`,
      height: `${fit.value.drawH}px`,
      transform: `translate(${offset.value.x}px, ${offset.value.y}px)`,
    }));

    function clampOffset(next = offset.value) {
      const { drawW, drawH } = fit.value;
      const { w: vw, h: vh } = stageSize.value;
      if (!drawW || !drawH || !vw || !vh) return next;
      return {
        x: Math.min(0, Math.max(vw - drawW, next.x)),
        y: Math.min(0, Math.max(vh - drawH, next.y)),
      };
    }

    function centerImage() {
      const { drawW, drawH } = fit.value;
      const { w: vw, h: vh } = stageSize.value;
      offset.value = clampOffset({
        x: (vw - drawW) / 2,
        y: (vh - drawH) / 2,
      });
    }

    function measureStage() {
      const el = stageRef.value;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      stageSize.value = { w: rect.width, h: rect.height };
      offset.value = clampOffset(offset.value);
    }

    async function loadSource() {
      error.value = '';
      if (sourceUrl.value) URL.revokeObjectURL(sourceUrl.value);
      sourceUrl.value = URL.createObjectURL(props.sourceBlob);
      try {
        const img = await loadImageFromBlob(props.sourceBlob);
        natural.value = { w: img.width, h: img.height };
        await nextTick();
        measureStage();
        centerImage();
      } catch {
        error.value = 'Não foi possível carregar a imagem para recorte.';
      }
    }

    function onPointerDown(e) {
      if (applying.value || e.button !== 0) return;
      dragging.value = true;
      dragOrigin = {
        x: e.clientX,
        y: e.clientY,
        ox: offset.value.x,
        oy: offset.value.y,
      };
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }

    function onPointerMove(e) {
      if (!dragging.value || !dragOrigin) return;
      offset.value = clampOffset({
        x: dragOrigin.ox + (e.clientX - dragOrigin.x),
        y: dragOrigin.oy + (e.clientY - dragOrigin.y),
      });
    }

    function onPointerUp(e) {
      dragging.value = false;
      dragOrigin = null;
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    }

    async function applyCrop(generateAfter = false) {
      if (applying.value) return;
      applying.value = true;
      error.value = '';
      try {
        const { scale } = fit.value;
        const { w: vw, h: vh } = stageSize.value;
        if (!scale || !vw || !vh) throw new Error('Stage inválido');

        const rect = {
          sx: -offset.value.x / scale,
          sy: -offset.value.y / scale,
          sw: vw / scale,
          sh: vh / scale,
        };

        const cropped = await cropToFhd916(props.sourceBlob, rect, props.sourceName);
        const payload = {
          ...cropped,
          sourceBlob: props.sourceBlob,
          sourceName: props.sourceName,
        };
        emit(generateAfter ? 'apply-and-generate' : 'apply', payload);
      } catch {
        error.value = 'Não foi possível aplicar o recorte.';
        applying.value = false;
      }
    }

    function applyCropOnly() {
      return applyCrop(false);
    }

    function applyCropAndGenerate() {
      return applyCrop(true);
    }

    function onKeydown(e) {
      if (e.key === 'Escape') emit('cancel');
    }

  watch(zoom, (nextZoom, prevZoom) => {
      const { w: vw, h: vh } = stageSize.value;
      const { w: iw, h: ih } = natural.value;
      if (!vw || !iw || !prevZoom) return;
      const base = Math.max(vw / iw, vh / ih);
      const prevDrawW = iw * base * prevZoom;
      const prevDrawH = ih * base * prevZoom;
      const cx = (vw / 2 - offset.value.x) / (prevDrawW || 1);
      const cy = (vh / 2 - offset.value.y) / (prevDrawH || 1);
      const nextDrawW = iw * base * nextZoom;
      const nextDrawH = ih * base * nextZoom;
      offset.value = clampOffset({
        x: vw / 2 - cx * nextDrawW,
        y: vh / 2 - cy * nextDrawH,
      });
    });

    onMounted(async () => {
      document.addEventListener('keydown', onKeydown);
      await loadSource();
      resizeObserver = new ResizeObserver(() => {
        measureStage();
      });
      if (stageRef.value) resizeObserver.observe(stageRef.value);
    });

    onBeforeUnmount(() => {
      document.removeEventListener('keydown', onKeydown);
      resizeObserver?.disconnect();
      if (sourceUrl.value) URL.revokeObjectURL(sourceUrl.value);
    });

    return {
      stageRef,
      sourceUrl,
      zoom,
      imgStyle,
      dragging,
      applying,
      error,
      PHOTO_WIDTH,
      PHOTO_HEIGHT,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      applyCropOnly,
      applyCropAndGenerate,
    };
  },
  template: `
    <div class="dt-crop" role="dialog" aria-modal="true" aria-labelledby="dt-crop-title">
      <div class="dt-crop__panel">
        <header class="dt-crop__head">
          <div>
            <h2 id="dt-crop-title">Recortar foto</h2>
            <p>Arraste para enquadrar · zoom para aproximar · saída {{ PHOTO_WIDTH }}×{{ PHOTO_HEIGHT }} (9:16)</p>
          </div>
          <button type="button" class="dt-btn dt-btn--ghost dt-btn--sm" :disabled="applying" @click="$emit('cancel')">
            <span class="material-symbols-outlined dt-icon dt-icon--sm" aria-hidden="true">close</span>
            Cancelar
          </button>
        </header>

        <div
          ref="stageRef"
          class="dt-crop__stage"
          :class="{ 'is-dragging': dragging }"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
        >
          <img
            v-if="sourceUrl"
            class="dt-crop__img"
            :src="sourceUrl"
            :style="imgStyle"
            alt="Foto para recorte"
            draggable="false"
          />
          <div class="dt-crop__frame" aria-hidden="true"></div>
        </div>

        <div class="dt-crop__controls">
          <label class="dt-crop__zoom">
            <span>Zoom</span>
            <input
              v-model.number="zoom"
              type="range"
              min="1"
              max="3"
              step="0.01"
              :disabled="applying"
            />
          </label>
          <p v-if="error" class="dt-upload__error" role="alert">{{ error }}</p>
          <div class="dt-crop__actions">
            <button
              type="button"
              class="dt-btn dt-btn--outline"
              :disabled="applying"
              @click="applyCropOnly"
            >
              <span class="material-symbols-outlined dt-icon dt-icon--sm" aria-hidden="true">crop</span>
              {{ applying ? 'Aplicando…' : 'Aplicar recorte' }}
            </button>
            <button
              type="button"
              class="dt-btn dt-btn--primary"
              :disabled="applying"
              @click="applyCropAndGenerate"
            >
              <span class="material-symbols-outlined dt-icon dt-icon--sm" aria-hidden="true">auto_awesome</span>
              {{ applying ? 'Aplicando…' : 'Recortar e gerar look' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
};
