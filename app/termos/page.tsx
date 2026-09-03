import Link from 'next/link'
import type { Metadata } from 'next'
import { Marca } from '@/components/OlhoDeHorus'
import { produtora, MAX_INGRESSOS_POR_CPF } from '@/config/site'

export const metadata: Metadata = { title: 'Termos de Compra' }

// >>> IMPORTANTE: este texto cobre o essencial exigido pelo CDC e pela Lei
// 12.933/13, mas não substitui a revisão de um advogado. Se puder, passe os
// olhos de um profissional antes do primeiro evento.

export default function Termos() {
  return (
    <div className="min-h-screen px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/">
          <Marca compacta />
        </Link>

        <h1 className="mt-12 font-display text-3xl font-bold texto-ouro">
          Termos de Compra
        </h1>
        <p className="mt-2 text-xs text-texto-fraco">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-texto-suave">
          <Secao titulo="1. Quem somos">
            <p>
              Estes termos regem a venda de ingressos realizada por{' '}
              <strong className="text-texto">{produtora.razaoSocial}</strong>,
              inscrita no CNPJ {produtora.cnpj}, doravante "produtora", através
              deste site. Ao concluir uma compra você declara ter lido e
              aceitado integralmente estas condições.
            </p>
          </Secao>

          <Secao titulo="2. O ingresso">
            <p>
              O ingresso é <strong className="text-texto">nominal</strong> e
              vinculado ao nome e CPF informados no momento da compra. Na
              entrada é obrigatória a apresentação do QR Code (na tela do
              celular ou impresso) acompanhado de documento oficial com foto.
            </p>
            <p>
              Cada QR Code permite <strong className="text-texto">uma única
              entrada</strong>. Após a leitura, o ingresso é invalidado
              automaticamente. Cópias, prints e reproduções do mesmo código não
              geram direito a entrada adicional.
            </p>
            <p>
              A titularidade pode ser transferida gratuitamente pelo comprador
              na área "Meus Ingressos" até 24 horas antes da abertura dos
              portões.
            </p>
            <p>
              É permitida a compra de até {MAX_INGRESSOS_POR_CPF} ingressos por
              CPF. A produtora pode cancelar, sem reembolso de taxas, compras
              com indício de revenda ou fraude.
            </p>
          </Secao>

          <Secao titulo="3. Meia-entrada (Lei nº 12.933/2013)">
            <p>
              A produtora destina{' '}
              <strong className="text-texto">40% do total de ingressos</strong>{' '}
              à meia-entrada, conforme a Lei Federal nº 12.933/2013 e o Decreto
              nº 8.537/2015.
            </p>
            <p>Têm direito ao benefício, mediante comprovação:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Estudantes, com Carteira de Identificação Estudantil (CIE) válida;</li>
              <li>Pessoas com 60 anos ou mais, com documento oficial com foto;</li>
              <li>
                Pessoas com deficiência e um acompanhante, mediante laudo ou
                documento comprobatório;
              </li>
              <li>
                Jovens de 15 a 29 anos de baixa renda inscritos no CadÚnico, com
                a Identidade Jovem.
              </li>
            </ul>
            <p>
              <strong className="text-texto">
                A comprovação é obrigatória na portaria.
              </strong>{' '}
              Sem apresentação de documento válido, será cobrada no local a
              diferença entre o valor pago e o da inteira, sob pena de não
              liberação da entrada.
            </p>
          </Secao>

          <Secao titulo="4. Pagamento">
            <p>
              O pagamento é processado via PIX pela plataforma Mercado Pago. A
              produtora não coleta, armazena ou tem acesso a dados bancários ou
              de cartão.
            </p>
            <p>
              O ingresso é emitido apenas após a confirmação do pagamento pela
              instituição financeira. Pedidos não pagos dentro do prazo de
              validade do PIX são cancelados automaticamente e os ingressos
              retornam ao estoque, sem qualquer cobrança.
            </p>
          </Secao>

          <Secao titulo="5. Cancelamento e reembolso (Art. 49 do CDC)">
            <p className="rounded-xl border border-ouro/30 bg-ouro/[0.05] p-4 text-texto">
              Nos termos do <strong>Artigo 49 do Código de Defesa do
              Consumidor</strong>, o comprador pode desistir da compra e receber
              o reembolso integral do valor pago no prazo de{' '}
              <strong>até 7 (sete) dias corridos</strong> contados da data da
              confirmação do pagamento.
            </p>
            <p>
              Caso o evento ocorra dentro desse período de 7 dias, a solicitação
              de cancelamento deve ser feita com no mínimo{' '}
              <strong className="text-texto">48 (quarenta e oito) horas de
              antecedência</strong> da abertura dos portões.
            </p>
            <p>
              Após a realização do evento, ou após a utilização do ingresso na
              portaria, não há direito a reembolso, pois o serviço já terá sido
              prestado.
            </p>
            <p>
              O cancelamento pode ser feito pelo próprio comprador na área{' '}
              <Link href="/meus-ingressos" className="text-ouro underline underline-offset-2">
                Meus Ingressos
              </Link>
              , com estorno automático pela mesma forma de pagamento.
              Alternativamente, envie um e-mail para{' '}
              <a href={`mailto:${produtora.emailIngressos}`} className="text-ouro">
                {produtora.emailIngressos}
              </a>{' '}
              a partir do e-mail cadastrado na compra.
            </p>
          </Secao>

          <Secao titulo="6. Alteração ou cancelamento do evento">
            <p>
              Em caso de <strong className="text-texto">cancelamento do
              evento</strong> pela produtora, o valor integral será devolvido a
              todos os compradores, independentemente de prazo.
            </p>
            <p>
              Em caso de <strong className="text-texto">adiamento</strong>, o
              ingresso passa a valer automaticamente para a nova data. O
              comprador que não puder comparecer poderá solicitar o reembolso
              integral em até 7 dias corridos após o comunicado oficial.
            </p>
            <p>
              Alterações no line-up por motivo de força maior (doença, problemas
              de transporte, condições climáticas) não caracterizam
              descumprimento e não geram, por si só, direito a reembolso, desde
              que o evento seja realizado.
            </p>
          </Secao>

          <Secao titulo="7. Regras do evento">
            <p>
              A classificação etária de cada evento é informada na página do
              evento e no ingresso. É sempre obrigatória a apresentação de
              documento original com foto na entrada.
            </p>
            <p>
              A produtora e a casa de eventos podem recusar a entrada ou
              solicitar a retirada de pessoas em estado de embriaguez, sob efeito
              de substâncias ilícitas, portando objetos proibidos, ou que
              adotem conduta agressiva, discriminatória ou de assédio — sem
              direito a reembolso.
            </p>
            <p>
              Não é permitida a entrada com bebidas, alimentos, garrafas, latas,
              objetos de vidro, armas ou objetos cortantes.
            </p>
          </Secao>

          <Secao titulo="8. Imagem">
            <p>
              O evento poderá ser fotografado e filmado. Ao entrar, o
              participante autoriza o uso de sua imagem em registros
              audiovisuais de caráter documental e promocional da produtora, sem
              ônus. Quem preferir não ser registrado pode comunicar a equipe de
              produção no local.
            </p>
          </Secao>

          <Secao titulo="9. Contato e foro">
            <p>
              Dúvidas, reclamações e solicitações:{' '}
              <a href={`mailto:${produtora.email}`} className="text-ouro">
                {produtora.email}
              </a>{' '}
              ou WhatsApp {produtora.whatsappLabel}.
            </p>
            <p>
              Fica eleito o foro do domicílio do consumidor para dirimir
              questões oriundas destes termos, nos termos do CDC.
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
