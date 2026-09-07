# ============================================================================
#  Prepara a foto para o cartaz: recorte + duotone de risografia.
#
#  Duotone é o tratamento que impressão barata dos anos 60/70 dava a foto:
#  duas tintas só, contraste alto, sem meio-termo. É o oposto do brilho
#  digital — e é exatamente o que tira a cara de imagem gerada.
# ============================================================================

from PIL import Image, ImageOps, ImageEnhance
import sys, os

ORIGEM = 'arquivosbandas/delirioparabolico/integrante-03-violao.jpg'
SAIDA = 'public/imagens/cartazes/johann-duotone.png'

# as duas "tintas"
SOMBRA = (26, 16, 53)      # roxo quase preto
LUZ = (242, 232, 213)      # creme do papel

os.makedirs(os.path.dirname(SAIDA), exist_ok=True)

im = Image.open(ORIGEM).convert('RGB')
L, A = im.size
print(f'original: {L}x{A}')

# recorte: cabeça + violão, sem o teto e sem o chão
esq, topo = int(L * 0.14), int(A * 0.19)
dir_, base = int(L * 0.99), int(A * 0.73)
im = im.crop((esq, topo, dir_, base))
print(f'recortado: {im.size[0]}x{im.size[1]}')

# preto e branco com contraste puxado
cinza = ImageOps.grayscale(im)
cinza = ImageEnhance.Contrast(cinza).enhance(1.55)
cinza = ImageOps.autocontrast(cinza, cutoff=3)

# mapeia a escala de cinza para as duas tintas
duo = ImageOps.colorize(cinza, black=SOMBRA, white=LUZ)

duo.save(SAIDA, optimize=True)
print(f'salvo: {SAIDA}  {os.path.getsize(SAIDA)//1024} KB')
