import Link from 'next/link'
import { OlhoDeHorus } from '@/components/OlhoDeHorus'
import { proximosEventos } from '@/config/site'

// ============================================================================
//  404
//  Importa mais do que parece: link de evento circula no WhatsApp e no
//  Instagram, e cartaz impresso não se corrige. Quem cair aqui precisa achar
//  o caminho de volta em um clique — não levar um erro genérico na cara.
// ============================================================================

export default function NaoEncontrado() {
  const proximo = proximosEventos()[0]

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-5 text-center">
      <div className="aurora opacity-60" aria-hidden="true">
        <span />
        <span />
      </div>

      <div className="relative z-10">
        <div className="flex justify-center opacity-40">
          <div className="pulsar-olho">
            <OlhoDeHorus tamanho={90} />
          </div>
        </div>

        <p className="mt-10 font-display text-6xl font-black texto-ouro sm:text-7xl">
          404
        </p>
        <h1 className="mt-4 font-display text-2xl font-bold text-texto">
          Esta página se dissolveu
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-texto-suave">
          O link pode estar errado, ou o evento saiu do ar. Nada que um passo
          atrás não resolva.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/" className="botao-ouro w-full sm:w-auto">
            Voltar ao início
          </Link>
          <Link href="/eventos" className="botao-fantasma w-full sm:w-auto">
            Ver todos os eventos
          </Link>
        </div>

        {proximo && (
          <p className="mt-12 text-xs text-texto-fraco">
            Procurando o próximo?{' '}
            <Link
              href={`/eventos/${proximo.slug}`}
              className="text-ouro underline underline-offset-4"
            >
              {proximo.nome}
            </Link>
          </p>
        )}
      </div>
    </main>
  )
}
