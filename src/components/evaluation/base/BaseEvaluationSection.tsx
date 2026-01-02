import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Textarea } from '../../ui/textarea';
import { Rating } from '../../ui/rating';

export const BaseEvaluationSection = ({
  title,
  description,
  fields,
  data,
  onChange,
  onComplete,
  isComplete
}) => {
  const handleRatingChange = (field, value) => {
    onChange(field, { ...data[field], rating: value });
  };

  const handleCommentsChange = (field, comments) => {
    onChange(field, { ...data[field], comments });
  };

  useEffect(() => {
    if (onComplete) {
      const requiredFields = fields.map(field => field.id);
      const allFieldsComplete = requiredFields.every(field => 
        data[field]?.rating > 0 && 
        data[field]?.comments?.trim().length > 0
      );
      onComplete(allFieldsComplete);
    }
  }, [data, fields, onComplete]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-gray-500">{description}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {fields.map(({ id, label, description }) => (
            <div key={id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium">{label}</h3>
                  {description && (
                    <div className="mt-1 text-sm text-gray-600">
                      {description}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Rating
                    value={data[id]?.rating || 0}
                    onValueChange={(value) => handleRatingChange(id, value)}
                  />
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-center mb-1">
                  <span className="text-sm text-gray-600">Comments (optional)</span>
                </div>
                <Textarea
                  placeholder="Add your observations..."
                  value={data[id]?.comments || ''}
                  onChange={(e) => handleCommentsChange(id, e.target.value)}
                  className="w-full p-2 text-sm min-h-[100px] resize-none"
                />
              </div>
            </div>
          ))}

          <div className="border rounded-lg p-4">
            <div className="flex items-center mb-2">
              <h3 className="text-lg font-medium">Overall Assessment</h3>
            </div>
            <Textarea
              placeholder="Add overall comments..."
              value={data.overall?.comments || ''}
              onChange={(e) => handleCommentsChange('overall', e.target.value)}
              className="w-full p-2 text-sm min-h-[100px] resize-none"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BaseEvaluationSection;