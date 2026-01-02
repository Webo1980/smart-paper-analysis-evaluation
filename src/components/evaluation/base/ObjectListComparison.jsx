// src/components/evaluation/base/ObjectListComparison.jsx
import React, { useState, useMemo } from 'react';
import { 
  ListChecks, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  CheckCircle, 
  AlertCircle, 
  PlusCircle, 
  MinusCircle,
  Edit3
} from 'lucide-react';
import { Progress } from '../../ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { formatPercentage } from './utils/baseMetricsUtils';

/**
 * Component for comparing two lists of objects (like properties)
 * Designed to be generic but optimized for property comparison
 */
const ObjectListComparison = ({
  originalItems = [],
  editedItems = [],
  itemType = 'Property', // What kind of items are we comparing (e.g., 'Property', 'Field', 'Parameter')
  primaryKey = 'id', // The unique identifier for items (to match them)
  nameKey = 'label', // The key to use for displaying item names
  fieldsToCompare = ['label', 'type', 'description'], // Fields to specifically check for differences
  fieldLabels = { // Human-readable labels for the fields
    label: 'Label',
    type: 'Type',
    description: 'Description'
  },
  showDetailedDiff = true, // Whether to show detailed diffs
  maxItemsToShowInitially = 5, // Max number of items to show initially
  onItemSelected = null, // Optional callback when an item is selected
  showScoreExplanation = false, // Whether to show score explanation
  scoreData = null // Score data for explanation
}) => {
  const [showAllItems, setShowAllItems] = useState(false);
  const [showMetricDetails, setShowMetricDetails] = useState(false);
  const [showDiffChart, setShowDiffChart] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all'); // 'all', 'added', 'removed', 'modified'
  const [expandedItems, setExpandedItems] = useState({});
  const [showScoreDetails, setShowScoreDetails] = useState(false);

  // Calculate differences between the two lists
  const {
    added,
    removed,
    modified,
    unchanged,
    fieldChangeCounts,
    diffStats,
    allItems,
    fieldsFrequency
  } = useMemo(() => {
    const added = [];
    const removed = [];
    const modified = [];
    const unchanged = [];
    const fieldChangeCounts = {};
    
    // Initialize field change counts
    fieldsToCompare.forEach(field => {
      fieldChangeCounts[field] = 0;
    });

    // Create maps for faster lookup
    const originalMap = new Map(originalItems.map(item => [item[primaryKey], item]));
    const editedMap = new Map(editedItems.map(item => [item[primaryKey], item]));
    
    // Find items that were removed or modified
    originalItems.forEach(originalItem => {
      const id = originalItem[primaryKey];
      const editedItem = editedMap.get(id);
      
      if (!editedItem) {
        // Item was removed
        removed.push({
          item: originalItem,
          status: 'removed'
        });
      } else {
        // Item exists in both - check if modified
        let isModified = false;
        const modifications = {};
        
        fieldsToCompare.forEach(field => {
          const originalValue = originalItem[field];
          const editedValue = editedItem[field];
          
          // Compare values (handle null/undefined safely)
          const valuesDiffer = originalValue !== editedValue && 
            (originalValue !== null && originalValue !== undefined || 
             editedValue !== null && editedValue !== undefined);
          
          if (valuesDiffer) {
            isModified = true;
            modifications[field] = {
              from: originalValue,
              to: editedValue
            };
            fieldChangeCounts[field]++;
          }
        });
        
        if (isModified) {
          modified.push({
            original: originalItem,
            edited: editedItem,
            modifications,
            status: 'modified'
          });
        } else {
          unchanged.push({
            item: originalItem,
            status: 'unchanged'
          });
        }
      }
    });
    
    // Find items that were added
    editedItems.forEach(editedItem => {
      const id = editedItem[primaryKey];
      if (!originalMap.has(id)) {
        added.push({
          item: editedItem,
          status: 'added'
        });
      }
    });
    
    // Calculate overall stats
    const diffStats = {
      originalCount: originalItems.length,
      editedCount: editedItems.length,
      added: added.length,
      removed: removed.length,
      modified: modified.length,
      unchanged: unchanged.length,
      percentAdded: originalItems.length ? (added.length / originalItems.length * 100).toFixed(1) : 0,
      percentRemoved: originalItems.length ? (removed.length / originalItems.length * 100).toFixed(1) : 0,
      percentModified: originalItems.length ? (modified.length / originalItems.length * 100).toFixed(1) : 0,
      percentUnchanged: originalItems.length ? (unchanged.length / originalItems.length * 100).toFixed(1) : 0,
      totalChanges: added.length + removed.length + modified.length,
      changeRate: originalItems.length ? 
        ((added.length + removed.length + modified.length) / originalItems.length).toFixed(2) : 0
    };

    // Calculate field frequency
    const fieldsFrequency = {};
    fieldsToCompare.forEach(field => {
      fieldsFrequency[field] = {
        original: originalItems.filter(item => item[field] !== undefined && item[field] !== null).length,
        edited: editedItems.filter(item => item[field] !== undefined && item[field] !== null).length,
      };
    });
    
    // Combine all items for display
    const allItems = [
      ...added.map(item => ({ ...item, displayType: 'added' })),
      ...removed.map(item => ({ ...item, displayType: 'removed' })),
      ...modified.map(item => ({ ...item, displayType: 'modified' })),
      ...unchanged.map(item => ({ ...item, displayType: 'unchanged' }))
    ];
    
    return {
      added,
      removed,
      modified,
      unchanged,
      fieldChangeCounts,
      diffStats,
      allItems,
      fieldsFrequency
    };
  }, [originalItems, editedItems, primaryKey, fieldsToCompare]);

  // Calculate change score based on the diffStats
  const calculateChangeScore = () => {
    const { percentAdded, percentRemoved, percentModified } = diffStats;
    const totalChangePercentage = parseFloat(percentAdded) + parseFloat(percentRemoved) + parseFloat(percentModified);
    
    // Normalize the score to be between 0 and 1
    // Higher changes mean lower score (more changes = more potential issues)
    const normalizedScore = 1 - Math.min(1, totalChangePercentage / 100);
    
    return {
      score: normalizedScore,
      percentAdded: parseFloat(percentAdded),
      percentRemoved: parseFloat(percentRemoved),
      percentModified: parseFloat(percentModified),
      totalChangePercentage
    };
  };

  // Get the change score data (memoized)
  const changeScoreData = useMemo(() => calculateChangeScore(), [diffStats]);

  // Toggle item expansion
  const toggleItemExpansion = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // Filtered items based on selected tab
  const filteredItems = useMemo(() => {
    switch (selectedTab) {
      case 'added': return allItems.filter(item => item.displayType === 'added');
      case 'removed': return allItems.filter(item => item.displayType === 'removed');
      case 'modified': return allItems.filter(item => item.displayType === 'modified');
      case 'unchanged': return allItems.filter(item => item.displayType === 'unchanged');
      default: return allItems;
    }
  }, [allItems, selectedTab]);
  
  // Items to display based on showAllItems setting
  const displayedItems = showAllItems ? 
    filteredItems : 
    filteredItems.slice(0, maxItemsToShowInitially);

  // Chart data for pie chart
  const pieChartData = [
    { name: 'Added', value: diffStats.added, color: '#10B981' }, // green
    { name: 'Removed', value: diffStats.removed, color: '#EF4444' }, // red
    { name: 'Modified', value: diffStats.modified, color: '#F59E0B' }, // amber
    { name: 'Unchanged', value: diffStats.unchanged, color: '#6B7280' }, // gray
  ].filter(item => item.value > 0);

  // Chart data for field changes
  const fieldChangeData = Object.entries(fieldChangeCounts)
    .map(([field, count]) => ({
      name: fieldLabels[field] || field,
      changes: count,
      color: '#3B82F6' // blue
    }))
    .sort((a, b) => b.changes - a.changes);

  // Field presence data
  const fieldPresenceData = Object.entries(fieldsFrequency).map(([field, data]) => ({
    name: fieldLabels[field] || field,
    original: data.original,
    edited: data.edited,
    originalColor: '#93C5FD', // light blue
    editedColor: '#3B82F6' // blue
  }));

  // Status colors for different types of changes
  const statusColors = {
    added: 'text-green-600 bg-green-50 border-green-200',
    removed: 'text-red-600 bg-red-50 border-red-200',
    modified: 'text-amber-600 bg-amber-50 border-amber-200',
    unchanged: 'text-gray-600 bg-gray-50 border-gray-200'
  };

  // Status icons for different types of changes
  const StatusIcon = ({ type }) => {
    switch (type) {
      case 'added': return <PlusCircle className="h-4 w-4 text-green-500" />;
      case 'removed': return <MinusCircle className="h-4 w-4 text-red-500" />;
      case 'modified': return <Edit3 className="h-4 w-4 text-amber-500" />;
      default: return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Format a value for display
  const formatValue = (value) => {
    if (value === null || value === undefined) return <span className="text-gray-400 italic">Not specified</span>;
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Render a field comparison for modified items
  const renderFieldComparison = (field, original, edited) => {
    const originalValue = original[field];
    const editedValue = edited[field];
    const isDifferent = originalValue !== editedValue;
    
    return (
      <div key={field} className="grid grid-cols-2 gap-2 mb-2">
        <div className="text-xs font-medium">{fieldLabels[field] || field}:</div>
        <div className="text-xs">
          {isDifferent ? (
            <div className="flex flex-col gap-1">
              <div className="line-through text-red-600">{formatValue(originalValue)}</div>
              <div className="text-green-600">{formatValue(editedValue)}</div>
            </div>
          ) : (
            formatValue(originalValue)
          )}
        </div>
      </div>
    );
  };

  // Render a single item
  const renderItem = (itemData) => {
    const { displayType } = itemData;
    const isExpanded = expandedItems[displayType === 'modified' ? 
      itemData.original[primaryKey] : itemData.item[primaryKey]];
    
    // Determine item properties based on display type
    let displayName = '';
    let itemDetails = null;
    
    if (displayType === 'modified') {
      const { original, edited, modifications } = itemData;
      displayName = original[nameKey] || edited[nameKey] || '(No name)';
      
      itemDetails = (
        <div className="pl-8 pt-2 space-y-2">
          {fieldsToCompare.map(field => renderFieldComparison(field, original, edited))}
        </div>
      );
    } else {
      const { item } = itemData;
      displayName = item[nameKey] || '(No name)';
      
      itemDetails = (
        <div className="pl-8 pt-2 space-y-2">
          {fieldsToCompare.map(field => (
            <div key={field} className="grid grid-cols-2 gap-2 mb-2">
              <div className="text-xs font-medium">{fieldLabels[field] || field}:</div>
              <div className="text-xs">{formatValue(item[field])}</div>
            </div>
          ))}
        </div>
      );
    }
    
    const itemId = displayType === 'modified' ? 
      itemData.original[primaryKey] : itemData.item[primaryKey];
    
    return (
      <div key={itemId} className={`border rounded-md mb-2 ${statusColors[displayType]}`}>
        <div 
          className="px-3 py-2 flex justify-between items-center cursor-pointer"
          onClick={() => toggleItemExpansion(itemId)}
        >
          <div className="flex items-center">
            <StatusIcon type={displayType} />
            <span className="ml-2 text-sm truncate">{displayName}</span>
          </div>
          <div className="flex items-center">
            <span className="text-xs mr-2 capitalize">{displayType}</span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
        {isExpanded && (
          <div className="px-3 py-2 border-t border-gray-200">
            {itemDetails}
          </div>
        )}
      </div>
    );
  };

  // Render score explanation section if enabled
  const renderScoreExplanation = () => {
    if (!showScoreExplanation || !scoreData) return null;

    const { score } = changeScoreData;

    return (
      <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowScoreDetails(!showScoreDetails)}
        >
          <h4 className="text-base font-medium text-blue-800 flex items-center">
            <Info className="h-4 w-4 mr-2" />
            {itemType} Change Score Explanation
          </h4>
          {showScoreDetails ? 
            <ChevronUp className="h-4 w-4 text-blue-500" /> : 
            <ChevronDown className="h-4 w-4 text-blue-500" />
          }
        </div>
        
        {!showScoreDetails && (
          <p className="text-sm text-blue-700 mt-2">
            The {itemType.toLowerCase()} change score of <span className="font-semibold">{formatPercentage(score)}</span> measures 
            the stability of the {itemType.toLowerCase()}(s) between versions. Click to see detailed explanation.
          </p>
        )}
        
        {showScoreDetails && (
          <div className="space-y-4 text-sm mt-4">
            <p className="text-blue-700">
              The {itemType.toLowerCase()} change score of <span className="font-semibold">{formatPercentage(score)}</span> measures 
              how much the {itemType.toLowerCase()}(s) have changed between the original and edited versions. 
              Higher scores indicate more stability (fewer changes).
            </p>
            
            <div className="bg-white p-3 rounded border">
              <h5 className="font-medium mb-2">Change Breakdown</h5>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Added {itemType}(s)</span>
                    <span>{changeScoreData.percentAdded}%</span>
                  </div>
                  <Progress value={changeScoreData.percentAdded} className="h-2 bg-gray-200" color="bg-green-500" />
                </div>
                
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Removed {itemType}s</span>
                    <span>{changeScoreData.percentRemoved}%</span>
                  </div>
                  <Progress value={changeScoreData.percentRemoved} className="h-2 bg-gray-200" color="bg-red-500" />
                </div>
                
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Modified {itemType}(s)</span>
                    <span>{changeScoreData.percentModified}%</span>
                  </div>
                  <Progress value={changeScoreData.percentModified} className="h-2 bg-gray-200" color="bg-amber-500" />
                </div>
                
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Total Change Percentage</span>
                    <span>{changeScoreData.totalChangePercentage}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-3 rounded border">
              <h5 className="font-medium mb-2">Calculation Formula</h5>
              <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                ChangeScore = 1 - min(1, (Added% + Removed% + Modified%) / 100)
                <br /><br />
                = 1 - min(1, ({changeScoreData.percentAdded} + {changeScoreData.percentRemoved} + {changeScoreData.percentModified}) / 100)
                <br /><br />
                = 1 - min(1, {changeScoreData.totalChangePercentage} / 100)
                <br /><br />
                = 1 - {Math.min(1, changeScoreData.totalChangePercentage / 100).toFixed(2)}
                <br /><br />
                = {formatPercentage(score)}
              </div>
            </div>
            
            <div className="bg-white p-3 rounded border">
              <h5 className="font-medium mb-2">Interpretation</h5>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>
                  <span className="font-medium">90-100%:</span> Minimal changes, high stability
                </li>
                <li>
                  <span className="font-medium">75-89%:</span> Moderate changes, good stability
                </li>
                <li>
                  <span className="font-medium">50-74%:</span> Significant changes, moderate stability
                </li>
                <li>
                  <span className="font-medium">Below 50%:</span> Major changes, low stability
                </li>
              </ul>
              
              <div className="mt-3 p-2 border rounded bg-yellow-50 text-xs">
                <p className="font-medium">Current Rating: {
                  score >= 0.9 ? 'Excellent Stability' :
                  score >= 0.75 ? 'Good Stability' :
                  score >= 0.5 ? 'Moderate Stability' :
                  'Low Stability'
                }</p>
                <p className="mt-1">{
                  score >= 0.9 ? 
                    `The ${itemType.toLowerCase()}(s) have remained very stable with minimal changes.` :
                  score >= 0.75 ? 
                    `The ${itemType.toLowerCase()}(s) have undergone some changes but remain mostly stable.` :
                  score >= 0.5 ? 
                    `The ${itemType.toLowerCase()}(s) have seen significant changes that may require review.` :
                    `The ${itemType.toLowerCase()}(s) have undergone major changes that should be carefully reviewed.`
                }</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="p-4">
        {/* Heading section */}
        <div className="mb-4 border-b pb-3">
          <h3 className="text-sm font-medium text-gray-800">{itemType} List Comparison</h3>
          <p className="text-xs text-gray-500 mt-1">
            Compare the original and edited {itemType.toLowerCase()} lists
          </p>
        </div>

        {/* Summary metrics */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Summary</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded border">
                <div className="text-xs text-gray-500">Original Count</div>
                <div className="text-lg font-semibold">{diffStats.originalCount}</div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded border">
                <div className="text-xs text-gray-500">Edited Count</div>
                <div className="text-lg font-semibold">{diffStats.editedCount}</div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded border">
                <div className="text-xs text-gray-500">Changes</div>
                <div className="text-lg font-semibold">{diffStats.totalChanges}</div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded border">
                <div className="text-xs text-gray-500">Change Rate</div>
                <div className="text-lg font-semibold">{diffStats.changeRate}x</div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Added {itemType}s ({diffStats.added})</span>
                  <span>{diffStats.percentAdded}%</span>
                </div>
                <Progress value={parseFloat(diffStats.percentAdded)} className="h-2 bg-gray-200" color="bg-green-500" />
              </div>
              
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Removed {itemType}s ({diffStats.removed})</span>
                  <span>{diffStats.percentRemoved}%</span>
                </div>
                <Progress value={parseFloat(diffStats.percentRemoved)} className="h-2 bg-gray-200" color="bg-red-500" />
              </div>
              
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Modified {itemType}s ({diffStats.modified})</span>
                  <span>{diffStats.percentModified}%</span>
                </div>
                <Progress value={parseFloat(diffStats.percentModified)} className="h-2 bg-gray-200" color="bg-amber-500" />
              </div>
              
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Unchanged {itemType}s ({diffStats.unchanged})</span>
                  <span>{diffStats.percentUnchanged}%</span>
                </div>
                <Progress value={parseFloat(diffStats.percentUnchanged)} className="h-2 bg-gray-200" color="bg-gray-500" />
              </div>
            </div>
          </div>
          
          {/* Visualization */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <h4 className="text-sm font-medium">Visualization</h4>
              <button 
                onClick={() => setShowDiffChart(!showDiffChart)}
                className="text-xs text-blue-600 hover:underline flex items-center"
              >
                {showDiffChart ? 'Show Field Stats' : 'Show Changes'}
              </button>
            </div>
            
            {showDiffChart ? (
              pieChartData.length > 0 ? (
                <div className="h-64 bg-gray-50 p-3 rounded border">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} ${itemType}${value !== 1 ? 's' : ''}`]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 bg-gray-50 p-3 rounded border flex items-center justify-center">
                  <p className="text-gray-500 text-sm">No changes to display</p>
                </div>
              )
            ) : (
              <div className="h-64 bg-gray-50 p-3 rounded border">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={fieldPresenceData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip formatter={(value, name) => [`${value} ${itemType}${value !== 1 ? 's' : ''}`, name === 'original' ? 'Original' : 'Edited']} />
                    <Legend />
                    <Bar dataKey="original" name="Original" fill="#93C5FD" />
                    <Bar dataKey="edited" name="Edited" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            
            {fieldChangeData.length > 0 && (
              <div className="h-64 bg-gray-50 p-3 rounded border">
                <h5 className="text-xs font-medium mb-2">Field Modification Frequency</h5>
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart
                    data={fieldChangeData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip formatter={(value) => [`${value} change${value !== 1 ? 's' : ''}`]} />
                    <Bar dataKey="changes" name="Changes" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
        
        {/* Score explanation section */}
        {renderScoreExplanation()}
        
        {/* Item list with filtering tabs */}
        <div className="mt-6 rounded-lg border overflow-hidden">
          <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
            <div className="flex items-center">
              <ListChecks className="h-4 w-4 text-gray-600 mr-2" />
              <span className="font-medium">{itemType} List</span>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setShowMetricDetails(!showMetricDetails)}
                className="text-blue-600 flex items-center text-xs bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
              >
                {showMetricDetails ? 'Hide details' : 'Show details'}
                {showMetricDetails ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
              </button>
            </div>
          </div>
          
          {/* Filter tabs */}
          <div className="flex border-b bg-gray-50">
            <button 
              className={`py-2 px-4 text-xs font-medium ${selectedTab === 'all' ? 'bg-white border-b-2 border-blue-500' : 'text-gray-500 hover:bg-gray-100'}`}
              onClick={() => setSelectedTab('all')}
            >
              All ({allItems.length})
            </button>
            <button 
              className={`py-2 px-4 text-xs font-medium ${selectedTab === 'added' ? 'bg-white border-b-2 border-green-500' : 'text-gray-500 hover:bg-gray-100'}`}
              onClick={() => setSelectedTab('added')}
            >
              Added ({diffStats.added})
            </button>
            <button 
              className={`py-2 px-4 text-xs font-medium ${selectedTab === 'removed' ? 'bg-white border-b-2 border-red-500' : 'text-gray-500 hover:bg-gray-100'}`}
              onClick={() => setSelectedTab('removed')}
            >
              Removed ({diffStats.removed})
            </button>
            <button 
              className={`py-2 px-4 text-xs font-medium ${selectedTab === 'modified' ? 'bg-white border-b-2 border-amber-500' : 'text-gray-500 hover:bg-gray-100'}`}
              onClick={() => setSelectedTab('modified')}
            >
              Modified ({diffStats.modified})
            </button>
            <button 
              className={`py-2 px-4 text-xs font-medium ${selectedTab === 'unchanged' ? 'bg-white border-b-2 border-gray-500' : 'text-gray-500 hover:bg-gray-100'}`}
              onClick={() => setSelectedTab('unchanged')}
            >
              Unchanged ({diffStats.unchanged})
            </button>
          </div>
          
          {/* Items list */}
          <div className="p-3">
            {filteredItems.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-gray-500 text-sm">No {selectedTab !== 'all' ? selectedTab : ''} {itemType.toLowerCase()}s to display</p>
              </div>
            ) : (
              <div>
                {displayedItems.map(renderItem)}
                
                {/* Show more/less button */}
                {filteredItems.length > maxItemsToShowInitially && (
                  <div className="flex justify-center mt-4">
                    <button 
                      onClick={() => setShowAllItems(!showAllItems)}
                      className="text-blue-600 flex items-center text-xs bg-blue-50 px-3 py-1 rounded hover:bg-blue-100 transition-colors"
                    >
                      {showAllItems ? 'Show less' : `Show all ${filteredItems.length} ${itemType.toLowerCase()}s`}
                      {showAllItems ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Detailed metrics explanation */}
          {showMetricDetails && (
            <div className="p-3 border-t bg-gray-50">
              <h4 className="font-medium text-xs mb-3 flex items-center">
                <Info className="h-3 w-3 mr-1" />
                Insights and Analysis
              </h4>
              
              <div className="space-y-3">
                <div className="bg-white p-3 rounded border">
                  <h5 className="font-medium text-sm">Overview Analysis</h5>
                  <p className="text-xs text-gray-600 mt-1">
                    This comparison analyzed <strong>{diffStats.originalCount}</strong> original {itemType.toLowerCase()}s and <strong>{diffStats.editedCount}</strong> edited {itemType.toLowerCase()}s.
                    {diffStats.editedCount > diffStats.originalCount ? 
                      ` ${diffStats.editedCount - diffStats.originalCount} new ${itemType.toLowerCase()}${diffStats.editedCount - diffStats.originalCount !== 1 ? 's were' : ' was'} added.` :
                      diffStats.originalCount > diffStats.editedCount ?
                      ` ${diffStats.originalCount - diffStats.editedCount} ${itemType.toLowerCase()}${diffStats.originalCount - diffStats.editedCount !== 1 ? 's were' : ' was'} removed.` :
                      ` The total count remained the same.`
                    }
                  </p>
                  
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs">
                      <span className="font-medium">Change Rate:</span> {diffStats.changeRate}x 
                      ({
                        diffStats.changeRate < 0.1 ? 'Minimal changes' :
                        diffStats.changeRate < 0.3 ? 'Minor changes' :
                        diffStats.changeRate < 0.6 ? 'Moderate changes' :
                        diffStats.changeRate < 0.9 ? 'Significant changes' : 'Major overhaul'
                      })
                    </p>
                    
                    <p className="text-xs mt-1">
                      <span className="font-medium">Field Modifications:</span> {
                        Object.entries(fieldChangeCounts)
                          .filter(([_, count]) => count > 0)
                          .map(([field, count]) => `${fieldLabels[field] || field} (${count})`)
                          .join(', ') || 'None'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded border">
                  <h5 className="font-medium text-sm">Detailed Changes</h5>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>
                      <span className="inline-block w-4 h-4 rounded-full bg-green-500 mr-1"></span> 
                      <strong>{diffStats.added}</strong> {itemType.toLowerCase()}s were added 
                      ({diffStats.percentAdded}% of original)
                    </li>
                    <li>
                      <span className="inline-block w-4 h-4 rounded-full bg-red-500 mr-1"></span> 
                      <strong>{diffStats.removed}</strong> {itemType.toLowerCase()}s were removed 
                      ({diffStats.percentRemoved}% of original)
                    </li>
                    <li>
                      <span className="inline-block w-4 h-4 rounded-full bg-amber-500 mr-1"></span> 
                      <strong>{diffStats.modified}</strong> {itemType.toLowerCase()}s were modified 
                      ({diffStats.percentModified}% of original)
                    </li>
                    <li>
                      <span className="inline-block w-4 h-4 rounded-full bg-gray-500 mr-1"></span> 
                      <strong>{diffStats.unchanged}</strong> {itemType.toLowerCase()}s remained unchanged 
                      ({diffStats.percentUnchanged}% of original)
                    </li>
                  </ul>
                  
                  {fieldsToCompare.length > 0 && fieldChangeData.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <h6 className="font-medium text-xs">Most Frequently Changed Fields</h6>
                      <ul className="mt-1 space-y-1 text-xs">
                        {fieldChangeData.map(({ name, changes }) => (
                          <li key={name}>
                            <strong>{name}</strong>: {changes} change{changes !== 1 ? 's' : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="bg-white p-3 rounded border">
                  <h5 className="font-medium text-sm">Field Analysis</h5>
                  <p className="text-xs text-gray-600 mt-1">
                    Analyzing the presence and values of key fields across both versions.
                  </p>
                  
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    {fieldsToCompare.map(field => {
                      const originalCount = fieldsFrequency[field]?.original || 0;
                      const editedCount = fieldsFrequency[field]?.edited || 0;
                      const originalPercentage = diffStats.originalCount ? Math.round(originalCount / diffStats.originalCount * 100) : 0;
                      const editedPercentage = diffStats.editedCount ? Math.round(editedCount / diffStats.editedCount * 100) : 0;
                      
                      return (
                        <div key={field} className="text-xs">
                          <div className="font-medium">{fieldLabels[field] || field}</div>
                          <div className="flex justify-between mt-1">
                            <span>Original: {originalCount}/{diffStats.originalCount} ({originalPercentage}%)</span>
                            <span>Edited: {editedCount}/{diffStats.editedCount} ({editedPercentage}%)</span>
                          </div>
                          <div className="h-2 bg-gray-200 mt-1 rounded-full flex overflow-hidden">
                            <div className="bg-blue-300 h-full" style={{width: `${originalPercentage}%`}}></div>
                          </div>
                          <div className="h-2 bg-gray-200 mt-1 rounded-full flex overflow-hidden">
                            <div className="bg-blue-500 h-full" style={{width: `${editedPercentage}%`}}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded border">
                  <h5 className="font-medium text-sm">Recommendations</h5>
                  <ul className="mt-1 space-y-1 text-xs">
                    {diffStats.added > diffStats.removed && (
                      <li className="flex items-start">
                        <AlertCircle className="h-3 w-3 text-blue-500 mt-0.5 mr-1 flex-shrink-0" />
                        <span>The number of {itemType.toLowerCase()}s has increased ({diffStats.editedCount - diffStats.originalCount} new). Consider reviewing if all additions are necessary.</span>
                      </li>
                    )}
                    
                    {diffStats.removed > diffStats.added && (
                      <li className="flex items-start">
                        <AlertCircle className="h-3 w-3 text-blue-500 mt-0.5 mr-1 flex-shrink-0" />
                        <span>The number of {itemType.toLowerCase()}s has decreased ({diffStats.originalCount - diffStats.editedCount} removed). Verify if any critical {itemType.toLowerCase()}s were unintentionally removed.</span>
                      </li>
                    )}
                    
                    {diffStats.modified > 0 && (
                      <li className="flex items-start">
                        <AlertCircle className="h-3 w-3 text-blue-500 mt-0.5 mr-1 flex-shrink-0" />
                        <span>Review the {diffStats.modified} modified {itemType.toLowerCase()}s to ensure changes are appropriate and accurate.</span>
                      </li>
                    )}
                    
                    {Object.entries(fieldsFrequency).some(([_, { original, edited }]) => edited < original) && (
                      <li className="flex items-start">
                        <AlertCircle className="h-3 w-3 text-blue-500 mt-0.5 mr-1 flex-shrink-0" />
                        <span>Some fields have decreased in usage. Check if important information is being omitted.</span>
                      </li>
                    )}
                    
                    {Object.entries(fieldsFrequency).some(([_, { original, edited }]) => edited > original) && (
                      <li className="flex items-start">
                        <AlertCircle className="h-3 w-3 text-blue-500 mt-0.5 mr-1 flex-shrink-0" />
                        <span>Some fields have increased in usage, which generally improves data completeness.</span>
                      </li>
                    )}
                    
                    {diffStats.changeRate > 0.7 && (
                      <li className="flex items-start">
                        <AlertCircle className="h-3 w-3 text-orange-500 mt-0.5 mr-1 flex-shrink-0" />
                        <span>Major changes detected (change rate: {diffStats.changeRate}x). Consider a comprehensive review of all changes.</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ObjectListComparison;