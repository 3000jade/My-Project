import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  AlertTriangle,
  Sparkles,
  Check,
  Move,
  Plus,
  Building2,
  MapPin,
  ExternalLink,
  Layers,
  Scissors,
} from 'lucide-react';

/**
 * Line segment intersection calculation (p1->p2 with p3->p4)
 */
export function lineIntersection(p1, p2, p3, p4) {
  const d = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
  if (Math.abs(d) < 1e-6) return null;

  const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / d;
  const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / d;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: Math.round(p1.x + t * (p2.x - p1.x)),
      y: Math.round(p1.y + t * (p2.y - p1.y)),
    };
  }
  return null;
}

/**
 * Cleanly slice a polygon into two daughter polygons using a cut line
 */
export function slicePolygonWithLine(coords, cutStart, cutEnd) {
  if (!coords || coords.length < 3) return null;
  const n = coords.length;
  const intersections = [];

  for (let i = 0; i < n; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % n];
    const hit = lineIntersection(p1, p2, cutStart, cutEnd);
    if (hit) {
      intersections.push({ edgeIndex: i, pt: hit });
    }
  }

  // Exactly two boundary crossings required for a clean split
  if (intersections.length !== 2) return null;

  const [hit1, hit2] = intersections;
  const e1 = hit1.edgeIndex;
  const e2 = hit2.edgeIndex;

  // Daughter polygon 1: hit1.pt, coords between e1 and e2, hit2.pt
  const poly1 = [hit1.pt];
  let curr = (e1 + 1) % n;
  while (curr !== (e2 + 1) % n) {
    poly1.push(coords[curr]);
    curr = (curr + 1) % n;
  }
  poly1.push(hit2.pt);

  // Daughter polygon 2: hit2.pt, coords between e2 and e1, hit1.pt
  const poly2 = [hit2.pt];
  curr = (e2 + 1) % n;
  while (curr !== (e1 + 1) % n) {
    poly2.push(coords[curr]);
    curr = (curr + 1) % n;
  }
  poly2.push(hit1.pt);

  if (poly1.length >= 3 && poly2.length >= 3) {
    return [poly1, poly2];
  }
  return null;
}

export default function SubdivisionVectorCanvas({
  planImageUrl,
  planWidth = 1600,
  planHeight = 1000,
  planOpacity = 0.85,
  showPlanImage = true,
  showBoundaries = true,
  showLabels = true,
  lots = [],
  selectedLotId = null,
  selectedLotIds = [],
  activeTool = 'select', // 'select' | 'pan' | 'polygon' | 'rectangle' | 'slice' | 'ai_boundary' | 'ai_ocr'
  zoom = 1,
  pan = { x: 0, y: 0 },
  onZoomChange,
  onPanChange,
  onSelectLot,
  onLotCreated,
  onLotUpdated,
  onLotSplit,
  onAiDetectClick,
  onAiDetectBox,
  onAiOcrBox,
  className = '',
  // Enhanced props for location pinning & branding (FR-SM-048, FR-SM-049, FR-SM-050)
  plan,
  project,
  projectName,
  gpsCoordinates,
  isReadOnly = false,
  backgroundMode = 'white', // 'white' (default when opening subdivision) | 'satellite'
  showGrid = true,
}) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  // Resolution helpers
  const effectiveImageUrl = planImageUrl || plan?.image_url;
  const effectiveWidth = Number(planWidth || plan?.image_width || 1600);
  const effectiveHeight = Number(planHeight || plan?.image_height || 1000);
  const effectiveProjectName = projectName || project?.name;
  const effectiveGps =
    gpsCoordinates ||
    (project?.latitude && project?.longitude
      ? { lat: Number(project.latitude), lng: Number(project.longitude) }
      : null);

  // Drawing state
  const [drawingPoints, setDrawingPoints] = useState([]);
  const [currentCursorPos, setCurrentCursorPos] = useState(null);
  const [dragBoxStart, setDragBoxStart] = useState(null);
  const [currentDragBox, setCurrentDragBox] = useState(null);

  // Slicing / Splitting tool state
  const [sliceStart, setSliceStart] = useState(null);
  const [sliceCurrent, setSliceCurrent] = useState(null);

  // Dragging vertex or polygon state (FR-SM-050: Flexible vector editing)
  const [draggingVertexIndex, setDraggingVertexIndex] = useState(null);
  const [isTranslatingLot, setIsTranslatingLot] = useState(false);
  const [translateStartCoords, setTranslateStartCoords] = useState(null);
  const [initialLotCoords, setInitialLotCoords] = useState(null);
  const [activeSnapPoint, setActiveSnapPoint] = useState(null);

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Currently selected lot object
  const selectedLot = useMemo(() => {
    return lots.find((l) => l.id === selectedLotId);
  }, [lots, selectedLotId]);

  // Magnetic Snapping Engine (FR-SM-050)
  // Snaps to nearby corners/vertices of other lots within a 14px threshold
  const findMagneticSnapPoint = useCallback(
    (movingPoint, excludeLotId) => {
      let closestPt = null;
      let minDistance = 14;

      for (const lot of lots) {
        if (lot.id === excludeLotId) continue;
        for (const pt of lot.coordinates) {
          const dist = Math.hypot(pt.x - movingPoint.x, pt.y - movingPoint.y);
          if (dist < minDistance) {
            minDistance = dist;
            closestPt = pt;
          }
        }
      }
      return closestPt;
    },
    [lots]
  );

  // Key listeners (Space for pan, Escape to cancel, Arrow keys for precision micro-nudging)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT') {
        setIsSpacePressed(true);
      }
      if (e.code === 'Escape') {
        setDrawingPoints([]);
        setDragBoxStart(null);
        setCurrentDragBox(null);
        setIsTranslatingLot(false);
      }

      // Keyboard Micro-Nudging for selected lot (FR-SM-050)
      if (
        selectedLot &&
        !isReadOnly &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          let dx = 0;
          let dy = 0;
          if (e.key === 'ArrowUp') dy = -step;
          if (e.key === 'ArrowDown') dy = step;
          if (e.key === 'ArrowLeft') dx = -step;
          if (e.key === 'ArrowRight') dx = step;

          const updatedCoordinates = selectedLot.coordinates.map((p) => ({
            x: Math.round(p.x + dx),
            y: Math.round(p.y + dy),
          }));

          if (onLotUpdated) {
            onLotUpdated({
              ...selectedLot,
              coordinates: updatedCoordinates,
            });
          }
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedLot, isReadOnly, onLotUpdated]);

  // Convert screen / client mouse coordinate to SVG coordinate space
  const getSvgCoordinates = useCallback(
    (e) => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const svg = svgRef.current;

      // Standard SVG Matrix Transformation
      if (typeof svg.getScreenCTM === 'function' && typeof svg.createSVGPoint === 'function') {
        const ctm = svg.getScreenCTM();
        if (ctm) {
          const point = svg.createSVGPoint();
          point.x = e.clientX;
          point.y = e.clientY;
          const transformed = point.matrixTransform(ctm.inverse());
          return {
            x: Math.round(transformed.x),
            y: Math.round(transformed.y),
          };
        }
      }

      // Fallback computation using container bounding client rect
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = e.clientX ?? 0;
        const clientY = e.clientY ?? 0;
        const rawX = clientX - rect.left - pan.x;
        const rawY = clientY - rect.top - pan.y;
        return {
          x: Math.round(rawX / (zoom || 1)),
          y: Math.round(rawY / (zoom || 1)),
        };
      }

      return { x: 0, y: 0 };
    },
    [pan, zoom]
  );

  // Wheel Zoom (FR-004)
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.2), 6);

    if (onZoomChange && onPanChange && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
      const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

      onZoomChange(Number(newZoom.toFixed(3)));
      onPanChange({ x: Math.round(newPanX), y: Math.round(newPanY) });
    }
  };

  // Pointer Down
  const handleMouseDown = (e) => {
    // Middle click or space held initiates pan
    if (e.button === 1 || isSpacePressed || activeTool === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (e.button !== 0) return; // Only left click from here

    const coords = getSvgCoordinates(e);

    // 1. Polygon Drawing Tool (FR-006)
    if (activeTool === 'polygon') {
      if (drawingPoints.length > 2) {
        const startPt = drawingPoints[0];
        const dist = Math.hypot(coords.x - startPt.x, coords.y - startPt.y);
        if (dist < 15) {
          finishPolygon(drawingPoints);
          return;
        }
      }
      setDrawingPoints((prev) => [...prev, coords]);
      return;
    }

    // 2. Rectangle Drawing Tool (FR-006)
    if (activeTool === 'rectangle') {
      setDragBoxStart(coords);
      setCurrentDragBox({ x: coords.x, y: coords.y, width: 0, height: 0 });
      return;
    }

    // 3. AI Boundary Tool (FR-012)
    if (activeTool === 'ai_boundary') {
      setDragBoxStart(coords);
      setCurrentDragBox({ x: coords.x, y: coords.y, width: 0, height: 0 });
      return;
    }

    // 4. AI OCR Tool (FR-019)
    if (activeTool === 'ai_ocr') {
      setDragBoxStart(coords);
      setCurrentDragBox({ x: coords.x, y: coords.y, width: 0, height: 0 });
      return;
    }

    // 5. Slice / Split Tool
    if (activeTool === 'slice') {
      setSliceStart(coords);
      setSliceCurrent(coords);
      return;
    }
  };

  // Pointer Move
  const handleMouseMove = (e) => {
    if (isPanning) {
      if (onPanChange) {
        onPanChange({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
      }
      return;
    }

    const coords = getSvgCoordinates(e);
    setCurrentCursorPos(coords);

    // Handle Slicing Tool Drag
    if (activeTool === 'slice' && sliceStart) {
      setSliceCurrent(coords);
      return;
    }

    // Handle Whole-Lot Drag Translation (FR-SM-050)
    if (isTranslatingLot && selectedLot && initialLotCoords && translateStartCoords) {
      const dx = coords.x - translateStartCoords.x;
      const dy = coords.y - translateStartCoords.y;

      // Check magnetic snap across vertices
      let adjustedDx = dx;
      let adjustedDy = dy;
      let matchedSnap = null;

      for (const pt of initialLotCoords) {
        const currentTranslated = { x: pt.x + dx, y: pt.y + dy };
        const snap = findMagneticSnapPoint(currentTranslated, selectedLot.id);
        if (snap) {
          adjustedDx = snap.x - pt.x;
          adjustedDy = snap.y - pt.y;
          matchedSnap = snap;
          break;
        }
      }

      setActiveSnapPoint(matchedSnap);

      const updatedCoordinates = initialLotCoords.map((p) => ({
        x: Math.round(p.x + adjustedDx),
        y: Math.round(p.y + adjustedDy),
      }));

      if (onLotUpdated) {
        onLotUpdated({
          ...selectedLot,
          coordinates: updatedCoordinates,
        });
      }
      return;
    }

    // Handle Vertex Dragging with Magnetic Snapping (FR-008, FR-SM-050)
    if (draggingVertexIndex !== null && selectedLot) {
      const snap = findMagneticSnapPoint(coords, selectedLot.id);
      const finalCoords = snap ? { x: snap.x, y: snap.y } : coords;
      setActiveSnapPoint(snap ? { x: snap.x, y: snap.y } : null);

      const updatedCoordinates = [...selectedLot.coordinates];
      updatedCoordinates[draggingVertexIndex] = finalCoords;
      if (onLotUpdated) {
        onLotUpdated({
          ...selectedLot,
          coordinates: updatedCoordinates,
        });
      }
      return;
    }

    // Handle Drag Box (Rectangle or AI crop)
    if (dragBoxStart) {
      const minX = Math.min(dragBoxStart.x, coords.x);
      const minY = Math.min(dragBoxStart.y, coords.y);
      const width = Math.abs(coords.x - dragBoxStart.x);
      const height = Math.abs(coords.y - dragBoxStart.y);
      setCurrentDragBox({ x: minX, y: minY, width, height });
    }
  };

  // Pointer Up
  const handleMouseUp = (e) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isTranslatingLot) {
      setIsTranslatingLot(false);
      setTranslateStartCoords(null);
      setInitialLotCoords(null);
      setActiveSnapPoint(null);
      return;
    }

    if (draggingVertexIndex !== null) {
      setDraggingVertexIndex(null);
      setActiveSnapPoint(null);
      return;
    }

    // Finished Slice Cut
    if (activeTool === 'slice' && sliceStart && sliceCurrent) {
      const cutDistance = Math.hypot(sliceCurrent.x - sliceStart.x, sliceCurrent.y - sliceStart.y);
      if (cutDistance > 15) {
        // Target selected lot first, or find any lot intersected by the slice line
        const targetLot =
          (selectedLot && slicePolygonWithLine(selectedLot.coordinates, sliceStart, sliceCurrent)
            ? selectedLot
            : null) ||
          lots.find((l) => slicePolygonWithLine(l.coordinates, sliceStart, sliceCurrent) !== null);

        if (targetLot) {
          const slicedPolys = slicePolygonWithLine(targetLot.coordinates, sliceStart, sliceCurrent);
          if (slicedPolys && slicedPolys.length === 2 && onLotSplit) {
            const daughter1 = {
              ...targetLot,
              id: `lot-${Date.now()}-a`,
              lot_number: `${targetLot.lot_number || '1'}A`,
              coordinates: slicedPolys[0],
              verified_area_sqm: Math.round((targetLot.verified_area_sqm || 200) / 2),
            };
            const daughter2 = {
              ...targetLot,
              id: `lot-${Date.now()}-b`,
              lot_number: `${targetLot.lot_number || '1'}B`,
              coordinates: slicedPolys[1],
              verified_area_sqm: Math.round((targetLot.verified_area_sqm || 200) / 2),
            };
            onLotSplit(targetLot.id, [daughter1, daughter2]);
          }
        }
      }
      setSliceStart(null);
      setSliceCurrent(null);
      return;
    }

    if (dragBoxStart && currentDragBox) {
      const { x, y, width, height } = currentDragBox;

      // 1. Finished drawing Rectangle
      if (activeTool === 'rectangle' && width > 15 && height > 15) {
        const rectCoordinates = [
          { x, y },
          { x: x + width, y },
          { x: x + width, y: y + height },
          { x, y: y + height },
        ];
        finishPolygon(rectCoordinates);
      }
      // 2. Finished AI Boundary Selection
      else if (activeTool === 'ai_boundary') {
        if (width > 15 && height > 15 && onAiDetectBox) {
          onAiDetectBox({ x, y, width, height });
        } else if (onAiDetectClick) {
          onAiDetectClick({ x: dragBoxStart.x, y: dragBoxStart.y });
        }
      }
      // 3. Finished AI OCR Box Selection
      else if (activeTool === 'ai_ocr') {
        if (width > 15 && height > 15 && onAiOcrBox) {
          onAiOcrBox({ x, y, width, height });
        }
      }

      setDragBoxStart(null);
      setCurrentDragBox(null);
    }
  };

  // Complete drawing polygon
  const finishPolygon = (points) => {
    if (points.length < 3) {
      setDrawingPoints([]);
      return;
    }
    setDrawingPoints([]);

    if (onLotCreated) {
      const existingCount = lots.length;
      onLotCreated({
        id: `lot-${Date.now()}`,
        block_number: '1',
        lot_number: String(existingCount + 1),
        boundary_type: 'SaleableLot',
        availability_status: 'Available',
        verified_area_sqm: 250,
        price: null,
        coordinates: points,
        is_verified: true,
      });
    }
  };

  // Add a vertex at edge midpoint (FR-008)
  const handleAddVertexAtMidpoint = (lot, edgeIndex, midpoint) => {
    const updatedCoordinates = [...lot.coordinates];
    updatedCoordinates.splice(edgeIndex + 1, 0, midpoint);
    if (onLotUpdated) {
      onLotUpdated({
        ...lot,
        coordinates: updatedCoordinates,
      });
    }
  };

  // Remove a vertex on double click (FR-008)
  const handleRemoveVertex = (lot, vertexIndex) => {
    if (lot.coordinates.length <= 3) return; // Must have at least 3 vertices
    const updatedCoordinates = lot.coordinates.filter((_, idx) => idx !== vertexIndex);
    if (onLotUpdated) {
      onLotUpdated({
        ...lot,
        coordinates: updatedCoordinates,
      });
    }
  };

  // Compute centroid of polygon for label placement
  const computeCentroid = (points) => {
    if (!points || points.length === 0) return { x: 0, y: 0 };
    let xSum = 0;
    let ySum = 0;
    points.forEach((p) => {
      xSum += p.x;
      ySum += p.y;
    });
    return {
      x: Math.round(xSum / points.length),
      y: Math.round(ySum / points.length),
    };
  };

  // Color tokens per specification
  const getLotColors = (lot) => {
    if (!lot.is_verified) {
      return { fill: 'rgba(245, 158, 11, 0.25)', stroke: '#F59E0B', strokeWidth: 1.5 };
    }
    if (lot.boundary_type === 'Road') {
      return { fill: 'rgba(148, 163, 184, 0.25)', stroke: '#64748B', strokeWidth: 1.5 };
    }
    if (lot.boundary_type === 'Park') {
      return { fill: 'rgba(16, 185, 129, 0.3)', stroke: '#10B981', strokeWidth: 1.5 };
    }
    if (lot.boundary_type === 'Waterway') {
      return { fill: 'rgba(2, 132, 199, 0.3)', stroke: '#0284C7', strokeWidth: 1.5 };
    }

    switch (lot.availability_status) {
      case 'Available':
        return { fill: 'rgba(15, 118, 110, 0.22)', stroke: '#0F766E', strokeWidth: 1.5 };
      case 'Reserved':
        return { fill: 'rgba(245, 158, 11, 0.28)', stroke: '#F59E0B', strokeWidth: 1.5 };
      case 'Sold':
        return { fill: 'rgba(100, 116, 139, 0.25)', stroke: '#64748B', strokeWidth: 1.5 };
      case 'Unavailable':
      default:
        return { fill: 'rgba(239, 68, 68, 0.2)', stroke: '#EF4444', strokeWidth: 1.5 };
    }
  };

  // Cursor style based on active tool
  const getCursorClass = () => {
    if (isPanning) return 'cursor-grabbing';
    if (isSpacePressed || activeTool === 'pan') return 'cursor-grab';
    if (isTranslatingLot) return 'cursor-move';
    if (activeTool === 'polygon' || activeTool === 'rectangle' || activeTool === 'slice') return 'cursor-crosshair';
    if (activeTool === 'ai_boundary' || activeTool === 'ai_ocr') return 'cursor-crosshair';
    return 'cursor-default';
  };

  return (
    <div
      ref={containerRef}
      data-testid="subdivision-vector-canvas-container"
      data-lenis-prevent="true"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`relative w-full h-full overflow-hidden select-none ${
        backgroundMode === 'white'
          ? 'bg-white'
          : 'bg-slate-900'
      } ${getCursorClass()} ${className}`}
    >
      {/* Upper-Right Subdivision Name HUD Badge (FR-SM-048, FR-SM-049) */}
      {effectiveProjectName && (
        <div
          data-testid="subdivision-upper-right-hud"
          className="absolute top-4 right-4 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-4 py-2.5 shadow-xl flex items-center gap-3 pointer-events-auto"
        >
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-wider font-bold text-teal-400 block truncate">
              Subdivision Community
            </span>
            <h2 className="text-sm font-bold text-white tracking-tight truncate">{effectiveProjectName}</h2>
            {effectiveGps?.lat && effectiveGps?.lng && (
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 mt-0.5">
                <MapPin className="w-3 h-3 text-teal-500 shrink-0" />
                <span>
                  {Number(effectiveGps.lat).toFixed(5)}, {Number(effectiveGps.lng).toFixed(5)}
                </span>
                <a
                  href={`https://www.google.com/maps?q=${effectiveGps.lat},${effectiveGps.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open pinned location in Google Maps"
                  className="text-teal-400 hover:text-teal-300 ml-1 inline-flex items-center"
                >
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Google Maps Satellite Ground Base Layer (Rendered only when Satellite mode is toggled) */}
      {backgroundMode === 'satellite' && effectiveGps?.lat && effectiveGps?.lng && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-90">
          <iframe
            key={`gmap-bg-${effectiveGps.lat}-${effectiveGps.lng}`}
            title="Google Maps Pinned Terrain Background"
            src={`https://maps.google.com/maps?q=${Number(effectiveGps.lat).toFixed(6)},${Number(effectiveGps.lng).toFixed(6)}&t=k&z=17&output=embed`}
            className="w-full h-full border-0 select-none brightness-95 contrast-105"
            loading="lazy"
          />
        </div>
      )}

      {/* Primary SVG Vector Canvas */}
      <svg
        ref={svgRef}
        data-testid="subdivision-vector-svg"
        viewBox={`0 0 ${effectiveWidth} ${effectiveHeight}`}
        className="w-full h-full origin-top-left relative z-10"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transition: isPanning || isTranslatingLot ? 'none' : 'transform 0.05s ease-out',
        }}
      >
        <defs>
          <pattern id="cad-grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="1" fill="#E2E8F0" />
          </pattern>
        </defs>

        {/* CAD Drafting Geometric Dot Grid (FR-003: Rendered when on pure white canvas) */}
        {backgroundMode === 'white' && showGrid && (
          <rect width={effectiveWidth} height={effectiveHeight} fill="url(#cad-grid-pattern)" className="pointer-events-none" />
        )}

        {/* Layer 1: Master Plan Blueprint Image Graphic Overlay (Rendered when a blueprint/picture image is present) */}
        {showPlanImage && effectiveImageUrl && (
          <image
            href={effectiveImageUrl}
            x="0"
            y="0"
            width={effectiveWidth}
            height={effectiveHeight}
            opacity={planOpacity}
            preserveAspectRatio="xMidYMid meet"
            className="pointer-events-none"
          />
        )}

        {/* Layer 2: Completed Vector Polygons (FR-006, FR-028, FR-SM-050) */}
        {showBoundaries &&
          lots.map((lot) => {
            const isSelected = lot.id === selectedLotId || selectedLotIds.includes(lot.id);
            const pointsString = lot.coordinates.map((p) => `${p.x},${p.y}`).join(' ');
            const colors = getLotColors(lot);
            const centroid = computeCentroid(lot.coordinates);

            return (
              <g key={lot.id} data-testid={`lot-polygon-group-${lot.id}`}>
                <polygon
                  points={pointsString}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={colors.strokeWidth}
                  strokeDasharray={isSelected ? '6,3' : 'none'}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeTool === 'select' && onSelectLot) {
                      onSelectLot(lot.id, { isMulti: e.shiftKey });
                    }
                  }}
                  onMouseDown={(e) => {
                    // Whole-Lot Drag Initiation (FR-SM-050)
                    if (activeTool === 'select' && !isReadOnly && e.button === 0) {
                      e.stopPropagation();
                      if (selectedLotId !== lot.id && onSelectLot && !e.shiftKey) {
                        onSelectLot(lot.id);
                      }
                      const coords = getSvgCoordinates(e);
                      setIsTranslatingLot(true);
                      setTranslateStartCoords(coords);
                      setInitialLotCoords([...lot.coordinates]);
                    }
                  }}
                  className="cursor-pointer transition-colors duration-150 hover:brightness-110"
                />

                {/* Block and Lot Centroid Label (FR-024) */}
                {showLabels && (
                  <g
                    transform={`translate(${centroid.x}, ${centroid.y})`}
                    className="pointer-events-none select-none"
                  >
                    <rect
                      x="-28"
                      y="-12"
                      width="56"
                      height="24"
                      rx="4"
                      fill="rgba(15, 23, 42, 0.85)"
                      stroke={colors.stroke}
                      strokeWidth="1"
                    />
                    <text
                      textAnchor="middle"
                      dy="4"
                      className="text-[11px] font-bold fill-white tracking-wider"
                    >
                      {lot.boundary_type === 'SaleableLot'
                        ? `B${lot.block_number} L${lot.lot_number}`
                        : lot.boundary_type.substring(0, 4)}
                    </text>
                    {!lot.is_verified && (
                      <g transform="translate(20, -8)">
                        <circle cx="0" cy="0" r="6" fill="#F59E0B" />
                        <text
                          textAnchor="middle"
                          dy="3"
                          className="text-[9px] font-bold fill-white"
                        >
                          !
                        </text>
                      </g>
                    )}
                  </g>
                )}
              </g>
            );
          })}

        {/* Magnetic Snapping Indicator (FR-SM-050) */}
        {activeSnapPoint && (
          <g className="pointer-events-none">
            <circle
              cx={activeSnapPoint.x}
              cy={activeSnapPoint.y}
              r="10"
              fill="none"
              stroke="#00F0FF"
              strokeWidth="2.5"
              className="animate-pulse"
            />
            <circle cx={activeSnapPoint.x} cy={activeSnapPoint.y} r="4" fill="#00F0FF" />
          </g>
        )}

        {/* Layer 3: Interactive Vertex Handles & Midpoint '+' buttons on Selected Lot */}
        {selectedLot && !isReadOnly && (
          <g data-testid="selected-lot-vertex-handles">
            {selectedLot.coordinates.map((pt, idx) => {
              const nextPt =
                selectedLot.coordinates[(idx + 1) % selectedLot.coordinates.length];
              const midpoint = {
                x: (pt.x + nextPt.x) / 2,
                y: (pt.y + nextPt.y) / 2,
              };

              return (
                <React.Fragment key={`handles-${idx}`}>
                  {/* Vertex Corner Handle (FR-008) */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={6 / zoom + 2}
                    fill="#0F766E"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDraggingVertexIndex(idx);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleRemoveVertex(selectedLot, idx);
                    }}
                    title="Drag to reposition vertex. Double click to delete."
                    className="cursor-move hover:scale-125 transition-transform"
                  />

                  {/* Midpoint '+' Handle to add new vertex (FR-008, FR-SM-050) */}
                  <circle
                    cx={midpoint.x}
                    cy={midpoint.y}
                    r={4 / zoom + 1.5}
                    fill="#FF6B6B"
                    stroke="#FFFFFF"
                    strokeWidth={1.5}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddVertexAtMidpoint(selectedLot, idx, midpoint);
                    }}
                    title="Click to add corner point on this boundary edge"
                    className="cursor-pointer hover:scale-150 transition-transform opacity-75 hover:opacity-100"
                  />
                </React.Fragment>
              );
            })}
          </g>
        )}

        {/* Layer 4: Live In-Progress Polygon Drawing Guidelines (FR-006) */}
        {drawingPoints.length > 0 && (
          <g data-testid="drawing-polygon-guideline">
            {/* Completed segments */}
            <polyline
              points={drawingPoints.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#FF6B6B"
              strokeWidth="2"
            />
            {/* Live connecting ray to cursor */}
            {currentCursorPos && (
              <line
                x1={drawingPoints[drawingPoints.length - 1].x}
                y1={drawingPoints[drawingPoints.length - 1].y}
                x2={currentCursorPos.x}
                y2={currentCursorPos.y}
                stroke="#FF6B6B"
                strokeWidth="1.5"
                strokeDasharray="4,4"
              />
            )}
            {/* Vertex markers */}
            {drawingPoints.map((p, i) => (
              <circle
                key={`draw-pt-${i}`}
                cx={p.x}
                cy={p.y}
                r="4"
                fill={i === 0 ? '#10B981' : '#FF6B6B'}
                stroke="#FFFFFF"
                strokeWidth="1.5"
                onClick={() => {
                  if (i === 0 && drawingPoints.length >= 3) {
                    finishPolygon(drawingPoints);
                  }
                }}
                className={
                  i === 0 && drawingPoints.length >= 3 ? 'cursor-pointer animate-pulse' : ''
                }
              />
            ))}
          </g>
        )}

        {/* Layer 5: Drag Selection Box (Rectangle / AI Region Box) */}
        {currentDragBox && currentDragBox.width > 0 && currentDragBox.height > 0 && (
          <rect
            x={currentDragBox.x}
            y={currentDragBox.y}
            width={currentDragBox.width}
            height={currentDragBox.height}
            fill={
              activeTool.startsWith('ai')
                ? 'rgba(15, 118, 110, 0.2)'
                : 'rgba(255, 107, 107, 0.2)'
            }
            stroke={activeTool.startsWith('ai') ? '#0F766E' : '#FF6B6B'}
            strokeWidth="2"
            strokeDasharray={activeTool.startsWith('ai') ? '4,4' : 'none'}
            className="pointer-events-none"
          />
        )}

        {/* Layer 6: Slicing Cut Line Preview */}
        {sliceStart && sliceCurrent && (
          <g data-testid="slice-line-preview" className="pointer-events-none">
            <line
              x1={sliceStart.x}
              y1={sliceStart.y}
              x2={sliceCurrent.x}
              y2={sliceCurrent.y}
              stroke="#FF6B6B"
              strokeWidth="3"
              strokeDasharray="6,4"
            />
            <circle cx={sliceStart.x} cy={sliceStart.y} r={5} fill="#FF6B6B" />
            <circle cx={sliceCurrent.x} cy={sliceCurrent.y} r={5} fill="#FF6B6B" />
          </g>
        )}
      </svg>
    </div>
  );
}
