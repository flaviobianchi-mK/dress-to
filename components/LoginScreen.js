const { ref } = Vue;

export default {
  name: 'LoginScreen',
  emits: ['login'],
  setup(_, { emit }) {
    const email = ref('');
    const password = ref('');
    const error = ref('');

    function submit() {
      error.value = '';
      if (!email.value.trim() || !password.value) {
        error.value = 'Informe email e senha para entrar.';
        return;
      }
      emit('login', {
        email: email.value.trim(),
        name: email.value.trim().split('@')[0] || 'Personal shopper',
      });
    }

    return { email, password, error, submit };
  },
  template: `
    <section class="dt-login" aria-labelledby="login-title">
      <div class="dt-login-stage">
        <div class="dt-login-content">
          <img
            class="dt-login-logo"
            src="./assets/mk-fashion-logo.svg"
            width="210"
            height="39"
            alt="mk Fashion"
          />

          <div class="dt-login-copy">
            <h1 class="dt-login-title" id="login-title">Acesso da personal shopper</h1>
            <p class="dt-login-lead">
              Entre para atender clientes no modo operador Dress To.
              Login de teste — qualquer email e senha válidos liberam o acesso.
            </p>
          </div>

          <form class="dt-login-form" @submit.prevent="submit">
            <label class="dt-field">
              <span class="dt-field-label">Email</span>
              <input
                v-model="email"
                class="dt-field-control"
                type="email"
                autocomplete="username"
                placeholder="natalia@dressto.com"
                required
              />
            </label>
            <label class="dt-field">
              <span class="dt-field-label">Senha</span>
              <input
                v-model="password"
                class="dt-field-control"
                type="password"
                autocomplete="current-password"
                placeholder="••••••••"
                required
              />
            </label>
            <p v-if="error" class="dt-login-error" role="alert">{{ error }}</p>
            <button type="submit" class="dt-btn dt-btn--primary dt-login-submit">
              <span>Entrar</span>
              <span class="material-symbols-outlined dt-icon" aria-hidden="true">arrow_forward</span>
            </button>
          </form>
        </div>

        <aside class="dt-login-panel" aria-hidden="true">
          <div class="dt-login-panel-surface">
            <video
              class="dt-login-panel-video"
              src="./assets/video/login-fashion.mp4"
              autoplay
              muted
              loop
              playsinline
              preload="auto"
            ></video>
          </div>
        </aside>
      </div>
    </section>
  `,
};
