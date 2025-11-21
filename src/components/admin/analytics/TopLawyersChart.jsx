// src/components/admin/analytics/TopLawyersChart.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Award } from 'lucide-react';

const TopLawyersChart = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-48 mb-4"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-center space-x-2 space-x-reverse mb-3 sm:mb-4">
        <Award className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 flex-shrink-0" />
        <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white">
          أكثر المحامين نشاطاً (أعلى 10)
        </h3>
      </div>
      
      {data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis 
              type="number"
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis 
              type="category"
              dataKey="name" 
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              width={120}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value, name, props) => [
                `${value} قضية`,
                props.payload.specialization || 'محامي'
              ]}
            />
            <Bar 
              dataKey="cases" 
              fill="#8b5cf6" 
              radius={[0, 8, 8, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          لا توجد بيانات لعرضها
        </div>
      )}
    </div>
  );
};

export default TopLawyersChart;
