import React from 'react';
import { SampleData } from '../types';
import { Database } from 'lucide-react';

interface DatasetSelectorProps {
  datasets: SampleData[];
  selectedDatasetIndex: number;
  onDatasetChange: (index: number) => void;
}

const DatasetSelector: React.FC<DatasetSelectorProps> = ({
  datasets,
  selectedDatasetIndex,
  onDatasetChange,
}) => {
  return (
    <div className="p-3 bg-white rounded-lg shadow-sm border border-indigo-100">
      <label htmlFor="dataset-select" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
        <Database size={14} className="mr-1 text-indigo-600" />
        Dataset
      </label>
      <select
        id="dataset-select"
        value={selectedDatasetIndex}
        onChange={(e) => onDatasetChange(Number(e.target.value))}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-1.5 px-2 border"
      >
        {datasets.map((dataset, index) => (
          <option key={index} value={index}>
            {dataset.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DatasetSelector;