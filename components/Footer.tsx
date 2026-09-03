import Link from 'next/link'
import { Marca } from './OlhoDeHorus'
import { produtora, proximosEventos, eventosPassados } from '@/config/site'

export function Footer() {
  const ano = new Date().getFullYear()
  // O rodapé lista os eventos de verdade — vira mapa do site e ajuda o Google
  // a achar cada LP sem depender do menu.
  const agenda = [...proximosEventos(), ...eventosPassados()].slice(0, 5)

  return (
    <footer className="sem-impressao relative border-t border-borda px-5 pb-10 pt-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Marca />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-texto-suave">
              {produtora.tagline}.
            </p>
            <div className="mt-6 flex gap-3">
              {produtora.redes.instagram && (
                <a
                  href={produtora.redes.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-borda p-2.5 text-texto-suave transition-colors hover:border-ouro hover:text-ouro"
                  aria-label="Instagram"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                  </svg>
                </a>
              )}
              {produtora.redes.youtube && (
                <a
                  href={produtora.redes.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-borda p-2.5 text-texto-suave transition-colors hover:border-ouro hover:text-ouro"
                  aria-label="YouTube"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23 12s0-3.9-.5-5.8a3 3 0 0 0-2.1-2.1C18.5 3.6 12 3.6 12 3.6s-6.5 0-8.4.5A3 3 0 0 0 1.5 6.2C1 8.1 1 12 1 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 8.4.5 8.4.5s6.5 0 8.4-.5a3 3 0 0 0 2.1-2.1C23 15.9 23 12 23 12ZM9.8 15.6V8.4l6.3 3.6-6.3 3.6Z" />
                  </svg>
                </a>
              )}
              <a
                href={`https://wa.me/${produtora.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-borda p-2.5 text-texto-suave transition-colors hover:border-ouro hover:text-ouro"
                aria-label="WhatsApp"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1a13 13 0 0 1-5.6-4.9c-.4-.6-1-1.5-1-2.8 0-1.3.7-2 .9-2.2.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .6l-.4.5-.3.3c-.1.1-.2.3 0 .5.2.4.8 1.3 1.6 2 1 .9 1.9 1.2 2.2 1.3.2.1.4 0 .5-.1l.8-1c.2-.2.3-.2.6-.1l2 1c.2.1.4.2.4.3.1.2.1.8-.1 1.3Z" />
                </svg>
              </a>
            </div>
          </div>

          <nav aria-label="Navegação do rodapé">
            <h3 className="rotulo">Navegar</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/" className="text-texto-suave transition-colors hover:text-ouro">Início</Link></li>
              <li><Link href="/eventos" className="text-texto-suave transition-colors hover:text-ouro">Todos os eventos</Link></li>
              <li><Link href="/#sobre" className="text-texto-suave transition-colors hover:text-ouro">A produtora</Link></li>
              <li><Link href="/#faq" className="text-texto-suave transition-colors hover:text-ouro">Dúvidas</Link></li>
              <li><Link href="/meus-ingressos" className="text-texto-suave transition-colors hover:text-ouro">Meus ingressos</Link></li>
            </ul>
          </nav>

          <div>
            <h3 className="rotulo">Eventos</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {agenda.map((e) => (
                <li key={e.slug}>
                  <Link
                    href={`/eventos/${e.slug}`}
                    className="text-texto-suave transition-colors hover:text-ouro"
                  >
                    {e.nome}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="rotulo">Legal</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/termos" className="text-texto-suave transition-colors hover:text-ouro">Termos de Compra</Link></li>
              <li><Link href="/privacidade" className="text-texto-suave transition-colors hover:text-ouro">Privacidade (LGPD)</Link></li>
              <li>
                <a href={`mailto:${produtora.email}`} className="text-texto-suave transition-colors hover:text-ouro">
                  {produtora.email}
                </a>
              </li>
              <li className="text-texto-suave">{produtora.whatsappLabel}</li>
            </ul>
          </div>
        </div>

        {/* --- POLÍTICA DE REEMBOLSO (obrigatória e visível) --- */}
        <div className="mt-14 rounded-xl border border-borda bg-noite-2/50 p-6">
          <h3 className="rotulo">Cancelamento e reembolso</h3>
          <p className="mt-3 text-xs leading-relaxed text-texto-suave">
            Nos termos do <strong className="text-texto">Artigo 49 do Código de
            Defesa do Consumidor</strong>, o comprador pode solicitar o
            cancelamento da compra e o reembolso integral do valor pago no prazo
            de até <strong className="text-texto">7 (sete) dias corridos</strong>{' '}
            contados da data da confirmação do pagamento. Caso o evento ocorra
            dentro desse período, a solicitação deve ser feita com no mínimo{' '}
            <strong className="text-texto">48 (quarenta e oito) horas de
            antecedência</strong> da abertura dos portões. Após a realização do
            evento não há direito a reembolso, pois o serviço já foi prestado.
            O cancelamento pode ser feito pelo próprio comprador em{' '}
            <Link href="/meus-ingressos" className="text-ouro underline underline-offset-2">
              Meus Ingressos
            </Link>{' '}
            ou pelo e-mail {produtora.emailIngressos}.
          </p>
          <p className="mt-4 text-xs leading-relaxed text-texto-suave">
            <strong className="text-texto">Meia-entrada.</strong> Conforme a Lei
            Federal nº 12.933/2013, 40% dos ingressos são destinados à
            meia-entrada. A comprovação do direito é obrigatória na portaria.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-borda pt-8 text-xs text-texto-fraco sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {ano} {produtora.razaoSocial} — CNPJ {produtora.cnpj}
          </p>
          <p>Documento com foto obrigatório na entrada dos eventos</p>
        </div>
      </div>
    </footer>
  )
}
