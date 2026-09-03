'use client'

import { useState } from 'react'
import { Ornamento } from './OlhoDeHorus'
import { faq, produtora } from '@/config/site'

export function FAQ() {
  // -1 = tudo fechado. Só um aberto por vez mantém a lista escaneável.
  const [aberto, setAberto] = useState(-1)

  return (
    <section id="faq" className="relative px-5 py-24 sm:py-32">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <p className="rotulo">Antes de perguntar</p>
          <h2 className="mt-4 font-display text-4xl font-bold sm:text-5xl">
            Dúvidas frequentes
          </h2>
        </div>

        <Ornamento className="my-12" />

        <div className="space-y-2">
          {faq.map((item, i) => {
            const estaAberto = aberto === i
            return (
              <div
                key={item.p}
                className={`cartao overflow-hidden transition-colors ${
                  estaAberto ? 'border-ouro/35' : ''
                }`}
              >
                <h3>
                  <button
                    onClick={() => setAberto(estaAberto ? -1 : i)}
                    aria-expanded={estaAberto}
                    aria-controls={`faq-r-${i}`}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span
                      className={`text-sm font-medium transition-colors sm:text-base ${
                        estaAberto ? 'text-ouro-claro' : 'text-texto'
                      }`}
                    >
                      {item.p}
                    </span>
                    <span
                      className={`shrink-0 text-ouro transition-transform duration-300 ${
                        estaAberto ? 'rotate-45' : ''
                      }`}
                      aria-hidden="true"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                      </svg>
                    </span>
                  </button>
                </h3>

                <div
                  id={`faq-r-${i}`}
                  hidden={!estaAberto}
                  className="px-6 pb-5 text-sm leading-relaxed text-texto-suave"
                >
                  {item.r}
                </div>
              </div>
            )
          })}
        </div>

        <div className="cartao mt-8 p-6 text-center">
          <p className="text-sm text-texto-suave">
            Ficou alguma dúvida que não está aqui?
          </p>
          <a
            href={`https://wa.me/${produtora.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="botao-fantasma mt-4 !py-3 !text-sm"
          >
            Chamar a produção no WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}
