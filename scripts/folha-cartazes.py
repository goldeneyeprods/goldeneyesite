# ============================================================================
#  python scripts/folha-cartazes.py
#
#  Junta os três formatos do cartaz numa folha só, para conferir tudo de uma
#  vez e para mandar a quem precisa aprovar a arte.
# ============================================================================

from PIL import Image, ImageDraw, ImageFont
import os

PECAS = [
    ('public/imagens/cartazes/tropicalia-feed.jpg', 'FEED', '1080 × 1350 · 4:5', 'Post do Instagram'),
    ('public/imagens/cartazes/tropicalia-story.jpg', 'STORY', '1080 × 1920 · 9:16', 'Story e Reels'),
    ('cartazes/impresso-a4.png', 'IMPRESSO', 'A4 · 300 dpi', 'Colar no café e no sebo'),
]

PAPEL = (242, 232, 213)
TINTA = (26, 16, 53)
VERMELHO = (230, 63, 28)

ALTURA = 1180          # todas as peças na mesma altura, para comparar
MARGEM = 70
ESPACO = 60
TOPO = 200

def fonte(tam, negrito=True):
    for nome in ('arialbd.ttf' if negrito else 'arial.ttf', 'segoeuib.ttf', 'DejaVuSans-Bold.ttf'):
        try:
            return ImageFont.truetype(nome, tam)
        except OSError:
            continue
    return ImageFont.load_default()

miniaturas = []
for caminho, _, _, _ in PECAS:
    if not os.path.exists(caminho):
        raise SystemExit(f'Faltando: {caminho}')
    im = Image.open(caminho).convert('RGB')
    larg = round(im.width * (ALTURA / im.height))
    miniaturas.append(im.resize((larg, ALTURA), Image.LANCZOS))

L = MARGEM * 2 + sum(m.width for m in miniaturas) + ESPACO * (len(miniaturas) - 1)
A = TOPO + ALTURA + 210

folha = Image.new('RGB', (L, A), PAPEL)
d = ImageDraw.Draw(folha)

# --- cabeçalho ---
d.text((MARGEM, 62), 'GOLDEN EYE PRODS.', font=fonte(30), fill=VERMELHO)
d.text((MARGEM, 104), 'Tropicália & Rock Nacional — cartaz em três formatos',
       font=fonte(44), fill=TINTA)

x = MARGEM
for m, (_, rotulo, medida, uso) in zip(miniaturas, PECAS):
    folha.paste(m, (x, TOPO))
    d.rectangle([x - 1, TOPO - 1, x + m.width, TOPO + ALTURA], outline=TINTA, width=2)

    y = TOPO + ALTURA + 26
    d.text((x, y), rotulo, font=fonte(30), fill=VERMELHO)
    d.text((x, y + 40), medida, font=fonte(25), fill=TINTA)
    d.text((x, y + 76), uso, font=fonte(23, negrito=False), fill=(110, 96, 130))

    x += m.width + ESPACO

saida = 'cartazes/folha-cartazes.jpg'
folha.save(saida, quality=92)
print(f'{saida}  {folha.size[0]}x{folha.size[1]}  {os.path.getsize(saida)//1024} KB')
