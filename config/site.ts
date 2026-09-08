// ============================================================================
//  GOLDEN EYE PRODS. — CONFIGURAÇÃO CENTRAL
//
//  >>> ESTE É O ÚNICO ARQUIVO QUE VOCÊ PRECISA EDITAR. <<<
//  Tudo marcado com  >>> SUBSTITUIR  são dados que ainda faltam.
//
//  ESTRUTURA DO SITE:
//    /                      → a produtora (marca, manifesto, agenda, arquivo)
//    /eventos               → todos os eventos
//    /eventos/<slug>        → a página (LP) de cada evento
//
//  PARA CRIAR UM EVENTO NOVO: copie um bloco da lista `eventos` lá embaixo,
//  troque o slug e os dados, e rode `npm run db:seed`. Pronto — ele ganha
//  página própria, contador, venda de ingresso e entra na agenda da home.
//
//  ATENÇÃO: este arquivo é lido também pelo script de seed, que roda fora do
//  Next.js. Por isso ele não pode ter `import` de nada.
// ============================================================================

// ----------------------------------------------------------------------------
//  A PRODUTORA
// ----------------------------------------------------------------------------
export const produtora = {
  nome: 'Golden Eye Prods.',
  nomeCurto: 'Golden Eye',
  tagline: 'Rock psicodélico, ritual e reverberação',

  manifesto:
    'Sebo, café, o que aparecer. A gente pega um espaço que não é palco e ' +
    'faz virar palco por uma noite — em Joinville, com fuzz, projeção e ' +
    'entrada por doação.',

  descricao:
    'A Golden Eye Prods. nasceu da vontade de transformar a noite em ritual. ' +
    'Produzimos eventos de rock psicodélico onde luz, som e imagem se dissolvem ' +
    'numa mesma viagem — do fuzz saturado à discotecagem que atravessa a ' +
    'madrugada. Começamos em Joinville, entre as estantes de um sebo, ' +
    'tocando Raul Seixas e Pink Floyd em troca de doações para o Lar ' +
    'Betânia. A ideia segue a mesma: ocupar espaços improváveis e devolver ' +
    'alguma coisa para a cidade.',

  // >>> CONFIRMAR: a razão social exata que consta no cartão CNPJ
  razaoSocial: 'GOLDEN EYE PRODUÇÕES LTDA',
  cnpj: '40.561.137/0001-30',

  // Cidade base. Aparece no SEO e nos dados estruturados — é o que faz o
  // site ser achado por quem busca "show de rock em Joinville".
  cidade: 'Joinville',
  estado: 'SC',

  email: 'goldeneyeprodutora@gmail.com',
  emailIngressos: 'goldeneyeprodutora@gmail.com',
  whatsapp: '5547996665826', // internacional, só dígitos
  whatsappLabel: '(47) 99666-5826',

  redes: {
    instagram: 'https://www.instagram.com/goldeneye.prods/',
    // Por ora o canal do Delírio Parabólico.
    // >>> TROCAR quando o canal próprio da Golden Eye existir.
    youtube: 'https://www.youtube.com/@DelírioParabólico',
    spotify: '',
    tiktok: '',
  },

  // Quem desenvolveu o site — assinatura discreta no rodapé
  desenvolvidoPor: {
    nome: 'Zopu',
    logo: '/imagens/marca/zopu.png',
    // >>> CONFIRMAR: a URL do site da Zopu
    url: 'https://zopu.com.br',
  },

  // Os pilares mostrados na home
  pilares: [
    { titulo: 'Rock', texto: 'Psicodélico, garage, krautrock e o que vier junto.' },
    { titulo: 'Fora do eixo', texto: 'Espaço que não é casa de show é onde a gente prefere tocar.' },
    { titulo: 'Sem catraca', texto: 'Até hoje, toda edição foi de graça e em troca de doação.' },
  ],
}

// ----------------------------------------------------------------------------
//  TIPOS
// ----------------------------------------------------------------------------
export interface Ato {
  horario: string
  titulo: string
  descricao: string
  /** true = atração principal, ganha destaque visual e entra no SEO */
  destaque: boolean
}

export interface LoteConfig {
  nome: string
  tipo: 'inteira' | 'meia'
  /** SEMPRE em centavos, inteiro. 6000 = R$ 60,00. Nunca use float p/ dinheiro. */
  precoCentavos: number
  quantidade: number
  ordem: number
}

export interface EventoConfig {
  /** vira a URL: /eventos/<slug> */
  slug: string
  nome: string
  subtitulo: string
  descricao: string

  /** ISO com fuso de São Paulo (-03:00) */
  dataInicio: string
  aberturaPortoes: string
  /** quando termina (opcional) — vira "17h às 21h" na página e no Google */
  dataFim?: string

  local: string
  endereco: string
  /** link "Incorporar um mapa" do Google Maps (opcional) */
  mapaEmbed: string
  mapaLink: string

  classificacaoEtaria: string
  capacidade: number

  lineup: Ato[]
  permitido: string[]
  proibido: string[]

  /** false = a página existe, mas não vende ingresso pelo site */
  vendaAberta: boolean
  lotes: LoteConfig[]

  /**
   * Para eventos sem venda de ingresso — entrada franca, por doação, por
   * convite. Se preenchido, a LP mostra este bloco no lugar do checkout,
   * em vez de um "vendas em breve" que não faria sentido.
   *
   * `link` é para quando a inscrição acontece fora do site (Sympla, por
   * exemplo). Vira o botão principal do bloco.
   */
  entrada?: {
    titulo: string
    texto: string
    link?: { rotulo: string; url: string; nota?: string }
  }

  /** imagem de fundo do hero da LP (opcional) */
  imagemHero?: string
  /** cartaz do evento (opcional) — exibido na página e usado no card */
  cartaz?: string
  /** recorte 1200x630 do cartaz, para a prévia do link */
  cartazOg?: string
  /** quem assina a arte */
  cartazCredito?: string
  /** fotos do evento, depois que ele acontece */
  galeria?: string[]

  /** linhas extras de crédito, ex.: apoio cultural, causa apoiada */
  creditos?: { rotulo: string; valor: string }[]

  /**
   * Vídeos do YouTube deste evento.
   * O `id` é a parte depois de "v=" na URL:
   *   https://www.youtube.com/watch?v=ABC123xyz   →   id: 'ABC123xyz'
   * Só a miniatura é carregada; o player entra quando a pessoa clica.
   */
  videos?: { id: string; titulo: string; descricao?: string }[]
}

// ----------------------------------------------------------------------------
//  OS EVENTOS
//  O mais recente primeiro. A home separa sozinha o que é futuro e passado.
// ----------------------------------------------------------------------------
export const eventos: EventoConfig[] = [
  // ==========================================================================
  //  TROPICÁLIA & ROCK NACIONAL — sábado, 12/09, 17h
  //  Johann Sebastian K. sozinho: show autoral/cover + discotecagem própria.
  //  NÃO é show de banda — o Delírio Parabólico não toca nesta data.
  //  Solidário: entrada por doação ao Lar Betânia, sem venda de ingresso.
  //  >>> FALTA: a arte e a capacidade do espaço.
  // ==========================================================================
  {
    // O slug fica como está: quem já tiver o link não perde a página.
    slug: 'tropicalia-sessions',
    nome: 'Tropicália & Rock Nacional',
    subtitulo: 'Johann Sebastian K. — voz, violão e discotecagem em vinil',

    dataInicio: '2026-09-12T17:00:00-03:00',
    aberturaPortoes: '2026-09-12T16:30:00-03:00',
    dataFim: '2026-09-12T21:00:00-03:00',

    local: 'Salvador Vegan Café',
    endereco: 'Rua Henrique Meyer, 61 — Centro, Joinville/SC · CEP 89201-000',
    // >>> SUBSTITUIR: cole o link "Incorporar um mapa" do Google Maps
    mapaEmbed: '',
    mapaLink:
      'https://maps.google.com/?q=Rua+Henrique+Meyer,+61+-+Centro,+Joinville+-+SC,+89201-000',

    classificacaoEtaria: 'Livre',
    // >>> SUBSTITUIR: capacidade do espaço
    capacidade: 120,

    // O cartaz é a capa do evento, a arte exibida na página e a prévia do
    // link. A versão og é um recorte 1200x630 do miolo, porque o cartaz é
    // 2:3 e o WhatsApp corta as pontas de imagem alta.
    imagemHero: '/imagens/cartazes/tropicalia-cartaz.jpg',
    cartaz: '/imagens/cartazes/tropicalia-cartaz.jpg',
    cartazOg: '/imagens/cartazes/tropicalia-og.jpg',
    cartazCredito: 'Arte por Ana Heloiza Alves de Oliveira',

    descricao:
      'Em 1968 um punhado de gente decidiu que era possível engolir tudo de ' +
      'uma vez — a guitarra elétrica e o berimbau, o Beatles e o baião — e ' +
      'devolver aquilo em forma de canção. Aqui é Johann Sebastian K. ' +
      'sozinho, atravessando esse repertório em formato reduzido: Os ' +
      'Mutantes, Raul Seixas e o que mais a tarde pedir. Depois do show, ele ' +
      'mesmo assume a discotecagem e a viagem continua no vinil.',

    lineup: [
      {
        horario: '16:30',
        titulo: 'Abertura da casa',
        descricao:
          'Aquecimento, recepção das doações e o café já servindo.',
        destaque: false,
      },
      {
        horario: '17:00',
        titulo: 'Johann Sebastian K.',
        descricao:
          'Voz e violão. Os Mutantes, Raul Seixas e o melhor do rock ' +
          'nacional dos anos 60 e 70, em formato reduzido.',
        destaque: true,
      },
      {
        horario: '19:00',
        titulo: 'Discotecagem — Johann Sebastian K.',
        descricao:
          'O mesmo ouvido, agora nos discos. Tropicália, psicodelia ' +
          'brasileira e rock nacional em vinil.',
        destaque: false,
      },
      {
        horario: '21:00',
        titulo: 'Encerramento',
        descricao: 'O café serve normalmente durante toda a tarde.',
        destaque: false,
      },
    ],

    permitido: [
      'Alimento não perecível, roupa ou doação em dinheiro',
      'O café funciona normalmente, com o cardápio vegano',
    ],

    proibido: [],

    vendaAberta: false,

    entrada: {
      titulo: 'Entrada solidária',
      texto:
        'A entrada é uma doação ao Lar Betânia, de Joinville. Leve alimento ' +
        'não perecível, peça de roupa em bom estado ou uma contribuição em ' +
        'dinheiro — tudo vai direto para o lar.',
      link: {
        rotulo: 'Garantir minha vaga',
        url: 'https://www.sympla.com.br/evento/johann-sebastian-k-tropicalia-rock-nacional/3570721',
        nota:
          'A inscrição no Sympla é gratuita e não substitui a doação — ela ' +
          'serve só para sabermos quanta gente esperar, já que o espaço é ' +
          'limitado.',
      },
    },

    creditos: [
      { rotulo: 'Doações revertidas ao', valor: 'Lar Betânia — Joinville' },
      { rotulo: 'Espaço', valor: 'Salvador Vegan Café' },
      { rotulo: 'Entrada', valor: 'Alimento, roupa ou doação em dinheiro' },
    ],

    lotes: [],
  },

  // ==========================================================================
  //  TO THE OTHER SIDE — 20/11
  // ==========================================================================
  {
    slug: 'totheotherside',
    nome: 'TO THE OTHER SIDE',
    subtitulo: 'Uma noite de tributo, fuzz e viagem',

    dataInicio: '2026-11-20T19:00:00-03:00',
    aberturaPortoes: '2026-11-20T19:00:00-03:00',

    local: 'Hangar7',
    // >>> SUBSTITUIR: endereço completo do Hangar7
    endereco: 'Joinville/SC', // >>> SUBSTITUIR pelo endereço completo do Hangar7
    // >>> SUBSTITUIR: cole o link "Incorporar um mapa" do Google Maps
    mapaEmbed: '',
    mapaLink: 'https://maps.google.com/?q=Hangar7+Joinville',

    classificacaoEtaria: '18 anos',
    // >>> SUBSTITUIR: capacidade real da casa
    capacidade: 400,

    descricao:
      'Break on through. TO THE OTHER SIDE é uma travessia em três atos: o ' +
      'tributo que invoca os Doors, o fuzz original que empurra o chão pra ' +
      'longe, e a discotecagem que segura a viagem até o sol raiar. Luz, ' +
      'projeção e reverb — do outro lado.',

    imagemHero: '/imagens/hero-beco.jpg',

    lineup: [
      {
        horario: '19:00',
        titulo: 'Abertura dos portões',
        descricao: 'Discotecagem de recepção, projeções e mercado de arte.',
        destaque: false,
      },
      {
        horario: '21:00',
        titulo: 'Delírio Parabólico',
        descricao:
          'Rock psicodélico autoral. Fuzz, delay infinito e uma parede de som ' +
          'que vira paisagem.',
        destaque: true,
      },
      {
        horario: '22:30',
        titulo: 'Reverb Band',
        descricao:
          'Tributo a The Doors. O repertório inteiro do Rei Lagarto, do órgão ' +
          'Vox Continental ao último grito.',
        destaque: true,
      },
      {
        horario: '00:00',
        titulo: 'Discotecagem',
        descricao:
          'Psicodelia dos anos 60 e 70, krautrock, garage e o que mais couber ' +
          'na madrugada.',
        destaque: false,
      },
    ],

    permitido: [
      'Documento com foto (obrigatório)',
      'Comprovante de meia-entrada, se for o caso',
      'Protetor auricular',
    ],
    proibido: [
      'Bebidas e alimentos de fora',
      'Garrafas, latas e objetos de vidro',
      'Qualquer tipo de arma ou objeto cortante',
      'Guarda-chuvas de ponta metálica',
    ],

    vendaAberta: true,

    // >>> SUBSTITUIR: preços e quantidades reais.
    // A Lei 12.933/13 exige no mínimo 40% do total em meia-entrada — o
    // `npm run db:seed` recusa rodar se ficar abaixo disso.
    lotes: [
      { nome: '1º Lote — Inteira', tipo: 'inteira', precoCentavos: 6000, quantidade: 120, ordem: 1 },
      { nome: '1º Lote — Meia-entrada', tipo: 'meia', precoCentavos: 3000, quantidade: 80, ordem: 2 },
      { nome: '2º Lote — Inteira', tipo: 'inteira', precoCentavos: 8000, quantidade: 120, ordem: 3 },
      { nome: '2º Lote — Meia-entrada', tipo: 'meia', precoCentavos: 4000, quantidade: 80, ordem: 4 },
    ],
  },

  // ==========================================================================
  //  EDIÇÃO ANTERIOR
  //  Fica no ar para sempre: é prova social, memória e SEO da produtora.
  // ==========================================================================
  {
    slug: 'concerto-solidario',
    nome: 'Concerto Solidário de Rock Psicodélico',
    subtitulo: 'Delírio Parabólico entre as estantes do O Sebo',

    dataInicio: '2026-08-14T19:00:00-03:00',
    aberturaPortoes: '2026-08-14T19:00:00-03:00',

    local: 'O Sebo',
    endereco: 'Joinville/SC', // >>> SUBSTITUIR pelo endereço completo, se quiser
    mapaEmbed: '',
    mapaLink: '',

    classificacaoEtaria: 'Livre',
    capacidade: 120,

    descricao:
      'A primeira edição da Golden Eye. Delírio Parabólico tocando Raul ' +
      'Seixas, Os Mutantes, Pink Floyd e The Beatles no meio das estantes do ' +
      'O Sebo. A entrada foi uma doação de alimento, roupa ou dinheiro ao Lar ' +
      'Betânia — e a casa encheu.',

    // A banda inteira é uma capa muito melhor que o cartaz para o card.
    imagemHero: '/imagens/eventos/2026-08-concerto-solidario/foto-01.jpg',
    cartaz: '/imagens/eventos/cartaz-2026-08.png',

    lineup: [
      {
        horario: '19:00',
        titulo: 'Delírio Parabólico',
        descricao:
          'Raul Seixas, Os Mutantes, Pink Floyd e The Beatles, entre livros.',
        destaque: true,
      },
    ],

    permitido: [],
    proibido: [],

    vendaAberta: false,
    lotes: [],

    creditos: [
      { rotulo: 'Apoio cultural', valor: 'O Sebo' },
      { rotulo: 'Doações revertidas ao', valor: 'Lar Betânia — Joinville' },
      { rotulo: 'Entrada', valor: 'Alimento, roupa ou doação em dinheiro' },
    ],

    // >>> SUBSTITUIR: cole os ids dos vídeos do canal Delírio Parabólico.
    // Da URL https://www.youtube.com/watch?v=ABC123xyz  use  id: 'ABC123xyz'
    // Enquanto a lista estiver vazia, a seção de vídeos simplesmente não aparece.
    videos: [
      {
        id: 'RFNxL4hsnLM',
        titulo: 'Como Vovó Já Dizia — Raul Seixas',
        descricao: 'Cover do Delírio Parabólico, ao vivo no O Sebo.',
      },
      // Para adicionar mais, copie o trecho depois de "v=" na URL do YouTube:
      // https://www.youtube.com/watch?v=ABC123xyz  →  id: 'ABC123xyz'
    ],

    // As 3 fotos selecionadas da edição.
        galeria: Array.from(
      { length: 3 },
      (_, i) =>
        `/imagens/eventos/2026-08-concerto-solidario/foto-${String(i + 1).padStart(2, '0')}.jpg`
    ),
  },
]

// ----------------------------------------------------------------------------
//  AJUDANTES
// ----------------------------------------------------------------------------
export function eventoPorSlug(slug: string): EventoConfig | undefined {
  return eventos.find((e) => e.slug === slug)
}

/** Um evento é "futuro" até a hora em que ele começa. */
export function ehFuturo(e: EventoConfig): boolean {
  return new Date(e.dataInicio).getTime() > Date.now()
}

/** Agenda: do mais próximo ao mais distante. */
export function proximosEventos(): EventoConfig[] {
  return eventos
    .filter(ehFuturo)
    .sort((a, b) => +new Date(a.dataInicio) - +new Date(b.dataInicio))
}

/** Arquivo: do mais recente ao mais antigo. */
export function eventosPassados(): EventoConfig[] {
  return eventos
    .filter((e) => !ehFuturo(e))
    .sort((a, b) => +new Date(b.dataInicio) - +new Date(a.dataInicio))
}

/** O evento em destaque na home. Se não houver futuro, mostra o último. */
export function eventoDestaque(): EventoConfig | undefined {
  return proximosEventos()[0] ?? eventosPassados()[0]
}

/** Todos os vídeos de todas as edições, para a home. */
export function todosOsVideos(): { id: string; titulo: string; descricao?: string }[] {
  return eventos.flatMap((e) =>
    (e.videos ?? []).map((v) => ({
      ...v,
      // na home, o título ganha o nome da edição para dar contexto
      descricao: v.descricao ?? e.nome,
    }))
  )
}

/** Todas as fotos de todas as edições, para a galeria geral da home. */
export function todasAsFotos(): { src: string; evento: string; slug: string }[] {
  return eventos.flatMap((e) =>
    (e.galeria ?? []).map((src) => ({ src, evento: e.nome, slug: e.slug }))
  )
}

// ----------------------------------------------------------------------------
//  O CASTING — as bandas com que a produtora trabalha
//
//  Esta seção atende um público diferente do resto do site: aqui quem chega
//  é dono de bar, produtor cultural, quem contrata. Por isso cada banda tem
//  release, formação, repertório e um caminho direto para o orçamento.
//
//  A ordem da lista é a ordem que aparece no site.
// ----------------------------------------------------------------------------
export interface BandaConfig {
  slug: string
  nome: string
  /** uma linha, aparece no card */
  resumo: string
  /** o gênero, curto — vira etiqueta */
  genero: string
  /** cidade de origem */
  cidade: string

  /** os blocos de texto do release */
  conceito: string
  sonoridade: string
  aoVivo: string
  /** opcional: discos, EPs, planos */
  discografia?: string

  /** o que a banda leva ao palco — vira lista de etiquetas */
  formacao: string[]
  /** referências sonoras — vira lista de etiquetas */
  referencias: string[]

  logo?: string
  /** a primeira é a capa */
  fotos: string[]
  videos?: { id: string; titulo: string; descricao?: string }[]

  redes?: { instagram?: string; youtube?: string; spotify?: string }
}

export const bandas: BandaConfig[] = [
  // ==========================================================================
  //  REVERB BAND
  //  >>> REVISAR: escrevi o release a partir do que dava para ver nas fotos
  //  e do fato de ser tributo aos Doors. Corrija o que estiver errado — não
  //  quero texto inventado no ar sobre gente de verdade.
  // ==========================================================================
  {
    slug: 'reverb-band',
    nome: 'Reverb Band',
    resumo: 'O repertório do Rei Lagarto, do órgão ao último grito',
    genero: 'Tributo a The Doors',
    cidade: 'Joinville/SC',

    conceito:
      'A Reverb Band existe para devolver ao palco o repertório que The ' +
      'Doors gravou entre 1967 e 1971 — não como imitação, mas como leitura ' +
      'de banda, com o peso e a liberdade de quem toca junto há tempo.',

    sonoridade:
      'O desenho é o dos Doors: órgão à frente, guitarra de blues elétrico e ' +
      'uma cozinha que segura a viagem sem pressa. Do organ groove de "Light ' +
      'My Fire" ao arrasto sombrio de "Riders on the Storm".',

    aoVivo:
      'Show de banda inteira, construído para casa cheia. O repertório passa ' +
      'pelos hits que todo mundo canta e pelos blocos longos que só fazem ' +
      'sentido ao vivo — quando a música abre e ninguém sabe quando fecha.',

    formacao: ['Vocal', 'Teclados / órgão', 'Guitarra', 'Baixo', 'Bateria'],
    referencias: ['The Doors', 'Blues elétrico', 'Psicodelia dos anos 60'],

    logo: '/imagens/bandas/reverbband/logo.png',
    fotos: [
      '/imagens/bandas/reverbband/img-2616.jpg',
      '/imagens/bandas/reverbband/img-8028.jpg',
      '/imagens/bandas/reverbband/img-7931.jpg',
      '/imagens/bandas/reverbband/img-7959.jpg',
      '/imagens/bandas/reverbband/img-2599.jpg',
    ],

    // >>> SUBSTITUIR: as redes da Reverb Band
    redes: {},
  },

  // ==========================================================================
  //  DELÍRIO PARABÓLICO
  // ==========================================================================
  {
    slug: 'delirio-parabolico',
    nome: 'Delírio Parabólico',
    resumo: 'Rock psicodélico autoral e a contracultura dos anos 60 e 70',
    genero: 'Rock psicodélico',
    cidade: 'Joinville/SC',

    conceito:
      'O Delírio Parabólico é uma banda de rock psicodélico que resgata a ' +
      'essência da contracultura e da vanguarda dos anos 60 e 70. O projeto ' +
      'une a energia das apresentações ao vivo com a reverência aos clássicos ' +
      'da época, criando um repertório híbrido que transita com naturalidade ' +
      'entre homenagens e composições próprias.',

    sonoridade:
      'A identidade sonora flutua entre o rock progressivo, a lisergia ' +
      'clássica e o rock barroco. Com raízes cravadas na ousadia d\'Os ' +
      'Mutantes, no experimentalismo de estúdio dos Beatles, nas atmosferas ' +
      'espaciais do Pink Floyd e na acidez filosófica de Raul Seixas, a banda ' +
      'constrói um som robusto que reverencia seus ídolos enquanto consolida ' +
      'a própria voz.',

    aoVivo:
      'No palco, o Delírio Parabólico entrega uma performance imersiva de ' +
      'banda, equilibrando a execução de covers consagrados com o impacto do ' +
      'material autoral. Com arranjos ricos que envolvem vocais expressivos, ' +
      'guitarras, teclados, sintetizadores e flauta, a apresentação é ' +
      'construída para transportar o público direto para a efervescência ' +
      'musical da época.',

    discografia:
      'Prestes a estrear o primeiro EP, antecedido por um single duplo, a ' +
      'banda tem um roteiro claro de expansão: da densidade atmosférica e ' +
      'progressiva de "Céu de Outono", inspirada na fase final de David ' +
      'Gilmour, passando pela energia hard rock setentista do disco homônimo ' +
      '"Delírio Parabólico", até as texturas do futuro "Hotel Lunar Base ' +
      'Tranquila".',

    formacao: [
      'Vocais',
      'Guitarras',
      'Teclados e sintetizadores',
      'Flauta',
      'Baixo',
      'Bateria',
      'Saxofone',
    ],
    referencias: [
      'Os Mutantes',
      'The Beatles',
      'Pink Floyd',
      'Raul Seixas',
      'Rock progressivo',
    ],

    fotos: [
      '/imagens/bandas/delirioparabolico/banda-01-completa.jpg',
      '/imagens/bandas/delirioparabolico/banda-02-tocando.jpg',
      '/imagens/bandas/delirioparabolico/banda-03-plano-de-cima.jpg',
      '/imagens/bandas/delirioparabolico/integrante-01.jpg',
      '/imagens/bandas/delirioparabolico/integrante-02-sax.jpg',
      '/imagens/bandas/delirioparabolico/integrante-03-violao.jpg',
      '/imagens/bandas/delirioparabolico/integrante-04-baixo.jpg',
      '/imagens/bandas/delirioparabolico/integrante-05-guitarra.jpg',
      '/imagens/bandas/delirioparabolico/integrante-06-teclado.jpg',
    ],

    videos: [
      {
        id: 'RFNxL4hsnLM',
        titulo: 'Como Vovó Já Dizia — Raul Seixas',
        descricao: 'Ao vivo no O Sebo, Joinville.',
      },
    ],

    redes: { youtube: 'https://www.youtube.com/@DelírioParabólico' },
  },
]

export function bandaPorSlug(slug: string): BandaConfig | undefined {
  return bandas.find((b) => b.slug === slug)
}

// ----------------------------------------------------------------------------
//  REGRAS DE VENDA
// ----------------------------------------------------------------------------
/** Máximo de ingressos por CPF, para dificultar cambista. */
export const MAX_INGRESSOS_POR_CPF = 6

/** Minutos até o PIX expirar e a reserva voltar ao estoque. */
export const MINUTOS_EXPIRACAO_PIX = 30

// ----------------------------------------------------------------------------
//  FAQ (vale para todos os eventos)
// ----------------------------------------------------------------------------
export const faq = [
  {
    p: 'Como recebo meu ingresso?',
    r:
      'Assim que o PIX é confirmado (leva segundos), o ingresso com QR Code vai ' +
      'automaticamente para o seu e-mail, em PDF e também na tela. Ele fica ' +
      'sempre disponível na página Meus Ingressos.',
  },
  {
    p: 'Quem tem direito à meia-entrada?',
    r:
      'Conforme a Lei 12.933/2013: estudantes, pessoas com deficiência e um ' +
      'acompanhante, pessoas com 60 anos ou mais, e jovens de 15 a 29 anos de ' +
      'baixa renda inscritos no CadÚnico. A comprovação é obrigatória na entrada ' +
      '— sem documento válido, será cobrada a diferença para a inteira.',
  },
  {
    p: 'Posso transferir meu ingresso para outra pessoa?',
    r:
      'Sim. Entre em Meus Ingressos, escolha o ingresso e troque o nome e o CPF ' +
      'do titular até 24 horas antes da abertura dos portões. Depois disso o ' +
      'ingresso fica travado no nome cadastrado.',
  },
  {
    p: 'E se eu desistir? Tem reembolso?',
    r:
      'Tem. Pelo Artigo 49 do Código de Defesa do Consumidor você pode cancelar ' +
      'e receber 100% do valor de volta em até 7 dias corridos após o pagamento, ' +
      'desde que faça o pedido com no mínimo 48 horas de antecedência da abertura ' +
      'dos portões. Dá pra fazer sozinho, na página Meus Ingressos, e o dinheiro ' +
      'volta pelo mesmo PIX.',
  },
  {
    p: 'Esqueci de levar o celular carregado. E agora?',
    r:
      'Sem problema. Nossa equipe consegue localizar sua compra na portaria pelo ' +
      'seu nome ou CPF, com documento com foto em mãos.',
  },
  {
    p: 'Os eventos têm acessibilidade?',
    r:
      'Buscamos sempre espaços com acesso para cadeirantes. Se você precisar de ' +
      'qualquer suporte específico, chame a gente no WhatsApp antes do evento ' +
      'que a produção organiza tudo.',
  },
]
