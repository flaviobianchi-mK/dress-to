import {
  CATALOG,
  CATEGORIES,
  FILTER_MENU,
  VESTIDO_FILTERS,
  SIZE_FILTERS,
  FILTER_KEYWORDS,
  categoryLabel,
  colorLabel,
  formatPrice,
  pieceNeedsSize,
  pieceIsSized,
} from '../js/catalog-data.js';

const { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } = Vue;

const DRAWER_WIDTH = 136;
const DRAWER_GAP = 10;

export default {
  name: 'CatalogScreen',
  props: {
    selected: { type: Object, required: true },
    hasPhoto: { type: Boolean, default: false },
    layoutMode: { type: String, default: 'workspace' },
  },
  emits: ['toggle', 'remove', 'set-size', 'continue'],
  setup(props, { emit }) {
    const query = ref('');
    const filtersOpen = ref(false);
    const activeTypes = ref([]);
    const activeVestidos = ref([]);
    const drawerSides = ref({});
    const viewMode = ref('grid');
    const expandedSections = ref({});
    const catalogLoading = ref(true);
    const loadedImages = reactive({});

    const GRID_PAGE_SIZE = 6;
    const LIST_PAGE_SIZE = 8;
    const SECTION_ORDER = ['cima', 'baixo', 'acessorio'];
    const SKELETON_SECTIONS = [
      { id: 'cima', cards: 6 },
      { id: 'baixo', cards: 6 },
      { id: 'acessorio', cards: 6 },
    ];

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

    const needsSize = computed(
      () =>
        selectedList.value.length > 0 &&
        selectedList.value.some((p) => !pieceIsSized(p)),
    );

    const canContinue = computed(
      () =>
        selectedList.value.length > 0 &&
        selectedList.value.every((p) => pieceIsSized(p)),
    );

    const continueLabel = computed(() => {
      if (needsSize.value) return 'Selecionar tamanho';
      return 'Continuar';
    });

    const continueHint = computed(() => {
      if (!selectedList.value.length) return 'Selecione ao menos uma peça';
      if (needsSize.value) return 'Selecione o tamanho das peças';
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

    const filtered = computed(() => {
      const q = query.value.trim().toLowerCase();
      const types = activeTypes.value.filter((t) => t !== 'Ver Tudo');
      return CATALOG.filter((item) => {
        if (!matchesAny(item, types)) return false;
        if (!matchesAny(item, activeVestidos.value)) return false;
        if (q) {
          const hay = `${item.name} ${item.ref}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
    });

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

    function isSelected(item) {
      return props.selected[item.category]?.id === item.id;
    }

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
      if (event.target.closest?.('.dt-catalog__dock')) return;
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
      nextTick(updateDrawerSides);
    }

    function onSetSize(payload) {
      emit('set-size', payload);
      maybeAdvanceSection(payload.category);
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
      const idx = SECTION_ORDER.indexOf(category);
      if (idx < 0 || idx >= SECTION_ORDER.length - 1) return;
      const nextId = SECTION_ORDER[idx + 1];
      if (!grouped.value.some((g) => g.id === nextId)) return;
      scrollToSection(nextId);
    }

    function drawerSideFor(itemId) {
      return drawerSides.value[itemId] || 'right';
    }

    function updateDrawerSides() {
      nextTick(() => {
        const next = { ...drawerSides.value };
        document.querySelectorAll('.dt-card-wrap[data-item-id]').forEach((el) => {
          const id = el.getAttribute('data-item-id');
          if (!el.classList.contains('is-open')) return;
          const rect = el.getBoundingClientRect();
          const col = el.closest('.dt-catalog > div') || document.body;
          const colRect = col.getBoundingClientRect();
          const spaceRight = Math.min(
            window.innerWidth - rect.right,
            colRect.right - rect.right,
          );
          const spaceLeft = Math.min(rect.left, rect.left - colRect.left);
          const need = DRAWER_WIDTH + DRAWER_GAP + 8;
          next[id] =
            spaceRight >= need || spaceRight >= spaceLeft ? 'right' : 'left';
        });
        drawerSides.value = next;
      });
    }

    watch(
      () => props.selected,
      () => updateDrawerSides(),
      { deep: true },
    );

    onMounted(async () => {
      updateDrawerSides();
      window.addEventListener('resize', updateDrawerSides);
      window.addEventListener('scroll', updateDrawerSides, true);
      // Simula fetch do catálogo — trocar por await da API quando existir
      await new Promise((r) => setTimeout(r, 550));
      catalogLoading.value = false;
      await nextTick();
      updateDrawerSides();
    });

    onBeforeUnmount(() => {
      window.removeEventListener('resize', updateDrawerSides);
      window.removeEventListener('scroll', updateDrawerSides, true);
      unbindFilterOutsideClose();
    });

    return {
      CATEGORIES,
      FILTER_MENU,
      VESTIDO_FILTERS,
      SIZE_FILTERS,
      query,
      filtersOpen,
      activeFilterCount,
      activeFilterChips,
      showVestidoPanel,
      selectedList,
      canContinue,
      needsSize,
      continueLabel,
      continueHint,
      lookTotal,
      grouped,
      viewMode,
      catalogLoading,
      SKELETON_SECTIONS,
      categoryLabel,
      colorLabel,
      formatPrice,
      pieceNeedsSize,
      drawerSideFor,
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
      onSetSize,
    };
  },
  template: `
    <section class="dt-screen dt-screen--catalog" aria-labelledby="catalog-title">
      <h1 class="dt-screen__title" id="catalog-title">Montar o look</h1>
      <p class="dt-screen__lead">
        Escolha as peças do catálogo Dress To. Uma peça por categoria
        (cima, baixo, acessório).
      </p>

      <div class="dt-catalog">
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
                    'is-open': isSelected(item) && pieceNeedsSize(item),
                    'is-blocked': isBlocked(item) && !isSelected(item),
                    'needs-size': isSelected(item) && pieceNeedsSize(item) && !selected[item.category]?.size,
                    'is-drawer-right': drawerSideFor(item.id) === 'right',
                    'is-drawer-left': drawerSideFor(item.id) === 'left',
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
                    @click="$emit('toggle', item)"
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

                  <aside
                    v-if="pieceNeedsSize(item)"
                    class="dt-card__drawer"
                    :class="{ 'dt-card__drawer--list': viewMode === 'list' }"
                    :aria-hidden="!(isSelected(item) && pieceNeedsSize(item))"
                    @click.stop
                  >
                    <div class="dt-card__drawer-label">Tamanho</div>
                    <div
                      class="dt-card__drawer-sizes"
                      role="group"
                      :aria-label="'Tamanho de ' + item.name"
                    >
                      <button
                        v-for="size in SIZE_FILTERS"
                        :key="size"
                        type="button"
                        class="dt-filter-size dt-filter-size--sm"
                        :class="{ 'is-active': selected[item.category]?.size === size }"
                        :aria-pressed="selected[item.category]?.size === size"
                        @click="onSetSize({ category: item.category, size })"
                      >{{ size }}</button>
                    </div>
                  </aside>
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
            <span class="dt-lookbar__count">{{ selectedList.length }}/3</span>
          </div>

          <ul class="dt-lookbar__list">
            <li v-if="!selectedList.length" class="dt-lookbar__empty">
              Selecione peças no catálogo para montar o look.
            </li>
            <li
              v-for="piece in selectedList"
              :key="piece.id"
              class="dt-look-item"
              :class="{ 'needs-size': pieceNeedsSize(piece) && !piece.size }"
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
                <div
                  v-if="pieceNeedsSize(piece)"
                  class="dt-look-item__size-badge"
                  :class="{ 'is-empty': !piece.size }"
                >
                  {{ piece.size ? 'Tam. ' + piece.size : 'Selecionar tamanho' }}
                </div>
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

          <div v-if="selectedList.length && !canContinue" class="dt-lookbar__hint">
            Abra a gaveta no card e escolha o tamanho.
          </div>

          <div v-if="selectedList.length" class="dt-lookbar__total">
            Total · {{ formatPrice(lookTotal) }}
          </div>
        </aside>
      </div>

      <Teleport to="body">
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
              :key="'dock-' + chip.group + '-' + (chip.value || chip.label)"
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
                :class="{ 'is-needs-size': needsSize }"
                :disabled="!canContinue"
                :title="continueHint || continueLabel"
                @click="$emit('continue')"
              >
                <span>{{ continueLabel }}</span>
                <span
                  v-if="!needsSize"
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
