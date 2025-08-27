"use client"

import type React from "react"

import { useState, useContext, createContext, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Play, CheckCircle, AlertCircle, FileText } from "lucide-react"
import { ConversionService } from "@/lib/conversion-service"

type ConversionStatus = "idle" | "converting" | "completed" | "error"

interface ConvertedFile {
  name: string
  url: string
  size: number
}

interface ConversionContextType {
  convertedFiles: ConvertedFile[]
  setConvertedFiles: (files: ConvertedFile[]) => void
  uploadedFiles: File[]
  setUploadedFiles: (files: File[]) => void
}

const ConversionContext = createContext<ConversionContextType | null>(null)

export function ConversionProvider({ children }: { children: React.ReactNode }) {
  const [convertedFiles, setConvertedFiles] = useState<ConvertedFile[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  return (
    <ConversionContext.Provider value={{ convertedFiles, setConvertedFiles, uploadedFiles, setUploadedFiles }}>
      {children}
    </ConversionContext.Provider>
  )
}

export function useConversion() {
  const context = useContext(ConversionContext)
  if (!context) {
    throw new Error("useConversion must be used within ConversionProvider")
  }
  return context
}

export function ConversionPanel() {
  const [status, setStatus] = useState<ConversionStatus>("idle")
  const [progress, setProgress] = useState(0)
  const [outputFormat, setOutputFormat] = useState("pdf")
  const [quality, setQuality] = useState("high")
  const [error, setError] = useState<string>("")
  const { uploadedFiles, setConvertedFiles } = useConversion()
  const [processingFiles, setProcessingFiles] = useState<File[]>([])
  const [notice, setNotice] = useState<string>("")

  // Keep local processing list in sync with uploaded files from context
  useEffect(() => {
    setProcessingFiles(uploadedFiles)
  }, [uploadedFiles])

  // If converting FROM PDF and user picked DOCX, auto-fallback to TXT and show a note
  useEffect(() => {
    const hasPdfInputs = processingFiles.some((f) => f.type === "application/pdf")
    const isFromPdf = outputFormat !== "pdf"
    if (hasPdfInputs && isFromPdf && outputFormat === "docx") {
      setOutputFormat("txt")
      setNotice("DOCX from PDF is not available on the current provider. Falling back to TXT.")
    } else {
      setNotice("")
    }
  }, [processingFiles, outputFormat])

  const startConversion = async () => {
    if (processingFiles.length === 0) {
      setError("No files to convert. Please upload files first.")
      return
    }

    setStatus("converting")
    setProgress(0)
    setError("")

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const result = await ConversionService.convertFiles(processingFiles, {
        outputFormat,
        quality,
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (result.success && result.files) {
        setStatus("completed")
        // Push converted files to shared context for the Download section
        setConvertedFiles(result.files)
      } else {
        setStatus("error")
        setError(result.error || "Conversion failed")
      }
    } catch (err) {
      setStatus("error")
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
      setProgress(0)
    }
  }

  const resetConversion = () => {
    setStatus("idle")
    setProgress(0)
    setError("")
  }

  const getStatusIcon = () => {
    switch (status) {
      case "converting":
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent" />
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-destructive" />
      default:
        return <Play className="h-5 w-5" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case "converting":
        return "Converting files..."
      case "completed":
        return "Conversion completed successfully!"
      case "error":
        return error || "Conversion failed. Please try again."
      default:
        return `Ready to convert ${processingFiles.length} file${processingFiles.length !== 1 ? "s" : ""}`
    }
  }

  const canConvert = processingFiles.length > 0 && status !== "converting"

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Conversion Settings</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Output Format</label>
            <Select value={outputFormat} onValueChange={setOutputFormat} disabled={status === "converting"}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="docx">DOCX</SelectItem>
                <SelectItem value="txt">TXT</SelectItem>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="jpg">JPG</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Quality</label>
            <Select value={quality} onValueChange={setQuality} disabled={status === "converting"}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low (Faster)</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High (Best Quality)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {processingFiles.length > 0 && (
          <div className="bg-muted rounded-lg p-4">
            <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Files to Convert ({processingFiles.length})
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {processingFiles.map((file, index) => (
                <div key={index} className="text-xs text-muted-foreground truncate">
                  {file.name} ({ConversionService.formatFileSize(file.size)})
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {notice && (
            <div className="text-xs text-muted-foreground bg-muted rounded-md p-2">{notice}</div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <span className="text-sm font-medium text-foreground">{getStatusText()}</span>
            </div>

            <div className="flex items-center space-x-2">
              {status === "error" && (
                <Button variant="outline" onClick={resetConversion} size="sm">
                  Reset
                </Button>
              )}
              <Button
                onClick={startConversion}
                disabled={!canConvert}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
                size="sm"
              >
                {status === "converting" ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    <span className="hidden sm:inline">Converting...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  "Start Conversion"
                )}
              </Button>
            </div>
          </div>

          {status === "converting" && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-muted-foreground text-center">{progress}% complete</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
