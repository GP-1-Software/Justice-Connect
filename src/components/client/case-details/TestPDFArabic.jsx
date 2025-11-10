/**
 * مكون اختبار لتوليد تقرير PDF بالعربية
 * يمكن استخدامه للتحقق من أن الخط العربي والـ RTL يعملان بشكل صحيح
 */

import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// تسجيل خط Cairo
Font.register({
  family: 'Cairo',
  src: '/fonts/Cairo-Regular.ttf',
});

// أنماط الاختبار
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Cairo',
    direction: 'rtl',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    color: '#0056B3',
  },
  section: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#F8F9FB',
    borderRadius: 8,
  },
  text: {
    fontSize: 12,
    textAlign: 'right',
    direction: 'rtl',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: '#0056B3',
    marginBottom: 5,
    textAlign: 'right',
  },
});

// مستند PDF للاختبار
const TestPDFDocument = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>⚖️ اختبار تقرير PDF بالعربية</Text>
      
      <View style={styles.section}>
        <Text style={styles.label}>اختبار النص العربي:</Text>
        <Text style={styles.text}>
          مرحباً بك في نظام Justice Connect لإدارة القضايا القانونية
        </Text>
        <Text style={styles.text}>
          هذا اختبار للتأكد من أن الخط العربي Cairo يعمل بشكل صحيح
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>اختبار الأحرف العربية:</Text>
        <Text style={styles.text}>
          أ ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي
        </Text>
        <Text style={styles.text}>
          ا إ أ آ ة ى ئ ؤ ء
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>اختبار الأرقام:</Text>
        <Text style={styles.text}>
          ١ ٢ ٣ ٤ ٥ ٦ ٧ ٨ ٩ ٠
        </Text>
        <Text style={styles.text}>
          1 2 3 4 5 6 7 8 9 0
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>اختبار الجمل الطويلة:</Text>
        <Text style={styles.text}>
          نظام Justice Connect هو منصة شاملة لإدارة القضايا القانونية تربط بين العملاء والمحامين
          وتوفر أدوات متقدمة لإدارة القضايا والمواعيد والملفات والتواصل بشكل آمن وفعال.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>اختبار الحركات:</Text>
        <Text style={styles.text}>
          مَرْحَباً بِكُمْ فِي نِظَامِ إِدَارَةِ الْقَضَايَا الْقَانُونِيَّةِ
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>✅ نتيجة الاختبار:</Text>
        <Text style={styles.text}>
          إذا ظهرت جميع النصوص أعلاه بشكل واضح ومن اليمين لليسار، فهذا يعني أن:
        </Text>
        <Text style={styles.text}>
          ✓ خط Cairo يعمل بشكل صحيح
        </Text>
        <Text style={styles.text}>
          ✓ الاتجاه RTL مفعّل بشكل صحيح
        </Text>
        <Text style={styles.text}>
          ✓ الترميز UTF-8 يعمل بشكل سليم
        </Text>
      </View>
    </Page>
  </Document>
);

// مكون React للاختبار
const TestPDFArabic = () => {
  const handleGenerateTest = async () => {
    try {
      console.log('🔄 بدء توليد تقرير الاختبار...');
      
      const blob = await pdf(<TestPDFDocument />).toBlob();
      
      // تحميل الملف
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `test-arabic-pdf-${Date.now()}.pdf`;
      link.click();
      
      console.log('✅ تم توليد تقرير الاختبار بنجاح!');
      alert('✅ تم توليد تقرير الاختبار بنجاح! تحقق من ملف التحميل.');
    } catch (error) {
      console.error('❌ خطأ في توليد التقرير:', error);
      alert('❌ حدث خطأ: ' + error.message);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-right">
        اختبار تقرير PDF بالعربية
      </h2>
      
      <div className="mb-4 text-right">
        <p className="text-gray-600 mb-2">
          هذا المكون يختبر:
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-1">
          <li>خط Cairo العربي</li>
          <li>الاتجاه من اليمين لليسار (RTL)</li>
          <li>الترميز UTF-8</li>
          <li>الحركات والأحرف الخاصة</li>
        </ul>
      </div>

      <button
        onClick={handleGenerateTest}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
      >
        🧪 توليد تقرير اختبار PDF
      </button>

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-right">
        <p className="text-sm text-blue-800">
          💡 <strong>ملاحظة:</strong> تأكد من وجود ملف الخط في:
          <code className="bg-blue-100 px-2 py-1 rounded mx-1">
            public/fonts/Cairo-Regular.ttf
          </code>
        </p>
      </div>
    </div>
  );
};

export default TestPDFArabic;
