import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import { CardBanda } from '@/components/CardBanda'
import { Footer } from '@/components/Footer'
import { Ornamento } from '@/components/OlhoDeHorus'
import { bandas, produtora } from '@/config/site'

export const metadata: Metadata = {
  title: 'Bandas',
  description:
    `As bandas que tocam com a ${produtora.nome} em ${produtora.cidade}. ` +
    'Release, fotos e contato para contratação.',
}

// ============================================================================
//  /bandas — o casting
//
//  Público diferente do resto do site: aqui não é quem compra ingresso, é
//  quem CONTRATA — dono de bar, produtor, quem organiza festa. Por isso a
//  página fala de repertório e formação, não de data e local.
//
//  O tom é direto de propósito: quem contrata banda de rock psicodélico
//  não quer linguagem de agência, quer saber que som é e como chamar.
// ============================================================================

export default function PaginaBandas() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Bandas — ${produtora.nome}`,
    itemListElement: bandas.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'MusicGroup',
        name: b.nome,
        genre: b.genero,
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/bandas/${b.slug}`,
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Header
        links={[
          { href: '/#agenda', rotulo: 'Agenda' },
          { href: '/bandas', rotulo: 'Bandas' },
          { href: '/#sobre', rotulo: 'A produtora' },
        ]}
        cta={{ href: `https://wa.me/${produtora.whatsapp}`, rotulo: 'Contratar' }}
      />

      <main id="conteudo" className="px-5 pb-24 pt-32">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="rotulo">Quem toca com a gente</p>
            <h1 className="mt-4 font-display text-4xl font-black sm:text-6xl">
              <span className="texto-ouro">Bandas</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-texto-suave sm:text-base">
              As bandas que sobem no palco com a gente. Se você tem uma casa,
              um bar, um festival ou uma data em aberto em {produtora.cidade},
              chama.
            </p>
          </div>

          <Ornamento className="my-14" />

          <div className="grid gap-6 sm:grid-cols-2">
            {bandas.map((b) => (
              <CardBanda key={b.slug} banda={b} />
            ))}
          </div>

          {/* --- Chamada para quem contrata --- */}
          <div className="cartao cartao-ouro mt-14 p-8 text-center sm:p-10">
            <p className="rotulo">Quer uma delas na sua casa?</p>
            <h2 className="mt-4 font-display text-2xl font-bold text-texto sm:text-3xl">
              Chama a gente
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-texto-suave">
              A gente resolve o resto: cachê, rider, contrato e a divulgação.
              Manda a data e o espaço no WhatsApp que a gente volta com uma
              proposta — sem enrolação e sem formulário.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={`https://wa.me/${produtora.whatsapp}?text=${encodeURIComponent(
                  'Oi! Vi o site da Golden Eye e queria falar sobre um show.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="botao-ouro w-full sm:w-auto"
              >
                Falar no WhatsApp
              </a>
              <a
                href={`mailto:${produtora.email}?subject=${encodeURIComponent('Show — Golden Eye')}`}
                className="botao-fantasma w-full sm:w-auto"
              >
                Mandar e-mail
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
