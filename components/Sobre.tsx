import { OlhoDeHorus, Ornamento } from './OlhoDeHorus'
import { produtora } from '@/config/site'

export function Sobre() {
  return (
    <section id="sobre" className="relative overflow-hidden px-5 py-24 sm:py-32">
      {/* Olho girando muito devagar ao fundo — presença, não distração */}
      <div
        className="pointer-events-none absolute -right-32 top-1/2 -translate-y-1/2 opacity-[0.05]"
        aria-hidden="true"
      >
        <div className="girar-lento">
          <OlhoDeHorus tamanho={480} brilho={false} />
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <p className="rotulo">Quem faz</p>
        <h2 className="mt-4 font-display text-4xl font-bold sm:text-5xl">
          <span className="texto-ouro">{produtora.nome}</span>
        </h2>

        <Ornamento className="my-10" />

        <p className="text-base leading-loose text-texto-suave sm:text-lg">
          {produtora.descricao}
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            { n: 'Rock', d: 'psicodélico, garage e o que vier junto' },
            { n: 'Ritual', d: 'luz, projeção e som como uma coisa só' },
            { n: 'Causa', d: 'toda edição devolve algo para a cidade' },
          ].map((item) => (
            <div key={item.n} className="cartao p-6">
              <p className="font-display text-lg font-bold texto-ouro">{item.n}</p>
              <p className="mt-2 text-xs leading-relaxed text-texto-suave">
                {item.d}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          {produtora.redes.instagram && (
            <a
              href={produtora.redes.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="botao-fantasma !py-3 !text-sm"
            >
              Instagram
            </a>
          )}
          <a
            href={`https://wa.me/${produtora.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="botao-fantasma !py-3 !text-sm"
          >
            Falar no WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}
