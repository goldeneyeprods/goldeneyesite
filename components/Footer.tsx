import Link from 'next/link'
import { produtora, proximosEventos, eventosPassados } from '@/config/site'

export function Footer() {
  const ano = new Date().getFullYear()
  // O rodapé lista os eventos de verdade — vira mapa do site e ajuda o Google
  // a achar cada LP sem depender do menu.
  const agenda = [...proximosEventos(), ...eventosPassados()].slice(0, 5)

  return (
    <footer className="sem-impressao relative border-t border-borda px-5 pb-24 pt-14 md:pb-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-display text-lg font-bold text-texto">
              Golden Eye <span className="text-ouro">Prods.</span>
            </p>
            <p className="mt-1 text-sm text-texto-suave">
              {produtora.cidade}, {produtora.estado}
            </p>
          </div>

          <nav aria-label="Navegação do rodapé">
            <ul className="flex flex-wrap gap-x-7 gap-y-3 text-sm">
              {produtora.redes.instagram && (
                <li>
                  <a href={produtora.redes.instagram} target="_blank" rel="noopener noreferrer" className="text-ouro-claro hover:underline">
                    Instagram
                  </a>
                </li>
              )}
              {produtora.redes.youtube && (
                <li>
                  <a href={produtora.redes.youtube} target="_blank" rel="noopener noreferrer" className="text-ouro-claro hover:underline">
                    YouTube
                  </a>
                </li>
              )}
              <li>
                <a href={`https://wa.me/${produtora.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-ouro-claro hover:underline">
                  WhatsApp da produção
                </a>
              </li>
              <li><Link href="/#faq" className="text-ouro-claro hover:underline">Dúvidas frequentes</Link></li>
              <li><Link href="/meus-ingressos" className="text-texto-suave hover:text-ouro-claro">Meus ingressos</Link></li>
              <li><Link href="/termos" className="text-texto-suave hover:text-ouro-claro">Termos de compra</Link></li>
              <li><Link href="/privacidade" className="text-texto-suave hover:text-ouro-claro">Privacidade</Link></li>
            </ul>
            {agenda.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs">
                {agenda.map((e) => (
                  <li key={e.slug}>
                    <Link href={`/eventos/${e.slug}`} className="text-texto-fraco hover:text-ouro-claro">
                      {e.nome}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </nav>
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
          <p>
            Direção artística: {produtora.direcao.nome}
          </p>
          <p>Documento com foto obrigatório na entrada dos eventos</p>
        </div>

      </div>
    </footer>
  )
}
