import { categoryLabel, formatPrice } from '../js/catalog-data.js';

const { reactive, computed } = Vue;

export default {
  name: 'ResultScreen',
  props: {
    resultUrl: { type: String, required: true },
    pieces: { type: Array, required: true },
    copiedImage: { type: Boolean, default: false },
    copiedRefId: { type: String, default: null },
  },
  emits: ['copy-image', 'copy-ref', 'regenerate', 'restart', 'back'],
  setup(props) {
    const loadedImages = reactive({});

    const lookTotal = computed(() =>
      props.pieces.reduce((sum, p) => sum + (p.price || 0), 0),
    );

    function markImageLoaded(src) {
      if (src) loadedImages[src] = true;
    }

    function isImageLoaded(src) {
      return Boolean(src && loadedImages[src]);
    }

    return {
      categoryLabel,
      formatPrice,
      lookTotal,
      isImageLoaded,
      markImageLoaded,
    };
  },
  template: `
    <section class="dt-screen" aria-labelledby="result-title">
      <h1 class="dt-screen-title" id="result-title">Resultado</h1>
      <p class="dt-screen-lead">
        Copie a imagem e as referências das peças para colar no Omnichat.
      </p>

      <div class="dt-result">
        <div class="dt-result-side">
          <div class="dt-result-panel dt-glass-2">
            <div class="dt-result-panel-head">
              <h3>Peças do look</h3>
            </div>

            <ul class="dt-ref-list">
              <li v-for="piece in pieces" :key="piece.id" class="dt-ref-row">
                <div
                  class="dt-media-skel dt-ref-row-thumb"
                  :class="{ 'is-loaded': isImageLoaded(piece.image) }"
                >
                  <img
                    :src="piece.image"
                    :alt="piece.name"
                    @load="markImageLoaded(piece.image)"
                    @error="markImageLoaded(piece.image)"
                  />
                </div>
                <div>
                  <div class="dt-ref-row-ref">{{ piece.ref }}</div>
                  <div class="dt-ref-row-name">{{ piece.name }}</div>
                  <span class="dt-look-item-cat">{{ categoryLabel(piece.category) }}</span>
                  <div class="dt-card-price">{{ formatPrice(piece.price) }}</div>
                </div>
                <button
                  type="button"
                  class="dt-btn dt-btn--sm"
                  :class="copiedRefId === piece.id ? 'dt-btn--primary is-success' : 'dt-btn--outline'"
                  @click="$emit('copy-ref', piece)"
                >
                  {{ copiedRefId === piece.id ? 'Copiado' : 'Copiar referência' }}
                </button>
              </li>
            </ul>

            <div v-if="pieces.length" class="dt-lookbar-total" style="margin-top:16px">
              Total · {{ formatPrice(lookTotal) }}
            </div>
          </div>

          <div class="dt-actions" style="margin-top:0">
            <button type="button" class="dt-btn dt-btn--ghost" @click="$emit('back')">
              Voltar
            </button>
            <button type="button" class="dt-btn dt-btn--ghost" @click="$emit('regenerate')">
              Gerar novamente
            </button>
            <button type="button" class="dt-btn dt-btn--secondary" @click="$emit('restart')">
              Novo atendimento
            </button>
          </div>
        </div>

        <div class="dt-result-media">
          <div
            class="dt-result-hero dt-glass-2 dt-media-skel"
            :class="{ 'is-loaded': isImageLoaded(resultUrl) }"
          >
            <img
              :src="resultUrl"
              alt="Imagem gerada do provador virtual"
              @load="markImageLoaded(resultUrl)"
              @error="markImageLoaded(resultUrl)"
            />
          </div>
          <button
            type="button"
            class="dt-btn dt-result-copy"
            :class="copiedImage ? 'dt-btn--primary is-success' : 'dt-btn--primary'"
            @click="$emit('copy-image')"
          >
            <template v-if="copiedImage">
              <span class="material-symbols-outlined dt-icon" aria-hidden="true">check</span>
              Imagem copiada
            </template>
            <template v-else>
              <span class="material-symbols-outlined dt-icon" aria-hidden="true">content_copy</span>
              Copiar imagem
            </template>
          </button>
        </div>
      </div>
    </section>
  `,
};

