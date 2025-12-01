import { useState, useRef, useEffect, useCallback } from "react";

export default function ImageCropper({ image, onCropComplete, onCropAndNext, onCancel }) {
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

  // Crop selection state (percentages of image)
  const [crop, setCrop] = useState({ x: 0, y: 5, width: 100, height: 90 });
  const [dragging, setDragging] = useState(null); // 'move', 'nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, crop: null });

  useEffect(() => {
    if (imageRef.current && imageLoaded) {
      const rect = imageRef.current.getBoundingClientRect();
      setImageDimensions({ width: rect.width, height: rect.height });
    }
  }, [imageLoaded]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    // Reset crop to 10% margin on all sides
    setCrop({ x: 0, y: 5, width: 100, height: 90 });
  };

  const getEventPosition = useCallback((e) => {
    if (!imageRef.current) return { x: 0, y: 0 };
    const rect = imageRef.current.getBoundingClientRect();

    // Handle both mouse and touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  const handlePointerDown = useCallback(
    (e, handle) => {
      e.preventDefault();
      e.stopPropagation();
      const pos = getEventPosition(e);
      setDragging(handle);
      setDragStart({ x: pos.x, y: pos.y, crop: { ...crop } });
    },
    [crop, getEventPosition]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!dragging || !dragStart.crop) return;

      // Prevent scrolling on touch devices
      if (e.touches) {
        e.preventDefault();
      }

      const pos = getEventPosition(e);
      const dx = pos.x - dragStart.x;
      const dy = pos.y - dragStart.y;
      const startCrop = dragStart.crop;

      let newCrop = { ...crop };
      const minSize = 5; // minimum 5% size

      switch (dragging) {
        case "move":
          newCrop.x = Math.max(
            0,
            Math.min(100 - startCrop.width, startCrop.x + dx)
          );
          newCrop.y = Math.max(
            0,
            Math.min(100 - startCrop.height, startCrop.y + dy)
          );
          break;
        case "nw":
          newCrop.x = Math.max(
            0,
            Math.min(startCrop.x + startCrop.width - minSize, startCrop.x + dx)
          );
          newCrop.y = Math.max(
            0,
            Math.min(startCrop.y + startCrop.height - minSize, startCrop.y + dy)
          );
          newCrop.width = startCrop.width - (newCrop.x - startCrop.x);
          newCrop.height = startCrop.height - (newCrop.y - startCrop.y);
          break;
        case "n":
          newCrop.y = Math.max(
            0,
            Math.min(startCrop.y + startCrop.height - minSize, startCrop.y + dy)
          );
          newCrop.height = startCrop.height - (newCrop.y - startCrop.y);
          break;
        case "ne":
          newCrop.y = Math.max(
            0,
            Math.min(startCrop.y + startCrop.height - minSize, startCrop.y + dy)
          );
          newCrop.width = Math.max(
            minSize,
            Math.min(100 - startCrop.x, startCrop.width + dx)
          );
          newCrop.height = startCrop.height - (newCrop.y - startCrop.y);
          break;
        case "e":
          newCrop.width = Math.max(
            minSize,
            Math.min(100 - startCrop.x, startCrop.width + dx)
          );
          break;
        case "se":
          newCrop.width = Math.max(
            minSize,
            Math.min(100 - startCrop.x, startCrop.width + dx)
          );
          newCrop.height = Math.max(
            minSize,
            Math.min(100 - startCrop.y, startCrop.height + dy)
          );
          break;
        case "s":
          newCrop.height = Math.max(
            minSize,
            Math.min(100 - startCrop.y, startCrop.height + dy)
          );
          break;
        case "sw":
          newCrop.x = Math.max(
            0,
            Math.min(startCrop.x + startCrop.width - minSize, startCrop.x + dx)
          );
          newCrop.width = startCrop.width - (newCrop.x - startCrop.x);
          newCrop.height = Math.max(
            minSize,
            Math.min(100 - startCrop.y, startCrop.height + dy)
          );
          break;
        case "w":
          newCrop.x = Math.max(
            0,
            Math.min(startCrop.x + startCrop.width - minSize, startCrop.x + dx)
          );
          newCrop.width = startCrop.width - (newCrop.x - startCrop.x);
          break;
      }

      setCrop(newCrop);
    },
    [dragging, dragStart, crop, getEventPosition]
  );

  const handlePointerUp = useCallback(() => {
    setDragging(null);
    setDragStart({ x: 0, y: 0, crop: null });
  }, []);

  useEffect(() => {
    if (dragging) {
      // Mouse events
      document.addEventListener("mousemove", handlePointerMove);
      document.addEventListener("mouseup", handlePointerUp);
      // Touch events
      document.addEventListener("touchmove", handlePointerMove, { passive: false });
      document.addEventListener("touchend", handlePointerUp);
      document.addEventListener("touchcancel", handlePointerUp);
      return () => {
        document.removeEventListener("mousemove", handlePointerMove);
        document.removeEventListener("mouseup", handlePointerUp);
        document.removeEventListener("touchmove", handlePointerMove);
        document.removeEventListener("touchend", handlePointerUp);
        document.removeEventListener("touchcancel", handlePointerUp);
      };
    }
  }, [dragging, handlePointerMove, handlePointerUp]);

  const getCroppedImage = async () => {
    if (!imageRef.current) return null;

    const img = new Image();
    img.crossOrigin = "anonymous";

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = image;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Calculate actual pixel values from percentages
    const cropX = (crop.x / 100) * img.naturalWidth;
    const cropY = (crop.y / 100) * img.naturalHeight;
    const cropWidth = (crop.width / 100) * img.naturalWidth;
    const cropHeight = (crop.height / 100) * img.naturalHeight;

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    ctx.drawImage(
      img,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    return canvas.toDataURL("image/png");
  };

  const applyCrop = async () => {
    const croppedDataUrl = await getCroppedImage();
    if (croppedDataUrl) {
      onCropComplete(croppedDataUrl);
    }
  };

  const applyCropAndNext = async () => {
    const croppedDataUrl = await getCroppedImage();
    if (croppedDataUrl && onCropAndNext) {
      onCropAndNext(croppedDataUrl);
    }
  };

  return (
    <div className="cropper-container" ref={containerRef}>
      <div className="cropper-header">
        <h2>Crop Image</h2>
        <div className="cropper-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={applyCrop}>
            Apply Crop
          </button>
          {onCropAndNext && (
            <button className="btn btn-primary" onClick={applyCropAndNext}>
              Apply & Next
            </button>
          )}
        </div>
      </div>

      <div className="cropper-wrapper">
        <div className="cropper-image-container">
          <img
            ref={imageRef}
            src={image}
            alt="Crop preview"
            className="cropper-image"
            onLoad={handleImageLoad}
            draggable={false}
          />

          {imageLoaded && (
            <div
              className="crop-selection"
              style={{
                left: `${crop.x}%`,
                top: `${crop.y}%`,
                width: `${crop.width}%`,
                height: `${crop.height}%`,
                touchAction: "none",
              }}
              onMouseDown={(e) => handlePointerDown(e, "move")}
              onTouchStart={(e) => handlePointerDown(e, "move")}
            >
              {/* Grid overlay */}
              <div className="crop-grid"></div>

              {/* Corner handles */}
              <div
                className="crop-handle nw"
                onMouseDown={(e) => handlePointerDown(e, "nw")}
                onTouchStart={(e) => handlePointerDown(e, "nw")}
              />
              <div
                className="crop-handle n"
                onMouseDown={(e) => handlePointerDown(e, "n")}
                onTouchStart={(e) => handlePointerDown(e, "n")}
              />
              <div
                className="crop-handle ne"
                onMouseDown={(e) => handlePointerDown(e, "ne")}
                onTouchStart={(e) => handlePointerDown(e, "ne")}
              />
              <div
                className="crop-handle e"
                onMouseDown={(e) => handlePointerDown(e, "e")}
                onTouchStart={(e) => handlePointerDown(e, "e")}
              />
              <div
                className="crop-handle se"
                onMouseDown={(e) => handlePointerDown(e, "se")}
                onTouchStart={(e) => handlePointerDown(e, "se")}
              />
              <div
                className="crop-handle s"
                onMouseDown={(e) => handlePointerDown(e, "s")}
                onTouchStart={(e) => handlePointerDown(e, "s")}
              />
              <div
                className="crop-handle sw"
                onMouseDown={(e) => handlePointerDown(e, "sw")}
                onTouchStart={(e) => handlePointerDown(e, "sw")}
              />
              <div
                className="crop-handle w"
                onMouseDown={(e) => handlePointerDown(e, "w")}
                onTouchStart={(e) => handlePointerDown(e, "w")}
              />

              {/* Edge handles for easier resizing */}
              <div
                className="crop-edge top"
                onMouseDown={(e) => handlePointerDown(e, "n")}
                onTouchStart={(e) => handlePointerDown(e, "n")}
              />
              <div
                className="crop-edge bottom"
                onMouseDown={(e) => handlePointerDown(e, "s")}
                onTouchStart={(e) => handlePointerDown(e, "s")}
              />
              <div
                className="crop-edge left"
                onMouseDown={(e) => handlePointerDown(e, "w")}
                onTouchStart={(e) => handlePointerDown(e, "w")}
              />
              <div
                className="crop-edge right"
                onMouseDown={(e) => handlePointerDown(e, "e")}
                onTouchStart={(e) => handlePointerDown(e, "e")}
              />
            </div>
          )}
        </div>
      </div>

      <p
        style={{
          textAlign: "center",
          marginTop: "1rem",
          color: "rgba(255,255,255,0.5)",
        }}
      >
        Drag corners or edges to adjust the crop area • Drag inside to move
      </p>
    </div>
  );
}
