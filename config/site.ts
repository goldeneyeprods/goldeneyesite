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
    'Banda ao vivo, luz, projeção e discotecagem até a madrugada. Cada ' +
    'noite da Golden Eye é uma experiência para todos os sentidos: música, ' +
    'arte e cultura no mesmo ritual, em Joinville.',

  descricao:
    'A Golden Eye Prods. nasceu da vontade de transformar a noite em ritual. ' +
    'Produzimos eventos de rock psicodélico onde luz, som e imagem se dissolvem ' +
    'numa mesma viagem — do fuzz saturado à discotecagem que atravessa a ' +
    'madrugada. Começamos em Joinville, entre as estantes de um sebo, ' +
    'tocando Raul Seixas e Pink Floyd em troca de doações para o Lar ' +
    'Betânia. A ideia segue a mesma: fazer de cada noite uma experiência ' +
    'inteira e devolver alguma coisa para a cidade.',

  // Quem assina a direção artística — aparece no "Quem faz", no rodapé e
  // nos dados estruturados (o Google liga a pessoa à produtora).
  direcao: {
    nome: 'Johann Sebastian K.',
    cargo: 'Fundador e diretor artístico',
  },

  // >>> CONFIRMAR: a razão social exata que consta no cartão CNPJ
  razaoSocial: 'GOLDEN EYE PRODUÇÕES LTDA',
  cnpj: '40.561.137/0001-30',

  // Cidade base. Aparece no SEO e nos dados estruturados — é o que faz o
  // site ser achado por quem busca "show de rock em Joinville".
  cidade: 'Joinville',
  estado: 'SC',

  email: 'goldeneyeprodutora@gmail.com',
  // Recebe as respostas dos e-mails de ingresso (o envio sai de
  // ingressos@goldeneyeprods.com, pelo Resend) e aparece como contato de
  // suporte da compra.
  emailIngressos: 'goldeneyeingresso@gmail.com',
  whatsapp: '554797879551', // internacional, só dígitos
  whatsappLabel: '(47) 9787-9551',

  redes: {
    instagram: 'https://www.instagram.com/goldeneye.prods/',
    // Por ora o canal do Delírio Parabólico.
    // >>> TROCAR quando o canal próprio da Golden Eye existir.
    youtube: 'https://www.youtube.com/@DelírioParabólico',
    spotify: '',
    tiktok: '',
  },

  // Os pilares mostrados na home
  pilares: [
    { titulo: 'Rock', texto: 'Psicodélico, garage e o que vier junto.' },
    { titulo: 'Ritual', texto: 'Luz, projeção e som como uma coisa só.' },
    { titulo: 'Causa', texto: 'Toda edição devolve algo para a cidade.' },
  ],
}

// ----------------------------------------------------------------------------
//  AS MARCAS DE EVENTO — os "universos" da home
//  Corujão: as noites, em bar e casa de show. Psicoelho: o festival
//  médio (Alice no País das Maravilhas). Hórus: o grande, que segue o sol.
//  Nada de referência a substância na arte nem no texto (sem cogumelo, sem
//  "trip"): o psicodélico aqui é estético.
// ----------------------------------------------------------------------------
export type MarcaEvento = 'corujao' | 'psicoelho' | 'horus'

export const universos: {
  marca: MarcaEvento
  nome: string
  /** linha de cima do cartão */
  tipo: string
  texto: string
  /** sem evento à venda: o botão vira "quero ser avisado" pelo WhatsApp */
  aviso: string
  /** sem data marcada, o que aparece no lugar da data */
  status: string
}[] = [
  {
    marca: 'corujao',
    nome: 'Corujão Ácido',
    tipo: 'Noites',
    texto:
      'Madrugada de rock psicodélico com banda ao vivo, luz, projeção e ' +
      'discotecagem. Uma noite para ouvir, ver e sentir.',
    aviso: 'Quero saber da próxima',
    status: 'no caldeirão',
  },
  {
    marca: 'psicoelho',
    nome: 'Psicoelho',
    tipo: 'Festival',
    texto:
      'Pela toca do coelho: cartas, relógios, chá do Chapeleiro, circo e um ' +
      'parque sensorial para todas as idades.',
    aviso: 'Quero ser avisado',
    status: 'no caldeirão',
  },
  {
    marca: 'horus',
    nome: 'Hórus Festival',
    tipo: 'O grande ritual',
    texto:
      'Dois dias seguindo o sol: palco no poente, camping, cinema, circo e ' +
      'vinil até o nascer do dia.',
    aviso: 'Entrar na lista',
    status: 'em criação',
  },
]

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
  /**
   * Lotes com a mesma fase dividem a `quantidade` (a meia e a inteira do
   * mesmo lote, por exemplo) e ficam à venda juntos. Só a menor fase ainda
   * aberta aparece no site: a fase fecha quando passa do `validoAte` ou
   * quando esgota, e a próxima abre na hora.
   */
  fase: number
  /** ISO com fuso de São Paulo; sem data, vale até a abertura dos portões */
  validoAte?: string
  /**
   * Quanto de cada ingresso deste lote vai para doação (centavos). A entrada
   * solidária usa isso; o painel da portaria soma o total a repassar.
   */
  doacaoCentavos?: number
}

/** Quanto a entrada solidária soma à inteira — e repassa ao Lar Betânia. */
export const DOACAO_SOLIDARIA_CENTAVOS = 1000

/**
 * Atalho para o lote com meia, inteira e entrada solidária dividindo a mesma
 * quantidade. O preço informado é o da inteira; a meia é a metade, como manda
 * a lei, e a solidária é a inteira mais DOACAO_SOLIDARIA_CENTAVOS, que vão
 * para o Lar Betânia. Na venda, a meia de cada lote para em 40% da
 * quantidade do lote (lib/lotes.ts).
 */
function lote(
  fase: number,
  nome: string,
  inteiraCentavos: number,
  quantidade: number,
  validoAte?: string
): LoteConfig[] {
  return [
    { nome: `${nome} — Meia-entrada`, tipo: 'meia', precoCentavos: Math.round(inteiraCentavos / 2), quantidade, ordem: fase * 10, fase, validoAte },
    { nome: `${nome} — Inteira`, tipo: 'inteira', precoCentavos: inteiraCentavos, quantidade, ordem: fase * 10 + 1, fase, validoAte },
    {
      nome: `${nome} — Entrada solidária`,
      tipo: 'inteira',
      precoCentavos: inteiraCentavos + DOACAO_SOLIDARIA_CENTAVOS,
      quantidade,
      ordem: fase * 10 + 2,
      fase,
      validoAte,
      doacaoCentavos: DOACAO_SOLIDARIA_CENTAVOS,
    },
  ]
}

export interface EventoConfig {
  /** vira a URL: /eventos/<slug> */
  slug: string
  nome: string
  subtitulo: string
  descricao: string
  /** a marca de evento a que pertence: empresta a cor e o símbolo */
  marca?: MarcaEvento

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
  /** teto de ingressos somando todos os lotes; sem ele, vale a soma dos lotes */
  ingressosAVenda?: number
  /**
   * Meia solidária: qualquer pessoa pode comprar a meia, sem comprovante.
   * Some o aviso de comprovante do site, do e-mail e da portaria.
   */
  meiaSolidaria?: boolean

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
  /**
   * Slugs das bandas cadastradas em `bandas` que tocam neste evento. Viram
   * os blocos "Quem toca" na página do evento, com link para cada banda.
   */
  bandas?: string[]
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
    // Capa: voz e violão com o sax, tocando, na frente do mural do café.
    // O cartaz continua sendo a arte da página e a prévia do link.
    imagemHero: '/imagens/eventos/2026-09-tropicalia/capa-voz-e-sax.jpg',
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

    // 12 fotos escolhidas pelo conceito: o café virando palco, o vinil, os
    // detalhes místicos e a causa. Originais em
    // arquivosbandas/delirioparabolico/tropicaliasessions novas/.
    galeria: Array.from(
      { length: 12 },
      (_, i) => `/imagens/eventos/2026-09-tropicalia/foto-${String(i + 1).padStart(2, '0')}.jpg`
    ),

    lotes: [],
  },

  // ==========================================================================
  //  CORUJÃO ÁCIDO — sexta, 20/11, 19h — ENCERRADO
  //  Nada Basta + Delírio Parabólico, no Hangar7.
  //  Inteira de R$ 20 a R$ 30 conforme o lote; meia-entrada pela metade,
  //  com comprovante, até 40% de cada lote; entrada solidária = inteira +
  //  R$ 10 para o Lar Betânia (o painel da portaria soma o total a repassar).
  //  Os lotes ficam aqui como registro (o seed e a portaria leem daqui);
  //  `vendaAberta: false` tira os botões de compra.
  // ==========================================================================
  {
    // Slug novo junto com o nome; os antigos (/eventos/totheotherside e
    // /eventos/corujao-psicodelico) redirecionam para cá no next.config.mjs.
    slug: 'corujao-acido',
    nome: 'Corujão Ácido',
    marca: 'corujao',
    subtitulo: 'Pink Floyd e psicodelia brasileira, noite adentro',

    dataInicio: '2026-11-20T19:00:00-03:00',
    aberturaPortoes: '2026-11-20T19:00:00-03:00',

    local: 'Hangar7',
    endereco: 'Rua João Ebert, 174 — Comasa, Joinville/SC',
    mapaEmbed:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4001.3273362442383!2d-48.8087199!3d-26.2798882!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94deb10050097acb%3A0xb84defe0e2348ac5!2sHangar%207%20Music%20Bar!5e1!3m2!1spt-BR!2sbr!4v1792429982472!5m2!1spt-BR!2sbr',
    mapaLink: 'https://maps.google.com/?q=Hangar+7+Music+Bar,+Rua+João+Ebert,+174+-+Comasa,+Joinville+-+SC',

    classificacaoEtaria: '18 anos',
    capacidade: 200,

    descricao:
      'Uma noite inteira de psicodelia no Hangar7. O Delírio Parabólico abriu ' +
      'com um set de Pink Floyd: atmosfera, delay e viagem longa. Depois, a ' +
      'Nada Basta subiu de Blumenau com a psicodelia brasileira de Mutantes, ' +
      'Rita Lee e Casa das Máquinas, groove e calor. E a discotecagem seguiu ' +
      'até a coruja cansar.',

    // Capa: a coruja do cartaz, sem os nomes das bandas (não briga com o título).
    imagemHero: '/imagens/cartazes/corujao-capa.jpg',
    cartaz: '/imagens/cartazes/corujao-cartaz.jpg',
    // recorte 1200x630 com os olhos da coruja e as duas bandas
    cartazOg: '/imagens/cartazes/corujao-og.jpg',
    bandas: ['nada-basta', 'delirio-parabolico'],

    lineup: [
      {
        horario: '19:00',
        titulo: 'Abertura da casa',
        descricao: 'Discotecagem de recepção enquanto o Hangar7 enche.',
        destaque: false,
      },
      {
        horario: '21:00',
        titulo: 'Delírio Parabólico',
        descricao:
          'Um set de Pink Floyd, das paisagens longas ao lado escuro da lua.',
        destaque: true,
      },
      {
        horario: '22:30',
        titulo: 'Nada Basta',
        descricao:
          'Psicodelia brasileira, rock setentista e groove, de Mutantes a ' +
          'Casa das Máquinas.',
        destaque: true,
      },
      {
        horario: '00:00',
        titulo: 'Discotecagem',
        descricao:
          'Psicodelia brasileira e gringa dos anos 60 e 70 pela madrugada.',
        destaque: false,
      },
    ],

    permitido: [
      'Documento com foto (obrigatório)',
      'Protetor auricular',
    ],
    proibido: [
      'Bebidas e alimentos de fora',
      'Garrafas, latas e objetos de vidro',
      'Qualquer tipo de arma ou objeto cortante',
    ],

    creditos: [
      { rotulo: 'Entrada solidária', valor: 'R$ 10 de cada uma vão para o Lar Betânia' },
      { rotulo: 'Espaço', valor: 'Hangar7' },
    ],

    vendaAberta: false,

    // Fotos da noite. Originais em arquivosbandas/corujaoacido/ (fora do git).
    // >>> SUBSTITUIR: as duas vieram em baixa resolução (447px e um print de
    // celular) e foram ampliadas com sharp; troque pelos originais quando
    // chegarem, com o mesmo nome.
    galeria: [
      // Johann no baixo, na luz violeta
      '/imagens/eventos/2026-11-corujao-acido/foto-01.jpg',
      // Nada Basta no palco, luz verde e magenta
      '/imagens/eventos/2026-11-corujao-acido/foto-02.jpg',
    ],

    // Ingressos à venda no total, somando todos os lotes. O último lote fica
    // com o que sobrar dos anteriores; o que não for vendido online até a
    // abertura é vendido na porta, pelo preço do último lote.
    // Casa para 200, e este é o total de gente: venda + convites + produção.
    // Eram 190; os 10 de folga foram para a produção (scripts/convites.mts
    // --fora-do-total). Não baixe sem descontar os 26 ingressos de cortesia.
    ingressosAVenda: 200,

    // Cada lote tem meia, inteira e entrada solidária (inteira + R$ 10 para
    // o Lar Betânia) dividindo a mesma quantidade; a meia de cada lote para
    // em 40% dele (16 de 40, 20 de 50, 24 de 60). O lote vira quando a data
    // passa OU quando esgota — o que vier primeiro.
    lotes: [
      ...lote(1, '1º lote', 2000, 40, '2026-11-10T23:59:59-03:00'),
      ...lote(2, '2º lote', 2500, 50, '2026-11-15T23:59:59-03:00'),
      ...lote(3, '3º lote', 3000, 60, '2026-11-19T23:59:59-03:00'),
      ...lote(4, '4º lote', 3000, 190),
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
    bandas: ['delirio-parabolico'],

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

    // A banda, cada integrante e o ambiente do O Sebo.
    galeria: Array.from(
      { length: 13 },
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
  /** 'dj' troca os rótulos da página ("Na cabine", "A noite"); padrão: banda */
  tipo?: 'banda' | 'dj'
  /** uma linha, aparece no card */
  resumo: string
  /** o gênero, curto — vira etiqueta */
  genero: string
  /** carimbo no dossiê da home: o gênero como a banda se define no release */
  carimbo?: string
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

  /**
   * Página de venda (só DJ, por enquanto). Com ela preenchida, /bandas/<slug>
   * vira uma LP para o dono de bar contratar a noite, no lugar do release.
   */
  lp?: {
    chamada: string
    subchamada: string
    pilares: { titulo: string; texto: string }[]
    noite: { duracao: string; titulo: string; texto: string }[]
    noiteNota: string
    /** os shows à escolha da casa */
    lados: {
      lado: string
      /** A, B, C: a letra grande do card */
      letra: string
      nome: string
      resumo: string
      paraQuem: string
      clima: string
      blocos: { titulo: string; duracao: string; texto: string; faixas: string }[]
      /** abertura e saída daquele show */
      nota?: string
    }[]
    quem: { nome: string; papel: string; texto: string; datas: { data: string; texto: string }[] }
    rider: { leva: string[]; bar: string[]; clima: string[] }
    /** o bloco final; sem preço no site */
    contratar: { titulo: string; texto: string; extras: string[] }
  }
}

export const bandas: BandaConfig[] = [
  // ==========================================================================
  //  NADA BASTA
  //  Texto a partir do release e do mídia kit oficiais da banda
  //  (arquivosbandas/nadabasta/midia-kit-nada-basta.pdf).
  // ==========================================================================
  {
    slug: 'nada-basta',
    nome: 'Nada Basta',
    resumo: 'Uma viagem aos anos 70, entre psicodelia e brasilidades',
    genero: 'Rock setentista, brasilidades e psicodelia',
    carimbo: 'Rock clássico',
    cidade: 'Blumenau/SC',

    conceito:
      'A Nada Basta é uma banda de Blumenau que transforma o palco em uma ' +
      'viagem aos anos 70. Formada por músicos jovens apaixonados pela ' +
      'estética clássica do rock, nasceu da vontade de resgatar a energia, a ' +
      'sonoridade e a atmosfera da era mais marcante do gênero.',

    sonoridade:
      'Rock psicodélico, brasilidades e clássicos do rock nacional e ' +
      'internacional num repertório intenso, nostálgico e atual. Inspirada ' +
      'por Led Zeppelin, Rita Lee, Deep Purple, Casa das Máquinas, Cream e ' +
      'Os Mutantes, a banda mistura riffs ' +
      'marcantes, jams hipnotizantes, grooves brasileiros e atmosferas ' +
      'psicodélicas.',

    aoVivo:
      'Visual de época, instrumentos vintage e uma identidade estética forte. ' +
      'Os shows são intensos e imersivos, unem presença de palco e ' +
      'autenticidade, e conectam gerações misturando nostalgia, psicodelia e ' +
      'personalidade própria. Já passaram pelo Schornstein Festival, Ahoy!, ' +
      'Don Under Club, Balbúrdia, Feira da Estação, Jardim Elétrico e Wood ' +
      'Smoked.',

    discografia:
      'Em 16 de outubro de 2026 a banda lançou o primeiro EP autoral, "Antes ' +
      'de Você Pensar, Eu Já Sabia", em todas as plataformas. O repertório ' +
      'passeia entre clássicos, releituras com identidade própria e ' +
      'composições autorais em desenvolvimento.',

    formacao: [
      'Cissa — vocal',
      'John — baixo e backing vocal',
      'Fafá — guitarra e backing vocal',
      'Gabe — bateria e backing vocal',
    ],
    referencias: [
      'Led Zeppelin',
      'Rita Lee',
      'Deep Purple',
      'Casa das Máquinas',
      'Cream',
      'Os Mutantes',
    ],

    logo: '/imagens/bandas/nadabasta/logo.png',
    // A primeira é a capa: foto ao vivo. As ao-vivo-* e integrante-* foram
    // recortadas do mídia kit e são pequenas (até ~700px) — trocar pelos
    // originais quando a banda mandar.
    // capa-ao-vivo-2.jpg é a mescla de ao-vivo-2, ao-vivo-3 e ao-vivo-1 em
    // 1920x1080, para a capa não ficar com zoom numa foto pequena.
    fotos: [
      '/imagens/bandas/nadabasta/capa-ao-vivo-2.jpg',
      '/imagens/bandas/nadabasta/ao-vivo-2.jpg',
      '/imagens/bandas/nadabasta/nadabastastudio-09967.jpg',
      '/imagens/bandas/nadabasta/ao-vivo-1.jpg',
      '/imagens/bandas/nadabasta/integrante-2.jpg',
      '/imagens/bandas/nadabasta/dsc00362.jpg',
      '/imagens/bandas/nadabasta/ao-vivo-3.jpg',
      '/imagens/bandas/nadabasta/integrante-1.jpg',
      '/imagens/bandas/nadabasta/bateria.jpg',
      '/imagens/bandas/nadabasta/nadabastastudio-00354.jpg',
      '/imagens/bandas/nadabasta/integrante-4.jpg',
      '/imagens/bandas/nadabasta/integrante-3.jpg',
      '/imagens/bandas/nadabasta/dsc09978.jpg',
    ],

    redes: {
      instagram: 'https://www.instagram.com/nadabastaaa/',
      spotify: 'https://open.spotify.com/artist/1gDSTPHsN2EjnEdBf92ody',
    },
  },

  // ==========================================================================
  //  DELÍRIO PARABÓLICO
  // ==========================================================================
  {
    slug: 'delirio-parabolico',
    nome: 'Delírio Parabólico',
    resumo: 'Rock psicodélico autoral e a contracultura dos anos 60 e 70',
    genero: 'Rock psicodélico',
    carimbo: 'Rock psicodélico',
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

    // Só o que está para sair: os discos seguintes não entram no site
    // antes da hora.
    discografia:
      'O primeiro EP, "Sinais da Vida", está em fase de masterização e ' +
      'prestes a ser lançado. É o transe inicial da banda: som flutuante, ' +
      'arranjos densos e passagens instrumentais longas, com ' +
      'sintetizadores, flauta e sax na linhagem espacial do Pink Floyd.',

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
      // A banda inteira posando no O Sebo é a capa e o card.
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

  // ==========================================================================
  //  DJ SEBASTIAN K
  //  O Johann na cabine. Texto e fotos do media kit dele
  //  (dj-sebastian-k/media-kit-dj-sebastian-k.html, versão de 24/11 com os
  //  três shows). Com `lp`, a página dele é uma LP de venda para dono de bar.
  //  O cachê NÃO vai para o site (fica no media kit, para quem pede).
  // ==========================================================================
  {
    slug: 'dj-sebastian-k',
    nome: 'DJ Sebastian K',
    tipo: 'dj',
    resumo:
      'Rock psicodélico em três shows: Lado A internacional, Lado B ' +
      'brasileiro e a festa Indie Psicodélico',
    genero: 'Discotecagem de rock psicodélico',
    carimbo: 'DJ da festa',
    cidade: 'Joinville/SC',

    conceito:
      'O DJ Sebastian K monta a noite como quem monta um disco: abertura, ' +
      'quatro capítulos e um fim. São três shows. Dois são para ouvir de ' +
      'perto, com som para conversar, beber devagar e, de vez em quando, ' +
      'parar tudo para ouvir. O terceiro é festa, para dançar a psicodelia ' +
      'de agora.',

    sonoridade:
      'Curadoria por época: cada bloco é uma fase da psicodelia, e a música ' +
      'conta uma história do começo ao fim da noite. O Lado A é a ' +
      'psicodelia internacional, com Beatles do Sgt. Pepper\'s, Pink Floyd ' +
      'de 1967 a 1975 e o Dark Side of the Moon inteiro no final. O Lado B ' +
      'é a psicodelia brasileira, de Tropicália, Mutantes, Secos & Molhados, ' +
      'Raul, Jorge Ben, Novos Baianos e Clube da Esquina. O Indie ' +
      'Psicodélico é a festa: Tame Impala, Arctic Monkeys, Lana Del Rey, ' +
      'MGMT e companhia.',

    aoVivo:
      'Notebook e controladora, mixando ao vivo, com as transições feitas à ' +
      'mão: nada de playlist no automático durante o set. Atrás da cabine ' +
      'está Johann Sebastian K., tecladista e baixista do Delírio Parabólico ' +
      'e diretor artístico da Golden Eye. No formato híbrido, ele toca ' +
      'teclado ou baixo por cima das faixas em momentos escolhidos.',

    // Na página de DJ, este bloco aparece como "A noite".
    discografia:
      '7 horas de música, nos três shows: 1h30 de curadoria de abertura ' +
      'enquanto a casa enche, o set ao vivo de 4h em quatro blocos com três ' +
      'pausas curtas e 1h30 de curadoria de saída. O formato se ajusta ao ' +
      'horário da casa.',

    formacao: [
      'Johann Sebastian K. — discotecagem',
      'Notebook e controladora, mixando ao vivo',
      'Formato híbrido: teclado ou baixo ao vivo',
      'Liga no som da casa (RCA ou P10)',
    ],
    referencias: [
      'Pink Floyd',
      'The Beatles',
      'Os Mutantes',
      'Raul Seixas',
      'Secos & Molhados',
      'Tame Impala',
      'Arctic Monkeys',
    ],

    // Fotos do media kit (já com o tom sépia dele), entre 450 e 820px de
    // origem. >>> SUBSTITUIR pelos originais quando der.
    fotos: [
      '/imagens/bandas/djsebastiank/capa-teclado.jpg',
      '/imagens/bandas/djsebastiank/baixo-ao-vivo.jpg',
      '/imagens/bandas/djsebastiank/voz-e-violao.jpg',
      '/imagens/bandas/djsebastiank/corujao-baixo.jpg',
    ],

    lp: {
      chamada: 'Três noites, o mesmo ritual.',
      subchamada:
        'Rock psicodélico montado como um disco: abertura, quatro capítulos ' +
        'e um fim. Dois shows para ouvir de perto e uma festa para dançar a ' +
        'psicodelia de agora.',
      pilares: [
        {
          titulo: 'Curadoria por época',
          texto:
            'Cada bloco é uma fase da psicodelia. A música conta uma história ' +
            'do começo ao fim da noite.',
        },
        {
          titulo: 'Transições feitas à mão',
          texto:
            'Notebook e controladora, mixando ao vivo. Nada de playlist no ' +
            'automático durante o set.',
        },
        {
          titulo: 'Um músico na cabine',
          texto:
            'Johann toca teclado e baixo. No formato híbrido, ele toca por ' +
            'cima das faixas em momentos escolhidos.',
        },
      ],
      noite: [
        {
          duracao: '1h30',
          titulo: 'Curadoria de abertura',
          texto:
            'Uma playlist do mesmo universo do show, em volume de conversa, ' +
            'enquanto a casa enche. A última faixa chama o DJ.',
        },
        {
          duracao: '4h',
          titulo: 'Set ao vivo, em quatro blocos',
          texto:
            'O DJ assume a cabine. Três pausas curtas dividem a viagem em ' +
            'capítulos.',
        },
        {
          duracao: '1h30',
          titulo: 'Curadoria de saída',
          texto: 'Lenta e hipnótica, para descer da viagem enquanto a casa esvazia.',
        },
      ],
      noiteNota:
        '7 horas de música, nos três shows. Nas pausas, uma seleção curada ' +
        'mantém o clima. O formato se ajusta ao horário da casa.',
      lados: [
        {
          lado: 'Lado A',
          letra: 'A',
          nome: 'Psicodelia internacional, para ouvir',
          resumo:
            'Beatles do Sgt. Pepper\'s, Pink Floyd de 1967 a 1975 e o Dark ' +
            'Side of the Moon inteiro no final.',
          paraQuem: 'Bares de coquetel, vinho e conversa longa',
          clima: 'Contemplativo, volume de conversa',
          blocos: [
            {
              titulo: 'Beatles psicodélico',
              duracao: 'cerca de 1h',
              texto:
                'De Tomorrow Never Knows a All You Need Is Love, com o Sgt. ' +
                'Pepper\'s quase na ordem do disco.',
              faixas: 'Strawberry Fields Forever · Lucy in the Sky with Diamonds · A Day in the Life',
            },
            {
              titulo: 'Floyd 1967 e Mutantes',
              duracao: 'cerca de 56 min',
              texto: 'O Pink Floyd de 1967 conversando com Os Mutantes de 68 a 70.',
              faixas: 'Astronomy Domine · Bike · A Minha Menina · Ando Meio Desligado',
            },
            {
              titulo: 'Floyd 1968–72',
              duracao: 'cerca de 56 min',
              texto: 'A viagem espacial, até Echoes, o ponto mais fundo da noite.',
              faixas: 'A Saucerful of Secrets · Fat Old Sun · One of These Days · Echoes',
            },
            {
              titulo: 'O grande final',
              duracao: 'cerca de 1h10',
              texto: 'The Dark Side of the Moon inteiro, sem cortes. Depois, o adeus.',
              faixas: 'Shine On You Crazy Diamond · Wish You Were Here · High Hopes',
            },
          ],
          nota: 'Antes do set, 1h30 de curadoria dos anos 60. Depois, 1h30 de anos 70 para descer da viagem.',
        },
        {
          lado: 'Lado B',
          letra: 'B',
          nome: 'Psicodelia brasileira, para ouvir e cantar',
          resumo:
            'Tropicália, Mutantes, Secos & Molhados, Raul, Jorge Ben, Novos ' +
            'Baianos e o Clube da Esquina.',
          paraQuem: 'Cafés, bares de rock nacional, quintais',
          clima: 'Contemplativo, com coro no refrão',
          blocos: [
            {
              titulo: 'Tropicália 1967–69',
              duracao: 'cerca de 55 min',
              texto:
                'Caetano, Gil, Gal, Tom Zé e Mutantes se revezando, do hino ' +
                'Tropicália até Aquele Abraço.',
              faixas: 'Panis et Circenses · Domingo no Parque · Divino Maravilhoso · Parque Industrial',
            },
            {
              titulo: 'Mutantes e Floyd 67',
              duracao: 'cerca de 57 min',
              texto:
                'O mergulho nos Mutantes de 68 a 71, aberto e fechado pelo ' +
                'Pink Floyd de Syd Barrett.',
              faixas: 'Astronomy Domine · A Minha Menina · Ando Meio Desligado · Interstellar Overdrive',
            },
            {
              titulo: 'Anos 70 místicos',
              duracao: 'cerca de 55 min',
              texto:
                'Secos & Molhados, Raul, a Tábua de Esmeralda de Jorge Ben, ' +
                'Novos Baianos e Tim Maia Racional.',
              faixas: 'Sangue Latino · Os Alquimistas Estão Chegando · Preta Pretinha · Sociedade Alternativa',
            },
            {
              titulo: 'Clube da Esquina',
              duracao: 'cerca de 54 min',
              texto:
                'A viagem mineira de Milton e Lô, Arnaldo Baptista, e o fim ' +
                'com todo mundo cantando.',
              faixas: 'O Trem Azul · Clube da Esquina nº 2 · Vapor Barato · Balada do Louco',
            },
          ],
          nota:
            'Abertura com bossa virando Tropicália, de Edu Lobo a Gil. Saída ' +
            'com os anos 70 lentos de Belchior, O Terço e Raul.',
        },
        {
          lado: 'Indie Psicodélico',
          letra: 'C',
          nome: 'A festa, para dançar',
          resumo:
            'Tame Impala, Arctic Monkeys, The Last Shadow Puppets, Lana Del ' +
            'Rey, MGMT, The Voidz e Foster the People.',
          paraQuem: 'Bares com pista, sexta e sábado',
          clima: 'Sobe, escurece e explode no último bloco',
          blocos: [
            {
              titulo: 'Tame Impala',
              duracao: 'cerca de 59 min',
              texto:
                'Abre com os quase 8 minutos de Let It Happen e passeia por ' +
                'Currents, Lonerism e The Slow Rush.',
              faixas: 'Let It Happen · Elephant · Borderline · Feels Like We Only Go Backwards',
            },
            {
              titulo: 'Arctic no deserto',
              duracao: 'cerca de 59 min',
              texto:
                'Humbug no centro, com The Last Shadow Puppets e The Voidz. ' +
                'Guitarras pesadas e escuras.',
              faixas: 'Crying Lightning · Pyramid of Bones · The Age of the Understatement · 505',
            },
            {
              titulo: 'Noir',
              duracao: 'cerca de 1h',
              texto:
                'O momento lento e sensual: o AM alternando com Lana Del Rey ' +
                'e The Neighbourhood.',
              faixas: 'Do I Wanna Know? · Brooklyn Baby · Daddy Issues · Sweater Weather',
            },
            {
              titulo: 'O pico da festa',
              duracao: 'cerca de 1h',
              texto:
                'Só hino: MGMT, Foster the People, Cage the Elephant e o caos ' +
                'colorido do The Voidz.',
              faixas: 'Time to Pretend · Electric Feel · The Less I Know the Better · Kids',
            },
          ],
          nota:
            'Esquenta de 1h30 com um pouco de cada artista. Final de 1h30 no clima ' +
            'lounge do Tranquility Base, com Lana e The Voidz.',
        },
      ],
      quem: {
        nome: 'Johann Sebastian K.',
        papel: 'Músico, produtor e o ouvido por trás da Golden Eye.',
        texto:
          'Tecladista e baixista de Joinville, fundador e diretor artístico ' +
          'da Golden Eye Prods. Toca no Delírio Parabólico, banda de rock ' +
          'psicodélico autoral com raízes nos Mutantes, nos Beatles, no Pink ' +
          'Floyd e em Raul Seixas.',
        datas: [
          { data: '14/08/26', texto: 'O Sebo · Concerto Solidário de Rock Psicodélico, com o Delírio Parabólico' },
          { data: '12/09/26', texto: 'Salvador Vegan Café · Tropicália & Rock Nacional: voz, violão e discotecagem' },
          { data: '20/11/26', texto: 'Hangar7 · Corujão Ácido, com Nada Basta e Delírio Parabólico' },
        ],
      },
      rider: {
        leva: [
          'Notebook com os sets e as curadorias',
          'Controladora de DJ e fone',
          'Cabos para ligar no som da casa',
          'No formato híbrido, teclado ou baixo',
        ],
        bar: [
          'Mesa ou bancada de cerca de 1,20 m',
          'Tomada perto da mesa',
          'Entrada no som da casa (RCA ou P10)',
          'Luz baixa, se possível',
        ],
        clima: [
          'Lados A e B: volume de conversa, ninguém precisa gritar',
          'Indie Psicodélico: volume de pista',
          'Montagem antes da casa abrir',
          'Arte de divulgação no padrão Golden Eye para o Instagram do bar',
        ],
      },
      contratar: {
        titulo: 'Escolha a noite e mande a data',
        texto:
          'Noite completa: curadoria de abertura, set ao vivo de 4h e ' +
          'curadoria de saída. Lado A, Lado B ou Indie Psicodélico, à escolha ' +
          'da casa. Cachê e media kit pelo WhatsApp.',
        extras: [
          'Formato híbrido, com teclado ou baixo ao vivo: sob consulta.',
          'Noites fixas no mês e datas especiais: vamos conversar.',
        ],
      },
    },
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
      'automaticamente para o seu e-mail, em PDF, e aparece na tela. Se você ' +
      'marcar a opção na compra, a produção te manda também pelo WhatsApp. ' +
      'Na véspera e no dia do evento chega um lembrete no e-mail. Fica sempre ' +
      'disponível na página Meus Ingressos.',
  },
  {
    p: 'Quem tem direito à meia-entrada?',
    r:
      'Conforme a Lei 12.933/2013: estudantes, pessoas com deficiência e um ' +
      'acompanhante, pessoas com 60 anos ou mais, e jovens de 15 a 29 anos de ' +
      'baixa renda inscritos no CadÚnico. A comprovação é obrigatória na entrada ' +
      '— sem documento válido, será cobrada a diferença para a inteira. A ' +
      'meia-entrada corresponde a 40% de cada lote; quando essa cota enche, ' +
      'o lote segue só com a inteira.',
  },
  {
    p: 'O que é a entrada solidária?',
    r:
      'É a inteira mais R$ 10, e esses R$ 10 vão inteiros para o Lar Betânia, ' +
      'de Joinville. É opcional: dá acesso igual à inteira. Depois do evento ' +
      'a gente publica no Instagram o comprovante do repasse com o total ' +
      'arrecadado.',
  },
  {
    p: 'Como funcionam os lotes?',
    r:
      'Cada lote tem uma quantidade e uma data. Ele vira quando esgota ou quando ' +
      'a data passa, o que vier primeiro, e o preço sobe no lote seguinte. O ' +
      'site mostra sempre o lote que está valendo. Se sobrar ingresso no último ' +
      'lote, ele é vendido também na porta, pelo mesmo preço.',
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
