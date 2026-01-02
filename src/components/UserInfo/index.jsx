// src/components/UserInfo/index.jsx
import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  ROLE_WEIGHTS, 
  DOMAIN_EXPERTISE_WEIGHTS, 
  EVALUATION_EXPERIENCE_WEIGHTS,
  calculateExpertiseWeight,
  formatExpertiseWeightComponents,
  getConfidenceLevel
} from '../../config/expertiseWeights';

const UserInfo = ({ data, onChange, onNext, onPrevious }) => {
  const handleInputChange = (field, value) => {
    const newData = {
      ...data,
      [field]: value
    };

    // Calculate expertise weight if all required fields are present
    if (newData.role && newData.domainExpertise && newData.evaluationExperience) {
      const weightComponents = calculateExpertiseWeight(
        newData.role,
        newData.domainExpertise,
        newData.evaluationExperience,
        newData.orkgExperience
      );
      
      newData.expertiseWeight = weightComponents.finalWeight;
      newData.weightComponents = weightComponents;
    }

    onChange(newData);
  };

  const isFormValid = () => {
    return (
      data.firstName?.trim() &&
      data.lastName?.trim() &&
      data.email?.trim() &&
      data.role &&
      data.domainExpertise &&
      data.evaluationExperience &&
      data.orkgExperience
    );
  };

  const confidenceLevel = data.expertiseWeight ? getConfidenceLevel(data.expertiseWeight) : null;
  const confidenceColors = {
    'High': 'bg-green-100 text-green-800',
    'Medium': 'bg-yellow-100 text-yellow-800',
    'Low': 'bg-red-100 text-red-800'
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Evaluator Information
          </h2>

          <div className="space-y-4">
            {/* Personal Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <input
                  type="text"
                  value={data.firstName || ''}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <input
                  type="text"
                  value={data.lastName || ''}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={data.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>

            {/* Expertise Information */}
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                value={data.role || ''}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="">Select your role</option>
                {Object.keys(ROLE_WEIGHTS).map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Domain Expertise Level</label>
              <select
                value={data.domainExpertise || ''}
                onChange={(e) => handleInputChange('domainExpertise', e.target.value)}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="">Select your expertise level</option>
                {Object.keys(DOMAIN_EXPERTISE_WEIGHTS).map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Research Evaluation Experience</label>
              <select
                value={data.evaluationExperience || ''}
                onChange={(e) => handleInputChange('evaluationExperience', e.target.value)}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="">Select your evaluation experience</option>
                {Object.keys(EVALUATION_EXPERIENCE_WEIGHTS).map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">ORKG Experience</label>
              <div className="space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="orkgExperience"
                    value="used"
                    checked={data.orkgExperience === 'used'}
                    onChange={(e) => handleInputChange('orkgExperience', e.target.value)}
                    className="mr-2"
                  />
                  <span>Used ORKG before</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="orkgExperience"
                    value="never"
                    checked={data.orkgExperience === 'never'}
                    onChange={(e) => handleInputChange('orkgExperience', e.target.value)}
                    className="mr-2"
                  />
                  <span>Never used ORKG</span>
                </label>
              </div>
            </div>

            {/* Expertise Weight Display
            {data.expertiseWeight && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Expertise Assessment</h3>
                  {confidenceLevel && (
                    <Badge className={confidenceColors[confidenceLevel]}>
                      {confidenceLevel} Expertise
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Your expertise weight: {data.expertiseWeight.toFixed(2)}/5
                </p>
                <div className="text-sm text-gray-500">
                  {data.weightComponents && formatExpertiseWeightComponents(data.weightComponents)
                    .map((component, index) => (
                      <div key={index}>{component}</div>
                    ))}
                </div>
              </div>
            )} */}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={!isFormValid()}
          className={`px-6 py-2 rounded-lg text-white
            ${isFormValid() 
              ? 'bg-[#E86161] hover:bg-[#c54545]' 
              : 'bg-gray-300 cursor-not-allowed'}`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default UserInfo;