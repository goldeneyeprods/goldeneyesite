import Image from 'next/image'

// ============================================================================
//  A MARCA DA GOLDEN EYE PRODS.
//
//  Usa a logo original em alta resolução, com o fundo removido — o dourado
//  foi separado da parede pelo "calor" do pixel (vermelho menos azul), o que
//  preserva cada relevo do metal e o brilho da íris.
//
//  A sacada da marca está na pupila: em vez de um círculo, ela é uma ÍRIS DE
//  CÂMERA fechando — como o cano de arma da abertura dos filmes do 007.
//  Golden Eye (Hórus) + Golden Eye (Bond) + o diafragma de quem registra.
// ============================================================================

/** Só o símbolo — o olho com a íris. */
export function OlhoDeHorus({
  className = '',
  tamanho = 48,
  brilho = true,
  prioridade = false,
}: {
  className?: string
  tamanho?: number
  /** halo dourado por trás; desligue em marca d'água grande e apagada */
  brilho?: boolean
  /** true para a logo que aparece na primeira dobra */
  prioridade?: boolean
}) {
  // A arte é mais larga que alta (1200x784): a altura acompanha a proporção
  // para o olho nunca sair achatado.
  const altura = Math.round(tamanho * (784 / 1200))

  return (
    <span
      className={`relative inline-block ${className}`}
      style={{ width: tamanho, height: altura }}
    >
      <Image
        src="/imagens/marca/olho.png"
        alt=""
        aria-hidden="true"
        width={tamanho}
        height={altura}
        priority={prioridade}
        sizes={`${tamanho}px`}
        className="h-full w-full object-contain"
        style={
          brilho
            ? { filter: 'drop-shadow(0 0 14px rgba(212,166,74,0.35))' }
            : undefined
        }
      />
    </span>
  )
}

// ----------------------------------------------------------------------------
//  Assinatura completa — o olho sobre "GOLDEN EYE / Prods."
//  Uma imagem só, do arquivo original: a tipografia é parte da marca e não
//  deve ser recriada com fonte parecida.
// ----------------------------------------------------------------------------
export function Marca({
  compacta = false,
  className,
}: {
  compacta?: boolean
  /** quando informado, manda no tamanho (ex.: "w-[min(78vw,420px)]") */
  className?: string
}) {
  // width/height servem só para o navegador reservar o espaço na proporção
  // certa e não pular o layout enquanto a imagem carrega. Quem manda no
  // tamanho final é o CSS.
  return (
    <Image
      src="/imagens/marca/completa.png"
      alt="Golden Eye Prods."
      width={1333}
      height={1124}
      priority
      sizes="(max-width: 640px) 78vw, 420px"
      className={className ?? (compacta ? 'w-[112px]' : 'w-[160px]')}
      style={{ height: 'auto' }}
    />
  )
}

// ----------------------------------------------------------------------------
//  Ornamento psicodélico usado como divisor entre seções
// ----------------------------------------------------------------------------
export function Ornamento({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <div className="h-px w-16 bg-gradient-to-r from-transparent to-ouro/50 sm:w-28" />
      <svg width="40" height="16" viewBox="0 0 40 16" fill="none" aria-hidden="true">
        <path
          d="M2 8 Q8 2, 14 8 T26 8 T38 8"
          stroke="#d4a64a"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.8"
        />
        <circle cx="20" cy="8" r="2.4" fill="#d4a64a" />
      </svg>
      <div className="h-px w-16 bg-gradient-to-l from-transparent to-ouro/50 sm:w-28" />
    </div>
  )
}
