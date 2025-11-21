// src/components/admin/analytics/CasesStatusChart.jsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const CasesStatusChart = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-48 mb-4"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="font-bold text-sm"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow">
      <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
        توزيع القضايا حسب الحالة
      </h3>
      
      {data && data.length > 0 && data.some(item => item.value > 0) ? (
        <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value) => [`${value} قضية`, 'العدد']}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry) => entry.payload.name}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          لا توجد قضايا لعرضها
        </div>
      )}
    </div>
  );
};

export default CasesStatusChart;
