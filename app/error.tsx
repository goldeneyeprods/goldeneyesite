'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { OlhoDeHorus } from '@/components/OlhoDeHorus'
import { produtora } from '@/config/site'

// ============================================================================
//  Tela de erro
//  Se algo quebrar no meio de uma compra, a pessoa precisa ver uma saída e um
//  canal de contato — não a tela cinza padrão do Next.
// ============================================================================

export default function Erro({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // O digest é o identificador que aparece no log da Vercel. Se alguém
    // reclamar no WhatsApp, esse código acha o erro exato.
    console.error('[erro]', error.digest, error)
  }, [error])

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-5 text-center">
      <div className="aurora opacity-40" aria-hidden="true">
        <span />
      </div>

      <div className="relative z-10">
        <div className="flex justify-center opacity-30">
          <OlhoDeHorus tamanho={72} />
        </div>

        <h1 className="mt-10 font-display text-2xl font-bold text-texto sm:text-3xl">
          Alguma coisa saiu do eixo
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-texto-suave">
          Deu erro do nosso lado. Se você estava comprando um ingresso,{' '}
          <strong className="text-texto">nada foi cobrado</strong> — pagamento
          só é confirmado depois do PIX aprovado.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button onClick={reset} className="botao-ouro w-full sm:w-auto">
            Tentar de novo
          </button>
          <Link href="/" className="botao-fantasma w-full sm:w-auto">
            Voltar ao início
          </Link>
        </div>

        <p className="mt-12 text-xs leading-relaxed text-texto-fraco">
          Se persistir, chame a produção no{' '}
          <a
            href={`https://wa.me/${produtora.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ouro underline underline-offset-4"
          >
            WhatsApp
          </a>
          {error.digest && (
            <>
              <br />
              <span className="font-mono">código: {error.digest}</span>
            </>
          )}
        </p>
      </div>
    </main>
  )
}
