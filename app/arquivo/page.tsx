import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Galeria } from '@/components/Galeria'
import { Videos } from '@/components/Videos'
import { produtora, todasAsFotos, todosOsVideos } from '@/config/site'

export const metadata: Metadata = {
  title: 'Arquivo',
  description: `Fotos e vídeos de todas as edições da ${produtora.nome}.`,
}

// ============================================================================
//  /arquivo — todas as fotos e vídeos, de todas as edições
// ============================================================================

export default function PaginaArquivo() {
  const fotos = todasAsFotos()
  const videos = todosOsVideos()

  return (
    <>
      <Header />

      <main id="conteudo" className="pt-16">
        <h1 className="sr-only">Arquivo — fotos e vídeos da {produtora.nome}</h1>

        <Galeria
          id="registros"
          fotos={fotos}
          rotulo="Cada noite deixa um rastro"
          titulo="Arquivo"
          subtitulo="Fotos de todas as edições. Clica pra ampliar."
        />

        {videos.length > 0 && (
          <>
            <div className="divisor mx-auto max-w-5xl" />
            <Videos
              videos={videos}
              rotulo="A cena, em movimento"
              titulo="Vídeos"
              canal={produtora.redes.youtube || undefined}
            />
          </>
        )}
      </main>

      <Footer />
    </>
  )
}
