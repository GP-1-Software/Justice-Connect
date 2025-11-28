import React from 'react';
import { Shield, Clock, Users, Sparkles } from 'lucide-react';

const Stats = () => {
  const stats = [
    {
      icon: <Shield className="h-8 w-8" />,
      number: '100%',
      label: 'تشفير آمن',
      description: 'حماية كاملة لبياناتك',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: <Clock className="h-8 w-8" />,
      number: '24/7',
      label: 'دعم متواصل',
      description: 'متاحون على مدار الساعة',
      color: 'from-cyan-500 to-cyan-600'
    },
    {
      icon: <Users className="h-8 w-8" />,
      number: 'معتمدون',
      label: 'محامون محترفون',
      description: 'مصادق على رخصهم',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: <Sparkles className="h-8 w-8" />,
      number: 'AI',
      label: 'ذكاء اصطناعي',
      description: 'تقنية متقدمة',
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
              className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center transform hover:scale-105 transition duration-300 hover:shadow-2xl border border-gray-100 dark:border-gray-700"
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${stat.color} text-white mb-4 group-hover:scale-110 transition duration-300 shadow-lg`}>
                {stat.icon}
              </div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{stat.number}</h3>
              <p className="text-gray-900 dark:text-white font-semibold text-base mb-1">{stat.label}</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs">{stat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
