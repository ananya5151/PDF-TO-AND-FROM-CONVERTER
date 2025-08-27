"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, File, Trash2, Archive, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { ConversionService } from "@/lib/conversion-service"
import { useConversion } from "@/components/conversion-panel"

interface ConvertedFile {
  id: string
  name: string
  size: number
  format: string
  downloadUrl: string
  status: "ready" | "downloading" | "downloaded" | "expired"
  createdAt: Date
  expiresAt: Date
}

export function DownloadSection() {
  const { convertedFiles: ctxConvertedFiles } = useConversion()
  const [convertedFiles, setConvertedFiles] = useState<ConvertedFile[]>([])
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set())

  useEffect(() => {
    const mapped: ConvertedFile[] = ctxConvertedFiles.map((f) => ({
      id: `${f.name}-${f.url}`,
      name: f.name,
      size: f.size ?? 0,
      format: f.name.split(".").pop()?.toUpperCase() || "PDF",
      downloadUrl: f.url,
      status: "ready" as const,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    }))
    setConvertedFiles(mapped)

    // Set up cleanup interval for expired files
    const cleanupInterval = setInterval(() => {
      setConvertedFiles((prev) =>
        prev.map((file) => ({
          ...file,
          status: file.expiresAt < new Date() ? "expired" : file.status,
        })),
      )
    }, 60000) // Check every minute

    return () => clearInterval(cleanupInterval)
  }, [ctxConvertedFiles])

  const downloadFile = async (file: ConvertedFile) => {
    if (file.status !== "ready") return

    setDownloadingFiles((prev) => new Set(prev).add(file.id))

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Create a temporary link to trigger download
      const link = document.createElement("a")
      link.href = file.downloadUrl
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Update file status
      setConvertedFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: "downloaded" as const } : f)))

      console.log("[v0] Downloaded file:", file.name)
    } catch (error) {
      console.error("[v0] Download failed:", error)
    } finally {
      setDownloadingFiles((prev) => {
        const newSet = new Set(prev)
        newSet.delete(file.id)
        return newSet
      })
    }
  }

  const downloadAll = async () => {
    const readyFiles = convertedFiles.filter((f) => f.status === "ready")
    if (readyFiles.length === 0) return

    for (const file of readyFiles) {
      await downloadFile(file)
      // Small delay between downloads
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    console.log("[v0] Downloaded all files")
  }

  const removeFile = (id: string) => {
    setConvertedFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const clearAll = () => {
    setConvertedFiles([])
  }

  const getTimeRemaining = (expiresAt: Date): string => {
    const now = new Date()
    const diff = expiresAt.getTime() - now.getTime()

    if (diff <= 0) return "Expired"

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`
    }
    return `${minutes}m remaining`
  }

  const getStatusIcon = (status: ConvertedFile["status"], isDownloading: boolean) => {
    if (isDownloading) {
      return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent" />
    }

    switch (status) {
      case "ready":
        return <File className="h-4 w-4 text-muted-foreground" />
      case "downloaded":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "expired":
        return <AlertCircle className="h-4 w-4 text-destructive" />
      default:
        return <File className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: ConvertedFile["status"]) => {
    switch (status) {
      case "ready":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Ready
          </Badge>
        )
      case "downloaded":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Downloaded
          </Badge>
        )
      case "expired":
        return <Badge variant="destructive">Expired</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const readyFiles = convertedFiles.filter((f) => f.status === "ready")
  const hasFiles = convertedFiles.length > 0

  if (!hasFiles) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-8 text-center">
          <Download className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No files ready for download</h3>
          <p className="text-muted-foreground">Convert some files to see them here</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Download Files</span>
            <Badge variant="outline" className="ml-2">
              {convertedFiles.length} total
            </Badge>
          </CardTitle>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            {readyFiles.length > 1 && (
              <Button
                onClick={downloadAll}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
                disabled={downloadingFiles.size > 0}
                size="sm"
              >
                <Archive className="h-4 w-4 mr-2" />
                Download All ({readyFiles.length})
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground">
              Clear All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {convertedFiles.map((file) => {
            const isDownloading = downloadingFiles.has(file.id)
            const timeRemaining = getTimeRemaining(file.expiresAt)

            return (
              <div
                key={file.id}
                className="flex flex-col lg:flex-row lg:items-center justify-between p-4 bg-muted rounded-lg gap-4"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getStatusIcon(file.status, isDownloading)}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-1 gap-1">
                      <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                      {getStatusBadge(file.status)}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs text-muted-foreground gap-1">
                      <span>
                        {file.format} • {ConversionService.formatFileSize(file.size)}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {timeRemaining}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end lg:self-auto">
                  {file.status === "ready" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadFile(file)}
                      disabled={isDownloading}
                      className="text-accent hover:text-accent-foreground hover:bg-accent"
                    >
                      {isDownloading ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2" />
                          <span className="hidden sm:inline">Downloading...</span>
                          <span className="sm:hidden">...</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </>
                      )}
                    </Button>
                  )}
                  {file.status === "downloaded" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadFile(file)}
                      className="text-muted-foreground hover:text-accent-foreground hover:bg-accent"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Re-download</span>
                      <span className="sm:hidden">Re-dl</span>
                    </Button>
                  )}
                  {file.status === "expired" && (
                    <Button variant="ghost" size="sm" disabled className="text-muted-foreground">
                      Expired
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 p-4 bg-card border rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
              <span className="text-muted-foreground">
                <span className="font-medium text-green-600">{readyFiles.length}</span> ready for download
              </span>
              <span className="text-muted-foreground">
                <span className="font-medium text-blue-600">
                  {convertedFiles.filter((f) => f.status === "downloaded").length}
                </span>{" "}
                downloaded
              </span>
              <span className="text-muted-foreground">
                <span className="font-medium text-destructive">
                  {convertedFiles.filter((f) => f.status === "expired").length}
                </span>{" "}
                expired
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Files expire after 1 hour</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
