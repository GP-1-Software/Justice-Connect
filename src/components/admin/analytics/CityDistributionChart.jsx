// src/components/admin/analytics/CityDistributionChart.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#f97316', '#14b8a6', '#a855f7'];

const CityDistributionChart = ({ data, loading }) => {
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
      <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
        توزيع المستخدمين حسب المدن (أعلى 10 مدن)
      </h3>
      
      {data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis 
              dataKey="city" 
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value) => [`${value} مستخدم`, 'العدد']}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
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

export default CityDistributionChart;
