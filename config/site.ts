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
    'Sebo, café, bar, o que aparecer. A gente pega um espaço que não é ' +
    'palco e faz virar palco por uma noite — em Joinville, com fuzz, luz e ' +
    'projeção.',

  descricao:
    'A Golden Eye Prods. nasceu da vontade de transformar a noite em ritual. ' +
    'Produzimos eventos de rock psicodélico onde luz, som e imagem se dissolvem ' +
    'numa mesma viagem — do fuzz saturado à discotecagem que atravessa a ' +
    'madrugada. Começamos em Joinville, entre as estantes de um sebo, ' +
    'tocando Raul Seixas e Pink Floyd em troca de doações para o Lar ' +
    'Betânia. A ideia segue a mesma: ocupar espaços improváveis e devolver ' +
    'alguma coisa para a cidade.',

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
  /**
   * Lotes com a mesma fase dividem a `quantidade` (a meia e a inteira do
   * mesmo lote, por exemplo) e ficam à venda juntos. Só a menor fase ainda
   * aberta aparece no site: a fase fecha quando passa do `validoAte` ou
   * quando esgota, e a próxima abre na hora.
   */
  fase: number
  /** ISO com fuso de São Paulo; sem data, vale até a abertura dos portões */
  validoAte?: string
}

/**
 * Atalho para o lote com inteira e meia dividindo a mesma quantidade.
 * O preço informado é o da inteira; a meia é a metade, como manda a lei.
 * Na venda, a meia de cada lote para em 40% da quantidade do lote (lib/lotes.ts).
 */
function lote(
  fase: number,
  nome: string,
  inteiraCentavos: number,
  quantidade: number,
  validoAte?: string
): LoteConfig[] {
  return [
    { nome: `${nome} — Inteira`, tipo: 'inteira', precoCentavos: inteiraCentavos, quantidade, ordem: fase * 10, fase, validoAte },
    { nome: `${nome} — Meia-entrada`, tipo: 'meia', precoCentavos: Math.round(inteiraCentavos / 2), quantidade, ordem: fase * 10 + 1, fase, validoAte },
  ]
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
  //  CORUJÃO ÁCIDO — sexta, 20/11, 19h
  //  Nada Basta + Delírio Parabólico, no Hangar7.
  //  Inteira de R$ 20 a R$ 35 conforme o lote; meia-entrada pela metade,
  //  com comprovante, até 40% de cada lote. A inteira fica à venda para quem quiser.
  //  >>> FALTA: o cartaz.
  // ==========================================================================
  {
    // Slug novo junto com o nome; os antigos (/eventos/totheotherside e
    // /eventos/corujao-psicodelico) redirecionam para cá no next.config.mjs.
    slug: 'corujao-acido',
    nome: 'Corujão Ácido',
    subtitulo: 'Uma noite, dois lados do ácido: o espacial e o tropical',

    dataInicio: '2026-11-20T19:00:00-03:00',
    aberturaPortoes: '2026-11-20T19:00:00-03:00',

    local: 'Hangar7',
    endereco: 'Rua João Ebert, 174 — Comasa, Joinville/SC',
    mapaEmbed:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4001.3273362442383!2d-48.8087199!3d-26.2798882!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94deb10050097acb%3A0xb84defe0e2348ac5!2sHangar%207%20Music%20Bar!5e1!3m2!1spt-BR!2sbr!4v1792429982472!5m2!1spt-BR!2sbr',
    mapaLink: 'https://maps.google.com/?q=Hangar+7+Music+Bar,+Rua+João+Ebert,+174+-+Comasa,+Joinville+-+SC',

    classificacaoEtaria: '18 anos',
    capacidade: 110,

    descricao:
      'A coruja enxerga no escuro, e a noite tem dois lados. No Lado A, o ' +
      'Delírio Parabólico leva o Hangar7 para o espaço com Pink Floyd: ' +
      'atmosfera, delay e viagem longa. No Lado B, a Nada Basta desce de ' +
      'Blumenau com a psicodelia brasileira de Mutantes, Rita Lee e Casa das ' +
      'Máquinas, groove e calor. Depois, discotecagem até a coruja cansar.',

    // Foto de palco como capa: o Delírio tocando (a Nada Basta ainda não
    // mandou foto ao vivo em alta resolução).
    imagemHero: '/imagens/bandas/delirioparabolico/banda-02-tocando.jpg',

    lineup: [
      {
        horario: '19:00',
        titulo: 'Abertura da casa',
        descricao: 'Discotecagem de recepção enquanto o Hangar7 enche.',
        destaque: false,
      },
      {
        horario: '21:00',
        titulo: 'Lado A — Delírio Parabólico',
        descricao:
          'O lado espacial. Um set de Pink Floyd, das paisagens longas ao ' +
          'lado escuro da lua.',
        destaque: true,
      },
      {
        horario: '22:30',
        titulo: 'Lado B — Nada Basta',
        descricao:
          'O lado tropical. Psicodelia brasileira, rock setentista e groove, ' +
          'de Mutantes a Casa das Máquinas.',
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

    creditos: [{ rotulo: 'Espaço', valor: 'Hangar7' }],

    vendaAberta: true,

    // Ingressos à venda no total, somando todos os lotes. O último lote fica
    // com o que sobrar dos anteriores; o que não for vendido online até a
    // abertura é vendido na porta, pelo preço do último lote.
    ingressosAVenda: 100,

    // Cada lote tem uma inteira e uma meia que dividem a mesma quantidade;
    // a meia de cada lote para em 40% dele (8 de 20, 10 de 25, 12 de 30). O lote vira quando a data passa OU quando
    // esgota — o que vier primeiro.
    lotes: [
      ...lote(1, '1º lote', 2000, 20, '2026-11-10T23:59:59-03:00'),
      ...lote(2, '2º lote', 2500, 25, '2026-11-15T23:59:59-03:00'),
      ...lote(3, '3º lote', 3000, 30, '2026-11-19T23:59:59-03:00'),
      ...lote(4, '4º lote', 3500, 100),
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
  //  NADA BASTA
  //  Texto a partir do release e do mídia kit oficiais da banda
  //  (arquivosbandas/nadabasta/midia-kit-nada-basta.pdf).
  // ==========================================================================
  {
    slug: 'nada-basta',
    nome: 'Nada Basta',
    resumo: 'Uma viagem aos anos 70, entre psicodelia e brasilidades',
    genero: 'Rock setentista, brasilidades e psicodelia',
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
    fotos: [
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
      '/imagens/bandas/delirioparabolico/banda-02-tocando.jpg',
      '/imagens/bandas/delirioparabolico/banda-01-completa.jpg',
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
      '— sem documento válido, será cobrada a diferença para a inteira. A ' +
      'meia-entrada corresponde a 40% de cada lote; quando essa cota enche, ' +
      'o lote segue só com a inteira.',
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
