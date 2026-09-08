import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Galeria } from '@/components/Galeria'
import { Videos } from '@/components/Videos'
import { CardBanda } from '@/components/CardBanda'
import { Ornamento } from '@/components/OlhoDeHorus'
import { bandas, bandaPorSlug, produtora } from '@/config/site'

// ============================================================================
//  /bandas/<slug> — o release de cada banda
//
//  É o material que um dono de bar abre antes de decidir chamar a banda.
//  Precisa responder rápido: que som é, o que sobe no palco, como é ao vivo
//  e como falar com a gente.
// ============================================================================

export function generateStaticParams() {
  return bandas.map((b) => ({ slug: b.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const banda = bandaPorSlug(slug)
  if (!banda) return { title: 'Banda não encontrada' }

  return {
    title: banda.nome,
    description: `${banda.resumo}. ${banda.genero} de ${banda.cidade}.`,
    openGraph: {
      type: 'profile',
      locale: 'pt_BR',
      siteName: produtora.nome,
      title: `${banda.nome} — ${produtora.nome}`,
      description: banda.resumo,
      images: [banda.fotos[0]],
    },
    alternates: { canonical: `/bandas/${banda.slug}` },
  }
}

export default async function PaginaBanda({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const banda = bandaPorSlug(slug)
  if (!banda) notFound()

  const outras = bandas.filter((b) => b.slug !== banda.slug)
  const fotos = banda.fotos.map((src) => ({ src, evento: banda.nome }))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: banda.nome,
    genre: banda.genero,
    description: banda.conceito,
    image: banda.fotos[0],
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/bandas/${banda.slug}`,
    foundingLocation: { '@type': 'City', name: produtora.cidade },
  }

  const whatsapp = `https://wa.me/${produtora.whatsapp}?text=${encodeURIComponent(
    `Oi! Queria falar sobre um show do ${banda.nome}.`
  )}`

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Header
        links={[
          { href: '#release', rotulo: 'Release' },
          ...(banda.videos?.length ? [{ href: '#videos', rotulo: 'Vídeos' }] : []),
          { href: '#fotos', rotulo: 'Fotos' },
          { href: '#contratar', rotulo: 'Contratar' },
        ]}
        voltar="Bandas"
        cta={{ href: '#contratar', rotulo: 'Contratar' }}
      />

      <main id="conteudo">
        {/* ================= HERO ================= */}
        <section className="relative flex min-h-[85svh] items-center overflow-hidden px-5 pb-20 pt-32">
          <Image
            src={banda.fotos[0]}
            alt=""
            aria-hidden="true"
            fill
            sizes="100vw"
            priority
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-noite via-noite/75 to-noite/90" />

          <div className="relative z-10 mx-auto w-full max-w-4xl">
            <Link
              href="/bandas"
              className="surgir inline-flex items-center gap-2 text-[11px] tracking-[0.22em] text-texto-fraco transition-colors hover:text-ouro"
            >
              GOLDEN EYE PRODS.
              <span className="text-ouro/40">/</span>
              <span className="text-ouro">BANDAS</span>
            </Link>

            {banda.logo ? (
              <div className="surgir mt-8" style={{ animationDelay: '80ms' }}>
                <Image
                  src={banda.logo}
                  alt={banda.nome}
                  width={800}
                  height={800}
                  priority
                  sizes="(max-width: 640px) 80vw, 380px"
                  className="w-[min(80vw,380px)] object-contain"
                  style={{ height: 'auto' }}
                />
              </div>
            ) : (
              <h1
                className="surgir mt-6 font-display text-[11vw] font-black leading-[0.9] sm:text-6xl lg:text-7xl"
                style={{ animationDelay: '80ms' }}
              >
                <span className="texto-ouro">{banda.nome}</span>
              </h1>
            )}

            <p
              className="surgir mt-6 max-w-xl text-lg leading-relaxed text-texto sm:text-xl"
              style={{ animationDelay: '160ms' }}
            >
              {banda.resumo}
            </p>

            <div
              className="surgir mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-texto-suave"
              style={{ animationDelay: '230ms' }}
            >
              <span>{banda.genero}</span>
              <span className="text-ouro/40">◆</span>
              <span>{banda.cidade}</span>
            </div>

            <div
              className="surgir mt-10 flex flex-col gap-3 sm:flex-row"
              style={{ animationDelay: '300ms' }}
            >
              <a href="#contratar" className="botao-ouro w-full sm:w-auto">
                Chamar pra tocar
              </a>
              <a href="#release" className="botao-fantasma w-full sm:w-auto">
                Ler o release
              </a>
            </div>
          </div>
        </section>

        <div className="divisor mx-auto max-w-5xl" />

        {/* ================= RELEASE ================= */}
        <section id="release" className="px-5 py-24 sm:py-32">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <p className="rotulo">Quem são</p>
              <h2 className="mt-4 font-display text-4xl font-bold sm:text-5xl">
                Release
              </h2>
            </div>

            <Ornamento className="my-12" />

            <div className="space-y-10">
              {[
                { t: 'O conceito', c: banda.conceito },
                { t: 'A sonoridade', c: banda.sonoridade },
                { t: 'Ao vivo', c: banda.aoVivo },
                ...(banda.discografia
                  ? [{ t: 'Discografia e futuro', c: banda.discografia }]
                  : []),
              ].map((bloco) => (
                <div key={bloco.t}>
                  <h3 className="font-display text-xl font-bold text-ouro-claro">
                    {bloco.t}
                  </h3>
                  <p className="mt-3 text-base leading-loose text-texto-suave">
                    {bloco.c}
                  </p>
                </div>
              ))}
            </div>

            {/* --- Ficha técnica: o que o contratante precisa saber --- */}
            <div className="mt-14 grid gap-5 sm:grid-cols-2">
              <div className="cartao p-6">
                <p className="rotulo">No palco</p>
                <ul className="mt-4 space-y-2">
                  {banda.formacao.map((f) => (
                    <li key={f} className="flex gap-3 text-sm text-texto-suave">
                      <span className="text-ouro" aria-hidden="true">◈</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="cartao p-6">
                <p className="rotulo">Soa como</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {banda.referencias.map((r) => (
                    <span
                      key={r}
                      className="rounded-full border border-borda px-3 py-1.5 text-xs text-texto-suave"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {banda.videos && banda.videos.length > 0 && (
          <>
            <div className="divisor mx-auto max-w-5xl" />
            <Videos
              videos={banda.videos}
              rotulo="Ao vivo"
              titulo="Assista"
              canal={banda.redes?.youtube}
            />
          </>
        )}

        <div className="divisor mx-auto max-w-5xl" />

        <Galeria
          id="fotos"
          fotos={fotos}
          rotulo="Como é ao vivo"
          titulo="Fotos"
          subtitulo="Clique para ampliar. Precisa das originais em alta? É só pedir."
          limite={8}
        />

        <div className="divisor mx-auto max-w-5xl" />

        {/* ================= CONTRATAR ================= */}
        <section id="contratar" className="px-5 py-24 sm:py-32">
          <div className="cartao cartao-ouro mx-auto max-w-2xl p-8 text-center sm:p-10">
            <p className="rotulo">Quer levar pra sua casa?</p>
            <h2 className="mt-4 font-display text-3xl font-bold text-texto">
              Leve {banda.nome} para a sua casa
            </h2>
            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-texto-suave">
              A gente resolve o resto: cachê, rider, contrato e divulgação.
              Manda a data e o espaço que a gente volta com uma proposta
              fechada.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="botao-ouro w-full sm:w-auto"
              >
                Falar no WhatsApp
              </a>
              <a
                href={`mailto:${produtora.email}?subject=${encodeURIComponent(
                  `Show — ${banda.nome}`
                )}`}
                className="botao-fantasma w-full sm:w-auto"
              >
                Mandar e-mail
              </a>
            </div>

            <p className="mt-7 text-xs text-texto-fraco">
              {produtora.whatsappLabel} · {produtora.email}
            </p>
          </div>

          {outras.length > 0 && (
            <div className="mx-auto mt-20 max-w-5xl">
              <Ornamento className="mb-12" />
              <h2 className="mb-6 text-center font-display text-2xl font-bold text-texto">
                Outras bandas do casting
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {outras.map((b) => (
                  <CardBanda key={b.slug} banda={b} />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  )
}
