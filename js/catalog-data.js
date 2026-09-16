/** Catálogo Dress To — produtos e imagens de dressto.com.br (VTEX) */

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
  // Macacões (reais)
  macacaoPunhoBarra: './assets/catalog/dt-48624.png',
  macacaoDecoteTesoura: './assets/catalog/dt-47966.png',
  macacaoPalaTranspasse: './assets/catalog/dt-47764.png',
  macacaoCrepeSaruel: './assets/catalog/dt-46675.png',
  macacaoLinhoFaixa: './assets/catalog/dt-47249.png',
  macacaoCrepeAmplo: './assets/catalog/dt-47750.png',
  macacaoLinhoVies: './assets/catalog/dt-47755.png',
  // Tops / vestidos
  tshirt: './assets/catalog/dt-47380.png',
  blusa: './assets/catalog/dt-47138.png',
  blusaTricotBarra: './assets/catalog/dt-47821.png',
  blusaBicolor: './assets/catalog/dt-47790.png',
  blusaModal: './assets/catalog/dt-47614.png',
  macaquinho: './assets/catalog/dt-46660.png',
  vestidoCurto: './assets/catalog/dt-47446.png',
  vestidoVichy: './assets/catalog/dt-47179.png',
  vestidoLongo: './assets/catalog/dt-47123.png',
  vestidoMiragem: './assets/catalog/dt-47221.png',
  vestidoCrepeSobre: './assets/catalog/dt-47097.png',
  vestidoMidiTrapezio: './assets/catalog/dt-47369.png',
  // Bottoms
  calcaMoletom: './assets/catalog/dt-47341.png',
  shortJeans: './assets/catalog/dt-47314.png',
  calcaSarja: './assets/catalog/dt-46920.png',
  shortSarja: './assets/catalog/dt-47002.png',
  calcaAladim: './assets/catalog/dt-46971.png',
  calcaAlfa: './assets/catalog/dt-46612.png',
  calcaCrepeAmpla: './assets/catalog/dt-46617.png',
  calcaMalhaSuede: './assets/catalog/dt-46632.png',
  saiaMidiAlfa: './assets/catalog/dt-46941.png',
  // Acessórios
  bolsaTrans: './assets/catalog/dt-46735.jpg',
  bolsaHobo: './assets/catalog/dt-47916.png',
  bolsaFelina: './assets/catalog/dt-46844.png',
  bolsaVinho: './assets/catalog/dt-48939.png',
  bolsaMaxi: './assets/catalog/dt-48888.png',
  bolsaMadeira: './assets/catalog/dt-48892.png',
  bolsaBucket: './assets/catalog/dt-43936.png',
};

/**
 * Catálogo do protótipo com peças reais Dress To.
 * `boost` alto sobe no ranking da busca (ex.: Macacão Punho Barra).
 * Fonte: https://www.dressto.com.br
 */
export const CATALOG = [
  // —— Macacões (Punho Barra primeiro: destaque + busca "macacão") ——
  {
    id: 'dt-48624',
    ref: '07.23.1137_2109',
    name: 'Macacão Punho Barra',
    category: 'cima',
    color: 'vermelho',
    price: 599,
    image: IMG.macacaoPunhoBarra,
    boost: 100,
    url: 'https://www.dressto.com.br/macacao-punho-barra-07231137-2109/p',
  },
  { id: 'dt-47966', ref: '07.23.1112_468', name: 'Macacão Algodão Decote Tesoura', category: 'cima', color: 'bege', price: 419, image: IMG.macacaoDecoteTesoura, boost: 40 },
  { id: 'dt-47764', ref: '07.23.1118_468', name: 'Macacão Pala Transpasse', category: 'cima', color: 'bege', price: 349, image: IMG.macacaoPalaTranspasse, boost: 35 },
  { id: 'dt-46675', ref: '07.23.1002_468', name: 'Macacão Crepe Saruel', category: 'cima', color: 'bege', price: 339, image: IMG.macacaoCrepeSaruel, boost: 30 },
  { id: 'dt-47249', ref: '07.23.1003_0040', name: 'Macacão Linho Faixa', category: 'cima', color: 'bege', price: 399, image: IMG.macacaoLinhoFaixa, boost: 30 },
  { id: 'dt-47750', ref: '07.23.1113_0027', name: 'Macacão Crepe Amplo', category: 'cima', color: 'preto', price: 329, image: IMG.macacaoCrepeAmplo, boost: 28 },
  { id: 'dt-47755', ref: '07.23.1117_0034', name: 'Macacão Linho Viés Color', category: 'cima', color: 'bege', price: 449, image: IMG.macacaoLinhoVies, boost: 28 },
  { id: 'dt-46660', ref: '07.23.0996_0040', name: 'Macaquinho Crepe Sobreposição', category: 'cima', color: 'bege', price: 329, image: IMG.macaquinho, boost: 10 },

  // —— Tops ——
  { id: 'dt-47380', ref: '02.08.3668_0038', name: 'T-shirt Silk Let The Sun', category: 'cima', color: 'bege', price: 99, image: IMG.tshirt },
  { id: 'dt-47821', ref: '02.08.3769_0038', name: 'Blusa Tricot Detalhe Barra', category: 'cima', color: 'bege', price: 139, image: IMG.blusaTricotBarra },
  { id: 'dt-47790', ref: '02.08.3761_0141', name: 'Blusa T-shirt Bicolor', category: 'cima', color: 'rosa', price: 129, image: IMG.blusaBicolor },
  { id: 'dt-47614', ref: '02.08.3730_0037', name: 'Blusa Malha Modal', category: 'cima', color: 'branco', price: 149, image: IMG.blusaModal },
  { id: 'dt-47138', ref: '02.08.3420_198', name: 'Blusa Gola Alta', category: 'cima', color: 'bege', price: 129, image: IMG.blusa },
  { id: 'dt-47139', ref: '02.08.3420_001', name: 'Blusa Gola Alta Preta', category: 'cima', color: 'preto', price: 129, image: IMG.blusa },
  { id: 'dt-47140', ref: '02.08.3421_088', name: 'Blusa Manga Bufante', category: 'cima', color: 'branco', price: 159, image: IMG.blusa },
  { id: 'dt-47501', ref: '02.09.1100_0001', name: 'Camisa Tricot Fino', category: 'cima', color: 'bege', price: 189, image: IMG.blusa },
  { id: 'dt-47503', ref: '02.09.1102_0003', name: 'Colete Linho Estruturado', category: 'cima', color: 'branco', price: 199, image: IMG.tshirt },

  // —— Vestidos ——
  { id: 'dt-47221', ref: '01.34.2949_0069', name: 'Vestido Cropped Est Miragem Mix', category: 'cima', color: 'bege', price: 399, image: IMG.vestidoMiragem },
  { id: 'dt-47097', ref: '01.33.2676_0033', name: 'Vestido Curto Crepe Sobreposição', category: 'cima', color: 'branco', price: 199, image: IMG.vestidoCrepeSobre },
  { id: 'dt-47369', ref: '01.33.2546_0033', name: 'Vestido Midi Linho Trapézio', category: 'cima', color: 'branco', price: 289, image: IMG.vestidoMidiTrapezio },
  { id: 'dt-47446', ref: '01.34.3117_0014', name: 'Vestido Curto Estampa Solaris', category: 'cima', color: 'bege', price: 229, image: IMG.vestidoCurto },
  { id: 'dt-47447', ref: '01.34.3118_0022', name: 'Vestido Curto Liso Rosa', category: 'cima', color: 'rosa', price: 219, image: IMG.vestidoCurto },
  { id: 'dt-47179', ref: '01.33.2586_0042', name: 'Vestido Cropped Algodão Vichy', category: 'cima', color: 'branco', price: 329, image: IMG.vestidoVichy },
  { id: 'dt-47123', ref: '01.34.2832_0012', name: 'Vestido Longo Lurex Jasmin Solar Mix', category: 'cima', color: 'bege', price: 399, image: IMG.vestidoLongo },
  { id: 'dt-47124', ref: '01.34.2833_0033', name: 'Vestido Longo Liso Azul', category: 'cima', color: 'azul', price: 379, image: IMG.vestidoLongo },

  // —— Parte de baixo ——
  { id: 'dt-46971', ref: '03.07.0388_0069', name: 'Calça Aladim Est Miragem Verde', category: 'baixo', color: 'bege', price: 269, image: IMG.calcaAladim },
  { id: 'dt-46612', ref: '03.13.0895_0033', name: 'Calça Alfaiataria', category: 'baixo', color: 'bege', price: 299, image: IMG.calcaAlfa },
  { id: 'dt-46617', ref: '03.13.0902_0038', name: 'Calça Crepe Ampla', category: 'baixo', color: 'bege', price: 319, image: IMG.calcaCrepeAmpla },
  { id: 'dt-46632', ref: '03.13.1005_394', name: 'Calça Malha Suede', category: 'baixo', color: 'preto', price: 349, image: IMG.calcaMalhaSuede },
  { id: 'dt-46920', ref: '03.01.1892_198', name: 'Calça Sarja Cropped', category: 'baixo', color: 'bege', price: 229, image: IMG.calcaSarja },
  { id: 'dt-46921', ref: '03.01.1893_011', name: 'Calça Sarja Reta Preta', category: 'baixo', color: 'preto', price: 239, image: IMG.calcaSarja },
  { id: 'dt-47341', ref: '03.07.0384_0087', name: 'Calça Moletom Estampa Listra', category: 'baixo', color: 'bege', price: 279, image: IMG.calcaMoletom },
  { id: 'dt-47314', ref: '04.30.0858_352', name: 'Short Jeans Pregas Cós', category: 'baixo', color: 'azul', price: 189, image: IMG.shortJeans },
  { id: 'dt-47315', ref: '04.30.0859_001', name: 'Short Jeans Destroyed', category: 'baixo', color: 'azul', price: 199, image: IMG.shortJeans },
  { id: 'dt-47002', ref: '04.01.0441_0042', name: 'Short Sarja Básico', category: 'baixo', color: 'bege', price: 149, image: IMG.shortSarja },
  { id: 'dt-46941', ref: '05.26.0697_0040', name: 'Saia Midi Algodão Alfaiataria', category: 'baixo', color: 'bege', price: 269, image: IMG.saiaMidiAlfa },
  { id: 'dt-47602', ref: '05.02.2002_0002', name: 'Saia Curta Linho', category: 'baixo', color: 'bege', price: 179, image: IMG.shortSarja },

  // —— Acessórios ——
  { id: 'dt-46735', ref: '12.11.0228_0014', name: 'Bolsa Transversal Est Solaris', category: 'acessorio', color: 'bege', price: 99, image: IMG.bolsaTrans },
  { id: 'dt-46844', ref: '12.11.0224_0050', name: 'Bolsa Tote Est Felina', category: 'acessorio', color: 'vermelho', price: 179, image: IMG.bolsaFelina },
  { id: 'dt-47916', ref: '12.11.0334_0039', name: 'Bolsa Hobo Nylon Matelassê', category: 'acessorio', color: 'bege', price: 169, image: IMG.bolsaHobo },
  { id: 'dt-48939', ref: '15.01.0722_0177', name: 'Bolsa Porta Vinho Estampa Leveza', category: 'acessorio', color: 'vermelho', price: 199, image: IMG.bolsaVinho },
  { id: 'dt-48888', ref: '12.11.0341_0163', name: 'Bolsa Tote Maxi Porto', category: 'acessorio', color: 'azul', price: 479, image: IMG.bolsaMaxi },
  { id: 'dt-48892', ref: '12.11.0344_066', name: 'Bolsa Madeirinhas Verano', category: 'acessorio', color: 'vermelho', price: 899, image: IMG.bolsaMadeira },
  { id: 'dt-43936', ref: '12.11.0188_066', name: 'Bolsa Bucket Mosaico de Palha', category: 'acessorio', color: 'bege', price: 279, image: IMG.bolsaBucket },
  { id: 'dt-47701', ref: '16.01.0100_0001', name: 'Cinto Couro Fino', category: 'acessorio', color: 'preto', price: 89, image: IMG.bolsaTrans },
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
  Blusas: ['blusa', 'top', 't-shirt', 'tshirt', 'regata'],
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
