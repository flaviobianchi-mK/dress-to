import { CATEGORIES } from '../js/catalog-data.js';
import {
  loadImageFromBlob,
  PHOTO_MAX_BYTES,
} from '../js/image.js';
import { buildSizeRecommendations } from '../js/size-recommend.js';
import PhotoCropModal from './PhotoCropModal.js';

const { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } = Vue;

export default {
  name: 'WorkspaceScreen',
  components: { PhotoCropModal },
  props: {
    photo: { type: Object, default: null },
    selected: { type: Object, required: true },
    measures: { type: Object, required: true },
    resultUrl: { type: String, default: null },
    generating: { type: Boolean, default: false },
    savedImage: { type: Boolean, default: false },
    lookFavorited: { type: Boolean, default: false },
    copiedImage: { type: Boolean, default: false },
    copiedRefId: { type: String, default: null },
  },
  emits: [
    'update:photo',
    'update:measures',
    'generate',
    'edit-catalog',
    'save-image',
    'copy-image',
    'copy-ref',
    'toggle-favorite',
    'restart',
  ],
  setup(props, { emit }) {
    const dragging = ref(false);
    const inputRef = ref(null);
    const dockStackRef = ref(null);
    const error = ref('');
    const processing = ref(false);
    const cropSource = ref(null);
    const loadedImages = reactive({});
    let dockObserver = null;

    const hasPhoto = computed(() => Boolean(props.photo?.url));
    const hasResult = computed(() => Boolean(props.resultUrl));
    const measuresLocked = computed(() => hasResult.value || props.generating);
    const cropping = computed(() => Boolean(cropSource.value));

    function markImageLoaded(src) {
      if (src) loadedImages[src] = true;
    }

    function isImageLoaded(src) {
      return Boolean(src && loadedImages[src]);
    }

    function bindImageEl(el, src) {
      if (!el || !src) return;
      if (el.complete && el.naturalWidth > 0) markImageLoaded(src);
    }

    const pieces = computed(() =>
      CATEGORIES.map((c) => props.selected[c.id]).filter(Boolean),
    );

    const canGenerate = computed(
      () => hasPhoto.value && pieces.value.length > 0,
    );

    const generateLabel = computed(() =>
      hasResult.value ? 'Gerar novamente' : 'Gerar look',
    );

    /** Stub até tabelas Dress To — uma linha por peça do look. */
    const sizeRecommendations = computed(() =>
      buildSizeRecommendations(pieces.value),
    );

    function updateMeasure(key, event) {
      emit('update:measures', {
        ...props.measures,
        [key]: event.target.value,
      });
    }

    function updateDockClearance() {
      const el = dockStackRef.value;
      if (!el) return;
      const bottom = Number.parseFloat(getComputedStyle(el).bottom) || 16;
      const gap = 12;
      const clearance = Math.ceil(el.getBoundingClientRect().height + bottom + gap);
      document.documentElement.style.setProperty('--dt-dock-clearance', `${clearance}px`);
    }

    function bindDockObserver() {
      dockObserver?.disconnect();
      dockObserver = null;
      const el = dockStackRef.value;
      if (!el) return;
      updateDockClearance();
      if (typeof ResizeObserver === 'undefined') return;
      dockObserver = new ResizeObserver(() => updateDockClearance());
      dockObserver.observe(el);
    }

    async function acceptFile(file) {
      error.value = '';
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        error.value = 'Envie um arquivo de imagem (JPG, PNG ou WEBP).';
        return;
      }
      if (file.size > PHOTO_MAX_BYTES) {
        error.value = 'A imagem deve ter no máximo 12 MB.';
        return;
      }

      processing.value = true;
      try {
        const img = await loadImageFromBlob(file);
        if (props.photo?.url) URL.revokeObjectURL(props.photo.url);
        const url = URL.createObjectURL(file);
        emit('update:photo', {
          file,
          blob: file,
          url,
          width: img.width,
          height: img.height,
          name: file.name || 'foto.jpg',
          sourceBlob: file,
          sourceName: file.name || 'foto.jpg',
        });
      } catch {
        error.value = 'Não foi possível processar a imagem. Tente outro arquivo.';
      } finally {
        processing.value = false;
        if (inputRef.value) inputRef.value.value = '';
      }
    }

    function onFileChange(e) {
      acceptFile(e.target.files?.[0]);
    }

    function onDrop(e) {
      dragging.value = false;
      acceptFile(e.dataTransfer?.files?.[0]);
    }

    function clearPhoto() {
      if (props.photo?.url) URL.revokeObjectURL(props.photo.url);
      emit('update:photo', null);
      if (inputRef.value) inputRef.value.value = '';
    }

    function openPicker() {
      if (processing.value || props.generating || cropping.value) return;
      inputRef.value?.click();
    }

    function openCrop() {
      if (!props.photo || props.generating || cropping.value) return;
      const blob = props.photo.sourceBlob || props.photo.blob || props.photo.file;
      if (!blob) {
        error.value = 'Não há imagem disponível para recorte.';
        return;
      }
      cropSource.value = {
        blob,
        name: props.photo.sourceName || props.photo.name || 'foto.jpg',
      };
    }

    function cancelCrop() {
      cropSource.value = null;
    }

    function applyCrop(result) {
      if (props.photo?.url) URL.revokeObjectURL(props.photo.url);
      emit('update:photo', result);
      cropSource.value = null;
    }

    function applyCropAndGenerate(result) {
      applyCrop(result);
      emit('generate');
    }

    onMounted(() => {
      nextTick(bindDockObserver);
    });

    onBeforeUnmount(() => {
      dockObserver?.disconnect();
      dockObserver = null;
      document.documentElement.style.removeProperty('--dt-dock-clearance');
    });

    watch(pieces, () => nextTick(updateDockClearance));
    watch(hasResult, () => nextTick(updateDockClearance));
    watch(() => props.generating, () => nextTick(updateDockClearance));

    return {
      dragging,
      inputRef,
      dockStackRef,
      error,
      processing,
      cropSource,
      cropping,
      hasPhoto,
      hasResult,
      measuresLocked,
      pieces,
      sizeRecommendations,
      canGenerate,
      generateLabel,
      isImageLoaded,
      markImageLoaded,
      bindImageEl,
      updateMeasure,
      onFileChange,
      onDrop,
      clearPhoto,
      openPicker,
      openCrop,
      cancelCrop,
      applyCrop,
      applyCropAndGenerate,
    };
  },
  template: `
    <section
      class="dt-screen dt-screen--workspace"
      :class="{ 'is-complete': hasResult }"
      aria-labelledby="workspace-title"
    >
      <header class="dt-workspace-intro">
        <div class="dt-workspace-intro-copy">
          <h1 class="dt-screen-title" id="workspace-title">
            {{ hasResult ? 'Look e foto prontos' : 'Montar provador' }}
          </h1>
          <p class="dt-workspace-intro-lead">
            {{ hasResult
              ? 'Compare o resultado, salve a imagem e copie as referências.'
              : 'Envie a foto da cliente e gere o look.' }}
          </p>
        </div>
      </header>

      <div class="dt-workspace dt-workspace--split">
        <div class="dt-workspace-col dt-workspace-col--photo dt-glass-2">
          <div class="dt-workspace-photo-row">
            <div class="dt-workspace-photo-side">
              <div class="dt-workspace-canvas dt-workspace-canvas--upload"
                :class="{
                  'is-ready': hasPhoto,
                  'is-dragging': dragging,
                  'is-processing': processing,
                }"
                role="button"
                tabindex="0"
                :aria-label="hasPhoto ? 'Trocar foto da cliente' : 'Selecionar ou arrastar foto da cliente'"
                :aria-busy="processing ? 'true' : 'false'"
                @dragenter.prevent="dragging = true"
                @dragover.prevent="dragging = true"
                @dragleave.prevent="dragging = false"
                @drop.prevent="onDrop"
                @keydown.enter="openPicker"
                @keydown.space.prevent="openPicker"
                @click="openPicker"
              >
                <div
                  v-if="hasPhoto"
                  class="dt-media-skel dt-workspace-canvas-media"
                  :class="{ 'is-loaded': isImageLoaded(photo.url) && !processing }"
                  :key="photo.url"
                >
                  <img
                    :src="photo.url"
                    :alt="'Preview — ' + photo.name"
                    class="dt-workspace-canvas-img"
                    :ref="(el) => bindImageEl(el, photo.url)"
                    @load="markImageLoaded(photo.url)"
                    @error="markImageLoaded(photo.url)"
                  />
                </div>
                <span
                  v-if="processing"
                  class="dt-skel dt-skel--canvas"
                  aria-hidden="true"
                ></span>

                <div class="dt-workspace-canvas-overlay" :class="{ 'is-empty': !hasPhoto }">
                  <div class="dt-workspace-canvas-cta">
                    <span class="dt-workspace-canvas-icon" aria-hidden="true">
                      <span class="material-symbols-outlined dt-icon dt-icon--lg">upload</span>
                    </span>
                    <strong>
                      {{ processing ? 'Processando…' : (hasPhoto ? 'Trocar foto' : 'Selecionar ou arrastar foto') }}
                    </strong>
                    <span v-if="!hasPhoto">JPG, PNG ou WEBP · até 12 MB · recorte opcional</span>
                  </div>
                </div>

                <input
                  ref="inputRef"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  aria-label="Selecionar foto da cliente"
                  :disabled="processing || generating || cropping"
                  @change="onFileChange"
                  @click.stop
                />
              </div>

              <div v-if="hasPhoto" class="dt-workspace-photo-actions">
                <button
                  type="button"
                  class="dt-btn dt-btn--ghost"
                  :disabled="generating || processing || cropping"
                  @click="openCrop"
                >
                  <span class="material-symbols-outlined dt-icon" aria-hidden="true">crop</span>
                  Recortar
                </button>
                <button
                  type="button"
                  class="dt-btn dt-btn--ghost"
                  :disabled="generating || processing || cropping"
                  @click="openPicker"
                >
                  <span class="material-symbols-outlined dt-icon" aria-hidden="true">swap_horiz</span>
                  Trocar
                </button>
                <button
                  type="button"
                  class="dt-btn dt-btn--ghost"
                  :disabled="generating || processing || cropping"
                  @click="clearPhoto"
                >
                  <span class="material-symbols-outlined dt-icon" aria-hidden="true">delete</span>
                  Remover
                </button>
              </div>
            </div>

            <aside
              class="dt-measures"
              :class="{ 'is-locked': measuresLocked }"
              aria-labelledby="dt-measures-title"
            >
              <div class="dt-measures-main">
                <div class="dt-measures-head">
                  <h3 id="dt-measures-title">Medidas da cliente</h3>
                  <p>
                    {{ measuresLocked
                      ? 'Travadas após a geração do look.'
                      : 'Informe altura, peso e idade antes de gerar o look.' }}
                  </p>
                </div>

                <div class="dt-measures-fields">
                  <label class="dt-measures-field">
                    <span>Altura (cm)</span>
                    <input
                      type="number"
                      inputmode="numeric"
                      min="100"
                      max="250"
                      step="1"
                      placeholder="ex. 165"
                      :value="measures.heightCm"
                      :disabled="measuresLocked"
                      @input="updateMeasure('heightCm', $event)"
                    />
                  </label>
                  <label class="dt-measures-field">
                    <span>Peso (kg)</span>
                    <input
                      type="number"
                      inputmode="decimal"
                      min="30"
                      max="250"
                      step="1"
                      placeholder="ex. 62"
                      :value="measures.weightKg"
                      :disabled="measuresLocked"
                      @input="updateMeasure('weightKg', $event)"
                    />
                  </label>
                  <label class="dt-measures-field">
                    <span>Idade</span>
                    <input
                      type="number"
                      inputmode="numeric"
                      min="10"
                      max="100"
                      step="1"
                      placeholder="ex. 28"
                      :value="measures.age"
                      :disabled="measuresLocked"
                      @input="updateMeasure('age', $event)"
                    />
                  </label>
                </div>
              </div>

              <div
                v-if="hasResult"
                class="dt-size-recs"
                role="region"
                aria-labelledby="dt-size-recs-title"
              >
                <div class="dt-size-recs-head">
                  <h4 id="dt-size-recs-title">Recomendação de tamanho</h4>
                  <p>Uma sugestão por peça do look.</p>
                </div>

                <ul v-if="sizeRecommendations.length" class="dt-size-recs-list">
                  <li
                    v-for="item in sizeRecommendations"
                    :key="item.piece.id"
                    class="dt-size-rec"
                  >
                    <div
                      class="dt-media-skel dt-size-rec-thumb"
                      :class="{ 'is-loaded': isImageLoaded(item.piece.image) }"
                    >
                      <img
                        :src="item.piece.image"
                        :alt="item.piece.name"
                        :ref="(el) => bindImageEl(el, item.piece.image)"
                        @load="markImageLoaded(item.piece.image)"
                        @error="markImageLoaded(item.piece.image)"
                      />
                    </div>
                    <div class="dt-size-rec-body">
                      <span class="dt-size-rec-cat">{{ item.pieceLabel }}</span>
                      <div class="dt-size-rec-name">{{ item.piece.name }}</div>
                      <div class="dt-size-rec-ref">{{ item.piece.ref }}</div>
                    </div>
                    <strong
                      class="dt-size-rec-size"
                      :class="{ 'is-pending': item.pending }"
                    >{{ item.sizeLabel }}</strong>
                    <button
                      type="button"
                      class="dt-btn dt-btn--sm dt-size-rec-copy"
                      :class="copiedRefId === item.piece.id ? 'dt-btn--primary is-success' : 'dt-btn--outline'"
                      :aria-label="'Copiar referência ' + item.piece.ref"
                      :title="'Copiar ' + item.piece.ref"
                      @click="$emit('copy-ref', item.piece)"
                    >
                      <span class="material-symbols-outlined dt-icon dt-icon--sm" aria-hidden="true">
                        {{ copiedRefId === item.piece.id ? 'check' : 'content_copy' }}
                      </span>
                      {{ copiedRefId === item.piece.id ? 'OK' : 'Copiar' }}
                    </button>
                  </li>
                </ul>

                <p v-else class="dt-size-recs-empty">
                  Adicione peças no catálogo para ver a recomendação de cada uma.
                </p>
              </div>
            </aside>
          </div>

          <div class="dt-workspace-footer">
            <p v-if="error" class="dt-upload-error" role="alert">{{ error }}</p>
          </div>
        </div>

        <div
          class="dt-workspace-col dt-workspace-col--result dt-glass-2"
          :class="{ 'is-awaiting': !hasResult && !generating }"
        >
          <div class="dt-workspace-col-head">
            <div class="dt-workspace-col-copy">
              <h2>Resultado</h2>
            </div>
            <button
              v-if="hasResult"
              type="button"
              class="dt-btn dt-btn--ghost dt-btn--sm dt-workspace-favorite"
              :class="{ 'is-favorited': lookFavorited }"
              :aria-pressed="lookFavorited ? 'true' : 'false'"
              :aria-label="lookFavorited ? 'Remover look dos favoritos' : 'Favoritar look'"
              @click="$emit('toggle-favorite')"
            >
              <span
                class="material-symbols-outlined dt-icon dt-icon--sm"
                :class="{ 'dt-icon--fill': lookFavorited }"
                aria-hidden="true"
              >
                {{ lookFavorited ? 'favorite' : 'favorite_border' }}
              </span>
              {{ lookFavorited ? 'Look favorito' : 'Favoritar look' }}
            </button>
          </div>

          <div class="dt-workspace-result-stage">
            <div
              class="dt-workspace-canvas dt-workspace-canvas--result"
              :class="{
                'is-ready': hasResult && !generating,
                'is-awaiting': !hasResult && !generating,
              }"
              :aria-busy="generating ? 'true' : 'false'"
            >
              <div
                v-if="hasResult"
                class="dt-media-skel dt-workspace-canvas-media"
                :class="{ 'is-loaded': isImageLoaded(resultUrl) && !generating }"
              >
                <img
                  :src="resultUrl"
                  alt="Imagem gerada do provador virtual"
                  :ref="(el) => bindImageEl(el, resultUrl)"
                  @load="markImageLoaded(resultUrl)"
                  @error="markImageLoaded(resultUrl)"
                />
                <div
                  v-if="!generating"
                  class="dt-workspace-copy-image"
                >
                  <button
                    type="button"
                    class="dt-btn dt-btn--primary dt-workspace-copy-image-btn"
                    :class="{ 'is-success': copiedImage }"
                    @click="$emit('copy-image')"
                  >
                    <span class="material-symbols-outlined dt-icon" aria-hidden="true">
                      {{ copiedImage ? 'check' : 'content_copy' }}
                    </span>
                    {{ copiedImage ? 'Imagem copiada' : 'Copiar imagem' }}
                  </button>
                </div>
              </div>
              <span
                v-if="generating"
                class="dt-skel dt-skel--canvas"
                aria-hidden="true"
              ></span>
              <div
                v-else-if="!hasResult"
                class="dt-workspace-result-empty"
              >
                <span class="material-symbols-outlined dt-icon dt-icon--lg" aria-hidden="true">checkroom</span>
                <strong>Resultado do look</strong>
                <span>Aparece aqui depois de gerar.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Teleport to="body">
        <div ref="dockStackRef" class="dt-workspace-dock-stack">
          <div
            class="dt-workspace-dock"
            role="toolbar"
            aria-label="Ações do atendimento"
          >
            <div class="dt-workspace-dock-bar">
              <div class="dt-workspace-dock-tools">
                <button
                  type="button"
                  class="dt-btn dt-btn--ghost dt-btn--sm"
                  :disabled="generating || cropping"
                  @click="$emit('edit-catalog')"
                >
                  <span class="material-symbols-outlined dt-icon dt-icon--sm" aria-hidden="true">arrow_back</span>
                  Voltar
                </button>
              </div>

              <div class="dt-workspace-dock-cta">
                <div class="dt-workspace-dock-actions">
                  <button
                    type="button"
                    class="dt-btn"
                    :class="hasResult ? 'dt-btn--ghost dt-btn--sm' : 'dt-btn--primary'"
                    :disabled="generating || !canGenerate || cropping"
                    @click="$emit('generate')"
                  >
                    <span
                      v-if="hasResult"
                      class="material-symbols-outlined dt-icon dt-icon--sm"
                      aria-hidden="true"
                    >refresh</span>
                    {{ generateLabel }}
                  </button>

                  <button
                    v-if="hasResult"
                    type="button"
                    class="dt-btn dt-btn--ghost dt-btn--sm"
                    @click="$emit('restart')"
                  >
                    <span class="material-symbols-outlined dt-icon dt-icon--sm" aria-hidden="true">add</span>
                    Novo
                  </button>

                  <button
                    v-if="hasResult"
                    type="button"
                    class="dt-btn dt-btn--primary dt-btn--sm"
                    :class="{ 'is-success': savedImage }"
                    @click="$emit('save-image')"
                  >
                    <span class="material-symbols-outlined dt-icon dt-icon--sm" aria-hidden="true">download</span>
                    {{ savedImage ? 'Foto salva' : 'Salvar Foto' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Teleport>

      <PhotoCropModal
        v-if="cropSource"
        :source-blob="cropSource.blob"
        :source-name="cropSource.name"
        @cancel="cancelCrop"
        @apply="applyCrop"
        @apply-and-generate="applyCropAndGenerate"
      />
    </section>
  `,
};
