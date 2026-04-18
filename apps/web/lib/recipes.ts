export type Categoria = 'brasileira' | 'japonesa' | 'fusion' | 'fitness'
export type TipoRefeicao = 'cafe_da_manha' | 'almoco' | 'jantar' | 'lanche'

export interface Ingrediente {
  nome: string
  quantidade: string
  onde?: string   // dica de onde encontrar no Japão
}

export interface Receita {
  id: string
  titulo: string
  descricao: string
  categoria: Categoria
  tipoRefeicao: TipoRefeicao[]
  tempoPrep: number   // minutos
  tempoCozimento: number
  porcoes: number
  caloriasTotal: number
  proteina: number
  carbs: number
  gordura: number
  japaoFriendly: boolean
  tags: string[]
  emoji: string
  ingredientes: Ingrediente[]
  passos: string[]
}

export const RECEITAS: Receita[] = [
  {
    id: 'frango-teriyaki',
    titulo: 'Frango Teriyaki',
    descricao: 'Clássico japonês que todo brasileiro no Japão aprende a fazer. Simples, proteico e com ingredientes de qualquer supermercado.',
    categoria: 'japonesa',
    tipoRefeicao: ['almoco', 'jantar'],
    tempoPrep: 10,
    tempoCozimento: 15,
    porcoes: 2,
    caloriasTotal: 560,
    proteina: 70,
    carbs: 30,
    gordura: 12,
    japaoFriendly: true,
    tags: ['rapido', 'alto_proteina', 'sem_gluten_adaptavel'],
    emoji: '🍗',
    ingredientes: [
      { nome: 'Peito de frango', quantidade: '400g', onde: 'Qualquer supermercado (鶏胸肉)' },
      { nome: 'Shoyu', quantidade: '3 colheres de sopa', onde: 'Kikkoman — todo supermercado' },
      { nome: 'Mirin', quantidade: '2 colheres de sopa', onde: 'セクション de temperos japoneses' },
      { nome: 'Sake culinário', quantidade: '2 colheres de sopa', onde: 'Daiso ou supermercado' },
      { nome: 'Mel', quantidade: '1 colher de sopa' },
      { nome: 'Alho', quantidade: '2 dentes' },
      { nome: 'Óleo de gergelim', quantidade: '1 colher de chá', onde: 'ごま油 — todo supermercado' },
    ],
    passos: [
      'Misture shoyu, mirin, sake e mel em uma tigela — esse é o molho teriyaki.',
      'Corte o frango em filés finos (≈1cm). Marinar 10 min no molho reservado.',
      'Aqueça uma frigideira com o óleo de gergelim em fogo médio-alto.',
      'Grelhe o frango 3-4 min de cada lado até dourar.',
      'Despeje o molho da marinada sobre o frango e cozinhe em fogo baixo por 2 min até engrossar.',
      'Sirva com arroz japonês e cebolinha picada.',
    ],
  },
  {
    id: 'arroz-feijao-japones',
    titulo: 'Arroz com Feijão Versão Japão',
    descricao: 'A dupla clássica do brasileiro adaptada com o que você acha aqui: arroz japonês e feijão preto em lata do Costco ou Kaldi.',
    categoria: 'fusion',
    tipoRefeicao: ['almoco', 'jantar'],
    tempoPrep: 5,
    tempoCozimento: 20,
    porcoes: 2,
    caloriasTotal: 700,
    proteina: 28,
    carbs: 120,
    gordura: 8,
    japaoFriendly: true,
    tags: ['classico_brasileiro', 'economico', 'facil'],
    emoji: '🍚',
    ingredientes: [
      { nome: 'Arroz japonês', quantidade: '2 xícaras (cru)', onde: 'コシヒカリ ou ひとめぼれ — todo supermercado' },
      { nome: 'Feijão preto em lata', quantidade: '1 lata (400g)', onde: 'Costco, Kaldi Coffee Farm' },
      { nome: 'Alho', quantidade: '3 dentes' },
      { nome: 'Cebola', quantidade: '½ unidade' },
      { nome: 'Azeite ou óleo', quantidade: '1 colher de sopa' },
      { nome: 'Sal e pimenta do reino', quantidade: 'a gosto' },
      { nome: 'Folha de louro', quantidade: '1 folha', onde: 'Kaldi ou lojas de importados' },
      { nome: 'Salsinha ou cebolinha', quantidade: 'a gosto', onde: 'Cebolinha (万能ネギ) em todo supermercado' },
    ],
    passos: [
      'Cozinhe o arroz japonês na panela elétrica (2 xícaras de arroz + 2,4 de água).',
      'Em uma panela, aqueça o azeite e refogue alho e cebola picados até dourar.',
      'Adicione o feijão preto escorrido (sem lavar para manter o caldo), a folha de louro.',
      'Tempere com sal e pimenta. Cozinhe em fogo baixo por 15 min mexendo ocasionalmente.',
      'Se ficar muito grosso, adicione ½ xícara de água.',
      'Sirva o feijão sobre o arroz com salsinha ou cebolinha picada.',
    ],
  },
  {
    id: 'tamagoyaki-proteico',
    titulo: 'Tamagoyaki Proteico com Atum',
    descricao: 'A omelete japonesa em camadas com atum dentro. Alta proteína, rápido de fazer e ótimo para café da manhã ou marmita.',
    categoria: 'japonesa',
    tipoRefeicao: ['cafe_da_manha', 'lanche', 'almoco'],
    tempoPrep: 5,
    tempoCozimento: 10,
    porcoes: 1,
    caloriasTotal: 270,
    proteina: 28,
    carbs: 5,
    gordura: 15,
    japaoFriendly: true,
    tags: ['alto_proteina', 'baixo_carb', 'rapido', 'marmita'],
    emoji: '🥚',
    ingredientes: [
      { nome: 'Ovos', quantidade: '3 unidades' },
      { nome: 'Atum em lata no próprio suco', quantidade: '1 lata pequena (70g)', onde: 'まぐろ水煮 — todo supermercado' },
      { nome: 'Shoyu', quantidade: '1 colher de chá' },
      { nome: 'Mirin', quantidade: '1 colher de chá' },
      { nome: 'Cebolinha', quantidade: '2 talos', onde: '万能ネギ — qualquer supermercado' },
      { nome: 'Óleo', quantidade: '1 colher de chá' },
    ],
    passos: [
      'Bata os ovos com shoyu, mirin e cebolinha picada. Escorra o atum e misture.',
      'Aqueça uma frigideira antiaderente (ou tamagoyaki pan) com um fio de óleo.',
      'Despeje ⅓ da mistura de ovos na frigideira aquecida.',
      'Quando começar a firmar (borda cozida, centro ainda mole), enrole com a espátula.',
      'Empurre o rolo para um lado e despeje mais ⅓ da mistura. Repita o processo.',
      'Após 3 camadas, retire do fogo e corte em rodelas.',
    ],
  },
  {
    id: 'sopa-misso-tofu',
    titulo: 'Sopa de Missô com Tofu e Wakame',
    descricao: 'O conforto japonês de cada manhã. Reconstitutiva, leve e cheia de probióticos. Em 5 minutos está pronta.',
    categoria: 'japonesa',
    tipoRefeicao: ['cafe_da_manha', 'jantar'],
    tempoPrep: 2,
    tempoCozimento: 5,
    porcoes: 2,
    caloriasTotal: 160,
    proteina: 14,
    carbs: 10,
    gordura: 6,
    japaoFriendly: true,
    tags: ['baixo_caloria', 'rapido', 'saudavel', 'probioticos'],
    emoji: '🍲',
    ingredientes: [
      { nome: 'Pasta de missô (白味噌 branco ou 赤味噌 vermelho)', quantidade: '2 colheres de sopa', onde: 'Todo supermercado' },
      { nome: 'Tofu sedoso (絹豆腐)', quantidade: '150g', onde: 'Todo supermercado' },
      { nome: 'Wakame desidratado', quantidade: '1 colher de chá', onde: 'Todo supermercado (わかめ)' },
      { nome: 'Caldo dashi (だし) em pó', quantidade: '1 sachê', onde: 'Todo supermercado' },
      { nome: 'Água', quantidade: '500ml' },
      { nome: 'Cebolinha', quantidade: '2 talos' },
    ],
    passos: [
      'Ferva a água e dissolva o dashi em pó.',
      'Hidrate o wakame por 1 min na água quente (expande bastante — use pouco).',
      'Corte o tofu em cubinhos de 1cm.',
      'IMPORTANTE: desligue o fogo antes de adicionar o missô para preservar probióticos.',
      'Dissolva o missô em uma concha com um pouco do caldo, depois misture na panela.',
      'Adicione tofu, wakame e sirva com cebolinha picada.',
    ],
  },
  {
    id: 'yakisoba-frango',
    titulo: 'Yakisoba de Frango Caseiro',
    descricao: 'O yakisoba do caminhão! Feito em casa com macarrão fresco japonês (中華麺) e muito mais saudável do que o de pacote.',
    categoria: 'fusion',
    tipoRefeicao: ['almoco', 'jantar'],
    tempoPrep: 10,
    tempoCozimento: 15,
    porcoes: 2,
    caloriasTotal: 900,
    proteina: 52,
    carbs: 110,
    gordura: 18,
    japaoFriendly: true,
    tags: ['reconfortante', 'familia', 'economico'],
    emoji: '🍜',
    ingredientes: [
      { nome: 'Macarrão yakisoba fresco (中華麺)', quantidade: '2 porções (300g)', onde: 'Todo supermercado — seção de massas frescas' },
      { nome: 'Peito de frango', quantidade: '300g' },
      { nome: 'Repolho', quantidade: '¼ cabeça' },
      { nome: 'Cenoura', quantidade: '1 unidade' },
      { nome: 'Cebola', quantidade: '1 unidade' },
      { nome: 'Molho yakisoba', quantidade: '3 colheres de sopa', onde: 'オタフク ソース — todo supermercado' },
      { nome: 'Shoyu', quantidade: '1 colher de sopa' },
      { nome: 'Azeite ou óleo', quantidade: '2 colheres de sopa' },
      { nome: 'Katsuobushi (optional)', quantidade: 'a gosto', onde: 'かつお節 — todo supermercado' },
    ],
    passos: [
      'Corte o frango em tiras finas, tempere com sal e pimenta.',
      'Fatie fino: repolho, cenoura em julienne, cebola em meia-lua.',
      'Aqueça o wok (ou frigideira grande) com óleo em fogo alto.',
      'Grelhe o frango até dourar. Reserve.',
      'Na mesma panela, refogue cebola e cenoura por 2 min. Adicione o repolho.',
      'Adicione o macarrão fresco (sem precisar cozinhar antes) e o molho yakisoba + shoyu.',
      'Misture bem em fogo alto por 2-3 min. Devolva o frango. Sirva com katsuobushi.',
    ],
  },
  {
    id: 'panqueca-banana-aveia',
    titulo: 'Panqueca de Banana e Aveia',
    descricao: 'Café da manhã proteico com apenas 3 ingredientes. Sem farinha de trigo, sem açúcar — funciona com aveia que você acha no Costco ou Kaldi.',
    categoria: 'fitness',
    tipoRefeicao: ['cafe_da_manha', 'lanche'],
    tempoPrep: 5,
    tempoCozimento: 10,
    porcoes: 1,
    caloriasTotal: 300,
    proteina: 14,
    carbs: 45,
    gordura: 7,
    japaoFriendly: true,
    tags: ['sem_gluten', 'sem_acucar', 'rapido', 'fitness'],
    emoji: '🥞',
    ingredientes: [
      { nome: 'Banana madura', quantidade: '1 grande', onde: 'Todo supermercado' },
      { nome: 'Ovos', quantidade: '2 unidades' },
      { nome: 'Aveia em flocos', quantidade: '4 colheres de sopa', onde: 'Costco, Kaldi ou Amazon.jp' },
      { nome: 'Canela em pó', quantidade: '½ colher de chá', onde: 'Kaldi ou importados' },
      { nome: 'Óleo de coco ou manteiga', quantidade: '1 colher de chá' },
    ],
    passos: [
      'Amasse bem a banana com um garfo até virar purê liso.',
      'Misture os ovos, aveia e canela. A massa ficará um pouco grossa.',
      'Aqueça uma frigideira antiaderente com óleo em fogo médio-baixo.',
      'Despeje ¼ da massa por panqueca (ficam 4 pequenas).',
      'Cozinhe 2-3 min até as bordas firmarem e surgirem bolhas. Vire com cuidado.',
      'Mais 1-2 min do outro lado. Sirva com mel ou geleia de morango.',
    ],
  },
  {
    id: 'salada-frango-edamame',
    titulo: 'Salada de Frango e Edamame',
    descricao: 'Salada proteica com o edamame — um dos ingredientes mais saudáveis e baratos do Japão. Alta proteína, baixo carboidrato.',
    categoria: 'fitness',
    tipoRefeicao: ['almoco', 'jantar'],
    tempoPrep: 10,
    tempoCozimento: 10,
    porcoes: 1,
    caloriasTotal: 380,
    proteina: 42,
    carbs: 18,
    gordura: 14,
    japaoFriendly: true,
    tags: ['alto_proteina', 'baixo_carb', 'sem_cozimento_complexo', 'marmita'],
    emoji: '🥗',
    ingredientes: [
      { nome: 'Peito de frango grelhado', quantidade: '200g' },
      { nome: 'Edamame cozido (sem casca)', quantidade: '100g', onde: 'Congelado — 枝豆 — todo supermercado' },
      { nome: 'Pepino japonês', quantidade: '1 unidade', onde: 'きゅうり — todo supermercado' },
      { nome: 'Alface ou mix de folhas', quantidade: '2 xícaras' },
      { nome: 'Shoyu', quantidade: '1 colher de sopa' },
      { nome: 'Óleo de gergelim', quantidade: '1 colher de chá' },
      { nome: 'Vinagre de arroz', quantidade: '1 colher de sopa', onde: '米酢 — todo supermercado' },
      { nome: 'Gergelim torrado', quantidade: '1 colher de chá', onde: 'いりごま — todo supermercado' },
    ],
    passos: [
      'Grelhe o frango temperado com sal e pimenta. Deixe esfriar e desfie ou fatie.',
      'Descongele o edamame conforme embalagem (geralmente 3 min no micro-ondas).',
      'Fatie o pepino em rodelas finas.',
      'Monte a salada: folhas, frango, edamame e pepino.',
      'Misture o molho: shoyu + óleo de gergelim + vinagre de arroz.',
      'Regue a salada, finalize com gergelim torrado.',
    ],
  },
  {
    id: 'onigiri-atum',
    titulo: 'Onigiri de Atum (Riceballs)',
    descricao: 'O lanche perfeito para o trabalho. Muito mais gostoso do que o do konbini e você controla as calorias.',
    categoria: 'japonesa',
    tipoRefeicao: ['lanche', 'almoco'],
    tempoPrep: 15,
    tempoCozimento: 0,
    porcoes: 3,
    caloriasTotal: 480,
    proteina: 24,
    carbs: 78,
    gordura: 6,
    japaoFriendly: true,
    tags: ['marmita', 'konbini_caseiro', 'economico'],
    emoji: '🍙',
    ingredientes: [
      { nome: 'Arroz japonês cozido', quantidade: '2 xícaras (cozido)', onde: 'Cozido na panela elétrica' },
      { nome: 'Atum em lata no próprio suco', quantidade: '1 lata (140g)', onde: 'まぐろ水煮 — todo supermercado' },
      { nome: 'Maionese japonesa (Kewpie)', quantidade: '1 colher de sopa', onde: 'キューピー — todo supermercado' },
      { nome: 'Shoyu', quantidade: '1 colher de chá' },
      { nome: 'Nori (alga em folha)', quantidade: '3 tiras', onde: '海苔 — todo supermercado' },
      { nome: 'Sal', quantidade: 'a gosto' },
    ],
    passos: [
      'Misture atum escorrido + maionese Kewpie + shoyu. Reserve.',
      'Molhe as mãos com água fria e esfregue um pouco de sal.',
      'Pegue ⅔ xícara de arroz nas mãos. Abra um buraco no centro.',
      'Coloque 1 colher do recheio de atum no centro.',
      'Feche o arroz em volta do recheio e modele em triângulo.',
      'Envolva a base com uma tira de nori. Sirva imediatamente ou embrulhe em plástico para marmita.',
    ],
  },
  {
    id: 'frango-brocolis',
    titulo: 'Frango Grelhado com Brócolis ao Alho',
    descricao: 'O prato fitness por excelência. Simples, rápido e eficaz. Brócolis (ブロッコリー) é barato e facilmente encontrado no Japão.',
    categoria: 'fitness',
    tipoRefeicao: ['almoco', 'jantar'],
    tempoPrep: 5,
    tempoCozimento: 15,
    porcoes: 1,
    caloriasTotal: 290,
    proteina: 42,
    carbs: 10,
    gordura: 9,
    japaoFriendly: true,
    tags: ['alto_proteina', 'baixo_carb', 'sem_gluten', 'rapido', 'fitness'],
    emoji: '🥦',
    ingredientes: [
      { nome: 'Peito de frango', quantidade: '200g' },
      { nome: 'Brócolis', quantidade: '1 cabeça pequena (200g)', onde: 'ブロッコリー — todo supermercado' },
      { nome: 'Alho', quantidade: '3 dentes' },
      { nome: 'Azeite', quantidade: '1 colher de sopa', onde: 'Kaldi, importados ou Amazon.jp' },
      { nome: 'Sal e pimenta', quantidade: 'a gosto' },
      { nome: 'Suco de limão', quantidade: '½ limão', onde: 'レモン — todo supermercado' },
    ],
    passos: [
      'Tempere o frango com sal, pimenta e metade do suco de limão. Deixe 5 min.',
      'Corte o brócolis em floretes. Cozinhe no micro-ondas com 2 colheres de água por 3 min (fica crocante).',
      'Grelhe o frango em frigideira com metade do azeite — 5-6 min por lado em fogo médio.',
      'Na mesma frigideira, refogue o alho fatiado com o restante do azeite por 1 min.',
      'Adicione o brócolis e refogue por 2 min com o alho.',
      'Sirva frango e brócolis com o restante do suco de limão por cima.',
    ],
  },
  {
    id: 'smoothie-banana-soja',
    titulo: 'Smoothie de Banana com Leite de Soja',
    descricao: 'Café da manhã rápido e nutritivo. O leite de soja Kikkoman tem sabor neutro perfeito para smoothies.',
    categoria: 'fitness',
    tipoRefeicao: ['cafe_da_manha', 'lanche'],
    tempoPrep: 5,
    tempoCozimento: 0,
    porcoes: 1,
    caloriasTotal: 220,
    proteina: 9,
    carbs: 38,
    gordura: 4,
    japaoFriendly: true,
    tags: ['sem_cozimento', 'rapido', 'vegano', 'cafe_da_manha'],
    emoji: '🥤',
    ingredientes: [
      { nome: 'Banana congelada', quantidade: '1 grande', onde: 'Congele banana madura antecipadamente' },
      { nome: 'Leite de soja sem açúcar', quantidade: '200ml', onde: 'キッコーマン豆乳 — todo supermercado' },
      { nome: 'Mel', quantidade: '1 colher de chá', onde: 'はちみつ — todo supermercado' },
      { nome: 'Canela', quantidade: '¼ colher de chá' },
      { nome: 'Proteína em pó (opcional)', quantidade: '1 scoop', onde: 'Amazon.jp — WPC Whey' },
    ],
    passos: [
      'Bata tudo no liquidificador até ficar homogêneo.',
      'Se não tiver liquidificador, use um mixer (handy blender — 泡立て器 elétrico funciona).',
      'Ajuste a consistência: mais leite para mais líquido, mais banana para mais espesso.',
      'Sirva imediatamente — banana oxida rápido.',
    ],
  },
]

// Helpers
export const CATEGORIAS: { key: Categoria | 'todos'; label: string; emoji: string }[] = [
  { key: 'todos',      label: 'Todas',      emoji: '🍽' },
  { key: 'brasileira', label: 'Brasileira', emoji: '🇧🇷' },
  { key: 'japonesa',   label: 'Japonesa',   emoji: '🇯🇵' },
  { key: 'fusion',     label: 'Fusion',     emoji: '🔀' },
  { key: 'fitness',    label: 'Fitness',    emoji: '💪' },
]

export function buscarReceitas(query: string, categoria: string): Receita[] {
  let resultado = RECEITAS

  if (categoria && categoria !== 'todos') {
    resultado = resultado.filter(r => r.categoria === categoria)
  }

  if (query.trim()) {
    const q = query.toLowerCase()
    resultado = resultado.filter(r =>
      r.titulo.toLowerCase().includes(q) ||
      r.tags.some(t => t.includes(q)) ||
      r.ingredientes.some(i => i.nome.toLowerCase().includes(q))
    )
  }

  return resultado
}

export function getReceita(id: string): Receita | undefined {
  return RECEITAS.find(r => r.id === id)
}
