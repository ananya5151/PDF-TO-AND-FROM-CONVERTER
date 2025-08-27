import { type NextRequest, NextResponse } from "next/server"

// PDF.co API configuration
const PDF_CO_API_KEY = process.env.PDF_CO_API_KEY || "demo" // Use demo key for development
const PDF_CO_BASE_URL = "https://api.pdf.co/v1"

interface ConversionRequest {
  files: Array<{
    name: string
    data: string // base64 encoded file data
    type: string
  }>
  outputFormat: string
  quality: string
}

interface ConversionResponse {
  success: boolean
  files?: Array<{
    name: string
    url: string
    size: number
  }>
  error?: string
}

type ConvertedFile = {
  name: string
  url: string
  size: number
}

export async function POST(request: NextRequest): Promise<NextResponse<ConversionResponse>> {
  try {
    const body: ConversionRequest = await request.json()
    const { files, outputFormat, quality } = body

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: "No files provided" }, { status: 400 })
    }

    const convertedFiles = []
    let lastError: string | undefined

    for (const file of files) {
      try {
        let convertedFile

        if (outputFormat === "pdf") {
          convertedFile = await convertToPDF(file, quality)
        } else {
          convertedFile = await convertFromPDF(file, outputFormat, quality)
        }

        if (convertedFile) {
          convertedFiles.push(convertedFile)
        }
      } catch (error) {
        console.error(`[v0] Error converting file ${file.name}:`, error)
        lastError = error instanceof Error ? error.message : String(error)
        // Continue with other files even if one fails
      }
    }

    if (convertedFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: lastError || "Failed to convert any files" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      files: convertedFiles,
    })
  } catch (error) {
    console.error("[v0] Conversion API error:", error)
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

async function convertToPDF(file: { name: string; data: string; type: string }, quality: string) {
  const endpoint = getToPdfEndpoint(file.type)

  if (!endpoint) {
    throw new Error(`Unsupported file type: ${file.type}`)
  }

  console.log(`[pdfco] to-PDF endpoint: ${endpoint}`)
  // Attempt 1: use data URI via `url`
  let payload = {
    url: `data:${file.type};base64,${file.data}`,
    name: file.name.replace(/\.[^/.]+$/, ".pdf"),
    async: false,
  }
  let response = await fetch(`${PDF_CO_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": PDF_CO_API_KEY },
    body: JSON.stringify(payload),
  })
  let result = await response.json()

  // Fallback: upload to PDF.co temp storage and retry with returned URL
  if (!response.ok || !result.url) {
    const uploadedUrl = await uploadBase64ToPdfCo(file.data, file.name)
    payload = { ...payload, url: uploadedUrl }
    response = await fetch(`${PDF_CO_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": PDF_CO_API_KEY },
      body: JSON.stringify(payload),
    })
    result = await response.json()
  }

  if (!response.ok) {
    throw new Error(`PDF.co error (${response.status}) at ${endpoint}: ${result.message || "Conversion failed"}`)
  }
  if (!result.url) {
    throw new Error(result.message || "Conversion failed")
  }

  return { name: file.name.replace(/\.[^/.]+$/, ".pdf"), url: result.url, size: await getFileSize(result.url) }
}

async function convertFromPDF(
  file: { name: string; data: string; type: string },
  outputFormat: string,
  quality: string,
): Promise<ConvertedFile> {
  // Define endpoint candidates per requested format
  const candidates: Array<{ endpoint: string; ext: string }> = (() => {
    switch (outputFormat) {
      case "docx":
        // Try DOCX, then DOC, then RTF
        return [
          { endpoint: "/pdf/convert/to/docx", ext: ".docx" },
          { endpoint: "/pdf/convert/to/doc", ext: ".doc" },
          { endpoint: "/pdf/convert/to/rtf", ext: ".rtf" },
        ]
      case "txt":
        return [{ endpoint: "/pdf/convert/to/text", ext: ".txt" }]
      case "png":
        return [{ endpoint: "/pdf/convert/to/png", ext: ".png" }]
      case "jpg":
        return [{ endpoint: "/pdf/convert/to/jpg", ext: ".jpg" }]
      default:
        throw new Error(`Unsupported output format: ${outputFormat}`)
    }
  })()

  let lastErr: string | undefined
  for (const { endpoint, ext } of candidates) {
    try {
      console.log(`[pdfco] from-PDF endpoint: ${endpoint}`)
      // Attempt 1: inline data URI via `url`
      let payload = {
        url: `data:${file.type};base64,${file.data}`,
        name: file.name.replace(/\.[^/.]+$/, ext),
        pages: "1-",
        async: false,
      }
      let response = await fetch(`${PDF_CO_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": PDF_CO_API_KEY },
        body: JSON.stringify(payload),
      })
      let result = await response.json()

      if (!response.ok || !result.url) {
        // Fallback 2: upload and retry using returned URL
        const uploadedUrl = await uploadBase64ToPdfCo(file.data, file.name)
        payload = { ...payload, url: uploadedUrl }
        response = await fetch(`${PDF_CO_BASE_URL}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": PDF_CO_API_KEY },
          body: JSON.stringify(payload),
        })
        result = await response.json()
      }

      if (!response.ok) {
        lastErr = `PDF.co error (${response.status}) at ${endpoint}: ${result.message || "Conversion failed"}`
        continue
      }
      if (!result.url) {
        lastErr = result.message || "Conversion failed"
        continue
      }

      return { name: file.name.replace(/\.[^/.]+$/, ext), url: result.url, size: await getFileSize(result.url) }
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e)
      continue
    }
  }

  // As a graceful fallback, try TXT if DOCX/DOC/RTF all failed and TXT wasn't requested
  if (outputFormat !== "txt") {
    try {
      const txt = await convertFromPDF(file, "txt", quality)
      return txt
    } catch { }
  }

  throw new Error(lastErr || "Conversion failed for all attempted endpoints")
}

// Upload base64 content to PDF.co temporary storage and return the file URL
async function uploadBase64ToPdfCo(base64: string, name: string): Promise<string> {
  // Try direct base64 upload first
  try {
    const endpoint = "/file/upload/base64"
    console.log(`[pdfco] upload base64 -> ${endpoint}`)
    const response = await fetch(`${PDF_CO_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": PDF_CO_API_KEY },
      body: JSON.stringify({ file: base64, name }),
    })
    const result = await response.json()
    const url: string | undefined = result?.url || result?.fileUrl || result?.uploadedUrl
    if (response.ok && url) return url
    console.warn(`[pdfco] base64 upload failed: ${response.status} ${result?.message || ""}`)
  } catch (e) {
    console.warn(`[pdfco] base64 upload threw: ${e instanceof Error ? e.message : String(e)}`)
  }

  // Fallback: presigned URL flow
  const presignEndpoint = "/file/upload/get-presigned-url"
  console.log(`[pdfco] request presigned -> ${presignEndpoint}`)
  const presignRes = await fetch(`${PDF_CO_BASE_URL}${presignEndpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": PDF_CO_API_KEY },
    body: JSON.stringify({ name, contenttype: "application/octet-stream" }),
  })
  const presignJson = await presignRes.json()
  const presignedUrl: string | undefined = presignJson?.presignedUrl
  const fileUrl: string | undefined = presignJson?.url
  if (!presignRes.ok || !presignedUrl || !fileUrl) {
    throw new Error(
      `Upload presign failed (${presignRes.status}) at ${presignEndpoint}: ${presignJson?.message || "Unknown"}`,
    )
  }

  // PUT the binary content to presigned URL
  const binary = Buffer.from(base64, "base64")
  const putRes = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/octet-stream" },
    body: binary,
  })
  if (!putRes.ok) {
    throw new Error(`Upload PUT failed (${putRes.status}) to presigned URL`)
  }
  console.log(`[pdfco] uploaded to presigned; file URL: ${fileUrl}`)
  return fileUrl
}

function getToPdfEndpoint(inputType: string): string | null {
  // PDF.co uses "/v1/pdf/convert/from/<type>" for converting TO PDF
  const map: Record<string, string> = {
    "application/msword": "/pdf/convert/from/doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "/pdf/convert/from/docx",
    "application/vnd.ms-powerpoint": "/pdf/convert/from/ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "/pdf/convert/from/pptx",
    "application/vnd.ms-excel": "/pdf/convert/from/xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "/pdf/convert/from/xlsx",
    "text/plain": "/pdf/convert/from/text",
    "image/png": "/pdf/convert/from/image",
    "image/jpeg": "/pdf/convert/from/image",
    "image/jpg": "/pdf/convert/from/image",
    "image/gif": "/pdf/convert/from/image",
    "image/bmp": "/pdf/convert/from/image",
    "image/tiff": "/pdf/convert/from/image",
    "image/webp": "/pdf/convert/from/image",
  }
  return map[inputType] || null
}

async function getFileSize(url: string): Promise<number> {
  try {
    const response = await fetch(url, { method: "HEAD" })
    const contentLength = response.headers.get("content-length")
    return contentLength ? Number.parseInt(contentLength, 10) : 0
  } catch {
    return 0
  }
}
