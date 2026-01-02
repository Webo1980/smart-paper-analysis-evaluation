// src\components\evaluation\base\UnderstandingScoresBox.jsx
import React from 'react';

/**
 * Reusable component for displaying score explanations
 * Can be used across all evaluation modules
 */
const UnderstandingScoresBox = ({
  title = "Understanding the Scores",
  scoreDescriptions = [
    {
      label: "Accuracy Score",
      description: "Calculated by combining user evaluation, automated checks, and expertise weight"
    },
    {
      label: "Quality Score",
      description: "Based on content quality measurements and adherence to expected standards"
    }
  ],
  colorIndicators = [
    { label: "Red", color: "text-red-600", description: "for reference values" },
    { label: "Green", color: "text-green-600", description: "for extracted/generated values" }
  ],
  additionalNotes = [
    "Automated Checks: System-calculated scores that complement your expert evaluation",
    "Missing Components: The number of elements in reference data that are missing in the evaluated content"
  ],
  ratingScaleTitle = "Rating Scale",
  ratingScales = [
    {
      color: "rgb(34,197,94)",
      label: "Green (≥90%)",
      description: "Excellent quality"
    },
    {
      color: "rgb(234,179,8)",
      label: "Yellow (70-89%)",
      description: "Good quality"
    },
    {
      color: "rgb(239,68,68)",
      label: "Red (≤69%)",
      description: "Needs improvement"
    }
  ]
}) => {
  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <h5 className="font-medium mb-2">{title}</h5>
      <ul className="text-sm space-y-2">
        {scoreDescriptions.map((score, idx) => (
          <li key={idx}>
            <strong>{score.label}:</strong> {score.description}
          </li>
        ))}
        
        <li>
          <strong>Color Indicators:</strong>{" "}
          {colorIndicators.map((indicator, idx) => (
            <span key={idx}>
              <span className={`${indicator.color} font-medium`}>{indicator.label}</span> {indicator.description}
              {idx < colorIndicators.length - 1 && ", "}
            </span>
          ))}
        </li>
        
        {additionalNotes.map((note, idx) => (
          <li key={`note-${idx}`}>
            <strong>{note.split(":")[0]}:</strong> {note.split(":")[1]}
          </li>
        ))}
        
        <li>
          <strong>{ratingScaleTitle}:</strong>
          <ul className="ml-4 mt-1">
            {ratingScales.map((scale, idx) => (
              <li key={`scale-${idx}`} className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: scale.color }}></div>
                {scale.label}: {scale.description}
              </li>
            ))}
          </ul>
        </li>
      </ul>
    </div>
  );
};

export default UnderstandingScoresBox;