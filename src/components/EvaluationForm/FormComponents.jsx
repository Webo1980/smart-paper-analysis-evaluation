// src/components/EvaluationForm/FormComponents.jsx
import React from 'react';
import * as Label from '@radix-ui/react-label';
import RequiredLabel from '../shared/RequiredLabel';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

import { ExternalLink } from 'lucide-react';

export const FormSection = ({ title, children }) => (
  <div className="mb-8 p-4 bg-white rounded-lg shadow">
    <h3 className="text-xl font-semibold mb-4">{title}</h3>
    {children}
  </div>
);

export const TextInput = ({ label, value, onChange, required = true, error, type = "text" }) => (
  <div className="mb-4">
    <Label.Root className="block text-sm font-medium mb-1">
      {required ? <RequiredLabel>{label}</RequiredLabel> : label}
    </Label.Root>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full p-2 border rounded-md ${error ? 'border-red-500' : 'border-gray-300'}`}
    />
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
);

export const RadioInput = ({ label, options, value, onChange, required = true, error }) => (
  <div className="mb-4">
    <Label.Root className="block text-sm font-medium mb-2">
      {required ? <RequiredLabel>{label}</RequiredLabel> : label}
    </Label.Root>
    <RadioGroup value={value} onValueChange={onChange}>
      {options.map((option) => (
        <div key={option} className="flex items-center space-x-2">
          <RadioGroupItem value={option} id={`${label}-${option}`} />
          <Label.Root htmlFor={`${label}-${option}`} className="text-sm text-gray-700">
            {option}
          </Label.Root>
        </div>
      ))}
    </RadioGroup>
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
);

export const RatingInput = ({ label, value, onChange, required = true, error }) => (
  <div className="mb-4">
    <Label.Root className="block text-sm font-medium mb-1">
      {required ? <RequiredLabel>{label}</RequiredLabel> : label}
    </Label.Root>
    <input
      type="number"
      min="1"
      max="5"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`w-full p-2 border rounded-md ${error ? 'border-red-500' : 'border-gray-300'}`}
    />
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
);

export const CheckboxInput = ({ label, checked, onChange, required = false, error }) => (
  <div className="mb-2">
    <label className="inline-flex items-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="form-checkbox text-[#E86161] rounded"
      />
      <span className="ml-2 text-sm font-medium">
        {required ? <RequiredLabel>{label}</RequiredLabel> : label}
      </span>
    </label>
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
);

export const TextArea = ({ label, value, onChange, required = true, error }) => (
  <div className="mb-4">
    <Label.Root className="block text-sm font-medium mb-1">
      {required ? <RequiredLabel>{label}</RequiredLabel> : label}
    </Label.Root>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full p-2 border rounded-md ${error ? 'border-red-500' : 'border-gray-300'}`}
      rows={3}
    />
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
);

export const PropertyTable = ({ properties, onPropertyChange, required = true }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead>
        <tr>
          <th className="px-4 py-2">
            {required ? <RequiredLabel>Property Name</RequiredLabel> : "Property Name"}
          </th>
          <th className="px-4 py-2">Generated Value</th>
          <th className="px-4 py-2">Source in Paper</th>
          <th className="px-4 py-2">Accuracy (1-5)</th>
          <th className="px-4 py-2">Hallucination</th>
        </tr>
      </thead>
      <tbody>
        {properties.map((prop, index) => (
          <tr key={index} className="border-b">
            <td className="px-4 py-2">{prop.name}</td>
            <td className="px-4 py-2">
              <input
                type="text"
                value={prop.value}
                onChange={(e) => onPropertyChange(index, 'value', e.target.value)}
                className="w-full p-1 border rounded"
              />
            </td>
            <td className="px-4 py-2">
              <input
                type="text"
                value={prop.source}
                onChange={(e) => onPropertyChange(index, 'source', e.target.value)}
                className="w-full p-1 border rounded"
              />
            </td>
            <td className="px-4 py-2">
              <input
                type="number"
                min="1"
                max="5"
                value={prop.accuracy}
                onChange={(e) => onPropertyChange(index, 'accuracy', Number(e.target.value))}
                className="w-full p-1 border rounded"
              />
            </td>
            <td className="px-4 py-2 text-center">
              <input
                type="checkbox"
                checked={prop.hallucination}
                onChange={(e) => onPropertyChange(index, 'hallucination', e.target.checked)}
                className="form-checkbox text-[#E86161]"
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);