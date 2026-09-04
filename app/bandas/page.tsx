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
//  quem CONTRATA. Dono de bar, produtor, quem organiza festa. Por isso a
//  página fala de repertório, formação e orçamento — não de data e local.
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
            <p className="rotulo">Casting</p>
            <h1 className="mt-4 font-display text-4xl font-black sm:text-6xl">
              <span className="texto-ouro">Bandas</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-texto-suave sm:text-base">
              As bandas que trabalham com a Golden Eye. Se você tem uma casa,
              um festival ou uma data para preencher em {produtora.cidade} e
              região, fale com a gente.
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
            <p className="rotulo">Quer levar uma dessas para a sua casa?</p>
            <h2 className="mt-4 font-display text-2xl font-bold text-texto sm:text-3xl">
              Peça um orçamento
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-texto-suave">
              A gente cuida de tudo: cachê, rider técnico, contrato e a
              divulgação do show. Chame no WhatsApp com a data e o espaço que
              respondemos com uma proposta.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={`https://wa.me/${produtora.whatsapp}?text=${encodeURIComponent(
                  'Olá! Vi o site da Golden Eye Prods. e queria um orçamento para show.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="botao-ouro w-full sm:w-auto"
              >
                Falar no WhatsApp
              </a>
              <a
                href={`mailto:${produtora.email}?subject=${encodeURIComponent('Orçamento para show')}`}
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
