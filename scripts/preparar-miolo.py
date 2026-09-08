# ============================================================================
#  python scripts/preparar-miolo.py
#
#  Prepara as duas fotos dos medalhões do cartaz — Os Mutantes de um lado,
#  Raul Seixas do outro — em duotone, na mesma paleta do cartaz.
#
#  O duotone não é enfeite: sem ele são duas fotos de época diferentes,
#  coladas lado a lado. Com ele, viram uma imagem só.
#
#  DOIS MODOS DE ENQUADRAR:
#    'cortar' — recorta um quadrado do meio. Bom para retrato.
#    'caber'  — encaixa a foto inteira e completa as sobras com a cor de
#               fundo. É o que salva foto de grupo: numa foto 3:2, o
#               recorte quadrado joga fora quem está nas pontas.
#
#  COLOQUE OS ORIGINAIS EM:
#     _originais/capas/mutantes.png   (ou .jpg / .webp)
#     _originais/capas/raul.jpg       (ou .png / .webp)
# ============================================================================

from PIL import Image, ImageOps, ImageEnhance
import os, sys

SOMBRA = (42, 10, 61)      # roxo berinjela do cartaz
LUZ = (255, 233, 184)      # creme do cartaz
LADO = 760                 # tamanho final de cada medalhão

# (saída, nomes aceitos, recorte prévio, modo, zoom)
PECAS = [
    # A foto nova é um retrato dos três, com os rostos juntos — cabe no
    # círculo sem sobra. Recorte quadrado a partir do alto, onde estão as
    # caras, em vez do centro geométrico.
    ('mutantes', ['mutantes.jpg', 'mutantes.png', 'mutantes.jpeg', 'mutantes.webp'],
     (0.00, 0.00, 1.00, 0.82), 'cortar', 1.0),

    # Raul mais perto: recorte mais fechado no rosto.
    ('raul', ['raul.jpg', 'raul.png', 'raul.jpeg', 'raul.webp'],
     (0.20, 0.24, 0.86, 0.80), 'cortar', 1.0),
]

os.makedirs('cartazes', exist_ok=True)
faltando = []

for saida, nomes, (e, t, d, b), modo, zoom in PECAS:
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

    if modo == 'cortar':
        L, A = im.size
        lado = min(L, A)
        im = im.crop(((L - lado) // 2, (A - lado) // 2,
                      (L + lado) // 2, (A + lado) // 2))
        im = im.resize((LADO, LADO), Image.LANCZOS)
    else:
        # cabe inteira: redimensiona pela maior dimensão e centraliza
        alvo = int(LADO * zoom)
        cabe = im.copy()
        cabe.thumbnail((alvo, alvo), Image.LANCZOS)
        tela = Image.new('RGB', (LADO, LADO), (30, 30, 30))
        tela.paste(cabe, ((LADO - cabe.width) // 2, (LADO - cabe.height) // 2))
        im = tela

    g = ImageOps.grayscale(im)
    g = ImageEnhance.Contrast(g).enhance(1.5)
    g = ImageOps.autocontrast(g, cutoff=3)
    duo = ImageOps.colorize(g, black=SOMBRA, white=LUZ)

    destino = f'cartazes/{saida}.png'
    duo.save(destino, optimize=True)
    print(f'{destino}  {duo.size[0]}x{duo.size[1]}  {os.path.getsize(destino)//1024} KB  ({modo})')

if faltando:
    print('\nFaltam os originais:')
    for f in faltando:
        print(f'   {f}')
    sys.exit(1)

print('\nPronto. Agora é só renderizar o cartaz.')
