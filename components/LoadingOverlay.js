export default {
  name: 'LoadingOverlay',
  props: {
    message: { type: String, default: 'Gerando o provador virtual…' },
  },
  template: `
    <div
      class="dt-loading"
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-live="polite"
      aria-label="Geração em andamento"
    >
      <div class="dt-loading__card dt-glass-2">
        <div class="dt-loading__spinner" aria-hidden="true"></div>
        <div class="dt-loading__title">Gerando look</div>
        <div class="dt-loading__msg">{{ message }}</div>
        <div class="dt-loading__bar" aria-hidden="true"><span></span></div>
      </div>
    </div>
  `,
};
