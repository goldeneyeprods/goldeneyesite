import Link from 'next/link'
import type { Metadata } from 'next'
import { Marca } from '@/components/OlhoDeHorus'
import { produtora } from '@/config/site'

export const metadata: Metadata = { title: 'Política de Privacidade' }

export default function Privacidade() {
  return (
    <div className="min-h-screen px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/">
          <Marca compacta />
        </Link>

        <h1 className="mt-12 font-display text-3xl font-bold texto-ouro">
          Política de Privacidade
        </h1>
        <p className="mt-2 text-xs text-texto-fraco">
          Lei Geral de Proteção de Dados (Lei nº 13.709/2018) · Atualizada em{' '}
          {new Date().toLocaleDateString('pt-BR')}
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-texto-suave">
          <Secao titulo="1. Quem controla seus dados">
            <p>
              <strong className="text-texto">{produtora.razaoSocial}</strong>,
              CNPJ {produtora.cnpj}, é a controladora dos dados pessoais
              coletados neste site. Contato para assuntos de privacidade:{' '}
              <a href={`mailto:${produtora.email}`} className="text-ouro">
                {produtora.email}
              </a>
              .
            </p>
          </Secao>

          <Secao titulo="2. Quais dados coletamos e por quê">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-borda">
                  <th className="py-2 pr-3 font-semibold text-texto">Dado</th>
                  <th className="py-2 pr-3 font-semibold text-texto">Para quê</th>
                  <th className="py-2 font-semibold text-texto">Base legal</th>
                </tr>
              </thead>
              <tbody className="align-top">
                {[
                  ['Nome completo', 'Emitir o ingresso nominal e conferir na portaria', 'Execução de contrato'],
                  ['CPF', 'Identificação na entrada, limite por comprador e exigência do gateway', 'Execução de contrato'],
                  ['E-mail', 'Enviar o ingresso e dar acesso à área do comprador', 'Execução de contrato'],
                  ['Telefone', 'Contato sobre a compra e avisos do evento', 'Execução de contrato'],
                  ['IP e data do aceite', 'Registro do consentimento aos termos', 'Obrigação legal'],
                  ['Horário de entrada', 'Controle de acesso e segurança do evento', 'Legítimo interesse'],
                ].map((linha) => (
                  <tr key={linha[0]} className="border-b border-borda/50">
                    <td className="py-2.5 pr-3 text-texto">{linha[0]}</td>
                    <td className="py-2.5 pr-3">{linha[1]}</td>
                    <td className="py-2.5">{linha[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4">
              <strong className="text-texto">Não coletamos</strong> dados
              bancários, número de cartão ou senha. O pagamento é feito
              inteiramente dentro do ambiente do Mercado Pago.
            </p>
          </Secao>

          <Secao titulo="3. Com quem compartilhamos">
            <ul className="ml-5 list-disc space-y-1.5">
              <li>
                <strong className="text-texto">Mercado Pago</strong> — processamento
                do pagamento e do estorno.
              </li>
              <li>
                <strong className="text-texto">Resend</strong> — envio dos e-mails
                transacionais (ingresso, acesso e reembolso).
              </li>
              <li>
                <strong className="text-texto">Supabase e Vercel</strong> —
                hospedagem do banco de dados e da aplicação.
              </li>
              <li>
                <strong className="text-texto">Equipe de portaria</strong> — acesso
                à lista de nomes durante o evento, exclusivamente para controle
                de entrada.
              </li>
            </ul>
            <p className="mt-3">
              Não vendemos, alugamos nem cedemos seus dados para terceiros com
              finalidade publicitária.
            </p>
          </Secao>

          <Secao titulo="4. Por quanto tempo guardamos">
            <p>
              Dados de compra são mantidos por{' '}
              <strong className="text-texto">5 anos</strong> após o evento, prazo
              prescricional do CDC para eventual defesa em processo. Registros de
              entrada são mantidos por 1 ano. Depois disso, os dados são
              eliminados ou anonimizados.
            </p>
          </Secao>

          <Secao titulo="5. Seus direitos">
            <p>
              A LGPD garante a você o direito de confirmar o tratamento, acessar,
              corrigir, anonimizar, portar e solicitar a eliminação dos seus
              dados, além de revogar o consentimento.
            </p>
            <p>
              Para exercer qualquer desses direitos, escreva para{' '}
              <a href={`mailto:${produtora.email}`} className="text-ouro">
                {produtora.email}
              </a>{' '}
              a partir do e-mail cadastrado. Respondemos em até 15 dias.
            </p>
            <p className="text-xs text-texto-fraco">
              Observação: dados vinculados a uma compra realizada podem ser
              mantidos mesmo após pedido de exclusão, quando houver obrigação
              legal ou necessidade de defesa em processo — hipóteses previstas
              no art. 16 da LGPD.
            </p>
          </Secao>

          <Secao titulo="6. Segurança">
            <p>
              Todo o tráfego do site é criptografado (HTTPS). Os ingressos são
              assinados criptograficamente para impedir falsificação. O acesso à
              área do comprador é feito por link temporário enviado ao e-mail
              cadastrado, sem senha reutilizável. O acesso da equipe de portaria
              é individual, por PIN, com sessão que expira em 12 horas.
            </p>
          </Secao>

          <Secao titulo="7. Cookies">
            <p>
              Usamos apenas cookies estritamente necessários: um cookie de
              sessão para manter você autenticado na área "Meus Ingressos".
              Não utilizamos cookies de publicidade nem de rastreamento de
              terceiros.
            </p>
          </Secao>
        </div>

        <Link href="/" className="botao-fantasma mt-14 inline-flex !py-3 !text-sm">
          Voltar ao site
        </Link>
      </div>
    </div>
  )
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg font-bold text-texto">{titulo}</h2>
      {children}
    </section>
  )
}
