import { jsPDF } from 'jspdf'
import { saveAs } from 'file-saver'

export async function exportToPdf(images, fileName) {
  if (images.length === 0) return

  // Load first image to get dimensions
  const firstImg = await loadImage(images[0])
  const pdf = new jsPDF({
    orientation: firstImg.width > firstImg.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [firstImg.width, firstImg.height]
  })

  for (let i = 0; i < images.length; i++) {
    const img = await loadImage(images[i])
    
    if (i > 0) {
      pdf.addPage([img.width, img.height], img.width > img.height ? 'landscape' : 'portrait')
    }

    pdf.addImage(images[i], 'PNG', 0, 0, img.width, img.height)
  }

  pdf.save(`${fileName}.pdf`)
}

export async function exportAsImages(images, baseName) {
  if (images.length === 1) {
    // Single image, download directly
    const blob = await dataUrlToBlob(images[0])
    saveAs(blob, `${baseName}.png`)
  } else {
    // Multiple images, create zip
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    
    for (let i = 0; i < images.length; i++) {
      const blob = await dataUrlToBlob(images[i])
      zip.file(`${baseName}-page-${i + 1}.png`, blob)
    }

    const content = await zip.generateAsync({ type: 'blob' })
    saveAs(content, `${baseName}-images.zip`)
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function dataUrlToBlob(dataUrl) {
  return fetch(dataUrl).then(res => res.blob())
}
