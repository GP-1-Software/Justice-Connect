import React from 'react';
import { Users, Briefcase, Award, TrendingUp } from 'lucide-react';

const Stats = () => {
  const stats = [
    {
      icon: <Users className="h-8 w-8" />,
      number: '10,000+',
      label: 'عميل نشط',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: <Briefcase className="h-8 w-8" />,
      number: '500+',
      label: 'محامي محترف',
      color: 'from-cyan-500 to-cyan-600'
    },
    {
      icon: <Award className="h-8 w-8" />,
      number: '15,000+',
      label: 'قضية ناجحة',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      number: '95%',
      label: 'رضا العملاء',
      color: 'from-purple-500 to-purple-600'
    }
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center transform hover:scale-105 transition duration-300 hover:shadow-xl"
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${stat.color} text-white mb-4`}>
                {stat.icon}
              </div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{stat.number}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
