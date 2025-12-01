import { useState } from 'react'
import FileUploader from './components/FileUploader'
import PageList from './components/PageList'
import ImageCropper from './components/ImageCropper'
import { exportToPdf, exportAsImages } from './utils/exportUtils'
import './App.css'

function App() {
  const [pages, setPages] = useState([])
  const [selectedPage, setSelectedPage] = useState(null)
  const [fileName, setFileName] = useState('')

  const handleFilesLoaded = (loadedPages, name) => {
    setPages(loadedPages.map((img, i) => ({
      id: i,
      original: img,
      cropped: null
    })))
    setFileName(name)
    setSelectedPage(null)
  }

  const handleCropComplete = (croppedImage) => {
    setPages(prev => prev.map(p => 
      p.id === selectedPage.id ? { ...p, cropped: croppedImage } : p
    ))
    setSelectedPage(null)
  }

  const handleExportPdf = async () => {
    const images = pages.map(p => p.cropped || p.original)
    await exportToPdf(images, fileName || 'cropped-document')
  }

  const handleExportImages = async () => {
    const images = pages.map(p => p.cropped || p.original)
    await exportAsImages(images, fileName || 'cropped')
  }

  const handleReset = () => {
    setPages([])
    setSelectedPage(null)
    setFileName('')
  }

  return (
    <div className="app">
      <header className="header">
        <h1>PDF & Image Cropper</h1>
        <p>Paste or upload files, crop each page, and export</p>
      </header>

      {pages.length === 0 ? (
        <FileUploader onFilesLoaded={handleFilesLoaded} />
      ) : selectedPage ? (
        <ImageCropper
          image={selectedPage.cropped || selectedPage.original}
          onCropComplete={handleCropComplete}
          onCancel={() => setSelectedPage(null)}
        />
      ) : (
        <div className="workspace">
          <div className="toolbar">
            <button className="btn btn-secondary" onClick={handleReset}>
              ← New File
            </button>
            <div className="export-buttons">
              <button className="btn btn-primary" onClick={handleExportPdf}>
                Export as PDF
              </button>
              <button className="btn btn-secondary" onClick={handleExportImages}>
                Export as Images
              </button>
            </div>
          </div>
          <PageList
            pages={pages}
            onSelectPage={setSelectedPage}
          />
        </div>
      )}
    </div>
  )
}

export default App
