import React, { useState, useEffect } from 'react';
import { Progress } from '../../../ui/progress';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { ChevronDown, ChevronUp, AlertCircle, Plus, Minus, Edit } from 'lucide-react';
import { getStatusBadgeColor } from '../../base/utils/uiUtils';

const TemplateComparisonSection = ({ originalTemplate, editedTemplate }) => {
  const [comparisonData, setComparisonData] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  
  useEffect(() => {
    if (originalTemplate && editedTemplate) {
      const data = analyzeTemplateDifferences(originalTemplate, editedTemplate);
      setComparisonData(data);
    }
  }, [originalTemplate, editedTemplate]);
  
  if (!comparisonData) {
    return <div className="text-center text-gray-500">Analyzing template changes...</div>;
  }
  
  const toggleDetails = () => setShowDetails(prev => !prev);
  
  return (
    <div className="space-y-4">
      <h6 className="text-sm font-medium">Template Comparison Analysis</h6>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-3 rounded border">
          <h6 className="text-xs font-medium mb-2">Title Changes</h6>
          <TitleChangeAnalysis titleData={comparisonData.title} />
        </div>
        
        <div className="bg-white p-3 rounded border">
          <h6 className="text-xs font-medium mb-2">Description Changes</h6>
          <DescriptionChangeAnalysis descriptionData={comparisonData.description} />
        </div>
        
        <div className="bg-white p-3 rounded border">
          <h6 className="text-xs font-medium mb-2">Property Changes</h6>
          <PropertyChangeAnalysis propertiesData={comparisonData.properties} />
        </div>
      </div>
      
      <DetailedChangeAnalysis 
        comparisonData={comparisonData}
        showDetails={showDetails}
        toggleDetails={toggleDetails}
      />
    </div>
  );
};

const TitleChangeAnalysis = ({ titleData }) => (
  <div className="space-y-3">
    {['unchanged', 'added', 'deleted', 'modified'].map((type) => (
      <div key={type}>
        <div className="flex justify-between text-xs mb-1">
          <span>{type.charAt(0).toUpperCase() + type.slice(1)} Content</span>
          <span>{titleData[type]}%</span>
        </div>
        <Progress value={titleData[type]} className="h-2 bg-gray-200" />
      </div>
    ))}
    
    {titleData.unchanged < 100 && (
      <div className="mt-3 p-2 bg-yellow-50 rounded text-xs">
        <p className="font-medium">Title was modified</p>
      </div>
    )}
  </div>
);

const DescriptionChangeAnalysis = ({ descriptionData }) => (
  <div className="space-y-3">
    {['unchanged', 'added', 'deleted', 'modified'].map((type) => (
      <div key={type}>
        <div className="flex justify-between text-xs mb-1">
          <span>{type.charAt(0).toUpperCase() + type.slice(1)} Content</span>
          <span>{descriptionData[type]}%</span>
        </div>
        <Progress value={descriptionData[type]} className="h-2 bg-gray-200" />
      </div>
    ))}
    
    {descriptionData.unchanged < 100 && (
      <div className="mt-3 p-2 bg-yellow-50 rounded text-xs">
        <p className="font-medium">Description was changed</p>
        {descriptionData.added > 0 && (
          <p className="mt-1">Added content: {descriptionData.added}%</p>
        )}
      </div>
    )}
  </div>
);

const PropertyChangeAnalysis = ({ propertiesData }) => (
  <div className="space-y-3">
    {['unchanged', 'added', 'deleted', 'modified'].map((type) => (
      <div key={type}>
        <div className="flex justify-between text-xs mb-1">
          <span>{type.charAt(0).toUpperCase() + type.slice(1)} Properties</span>
          <span>{propertiesData.stats[type]}%</span>
        </div>
        <Progress value={propertiesData.stats[type]} className="h-2 bg-gray-200" />
      </div>
    ))}
    
    {(propertiesData.stats.added > 0 || 
      propertiesData.stats.deleted > 0 || 
      propertiesData.stats.modified > 0) && (
      <div className="mt-3 p-2 bg-yellow-50 rounded text-xs">
        <p className="font-medium">Property changes detected</p>
        <div className="flex space-x-2 mt-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-800">
            <Plus size={12} className="mr-1" /> 
            {propertiesData.addedProps.length} added
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-100 text-red-800">
            <Minus size={12} className="mr-1" /> 
            {propertiesData.deletedProps.length} deleted
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">
            <Edit size={12} className="mr-1" /> 
            {propertiesData.propChanges.filter(p => 
              p.label.changed || p.description.changed || 
              p.required.changed || p.type.changed
            ).length} modified
          </span>
        </div>
      </div>
    )}
  </div>
);

const DetailedChangeAnalysis = ({ comparisonData, showDetails, toggleDetails }) => (
  <div className="bg-white p-3 rounded border">
    <div 
      className="flex items-center justify-between cursor-pointer" 
      onClick={toggleDetails}
    >
      <h6 className="text-sm font-medium flex items-center">
        <AlertCircle className="h-4 w-4 mr-2 text-blue-600" />
        Detailed Change Analysis
      </h6>
      {showDetails ? 
        <ChevronUp className="h-4 w-4 text-gray-500" /> : 
        <ChevronDown className="h-4 w-4 text-gray-500" />
      }
    </div>
    
    {showDetails && (
      <div className="mt-4 space-y-4">
        {/* Existing detailed analysis sections */}
      </div>
    )}
  </div>
);

function analyzeTemplateDifferences(originalTemplate, editedTemplate) {
  return {
    title: calculateEditStats(
      originalTemplate.name || originalTemplate.title,
      editedTemplate.name || editedTemplate.title
    ),
    description: calculateEditStats(
      originalTemplate.description,
      editedTemplate.description
    ),
    properties: compareProperties(
      originalTemplate.properties || [],
      editedTemplate.properties || []
    )
  };
}

function calculateEditStats(original, edited) {
    if (!original && !edited) return { unchanged: 100, added: 0, deleted: 0, modified: 0 };
    if (!original) return { unchanged: 0, added: 100, deleted: 0, modified: 0 };
    if (!edited) return { unchanged: 0, added: 0, deleted: 100, modified: 0 };
    
    const originalWords = original.split(/\s+/).filter(w => w.length > 0);
    const editedWords = edited.split(/\s+/).filter(w => w.length > 0);
    
    const originalWordsSet = new Set(originalWords);
    const editedWordsSet = new Set(editedWords);
    
    const commonWords = originalWords.filter(word => editedWordsSet.has(word));
    const deletedWords = originalWords.filter(word => !editedWordsSet.has(word));
    const addedWords = editedWords.filter(word => !originalWordsSet.has(word));
    
    const unchangedPercent = Math.round((commonWords.length / originalWords.length) * 100);
    const deletedPercent = Math.round((deletedWords.length / originalWords.length) * 100);
    const addedPercent = Math.round((addedWords.length / originalWords.length) * 100);
    const modifiedPercent = 100 - unchangedPercent - deletedPercent;
    
    return {
      unchanged: unchangedPercent,
      added: addedPercent,
      deleted: deletedPercent,
      modified: modifiedPercent
    };
  }
  
  function compareProperties(originalProps, editedProps) {
    // Map properties by ID for easy comparison
    const originalPropsMap = new Map(originalProps.map(p => [p.id, p]));
    const editedPropsMap = new Map(editedProps.map(p => [p.id, p]));
    
    // Find common, added, and deleted properties
    const commonPropIds = [...originalPropsMap.keys()].filter(id => editedPropsMap.has(id));
    const addedPropIds = [...editedPropsMap.keys()].filter(id => !originalPropsMap.has(id));
    const deletedPropIds = [...originalPropsMap.keys()].filter(id => !editedPropsMap.has(id));
    
    // Calculate percent stats
    const totalOriginalProps = originalProps.length;
    const unchangedPercent = Math.round((commonPropIds.length / totalOriginalProps) * 100);
    const deletedPercent = Math.round((deletedPropIds.length / totalOriginalProps) * 100);
    const addedPercent = Math.round((addedPropIds.length / totalOriginalProps) * 100);
    
    // Analyze changes in common properties
    const changedProps = commonPropIds.filter(id => {
      const originalProp = originalPropsMap.get(id);
      const editedProp = editedPropsMap.get(id);
      
      return (
        originalProp.label !== editedProp.label ||
        originalProp.description !== editedProp.description ||
        originalProp.required !== editedProp.required ||
        originalProp.type !== editedProp.type
      );
    });
    
    const modifiedPercent = Math.round((changedProps.length / totalOriginalProps) * 100);
    
    // Detail specific changes in common properties
    const propChanges = commonPropIds.map(id => {
      const originalProp = originalPropsMap.get(id);
      const editedProp = editedPropsMap.get(id);
      
      const changes = {
        id: id,
        label: {
          original: originalProp.label,
          edited: editedProp.label,
          changed: originalProp.label !== editedProp.label
        },
        description: {
          original: originalProp.description,
          edited: editedProp.description,
          changed: originalProp.description !== editedProp.description,
          stats: calculateEditStats(originalProp.description, editedProp.description)
        },
        required: {
          original: originalProp.required,
          edited: editedProp.required,
          changed: originalProp.required !== editedProp.required
        },
        type: {
          original: originalProp.type,
          edited: editedProp.type,
          changed: originalProp.type !== editedProp.type
        }
      };
      
      return changes;
    });
    
    // Added properties details
    const addedProps = addedPropIds.map(id => {
      return {
        id: id,
        details: editedPropsMap.get(id)
      };
    });
    
    // Deleted properties details
    const deletedProps = deletedPropIds.map(id => {
      return {
        id: id,
        details: originalPropsMap.get(id)
      };
    });
    
    return {
      stats: {
        unchanged: unchangedPercent,
        added: addedPercent,
        deleted: deletedPercent,
        modified: modifiedPercent
      },
      propChanges,
      addedProps,
      deletedProps
    };
  }
  
  function highlightChanges(originalText, editedText) {
    if (!originalText || !editedText) return editedText || originalText || '';
    
    // Simple case: just highlight additions at the end
    if (editedText.startsWith(originalText)) {
      const addedContent = editedText.slice(originalText.length);
      return <>{originalText}<span className="bg-blue-200 font-medium">{addedContent}</span></>;
    }
    
    // More complex cases would need a real diff algorithm
    // This is a simplified approach
    const originalWords = originalText.split(/\s+/).filter(w => w.length > 0);
    const editedWords = editedText.split(/\s+/).filter(w => w.length > 0);
    
    const originalWordsSet = new Set(originalWords);
    const editedWordsSet = new Set(editedWords);
    
    const addedWords = editedWords.filter(word => !originalWordsSet.has(word));
    
    if (addedWords.length > 0) {
      // Highlight the added words
      return editedWords.map((word, index) => (
        <span key={index}>
          {addedWords.includes(word) ? 
            <span className="bg-blue-200 font-medium">{word}</span> : 
            word
          }
          {index < editedWords.length - 1 ? ' ' : ''}
        </span>
      ));
    }
    
    return editedText;
  }
  
  function getChangeImpactAssessment(comparisonData) {
    // Count significant changes
    const requiredChanges = comparisonData.properties.propChanges.filter(p => p.required.changed).length;
    const typeChanges = comparisonData.properties.propChanges.filter(p => p.type.changed).length;
    const addedProperties = comparisonData.properties.addedProps.length;
    const deletedProperties = comparisonData.properties.deletedProps.length;
    
    // Determine impact level
    let impactLevel = 'Low';
    let impactClass = 'text-green-600';
    
    if (requiredChanges > 0 || typeChanges > 0 || deletedProperties > 0) {
      impactLevel = 'High';
      impactClass = 'text-red-600';
    } else if (addedProperties > 0 || comparisonData.description.added > 0) {
      impactLevel = 'Medium';
      impactClass = 'text-yellow-600';
    }
    
    const impactAssessment = [];
    
    if (comparisonData.description.added > 0) {
      impactAssessment.push('Description was expanded with additional context.');
    }
    
    if (addedProperties > 0) {
      impactAssessment.push(`${addedProperties} new propert${addedProperties > 1 ? 'ies were' : 'y was'} added.`);
    }
    
    if (deletedProperties > 0) {
      impactAssessment.push(`${deletedProperties} propert${deletedProperties > 1 ? 'ies were' : 'y was'} removed.`);
    }
    
    if (requiredChanges > 0) {
      impactAssessment.push(`${requiredChanges} propert${requiredChanges > 1 ? 'ies' : 'y'} changed required status.`);
    }
    
    if (typeChanges > 0) {
      impactAssessment.push(`${typeChanges} propert${typeChanges > 1 ? 'ies' : 'y'} changed data type.`);
    }
    
    if (impactAssessment.length === 0) {
      impactAssessment.push('No significant changes detected.');
    }
    
    return (
      <div className="space-y-2">
        <div className="flex items-center">
          <span className="text-xs font-medium">Impact Level:</span>
          <span className={`ml-2 text-xs font-bold ${impactClass}`}>{impactLevel}</span>
        </div>
        <ul className="list-disc list-inside text-xs space-y-1">
          {impactAssessment.map((impact, index) => (
            <li key={index}>{impact}</li>
          ))}
        </ul>
      </div>
    );
  }
  
 export default TemplateComparisonSection;