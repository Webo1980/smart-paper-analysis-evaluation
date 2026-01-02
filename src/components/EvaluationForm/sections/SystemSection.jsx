export const SystemSection = ({ onNext, onPrevious }) => {
    const [assessment, setAssessment] = useState({
      performanceMetrics: { rating: 0, comments: '' },
      responseTime: { rating: 0, comments: '' },
      reliability: { rating: 0, comments: '' },
      overall: { rating: 0, comments: '' }
    });
  
    return (
      <BaseEvaluationSection
        title="System Performance Evaluation"
        description="Evaluate the system's technical performance aspects."
        fields={[
          { 
            id: 'performanceMetrics',
            label: 'Performance',
            help: 'How would you rate the overall system performance?'
          },
          {
            id: 'responseTime',
            label: 'Response Time',
            help: 'How satisfied are you with the response times?'
          },
          {
            id: 'reliability',
            label: 'System Reliability',
            help: 'Did you experience any errors or system failures?'
          }
        ]}
        data={assessment}
        onChange={setAssessment}
        requireMetrics={false}
        onNext={onNext}
        onPrevious={onPrevious}
      />
    );
  };