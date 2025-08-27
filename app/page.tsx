import { FileUpload } from "@/components/file-upload"
import { ConversionPanel, ConversionProvider } from "@/components/conversion-panel"
import { DownloadSection } from "@/components/download-section"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FeatureHighlights } from "@/components/feature-highlights"

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-b from-background to-muted/30 py-12 md:py-20">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 md:mb-6 text-balance leading-tight">
              Professional PDF Converter
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground text-pretty max-w-2xl mx-auto mb-8">
              Convert your documents to PDF format quickly and securely. Support for multiple file formats with
              enterprise-grade quality.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Secure Processing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>High Quality Output</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Fast Conversion</span>
              </div>
            </div>
          </div>
        </section>

        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <ConversionProvider>
              <div className="space-y-6 md:space-y-8">
                <FileUpload />
                <ConversionPanel />
                <DownloadSection />
              </div>
            </ConversionProvider>
          </div>
        </section>

        <FeatureHighlights />
      </main>
      <Footer />
    </div>
  )
}
