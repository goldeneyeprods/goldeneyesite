# ============================================================================
#  python scripts/trocar-logo-cartaz.py
#
#  Troca o olho desenhado no topo do cartaz pela logo original da produtora.
#
#  Como o fundo ali é um sol de raios, não dá para simplesmente apagar: é
#  preciso remendar a área com um pedaço vizinho do mesmo padrão e só então
#  colar a logo por cima.
#
#  Os números do recorte estão no topo, para ajustar sem caçar no código.
# ============================================================================

from PIL import Image, ImageFilter, ImageDraw
import os

CARTAZ = '_originais/cartaz-final/tropicalia-original.jpeg'
LOGO = 'public/imagens/marca/olho.png'
SAIDA = '_originais/cartaz-final/tropicalia-logo-trocada.png'

# Onde está o olho desenhado, no cartaz de 1024x1536
CAIXA = (466, 26, 552, 78)        # esquerda, topo, direita, base
DESLOC_REMENDO = (-150, 0)        # de onde clonar o fundo (x, y)

# Onde entra a logo original
LARGURA_LOGO = 86
# sobe 3px: a cauda do olho estava encostando no texto de baixo
CENTRO = ((CAIXA[0] + CAIXA[2]) // 2, (CAIXA[1] + CAIXA[3]) // 2 - 3)

cartaz = Image.open(CARTAZ).convert('RGB')

# ---- 1. remenda o fundo, clonando um trecho vizinho do sol ---------------
folga = 14
alvo = (CAIXA[0] - folga, CAIXA[1] - folga, CAIXA[2] + folga, CAIXA[3] + folga)
fonte = (alvo[0] + DESLOC_REMENDO[0], alvo[1] + DESLOC_REMENDO[1],
         alvo[2] + DESLOC_REMENDO[0], alvo[3] + DESLOC_REMENDO[1])

remendo = cartaz.crop(fonte)
mascara = Image.new('L', remendo.size, 0)
ImageDraw.Draw(mascara).ellipse((2, 2, remendo.size[0] - 2, remendo.size[1] - 2), fill=255)
mascara = mascara.filter(ImageFilter.GaussianBlur(9))
cartaz.paste(remendo, alvo[:2], mascara)

# ---- 2. cola a logo original por cima ------------------------------------
logo = Image.open(LOGO).convert('RGBA')
altura = round(LARGURA_LOGO * logo.height / logo.width)
logo = logo.resize((LARGURA_LOGO, altura), Image.LANCZOS)

cartaz_rgba = cartaz.convert('RGBA')
cartaz_rgba.alpha_composite(
    logo, (CENTRO[0] - LARGURA_LOGO // 2, CENTRO[1] - altura // 2)
)

os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
cartaz_rgba.convert('RGB').save(SAIDA, quality=95)
print(f'{SAIDA}  {os.path.getsize(SAIDA)//1024} KB')
