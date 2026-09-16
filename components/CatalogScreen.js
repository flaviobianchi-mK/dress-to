import {
  CATALOG,
  CATEGORIES,
  FILTER_MENU,
  VESTIDO_FILTERS,
  FILTER_KEYWORDS,
  categoryLabel,
  colorLabel,
  formatPrice,
} from '../js/catalog-data.js';

const { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } = Vue;

const BROWSE_MODE_KEY = 'dt-catalog-browse-mode';

function readBrowseMode() {
  try {
    sessionStorage.setItem(BROWSE_MODE_KEY, 'search');
  } catch {
    /* ignore */
  }
  return 'search';
}

function parseSearchTokens(raw) {
  const text = String(raw || '').trim();
  if (!text) return [];

  const parts = text
    .split(/[,;\n|]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length > 1) return parts;

  const single = parts[0] || text;
  if (/[.\-_\/]/.test(single) && /\s+/.test(single)) {
    return single.split(/\s+/).map((part) => part.trim()).filter(Boolean);
  }
  return [single];
}

export default {
  name: 'CatalogScreen',
  props: {
    selected: { type: Object, required: true },
    hasPhoto: { type: Boolean, default: false },
    layoutMode: { type: String, default: 'workspace' },
  },
  emits: ['toggle', 'remove', 'continue'],
  setup(props, { emit }) {
    const query = ref('');
    const filtersOpen = ref(false);
    const activeTypes = ref([]);
    const activeVestidos = ref([]);
    const viewMode = ref('grid');
    const browseMode = ref(readBrowseMode());
    const expandedSections = ref({});
    const catalogLoading = ref(true);
    const loadedImages = reactive({});
    const searchInputRef = ref(null);

    const GRID_PAGE_SIZE = 6;
    const LIST_PAGE_SIZE = 8;
    const SECTION_ORDER = ['cima', 'baixo', 'acessorio'];
    const SKELETON_SECTIONS = [
      { id: 'cima', cards: 6 },
      { id: 'baixo', cards: 6 },
      { id: 'acessorio', cards: 6 },
    ];

    const isSearchMode = computed(() => browseMode.value === 'search');

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

    const selectedList = computed(() =>
      CATEGORIES.map((c) => props.selected[c.id]).filter(Boolean),
    );

    const canContinue = computed(() => selectedList.value.length > 0);

    const continueLabel = computed(() => 'Continuar');

    const continueHint = computed(() => {
      if (!selectedList.value.length) return 'Selecione ao menos uma peça';
      return '';
    });

    const lookTotal = computed(() =>
      selectedList.value.reduce((sum, p) => sum + (p.price || 0), 0),
    );

    const activeFilterCount = computed(
      () => activeTypes.value.length + activeVestidos.value.length,
    );

    const activeFilterChips = computed(() => [
      ...activeTypes.value.map((label) => ({ group: 'type', label })),
      ...activeVestidos.value.map((label) => ({ group: 'vestido', label })),
    ]);

    const showVestidoPanel = computed(
      () =>
        activeTypes.value.includes('Vestidos') ||
        activeVestidos.value.length > 0,
    );

    const searchTokens = computed(() => parseSearchTokens(query.value));
    const isMultiSkuQuery = computed(() => searchTokens.value.length > 1);

    function toggleInList(listRef, value) {
      const list = listRef.value;
      const idx = list.indexOf(value);
      if (idx >= 0) list.splice(idx, 1);
      else list.push(value);
    }

    function isTypeActive(label) {
      return activeTypes.value.includes(label);
    }

    function isVestidoActive(label) {
      return activeVestidos.value.includes(label);
    }

    function matchesKeywords(item, label) {
      if (!label || label === 'Ver Tudo') return true;
      const keys = FILTER_KEYWORDS[label];
      if (!keys || !keys.length) return true;
      const hay = `${item.name} ${item.ref}`.toLowerCase();
      return keys.some((k) => hay.includes(k));
    }

    function matchesAny(item, labels) {
      if (!labels.length) return true;
      return labels.some((label) => matchesKeywords(item, label));
    }

    function matchesToken(item, token) {
      const t = token.toLowerCase();
      const ref = String(item.ref || '').toLowerCase();
      const name = String(item.name || '').toLowerCase();
      const id = String(item.id || '').toLowerCase();
      return ref === t || ref.includes(t) || name.includes(t) || id === t;
    }

    const filtered = computed(() => {
      const types = activeTypes.value.filter((t) => t !== 'Ver Tudo');
      const tokens = searchTokens.value;
      const hasFilterOnly =
        isSearchMode.value &&
        !tokens.length &&
        (types.length > 0 || activeVestidos.value.length > 0);

      return CATALOG.filter((item) => {
        if (!matchesAny(item, types)) return false;
        if (!matchesAny(item, activeVestidos.value)) return false;
        if (!tokens.length) {
          if (isSearchMode.value) return hasFilterOnly;
          return true;
        }
        if (tokens.length === 1) return matchesToken(item, tokens[0]);
        return tokens.some((token) => matchesToken(item, token));
      });
    });

    const multiSkuMatches = computed(() => {
      if (!isMultiSkuQuery.value) return [];
      const seen = new Set();
      const matches = [];
      searchTokens.value.forEach((token) => {
        const hit = CATALOG.find((item) => {
          if (seen.has(item.id)) return false;
          return matchesToken(item, token);
        });
        if (hit && matchesAny(hit, activeTypes.value.filter((t) => t !== 'Ver Tudo'))
          && matchesAny(hit, activeVestidos.value)) {
          seen.add(hit.id);
          matches.push({ token, item: hit });
        }
      });
      return matches;
    });

    const addableSearchResults = computed(() => {
      if (isMultiSkuQuery.value) {
        return multiSkuMatches.value.map((entry) => entry.item);
      }
      return filtered.value;
    });

    function isSelected(item) {
      return props.selected[item.category]?.id === item.id;
    }

    /** Selected (in look) SKUs first so they stay visible at the top */
    const visibleSearchResults = computed(() => {
      const items = [...addableSearchResults.value];
      return items.sort((a, b) => Number(isSelected(b)) - Number(isSelected(a)));
    });

    const allAddableInLook = computed(() => {
      const items = addableSearchResults.value;
      return items.length > 0 && items.every((item) => isSelected(item));
    });

    const searchResultsInLook = computed(() =>
      addableSearchResults.value.filter((item) => isSelected(item)),
    );

    const grouped = computed(() =>
      CATEGORIES
        .map((cat) => ({
          ...cat,
          items: filtered.value.filter((item) => item.category === cat.id),
        }))
        .filter((group) => group.items.length > 0),
    );

    const pageSize = computed(() =>
      viewMode.value === 'list' ? LIST_PAGE_SIZE : GRID_PAGE_SIZE,
    );

    const searchHasIntent = computed(
      () => Boolean(query.value.trim()) || activeFilterCount.value > 0,
    );

    function isSectionExpanded(groupId) {
      return Boolean(expandedSections.value[groupId]);
    }

    function visibleItems(group) {
      const items = group.items;
      if (isSectionExpanded(group.id)) return items;
      const limit = pageSize.value;
      const selectedIdx = items.findIndex((item) => isSelected(item));
      if (selectedIdx >= limit) return items.slice(0, selectedIdx + 1);
      return items.slice(0, limit);
    }

    function canShowMore(group) {
      return group.items.length > visibleItems(group).length;
    }

    function showMore(groupId) {
      expandedSections.value = {
        ...expandedSections.value,
        [groupId]: true,
      };
    }

    function isBlocked(item) {
      const current = props.selected[item.category];
      return Boolean(current && current.id !== item.id);
    }

    function toggleFilters() {
      filtersOpen.value = !filtersOpen.value;
    }

    function onFilterOutsidePointerDown(event) {
      if (!filtersOpen.value) return;
      if (event.target.closest?.('.dt-catalog__dock, .dt-lookbar__search')) return;
      filtersOpen.value = false;
    }

    function bindFilterOutsideClose() {
      document.addEventListener('pointerdown', onFilterOutsidePointerDown, true);
    }

    function unbindFilterOutsideClose() {
      document.removeEventListener(
        'pointerdown',
        onFilterOutsidePointerDown,
        true,
      );
    }

    watch(filtersOpen, (open) => {
      unbindFilterOutsideClose();
      if (open) nextTick(bindFilterOutsideClose);
    });

    function selectType(label) {
      if (label === 'Ver Tudo') {
        activeTypes.value = [];
        activeVestidos.value = [];
        return;
      }
      toggleInList(activeTypes, label);
    }

    function selectVestido(label) {
      toggleInList(activeVestidos, label);
      if (activeVestidos.value.length && !activeTypes.value.includes('Vestidos')) {
        activeTypes.value.push('Vestidos');
      }
    }

    function removeChip(chip) {
      if (chip.group === 'type') selectType(chip.label);
      else if (chip.group === 'vestido') selectVestido(chip.label);
    }

    function clearFilters() {
      activeTypes.value = [];
      activeVestidos.value = [];
    }

    function setViewMode(mode) {
      if (mode !== 'grid' && mode !== 'list') return;
      viewMode.value = mode;
    }

    function onTogglePiece(item) {
      const wasSelected = isSelected(item);
      emit('toggle', item);
      if (!wasSelected) maybeAdvanceSection(item.category);
    }

    function scrollToSection(sectionId) {
      nextTick(() => {
        const target = document.getElementById('section-' + sectionId);
        if (!target) return;
        const rect = target.getBoundingClientRect();
        const alreadyVisible =
          rect.top >= 0 && rect.top < window.innerHeight * 0.4;
        if (alreadyVisible) return;
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    function maybeAdvanceSection(category) {
      if (isSearchMode.value) return;
      const idx = SECTION_ORDER.indexOf(category);
      if (idx < 0 || idx >= SECTION_ORDER.length - 1) return;
      const nextId = SECTION_ORDER[idx + 1];
      if (!grouped.value.some((g) => g.id === nextId)) return;
      scrollToSection(nextId);
    }

    function addPiece(item) {
      if (!item) return;
      if (!isSelected(item)) {
        emit('toggle', item);
        maybeAdvanceSection(item.category);
      }
    }

    function onSearchEnter(event) {
      if (!isSearchMode.value) return;
      event.preventDefault();
      const first = addableSearchResults.value[0] || filtered.value[0];
      if (first) addPiece(first);
    }

    function clearQuery() {
      query.value = '';
      nextTick(() => searchInputRef.value?.focus?.());
    }

    onMounted(async () => {
      await new Promise((r) => setTimeout(r, 550));
      catalogLoading.value = false;
      await nextTick();
      if (isSearchMode.value) searchInputRef.value?.focus?.();
    });

    onBeforeUnmount(() => {
      unbindFilterOutsideClose();
    });

    return {
      CATEGORIES,
      FILTER_MENU,
      VESTIDO_FILTERS,
      query,
      filtersOpen,
      activeFilterCount,
      activeFilterChips,
      showVestidoPanel,
      selectedList,
      canContinue,
      continueLabel,
      continueHint,
      lookTotal,
      grouped,
      filtered,
      viewMode,
      browseMode,
      isSearchMode,
      catalogLoading,
      SKELETON_SECTIONS,
      searchInputRef,
      searchTokens,
      isMultiSkuQuery,
      multiSkuMatches,
      addableSearchResults,
      visibleSearchResults,
      allAddableInLook,
      searchResultsInLook,
      searchHasIntent,
      categoryLabel,
      colorLabel,
      formatPrice,
      isSelected,
      isBlocked,
      isTypeActive,
      isVestidoActive,
      isImageLoaded,
      markImageLoaded,
      bindImageEl,
      visibleItems,
      canShowMore,
      showMore,
      toggleFilters,
      selectType,
      selectVestido,
      removeChip,
      clearFilters,
      setViewMode,
      onTogglePiece,
      addPiece,
      onSearchEnter,
      clearQuery,
    };
  },
  template: `
    <section
      class="dt-screen dt-screen--catalog"
      :class="{ 'dt-screen--catalog-search': isSearchMode }"
      aria-labelledby="catalog-title"
    >
      <div
        v-if="!isSearchMode"
        class="dt-catalog-top"
      >
        <div class="dt-catalog-top__copy">
          <h1 class="dt-screen__title" id="catalog-title">Montar o look</h1>
          <p class="dt-screen__lead">
            Escolha as peças do catálogo Dress To. Uma peça por categoria
            (cima, baixo, acessório).
          </p>
        </div>
      </div>

      <!-- ——— Modo catálogo (atual) ——— -->
      <div v-if="!isSearchMode" class="dt-catalog">
        <div>
          <div
            v-if="catalogLoading"
            class="dt-catalog-skel"
            aria-busy="true"
            aria-label="Carregando catálogo"
          >
            <div
              v-for="section in SKELETON_SECTIONS"
              :key="'skel-' + section.id"
              class="dt-catalog-skel__section"
            >
              <div class="dt-catalog-skel__head">
                <span class="dt-skel dt-skel--title" aria-hidden="true"></span>
                <span class="dt-catalog-skel__rule" aria-hidden="true"></span>
                <span class="dt-skel dt-skel--text-sm" style="width:24px" aria-hidden="true"></span>
              </div>
              <div class="dt-grid" :class="{ 'dt-grid--list': viewMode === 'list' }">
                <div
                  v-for="n in section.cards"
                  :key="'skel-card-' + section.id + '-' + n"
                  class="dt-skel-card"
                  :class="{ 'dt-skel-card--list': viewMode === 'list' }"
                >
                  <div class="dt-skel-card__media">
                    <span class="dt-skel dt-skel--media" aria-hidden="true"></span>
                  </div>
                  <div class="dt-skel-card__body">
                    <span class="dt-skel dt-skel--text-sm" aria-hidden="true"></span>
                    <span class="dt-skel dt-skel--text" aria-hidden="true"></span>
                    <span class="dt-skel dt-skel--text-sm" style="width:36%" aria-hidden="true"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="grouped.length" class="dt-sections">
            <section
              v-for="group in grouped"
              :key="group.id"
              :id="'section-' + group.id"
              class="dt-section"
              :aria-labelledby="'sec-' + group.id"
            >
              <div class="dt-section__head">
                <h2 class="dt-section__title" :id="'sec-' + group.id">{{ group.label }}</h2>
                <div class="dt-section__rule" aria-hidden="true"></div>
                <span class="dt-section__count">{{ group.items.length }}</span>
              </div>

              <div class="dt-grid" :class="{ 'dt-grid--list': viewMode === 'list' }">
                <div
                  v-for="item in visibleItems(group)"
                  :key="item.id"
                  class="dt-card-wrap"
                  :data-item-id="item.id"
                  :class="{
                    'is-selected': isSelected(item),
                    'is-blocked': isBlocked(item) && !isSelected(item),
                    'dt-card-wrap--list': viewMode === 'list',
                  }"
                >
                  <button
                    type="button"
                    class="dt-card"
                    :class="{
                      'is-selected': isSelected(item),
                      'is-blocked': isBlocked(item) && !isSelected(item),
                      'dt-card--list': viewMode === 'list',
                    }"
                    :aria-pressed="isSelected(item)"
                    :title="isBlocked(item) && !isSelected(item)
                      ? 'Já há uma peça nesta categoria — clique para substituir'
                      : item.name"
                    @click="onTogglePiece(item)"
                  >
                    <div
                      class="dt-card__media dt-media-skel"
                      :class="{ 'is-loaded': isImageLoaded(item.image) }"
                    >
                      <img
                        :src="item.image"
                        :alt="item.name"
                        loading="lazy"
                        :ref="(el) => bindImageEl(el, item.image)"
                        @load="markImageLoaded(item.image)"
                        @error="markImageLoaded(item.image)"
                      />
                      <span class="dt-card__check" aria-hidden="true">
                        <span class="material-symbols-outlined dt-icon dt-icon--sm dt-icon--fill">check</span>
                      </span>
                    </div>
                    <div class="dt-card__body">
                      <div class="dt-card__ref">{{ item.ref }}</div>
                      <div class="dt-card__name">{{ item.name }}</div>
                      <div class="dt-card__meta">{{ colorLabel(item.color) }}</div>
                      <div class="dt-card__price">{{ formatPrice(item.price) }}</div>
                    </div>
                  </button>
                </div>
              </div>

              <div v-if="canShowMore(group)" class="dt-section__more">
                <button
                  type="button"
                  class="dt-btn dt-btn--ghost dt-section__more-btn"
                  @click="showMore(group.id)"
                >
                  Ver mais
                  <span class="dt-section__more-count">
                    +{{ group.items.length - visibleItems(group).length }}
                  </span>
                </button>
              </div>
            </section>
          </div>

          <p v-else class="dt-empty" style="margin-top:24px">
            Nenhuma peça encontrada para essa busca.
          </p>
        </div>

        <aside class="dt-lookbar dt-glass-2" aria-label="Look selecionado">
          <div class="dt-lookbar__head">
            <div class="dt-lookbar__title">Look montado</div>
          </div>

          <ul class="dt-lookbar__list">
            <li v-if="!selectedList.length" class="dt-lookbar__empty">
              Selecione peças no catálogo para montar o look.
            </li>
            <li
              v-for="piece in selectedList"
              :key="piece.id"
              class="dt-look-item"
            >
              <div
                class="dt-media-skel dt-look-item__thumb"
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
              <div class="dt-look-item__body">
                <span class="dt-look-item__cat">{{ categoryLabel(piece.category) }}</span>
                <div class="dt-look-item__name">{{ piece.name }}</div>
                <div class="dt-card__price">{{ formatPrice(piece.price) }}</div>
              </div>
              <button
                type="button"
                class="dt-look-item__remove"
                :aria-label="'Remover ' + piece.name"
                @click="$emit('remove', piece.category)"
              >
                <span class="material-symbols-outlined dt-icon" aria-hidden="true">close</span>
              </button>
            </li>
          </ul>

          <div v-if="selectedList.length" class="dt-lookbar__total">
            Total · {{ formatPrice(lookTotal) }}
          </div>
        </aside>
      </div>

      <!-- ——— Modo pesquisa ——— -->
      <div
        v-else
        class="dt-catalog-search"
        :class="{ 'has-results': searchHasIntent }"
      >
        <div class="dt-catalog-search__cluster">
          <header class="dt-catalog-search__copy">
            <h1 class="dt-screen__title" id="catalog-title">Montar o look</h1>
            <p class="dt-screen__lead">
              Busque por nome ou referência, adicione ao look e continue pesquisando.
              Dá para colar várias SKUs de uma vez (separadas por vírgula).
            </p>
          </header>

            <aside
            class="dt-lookbar dt-lookbar--stage dt-glass-2"
            :class="{
              'has-pieces': selectedList.length,
              'is-filters-open': filtersOpen,
            }"
            aria-label="Look selecionado"
          >
            <div class="dt-lookbar__head">
              <div class="dt-lookbar__title">Look montado</div>
            </div>

            <ul class="dt-lookbar__list dt-lookbar__list--row">
              <li v-if="!selectedList.length" class="dt-lookbar__empty">
                Seus looks aparecerão aqui.
              </li>
              <li
                v-for="piece in selectedList"
                :key="piece.id"
                class="dt-look-item"
              >
                <div
                  class="dt-media-skel dt-look-item__thumb"
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
                <div class="dt-look-item__body">
                  <span class="dt-look-item__cat">{{ categoryLabel(piece.category) }}</span>
                  <div class="dt-look-item__name">{{ piece.name }}</div>
                  <div class="dt-card__price">{{ formatPrice(piece.price) }}</div>
                </div>
                <button
                  type="button"
                  class="dt-look-item__remove"
                  :aria-label="'Remover ' + piece.name"
                  @click="$emit('remove', piece.category)"
                >
                  <span class="material-symbols-outlined dt-icon" aria-hidden="true">close</span>
                </button>
              </li>
            </ul>

            <div v-if="selectedList.length" class="dt-lookbar__total">
              Total · {{ formatPrice(lookTotal) }}
            </div>

            <div
              class="dt-lookbar__search"
              role="search"
              aria-label="Busca, filtros e continuar"
            >
              <div
                class="dt-filter-collapse"
                :class="{ 'is-open': filtersOpen }"
              >
                <div class="dt-filter-collapse__clip">
                  <div
                    id="dt-filter-panel-search"
                    class="dt-filter-panel dt-filter-panel--dock"
                    role="region"
                    aria-label="Filtros do catálogo Dress To"
                    :aria-hidden="!filtersOpen"
                    :inert="!filtersOpen"
                  >
                    <div class="dt-filter-mega">
                      <div
                        v-for="col in FILTER_MENU"
                        :key="'search-' + col.id"
                        class="dt-filter-mega__col"
                      >
                        <h3 class="dt-filter-mega__heading">{{ col.label }}</h3>
                        <ul class="dt-filter-mega__list">
                          <li v-for="item in col.items" :key="'search-' + item">
                            <button
                              type="button"
                              class="dt-filter-mega__link"
                              :class="{ 'is-active': isTypeActive(item) }"
                              :aria-pressed="isTypeActive(item)"
                              @click="selectType(item)"
                            >{{ item }}</button>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div v-if="showVestidoPanel" class="dt-filter-sub">
                      <div class="dt-filter-mega__col">
                        <h3 class="dt-filter-mega__heading">Vestidos</h3>
                        <ul class="dt-filter-mega__list">
                          <li v-for="item in VESTIDO_FILTERS" :key="'search-v-' + item">
                            <button
                              type="button"
                              class="dt-filter-mega__link"
                              :class="{ 'is-active': isVestidoActive(item) }"
                              :aria-pressed="isVestidoActive(item)"
                              @click="selectVestido(item)"
                            >{{ item }}</button>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div class="dt-filter-panel__footer">
                      <button
                        type="button"
                        class="dt-btn dt-btn--ghost dt-btn--sm"
                        :disabled="!activeFilterCount"
                        @click="clearFilters"
                      >
                        Limpar filtros
                      </button>
                      <button
                        type="button"
                        class="dt-btn dt-btn--primary dt-btn--sm"
                        @click="filtersOpen = false"
                      >
                        Ver resultados
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="activeFilterCount" class="dt-filter-chips dt-filter-chips--dock">
                <button
                  v-for="chip in activeFilterChips"
                  :key="'search-chip-' + chip.group + '-' + chip.label"
                  type="button"
                  class="dt-chip is-active"
                  @click="removeChip(chip)"
                >{{ chip.label }} ×</button>
              </div>

              <div class="dt-lookbar__search-bar">
                <div class="dt-toolbar dt-toolbar--dock">
                  <div class="dt-search">
                    <span class="dt-search__icon" aria-hidden="true">
                      <span class="material-symbols-outlined dt-icon">search</span>
                    </span>
                    <input
                      ref="searchInputRef"
                      v-model="query"
                      type="search"
                      placeholder="SKU, nome ou várias refs (ex: 02.08.3668_0038, 03.07.0384_0087)"
                      aria-label="Buscar peças por nome ou SKU"
                      @keydown.enter="onSearchEnter"
                    />
                    <button
                      v-if="query"
                      type="button"
                      class="dt-search__clear"
                      aria-label="Limpar busca"
                      @click="clearQuery"
                    >
                      <span class="material-symbols-outlined dt-icon dt-icon--sm" aria-hidden="true">close</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    class="dt-btn dt-btn--ghost dt-filter-trigger"
                    :class="{ 'is-open': filtersOpen }"
                    :aria-expanded="filtersOpen"
                    aria-controls="dt-filter-panel-search"
                    @click="toggleFilters"
                  >
                    <span class="material-symbols-outlined dt-icon" aria-hidden="true">tune</span>
                    Filtros
                    <span v-if="activeFilterCount" class="dt-filter-trigger__count">{{ activeFilterCount }}</span>
                  </button>
                </div>

                <div class="dt-catalog__dock-cta">
                  <button
                    type="button"
                    class="dt-btn dt-btn--primary dt-catalog__dock-continue"
                    :disabled="!canContinue"
                    :title="continueHint || continueLabel"
                    @click="$emit('continue')"
                  >
                    <span>{{ continueLabel }}</span>
                    <span
                      class="material-symbols-outlined dt-icon"
                      aria-hidden="true"
                    >arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div
          v-if="searchHasIntent"
          class="dt-catalog-search__results dt-glass-2"
          :class="{ 'is-added': allAddableInLook }"
        >
          <div class="dt-catalog-search__results-head">
            <div>
              <strong v-if="allAddableInLook">
                {{ searchResultsInLook.length }}
                {{ searchResultsInLook.length === 1 ? 'peça no look' : 'peças no look' }}
              </strong>
              <strong v-else-if="isMultiSkuQuery">
                {{ multiSkuMatches.length }} de {{ searchTokens.length }} SKUs encontradas
              </strong>
              <strong v-else>
                {{ filtered.length }} resultado{{ filtered.length === 1 ? '' : 's' }}
              </strong>
            </div>
            <span
              v-if="allAddableInLook"
              class="dt-catalog-search__added-badge"
            >
              <span class="material-symbols-outlined dt-icon dt-icon--sm" aria-hidden="true">check_circle</span>
              Adicionadas
            </span>
          </div>

          <ul v-if="addableSearchResults.length && allAddableInLook" class="dt-catalog-search__list dt-catalog-search__list--compact" role="list">
            <li
              v-for="item in searchResultsInLook"
              :key="'added-' + item.id"
              class="dt-catalog-search__chip"
            >
              <div
                class="dt-media-skel dt-catalog-search__chip-thumb"
                :class="{ 'is-loaded': isImageLoaded(item.image) }"
              >
                <img
                  :src="item.image"
                  :alt="item.name"
                  :ref="(el) => bindImageEl(el, item.image)"
                  @load="markImageLoaded(item.image)"
                  @error="markImageLoaded(item.image)"
                />
              </div>
              <div class="dt-catalog-search__chip-meta">
                <span class="dt-catalog-search__chip-ref">{{ item.ref }}</span>
                <span class="dt-catalog-search__chip-name">{{ item.name }}</span>
              </div>
              <button
                type="button"
                class="dt-catalog-search__chip-remove"
                :aria-label="'Remover ' + item.name + ' do look'"
                @click="$emit('remove', item.category)"
              >
                <span class="material-symbols-outlined dt-icon dt-icon--sm" aria-hidden="true">close</span>
              </button>
            </li>
          </ul>

          <ul v-else-if="addableSearchResults.length" class="dt-catalog-search__list" role="list">
            <li
              v-for="item in visibleSearchResults"
              :key="item.id"
              class="dt-catalog-search__row"
              :class="{ 'is-selected': isSelected(item) }"
            >
              <div
                class="dt-media-skel dt-catalog-search__thumb"
                :class="{ 'is-loaded': isImageLoaded(item.image) }"
              >
                <img
                  :src="item.image"
                  :alt="item.name"
                  :ref="(el) => bindImageEl(el, item.image)"
                  @load="markImageLoaded(item.image)"
                  @error="markImageLoaded(item.image)"
                />
              </div>

              <div class="dt-catalog-search__meta">
                <div class="dt-card__ref">{{ item.ref }}</div>
                <div class="dt-catalog-search__name">{{ item.name }}</div>
                <div class="dt-card__meta">
                  {{ categoryLabel(item.category) }} · {{ colorLabel(item.color) }} · {{ formatPrice(item.price) }}
                </div>
              </div>

              <button
                type="button"
                class="dt-btn dt-btn--sm"
                :class="isSelected(item) ? 'dt-btn--ghost is-favorited' : 'dt-btn--primary'"
                @click="isSelected(item) ? $emit('remove', item.category) : addPiece(item)"
              >
                {{ isSelected(item) ? 'No look' : 'Adicionar' }}
              </button>
            </li>
          </ul>

          <p v-else class="dt-empty">Nenhuma peça encontrada para essa busca.</p>
        </div>
      </div>

      <!-- Dock inferior só no modo catálogo -->
      <Teleport v-if="!isSearchMode" to="body">
        <div
          class="dt-catalog__dock"
          role="search"
          aria-label="Busca, filtros e continuar"
        >
          <div
            v-if="filtersOpen"
            id="dt-filter-panel-dock"
            class="dt-filter-panel dt-filter-panel--dock"
            role="region"
            aria-label="Filtros do catálogo Dress To"
          >
            <div class="dt-filter-mega">
              <div
                v-for="col in FILTER_MENU"
                :key="'dock-' + col.id"
                class="dt-filter-mega__col"
              >
                <h3 class="dt-filter-mega__heading">{{ col.label }}</h3>
                <ul class="dt-filter-mega__list">
                  <li v-for="item in col.items" :key="'dock-' + item">
                    <button
                      type="button"
                      class="dt-filter-mega__link"
                      :class="{ 'is-active': isTypeActive(item) }"
                      :aria-pressed="isTypeActive(item)"
                      @click="selectType(item)"
                    >{{ item }}</button>
                  </li>
                </ul>
              </div>
            </div>

            <div v-if="showVestidoPanel" class="dt-filter-sub">
              <div class="dt-filter-mega__col">
                <h3 class="dt-filter-mega__heading">Vestidos</h3>
                <ul class="dt-filter-mega__list">
                  <li v-for="item in VESTIDO_FILTERS" :key="'dock-v-' + item">
                    <button
                      type="button"
                      class="dt-filter-mega__link"
                      :class="{ 'is-active': isVestidoActive(item) }"
                      :aria-pressed="isVestidoActive(item)"
                      @click="selectVestido(item)"
                    >{{ item }}</button>
                  </li>
                </ul>
              </div>
            </div>

            <div class="dt-filter-panel__footer">
              <button
                type="button"
                class="dt-btn dt-btn--ghost dt-btn--sm"
                :disabled="!activeFilterCount"
                @click="clearFilters"
              >
                Limpar filtros
              </button>
              <button
                type="button"
                class="dt-btn dt-btn--primary dt-btn--sm"
                @click="filtersOpen = false"
              >
                Ver resultados
              </button>
            </div>
          </div>

          <div v-if="activeFilterCount" class="dt-filter-chips dt-filter-chips--dock">
            <button
              v-for="chip in activeFilterChips"
              :key="'dock-' + chip.group + '-' + chip.label"
              type="button"
              class="dt-chip is-active"
              @click="removeChip(chip)"
            >{{ chip.label }} ×</button>
          </div>

          <div class="dt-catalog__dock-bar">
            <div class="dt-toolbar dt-toolbar--dock">
              <div class="dt-search">
                <span class="dt-search__icon" aria-hidden="true">
                  <span class="material-symbols-outlined dt-icon">search</span>
                </span>
                <input
                  v-model="query"
                  type="search"
                  placeholder="Buscar por nome ou referência"
                  aria-label="Buscar peças"
                />
              </div>
              <button
                type="button"
                class="dt-btn dt-btn--ghost dt-filter-trigger"
                :class="{ 'is-open': filtersOpen }"
                :aria-expanded="filtersOpen"
                aria-controls="dt-filter-panel-dock"
                @click="toggleFilters"
              >
                <span class="material-symbols-outlined dt-icon" aria-hidden="true">tune</span>
                Filtros
                <span v-if="activeFilterCount" class="dt-filter-trigger__count">{{ activeFilterCount }}</span>
              </button>
              <div class="dt-view-toggle" role="group" aria-label="Visualização do catálogo">
                <button
                  type="button"
                  class="dt-view-toggle__btn"
                  :class="{ 'is-active': viewMode === 'grid' }"
                  :aria-pressed="viewMode === 'grid'"
                  title="Grade"
                  @click="setViewMode('grid')"
                >
                  <span class="material-symbols-outlined dt-icon dt-icon--sm" aria-hidden="true">grid_view</span>
                  <span class="dt-view-toggle__label">Grade</span>
                </button>
                <button
                  type="button"
                  class="dt-view-toggle__btn"
                  :class="{ 'is-active': viewMode === 'list' }"
                  :aria-pressed="viewMode === 'list'"
                  title="Lista"
                  @click="setViewMode('list')"
                >
                  <span class="material-symbols-outlined dt-icon dt-icon--sm" aria-hidden="true">view_list</span>
                  <span class="dt-view-toggle__label">Lista</span>
                </button>
              </div>
            </div>

            <div class="dt-catalog__dock-cta">
              <button
                type="button"
                class="dt-btn dt-btn--primary dt-catalog__dock-continue"
                :disabled="!canContinue"
                :title="continueHint || continueLabel"
                @click="$emit('continue')"
              >
                <span>{{ continueLabel }}</span>
                <span
                  class="material-symbols-outlined dt-icon"
                  aria-hidden="true"
                >arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </section>
  `,
};
