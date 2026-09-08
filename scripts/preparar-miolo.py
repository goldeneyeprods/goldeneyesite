# ============================================================================
#  python scripts/preparar-miolo.py
#
#  Prepara as duas fotos do miolo do cartaz — Os Mutantes de um lado, Raul
#  Seixas do outro — em duotone, na mesma paleta do cartaz.
#
#  O duotone não é enfeite: sem ele são duas fotos de época diferentes,
#  coladas lado a lado. Com ele, viram uma imagem só.
#
#  COLOQUE OS ORIGINAIS EM:
#     _originais/capas/mutantes.jpg   (ou .png)
#     _originais/capas/raul.jpg       (ou .png)
# ============================================================================

from PIL import Image, ImageOps, ImageEnhance
import os, sys

SOMBRA = (42, 10, 61)      # roxo berinjela do cartaz
LUZ = (255, 233, 184)      # creme do cartaz

# (nome de saída, nomes aceitos na entrada, recorte, foco)
PECAS = [
    ('mutantes', ['mutantes.jpg', 'mutantes.png', 'mutantes.jpeg', 'mutantes.webp'],
     (0.05, 0.00, 0.99, 0.96), 'centro'),
    ('raul', ['raul.jpg', 'raul.png', 'raul.jpeg', 'raul.webp'],
     (0.10, 0.14, 0.94, 0.86), 'centro'),
]

os.makedirs('cartazes', exist_ok=True)
faltando = []

for saida, nomes, (e, t, d, b), _ in PECAS:
    origem = next(
        (os.path.join('_originais/capas', n)
         for n in nomes if os.path.exists(os.path.join('_originais/capas', n))),
        None,
    )
    if not origem:
        faltando.append(f'_originais/capas/{nomes[0]}')
        continue

    im = Image.open(origem).convert('RGB')
    L, A = im.size
    im = im.crop((int(L * e), int(A * t), int(L * d), int(A * b)))

    # quadrado centrado: as duas metades do círculo precisam da mesma proporção
    L, A = im.size
    lado = min(L, A)
    im = im.crop(((L - lado) // 2, (A - lado) // 2,
                  (L + lado) // 2, (A + lado) // 2))
    im = im.resize((700, 700), Image.LANCZOS)

    g = ImageOps.grayscale(im)
    g = ImageEnhance.Contrast(g).enhance(1.5)
    g = ImageOps.autocontrast(g, cutoff=3)
    duo = ImageOps.colorize(g, black=SOMBRA, white=LUZ)

    destino = f'cartazes/{saida}.png'
    duo.save(destino, optimize=True)
    print(f'{destino}  {os.path.getsize(destino)//1024} KB')

if faltando:
    print('\nFaltam os originais:')
    for f in faltando:
        print(f'   {f}')
    sys.exit(1)

print('\nPronto. Agora é só renderizar o cartaz.')
