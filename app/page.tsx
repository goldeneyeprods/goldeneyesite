import Link from 'next/link'
import { Header } from '@/components/Header'
import { HeroProdutora } from '@/components/HeroProdutora'
import { CardEvento } from '@/components/CardEvento'
import { CardBanda } from '@/components/CardBanda'
import { Contador } from '@/components/Contador'
import { Galeria } from '@/components/Galeria'
import { Videos } from '@/components/Videos'
import { Sobre } from '@/components/Sobre'
import { FAQ } from '@/components/FAQ'
import { Footer } from '@/components/Footer'
import { Ornamento } from '@/components/OlhoDeHorus'
import {
  produtora,
  proximosEventos,
  eventosPassados,
  todasAsFotos,
  todosOsVideos,
  bandas,
} from '@/config/site'

// ============================================================================
//  HOME — A PRODUTORA
//  Aqui quem se apresenta é a Golden Eye. Os eventos aparecem como agenda e
//  arquivo, cada um com link para a própria página em /eventos/<slug>.
// ============================================================================

const LINKS = [
  { href: '#agenda', rotulo: 'Agenda' },
  { href: '#bandas', rotulo: 'Bandas' },
  { href: '#arquivo', rotulo: 'Arquivo' },
  { href: '#registros', rotulo: 'Registros' },
  { href: '#sobre', rotulo: 'A produtora' },
  { href: '#faq', rotulo: 'Dúvidas' },
]

export default function Home() {
  const proximos = proximosEventos()
  const passados = eventosPassados()
  const destaque = proximos[0]
  const outros = proximos.slice(1)
  const fotos = todasAsFotos()
  const videos = todosOsVideos()

  // Dados estruturados da organização: ajudam o Google a entender que a
  // Golden Eye é a produtora, e não apenas mais uma página de evento.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: produtora.nome,
    description: produtora.descricao,
    url: process.env.NEXT_PUBLIC_SITE_URL,
    logo: `${process.env.NEXT_PUBLIC_SITE_URL}/imagens/logo.png`,
    sameAs: Object.values(produtora.redes).filter(Boolean),
    email: produtora.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: produtora.cidade,
      addressRegion: produtora.estado,
      addressCountry: 'BR',
    },
    areaServed: { '@type': 'City', name: produtora.cidade },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Header
        links={LINKS}
        cta={destaque ? { href: '#agenda', rotulo: 'Próximo evento' } : undefined}
      />

      <main id="conteudo">
        <HeroProdutora />

        <div className="divisor mx-auto max-w-5xl" />

        {/* ================= AGENDA ================= */}
        <section id="agenda" className="relative px-5 py-24 sm:py-32">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="rotulo">O que vem por aí</p>
              <h2 className="mt-4 font-display text-4xl font-bold sm:text-5xl">
                Agenda
              </h2>
            </div>

            <Ornamento className="my-12" />

            {destaque ? (
              <>
                <CardEvento evento={destaque} destaque />

                {/* Contador do próximo, logo abaixo do card */}
                <div className="mt-10 flex flex-col items-center">
                  <p className="mb-5 text-[10px] uppercase tracking-[0.3em] text-texto-fraco">
                    Faltam
                  </p>
                  <Contador ate={destaque.dataInicio} />
                </div>

                {outros.length > 0 && (
                  <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {outros.map((e) => (
                      <CardEvento key={e.slug} evento={e} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="cartao p-10 text-center">
                <p className="font-display text-xl text-texto">
                  Nenhum evento marcado no momento.
                </p>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-texto-suave">
                  Estamos preparando a próxima. Siga a gente no Instagram para
                  saber na hora em que a data sair.
                </p>
                {produtora.redes.instagram && (
                  <a
                    href={produtora.redes.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="botao-ouro mt-7 inline-flex"
                  >
                    Seguir no Instagram
                  </a>
                )}
              </div>
            )}
          </div>
        </section>

        <div className="divisor mx-auto max-w-5xl" />

        {/* ================= BANDAS (casting) ================= */}
        {bandas.length > 0 && (
          <>
            <section id="bandas" className="relative px-5 py-24 sm:py-32">
              <div className="mx-auto max-w-5xl">
                <div className="text-center">
                  <p className="rotulo">Quem toca com a gente</p>
                  <h2 className="mt-4 font-display text-4xl font-bold sm:text-5xl">
                    Bandas
                  </h2>
                  <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-texto-suave">
                    Tem um bar, uma casa ou uma data em aberto? Estas são as
                    bandas que tocam com a gente.
                  </p>
                </div>

                <Ornamento className="my-12" />

                <div className="grid gap-6 sm:grid-cols-2">
                  {bandas.map((b) => (
                    <CardBanda key={b.slug} banda={b} />
                  ))}
                </div>

                <div className="mt-10 text-center">
                  <Link href="/bandas" className="botao-fantasma !py-3 !text-sm">
                    Ver o casting completo
                  </Link>
                </div>
              </div>
            </section>

            <div className="divisor mx-auto max-w-5xl" />
          </>
        )}

        {/* ================= ARQUIVO ================= */}
        {passados.length > 0 && (
          <>
            <section id="arquivo" className="relative px-5 py-24 sm:py-32">
              <div className="mx-auto max-w-5xl">
                <div className="text-center">
                  <p className="rotulo">O que já rolou</p>
                  <h2 className="mt-4 font-display text-4xl font-bold sm:text-5xl">
                    Edições anteriores
                  </h2>
                  <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-texto-suave">
                    Cada noite deixa um rastro. Clica pra ver como foi.
                  </p>
                </div>

                <Ornamento className="my-12" />

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {passados.map((e) => (
                    <CardEvento key={e.slug} evento={e} />
                  ))}
                </div>

                <div className="mt-10 text-center">
                  <Link href="/eventos" className="botao-fantasma !py-3 !text-sm">
                    Ver todos os eventos
                  </Link>
                </div>
              </div>
            </section>

            <div className="divisor mx-auto max-w-5xl" />
          </>
        )}

        {/* ================= VÍDEOS ================= */}
        {videos.length > 0 && (
          <>
            <Videos
              videos={videos.slice(0, 4)}
              rotulo="A cena, em movimento"
              titulo="Vídeos"
              canal={produtora.redes.youtube || undefined}
            />
            <div className="divisor mx-auto max-w-5xl" />
          </>
        )}

        {/* ================= REGISTROS (todas as fotos) ================= */}
        <Galeria
          id="registros"
          fotos={fotos}
          rotulo="A cena, em imagem"
          titulo="Registros"
          subtitulo="Fotos de todas as edições. Clica pra ampliar."
          limite={12}
        />

        <div className="divisor mx-auto max-w-5xl" />

        <Sobre />

        <div className="divisor mx-auto max-w-5xl" />

        <FAQ />
      </main>

      <Footer />
    </>
  )
}
