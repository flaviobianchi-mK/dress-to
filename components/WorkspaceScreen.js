import {
  CATEGORIES,
  categoryLabel,
  formatPrice,
  pieceNeedsSize,
  pieceIsSized,
} from '../js/catalog-data.js';
import {
  PHOTO_MAX_BYTES,
} from '../js/image.js';
import PhotoCropModal from './PhotoCropModal.js';
import LookFloatingBar from './LookFloatingBar.js';

const { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } = Vue;

export default {
  name: 'WorkspaceScreen',
  components: { PhotoCropModal, LookFloatingBar },
  props: {
    photo: { type: Object, default: null },
    selected: { type: Object, required: true },
    resultUrl: { type: String, default: null },
    generating: { type: Boolean, default: false },
    savedImage: { type: Boolean, default: false },
    lookFavorited: { type: Boolean, default: false },
    copiedRefId: { type: String, default: null },
    copiedAllRefs: { type: Boolean, default: false },
    lookPlacement: { type: String, default: 'floating' },
  },
  emits: [
    'update:photo',
    'generate',
    'edit-catalog',
    'save-image',
    'copy-ref',
    'copy-all-refs',
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
    const showResultCol = computed(() => hasResult.value || props.generating);
    const cropping = computed(() => Boolean(cropSource.value));
    const isFloatingLook = computed(() => props.lookPlacement === 'floating');

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

    const lookTotal = computed(() =>
      pieces.value.reduce((sum, p) => sum + (p.price || 0), 0),
    );

    const missingSizes = computed(
      () => pieces.value.filter((p) => pieceNeedsSize(p) && !pieceIsSized(p)).length,
    );

    const canGenerate = computed(
      () =>
        hasPhoto.value &&
        pieces.value.length > 0 &&
        missingSizes.value === 0,
    );

    const statusHint = computed(() => {
      if (error.value) return '';
      if (!pieces.value.length) return 'Volte ao catálogo e monte o look da cliente.';
      if (!hasPhoto.value) return 'Envie a foto recebida no WhatsApp e recorte no enquadramento 9:16.';
      if (missingSizes.value) {
        return `${missingSizes.value} peça${missingSizes.value > 1 ? 's' : ''} sem tamanho — edite no catálogo.`;
      }
      if (!hasResult.value) return 'Tudo certo. Gere o provador virtual.';
      return 'Salve a imagem e copie as referências para colar no Omnichat.';
    });

    const generateLabel = computed(() =>
      hasResult.value ? 'Gerar novamente' : 'Gerar look',
    );

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

    function acceptFile(file) {
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

      cropSource.value = {
        blob: file,
        name: file.name || 'foto.jpg',
      };
      if (inputRef.value) inputRef.value.value = '';
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

    watch(isFloatingLook, () => nextTick(bindDockObserver));
    watch(pieces, () => nextTick(updateDockClearance));
    watch(showResultCol, () => nextTick(updateDockClearance));

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
      showResultCol,
      isFloatingLook,
      pieces,
      lookTotal,
      missingSizes,
      canGenerate,
      statusHint,
      generateLabel,
      categoryLabel,
      formatPrice,
      pieceNeedsSize,
      pieceIsSized,
      isImageLoaded,
      markImageLoaded,
      bindImageEl,
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
      :class="{
        'is-complete': hasResult,
        'is-floating-look': isFloatingLook,
      }"
      aria-labelledby="workspace-title"
    >
      <header class="dt-workspace-intro">
        <div class="dt-workspace-intro__copy">
          <h1 class="dt-screen__title" id="workspace-title">
            {{ hasResult ? 'Provador pronto' : 'Montar provador' }}
          </h1>
          <p class="dt-workspace-intro__lead">
            {{ hasResult
              ? 'Compare o resultado, salve a imagem e copie as referências.'
              : 'Envie a foto da cliente, recorte o enquadramento e gere o look.' }}
          </p>
        </div>
      </header>

      <aside
        v-if="!isFloatingLook"
        class="dt-workspace__refs dt-glass-2"
        aria-label="Look selecionado"
      >
        <div class="dt-workspace__refs-head">
          <div class="dt-workspace__refs-title">
            <h2>Look</h2>
            <span v-if="pieces.length" class="dt-workspace__refs-count">
              {{ pieces.length }} peça{{ pieces.length > 1 ? 's' : '' }}
            </span>
          </div>
          <div class="dt-workspace__refs-meta">
            <span v-if="pieces.length" class="dt-workspace__refs-total">{{ formatPrice(lookTotal) }}</span>
          </div>
        </div>

        <ul v-if="pieces.length" class="dt-workspace__refs-grid">
          <li
            v-for="piece in pieces"
            :key="piece.id"
            class="dt-workspace__ref-card"
            :class="{ 'is-warn': pieceNeedsSize(piece) && !pieceIsSized(piece) }"
          >
            <div
              class="dt-media-skel dt-workspace__ref-thumb"
              :class="{ 'is-loaded': isImageLoaded(piece.image) }"
            >
              <img
                :src="piece.image"
                :alt="piece.name"
                :ref="(el) => bindImageEl(el, piece.image)"
                @load="markImageLoaded(piece.image)"
                @error="markImageLoaded(piece.image)"
              />
            </div>
            <div class="dt-workspace__ref-body">
              <span class="dt-workspace__ref-cat">{{ categoryLabel(piece.category) }}</span>
              <div class="dt-ref-row__name">{{ piece.name }}</div>
              <div class="dt-ref-row__ref">
                {{ piece.ref }}<template v-if="pieceNeedsSize(piece)"> · {{ piece.size || '—' }}</template>
              </div>
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
        <p v-else class="dt-lookbar__hint">Nenhuma peça selecionada — edite o catálogo para continuar.</p>
      </aside>

      <div class="dt-workspace" :class="{ 'dt-workspace--solo': !showResultCol, 'dt-workspace--split': showResultCol }">
        <div class="dt-workspace__col dt-workspace__col--photo dt-glass-2">
          <div class="dt-workspace__col-head">
            <div class="dt-workspace__col-copy">
              <h2>Foto enviada</h2>
            </div>
          </div>

          <div class="dt-workspace__canvas dt-workspace__canvas--upload"
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
              class="dt-media-skel dt-workspace__canvas-media"
              :class="{ 'is-loaded': isImageLoaded(photo.url) && !processing }"
              :key="photo.url"
            >
              <img
                :src="photo.url"
                :alt="'Preview — ' + photo.name"
                class="dt-workspace__canvas-img"
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

            <div class="dt-workspace__canvas-overlay" :class="{ 'is-empty': !hasPhoto }">
              <div class="dt-workspace__canvas-cta">
                <span class="dt-workspace__canvas-icon" aria-hidden="true">
                  <span class="material-symbols-outlined dt-icon dt-icon--lg">upload</span>
                </span>
                <strong>
                  {{ processing ? 'Processando…' : (hasPhoto ? 'Trocar foto' : 'Selecionar ou arrastar foto') }}
                </strong>
                <span v-if="!hasPhoto">JPG, PNG ou WEBP · até 12 MB · recorte 9:16</span>
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

          <div v-if="hasPhoto" class="dt-workspace__photo-actions">
            <button
              type="button"
              class="dt-btn dt-btn--ghost dt-btn--sm"
              :disabled="generating || processing || cropping"
              @click="openCrop"
            >
              <span class="material-symbols-outlined dt-icon dt-icon--sm" aria-hidden="true">crop</span>
              Recortar
            </button>
            <button
              type="button"
              class="dt-btn dt-btn--ghost dt-btn--sm"
              :disabled="generating || processing || cropping"
              @click="openPicker"
            >
              <span class="material-symbols-outlined dt-icon dt-icon--sm" aria-hidden="true">swap_horiz</span>
              Trocar
            </button>
            <button
              type="button"
              class="dt-btn dt-btn--ghost dt-btn--sm"
              :disabled="generating || processing || cropping"
              @click="clearPhoto"
            >
              <span class="material-symbols-outlined dt-icon dt-icon--sm" aria-hidden="true">delete</span>
              Remover
            </button>
          </div>

          <div class="dt-workspace__footer">
            <p v-if="error" class="dt-upload__error" role="alert">{{ error }}</p>
            <p v-else class="dt-lookbar__hint">{{ statusHint }}</p>
          </div>
        </div>

        <div
          v-if="showResultCol"
          class="dt-workspace__col dt-workspace__col--result dt-glass-2"
        >
          <div class="dt-workspace__col-head">
            <div class="dt-workspace__col-copy">
              <h2>Resultado</h2>
            </div>
            <button
              v-if="hasResult"
              type="button"
              class="dt-btn dt-btn--ghost dt-btn--sm dt-workspace__favorite"
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

          <div
            class="dt-workspace__canvas dt-workspace__canvas--result"
            :class="{ 'is-ready': hasResult && !generating }"
            :aria-busy="generating ? 'true' : 'false'"
          >
            <div
              v-if="hasResult"
              class="dt-media-skel dt-workspace__canvas-media"
              :class="{ 'is-loaded': isImageLoaded(resultUrl) && !generating }"
            >
              <img
                :src="resultUrl"
                alt="Imagem gerada do provador virtual"
                :ref="(el) => bindImageEl(el, resultUrl)"
                @load="markImageLoaded(resultUrl)"
                @error="markImageLoaded(resultUrl)"
              />
            </div>
            <span
              v-if="generating || !hasResult"
              class="dt-skel dt-skel--canvas"
              aria-hidden="true"
            ></span>
          </div>
        </div>
      </div>

      <Teleport to="body">
        <div ref="dockStackRef" class="dt-workspace__dock-stack">
          <LookFloatingBar
            v-if="isFloatingLook"
            :pieces="pieces"
            :copied-ref-id="copiedRefId"
            @copy-ref="$emit('copy-ref', $event)"
          />

          <div
            class="dt-workspace__dock"
            role="toolbar"
            aria-label="Ações do atendimento"
          >
            <div class="dt-workspace__dock-bar">
              <div class="dt-workspace__dock-tools">
                <button
                  type="button"
                  class="dt-btn dt-btn--ghost dt-btn--sm"
                  :disabled="generating || cropping"
                  @click="$emit('edit-catalog')"
                >
                  <span class="material-symbols-outlined dt-icon dt-icon--sm" aria-hidden="true">arrow_back</span>
                  Voltar
                </button>

                <button
                  v-if="pieces.length"
                  type="button"
                  class="dt-btn dt-btn--sm"
                  :class="copiedAllRefs ? 'dt-btn--primary is-success' : 'dt-btn--ghost'"
                  :disabled="generating || cropping"
                  @click="$emit('copy-all-refs')"
                >
                  <span class="material-symbols-outlined dt-icon dt-icon--sm" aria-hidden="true">barcode</span>
                  {{ copiedAllRefs ? 'SKUs copiadas' : 'Copiar SKUs' }}
                </button>
              </div>

              <div class="dt-workspace__dock-cta">
                <div class="dt-workspace__dock-actions">
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
