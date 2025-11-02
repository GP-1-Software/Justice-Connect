import React from 'react';
import { Inbox, Search } from 'lucide-react';

const EmptyState = ({ hasSearch }) => {

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-12 text-center">
      {hasSearch ? (
        <>
          <Search className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            لا توجد نتائج
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            جرب البحث بكلمات مختلفة أو تغيير الفلاتر
          </p>
        </>
      ) : (
        <>
          <Inbox className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            لا توجد قضايا
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            لم يتم تعيين أي قضايا لك حتى الآن
          </p>
          <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all">
            طلب قضية جديدة
          </button>
        </>
      )}
    </div>
  );
};

export default EmptyState;
