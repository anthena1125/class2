import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Building as BuildingIcon } from 'lucide-react';

export const BuildingSelector: React.FC = () => {
  const { buildings, selectedBuilding, setSelectedBuilding, fetchBuildings } = useStore();

  useEffect(() => {
    fetchBuildings();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <BuildingIcon className="text-blue-600" />
        건물 선택
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {buildings.map((building) => (
          <button
            key={building.id}
            onClick={() => setSelectedBuilding(building)}
            className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
              selectedBuilding?.id === building.id
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-blue-400'
            }`}
          >
            <h3 className="font-semibold text-base sm:text-lg">
              {building.name}
            </h3>
            <p className="text-gray-600 text-sm sm:text-base">{building.floors}층</p>
          </button>
        ))}
      </div>
    </div>
  );
}