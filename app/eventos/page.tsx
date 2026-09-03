import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import { CardEvento } from '@/components/CardEvento'
import { Footer } from '@/components/Footer'
import { Ornamento } from '@/components/OlhoDeHorus'
import { proximosEventos, eventosPassados, produtora } from '@/config/site'

export const metadata: Metadata = {
  title: 'Eventos',
  description: `Todos os eventos da ${produtora.nome} — agenda e edições realizadas.`,
}

// ============================================================================
//  /eventos — a listagem completa
// ============================================================================

export default function ListaEventos() {
  const proximos = proximosEventos()
  const passados = eventosPassados()

  return (
    <>
      <Header
        links={[
          { href: '/#agenda', rotulo: 'Agenda' },
          { href: '/#sobre', rotulo: 'A produtora' },
          { href: '/#faq', rotulo: 'Dúvidas' },
        ]}
      />

      <main id="conteudo" className="px-5 pb-24 pt-32">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="rotulo">Golden Eye Prods.</p>
            <h1 className="mt-4 font-display text-4xl font-black sm:text-6xl">
              <span className="texto-ouro">Eventos</span>
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-texto-suave">
              Tudo que já fizemos e tudo que vem por aí.
            </p>
          </div>

          <Ornamento className="my-14" />

          {proximos.length > 0 && (
            <section className="mb-20">
              <h2 className="mb-6 font-display text-2xl font-bold text-texto">
                Em cartaz
              </h2>
              <div className="space-y-5">
                {proximos.map((e, i) => (
                  <CardEvento key={e.slug} evento={e} destaque={i === 0} />
                ))}
              </div>
            </section>
          )}

          {passados.length > 0 && (
            <section>
              <h2 className="mb-6 font-display text-2xl font-bold text-texto">
                Já aconteceu
              </h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {passados.map((e) => (
                  <CardEvento key={e.slug} evento={e} />
                ))}
              </div>
            </section>
          )}

          {proximos.length === 0 && passados.length === 0 && (
            <p className="py-20 text-center text-texto-suave">
              Nenhum evento cadastrado ainda.
            </p>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}
