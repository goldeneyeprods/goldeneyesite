import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { linkPedidoValido } from '@/lib/ticket'
import { Marca } from '@/components/OlhoDeHorus'
import { produtora } from '@/config/site'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Seu ingresso',
  robots: { index: false, follow: false },
}

// ============================================================================
//  /ingresso/<pedido>?k=<assinatura>
//  O link que vai no WhatsApp e no lembrete. Mostra o QR de cada ingresso do
//  pedido, grande, para abrir na fila. Sem a assinatura certa, 404.
// ============================================================================

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export default async function PaginaIngresso({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ k?: string }>
}) {
  const { id } = await params
  const { k } = await searchParams
  if (!UUID.test(id) || !linkPedidoValido(id, k)) notFound()

  const [pedido] = await sql<
    {
      status: string
      evento_nome: string
      data_inicio: Date
      abertura_portoes: Date
      local_nome: string
      endereco: string
      meia_solidaria: boolean
    }[]
  >`
    select p.status, e.nome as evento_nome, e.data_inicio, e.abertura_portoes,
           e.local_nome, e.endereco, e.meia_solidaria
      from pedidos p
      join eventos e on e.id = p.evento_id
     where p.id = ${id}
  `
  if (!pedido) notFound()

  const ingressos = await sql<
    { id: string; titular_nome: string; tipo: string; status: string; token_qr: string; lote: string }[]
  >`
    select i.id, i.titular_nome, i.tipo, i.status, i.token_qr, l.nome as lote
      from ingressos i
      join lotes l on l.id = i.lote_id
     where i.pedido_id = ${id}
     order by i.criado_em
  `

  const quando = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(pedido.data_inicio))
  const temMeia = !pedido.meia_solidaria && ingressos.some((i) => i.tipo === 'meia')

  return (
    <div id="conteudo" className="min-h-svh px-5 py-10">
      <div className="mx-auto max-w-md">
        <Link href="/">
          <Marca compacta />
        </Link>

        <p className="rotulo mt-10">Seu ingresso</p>
        <h1 className="mt-3 font-display text-3xl font-bold texto-ouro">{pedido.evento_nome}</h1>
        <p className="mt-2 text-sm text-texto-suave first-letter:uppercase">{quando}</p>
        <p className="mt-1 text-sm text-texto">{pedido.local_nome}</p>
        <p className="text-xs text-texto-fraco">{pedido.endereco}</p>

        {pedido.status !== 'pago' || ingressos.length === 0 ? (
          <div className="cartao mt-8 p-6 text-center text-sm text-texto-suave">
            Este pedido não tem ingresso válido. Se você pagou e algo não bate,
            fale com a produção no{' '}
            <a href={`https://wa.me/${produtora.whatsapp}`} className="text-ouro underline">
              WhatsApp
            </a>
            .
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {ingressos.map((ing) => (
              <div key={ing.id} className="cartao overflow-hidden">
                {ing.status === 'valido' ? (
                  <div className="bg-white p-5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/qr?t=${encodeURIComponent(ing.token_qr)}`}
                      alt="QR Code do ingresso"
                      width={560}
                      height={560}
                      className="mx-auto h-auto w-full max-w-[320px]"
                    />
                  </div>
                ) : (
                  <div className="p-6 text-center text-sm font-semibold uppercase tracking-widest text-texto-fraco">
                    {ing.status === 'usado' ? 'Já usado na entrada' : 'Cancelado'}
                  </div>
                )}
                <div className="p-5">
                  <p className="text-base text-texto">{ing.titular_nome}</p>
                  <p className="mt-1 text-xs text-texto-fraco">{ing.lote}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {temMeia && (
          <div className="mt-6 rounded-xl border border-alerta/35 bg-alerta/[0.07] p-4">
            <p className="text-xs leading-relaxed text-alerta">
              <strong>Meia-entrada:</strong> leve o comprovante (carteirinha de
              estudante, documento de idade, laudo ou CadÚnico). Sem ele, a
              diferença para a inteira é cobrada na entrada.
            </p>
          </div>
        )}

        <p className="mt-8 text-center text-xs leading-relaxed text-texto-fraco">
          Mostre o QR na entrada, junto com um documento com foto. Para
          transferir ou cancelar, use{' '}
          <Link href="/meus-ingressos" className="text-ouro underline underline-offset-2">
            Meus ingressos
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
