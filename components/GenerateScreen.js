import {
  CATEGORIES,
  SIZE_FILTERS,
  categoryLabel,
  formatPrice,
  pieceNeedsSize,
  pieceIsSized,
} from '../js/catalog-data.js';

const { reactive, computed } = Vue;

export default {
  name: 'GenerateScreen',
  props: {
    photo: { type: Object, required: true },
    selected: { type: Object, required: true },
    generating: { type: Boolean, default: false },
  },
  emits: ['back', 'generate', 'set-size', 'remove', 'edit-catalog'],
  setup(props) {
    const loadedImages = reactive({});

    const pieces = computed(() =>
      CATEGORIES.map((c) => props.selected[c.id]).filter(Boolean),
    );

    const lookTotal = computed(() =>
      pieces.value.reduce((sum, p) => sum + (p.price || 0), 0),
    );

    const canGenerate = computed(
      () => pieces.value.length > 0 && pieces.value.every((p) => pieceIsSized(p)),
    );

    function markImageLoaded(src) {
      if (src) loadedImages[src] = true;
    }

    function isImageLoaded(src) {
      return Boolean(src && loadedImages[src]);
    }

    return {
      SIZE_FILTERS,
      pieces,
      lookTotal,
      canGenerate,
      categoryLabel,
      formatPrice,
      pieceNeedsSize,
      isImageLoaded,
      markImageLoaded,
    };
  },
  template: `
    <section class="dt-screen dt-screen--generate" aria-labelledby="generate-title">
      <header class="dt-generate-intro">
        <h1 class="dt-screen__title" id="generate-title">Gerar provador</h1>
        <p class="dt-screen__lead">
          Confira o look, ajuste peças e tamanhos se precisar, e gere a imagem
          do provador virtual para enviar no Omnichat.
        </p>
      </header>

      <div class="dt-generate">
        <div class="dt-summary dt-glass-2">
          <div
            class="dt-summary__photo dt-media-skel"
            :class="{ 'is-loaded': isImageLoaded(photo.url) }"
          >
            <img
              :src="photo.url"
              alt="Foto da cliente"
              @load="markImageLoaded(photo.url)"
              @error="markImageLoaded(photo.url)"
            />
          </div>

          <div class="dt-summary__head">
            <h2 class="dt-summary__title">Peças do look</h2>
            <button
              type="button"
              class="dt-btn dt-btn--ghost dt-btn--sm"
              :disabled="generating"
              @click="$emit('edit-catalog')"
            >
              Editar no catálogo
            </button>
          </div>

          <ul v-if="pieces.length" class="dt-summary__pieces">
            <li
              v-for="piece in pieces"
              :key="piece.id"
              class="dt-look-item dt-look-item--editable"
              :class="{ 'needs-size': pieceNeedsSize(piece) && !piece.size }"
            >
              <div class="dt-look-item__main">
                <div
                  class="dt-media-skel dt-look-item__thumb"
                  :class="{ 'is-loaded': isImageLoaded(piece.image) }"
                >
                  <img
                    :src="piece.image"
                    :alt="piece.name"
                    @load="markImageLoaded(piece.image)"
                    @error="markImageLoaded(piece.image)"
                  />
                </div>
                <div class="dt-look-item__body">
                  <span class="dt-look-item__cat">{{ categoryLabel(piece.category) }}</span>
                  <div class="dt-look-item__name">{{ piece.name }}</div>
                  <div class="dt-card__ref">{{ piece.ref }}</div>
                  <div class="dt-card__price">{{ formatPrice(piece.price) }}</div>
                </div>
                <button
                  type="button"
                  class="dt-look-item__remove"
                  :aria-label="'Remover ' + piece.name"
                  :disabled="generating"
                  @click="$emit('remove', piece.category)"
                >
                  <span class="material-symbols-outlined dt-icon" aria-hidden="true">close</span>
                </button>
              </div>

              <div
                v-if="pieceNeedsSize(piece)"
                class="dt-look-item__sizes"
                role="group"
                :aria-label="'Tamanho de ' + piece.name"
              >
                <span class="dt-look-item__sizes-label">Tamanho</span>
                <div class="dt-look-item__size-row">
                  <button
                    v-for="size in SIZE_FILTERS"
                    :key="size"
                    type="button"
                    class="dt-filter-size"
                    :class="{ 'is-active': piece.size === size }"
                    :aria-pressed="piece.size === size"
                    :disabled="generating"
                    @click="$emit('set-size', { category: piece.category, size })"
                  >{{ size }}</button>
                </div>
              </div>
            </li>
          </ul>

          <div v-else class="dt-summary__empty">
            <p>Nenhuma peça no look.</p>
            <button
              type="button"
              class="dt-btn dt-btn--primary dt-btn--sm"
              :disabled="generating"
              @click="$emit('edit-catalog')"
            >
              Escolher peças
            </button>
          </div>

          <div v-if="pieces.length" class="dt-lookbar__total">
            Total · {{ formatPrice(lookTotal) }}
          </div>

          <p v-if="pieces.length && !canGenerate" class="dt-lookbar__hint">
            Defina o tamanho das peças que ainda estão pendentes.
          </p>
        </div>

        <div class="dt-generate__panel dt-glass-2">
          <h3>Pronto para gerar</h3>
          <p>
            A geração pode levar alguns segundos. Durante o processamento,
            a tela fica bloqueada para evitar cliques repetidos.
          </p>
          <div class="dt-actions" style="margin-top:8px">
            <button
              type="button"
              class="dt-btn dt-btn--ghost"
              :disabled="generating"
              @click="$emit('back')"
            >Voltar</button>
            <button
              type="button"
              class="dt-btn dt-btn--primary"
              :disabled="generating || !canGenerate"
              @click="$emit('generate')"
            >
              Gerar provador virtual
            </button>
          </div>
        </div>
      </div>
    </section>
  `,
};
