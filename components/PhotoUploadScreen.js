import {
  normalizeToFhd916,
  PHOTO_MAX_BYTES,
  PHOTO_WIDTH,
  PHOTO_HEIGHT,
} from '../js/image.js';

const { ref, computed } = Vue;

export default {
  name: 'PhotoUploadScreen',
  props: {
    photo: { type: Object, default: null },
  },
  emits: ['update:photo', 'continue', 'back'],
  setup(props, { emit }) {
    const dragging = ref(false);
    const inputRef = ref(null);
    const error = ref('');
    const processing = ref(false);

    const hasPhoto = computed(() => Boolean(props.photo?.url));
    const photoLabel = computed(() => {
      if (!props.photo) return '';
      return `${props.photo.name || 'foto'} · ${PHOTO_WIDTH}×${PHOTO_HEIGHT} · 9:16`;
    });

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
        const normalized = await normalizeToFhd916(file, file.name);
        if (props.photo?.url) URL.revokeObjectURL(props.photo.url);
        emit('update:photo', normalized);
      } catch {
        error.value = 'Não foi possível processar a imagem. Tente outro arquivo.';
      } finally {
        processing.value = false;
        if (inputRef.value) inputRef.value.value = '';
      }
    }

    function onFileChange(e) {
      const file = e.target.files?.[0];
      acceptFile(file);
    }

    function onDrop(e) {
      dragging.value = false;
      const file = e.dataTransfer?.files?.[0];
      acceptFile(file);
    }

    function clearPhoto() {
      if (props.photo?.url) URL.revokeObjectURL(props.photo.url);
      emit('update:photo', null);
      if (inputRef.value) inputRef.value.value = '';
    }

    return {
      dragging,
      inputRef,
      error,
      processing,
      hasPhoto,
      photoLabel,
      PHOTO_WIDTH,
      PHOTO_HEIGHT,
      onFileChange,
      onDrop,
      clearPhoto,
    };
  },
  template: `
    <section class="dt-screen dt-screen--upload" aria-labelledby="upload-title">
      <header class="dt-upload-intro">
        <p class="dt-upload-intro__eyebrow">Passo 2 · Foto</p>
        <h1 class="dt-screen__title" id="upload-title">Foto da cliente</h1>
        <p class="dt-screen__lead">
          Faça upload da foto recebida no WhatsApp. A imagem é recortada e
          redimensionada automaticamente para Full HD vertical ({{ PHOTO_WIDTH }}×{{ PHOTO_HEIGHT }}, 9:16).
        </p>
      </header>

      <div class="dt-upload">
        <div
          class="dt-dropzone"
          :class="{ 'is-dragging': dragging, 'has-photo': hasPhoto, 'is-processing': processing }"
          role="button"
          tabindex="0"
          :aria-busy="processing ? 'true' : 'false'"
          @dragenter.prevent="dragging = true"
          @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false"
          @drop.prevent="onDrop"
          @keydown.enter="!processing && inputRef?.click()"
          @keydown.space.prevent="!processing && inputRef?.click()"
        >
          <div class="dt-dropzone__glow" aria-hidden="true"></div>
          <div class="dt-dropzone__icon" aria-hidden="true">
            <span class="material-symbols-outlined dt-icon dt-icon--lg">upload</span>
          </div>
          <div class="dt-dropzone__copy">
            <div class="dt-dropzone__title">
              {{ processing ? 'Ajustando para 9:16 Full HD…' : 'Arraste a foto ou clique para selecionar' }}
            </div>
            <div class="dt-dropzone__hint">JPG, PNG ou WEBP · até 12 MB · saída {{ PHOTO_WIDTH }}×{{ PHOTO_HEIGHT }}</div>
          </div>
          <span class="dt-dropzone__cta">{{ processing ? 'Processando…' : 'Selecionar arquivo' }}</span>
          <ul class="dt-dropzone__tips" aria-hidden="true">
            <li>Corpo inteiro</li>
            <li>Boa luz</li>
            <li>9:16 Full HD</li>
          </ul>
          <input
            ref="inputRef"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label="Selecionar foto da cliente"
            :disabled="processing"
            @change="onFileChange"
          />
        </div>

        <div class="dt-preview" :class="{ 'is-ready': hasPhoto }">
          <div class="dt-preview__badge">Preview 9:16</div>
          <template v-if="hasPhoto">
            <div class="dt-preview__frame">
              <img :src="photo.url" :alt="'Preview — ' + photo.name" />
            </div>
            <div class="dt-preview__meta">
              <span class="dt-preview__name">{{ photoLabel }}</span>
              <button type="button" class="dt-btn dt-btn--ghost dt-btn--sm" @click="clearPhoto">
                Trocar foto
              </button>
            </div>
          </template>
          <div v-else class="dt-preview__empty">
            <div class="dt-preview__silhouette" aria-hidden="true"></div>
            <p class="dt-preview__empty-title">Sem foto ainda</p>
            <p class="dt-preview__empty-hint">O preview 9:16 aparece aqui após o upload</p>
          </div>
        </div>
      </div>

      <p v-if="error" class="dt-upload__error" role="alert">{{ error }}</p>

      <div class="dt-upload__footer">
        <button type="button" class="dt-btn dt-btn--ghost" @click="$emit('back')">
          Voltar ao catálogo
        </button>
        <button
          type="button"
          class="dt-btn dt-btn--primary"
          :disabled="!hasPhoto || processing"
          @click="$emit('continue')"
        >
          Continuar para gerar
        </button>
      </div>
    </section>
  `,
};
