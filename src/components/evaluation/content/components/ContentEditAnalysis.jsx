import React, { useState, useEffect } from 'react';
import { FileText, ChevronDown, ChevronUp, Info, Edit, Diff, List, BarChart2, PieChart } from 'lucide-react';
import { Progress } from '../../../ui/progress';
import ObjectListComparison from '../../base/ObjectListComparison';
import TextComparison from '../../base/TextComparison';
import { METRIC_EXPLANATIONS } from '../config/contentConfig';
import EditVisualization, { EditMetricsSummary, CalculationDetails } from '../visualizations/EditVisualization';
import { 
  processComparisonData,
  calculateEditMetrics, 
  calculateEditQuality,
  getEditScore
} from '../utils/editAnalysisUtils';
import { formatPercentage } from '../../base/utils/baseMetricsUtils';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const ContentEditAnalysis = ({ metrics, evaluationComparison }) => {
  const [activeTab, setActiveTab] = useState('property-list');
  const [showDetails, setShowDetails] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    changeRate: false,
    valuePreservation: true
  });
  
  const [processedData, setProcessedData] = useState(null);
  
  // Use the centralized score calculation
  const editScore = getEditScore(metrics, evaluationComparison);
  
  useEffect(() => {
    const data = processComparisonData(evaluationComparison);
    setProcessedData(data);
  }, [evaluationComparison]);
  
  if (!processedData) {
    return (
      <div className="bg-white p-3 rounded border">
        <h6 className="text-xs font-medium">Edit Analysis</h6>
        <p className="text-xs text-gray-500 mt-2">
          No edit comparison data available. Please provide evaluation comparison data to see edit analysis.
        </p>
      </div>
    );
  }
  
  const { 
    originalProps, 
    editedProps, 
    textComparisonSamples, 
    calculatedMetrics, 
    qualityAssessment 
  } = processedData;
  
  const editAnalysis = metrics?.editAnalysis || {};
  const details = editAnalysis.details || {};

  const displayMetrics = {
    changeRate: details.changeRate || calculatedMetrics.changeRate || 0,
    preservationRate: details.preservationRate || calculatedMetrics.preservationRate || 0,
    editScore: editScore, // Use centralized edit score
    addedCount: calculatedMetrics.addedCount || 0,
    removedCount: calculatedMetrics.removedCount || 0,
    modifiedCount: calculatedMetrics.modifiedCount || 0,
    unchangedCount: calculatedMetrics.unchangedCount || 0,
    totalOriginalProps: calculatedMetrics.totalOriginalProps || 0
  };

  const explanations = METRIC_EXPLANATIONS.editAnalysis?.components || {
    changeRate: { description: "Measures the percentage of properties that were modified during evaluation." },
    valuePreservation: { description: "Percentage of original values preserved in the final annotations." }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderTabHeader = () => {
    return (
      <div className="mb-4 border-b">
        <div className="flex">
          <button 
            className={`py-2 px-4 text-sm font-medium flex items-center ${activeTab === 'property-list' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('property-list')}
          >
            <List className="h-4 w-4 mr-2" />
            Property List Comparison
          </button>
          <button 
            className={`py-2 px-4 text-sm font-medium flex items-center ${activeTab === 'change-rate' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('change-rate')}
          >
            <BarChart2 className="h-4 w-4 mr-2" />
            Change Rate Analysis
          </button>
          <button 
            className={`py-2 px-4 text-sm font-medium flex items-center ${activeTab === 'value-preservation' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('value-preservation')}
          >
            <PieChart className="h-4 w-4 mr-2" />
            Value Preservation Analysis
          </button>
        </div>
      </div>
    );
  };

  const renderValuePreservationAnalysis = () => {
    const preservationRate = displayMetrics.preservationRate;
    const modificationRate = displayMetrics.modifiedCount / displayMetrics.totalOriginalProps;
    const removalRate = displayMetrics.removedCount / displayMetrics.totalOriginalProps;
    
    const preservationData = [
      { name: 'Preserved', value: displayMetrics.unchangedCount, color: '#10B981' },
      { name: 'Modified', value: displayMetrics.modifiedCount, color: '#F59E0B' },
      { name: 'Removed', value: displayMetrics.removedCount, color: '#EF4444' },
    ].filter(item => item.value > 0);

    return (
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-lg font-medium mb-3">Value Preservation Analysis</h3>
          <p className="text-sm text-gray-600 mb-4">
            This analysis measures how well the original property values were preserved in the edited version.
            A high preservation rate indicates good initial content quality requiring minimal edits.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-6">
                <h4 className="text-md font-medium mb-2">Preservation Metrics</h4>
                <div className="bg-gray-50 p-4 rounded-lg border mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Preservation Rate</p>
                      <p className="text-2xl font-bold">{formatPercentage(preservationRate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Unchanged Properties</p>
                      <p className="text-2xl font-bold">{displayMetrics.unchangedCount}/{displayMetrics.totalOriginalProps}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 mb-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Preserved Values</span>
                      <span className="text-sm">{formatPercentage(preservationRate)}</span>
                    </div>
                    <Progress value={preservationRate * 100} className="h-2.5 bg-gray-200">
                      <div className="h-full bg-green-500 rounded-full" style={{width: `${preservationRate * 100}%`}}></div>
                    </Progress>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Modified Values</span>
                      <span className="text-sm">{formatPercentage(modificationRate)}</span>
                    </div>
                    <Progress value={modificationRate * 100} className="h-2.5 bg-gray-200">
                      <div className="h-full bg-amber-500 rounded-full" style={{width: `${modificationRate * 100}%`}}></div>
                    </Progress>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Removed Values</span>
                      <span className="text-sm">{formatPercentage(removalRate)}</span>
                    </div>
                    <Progress value={removalRate * 100} className="h-2.5 bg-gray-200">
                      <div className="h-full bg-red-500 rounded-full" style={{width: `${removalRate * 100}%`}}></div>
                    </Progress>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <h5 className="text-sm font-medium text-blue-800 mb-2">Calculation</h5>
                  <div className="bg-white p-2 rounded text-sm font-mono">
                    Preservation Rate = Unchanged / Total Original<br />
                    = {displayMetrics.unchangedCount} / {displayMetrics.totalOriginalProps}<br />
                    = {formatPercentage(preservationRate)}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium mb-2">Assessment</h4>
                <div className={`p-3 rounded-lg ${
                  preservationRate >= 0.8 ? 'bg-green-50 border border-green-200' :
                  preservationRate >= 0.5 ? 'bg-amber-50 border border-amber-200' :
                  'bg-red-50 border border-red-200'
                }`}>
                  <p className="font-medium mb-1">{
                    preservationRate >= 0.8 ? 'Excellent Preservation' :
                    preservationRate >= 0.5 ? 'Moderate Preservation' :
                    'Low Preservation'
                  }</p>
                  <p className="text-sm">{
                    preservationRate >= 0.8 ? 
                      'High preservation rate indicates excellent initial content quality. Only minimal edits were needed.' :
                    preservationRate >= 0.5 ?
                      'Moderate preservation rate suggests acceptable initial content with some areas requiring improvement.' :
                      'Low preservation rate indicates substantial edits were needed to improve the content quality.'
                  }</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-md font-medium mb-4">Value Preservation Visualization</h4>
              <div className="h-80 bg-gray-50 p-4 rounded-lg border">
                {preservationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" className="mx-auto">
                  <RechartsPieChart margin={{ top: 20, right: 60, bottom: 20, left: 60 }}>
                    <Pie
                      data={preservationData}
                      dataKey="value"
                      nameKey="name"
                      labelLine={false}
                      cx="50%"
                      cy="50%"
                      // Reduce outer radius to leave room for labels
                      outerRadius={80}
                      // Custom label renderer with proper positioning
                      label={({ name, percent, cx, cy, midAngle, innerRadius, outerRadius }) => {
                        // Calculate proper position to keep labels inside container
                        const RADIAN = Math.PI / 180;
                        // Increase radius multiplier to push labels further out
                        const radius = outerRadius * 1.2;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        
                        // Format the label with proper percentage
                        const formattedPercent = (percent * 100).toFixed(0);
                        
                        return (
                          <text 
                            x={x} 
                            y={y} 
                            fill={name === "Preserved" ? "#00b894" : "#fdcb6e"}
                            textAnchor={x > cx ? 'start' : 'end'} 
                            dominantBaseline="central"
                            fontSize="12"
                            fontWeight="500"
                          >
                            {`${name}: ${formattedPercent}%`}
                          </text>
                        );
                      }}
                    >
                      {preservationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [
                        `${value} properties (${((value/displayMetrics.totalOriginalProps)*100).toFixed(1)}%)`, 
                        null
                      ]}
                      contentStyle={{ fontSize: "12px" }}
                    />
                    <Legend 
                      wrapperStyle={{ 
                        fontSize: "12px",
                        paddingTop: "20px"
                      }}
                      // Adjust legend layout to ensure it stays inside container
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No data available for visualization</p>
                  </div>
                )}
              </div>
              
              <div className="mt-4 bg-gray-50 p-3 rounded-lg border">
                <h5 className="text-sm font-medium mb-2">Interpretation Guide</h5>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center">
                    <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
                    <span><strong>Preserved (80%+):</strong> Excellent initial quality</span>
                  </li>
                  <li className="flex items-center">
                    <div className="h-3 w-3 bg-amber-500 rounded-full mr-2"></div>
                    <span><strong>Modified (20-50%):</strong> Moderate changes required</span>
                  </li>
                  <li className="flex items-center">
                    <div className="h-3 w-3 bg-red-500 rounded-full mr-2"></div>
                    <span><strong>Removed (20%+):</strong> Significant content issues</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {qualityAssessment.issues?.length > 0 && (
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h4 className="text-md font-medium flex items-center mb-2">
              <Info className="h-4 w-4 text-amber-500 mr-2" />
              Identified Issues
            </h4>
            <ul className="list-disc list-inside space-y-1">
              {qualityAssessment.issues.map((issue, i) => (
                <li key={i} className="text-sm">{issue}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderChangeRateAnalysis = () => {
    const changeRate = displayMetrics.changeRate;
    
    const changeData = [
      { 
        name: 'Added', 
        value: displayMetrics.addedCount, 
        percentage: (displayMetrics.addedCount / displayMetrics.totalOriginalProps) * 100,
        color: '#10B981'
      },
      { 
        name: 'Removed', 
        value: displayMetrics.removedCount, 
        percentage: (displayMetrics.removedCount / displayMetrics.totalOriginalProps) * 100,
        color: '#EF4444'
      },
      { 
        name: 'Modified', 
        value: displayMetrics.modifiedCount, 
        percentage: (displayMetrics.modifiedCount / displayMetrics.totalOriginalProps) * 100,
        color: '#F59E0B'
      },
      { 
        name: 'Unchanged', 
        value: displayMetrics.unchangedCount, 
        percentage: (displayMetrics.unchangedCount / displayMetrics.totalOriginalProps) * 100,
        color: '#6B7280'
      }
    ];

    return (
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-lg font-medium mb-3">Change Rate Analysis</h3>
          <p className="text-sm text-gray-600 mb-4">
            This analysis examines how much the content changed between the original and edited versions.
            Change rate combines additions, removals, and modifications relative to the original content.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-6">
                <h4 className="text-md font-medium mb-2">Change Metrics</h4>
                <div className="bg-gray-50 p-4 rounded-lg border mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Change Rate</p>
                      <p className="text-2xl font-bold">{Number(changeRate).toFixed(2)}x</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Edit Score</p>
                      <p className="text-2xl font-bold">{formatPercentage(displayMetrics.editScore)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 mb-4">
                  {changeData.filter(item => item.name !== 'Unchanged').map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{item.name} Properties ({item.value})</span>
                        <span className="text-sm">{item.percentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={item.percentage} className="h-2.5 bg-gray-200">
                        <div className="h-full rounded-full" style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color
                        }}></div>
                      </Progress>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium mb-2">Assessment</h4>
                <div className={`p-3 rounded-lg ${
                  displayMetrics.editScore >= 0.8 ? 'bg-green-50 border border-green-200' :
                  displayMetrics.editScore >= 0.6 ? 'bg-amber-50 border border-amber-200' :
                  'bg-red-50 border border-red-200'
                }`}>
                  <p className="font-medium mb-1">{
                    displayMetrics.editScore >= 0.8 ? 'Excellent Initial Quality' :
                    displayMetrics.editScore >= 0.6 ? 'Good Initial Quality' :
                    'Significant Improvements Made'
                  }</p>
                  <p className="text-sm">{
                    displayMetrics.editScore >= 0.8 ? 
                      'The content required minimal edits, indicating excellent initial quality.' :
                    displayMetrics.editScore >= 0.6 ?
                      'The content required moderate edits to reach the final quality.' :
                      'The content required significant edits, suggesting substantial improvements were made.'
                  }</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="h-[350px] bg-gray-50 p-4 rounded-lg border">
                <EditVisualization 
                  addedCount={displayMetrics.addedCount}
                  removedCount={displayMetrics.removedCount}
                  modifiedCount={displayMetrics.modifiedCount}
                  unchangedCount={displayMetrics.unchangedCount}
                  totalOriginalProps={displayMetrics.totalOriginalProps}
                />
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border">
                <EditMetricsSummary
                  addedCount={displayMetrics.addedCount}
                  removedCount={displayMetrics.removedCount}
                  modifiedCount={displayMetrics.modifiedCount}
                  unchangedCount={displayMetrics.unchangedCount}
                  totalOriginalProps={displayMetrics.totalOriginalProps}
                />
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h5 className="text-sm font-medium mb-2">Interpretation Guide</h5>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start">
                    <div className="h-3 w-3 bg-green-500 rounded-full mt-1 mr-2"></div>
                    <div>
                      <strong>Edit Score 80%+:</strong> Excellent initial quality, minimal editing required
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="h-3 w-3 bg-amber-500 rounded-full mt-1 mr-2"></div>
                    <div>
                      <strong>Edit Score 60-80%:</strong> Good initial quality, moderate editing required
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="h-3 w-3 bg-red-500 rounded-full mt-1 mr-2"></div>
                    <div>
                      <strong>Edit Score &lt;60%:</strong> Significant editing required to improve quality
                    </div>
                  </li>
                </ul>
              </div>
              
              <div className="mt-4">
                <CalculationDetails
                  addedCount={displayMetrics.addedCount}
                  removedCount={displayMetrics.removedCount}
                  modifiedCount={displayMetrics.modifiedCount}
                  totalOriginalProps={displayMetrics.totalOriginalProps}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-3 rounded border">
        <div className="flex items-center justify-between">
          <h6 className="text-xs font-medium mb-2 flex items-center">
            <FileText className="h-4 w-4 mr-1" />
            Edit Analysis Summary
          </h6>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-blue-600 flex items-center"
          >
            {showDetails ? "Hide details" : "Show details"}
            {showDetails ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
          </button>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs">
              <span className="font-medium">Edit Quality Score: </span>
              <span className={displayMetrics.editScore >= 0.8 ? 'text-green-600' : 
                      displayMetrics.editScore >= 0.6 ? 'text-yellow-600' : 'text-red-600'}>
                {formatPercentage(displayMetrics.editScore)}
              </span>
            </div>
            <div className="text-xs">
              <span className="font-medium">Modified Properties: </span>
              <span>{displayMetrics.modifiedCount} of {displayMetrics.totalOriginalProps}</span>
            </div>
          </div>
          
          <Progress 
            value={displayMetrics.editScore * 100} 
            className={`h-2 ${
              displayMetrics.editScore >= 0.8 ? 'bg-green-500' : 
              displayMetrics.editScore >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
            }`} 
          />
          
          <div className="mt-1 text-xs text-gray-500">
            {displayMetrics.editScore >= 0.8 ? 
              'Excellent initial quality with minimal edits needed' : 
              displayMetrics.editScore >= 0.6 ? 
                'Good initial quality with moderate edits needed' : 
                'Significant edits needed to improve initial content'}
          </div>
        </div>
        
        {showDetails && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-50 p-2 rounded border">
                <div className="text-xs text-gray-500">Original Properties</div>
                <div className="text-lg font-semibold">{displayMetrics.totalOriginalProps}</div>
              </div>
              
              <div className="bg-gray-50 p-2 rounded border">
                <div className="text-xs text-gray-500">Modified Properties</div>
                <div className="text-lg font-semibold">{displayMetrics.modifiedCount}</div>
              </div>
              
              <div className="bg-gray-50 p-2 rounded border">
                <div className="text-xs text-gray-500">Change Rate</div>
                <div className="text-lg font-semibold">{Number(displayMetrics.changeRate).toFixed(2)}x</div>
              </div>
              
              <div className="bg-gray-50 p-2 rounded border">
                <div className="text-xs text-gray-500">Preservation Rate</div>
                <div className="text-lg font-semibold">{formatPercentage(displayMetrics.preservationRate)}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Added Properties ({displayMetrics.addedCount})</span>
                  <span>{displayMetrics.totalOriginalProps > 0 ? ((displayMetrics.addedCount / displayMetrics.totalOriginalProps) * 100).toFixed(1) : 0}%</span>
                </div>
                <Progress value={displayMetrics.totalOriginalProps > 0 ? (displayMetrics.addedCount / displayMetrics.totalOriginalProps) * 100 : 0} className="h-1 bg-green-300" />
              </div>
              
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Removed Properties ({displayMetrics.removedCount})</span>
                  <span>{displayMetrics.totalOriginalProps > 0 ? ((displayMetrics.removedCount / displayMetrics.totalOriginalProps) * 100).toFixed(1) : 0}%</span>
                </div>
                <Progress value={displayMetrics.totalOriginalProps > 0 ? (displayMetrics.removedCount / displayMetrics.totalOriginalProps) * 100 : 0} className="h-1 bg-red-300" />
              </div>
              
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Modified Properties ({displayMetrics.modifiedCount})</span>
                  <span>{displayMetrics.totalOriginalProps > 0 ? ((displayMetrics.modifiedCount / displayMetrics.totalOriginalProps) * 100).toFixed(1) : 0}%</span>
                </div>
                <Progress value={displayMetrics.totalOriginalProps > 0 ? (displayMetrics.modifiedCount / displayMetrics.totalOriginalProps) * 100 : 0} className="h-1 bg-yellow-300" />
              </div>
              
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Unchanged Properties ({displayMetrics.unchangedCount})</span>
                  <span>{displayMetrics.totalOriginalProps > 0 ? ((displayMetrics.unchangedCount / displayMetrics.totalOriginalProps) * 100).toFixed(1) : 0}%</span>
                </div>
                <Progress value={displayMetrics.totalOriginalProps > 0 ? (displayMetrics.unchangedCount / displayMetrics.totalOriginalProps) * 100 : 0} className="h-1 bg-gray-300" />
              </div>
            </div>
          </div>
        )}
        
        {qualityAssessment.issues?.length > 0 && (
          <div className="mt-3 bg-yellow-50 p-2 rounded text-xs">
            <p className="font-medium mb-1">Edit Analysis Issues:</p>
            <ul className="list-disc list-inside">
              {qualityAssessment.issues.map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {renderTabHeader()}
      
      <div className="mb-6">
        {activeTab === 'property-list' && (
          <div>
            {originalProps.length > 0 || editedProps.length > 0 ? (
              <div className="bg-white rounded shadow">
                <div className="p-3 border-b">
                  <h5 className="text-sm font-medium mb-2">Compare the original and edited property lists</h5>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-gray-600">Original Properties</div>
                      <div className="font-semibold">{displayMetrics.totalOriginalProps}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Modified Properties</div>
                      <div className="font-semibold">{displayMetrics.modifiedCount}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Change Rate</div>
                      <div className="font-semibold">{Number(displayMetrics.changeRate).toFixed(2)}x</div>
                    </div>
                  </div>
                </div>
                <ObjectListComparison
                  originalItems={originalProps}
                  editedItems={editedProps}
                  itemType="Property"
                  primaryKey="id"
                  nameKey="label"
                  fieldsToCompare={['label', 'type', 'description', 'valueDisplay', 'valueCount']}
                  fieldLabels={{
                    label: 'Label',
                    type: 'Type',
                    description: 'Description',
                    valueDisplay: 'Values',
                    valueCount: 'Value Count'
                  }}
                  showScoreExplanation={true}
                  scoreData={editAnalysis}
                />
              </div>
            ) : (
              <div className="bg-white p-3 rounded border">
                <p className="text-xs text-gray-500">No properties available for comparison.</p>
              </div>
            )}
            
            {textComparisonSamples.length > 0 && (
              <div className="mt-6">
                <h6 className="text-sm font-medium mb-3">Text Edit Samples</h6>
                <div className="space-y-6">
                  {textComparisonSamples.map((sample, index) => (
                    <TextComparison
                    key={index}
                    comparisonData={{
                      original: sample.original,
                      edited: sample.edited
                    }}
                    fieldName={`Property: ${sample.property}`}
                    originalLabel="Original Text"
                    editedLabel="Edited Text"
                    showQualitySection={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'change-rate' && renderChangeRateAnalysis()}
      
      {activeTab === 'value-preservation' && renderValuePreservationAnalysis()}
    </div>
  </div>
);
}

export default ContentEditAnalysis;