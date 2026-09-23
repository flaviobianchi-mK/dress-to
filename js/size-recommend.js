/** Stub de recomendação de tamanho até tabelas Dress To. */

export const EXAMPLE_SIZES = ['M', '38', 'U'];

export function exampleSizeForIndex(index) {
  return EXAMPLE_SIZES[index % EXAMPLE_SIZES.length];
}

export function buildSizeRecommendations(pieces) {
  return (pieces || []).map((piece, index) => ({
    piece,
    pieceLabel: `Peça ${index + 1}`,
    sizeLabel: piece.recommendedSize || exampleSizeForIndex(index),
    pending: false,
  }));
}
