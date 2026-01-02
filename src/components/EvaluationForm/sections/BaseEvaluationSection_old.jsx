export const BaseEvaluationSection = ({
    title,
    description,
    fields,
    data,
    onChange,
    onComplete,
    showMetrics,
    requireMetrics = true,
    onNext,
    onPrevious
  }) => {
    const [isSubmitted, setIsSubmitted] = useState(false);
  
    const handleSubmit = () => {
      setIsSubmitted(true);
      if (onComplete) {
        onComplete();
      }
    };
  
    const isValid = () => {
      return Object.values(data).every(field => field.rating > 0);
    };
  
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">{title}</h2>
          {description && <p className="text-gray-600 mb-6">{description}</p>}
  
          {!isSubmitted ? (
            <div className="space-y-6">
              {fields.map(field => (
                <div key={field.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="font-medium">{field.label}</label>
                    {field.help && (
                      <Tooltip content={field.help}>
                        <HelpCircle className="w-4 h-4 text-gray-400" />
                      </Tooltip>
                    )}
                  </div>
                  <RatingInput
                    value={data[field.id].rating}
                    onChange={rating => 
                      onChange({
                        ...data,
                        [field.id]: { ...data[field.id], rating }
                      })
                    }
                  />
                  <TextArea
                    value={data[field.id].comments}
                    onChange={comments =>
                      onChange({
                        ...data,
                        [field.id]: { ...data[field.id], comments }
                      })
                    }
                    placeholder="Add your observations..."
                  />
                </div>
              ))}
  
              <Button
                onClick={handleSubmit}
                disabled={!isValid()}
                className="w-full mt-4"
              >
                Submit Assessment
              </Button>
            </div>
          ) : (
            requireMetrics && showMetrics && onComplete?.()
          )}
        </div>
  
        <div className="flex justify-between">
          <Button 
            onClick={onPrevious} 
            variant="outline"
            className="!bg-[#E86161] hover:!bg-[#c54545] text-white mb-4 flex items-center gap-2 p-2 rounded-md !outline-none !ring-0 !border-none"
          >Previous</Button>
          <Button 
            onClick={onNext}
            disabled={requireMetrics && !isSubmitted}
            className="!bg-[#E86161] hover:!bg-[#c54545] text-white mb-4 flex items-center gap-2 p-2 rounded-md !outline-none !ring-0 !border-none"
          >
            Next
          </Button>
        </div>
      </div>
    );
  };