interface ConversionFile {
  name: string
  data: string
  type: string
}

interface ConversionOptions {
  outputFormat: string
  quality: string
}

interface ConversionResult {
  success: boolean
  files?: Array<{
    name: string
    url: string
    size: number
  }>
  error?: string
}

export class ConversionService {
  static async convertFiles(files: File[], options: ConversionOptions): Promise<ConversionResult> {
    try {
      // Convert files to base64
      const fileData: ConversionFile[] = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          data: await this.fileToBase64(file),
          type: file.type,
        })),
      )

      const response = await fetch("/api/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: fileData,
          outputFormat: options.outputFormat,
          quality: options.quality,
        }),
      })

      const result: ConversionResult = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Conversion failed")
      }

      return result
    } catch (error) {
      console.error("[v0] Conversion service error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }

  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        // Remove the data URL prefix (e.g., "data:image/png;base64,")
        const base64 = result.split(",")[1]
        resolve(base64)
      }
      reader.onerror = (error) => reject(error)
    })
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }
}
