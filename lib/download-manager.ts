interface DownloadProgress {
  fileId: string
  progress: number
  status: "pending" | "downloading" | "completed" | "error"
}

export class DownloadManager {
  private static downloads = new Map<string, DownloadProgress>()
  private static listeners = new Set<(downloads: Map<string, DownloadProgress>) => void>()

  static async downloadFile(url: string, filename: string, fileId: string): Promise<void> {
    try {
      this.updateProgress(fileId, 0, "downloading")

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const contentLength = response.headers.get("content-length")
      const total = contentLength ? Number.parseInt(contentLength, 10) : 0

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("Failed to get response reader")
      }

      const chunks: Uint8Array[] = []
      let received = 0

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        chunks.push(value)
        received += value.length

        if (total > 0) {
          const progress = Math.round((received / total) * 100)
          this.updateProgress(fileId, progress, "downloading")
        }
      }

      // Combine chunks into a single Uint8Array
      const blob = new Blob(chunks)
      const downloadUrl = URL.createObjectURL(blob)

      // Create download link
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up
      URL.revokeObjectURL(downloadUrl)
      this.updateProgress(fileId, 100, "completed")

      // Remove from tracking after a delay
      setTimeout(() => {
        this.downloads.delete(fileId)
        this.notifyListeners()
      }, 3000)
    } catch (error) {
      console.error("[v0] Download failed:", error)
      this.updateProgress(fileId, 0, "error")
      throw error
    }
  }

  static async downloadMultipleFiles(files: Array<{ url: string; filename: string; id: string }>): Promise<void> {
    const downloadPromises = files.map((file) => this.downloadFile(file.url, file.filename, file.id))

    try {
      await Promise.all(downloadPromises)
    } catch (error) {
      console.error("[v0] Batch download failed:", error)
      throw error
    }
  }

  static createZipDownload(files: Array<{ url: string; filename: string }>): Promise<void> {
    return new Promise((resolve, reject) => {
      // This would require a zip library like JSZip
      // For now, we'll just download files sequentially
      const downloadSequentially = async () => {
        for (const file of files) {
          try {
            await this.downloadFile(file.url, file.filename, Math.random().toString(36).substr(2, 9))
            // Small delay between downloads
            await new Promise((resolve) => setTimeout(resolve, 500))
          } catch (error) {
            reject(error)
            return
          }
        }
        resolve()
      }

      downloadSequentially()
    })
  }

  private static updateProgress(fileId: string, progress: number, status: DownloadProgress["status"]) {
    this.downloads.set(fileId, { fileId, progress, status })
    this.notifyListeners()
  }

  private static notifyListeners() {
    this.listeners.forEach((listener) => listener(new Map(this.downloads)))
  }

  static subscribe(listener: (downloads: Map<string, DownloadProgress>) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  static getProgress(fileId: string): DownloadProgress | undefined {
    return this.downloads.get(fileId)
  }

  static getAllProgress(): Map<string, DownloadProgress> {
    return new Map(this.downloads)
  }
}
