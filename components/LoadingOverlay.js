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
      <div class="dt-loading-card dt-glass-2">
        <div class="dt-loading-spinner" aria-hidden="true"></div>
        <div class="dt-loading-title">Gerando look</div>
        <div class="dt-loading-msg">{{ message }}</div>
        <div class="dt-loading-bar" aria-hidden="true"><span></span></div>
      </div>
    </div>
  `,
};
