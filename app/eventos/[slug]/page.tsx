import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { HeroEvento } from '@/components/HeroEvento'
import { DetalhesEvento } from '@/components/DetalhesEvento'
import { Ingressos } from '@/components/Ingressos'
import { Galeria } from '@/components/Galeria'
import { Videos } from '@/components/Videos'
import { CartazEvento } from '@/components/CartazEvento'
import { FAQ } from '@/components/FAQ'
import { Footer } from '@/components/Footer'
import { CardEvento } from '@/components/CardEvento'
import { Ornamento } from '@/components/OlhoDeHorus'
import {
  eventos,
  eventoPorSlug,
  ehFuturo,
  proximosEventos,
  produtora,
} from '@/config/site'

// ============================================================================
//  /eventos/<slug> — a LP de cada evento
//
//  Gerada estaticamente para todos os eventos do config: rápida de carregar
//  e boa de indexar. A parte dinâmica (estoque de ingresso) é buscada no
//  navegador, então o preço nunca fica preso em cache.
// ============================================================================

export function generateStaticParams() {
  return eventos.map((e) => ({ slug: e.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const evento = eventoPorSlug(slug)
  if (!evento) return { title: 'Evento não encontrado' }

  const imagem = evento.cartazOg ?? evento.cartaz ?? evento.imagemHero ?? '/imagens/og.png'

  return {
    title: evento.nome,
    description: evento.descricao,
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      siteName: produtora.nome,
      title: `${evento.nome} — ${produtora.nome}`,
      description: evento.descricao,
      images: [imagem],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${evento.nome} — ${produtora.nome}`,
      description: evento.descricao,
      images: [imagem],
    },
    alternates: { canonical: `/eventos/${evento.slug}` },
  }
}

export default async function PaginaEvento({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const evento = eventoPorSlug(slug)
  if (!evento) notFound()

  const futuro = ehFuturo(evento)
  const mostraIngressos = futuro && evento.vendaAberta
  const fotos = (evento.galeria ?? []).map((src) => ({
    src,
    evento: evento.nome,
  }))

  // Outros eventos para sugerir no fim da página
  const sugestoes = proximosEventos()
    .filter((e) => e.slug !== evento.slug)
    .slice(0, 3)

  const videos = evento.videos ?? []

  const links = [
    ...(evento.cartaz ? [{ href: '#cartaz', rotulo: 'Cartaz' }] : []),
    { href: '#lineup', rotulo: 'Line-up' },
    ...(mostraIngressos ? [{ href: '#ingressos', rotulo: 'Ingressos' }] : []),
    ...(videos.length > 0 ? [{ href: '#videos', rotulo: 'Vídeos' }] : []),
    ...(fotos.length > 0 ? [{ href: '#galeria', rotulo: 'Fotos' }] : []),
    { href: '#faq', rotulo: 'Dúvidas' },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicEvent',
    name: evento.nome,
    description: evento.descricao,
    startDate: evento.dataInicio,
    doorTime: evento.aberturaPortoes,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/eventos/${evento.slug}`,
    location: {
      '@type': 'Place',
      name: evento.local,
      address: {
        '@type': 'PostalAddress',
        streetAddress: evento.endereco || evento.local,
        addressLocality: produtora.cidade,
        addressRegion: produtora.estado,
        addressCountry: 'BR',
      },
    },
    performer: evento.lineup
      .filter((a) => a.destaque)
      .map((a) => ({ '@type': 'MusicGroup', name: a.titulo })),
    organizer: {
      '@type': 'Organization',
      name: produtora.nome,
      url: process.env.NEXT_PUBLIC_SITE_URL,
    },
    ...(mostraIngressos && evento.lotes.length > 0
      ? {
          offers: {
            '@type': 'Offer',
            availability: 'https://schema.org/InStock',
            url: `${process.env.NEXT_PUBLIC_SITE_URL}/eventos/${evento.slug}#ingressos`,
            priceCurrency: 'BRL',
            price: (
              Math.min(...evento.lotes.map((l) => l.precoCentavos)) / 100
            ).toFixed(2),
            validFrom: new Date().toISOString(),
          },
        }
      : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Header
        links={links}
        voltar={futuro ? 'Próximo evento' : 'Arquivo'}
        cta={mostraIngressos ? { href: '#ingressos', rotulo: 'Ingressos' } : undefined}
      />

      <main id="conteudo">
        <HeroEvento evento={evento} />

        {evento.cartaz && (
          <>
            <div className="divisor mx-auto max-w-5xl" />
            <CartazEvento
              src={evento.cartaz}
              evento={evento.nome}
              creditos={evento.cartazCredito}
            />
          </>
        )}

        <div className="divisor mx-auto max-w-5xl" />

        <DetalhesEvento evento={evento} />

        {mostraIngressos && (
          <>
            <div className="divisor mx-auto max-w-5xl" />
            <Ingressos evento={evento} />
          </>
        )}

        {futuro && !evento.vendaAberta && (
          <>
            <div className="divisor mx-auto max-w-5xl" />
            <section id="ingressos" className="px-5 py-24">
              <div className="cartao cartao-ouro mx-auto max-w-lg p-8 text-center">
                {evento.entrada ? (
                  // Entrada franca, por doação ou convite: nada de "vendas em
                  // breve", que daria a entender que vai ser cobrado.
                  <>
                    <p className="rotulo">Como entrar</p>
                    <h2 className="mt-4 font-display text-2xl font-bold texto-ouro">
                      {evento.entrada.titulo}
                    </h2>
                    <p className="mt-4 text-sm leading-relaxed text-texto-suave">
                      {evento.entrada.texto}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="rotulo">Ingressos</p>
                    <h2 className="mt-4 font-display text-2xl font-bold text-texto">
                      Vendas em breve
                    </h2>
                    <p className="mt-4 text-sm leading-relaxed text-texto-suave">
                      Ainda estamos fechando os detalhes. Siga a gente para
                      saber na hora em que os ingressos entrarem à venda.
                    </p>
                  </>
                )}

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
            </section>
          </>
        )}

        {videos.length > 0 && (
          <>
            <div className="divisor mx-auto max-w-5xl" />
            <Videos
              videos={videos}
              rotulo="Em movimento"
              titulo="Assista"
              canal={produtora.redes.youtube || undefined}
            />
          </>
        )}

        {fotos.length > 0 && (
          <>
            <div className="divisor mx-auto max-w-5xl" />
            <Galeria
              fotos={fotos}
              rotulo="Como foi"
              titulo="Registros da noite"
              subtitulo={`${fotos.length} fotos de ${evento.nome}.`}
              limite={12}
            />
          </>
        )}

        <div className="divisor mx-auto max-w-5xl" />

        <FAQ />

        {/* ---- Sugestões: nunca deixar a página sem saída ---- */}
        <section className="px-5 pb-24">
          <div className="mx-auto max-w-5xl">
            <Ornamento className="mb-14" />

            {sugestoes.length > 0 ? (
              <>
                <h2 className="mb-6 text-center font-display text-2xl font-bold text-texto">
                  Próximos eventos
                </h2>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {sugestoes.map((e) => (
                    <CardEvento key={e.slug} evento={e} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center">
                <p className="text-sm text-texto-suave">
                  Quer ver tudo que a Golden Eye já fez?
                </p>
                <Link href="/eventos" className="botao-fantasma mt-5 inline-flex !py-3 !text-sm">
                  Ver todos os eventos
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
