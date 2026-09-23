import { categoryLabel, formatPrice } from '../js/catalog-data.js';
import { formatLookDate, lookTotal } from '../js/looks-store.js';

const { reactive, ref, computed } = Vue;

export default {
  name: 'LooksLibraryScreen',
  props: {
    mode: { type: String, required: true }, // 'favorites' | 'history'
    items: { type: Array, default: () => [] },
    favoriteIds: { type: Array, default: () => [] },
  },
  emits: ['back', 'open', 'toggle-favorite', 'remove', 'clear'],
  setup(props, { emit }) {
    const loadedImages = reactive({});
    const confirmDialog = ref(null);

    const isFavorites = computed(() => props.mode === 'favorites');
    const favoriteIdSet = computed(() => new Set(props.favoriteIds));

    const title = computed(() =>
      isFavorites.value ? 'Favoritados' : 'Histórico de looks',
    );

    const lead = computed(() =>
      isFavorites.value
        ? 'Looks que você marcou como favoritos neste dispositivo.'
        : 'Provadores virtuais gerados recentemente neste dispositivo.',
    );

    const emptyTitle = computed(() =>
      isFavorites.value ? 'Nenhum look favoritado' : 'Nenhum look gerado ainda',
    );

    const emptyLead = computed(() =>
      isFavorites.value
        ? 'Ao gerar um resultado, use “Favoritar look” para guardar aqui.'
        : 'Gere um provador virtual no atendimento para começar o histórico.',
    );

    function markImageLoaded(src) {
      if (src) loadedImages[src] = true;
    }

    function isImageLoaded(src) {
      return Boolean(src && loadedImages[src]);
    }

    function isLookFavorited(look) {
      return isFavorites.value || favoriteIdSet.value.has(look.id);
    }

    function pieceSummary(look) {
      return (look.pieces || [])
        .map((p) => p.ref)
        .join(' · ');
    }

    function openConfirm(dialog) {
      confirmDialog.value = dialog;
    }

    function closeConfirm() {
      confirmDialog.value = null;
    }

    function requestUnfavorite(look) {
      openConfirm({
        type: 'unfavorite',
        look,
        title: 'Remover dos favoritos?',
        message: 'Este look sai da lista de Favoritados. Você pode favoritar de novo depois.',
        confirmLabel: 'Remover dos favoritos',
      });
    }

    function requestRemove(look) {
      openConfirm({
        type: 'remove',
        look,
        title: 'Excluir do histórico?',
        message: 'Esta ação remove o look do histórico neste dispositivo. Não dá para desfazer.',
        confirmLabel: 'Excluir look',
      });
    }

    function requestClear() {
      openConfirm({
        type: 'clear',
        look: null,
        title: 'Limpar histórico?',
        message: `Todos os ${props.items.length} looks do histórico serão excluídos neste dispositivo. Favoritos permanecem.`,
        confirmLabel: 'Limpar histórico',
      });
    }

    function onFavoriteClick(look) {
      if (isLookFavorited(look)) {
        requestUnfavorite(look);
        return;
      }
      emit('toggle-favorite', look);
    }

    function confirmAction() {
      const dialog = confirmDialog.value;
      if (!dialog) return;

      if (dialog.type === 'unfavorite' && dialog.look) {
        emit('toggle-favorite', dialog.look);
      } else if (dialog.type === 'remove' && dialog.look) {
        emit('remove', dialog.look);
      } else if (dialog.type === 'clear') {
        emit('clear');
      }

      closeConfirm();
    }

    return {
      isFavorites,
      title,
      lead,
      emptyTitle,
      emptyLead,
      confirmDialog,
      categoryLabel,
      formatPrice,
      formatLookDate,
      lookTotal,
      pieceSummary,
      isLookFavorited,
      isImageLoaded,
      markImageLoaded,
      onFavoriteClick,
      requestRemove,
      requestClear,
      closeConfirm,
      confirmAction,
    };
  },
  template: `
    <section class="dt-screen dt-screen--library" :aria-labelledby="mode + '-title'">
      <header class="dt-library-header">
        <button
          type="button"
          class="dt-btn dt-btn--ghost dt-btn--sm dt-library-back"
          @click="$emit('back')"
        >
          <span class="material-symbols-outlined dt-icon dt-icon--sm" aria-hidden="true">arrow_back</span>
          Voltar ao atendimento
        </button>

        <div class="dt-library-intro">
          <div class="dt-library-heading">
            <h1 class="dt-screen-title" :id="mode + '-title'">{{ title }}</h1>
            <p class="dt-screen-lead">{{ lead }}</p>
          </div>

          <button
            v-if="!isFavorites && items.length"
            type="button"
            class="dt-btn dt-btn--ghost dt-btn--sm dt-library-clear"
            @click="requestClear"
          >
            <span class="material-symbols-outlined dt-icon dt-icon--sm" aria-hidden="true">delete_sweep</span>
            Limpar histórico
          </button>
        </div>
      </header>

      <div v-if="!items.length" class="dt-library-empty dt-glass-2" role="status">
        <span
          class="material-symbols-outlined dt-icon dt-library-empty-icon"
          :class="{ 'dt-icon--fill': isFavorites }"
          aria-hidden="true"
        >{{ isFavorites ? 'favorite' : 'history' }}</span>
        <h2>{{ emptyTitle }}</h2>
        <p>{{ emptyLead }}</p>
        <button type="button" class="dt-btn dt-btn--primary" @click="$emit('back')">
          Ir para o atendimento
        </button>
      </div>

      <ul v-else class="dt-library-grid" role="list">
        <li v-for="look in items" :key="look.id" class="dt-library-card dt-glass-2">
          <button
            type="button"
            class="dt-library-media dt-media-skel"
            :class="{ 'is-loaded': isImageLoaded(look.resultUrl) }"
            :aria-label="'Abrir look de ' + formatLookDate(look.createdAt)"
            @click="$emit('open', look)"
          >
            <img
              :src="look.resultUrl"
              alt=""
              @load="markImageLoaded(look.resultUrl)"
              @error="markImageLoaded(look.resultUrl)"
            />
          </button>

          <div class="dt-library-body">
            <div class="dt-library-meta">
              <time :datetime="new Date(look.createdAt).toISOString()">
                {{ formatLookDate(look.createdAt) }}
              </time>
              <span v-if="look.pieces?.length">
                {{ look.pieces.length }} peça{{ look.pieces.length > 1 ? 's' : '' }}
                · {{ formatPrice(lookTotal(look.pieces)) }}
              </span>
            </div>

            <p class="dt-library-refs">{{ pieceSummary(look) || 'Sem referências' }}</p>

            <ul v-if="look.pieces?.length" class="dt-library-thumbs" aria-label="Peças do look">
              <li v-for="piece in look.pieces" :key="piece.id">
                <img :src="piece.image" :alt="piece.name" :title="piece.name" />
              </li>
            </ul>

            <div class="dt-library-actions">
              <button
                type="button"
                class="dt-btn dt-btn--primary dt-btn--sm"
                @click="$emit('open', look)"
              >
                Abrir look
              </button>

              <button
                type="button"
                class="dt-btn dt-btn--ghost dt-btn--sm"
                :class="{ 'is-favorited': isLookFavorited(look) }"
                :aria-pressed="isLookFavorited(look) ? 'true' : 'false'"
                :aria-label="isLookFavorited(look) ? 'Remover dos favoritos' : 'Favoritar look'"
                @click="onFavoriteClick(look)"
              >
                <span
                  class="material-symbols-outlined dt-icon dt-icon--sm"
                  :class="{ 'dt-icon--fill': isLookFavorited(look) }"
                  aria-hidden="true"
                >{{ isLookFavorited(look) ? 'favorite' : 'favorite_border' }}</span>
                {{ isLookFavorited(look) ? 'Remover' : 'Favoritar' }}
              </button>

              <button
                v-if="!isFavorites"
                type="button"
                class="dt-btn dt-btn--ghost dt-btn--sm dt-library-delete"
                aria-label="Remover do histórico"
                @click="requestRemove(look)"
              >
                <span class="material-symbols-outlined dt-icon dt-icon--sm" aria-hidden="true">delete</span>
              </button>
            </div>
          </div>
        </li>
      </ul>

      <Teleport to="body">
        <div
          v-if="confirmDialog"
          class="dt-confirm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dt-confirm-title"
          @click.self="closeConfirm"
        >
          <div class="dt-confirm-panel">
            <div class="dt-confirm-icon" aria-hidden="true">
              <span class="material-symbols-outlined dt-icon">{{ confirmDialog.type === 'unfavorite' ? 'heart_minus' : 'delete' }}</span>
            </div>
            <h2 id="dt-confirm-title">{{ confirmDialog.title }}</h2>
            <p>{{ confirmDialog.message }}</p>
            <div class="dt-confirm-actions">
              <button type="button" class="dt-btn dt-btn--ghost" @click="closeConfirm">
                Cancelar
              </button>
              <button type="button" class="dt-btn dt-btn--danger" @click="confirmAction">
                {{ confirmDialog.confirmLabel }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </section>
  `,
};
