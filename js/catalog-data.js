/** Catálogo Dress To — imagens locais de dressto.com.br (VTEX) */

export const CATEGORIES = [
  { id: 'cima', label: 'Parte de cima' },
  { id: 'baixo', label: 'Parte de baixo' },
  { id: 'acessorio', label: 'Acessório' },
];

export const COLORS = [
  { id: 'preto', label: 'Preto', hex: '#1C1D1D' },
  { id: 'branco', label: 'Branco', hex: '#F5F5F5' },
  { id: 'rosa', label: 'Rosa', hex: '#DC0B9F' },
  { id: 'bege', label: 'Bege', hex: '#D4C4A8' },
  { id: 'azul', label: 'Azul', hex: '#1291E2' },
  { id: 'vermelho', label: 'Vermelho', hex: '#C41E3A' },
];

const IMG = {
  tshirt: './assets/catalog/dt-47380.png',
  blusa: './assets/catalog/dt-47138.png',
  macaquinho: './assets/catalog/dt-46660.png',
  vestidoCurto: './assets/catalog/dt-47446.png',
  vestidoVichy: './assets/catalog/dt-47179.png',
  vestidoLongo: './assets/catalog/dt-47123.png',
  calcaMoletom: './assets/catalog/dt-47341.png',
  shortJeans: './assets/catalog/dt-47314.png',
  calcaSarja: './assets/catalog/dt-46920.png',
  shortSarja: './assets/catalog/dt-47002.png',
  calcaAladim: './assets/catalog/dt-46971.png',
  calcaAlfa: './assets/catalog/dt-46612.png',
  bolsaTrans: './assets/catalog/dt-46735.jpg',
  bolsaHobo: './assets/catalog/dt-47916.png',
  bolsaFelina: './assets/catalog/dt-46844.png',
  bolsaVinho: './assets/catalog/dt-48939.png',
  bolsaMaxi: './assets/catalog/dt-48888.png',
  bolsaMadeira: './assets/catalog/dt-48892.png',
};

/** Catálogo ampliado para testar scroll, filtros e seleção com volume realista.
 *  Imagens locais são reutilizadas em variantes (protótipo). */
export const CATALOG = [
  // —— Parte de cima (24) ——
  { id: 'dt-47380', ref: '02.08.3668_0038', name: 'T-shirt Silk Let The Sun', category: 'cima', color: 'bege', price: 99, image: IMG.tshirt },
  { id: 'dt-47381', ref: '02.08.3668_0001', name: 'T-shirt Silk Let The Sun Preta', category: 'cima', color: 'preto', price: 99, image: IMG.tshirt },
  { id: 'dt-47382', ref: '02.08.3669_0042', name: 'T-shirt Silk Coral Reef', category: 'cima', color: 'rosa', price: 109, image: IMG.tshirt },
  { id: 'dt-47383', ref: '02.08.3670_0012', name: 'Camisa Oversized Linho', category: 'cima', color: 'branco', price: 249, image: IMG.tshirt },
  { id: 'dt-47138', ref: '02.08.3420_198', name: 'Blusa Gola Alta', category: 'cima', color: 'bege', price: 129, image: IMG.blusa },
  { id: 'dt-47139', ref: '02.08.3420_001', name: 'Blusa Gola Alta Preta', category: 'cima', color: 'preto', price: 129, image: IMG.blusa },
  { id: 'dt-47140', ref: '02.08.3421_088', name: 'Blusa Manga Bufante', category: 'cima', color: 'branco', price: 159, image: IMG.blusa },
  { id: 'dt-47141', ref: '02.08.3422_033', name: 'Top Cropped Tricot', category: 'cima', color: 'rosa', price: 139, image: IMG.blusa },
  { id: 'dt-46660', ref: '07.23.0996_0040', name: 'Macaquinho Crepe Sobreposição', category: 'cima', color: 'bege', price: 329, image: IMG.macaquinho },
  { id: 'dt-46661', ref: '07.23.0997_0011', name: 'Macaquinho Linho Amplo', category: 'cima', color: 'branco', price: 349, image: IMG.macaquinho },
  { id: 'dt-46662', ref: '07.23.0998_0088', name: 'Macacão Alfaiataria', category: 'cima', color: 'preto', price: 399, image: IMG.macaquinho },
  { id: 'dt-47446', ref: '01.34.3117_0014', name: 'Vestido Curto Estampa Solaris', category: 'cima', color: 'bege', price: 229, image: IMG.vestidoCurto },
  { id: 'dt-47447', ref: '01.34.3118_0022', name: 'Vestido Curto Liso Rosa', category: 'cima', color: 'rosa', price: 219, image: IMG.vestidoCurto },
  { id: 'dt-47448', ref: '01.34.3119_0099', name: 'Vestido Curto Tule Poá', category: 'cima', color: 'preto', price: 259, image: IMG.vestidoCurto },
  { id: 'dt-47449', ref: '01.34.3120_0044', name: 'Vestido Midi Estampa Floral', category: 'cima', color: 'azul', price: 279, image: IMG.vestidoCurto },
  { id: 'dt-47179', ref: '01.33.2586_0042', name: 'Vestido Cropped Algodão Vichy', category: 'cima', color: 'branco', price: 329, image: IMG.vestidoVichy },
  { id: 'dt-47180', ref: '01.33.2587_0015', name: 'Vestido Midi Vichy Rosa', category: 'cima', color: 'rosa', price: 339, image: IMG.vestidoVichy },
  { id: 'dt-47181', ref: '01.33.2588_0077', name: 'Vestido Curto Vichy Preto', category: 'cima', color: 'preto', price: 319, image: IMG.vestidoVichy },
  { id: 'dt-47123', ref: '01.34.2832_0012', name: 'Vestido Longo Lurex Jasmin Solar Mix', category: 'cima', color: 'bege', price: 399, image: IMG.vestidoLongo },
  { id: 'dt-47124', ref: '01.34.2833_0033', name: 'Vestido Longo Liso Azul', category: 'cima', color: 'azul', price: 379, image: IMG.vestidoLongo },
  { id: 'dt-47125', ref: '01.34.2834_0055', name: 'Vestido Longo Estampa Leveza', category: 'cima', color: 'vermelho', price: 419, image: IMG.vestidoLongo },
  { id: 'dt-47501', ref: '02.09.1100_0001', name: 'Camisa Tricot Fino', category: 'cima', color: 'bege', price: 189, image: IMG.blusa },
  { id: 'dt-47502', ref: '02.09.1101_0002', name: 'Blazer Alfaiataria Oversized', category: 'cima', color: 'preto', price: 449, image: IMG.macaquinho },
  { id: 'dt-47503', ref: '02.09.1102_0003', name: 'Colete Linho Estruturado', category: 'cima', color: 'branco', price: 199, image: IMG.tshirt },

  // —— Parte de baixo (20) ——
  { id: 'dt-47341', ref: '03.07.0384_0087', name: 'Calça Moletom Estampa Listra', category: 'baixo', color: 'bege', price: 279, image: IMG.calcaMoletom },
  { id: 'dt-47342', ref: '03.07.0385_0011', name: 'Calça Moletom Lisa Preta', category: 'baixo', color: 'preto', price: 259, image: IMG.calcaMoletom },
  { id: 'dt-47343', ref: '03.07.0386_0022', name: 'Calça Moletom Rosa Soft', category: 'baixo', color: 'rosa', price: 269, image: IMG.calcaMoletom },
  { id: 'dt-47314', ref: '04.30.0858_352', name: 'Short Jeans Pregas Cós', category: 'baixo', color: 'azul', price: 189, image: IMG.shortJeans },
  { id: 'dt-47315', ref: '04.30.0859_001', name: 'Short Jeans Destroyed', category: 'baixo', color: 'azul', price: 199, image: IMG.shortJeans },
  { id: 'dt-47316', ref: '04.30.0860_088', name: 'Short Jeans Mom Fit', category: 'baixo', color: 'azul', price: 209, image: IMG.shortJeans },
  { id: 'dt-46920', ref: '03.01.1892_198', name: 'Calça Sarja Cropped', category: 'baixo', color: 'bege', price: 229, image: IMG.calcaSarja },
  { id: 'dt-46921', ref: '03.01.1893_011', name: 'Calça Sarja Reta Preta', category: 'baixo', color: 'preto', price: 239, image: IMG.calcaSarja },
  { id: 'dt-46922', ref: '03.01.1894_022', name: 'Calça Sarja Wide Branca', category: 'baixo', color: 'branco', price: 249, image: IMG.calcaSarja },
  { id: 'dt-47002', ref: '04.01.0441_0042', name: 'Short Sarja Básico', category: 'baixo', color: 'bege', price: 149, image: IMG.shortSarja },
  { id: 'dt-47003', ref: '04.01.0442_0055', name: 'Short Sarja Cós Elástico', category: 'baixo', color: 'branco', price: 159, image: IMG.shortSarja },
  { id: 'dt-47004', ref: '04.01.0443_0066', name: 'Short Sarja Pregas Rosa', category: 'baixo', color: 'rosa', price: 169, image: IMG.shortSarja },
  { id: 'dt-46971', ref: '03.07.0388_0069', name: 'Calça Aladim Est Miragem Verde', category: 'baixo', color: 'bege', price: 269, image: IMG.calcaAladim },
  { id: 'dt-46972', ref: '03.07.0389_0070', name: 'Calça Aladim Lisa Azul', category: 'baixo', color: 'azul', price: 279, image: IMG.calcaAladim },
  { id: 'dt-46973', ref: '03.07.0390_0071', name: 'Calça Aladim Estampa Floral', category: 'baixo', color: 'vermelho', price: 289, image: IMG.calcaAladim },
  { id: 'dt-46612', ref: '03.13.0895_0033', name: 'Calça Alfaiataria', category: 'baixo', color: 'bege', price: 299, image: IMG.calcaAlfa },
  { id: 'dt-46613', ref: '03.13.0896_0044', name: 'Calça Alfaiataria Preta', category: 'baixo', color: 'preto', price: 309, image: IMG.calcaAlfa },
  { id: 'dt-46614', ref: '03.13.0897_0055', name: 'Calça Alfaiataria Pantalona', category: 'baixo', color: 'branco', price: 319, image: IMG.calcaAlfa },
  { id: 'dt-47601', ref: '05.02.2001_0001', name: 'Saia Midi Jeans', category: 'baixo', color: 'azul', price: 219, image: IMG.shortJeans },
  { id: 'dt-47602', ref: '05.02.2002_0002', name: 'Saia Curta Linho', category: 'baixo', color: 'bege', price: 179, image: IMG.shortSarja },

  // —— Acessórios (18) ——
  { id: 'dt-46735', ref: '12.11.0228_0014', name: 'Bolsa Transversal Est Solaris', category: 'acessorio', color: 'bege', price: 99, image: IMG.bolsaTrans },
  { id: 'dt-46736', ref: '12.11.0229_0025', name: 'Bolsa Transversal Preta', category: 'acessorio', color: 'preto', price: 109, image: IMG.bolsaTrans },
  { id: 'dt-46737', ref: '12.11.0230_0036', name: 'Bolsa Transversal Rosa', category: 'acessorio', color: 'rosa', price: 109, image: IMG.bolsaTrans },
  { id: 'dt-47916', ref: '12.11.0334_0039', name: 'Bolsa Hobo Nylon Matelassê', category: 'acessorio', color: 'bege', price: 169, image: IMG.bolsaHobo },
  { id: 'dt-47917', ref: '12.11.0335_0040', name: 'Bolsa Hobo Nylon Preta', category: 'acessorio', color: 'preto', price: 179, image: IMG.bolsaHobo },
  { id: 'dt-47918', ref: '12.11.0336_0041', name: 'Bolsa Hobo Nylon Azul', category: 'acessorio', color: 'azul', price: 179, image: IMG.bolsaHobo },
  { id: 'dt-46844', ref: '12.11.0224_0050', name: 'Bolsa Tote Est Felina', category: 'acessorio', color: 'vermelho', price: 179, image: IMG.bolsaFelina },
  { id: 'dt-46845', ref: '12.11.0225_0061', name: 'Bolsa Tote Est Felina Bege', category: 'acessorio', color: 'bege', price: 179, image: IMG.bolsaFelina },
  { id: 'dt-48939', ref: '15.01.0722_0177', name: 'Bolsa Porta Vinho Estampa Leveza', category: 'acessorio', color: 'vermelho', price: 199, image: IMG.bolsaVinho },
  { id: 'dt-48940', ref: '15.01.0723_0188', name: 'Bolsa Porta Vinho Lisa', category: 'acessorio', color: 'preto', price: 189, image: IMG.bolsaVinho },
  { id: 'dt-48888', ref: '12.11.0341_0163', name: 'Bolsa Tote Maxi Porto', category: 'acessorio', color: 'azul', price: 479, image: IMG.bolsaMaxi },
  { id: 'dt-48889', ref: '12.11.0342_0174', name: 'Bolsa Tote Maxi Porto Bege', category: 'acessorio', color: 'bege', price: 479, image: IMG.bolsaMaxi },
  { id: 'dt-48890', ref: '12.11.0343_0185', name: 'Bolsa Tote Maxi Porto Preta', category: 'acessorio', color: 'preto', price: 499, image: IMG.bolsaMaxi },
  { id: 'dt-48892', ref: '12.11.0344_066', name: 'Bolsa Madeirinhas Verano', category: 'acessorio', color: 'vermelho', price: 899, image: IMG.bolsaMadeira },
  { id: 'dt-48893', ref: '12.11.0345_067', name: 'Bolsa Madeirinhas Natural', category: 'acessorio', color: 'bege', price: 899, image: IMG.bolsaMadeira },
  { id: 'dt-47701', ref: '16.01.0100_0001', name: 'Cinto Couro Fino', category: 'acessorio', color: 'preto', price: 89, image: IMG.bolsaTrans },
  { id: 'dt-47702', ref: '16.01.0101_0002', name: 'Óculos Acetato Redondo', category: 'acessorio', color: 'preto', price: 149, image: IMG.bolsaHobo },
  { id: 'dt-47703', ref: '16.01.0102_0003', name: 'Lenço Seda Estampa Solaris', category: 'acessorio', color: 'bege', price: 79, image: IMG.bolsaFelina },
];

export function categoryLabel(id) {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function colorLabel(id) {
  return COLORS.find((c) => c.id === id)?.label ?? id;
}

export function formatPrice(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/** Filtros do site Dress To (mega menu) */
export const FILTER_MENU = [
  {
    id: 'roupas',
    label: 'Roupas',
    items: [
      'Vestidos',
      'Blusas',
      'Macacões',
      'Calças',
      'Camisas',
      'Shorts',
      'Coletes',
      'Saias',
      'Casacos',
      'Ver Tudo',
    ],
  },
  {
    id: 'linhas',
    label: 'Linhas',
    items: [
      'Dress To Essentials',
      'Beachwear',
      'Lingeries',
      'Dress To Green',
      'Thati Amorim',
      'Catarina Mina',
      'Rio Em Traços',
      'Maria Antonia Chady',
      'Dress To + La Vie Sports',
      'Cores Do Brasil',
    ],
  },
  {
    id: 'acessorios',
    label: 'Acessórios',
    items: ['Bolsas', 'Acessórios', 'Calçados'],
  },
  {
    id: 'tendencias',
    label: 'Tendências',
    items: ['Alfaiataria', 'Conjuntos', 'Jeans', 'Lisos', 'Tricot', 'Tule'],
  },
];

export const VESTIDO_FILTERS = ['Curtos', 'Midi', 'Longos', 'Lisos', 'Estampados'];

/** Mapeia filtro → keywords para o catálogo */
export const FILTER_KEYWORDS = {
  Vestidos: ['vestido'],
  Blusas: ['blusa', 'top', 't-shirt', 'tshirt'],
  Macacões: ['macacão', 'macacao', 'macaquinho'],
  Calças: ['calça', 'calca', 'cargo'],
  Camisas: ['camisa'],
  Shorts: ['short'],
  Coletes: ['colete'],
  Saias: ['saia'],
  Casacos: ['casaco', 'blazer'],
  Bolsas: ['bolsa'],
  Acessórios: ['bolsa', 'colar', 'cinto', 'óculos', 'oculos', 'lenço', 'lenco', 'bracelete'],
  Calçados: ['sapato', 'sandália', 'sandalia'],
  Alfaiataria: ['alfaiataria', 'blazer'],
  Jeans: ['jeans'],
  Tricot: ['tricot'],
  Lisos: ['liso', 'lisa'],
  Conjuntos: ['conjunto'],
  Tule: ['tule'],
  Curtos: ['curto'],
  Midi: ['midi'],
  Longos: ['longo'],
  Estampados: ['estamp'],
};

