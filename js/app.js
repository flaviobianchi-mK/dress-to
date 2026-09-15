import StepHeader from '../components/StepHeader.js';
import LoginScreen from '../components/LoginScreen.js';
import PhotoUploadScreen from '../components/PhotoUploadScreen.js';
import CatalogScreen from '../components/CatalogScreen.js';
import GenerateScreen from '../components/GenerateScreen.js';
import ResultScreen from '../components/ResultScreen.js';
import WorkspaceScreen from '../components/WorkspaceScreen.js';
import LoadingOverlay from '../components/LoadingOverlay.js';
import { CATEGORIES, pieceIsSized } from './catalog-data.js';
import { copyText, copyImageBlob, composeTryOn } from './clipboard.js';

const { createApp, ref, computed, watch, nextTick } = Vue;

const AUTH_KEY = 'dt-shopper-auth';
const LAYOUT_KEY = 'dt-layout-mode';
const LOOK_PLACEMENT_KEY = 'dt-look-placement';

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

function readLookPlacement() {
  const saved = sessionStorage.getItem(LOOK_PLACEMENT_KEY);
  return saved === 'inline' ? 'inline' : 'floating';
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
    LoadingOverlay,
  },
  setup() {
    const shopper = ref(readAuth());
    const authenticated = computed(() => Boolean(shopper.value));
    const layoutMode = ref(SHOW_LAYOUT_TOGGLES ? readLayoutMode() : 'workspace');
    const lookPlacement = ref(SHOW_LAYOUT_TOGGLES ? readLookPlacement() : 'floating');

    const step = ref('catalog');
    const photo = ref(null);
    const selected = ref(emptySelection());
    const resultUrl = ref(null);
    const resultBlob = ref(null);
    const generating = ref(false);
    const progressMsg = ref(PROGRESS_MESSAGES[0]);
    const copiedImage = ref(false);
    const savedImage = ref(false);
    const lookFavorited = ref(false);
    const copiedRefId = ref(null);
    const copiedAllRefs = ref(false);
    const toast = ref(null);

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
      resultUrl.value = null;
      resultBlob.value = null;
      step.value = 'catalog';
      showToast('Sessão encerrada');
    }

    function piecesReady() {
      return (
        pieces.value.length > 0 &&
        pieces.value.every((p) => pieceIsSized(p))
      );
    }

    function canGoTo(target) {
      if (target === 'catalog') return true;
      if (target === 'workspace') return piecesReady();
      if (target === 'upload') return piecesReady();
      if (target === 'generate') return piecesReady() && Boolean(photo.value?.url);
      if (target === 'result') return Boolean(resultUrl.value);
      return false;
    }

    function navigate(target) {
      if (generating.value) return;
      if (target === step.value) return;
      if (!canGoTo(target)) {
        const hints = {
          upload: 'Selecione as peças e o tamanho de cada uma.',
          workspace: 'Selecione as peças e o tamanho de cada uma.',
          generate: 'Monte o look (com tamanhos) e envie a foto da cliente.',
          result: 'Gere o provador virtual primeiro.',
        };
        showToast(hints[target] || 'Etapa ainda não disponível.');
        return;
      }
      step.value = target;
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

    function toggleLookPlacement() {
      const next = lookPlacement.value === 'floating' ? 'inline' : 'floating';
      lookPlacement.value = next;
      sessionStorage.setItem(LOOK_PLACEMENT_KEY, next);
      showToast(
        next === 'floating' ? 'Look flutuante (teste)' : 'Look no topo',
        'success',
      );
    }

    function togglePiece(item) {
      const current = selected.value[item.category];
      if (current?.id === item.id) {
        selected.value = { ...selected.value, [item.category]: null };
      } else {
        selected.value = {
          ...selected.value,
          [item.category]: { ...item, size: null },
        };
      }
    }

    function setPieceSize(payload) {
      const { category, size } = payload;
      const current = selected.value[category];
      if (!current) return;
      selected.value = {
        ...selected.value,
        [category]: { ...current, size },
      };
    }

    function removePiece(category) {
      selected.value = { ...selected.value, [category]: null };
    }

    function clearFeedbackTimers() {
      feedbackTimers.forEach(clearTimeout);
      feedbackTimers = [];
    }

    async function runGeneration() {
      if (!photo.value?.url || !piecesReady() || generating.value) return;

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
        copiedImage.value = false;
        savedImage.value = false;
        lookFavorited.value = false;
        copiedRefId.value = null;
        copiedAllRefs.value = false;
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

    async function onSendWhatsApp() {
      try {
        if (!resultBlob.value) throw new Error('Sem imagem');

        const refs = pieces.value
          .map((p) => (p.size ? `${p.ref} · Tam. ${p.size}` : p.ref))
          .join('\n');
        const message = [
          'Olá! Segue o provador virtual Dress To 👗',
          refs ? `\nReferências:\n${refs}` : '',
          '\n(Anexe a imagem do provador que acabou de ser baixada.)',
        ].join('');

        // Baixa a imagem para anexar no WhatsApp
        const url = URL.createObjectURL(resultBlob.value);
        const a = document.createElement('a');
        a.href = url;
        a.download = `provador-dress-to-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        if (refs) {
          try {
            await copyText(refs);
          } catch {
            /* texto ainda vai no wa.me */
          }
        }

        window.open(
          `https://wa.me/?text=${encodeURIComponent(message)}`,
          '_blank',
          'noopener,noreferrer',
        );
        showToast('WhatsApp aberto — anexe a imagem baixada', 'success');
      } catch (err) {
        console.error(err);
        showToast('Não foi possível preparar o envio no WhatsApp.');
      }
    }

    async function onCopyRef(piece) {
      try {
        const text = piece.size ? `${piece.ref} · Tam. ${piece.size}` : piece.ref;
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

    async function onCopyAllRefs() {
      try {
        const text = pieces.value
          .map((p) => (p.size ? `${p.ref} · Tam. ${p.size}` : p.ref))
          .join('\n');
        if (!text) throw new Error('Sem referências');
        await copyText(text);
        copiedAllRefs.value = true;
        showToast('Todas as referências copiadas', 'success');
        clearFeedbackTimers();
        feedbackTimers.push(setTimeout(() => { copiedAllRefs.value = false; }, 2000));
      } catch (err) {
        console.error(err);
        showToast('Falha ao copiar referências');
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
      lookFavorited.value = !lookFavorited.value;
      showToast(
        lookFavorited.value ? 'Look favoritado' : 'Look removido dos favoritos',
        'success',
      );
    }

    function restart() {
      if (photo.value?.url) URL.revokeObjectURL(photo.value.url);
      photo.value = null;
      selected.value = emptySelection();
      resultUrl.value = null;
      resultBlob.value = null;
      copiedImage.value = false;
      savedImage.value = false;
      lookFavorited.value = false;
      copiedRefId.value = null;
      copiedAllRefs.value = false;
      step.value = 'catalog';
      showToast('Novo atendimento iniciado', 'success');
    }

    return {
      authenticated,
      shopper,
      layoutMode,
      lookPlacement,
      showLayoutToggles: SHOW_LAYOUT_TOGGLES,
      step,
      photo,
      selected,
      resultUrl,
      generating,
      progressMsg,
      copiedImage,
      savedImage,
      lookFavorited,
      copiedRefId,
      copiedAllRefs,
      toast,
      pieces,
      mainInert,
      onLogin,
      logout,
      navigate,
      continueFromCatalog,
      toggleLayout,
      toggleLookPlacement,
      togglePiece,
      setPieceSize,
      removePiece,
      runGeneration,
      onCopyImage,
      onSaveImage,
      onSendWhatsApp,
      onCopyRef,
      onCopyAllRefs,
      onToggleFavorite,
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
          :look-placement="lookPlacement"
          :show-layout-toggles="showLayoutToggles"
          @logout="logout"
          @toggle-layout="toggleLayout"
          @toggle-look-placement="toggleLookPlacement"
        />

        <main
          class="dt-main"
          :class="{ 'dt-main--workspace': layoutMode === 'workspace' && step === 'workspace' }"
          :inert="mainInert || undefined"
          :aria-busy="generating ? 'true' : 'false'"
        >
          <CatalogScreen
            v-if="step === 'catalog'"
            :selected="selected"
            :has-photo="Boolean(photo?.url)"
            :layout-mode="layoutMode"
            @toggle="togglePiece"
            @set-size="setPieceSize"
            @remove="removePiece"
            @continue="continueFromCatalog"
          />

          <!-- Modo clássico: etapas separadas -->
          <template v-if="layoutMode === 'classic'">
            <PhotoUploadScreen
              v-if="step === 'upload'"
              :photo="photo"
              @update:photo="photo = $event"
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
              @set-size="setPieceSize"
              @remove="removePiece"
              @edit-catalog="step = 'catalog'"
            />

            <ResultScreen
              v-else-if="step === 'result'"
              :result-url="resultUrl"
              :pieces="pieces"
              :copied-image="copiedImage"
              :copied-ref-id="copiedRefId"
              :copied-all-refs="copiedAllRefs"
              @copy-image="onCopyImage"
              @copy-ref="onCopyRef"
              @copy-all-refs="onCopyAllRefs"
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
            :result-url="resultUrl"
            :generating="generating"
            :saved-image="savedImage"
            :look-favorited="lookFavorited"
            :copied-ref-id="copiedRefId"
            :copied-all-refs="copiedAllRefs"
            :look-placement="lookPlacement"
            @update:photo="photo = $event"
            @generate="runGeneration"
            @edit-catalog="step = 'catalog'"
            @save-image="onSaveImage"
            @send-whatsapp="onSendWhatsApp"
            @copy-ref="onCopyRef"
            @copy-all-refs="onCopyAllRefs"
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
