"use client"

import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, File, X, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useConversion } from "@/components/conversion-panel"

interface UploadedFile {
  file: File
  id: string
  status: "uploading" | "success" | "error"
  error?: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_FILES = 10

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "text/plain": [".txt"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/gif": [".gif"],
  "image/bmp": [".bmp"],
  "image/tiff": [".tiff"],
}

export function FileUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const { setUploadedFiles: setCtxUploadedFiles } = useConversion()

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" is too large. Maximum size is 10MB.`
    }

    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()
    const isValidType = Object.values(ACCEPTED_TYPES).some((extensions) => extensions.includes(fileExtension))

    if (!isValidType) {
      return `File "${file.name}" has an unsupported format.`
    }

    return null
  }

  const simulateUpload = async (file: File, id: string) => {
    // Simulate upload progress
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

    // Simulate occasional upload failures for demo
    if (Math.random() < 0.1) {
      setUploadedFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: "error", error: "Upload failed. Please try again." } : f)),
      )
    } else {
      setUploadedFiles((prev) => prev.map((f) => (f.id === id ? { ...f, status: "success" } : f)))
    }
  }

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setErrors([])
      const newErrors: string[] = []

      // Check total file limit
      if (uploadedFiles.length + acceptedFiles.length > MAX_FILES) {
        newErrors.push(`Maximum ${MAX_FILES} files allowed. Please remove some files first.`)
        setErrors(newErrors)
        return
      }

      // Validate each file
      const validFiles: File[] = []
      acceptedFiles.forEach((file) => {
        const error = validateFile(file)
        if (error) {
          newErrors.push(error)
        } else {
          validFiles.push(file)
        }
      })

      // Handle rejected files
      rejectedFiles.forEach(({ file, errors: fileErrors }) => {
        if (fileErrors.some((e: any) => e.code === "file-too-large")) {
          newErrors.push(`File "${file.name}" is too large. Maximum size is 10MB.`)
        } else if (fileErrors.some((e: any) => e.code === "file-invalid-type")) {
          newErrors.push(`File "${file.name}" has an unsupported format.`)
        }
      })

      if (newErrors.length > 0) {
        setErrors(newErrors)
      }

      // Process valid files
      if (validFiles.length > 0) {
        const newFiles = validFiles.map((file) => ({
          file,
          id: Math.random().toString(36).substr(2, 9),
          status: "uploading" as const,
        }))

        setUploadedFiles((prev) => [...prev, ...newFiles])

        // Simulate upload for each file
        newFiles.forEach(({ file, id }) => {
          simulateUpload(file, id)
        })
      }
    },
    [uploadedFiles],
  )

  // Sync successful uploads to shared context
  useEffect(() => {
    const successful = uploadedFiles.filter((f) => f.status === "success").map((f) => f.file)
    setCtxUploadedFiles(successful as unknown as File[])
  }, [uploadedFiles, setCtxUploadedFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    multiple: true,
    maxSize: MAX_FILE_SIZE,
    maxFiles: MAX_FILES,
  })

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const retryUpload = (id: string) => {
    const file = uploadedFiles.find((f) => f.id === id)
    if (file) {
      setUploadedFiles((prev) => prev.map((f) => (f.id === id ? { ...f, status: "uploading", error: undefined } : f)))
      simulateUpload(file.file, id)
    }
  }

  const clearAll = () => {
    setUploadedFiles([])
    setErrors([])
    setCtxUploadedFiles([] as unknown as File[])
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading":
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />
      default:
        return <File className="h-4 w-4 text-muted-foreground" />
    }
  }

  const successfulFiles = uploadedFiles.filter((f) => f.status === "success")

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 md:p-6">
        {errors.length > 0 && (
          <Alert className="mb-4 md:mb-6 border-destructive/50 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                {errors.map((error, index) => (
                  <div key={index} className="text-sm">
                    {error}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 md:p-8 text-center cursor-pointer transition-all duration-200 ${isDragActive
              ? "border-accent bg-accent/5 scale-[1.02]"
              : "border-border hover:border-accent/50 hover:bg-accent/5"
            }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-10 w-10 md:h-12 md:w-12 text-muted-foreground mb-4" />
          <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">
            {isDragActive ? "Drop files here" : "Upload your files"}
          </h3>
          <p className="text-sm md:text-base text-muted-foreground mb-4">
            Drag and drop files here, or click to select files
          </p>
          <p className="text-xs md:text-sm text-muted-foreground mb-2">
            Supports: PDF, DOC, DOCX, PPTX, XLS, XLSX, TXT, PNG, JPG, JPEG, GIF, BMP, TIFF
          </p>
          <p className="text-xs text-muted-foreground mb-4">Maximum file size: 10MB • Maximum files: {MAX_FILES}</p>
          <Button variant="outline" className="mt-2 bg-transparent hover:bg-accent hover:text-accent-foreground">
            Choose Files
          </Button>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="mt-4 md:mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
              <h4 className="text-sm font-medium text-foreground">
                Files ({uploadedFiles.length}/{MAX_FILES})
                {successfulFiles.length > 0 && (
                  <span className="text-green-500 ml-2">• {successfulFiles.length} ready</span>
                )}
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="text-muted-foreground hover:text-destructive self-start sm:self-auto"
              >
                Clear All
              </Button>
            </div>
            <div className="space-y-2">
              {uploadedFiles.map(({ file, id, status, error }) => (
                <div
                  key={id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-muted rounded-lg gap-3"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getFileIcon(status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        {status === "uploading" && (
                          <span className="sm:before:content-['•'] sm:before:mx-1">Uploading...</span>
                        )}
                        {status === "success" && (
                          <span className="text-green-500 sm:before:content-['•'] sm:before:mx-1 sm:before:text-muted-foreground">
                            Ready for conversion
                          </span>
                        )}
                        {status === "error" && error && (
                          <span className="text-destructive sm:before:content-['•'] sm:before:mx-1 sm:before:text-muted-foreground">
                            {error}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 self-end sm:self-auto">
                    {status === "error" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => retryUpload(id)}
                        className="text-accent hover:text-accent-foreground hover:bg-accent text-xs"
                      >
                        Retry
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(id)}
                      className="text-muted-foreground hover:text-destructive"
                      disabled={status === "uploading"}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
