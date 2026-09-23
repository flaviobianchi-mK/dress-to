import StepHeader from '../components/StepHeader.js';
import LoginScreen from '../components/LoginScreen.js';
import PhotoUploadScreen from '../components/PhotoUploadScreen.js';
import CatalogScreen from '../components/CatalogScreen.js';
import GenerateScreen from '../components/GenerateScreen.js';
import ResultScreen from '../components/ResultScreen.js';
import WorkspaceScreen from '../components/WorkspaceScreen.js';
import LooksLibraryScreen from '../components/LooksLibraryScreen.js';
import LoadingOverlay from '../components/LoadingOverlay.js';
import { CATEGORIES } from './catalog-data.js';
import { copyText, copyImageBlob, composeTryOn } from './clipboard.js';
import {
  loadHistory,
  loadFavorites,
  addToHistory,
  removeFromHistory,
  clearHistory as clearHistoryStore,
  addFavorite,
  removeFavorite,
  isFavorite,
  createLookRecord,
} from './looks-store.js';
import { exampleSizeForIndex } from './size-recommend.js';

const { createApp, ref, computed, watch, nextTick } = Vue;

const AUTH_KEY = 'dt-shopper-auth';
const LAYOUT_KEY = 'dt-layout-mode';
const LIBRARY_STEPS = new Set(['favorites', 'history']);

/** Dev-only: reative para true para exibir os toggles no header. */
const SHOW_LAYOUT_TOGGLES = false;

const PROGRESS_MESSAGES = [
  'Preparando a foto da cliente…',
  'Aplicando as peças do look…',
  'Ajustando encaixe e iluminação…',
  'Finalizando o provador virtual…',
];

function readAuth() {
  try {
    const raw = sessionStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readLayoutMode() {
  const saved = sessionStorage.getItem(LAYOUT_KEY);
  return saved === 'classic' ? 'classic' : 'workspace';
}

function emptyMeasures() {
  return { heightCm: '', weightKg: '', age: '' };
}

createApp({
  components: {
    StepHeader,
    LoginScreen,
    PhotoUploadScreen,
    CatalogScreen,
    GenerateScreen,
    ResultScreen,
    WorkspaceScreen,
    LooksLibraryScreen,
    LoadingOverlay,
  },
  setup() {
    const shopper = ref(readAuth());
    const authenticated = computed(() => Boolean(shopper.value));
    const layoutMode = ref(SHOW_LAYOUT_TOGGLES ? readLayoutMode() : 'workspace');

    const step = ref('catalog');
    const previousStep = ref('catalog');
    const photo = ref(null);
    const selected = ref(emptySelection());
    const clientMeasures = ref(emptyMeasures());
    const resultUrl = ref(null);
    const resultBlob = ref(null);
    const currentLookId = ref(null);
    const generating = ref(false);
    const progressMsg = ref(PROGRESS_MESSAGES[0]);
    const copiedImage = ref(false);
    const savedImage = ref(false);
    const lookFavorited = ref(false);
    const copiedRefId = ref(null);
    const toast = ref(null);
    const historyLooks = ref(loadHistory());
    const favoriteLooks = ref(loadFavorites());

    let progressTimer = null;
    let feedbackTimers = [];

    const pieces = computed(() =>
      CATEGORIES.map((c) => selected.value[c.id]).filter(Boolean),
    );

    const mainInert = computed(() => generating.value);
    const isWorkspace = computed(() => layoutMode.value === 'workspace');

    watch(generating, async (locked) => {
      await nextTick();
      document.documentElement.classList.toggle('dt-scroll-lock', locked);
      document.body.style.overflow = locked ? 'hidden' : '';
    });

    function emptySelection() {
      return { cima: null, baixo: null, acessorio: null };
    }

    const TOAST_DURATION_MS = 4000;

    function showToast(msg, tone = 'default') {
      toast.value = { message: msg, tone };
      clearTimeout(showToast._t);
      showToast._t = setTimeout(() => { toast.value = null; }, TOAST_DURATION_MS);
    }

    function onLogin(user) {
      shopper.value = user;
      sessionStorage.setItem(AUTH_KEY, JSON.stringify(user));
      step.value = 'catalog';
      showToast(`Olá, ${user.name}`, 'success');
    }

    function logout() {
      shopper.value = null;
      sessionStorage.removeItem(AUTH_KEY);
      if (photo.value?.url) URL.revokeObjectURL(photo.value.url);
      photo.value = null;
      selected.value = emptySelection();
      clientMeasures.value = emptyMeasures();
      resultUrl.value = null;
      resultBlob.value = null;
      currentLookId.value = null;
      lookFavorited.value = false;
      step.value = 'catalog';
      showToast('Sessão encerrada');
    }

    function piecesReady() {
      return pieces.value.length > 0;
    }

    function canGoTo(target) {
      if (target === 'catalog' || LIBRARY_STEPS.has(target)) return true;
      if (target === 'workspace') return piecesReady() || Boolean(resultUrl.value);
      if (target === 'upload') return piecesReady();
      if (target === 'generate') {
        return piecesReady() && Boolean(photo.value?.url);
      }
      if (target === 'result') return Boolean(resultUrl.value);
      return false;
    }

    function navigate(target) {
      if (generating.value) return;
      if (target === step.value) return;
      if (!canGoTo(target)) {
        const hints = {
          upload: 'Selecione as peças do look.',
          workspace: 'Selecione as peças do look.',
          generate: 'Monte o look e envie a foto da cliente.',
          result: 'Gere o provador virtual primeiro.',
        };
        showToast(hints[target] || 'Etapa ainda não disponível.');
        return;
      }
      if (LIBRARY_STEPS.has(target) && !LIBRARY_STEPS.has(step.value)) {
        previousStep.value = step.value;
      }
      step.value = target;
    }

    function backFromLibrary() {
      const fallback = previousStep.value && !LIBRARY_STEPS.has(previousStep.value)
        ? previousStep.value
        : (resultUrl.value || piecesReady()
          ? (isWorkspace.value ? 'workspace' : (resultUrl.value ? 'result' : 'catalog'))
          : 'catalog');
      step.value = canGoTo(fallback) ? fallback : 'catalog';
    }

    async function dataUrlToBlob(dataUrl) {
      const res = await fetch(dataUrl);
      return res.blob();
    }

    async function openLook(look) {
      if (!look?.resultUrl) return;

      const nextSelected = emptySelection();
      (look.pieces || []).forEach((piece) => {
        if (piece?.category && nextSelected[piece.category] !== undefined) {
          nextSelected[piece.category] = { ...piece };
        }
      });

      selected.value = nextSelected;
      resultUrl.value = look.resultUrl;
      currentLookId.value = look.id;
      lookFavorited.value = isFavorite(look.id);
      copiedImage.value = false;
      savedImage.value = false;
      copiedRefId.value = null;

      try {
        resultBlob.value = await dataUrlToBlob(look.resultUrl);
      } catch {
        resultBlob.value = null;
      }

      step.value = isWorkspace.value ? 'workspace' : 'result';
      showToast('Look aberto', 'success');
    }

    function continueFromCatalog() {
      if (isWorkspace.value) {
        step.value = 'workspace';
        return;
      }
      step.value = photo.value?.url ? 'generate' : 'upload';
    }

    function toggleLayout() {
      const next = isWorkspace.value ? 'classic' : 'workspace';
      layoutMode.value = next;
      sessionStorage.setItem(LAYOUT_KEY, next);

      if (next === 'workspace') {
        if (['upload', 'generate', 'result'].includes(step.value)) {
          step.value = piecesReady() ? 'workspace' : 'catalog';
        }
        showToast('Modo tela unificada', 'success');
      } else {
        if (step.value === 'workspace') {
          if (resultUrl.value) step.value = 'result';
          else if (photo.value?.url) step.value = 'generate';
          else step.value = piecesReady() ? 'upload' : 'catalog';
        }
        showToast('Modo em etapas', 'success');
      }
    }

    function togglePiece(item) {
      const current = selected.value[item.category];
      if (current?.id === item.id) {
        selected.value = { ...selected.value, [item.category]: null };
      } else {
        selected.value = {
          ...selected.value,
          [item.category]: { ...item },
        };
      }
    }

    function removePiece(category) {
      selected.value = { ...selected.value, [category]: null };
    }

    function clearFeedbackTimers() {
      feedbackTimers.forEach(clearTimeout);
      feedbackTimers = [];
    }

    async function runGeneration() {
      if (
        !photo.value?.url
        || !piecesReady()
        || generating.value
      ) {
        return;
      }

      generating.value = true;
      progressMsg.value = PROGRESS_MESSAGES[0];
      let msgIndex = 0;

      progressTimer = setInterval(() => {
        msgIndex = Math.min(msgIndex + 1, PROGRESS_MESSAGES.length - 1);
        progressMsg.value = PROGRESS_MESSAGES[msgIndex];
      }, 900);

      const minWait = new Promise((r) => setTimeout(r, 2800));

      try {
        const [composed] = await Promise.all([
          composeTryOn(photo.value.url, pieces.value),
          minWait,
        ]);
        resultUrl.value = composed.dataUrl;
        resultBlob.value = composed.blob;
        const look = createLookRecord({
          resultUrl: composed.dataUrl,
          pieces: pieces.value,
        });
        currentLookId.value = look.id;
        historyLooks.value = addToHistory(look);
        copiedImage.value = false;
        savedImage.value = false;
        lookFavorited.value = false;
        copiedRefId.value = null;
        if (!isWorkspace.value) {
          step.value = 'result';
        }
      } catch (err) {
        console.error(err);
        showToast('Não foi possível gerar o look. Tente novamente.');
      } finally {
        clearInterval(progressTimer);
        progressTimer = null;
        generating.value = false;
      }
    }

    async function onCopyImage() {
      try {
        if (!resultBlob.value) throw new Error('Sem imagem');
        await copyImageBlob(resultBlob.value);
        copiedImage.value = true;
        showToast('Imagem copiada — cole no Omnichat', 'success');
        clearFeedbackTimers();
        feedbackTimers.push(setTimeout(() => { copiedImage.value = false; }, 2000));
      } catch (err) {
        console.error(err);
        showToast('Falha ao copiar imagem. Use HTTPS ou permita a área de transferência.');
      }
    }

    function onSaveImage() {
      try {
        if (!resultBlob.value) throw new Error('Sem imagem');
        const url = URL.createObjectURL(resultBlob.value);
        const a = document.createElement('a');
        a.href = url;
        a.download = `provador-dress-to-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        savedImage.value = true;
        showToast('Foto salva nos downloads', 'success');
        clearFeedbackTimers();
        feedbackTimers.push(setTimeout(() => { savedImage.value = false; }, 2000));
      } catch (err) {
        console.error(err);
        showToast('Falha ao salvar a foto.');
      }
    }

    async function onCopyRef(piece) {
      try {
        const text = piece.ref;
        await copyText(text);
        copiedRefId.value = piece.id;
        showToast(`Referência ${piece.ref} copiada`, 'success');
        clearFeedbackTimers();
        feedbackTimers.push(setTimeout(() => { copiedRefId.value = null; }, 2000));
      } catch (err) {
        console.error(err);
        showToast('Falha ao copiar referência');
      }
    }

    function regenerate() {
      if (isWorkspace.value) {
        runGeneration();
        return;
      }
      step.value = 'generate';
      runGeneration();
    }

    function onToggleFavorite() {
      if (!resultUrl.value) return;

      if (!currentLookId.value) {
        const look = createLookRecord({
          resultUrl: resultUrl.value,
          pieces: pieces.value,
        });
        currentLookId.value = look.id;
        historyLooks.value = addToHistory(look);
      }

      const look = {
        id: currentLookId.value,
        createdAt: Date.now(),
        resultUrl: resultUrl.value,
        pieces: pieces.value.map((p, index) => ({
          id: p.id,
          ref: p.ref,
          name: p.name,
          category: p.category,
          color: p.color,
          price: p.price,
          image: p.image,
          recommendedSize: p.recommendedSize || exampleSizeForIndex(index),
        })),
      };

      if (lookFavorited.value) {
        favoriteLooks.value = removeFavorite(look.id);
        lookFavorited.value = false;
        showToast('Look removido dos favoritos', 'success');
        return;
      }

      favoriteLooks.value = addFavorite(look);
      lookFavorited.value = true;
      showToast('Look favoritado', 'success');
    }

    function onToggleFavoriteFromLibrary(look) {
      if (!look?.id) return;
      if (isFavorite(look.id)) {
        favoriteLooks.value = removeFavorite(look.id);
        if (currentLookId.value === look.id) lookFavorited.value = false;
        showToast('Look removido dos favoritos', 'success');
        return;
      }
      favoriteLooks.value = addFavorite(look);
      if (currentLookId.value === look.id) lookFavorited.value = true;
      showToast('Look favoritado', 'success');
    }

    function onRemoveHistoryLook(look) {
      if (!look?.id) return;
      historyLooks.value = removeFromHistory(look.id);
      showToast('Look removido do histórico');
    }

    function onClearHistory() {
      historyLooks.value = clearHistoryStore();
      showToast('Histórico limpo');
    }

    function restart() {
      if (photo.value?.url) URL.revokeObjectURL(photo.value.url);
      photo.value = null;
      selected.value = emptySelection();
      clientMeasures.value = emptyMeasures();
      resultUrl.value = null;
      resultBlob.value = null;
      currentLookId.value = null;
      copiedImage.value = false;
      savedImage.value = false;
      lookFavorited.value = false;
      copiedRefId.value = null;
      step.value = 'catalog';
      showToast('Novo atendimento iniciado', 'success');
    }

    return {
      authenticated,
      shopper,
      layoutMode,
      showLayoutToggles: SHOW_LAYOUT_TOGGLES,
      step,
      photo,
      selected,
      clientMeasures,
      resultUrl,
      generating,
      progressMsg,
      copiedImage,
      savedImage,
      lookFavorited,
      copiedRefId,
      toast,
      pieces,
      mainInert,
      historyLooks,
      favoriteLooks,
      onLogin,
      logout,
      navigate,
      backFromLibrary,
      continueFromCatalog,
      toggleLayout,
      togglePiece,
      removePiece,
      runGeneration,
      onCopyImage,
      onSaveImage,
      onCopyRef,
      onToggleFavorite,
      onToggleFavoriteFromLibrary,
      onRemoveHistoryLook,
      onClearHistory,
      openLook,
      regenerate,
      restart,
    };
  },
  template: `
    <div class="dt-app" :class="{ 'is-locked': generating }">
      <LoginScreen v-if="!authenticated" @login="onLogin" />

      <template v-else>
        <StepHeader
          :current="step"
          :shopper-name="shopper?.name"
          :layout-mode="layoutMode"
          :show-layout-toggles="showLayoutToggles"
          :favorites-count="favoriteLooks.length"
          :history-count="historyLooks.length"
          @logout="logout"
          @toggle-layout="toggleLayout"
          @navigate="navigate"
        />

        <main
          class="dt-main"
          :class="{ 'dt-main--workspace': layoutMode === 'workspace' && step === 'workspace' }"
          :inert="mainInert || undefined"
          :aria-busy="generating ? 'true' : 'false'"
        >
          <LooksLibraryScreen
            v-if="step === 'favorites'"
            mode="favorites"
            :items="favoriteLooks"
            :favorite-ids="favoriteLooks.map((l) => l.id)"
            @back="backFromLibrary"
            @open="openLook"
            @toggle-favorite="onToggleFavoriteFromLibrary"
          />

          <LooksLibraryScreen
            v-else-if="step === 'history'"
            mode="history"
            :items="historyLooks"
            :favorite-ids="favoriteLooks.map((l) => l.id)"
            @back="backFromLibrary"
            @open="openLook"
            @toggle-favorite="onToggleFavoriteFromLibrary"
            @remove="onRemoveHistoryLook"
            @clear="onClearHistory"
          />

          <CatalogScreen
            v-else-if="step === 'catalog'"
            :selected="selected"
            :has-photo="Boolean(photo?.url)"
            :layout-mode="layoutMode"
            @toggle="togglePiece"
            @remove="removePiece"
            @continue="continueFromCatalog"
          />

          <!-- Modo clássico: etapas separadas -->
          <template v-else-if="layoutMode === 'classic'">
            <PhotoUploadScreen
              v-if="step === 'upload'"
              :photo="photo"
              :measures="clientMeasures"
              @update:photo="photo = $event"
              @update:measures="clientMeasures = $event"
              @back="step = 'catalog'"
              @continue="step = 'generate'"
            />

            <GenerateScreen
              v-else-if="step === 'generate'"
              :photo="photo"
              :selected="selected"
              :generating="generating"
              @back="step = 'upload'"
              @generate="runGeneration"
              @remove="removePiece"
              @edit-catalog="step = 'catalog'"
            />

            <ResultScreen
              v-else-if="step === 'result'"
              :result-url="resultUrl"
              :pieces="pieces"
              :copied-image="copiedImage"
              :copied-ref-id="copiedRefId"
              @copy-image="onCopyImage"
              @copy-ref="onCopyRef"
              @back="step = 'generate'"
              @regenerate="regenerate"
              @restart="restart"
            />
          </template>

          <!-- Modo unificado: foto + gerar + resultado -->
          <WorkspaceScreen
            v-else-if="step === 'workspace'"
            :photo="photo"
            :selected="selected"
            :measures="clientMeasures"
            :result-url="resultUrl"
            :generating="generating"
            :saved-image="savedImage"
            :look-favorited="lookFavorited"
            :copied-image="copiedImage"
            :copied-ref-id="copiedRefId"
            @update:photo="photo = $event"
            @update:measures="clientMeasures = $event"
            @generate="runGeneration"
            @edit-catalog="step = 'catalog'"
            @save-image="onSaveImage"
            @copy-image="onCopyImage"
            @copy-ref="onCopyRef"
            @toggle-favorite="onToggleFavorite"
            @restart="restart"
          />
        </main>

        <LoadingOverlay v-if="generating" :message="progressMsg" />
      </template>
    </div>

    <Teleport to="body">
      <div
        v-if="toast"
        class="dt-toast"
        :class="{ 'dt-toast--success': toast.tone === 'success' }"
        role="status"
        aria-live="polite"
      >
        <span
          v-if="toast.tone === 'success'"
          class="material-symbols-outlined dt-icon dt-icon--sm dt-icon--fill"
          aria-hidden="true"
        >check_circle</span>
        <span>{{ toast.message }}</span>
      </div>
    </Teleport>
  `,
}).mount('#app');
