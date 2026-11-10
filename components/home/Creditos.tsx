// ============================================================================
//  FAIXA DE CRÉDITOS — como a abertura de um filme, rolando devagar
// ============================================================================

export function Creditos({ itens }: { itens: string[] }) {
  // Duplicada para o loop não ter emenda: a animação anda metade e recomeça.
  const linha = [...itens, ...itens]
  return (
    <div
      className="relative overflow-hidden border-y border-ouro/35 py-5"
      aria-label={itens.join(', ')}
      role="img"
    >
      <div className="creditos" aria-hidden="true">
        {linha.map((t, i) => (
          <span
            key={i}
            className="flex shrink-0 items-center font-display text-lg tracking-[0.22em] text-ouro sm:text-xl"
          >
            <span className="px-7">{t}</span>
            <span className="text-sm text-ouro/80">◆</span>
          </span>
        ))}
      </div>
    </div>
  )
}
