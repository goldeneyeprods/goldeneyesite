import { Header } from '@/components/Header'
import { CardEvento } from '@/components/CardEvento'
import { FAQ } from '@/components/FAQ'
import { Footer } from '@/components/Footer'
import { Hero, linkDeCompra } from '@/components/home/Hero'
import { Creditos } from '@/components/home/Creditos'
import { Universos } from '@/components/home/Universos'
import { Dossies } from '@/components/home/Dossies'
import { Arquivo } from '@/components/home/Arquivo'
import { Manifesto } from '@/components/home/Manifesto'
import { BarraCompra } from '@/components/home/BarraCompra'
import {
  produtora,
  proximosEventos,
  eventosPassados,
  todasAsFotos,
  bandas,
} from '@/config/site'
import { urlDoSite } from '@/lib/url'

// ============================================================================
//  HOME — A PRODUTORA
//  Direção "a noite como ritual" (noir · 007 · Egito). A primeira tela diz
//  quem é a Golden Eye e já mostra o próximo evento como ingresso de cinema,
//  com o único botão dourado da tela. Depois: créditos, os três universos,
//  os dossiês das bandas, o arquivo em tira de filme e o manifesto.
// ============================================================================


export default function Home() {
  const proximos = proximosEventos()
  const passados = eventosPassados()
  const destaque = proximos[0]
  const outros = proximos.slice(1)
  const totalFotos = todasAsFotos().length
  const creditos = [
    ...(destaque?.bandas ?? [])
      .map((s) => bandas.find((b) => b.slug === s)?.nome)
      .filter((n): n is string => !!n),
    'Fuzz',
    'Luz',
    'Projeção',
    'Discotecagem até a madrugada',
  ]
  const compra = destaque ? linkDeCompra(destaque) : null
  const quandoDestaque = destaque
    ? new Intl.DateTimeFormat('pt-BR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
      })
        .format(new Date(destaque.dataInicio))
        .replace('.', '')
    : ''

  // Dados estruturados da organização: ajudam o Google a entender que a
  // Golden Eye é a produtora, e não apenas mais uma página de evento.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: produtora.nome,
    description: produtora.descricao,
    url: urlDoSite(),
    logo: `${urlDoSite()}/imagens/logo.png`,
    sameAs: Object.values(produtora.redes).filter(Boolean),
    email: produtora.email,
    founder: {
      '@type': 'Person',
      name: produtora.direcao.nome,
      jobTitle: produtora.direcao.cargo,
    },
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

      <Header />

      <main id="conteudo">
        <div id="agenda">
          <Hero destaque={destaque} />
        </div>

        <Creditos itens={creditos} />

        {/* Mais de um evento marcado: os outros entram logo abaixo */}
        {outros.length > 0 && (
          <section className="px-5 pt-20">
            <div className="mx-auto max-w-6xl">
              <p className="rotulo">Também na agenda</p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {outros.map((e) => (
                  <CardEvento key={e.slug} evento={e} />
                ))}
              </div>
            </div>
          </section>
        )}

        <Universos proximos={proximos} />
        <Dossies />
        <Arquivo passados={passados} totalFotos={totalFotos} />
        <Manifesto />

        <div className="divisor mx-auto max-w-5xl" />
        <FAQ />
      </main>

      <Footer />

      {destaque && compra && (
        <BarraCompra
          nome={destaque.nome}
          quando={`${quandoDestaque} · ${destaque.local}`}
          href={compra.href}
          rotulo={compra.rotulo === 'Comprar ingresso' ? 'Comprar' : compra.rotulo}
        />
      )}
    </>
  )
}
