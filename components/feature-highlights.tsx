import { Shield, Zap, FileCheck, Globe, Clock, Users } from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your files are processed securely and deleted after conversion. We never store your documents.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Advanced conversion algorithms ensure your files are processed quickly without quality loss.",
  },
  {
    icon: FileCheck,
    title: "Multiple Formats",
    description: "Support for PDF, DOC, DOCX, PPTX, XLS, XLSX, TXT, and various image formats.",
  },
  {
    icon: Globe,
    title: "Works Everywhere",
    description: "No software installation required. Works on any device with a modern web browser.",
  },
  {
    icon: Clock,
    title: "24/7 Available",
    description: "Convert your documents anytime, anywhere. Our service is available around the clock.",
  },
  {
    icon: Users,
    title: "Trusted by Thousands",
    description: "Join thousands of users who trust our platform for their document conversion needs.",
  },
]

export function FeatureHighlights() {
  return (
    <section className="py-12 md:py-20 bg-muted/30">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4 text-balance">
            Why Choose Our PDF Converter?
          </h2>
          <p className="text-base md:text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
            Built with modern technology and designed for professionals who need reliable document conversion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-background rounded-lg p-6 md:p-8 shadow-sm border border-border hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-accent/10 rounded-lg flex items-center justify-center mr-4">
                  <feature.icon className="w-5 h-5 md:w-6 md:h-6 text-accent" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-foreground">{feature.title}</h3>
              </div>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
