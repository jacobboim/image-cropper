import { useState, useRef, useEffect } from 'react'
import { pdfToImages } from '../utils/pdfUtils'

export default function FileUploader({ onFilesLoaded }) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    const handlePaste = async (e) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            await processFile(file)
            return
          }
        }
        if (item.type === 'application/pdf') {
          const file = item.getAsFile()
          if (file) {
            await processFile(file)
            return
          }
        }
      }

      // Check for files
      const files = e.clipboardData?.files
      if (files?.length > 0) {
        await processFile(files[0])
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [])

  const processFile = async (file) => {
    setIsLoading(true)
    try {
      if (file.type === 'application/pdf') {
        setLoadingText('Converting PDF pages...')
        const images = await pdfToImages(file)
        onFilesLoaded(images, file.name.replace('.pdf', ''))
      } else if (file.type.startsWith('image/')) {
        setLoadingText('Loading image...')
        const dataUrl = await fileToDataUrl(file)
        onFilesLoaded([dataUrl], file.name.replace(/\.[^.]+$/, ''))
      }
    } catch (error) {
      console.error('Error processing file:', error)
      alert('Error processing file. Please try again.')
    } finally {
      setIsLoading(false)
      setLoadingText('')
    }
  }

  const fileToDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) await processFile(file)
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (file) await processFile(file)
  }

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>{loadingText}</p>
      </div>
    )
  }

  return (
    <div className="uploader">
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="drop-zone-icon">📄</div>
        <h2>Drop your file here</h2>
        <p>or click to browse • supports PDF and images</p>
        <button className="btn btn-primary" onClick={(e) => e.stopPropagation()}>
          Choose File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,image/*"
          onChange={handleFileChange}
        />
      </div>
      <p style={{ marginTop: '1.5rem', color: 'rgba(255,255,255,0.5)' }}>
        💡 Tip: You can also paste (Ctrl/Cmd + V) an image or PDF directly
      </p>
    </div>
  )
}
