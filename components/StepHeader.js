const { computed } = Vue;

export default {
  name: 'StepHeader',
  props: {
    current: { type: String, required: true },
    shopperName: { type: String, default: '' },
    layoutMode: { type: String, default: 'workspace' },
    lookPlacement: { type: String, default: 'floating' },
    showLayoutToggles: { type: Boolean, default: false },
  },
  emits: ['logout', 'toggle-layout', 'toggle-look-placement'],
  setup(props) {
    const isWorkspace = computed(() => props.layoutMode === 'workspace');
    const isFloatingLook = computed(() => props.lookPlacement === 'floating');

    return { isWorkspace, isFloatingLook };
  },
  template: `
    <header class="dt-header">
      <div class="dt-brand">
        <img
          class="dt-brand__logo"
          src="./assets/mk-fashion-logo.svg"
          width="148"
          height="28"
          alt="mk Fashion"
        />
      </div>

      <div class="dt-brand__mode">Personal shopper · <span>Dress To</span></div>

      <div class="dt-header__actions">
        <template v-if="showLayoutToggles">
          <button
            type="button"
            class="dt-layout-toggle"
            :aria-pressed="isWorkspace"
            :title="isWorkspace ? 'Alternar para fluxo em etapas' : 'Alternar para tela unificada'"
            @click="$emit('toggle-layout')"
          >
            <span class="dt-layout-toggle__track" aria-hidden="true">
              <span class="dt-layout-toggle__thumb"></span>
            </span>
            <span class="dt-layout-toggle__label">
              {{ isWorkspace ? 'Tela unificada' : 'Etapas' }}
            </span>
          </button>

          <button
            v-if="isWorkspace"
            type="button"
            class="dt-layout-toggle"
            :aria-pressed="isFloatingLook"
            :title="isFloatingLook ? 'Look no topo (versão atual)' : 'Look flutuante acima da barra (teste)'"
            @click="$emit('toggle-look-placement')"
          >
            <span class="dt-layout-toggle__track" aria-hidden="true">
              <span class="dt-layout-toggle__thumb"></span>
            </span>
            <span class="dt-layout-toggle__label">
              {{ isFloatingLook ? 'Look flutuante' : 'Look no topo' }}
            </span>
          </button>
        </template>

        <span v-if="shopperName" class="dt-header__user">{{ shopperName }}</span>
        <button type="button" class="dt-btn dt-btn--ghost dt-btn--sm" @click="$emit('logout')">
          Sair
        </button>
      </div>
    </header>
  `,
};
