import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { formatSpecialization } from '../../../utils/formatters';

// تسجيل خط عربي (Cairo) - يدعم UTF-8 والنصوص العربية
Font.register({
  family: 'Cairo',
  src: '/fonts/Cairo-Regular.ttf',
  fontStyle: 'normal',
  fontWeight: 'normal',
});

// تسجيل خط Roboto للنصوص الإنجليزية (اختياري)
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAx05IsDqlA.ttf',
      fontWeight: 'bold',
    },
  ],
});

// الأنماط
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Cairo',
    fontSize: 11,
    lineHeight: 1.6,
    direction: 'rtl',
  },
  
  // صفحة الغلاف
  coverPage: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    backgroundColor: '#F8F9FB',
  },
  
  coverHeader: {
    backgroundColor: '#0A3D91',
    width: '100%',
    padding: 36,
    textAlign: 'center',
    marginBottom: 32,
  },
  
  logo: {
    fontSize: 34,
    fontFamily: 'Roboto',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  
  coverTitle: {
    fontSize: 28,
    fontFamily: 'Cairo',
    color: '#0A3D91',
    marginBottom: 10,
    textAlign: 'center',
    direction: 'rtl',
  },
  
  coverSubtitle: {
    fontSize: 20,
    fontFamily: 'Cairo',
    color: '#222',
    marginBottom: 28,
    textAlign: 'center',
    direction: 'rtl',
  },
  
  coverInfoBox: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 8,
    border: '2px solid #0A3D91',
    width: '80%',
  },
  
  coverInfo: {
    fontSize: 13,
    fontFamily: 'Cairo',
    color: '#333',
    marginBottom: 8,
    textAlign: 'right',
    direction: 'rtl',
  },
  
  // الأقسام
  section: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    border: '1px solid #D4D4D4',
  },
  
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Cairo',
    color: '#0A3D91',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottom: '3px solid #0A3D91',
    textAlign: 'right',
    direction: 'rtl',
    paddingRight: 8,
    borderRight: '4px solid #0A3D91',
  },
  
  sectionContent: {
    fontSize: 11,
    fontFamily: 'Cairo',
    color: '#222',
    lineHeight: 1.9,
    direction: 'rtl',
    paddingRight: 8,
  },
  
  // الجداول
  table: {
    display: 'table',
    width: '100%',
    marginTop: 10,
  },
  
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #E0E0E0',
    paddingVertical: 8,
  },
  
  tableHeader: {
    backgroundColor: '#0056B3',
    color: '#FFF',
    fontWeight: 'bold',
    textAlign: 'right',
    direction: 'rtl',
  },
  
  tableCell: {
    flex: 1,
    padding: 5,
    fontSize: 10,
    textAlign: 'right',
    direction: 'rtl',
  },
  
  // العناصر
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  
  infoLabel: {
    width: '35%',
    fontFamily: 'Cairo',
    fontSize: 12,
    color: '#0A3D91',
    textAlign: 'right',
    direction: 'rtl',
    paddingRight: 6,
  },
  
  infoValue: {
    width: '65%',
    fontFamily: 'Cairo',
    fontSize: 12,
    color: '#222',
    textAlign: 'right',
    direction: 'rtl',
  },
  
  // الملاحظات والمهام
  item: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#FFF',
    borderRadius: 5,
    border: '1px solid #E0E0E0',
  },
  
  itemTitle: {
    fontSize: 12,
    fontFamily: 'Cairo',
    color: '#0056B3',
    marginBottom: 5,
    textAlign: 'right',
    direction: 'rtl',
  },
  
  itemContent: {
    fontSize: 10,
    fontFamily: 'Cairo',
    color: '#555',
    textAlign: 'right',
    direction: 'rtl',
  },
  
  itemMeta: {
    fontSize: 9,
    fontFamily: 'Cairo',
    color: '#999',
    marginTop: 5,
    textAlign: 'right',
    direction: 'rtl',
  },
  
  // الحالات والأولويات
  badge: {
    padding: '3px 8px',
    borderRadius: 4,
    fontSize: 9,
    fontFamily: 'Cairo',
    textAlign: 'center',
    display: 'inline-block',
  },
  
  badgeActive: {
    backgroundColor: '#10B981',
    color: '#FFF',
  },
  
  badgePending: {
    backgroundColor: '#F59E0B',
    color: '#FFF',
  },
  
  badgeClosed: {
    backgroundColor: '#6B7280',
    color: '#FFF',
  },
  
  badgeHigh: {
    backgroundColor: '#EF4444',
    color: '#FFF',
  },
  
  badgeMedium: {
    backgroundColor: '#F59E0B',
    color: '#FFF',
  },
  
  badgeLow: {
    backgroundColor: '#3B82F6',
    color: '#FFF',
  },
  
  // التذييل
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 9,
    fontFamily: 'Cairo',
    color: '#999',
    borderTop: '1px solid #E0E0E0',
    paddingTop: 10,
  },
  
  pageNumber: {
    fontSize: 9,
    fontFamily: 'Cairo',
    color: '#999',
  },
  
  // نمط للنصوص الإنجليزية (مثل رقم القضية)
  englishText: {
    fontFamily: 'Roboto',
    direction: 'ltr',
    textAlign: 'left',
  },
});

// دالة مساعدة لتنسيق التاريخ
const formatDate = (dateString) => {
  if (!dateString) return 'غير محدد';
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'gregory'
  });
};

// دالة مساعدة لتنسيق الوقت
const formatDateTime = (dateString) => {
  if (!dateString) return 'غير محدد';
  const date = new Date(dateString);
  return date.toLocaleString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    calendar: 'gregory'
  });
};

// ترجمة الحالات
const statusLabels = {
  active: 'نشطة',
  pending: 'معلقة',
  closed: 'مغلقة',
  completed: 'مكتملة',
  in_progress: 'قيد التنفيذ',
  cancelled: 'ملغاة'
};

const priorityLabels = {
  high: 'عالية',
  medium: 'متوسطة',
  low: 'منخفضة'
};

const CaseReportPDF = ({ caseData, client, lawyer, timeline, tasks, notes, files, appointments }) => (
  <Document>
    {/* صفحة الغلاف */}
    <Page size="A4" style={styles.page}>
      <View style={styles.coverPage}>
        <View style={styles.coverHeader}>
          <Text style={styles.logo}>⚖️ Justice Connect</Text>
        </View>
        <Text style={styles.coverTitle}>تقرير القضية رقم {caseData.case_id}</Text>
        <Text style={styles.coverSubtitle}>{caseData.title}</Text>
        <View style={{ marginTop: 18 }}>
          <Text style={styles.coverInfo}>تاريخ التقرير: {formatDate(new Date())}</Text>
          <Text style={styles.coverInfo}>العميل: {client?.first_name} {client?.last_name}</Text>
          <Text style={styles.coverInfo}>المحامي: {lawyer ? `${lawyer.first_name} ${lawyer.last_name}` : 'لم يتم التعيين'}</Text>
        </View>
      </View>
    </Page>

    {/* صفحة معلومات القضية */}
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 معلومات القضية</Text>
        <View style={styles.sectionContent}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>رقم القضية:</Text>
            <Text style={styles.infoValue}>{caseData.case_id}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>عنوان القضية:</Text>
            <Text style={styles.infoValue}>{caseData.title}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>نوع القضية:</Text>
            <Text style={styles.infoValue}>{caseData.case_type || 'غير محدد'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>الحالة:</Text>
            <Text style={styles.infoValue}>{statusLabels[caseData.status] || caseData.status}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>الأولوية:</Text>
            <Text style={styles.infoValue}>{priorityLabels[caseData.priority] || caseData.priority}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>تاريخ الإنشاء:</Text>
            <Text style={styles.infoValue}>{formatDate(caseData.created_at)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>آخر تحديث:</Text>
            <Text style={styles.infoValue}>{formatDate(caseData.updated_at)}</Text>
          </View>
          {caseData.description && (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.infoLabel}>الوصف:</Text>
              <Text style={{ marginTop: 5, color: '#555', fontFamily: 'Cairo', textAlign: 'right', direction: 'rtl' }}>{caseData.description}</Text>
            </View>
          )}
        </View>
      </View>

      {/* أطراف القضية */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👥 أطراف القضية</Text>
        <View style={styles.sectionContent}>
          <Text style={{ fontFamily: 'Cairo', marginBottom: 10, color: '#0056B3', textAlign: 'right', direction: 'rtl' }}>العميل:</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>الاسم:</Text>
            <Text style={styles.infoValue}>{client?.first_name} {client?.last_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>البريد الإلكتروني:</Text>
            <Text style={styles.infoValue}>{client?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>رقم الهاتف:</Text>
            <Text style={styles.infoValue}>{client?.phone || 'غير محدد'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>رقم الهوية:</Text>
            <Text style={styles.infoValue}>{client?.id_number || 'غير محدد'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>المدينة:</Text>
            <Text style={styles.infoValue}>{client?.city || 'غير محدد'}</Text>
          </View>

          {lawyer && (
            <>
              <Text style={{ fontFamily: 'Cairo', marginTop: 15, marginBottom: 10, color: '#0056B3', textAlign: 'right', direction: 'rtl' }}>المحامي:</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>الاسم:</Text>
                <Text style={styles.infoValue}>{lawyer.first_name} {lawyer.last_name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>التخصص:</Text>
                <Text style={styles.infoValue}>{formatSpecialization(lawyer.specialization) || 'غير محدد'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>رقم الترخيص:</Text>
                <Text style={styles.infoValue}>{lawyer.license_number || 'غير محدد'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>البريد الإلكتروني:</Text>
                <Text style={styles.infoValue}>{lawyer.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>رقم الهاتف:</Text>
                <Text style={styles.infoValue}>{lawyer.phone || 'غير محدد'}</Text>
              </View>
            </>
          )}
        </View>
      </View>

      <Text style={styles.footer}>
        Justice Connect - نظام إدارة القضايا القانونية
      </Text>
    </Page>

    {/* صفحة الجدول الزمني */}
    {timeline && timeline.length > 0 && (
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 الجدول الزمني</Text>
          <View style={styles.sectionContent}>
            {timeline.map((event, index) => (
              <View key={event.event_id || index} style={styles.item}>
                <Text style={styles.itemTitle}>{event.title}</Text>
                <Text style={styles.itemContent}>{event.description}</Text>
                <Text style={styles.itemMeta}>
                  {formatDateTime(event.created_at)} • 
                  {event.author_type === 'client' ? ' عميل' : ' محامي'}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <Text style={styles.footer}>
          صفحة {2} • Justice Connect
        </Text>
      </Page>
    )}

    {/* صفحة المهام */}
    {tasks && tasks.length > 0 && (
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ المهام</Text>
          <View style={styles.sectionContent}>
            {tasks.map((task, index) => (
              <View key={task.task_id || index} style={styles.item}>
                <Text style={styles.itemTitle}>{task.title}</Text>
                {task.description && (
                  <Text style={styles.itemContent}>{task.description}</Text>
                )}
                <View style={{ flexDirection: 'row', marginTop: 5 }}>
                  <Text style={styles.itemMeta}>
                    الحالة: {task.is_completed ? 'مكتملة ✅' : 'قيد التنفيذ ⏳'} • 
                    الأولوية: {priorityLabels[task.priority] || task.priority}
                    {task.due_date && ` • الموعد النهائي: ${formatDate(task.due_date)}`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
        <Text style={styles.footer}>
          صفحة {3} • Justice Connect
        </Text>
      </Page>
    )}

    {/* صفحة الملاحظات */}
    {notes && notes.length > 0 && (
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗒️ الملاحظات المشتركة</Text>
          <View style={styles.sectionContent}>
            {notes.filter(note => note.is_shared).map((note, index) => (
              <View key={note.note_id || index} style={styles.item}>
                <Text style={styles.itemContent}>{note.content}</Text>
                <Text style={styles.itemMeta}>
                  {formatDateTime(note.created_at)} • 
                  {note.created_by_type === 'client' ? ' عميل' : ' محامي'}
                  {note.lawyer && ` • ${note.lawyer.first_name} ${note.lawyer.last_name}`}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <Text style={styles.footer}>
          صفحة {4} • Justice Connect
        </Text>
      </Page>
    )}

    {/* صفحة الملفات */}
    {files && files.length > 0 && (
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📎 الملفات المرفقة</Text>
          <View style={styles.sectionContent}>
            {files.map((file, index) => (
              <View key={file.file_id || index} style={styles.item}>
                <Text style={styles.itemTitle}>{file.file_name}</Text>
                <Text style={styles.itemMeta}>
                  النوع: {file.file_type} • 
                  الحجم: {(file.file_size / 1024).toFixed(2)} KB • 
                  تاريخ الرفع: {formatDate(file.created_at)}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <Text style={styles.footer}>
          صفحة {5} • Justice Connect
        </Text>
      </Page>
    )}
  </Document>
);

export default CaseReportPDF;
