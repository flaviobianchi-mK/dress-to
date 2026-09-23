import {
  categoryLabel,
  formatPrice,
} from '../js/catalog-data.js';

const { ref, reactive, computed } = Vue;

export default {
  name: 'LookFloatingBar',
  props: {
    pieces: { type: Array, default: () => [] },
    copiedRefId: { type: String, default: null },
  },
  emits: ['copy-ref'],
  setup(props) {
    const minimized = ref(false);
    const loadedImages = reactive({});

    const lookTotal = computed(() =>
      props.pieces.reduce((sum, p) => sum + (p.price || 0), 0),
    );

    const gridStyle = computed(() => {
      const cols = Math.min(Math.max(props.pieces.length, 1), 3);
      return { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` };
    });

    function toggleMinimized() {
      minimized.value = !minimized.value;
    }

    function markImageLoaded(src) {
      if (src) loadedImages[src] = true;
    }

    function isImageLoaded(src) {
      return Boolean(src && loadedImages[src]);
    }

    return {
      minimized,
      lookTotal,
      gridStyle,
      categoryLabel,
      formatPrice,
      toggleMinimized,
      isImageLoaded,
      markImageLoaded,
    };
  },
  template: `
    <aside
      class="dt-look-float"
      :class="{ 'is-minimized': minimized }"
      aria-label="Look selecionado"
    >
      <div class="dt-look-float-head">
        <div class="dt-look-float-title">
          <strong>Look</strong>
          <span v-if="pieces.length" class="dt-look-float-count">
            {{ pieces.length }} peça{{ pieces.length > 1 ? 's' : '' }}
          </span>
          <span v-if="pieces.length" class="dt-look-float-total">{{ formatPrice(lookTotal) }}</span>
        </div>
        <button
          type="button"
          class="dt-btn dt-btn--ghost dt-btn--sm dt-look-float-toggle"
          :aria-expanded="!minimized"
          :title="minimized ? 'Expandir look' : 'Minimizar look'"
          @click="toggleMinimized"
        >
          <span class="material-symbols-outlined dt-icon dt-icon--sm" aria-hidden="true">
            {{ minimized ? 'unfold_more' : 'unfold_less' }}
          </span>
          {{ minimized ? 'Expandir' : 'Minimizar' }}
        </button>
      </div>

      <p v-if="!pieces.length" class="dt-look-float-empty">
        Nenhuma peça selecionada — edite o look para continuar.
      </p>

      <ul v-else-if="minimized" class="dt-look-float-simple">
        <li v-for="piece in pieces" :key="piece.id">
          <button
            type="button"
            class="dt-look-float-simple-btn"
            :class="{ 'is-copied': copiedRefId === piece.id }"
            :aria-label="'Copiar referência ' + piece.ref"
            :title="'Copiar ' + piece.ref"
            @click="$emit('copy-ref', piece)"
          >
            <span class="dt-look-float-simple-name">{{ piece.name }}</span>
            <span
              class="material-symbols-outlined dt-icon dt-icon--sm dt-look-float-simple-copy"
              aria-hidden="true"
            >{{ copiedRefId === piece.id ? 'check' : 'content_copy' }}</span>
          </button>
        </li>
      </ul>

      <ul v-else class="dt-look-float-grid" :style="gridStyle">
        <li
          v-for="piece in pieces"
          :key="piece.id"
          class="dt-look-float-card"
        >
          <div
            class="dt-media-skel dt-look-float-thumb"
            :class="{ 'is-loaded': isImageLoaded(piece.image) }"
          >
            <img
              :src="piece.image"
              :alt="piece.name"
              @load="markImageLoaded(piece.image)"
              @error="markImageLoaded(piece.image)"
            />
          </div>
          <div class="dt-look-float-body">
            <span class="dt-look-float-cat">{{ categoryLabel(piece.category) }}</span>
            <div class="dt-ref-row-ref">{{ piece.ref }}</div>
            <div class="dt-look-float-name">{{ piece.name }}</div>
          </div>
          <button
            type="button"
            class="dt-btn dt-btn--sm"
            :class="copiedRefId === piece.id ? 'dt-btn--primary is-success' : 'dt-btn--outline'"
            :aria-label="'Copiar referência ' + piece.ref"
            @click="$emit('copy-ref', piece)"
          >
            {{ copiedRefId === piece.id ? 'OK' : 'Copiar' }}
          </button>
        </li>
      </ul>
    </aside>
  `,
};
