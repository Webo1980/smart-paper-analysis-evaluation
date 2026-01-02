import React, { useEffect, useRef, useState } from 'react';
import { Info, ZoomIn, ZoomOut, RefreshCw, ChevronsUpDown, ChevronsDownUp, Target, CheckCircle } from 'lucide-react';
import * as d3 from 'd3';
import ResearchFieldPredictionsTable from './ResearchFieldPredictionsTable';
import { formatPercent } from '../utils/commonMetricsUtils';

const ResearchFieldTree = ({
  groundTruth,
  prediction,
  hierarchyAnalysis,
  predictedValues = [],
  fixedRelevanceData = null
}) => {
  const treeRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showFullPaths, setShowFullPaths] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState(prediction);
  const normalizedGroundTruth = groundTruth?.toLowerCase() || '';

  const colors = {
    common: {
      bg: '#e0f2fe',
      border: '#38bdf8',
      text: '#0369a1'
    },
    reference: {
      bg: '#fee2e2',
      border: '#ef4444',
      text: '#b91c1c',
      path: '#ef4444',
      highlight: '#fca5a5'
    },
    prediction: {
      bg: '#dcfce7',
      border: '#22c55e',
      text: '#166534',
      path: '#22c55e', 
      highlight: '#86efac'
    },
    background: '#f8fafc',
    text: '#334155',
    lightText: '#64748b'
  };

  const researchFieldsTree = hierarchyAnalysis || { children: [] };

  const findFieldPathByLabel = (hierarchy, label) => {
    if (!hierarchy || !label) return [];
    
    const findPath = (node, targetLabel, currentPath = []) => {
      if (!node || !node.label) return null;
      
      const newPath = [...currentPath, { id: node.id, label: node.label }];
      if (node.label === targetLabel) return newPath;
      
      if (node.children) {
        for (const child of node.children) {
          const result = findPath(child, targetLabel, newPath);
          if (result) return result;
        }
      }
      return null;
    };
    return findPath(hierarchy, label) || [];
  };

  // Calculate field distances for each predicted value
  const calculateFieldDistances = () => {
    if (!groundTruth || !predictedValues.length) return [];
    
    const gtPath = findFieldPathByLabel(researchFieldsTree, groundTruth);
    
    return predictedValues.map(pred => {
      const predPath = findFieldPathByLabel(researchFieldsTree, pred.name);
      
      // Find common ancestors
      const commonAncestors = (() => {
        const ancestors = [];
        const minLength = Math.min(gtPath.length, predPath.length);
        for (let i = 0; i < minLength; i++) {
          if (gtPath[i]?.id === predPath[i]?.id) {
            ancestors.push(gtPath[i]);
          } else {
            break;
          }
        }
        return ancestors;
      })();
      
      // Calculate path distance
      const distance = (gtPath.length - commonAncestors.length) + 
                       (predPath.length - commonAncestors.length);
      
      return {
        ...pred,
        pathDistance: distance,
        commonAncestors: commonAncestors.length
      };
    });
  };

  const fieldsWithDistances = calculateFieldDistances();

  const refFieldPath = findFieldPathByLabel(researchFieldsTree, groundTruth);
  const predFieldPath = findFieldPathByLabel(researchFieldsTree, selectedPrediction);

  const findCommonAncestors = () => {
    const ancestors = [];
    const minLength = Math.min(refFieldPath.length, predFieldPath.length);
    for (let i = 0; i < minLength; i++) {
      if (refFieldPath[i]?.id === predPath[i]?.id) {
        ancestors.push(refFieldPath[i]);
      } else {
        break;
      }
    }
    return ancestors;
  };

  const commonAncestors = (() => {
    const ancestors = [];
    const minLength = Math.min(refFieldPath.length, predFieldPath.length);
    for (let i = 0; i < minLength; i++) {
      if (refFieldPath[i]?.id === predFieldPath[i]?.id) {
        ancestors.push(refFieldPath[i]);
      } else {
        break;
      }
    }
    return ancestors;
  })();

  const pathDistance = (refFieldPath.length - commonAncestors.length) + 
                    (predFieldPath.length - commonAncestors.length);

  const isExactMatch = refFieldPath.length > 0 && 
                      predFieldPath.length > 0 &&
                      refFieldPath.length === predFieldPath.length && 
                      refFieldPath[refFieldPath.length - 1]?.id === 
                      predFieldPath[predFieldPath.length - 1]?.id;

  const getRelationshipType = () => {
    if (isExactMatch) return 'exact';
    if (commonAncestors.length === 0) return 'distant';
    const lastCommonIndex = commonAncestors.length - 1;
    const refRemaining = refFieldPath.length - commonAncestors.length;
    const predRemaining = predFieldPath.length - commonAncestors.length;
    if (refRemaining === 0 && predRemaining > 0) return 'parent';
    if (predRemaining === 0 && refRemaining > 0) return 'child';
    if (refRemaining === 1 && predRemaining === 1) return 'sibling';
    return 'distant';
  };

  const relationshipType = getRelationshipType();

  // Calculate current hierarchy metrics
  const maxPathLength = Math.max(refFieldPath.length, predFieldPath.length) || 1;
  
  // Hierarchy score calculation - matches utility function
  const hierarchyScore = isExactMatch ? 
    1.0 : 
    commonAncestors.length === 0 ? 
      0.1 : 
      (0.6 * (commonAncestors.length / maxPathLength) + 0.4 * (1 / (pathDistance + 1)));

  // Calculate Jaccard similarity
  const refPathSet = new Set(refFieldPath.map(node => node.id));
  const predPathSet = new Set(predFieldPath.map(node => node.id));
  const pathIntersection = [...refPathSet].filter(id => predPathSet.has(id));
  const intersectionSize = pathIntersection.length;
  const unionSize = new Set([...refPathSet, ...predPathSet]).size;
  const jaccardScore = unionSize ? intersectionSize / unionSize : 0;

  // For current visualization, use 0 for word overlap since we're not comparing text
  const wordOverlapScore = 0;

  // Calculate current visualization relevance score
  const visualizationRelevanceScore = (
    (hierarchyScore * 0.4) + 
    (wordOverlapScore * 0.4) + 
    (jaccardScore * 0.2)
  );

  const resetVisualization = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  const handlePredictionSelect = (predName) => {
    setSelectedPrediction(predName);
    resetVisualization();
  };

  useEffect(() => {
    if (!treeRef.current || isLoading) return;

    d3.select(treeRef.current).selectAll("*").remove();

    if (refFieldPath.length === 0 && predFieldPath.length === 0) {
      const noDataDiv = document.createElement('div');
      noDataDiv.className = 'p-4 text-center text-gray-500';
      noDataDiv.innerText = 'No hierarchy data available for visualization';
      treeRef.current.appendChild(noDataDiv);
      return;
    }

    const width = treeRef.current.clientWidth;
    const height = 600;
    const nodeWidth = 180;
    const nodeHeight = 40;
    const levelHeight = 80; // Reduced from 100 to 80 for better spacing

    const svg = d3.select(treeRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; background: #f8fafc; border-radius: 0.375rem;");

    const zoomContainer = svg.append("g")
      .attr("transform", `scale(${zoomLevel})`);

    const defs = zoomContainer.append("defs");
    defs.append("marker")
      .attr("id", "ref-arrow")
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 8)
      .attr("refY", 5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M 0 0 L 10 5 L 0 10 z")
      .attr("fill", colors.reference.border);

    defs.append("marker")
      .attr("id", "pred-arrow")
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 8)
      .attr("refY", 5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M 0 0 L 10 5 L 0 10 z")
      .attr("fill", colors.prediction.border);

    zoomContainer.append("text")
      .attr("x", width / 2)
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("font-weight", "600")
      .attr("fill", colors.text)
      .text("Research Field Hierarchy Comparison");

    const rootX = width / 2;
    const rootY = 60;
    const refStartX = width / 3;
    const predStartX = (2 * width) / 3;

    zoomContainer.append("text")
      .attr("x", width / 2)
      .attr("y", 50)
      .attr("text-anchor", "middle")
      .attr("font-size", "13px")
      .attr("fill", colors.lightText)
      .text(getRelationshipDescription());

    const pathsToShow = showFullPaths ? 
      {
        common: commonAncestors,
        ref: refFieldPath.slice(commonAncestors.length),
        pred: predFieldPath.slice(commonAncestors.length)
      } : 
      {
        common: commonAncestors.slice(-1),
        ref: refFieldPath.slice(commonAncestors.length, commonAncestors.length + 2),
        pred: predFieldPath.slice(commonAncestors.length, commonAncestors.length + 2)
      };

    pathsToShow.common.forEach((node, i) => {
      const y = rootY + (i * levelHeight);
      zoomContainer.append("rect")
        .attr("x", rootX - nodeWidth/2)
        .attr("y", y)
        .attr("width", nodeWidth)
        .attr("height", nodeHeight)
        .attr("rx", 6)
        .attr("fill", colors.common.bg)
        .attr("stroke", colors.common.border)
        .attr("stroke-width", 3)
        .attr("data-node-id", node.id);

      zoomContainer.append("text")
        .attr("x", rootX)
        .attr("y", y + nodeHeight/2 + 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", colors.common.text)
        .attr("font-weight", "600")
        .text(node.label.length > 20 ? node.label.substring(0, 18) + "..." : node.label);

      if (i < pathsToShow.common.length - 1) {
        zoomContainer.append("line")
          .attr("x1", rootX)
          .attr("y1", y + nodeHeight)
          .attr("x2", rootX)
          .attr("y2", y + levelHeight)
          .attr("stroke", colors.common.border)
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "4,2");
      }
    });

    const commonPathLength = pathsToShow.common.length;
    const commonHeight = rootY + ((commonPathLength - 1) * levelHeight) + (commonPathLength > 0 ? nodeHeight : 0);
    const hasCommonAncestors = commonPathLength > 0;

    if (hasCommonAncestors) {
      const lastCommonY = rootY + ((commonPathLength - 1) * levelHeight);

      if (pathsToShow.ref.length > 0) {
        const firstRefY = lastCommonY + levelHeight;
        const lastCommonNodeBottom = lastCommonY + nodeHeight;
        zoomContainer.append("line")
          .attr("x1", rootX)
          .attr("y1", lastCommonNodeBottom)
          .attr("x2", rootX)
          .attr("y2", lastCommonNodeBottom + 20)
          .attr("stroke", colors.reference.path)
          .attr("stroke-width", 3);
          
        zoomContainer.append("path")
          .attr("d", `M ${rootX} ${lastCommonNodeBottom + 20} C ${rootX - 100} ${lastCommonNodeBottom + 35}, ${refStartX + 100} ${firstRefY - 35}, ${refStartX} ${firstRefY}`)
          .attr("fill", "none")
          .attr("stroke", colors.reference.path)
          .attr("stroke-width", 3)
          .attr("marker-end", "url(#ref-arrow)");
      }

      if (pathsToShow.pred.length > 0) {
        const firstPredY = lastCommonY + levelHeight;
        const lastCommonNodeBottom = lastCommonY + nodeHeight;
        zoomContainer.append("line")
          .attr("x1", rootX)
          .attr("y1", lastCommonNodeBottom)
          .attr("x2", rootX)
          .attr("y2", lastCommonNodeBottom + 20)
          .attr("stroke", colors.prediction.path)
          .attr("stroke-width", 3);
          
        zoomContainer.append("path")
          .attr("d", `M ${rootX} ${lastCommonNodeBottom + 20} C ${rootX + 100} ${lastCommonNodeBottom + 35}, ${predStartX - 100} ${firstPredY - 35}, ${predStartX} ${firstPredY}`)
          .attr("fill", "none")
          .attr("stroke", colors.prediction.path)
          .attr("stroke-width", 3)
          .attr("marker-end", "url(#pred-arrow)");
      }
    }

    pathsToShow.ref.forEach((node, i) => {
      const startY = hasCommonAncestors ? commonHeight : rootY;
      const y = startY + (i * levelHeight);
      const x = refStartX;

      if (i > 0) {
        zoomContainer.append("line")
          .attr("x1", x)
          .attr("y1", y - levelHeight + nodeHeight)
          .attr("x2", x)
          .attr("y2", y)
          .attr("stroke", colors.reference.path)
          .attr("stroke-width", 3)
          .attr("stroke-dasharray", "4,2");
      }

      const isTargetField = i === pathsToShow.ref.length - 1;
      zoomContainer.append("rect")
        .attr("x", x - nodeWidth/2)
        .attr("y", y)
        .attr("width", nodeWidth)
        .attr("height", nodeHeight)
        .attr("rx", 6)
        .attr("fill", isTargetField ? colors.reference.highlight : colors.reference.bg)
        .attr("stroke", colors.reference.border)
        .attr("stroke-width", isTargetField ? 4 : 3)
        .attr("data-node-id", node.id);

      zoomContainer.append("text")
        .attr("x", x)
        .attr("y", y + nodeHeight/2 + 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", colors.reference.text)
        .attr("font-weight", isTargetField ? "800" : "600")
        .text(node.label.length > 20 ? node.label.substring(0, 18) + "..." : node.label);
    });

    pathsToShow.pred.forEach((node, i) => {
      const startY = hasCommonAncestors ? commonHeight : rootY;
      const y = startY + (i * levelHeight);
      const x = predStartX;

      if (i > 0) {
        zoomContainer.append("line")
          .attr("x1", x)
          .attr("y1", y - levelHeight + nodeHeight)
          .attr("x2", x)
          .attr("y2", y)
          .attr("stroke", colors.prediction.path)
          .attr("stroke-width", 3)
          .attr("stroke-dasharray", "4,2");
      }

      const isTargetField = i === pathsToShow.pred.length - 1;
      zoomContainer.append("rect")
        .attr("x", x - nodeWidth/2)
        .attr("y", y)
        .attr("width", nodeWidth)
        .attr("height", nodeHeight)
        .attr("rx", 6)
        .attr("fill", isTargetField ? colors.prediction.highlight : colors.prediction.bg)
        .attr("stroke", colors.prediction.border)
        .attr("stroke-width", isTargetField ? 4 : 3)
        .attr("data-node-id", node.id);

      zoomContainer.append("text")
        .attr("x", x)
        .attr("y", y + nodeHeight/2 + 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", colors.prediction.text)
        .attr("font-weight", isTargetField ? "800" : "600")
        .text(node.label.length > 20 ? node.label.substring(0, 18) + "..." : node.label);
    });

    const legendY = height - 15;

    zoomContainer.append("rect")
      .attr("x", 20)
      .attr("y", legendY - 10)
      .attr("width", 10)
      .attr("height", 10)
      .attr("rx", 2)
      .attr("fill", colors.reference.bg)
      .attr("stroke", colors.reference.border);

    zoomContainer.append("text")
      .attr("x", 35)
      .attr("y", legendY)
      .attr("text-anchor", "start")
      .attr("font-size", "11px")
      .attr("fill", colors.text)
      .text("Ground Truth: " + (groundTruth || "N/A"));

    zoomContainer.append("rect")
      .attr("x", 240)
      .attr("y", legendY - 10)
      .attr("width", 10)
      .attr("height", 10)
      .attr("rx", 2)
      .attr("fill", colors.prediction.bg)
      .attr("stroke", colors.prediction.border);

    zoomContainer.append("text")
      .attr("x", 255)
      .attr("y", legendY)
      .attr("text-anchor", "start")
      .attr("font-size", "11px")
      .attr("fill", colors.text)
      .text("Selected Field: " + (selectedPrediction || "N/A"));

    if (commonAncestors.length > 0) {
      zoomContainer.append("rect")
        .attr("x", 460)
        .attr("y", legendY - 10)
        .attr("width", 10)
        .attr("height", 10)
        .attr("rx", 2)
        .attr("fill", colors.common.bg)
        .attr("stroke", colors.common.border);

      zoomContainer.append("text")
        .attr("x", 475)
        .attr("y", legendY)
        .attr("text-anchor", "start")
        .attr("font-size", "11px")
        .attr("fill", colors.text)
        .text("Common Path");
    }
  }, [refFieldPath, predFieldPath, isExactMatch, relationshipType, commonAncestors, pathDistance, groundTruth, selectedPrediction, zoomLevel, showFullPaths, isLoading]);

  const getRelationshipDescription = () => {
    switch(relationshipType) {
      case 'exact':
        return "Exact Match: The fields are identical in the taxonomy.";
      case 'parent':
        return `Parent: The ground truth field is a parent of the selected field (${commonAncestors.length} common levels).`;
      case 'child':
        return `Child: The ground truth field is a child of the selected field (${commonAncestors.length} common levels).`;
      case 'sibling':
        return `Sibling: The fields share the same parent with ${commonAncestors.length} common ancestors.`;
      case 'distant':
        return commonAncestors.length > 0 ? 
          `Distant: Fields share ${commonAncestors.length} common ancestor${commonAncestors.length > 1 ? 's' : ''} but are distant (Path distance: ${pathDistance})` : 
          "Distant: Fields have no common ancestors in the hierarchy, suggesting they belong to entirely different research domains.";
      default:
        return "Unknown relationship";
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h5 className="font-semibold text-gray-800 text-lg">Research Field Hierarchy</h5>
          <p className="text-sm text-gray-600 mt-1">
            Visualizes the taxonomic position of both research fields in the hierarchy tree. 
            Fields with common ancestors are more semantically related.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))}
            className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <ZoomOut size={16} />
          </button>
          <button 
            onClick={() => setZoomLevel(1)}
            className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700"
            title="Reset zoom"
            aria-label="Reset zoom"
          >
            <RefreshCw size={16} />
          </button>
          <button 
            onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.1))}
            className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <ZoomIn size={16} />
          </button>
          <button 
            onClick={() => {
              setShowFullPaths(!showFullPaths);
              resetVisualization();
            }}
            className={`p-1 rounded-md text-xs flex items-center gap-1 ${
              showFullPaths ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            } transition-colors`}
          >
            {showFullPaths ? (
              <>
                <ChevronsUpDown size={12} />
                <span>Partial</span>
              </>
            ) : (
              <>
                <ChevronsDownUp size={12} />
                <span>Full</span>
              </>
            )}
          </button>
        </div>
      </div>

      <ResearchFieldPredictionsTable 
        groundTruth={groundTruth}
        predictions={predictedValues}
        selectedResearchField={selectedPrediction}
        fieldsWithDistances={fieldsWithDistances}
        onResearchFieldSelect={handlePredictionSelect}
        className="mb-4"
      />

      <div 
        ref={treeRef} 
        className="w-full overflow-x-auto min-h-[600px] border rounded-lg bg-gray-50 relative"
        style={{ minHeight: '600px' }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h6 className="text-sm font-semibold mb-2 text-gray-800">
            Understanding Path Distance
          </h6>
          <p className="text-xs text-gray-600 mb-2">
            Path distance measures how many hierarchical levels separate two research fields beyond their shared ancestry:
          </p>
          <div className="text-xs font-mono bg-white p-2 rounded border mb-2">
            pathDistance = (groundTruthSteps + selectedFieldSteps)
          </div>
          <p className="text-xs text-gray-600">
            For example, with the current fields:
          </p>
          <ul className="list-disc pl-5 text-xs text-gray-600 mt-1 mb-2">
            <li>Ground Truth: <span className="font-medium">{groundTruth}</span> (path length: {refFieldPath.length})</li>
            <li>Selected Field: <span className="font-medium">{selectedPrediction}</span> (path length: {predFieldPath.length})</li>
            <li>Common Ancestors: <span className="font-medium">{commonAncestors.length}</span> levels</li>
            <li>Additional steps in Ground Truth path: <span className="font-medium">{refFieldPath.length - commonAncestors.length}</span></li>
            <li>Additional steps in Selected Field path: <span className="font-medium">{predFieldPath.length - commonAncestors.length}</span></li>
            <li>Total Path Distance: <span className="font-medium">{pathDistance}</span></li>
          </ul>
          <p className="text-xs text-gray-600 mt-2">
            <span className="font-medium">Lower path distance</span> indicates fields that are closer in the taxonomy and typically more semantically related.
          </p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
  <h6 className="text-sm font-semibold mb-2 text-blue-800">
    Hierarchy Score Analysis
  </h6>
  <div className="flex flex-col gap-2">
    <p className="text-sm text-blue-700">
      {fixedRelevanceData ? (
        <>Hierarchy Score: <span className="font-bold">{formatPercent(fixedRelevanceData.hierarchyScore)}</span>
        <span className="text-xs ml-2">(Fixed to original prediction)</span></>
      ) : (
        <>Hierarchy Score: <span className="font-bold">{formatPercent(hierarchyScore)}</span>
        <span className="text-xs ml-2">(Current selection)</span></>
      )}
    </p>
    <div className="text-xs">
      <p className="font-medium text-gray-700">Formula:</p>
      <div className="p-1 bg-white border rounded mt-1 font-mono">
        hierarchyScore = isExactMatch ? 1.0 : commonAncestors.length === 0 ? 0.1 : (0.6 × commonAncestorRatio + 0.4 × distanceFactor)
      </div>
      <p className="mt-1 text-gray-600">
        This formula measures taxonomic relationship with two components:
      </p>
      <ul className="list-disc pl-5 text-gray-600 mt-1">
        <li>Common Ancestor Ratio: {formatPercent(commonAncestors.length / maxPathLength)}</li>
        <li>Distance Factor: {formatPercent(1 / (pathDistance + 1))}</li>
      </ul>
    </div>
    <div className="text-xs">
      <p className="font-medium text-gray-700">Calculation:</p>
      <div className="p-1 bg-white border rounded mt-1 font-mono">
        {isExactMatch ? (
          <>
            Fields are an exact match → hierarchyScore = 1.0
          </>
        ) : commonAncestors.length === 0 ? (
          <>
            No common ancestors → hierarchyScore = 0.1
          </>
        ) : (
          <>
            = (0.6 × {(commonAncestors.length / maxPathLength).toFixed(4)}) + (0.4 × {(1 / (pathDistance + 1)).toFixed(4)})<br/>
            = {(0.6 * (commonAncestors.length / maxPathLength)).toFixed(4)} + {(0.4 * (1 / (pathDistance + 1))).toFixed(4)}<br/>
            = {hierarchyScore.toFixed(4)} = {formatPercent(hierarchyScore)}
          </>
        )}
      </div>
    </div>
  </div>
</div>
      </div>

      <div className="mt-4 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <Info className="text-indigo-600" size={18} />
          </div>
          <div>
            <h6 className="text-sm font-semibold mb-2 text-indigo-800">
              Hierarchical Relationship: {relationshipType.charAt(0).toUpperCase() + relationshipType.slice(1)}
            </h6>
            <p className="text-sm text-indigo-700">
              {isExactMatch ? 
                "Perfect match: The fields are identical in the taxonomy, indicating maximum relevance." :
                commonAncestors.length > 0 ?
                  `The fields share ${commonAncestors.length} common ancestor${commonAncestors.length > 1 ? 's' : ''} (${commonAncestors.map(a => a.label).join(' > ')}), but diverge after that. This indicates partial semantic relevance.` :
                  refFieldPath.length === 0 || predFieldPath.length === 0 ?
                    "One or both paths are missing in the hierarchy data." :
                    "The fields have no common ancestors in the hierarchy, suggesting they belong to entirely different research domains."
              }
            </p>
            
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white p-3 rounded border border-red-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <h6 className="font-semibold text-red-700">Ground Truth Field</h6>
                  </div>
                  <Target className="h-5 w-5 text-red-500" />
                </div>
                <p className="font-medium text-gray-800 mb-1">{groundTruth}</p>
                <p className="text-gray-600 text-xs">
                  {refFieldPath.length > 0 ? 
                    <span>Path: <span className="font-mono text-red-700">{refFieldPath.map(node => node.label).join(' > ')}</span></span> :
                    "Path not found in hierarchy"
                  }
                </p>
              </div>
              <div className="bg-white p-3 rounded border border-green-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <h6 className="font-semibold text-green-700">Selected Field</h6>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <p className="font-medium text-gray-800 mb-1">{selectedPrediction}</p>
                <p className="text-gray-600 text-xs">
                  {predFieldPath.length > 0 ? 
                    <span>Path: <span className="font-mono text-green-700">{predFieldPath.map(node => node.label).join(' > ')}</span></span> :
                    "Path not found in hierarchy"
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchFieldTree;