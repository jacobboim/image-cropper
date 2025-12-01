export default function PageList({ pages, onSelectPage }) {
  return (
    <div className="page-list">
      {pages.map((page) => (
        <div
          key={page.id}
          className="page-card"
          onClick={() => onSelectPage(page)}
        >
          <img
            src={page.cropped || page.original}
            alt={`Page ${page.id + 1}`}
          />
          <div className="page-card-footer">
            <span>Page {page.id + 1}</span>
            {page.cropped && <span className="cropped-badge">Cropped</span>}
          </div>
          <div className="page-card-overlay">
            <span>Click to Crop</span>
          </div>
        </div>
      ))}
    </div>
  )
}
