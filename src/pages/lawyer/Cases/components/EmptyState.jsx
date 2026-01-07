import React from 'react';
import { Inbox, Search, FileX } from 'lucide-react';
import { motion } from 'framer-motion';

const EmptyState = ({ hasSearch }) => {

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-16 text-center"
    >
      {hasSearch ? (
        <>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-12 w-12 text-gray-400 dark:text-gray-500" />
            </div>
          </motion.div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            لا توجد نتائج
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-lg max-w-md mx-auto">
            لم نتمكن من العثور على قضايا مطابقة. جرب البحث بكلمات مختلفة أو تغيير الفلاتر
          </p>
        </>
      ) : (
        <>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileX className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
          </motion.div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            لا توجد قضايا حالياً
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-8 max-w-md mx-auto">
            لم يتم تعيين أي قضايا لك حتى الآن. ابدأ بإضافة قضية جديدة
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white rounded-xl hover:shadow-2xl hover:shadow-blue-500/30 transition-all font-semibold text-lg"
          >
            إضافة قضية جديدة
          </motion.button>
        </>
      )}
    </motion.div>
  );
};

export default EmptyState;
