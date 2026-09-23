import {
  normalizeToFhd916,
  PHOTO_MAX_BYTES,
  PHOTO_WIDTH,
  PHOTO_HEIGHT,
} from '../js/image.js';

const { ref, computed } = Vue;

function measuresReady(measures) {
  const h = Number(measures?.heightCm);
  const w = Number(measures?.weightKg);
  const a = Number(measures?.age);
  return (
    Number.isFinite(h) && h >= 100 && h <= 250
    && Number.isFinite(w) && w >= 30 && w <= 250
    && Number.isFinite(a) && a >= 10 && a <= 100
  );
}

export default {
  name: 'PhotoUploadScreen',
  props: {
    photo: { type: Object, default: null },
    measures: { type: Object, required: true },
  },
  emits: ['update:photo', 'update:measures', 'continue', 'back'],
  setup(props, { emit }) {
    const dragging = ref(false);
    const inputRef = ref(null);
    const error = ref('');
    const processing = ref(false);

    const hasPhoto = computed(() => Boolean(props.photo?.url));
    const hasMeasures = computed(() => measuresReady(props.measures));
    const canContinue = computed(() => hasPhoto.value && hasMeasures.value && !processing.value);

    const photoLabel = computed(() => {
      if (!props.photo) return '';
      return `${props.photo.name || 'foto'} · ${PHOTO_WIDTH}×${PHOTO_HEIGHT} · 9:16`;
    });

    function updateMeasure(key, event) {
      emit('update:measures', {
        ...props.measures,
        [key]: event.target.value,
      });
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
        const normalized = await normalizeToFhd916(file, file.name);
        if (props.photo?.url) URL.revokeObjectURL(props.photo.url);
        emit('update:photo', {
          ...normalized,
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
      hasMeasures,
      canContinue,
      photoLabel,
      PHOTO_WIDTH,
      PHOTO_HEIGHT,
      updateMeasure,
      onFileChange,
      onDrop,
      clearPhoto,
    };
  },
  template: `
    <section class="dt-screen dt-screen--upload" aria-labelledby="upload-title">
      <header class="dt-upload-intro">
        <p class="dt-upload-intro-eyebrow">Passo 2 · Foto</p>
        <h1 class="dt-screen-title" id="upload-title">Foto da cliente</h1>
        <p class="dt-screen-lead">
          Faça upload da foto recebida no WhatsApp e informe as medidas.
          A imagem é ajustada automaticamente para Full HD vertical
          ({{ PHOTO_WIDTH }}×{{ PHOTO_HEIGHT }}, 9:16).
        </p>
      </header>

      <div class="dt-upload dt-upload--with-measures">
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
          <div class="dt-dropzone-glow" aria-hidden="true"></div>
          <div class="dt-dropzone-icon" aria-hidden="true">
            <span class="material-symbols-outlined dt-icon dt-icon--lg">upload</span>
          </div>
          <div class="dt-dropzone-copy">
            <div class="dt-dropzone-title">
              {{ processing ? 'Ajustando para 9:16 Full HD…' : 'Arraste a foto ou clique para selecionar' }}
            </div>
            <div class="dt-dropzone-hint">JPG, PNG ou WEBP · até 12 MB · saída {{ PHOTO_WIDTH }}×{{ PHOTO_HEIGHT }}</div>
          </div>
          <span class="dt-dropzone-cta">{{ processing ? 'Processando…' : 'Selecionar arquivo' }}</span>
          <ul class="dt-dropzone-tips" aria-hidden="true">
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

        <div class="dt-upload-side">
          <div class="dt-preview" :class="{ 'is-ready': hasPhoto }">
            <div class="dt-preview-badge">Preview 9:16</div>
            <template v-if="hasPhoto">
              <div class="dt-preview-frame">
                <img :src="photo.url" :alt="'Preview — ' + photo.name" />
              </div>
              <div class="dt-preview-meta">
                <span class="dt-preview-name">{{ photoLabel }}</span>
                <button type="button" class="dt-btn dt-btn--ghost dt-btn--sm" @click="clearPhoto">
                  Trocar foto
                </button>
              </div>
            </template>
            <div v-else class="dt-preview-empty">
              <div class="dt-preview-silhouette" aria-hidden="true"></div>
              <p class="dt-preview-empty-title">Sem foto ainda</p>
              <p class="dt-preview-empty-hint">O preview 9:16 aparece aqui após o upload</p>
            </div>
          </div>

          <aside class="dt-measures" aria-labelledby="dt-measures-title-classic">
            <div class="dt-measures-head">
              <h3 id="dt-measures-title-classic">Medidas da cliente</h3>
              <p>Informe altura, peso e idade antes de continuar.</p>
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
                  :disabled="processing"
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
                  :disabled="processing"
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
                  :disabled="processing"
                  @input="updateMeasure('age', $event)"
                />
              </label>
            </div>

            <div class="dt-measures-result" role="status">
              <span class="dt-measures-result-label">Recomendação de tamanho</span>
              <strong>Pendente</strong>
              <p>Tabelas Dress To ainda não integradas — a recomendação chega na próxima etapa.</p>
            </div>
          </aside>
        </div>
      </div>

      <p v-if="error" class="dt-upload-error" role="alert">{{ error }}</p>

      <div class="dt-upload-footer">
        <button type="button" class="dt-btn dt-btn--ghost" @click="$emit('back')">
          Voltar ao catálogo
        </button>
        <button
          type="button"
          class="dt-btn dt-btn--primary"
          :disabled="!canContinue"
          @click="$emit('continue')"
        >
          Continuar para gerar
        </button>
      </div>
    </section>
  `,
};
