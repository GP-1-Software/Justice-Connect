import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInvoice } from '../../hooks/useInvoices';
import { usePaymentOperations } from '../../hooks/usePayments';
import { formatCurrency } from '../../services/invoiceService';
import { 
  CreditCard, 
  Building2, 
  DollarSign,
  FileText,
  Calendar,
  User,
  CheckCircle,
  ArrowRight,
  Lock
} from 'lucide-react';

/**
 * Pay Invoice Page for Clients
 */
const PayInvoice = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  
  const { invoice, loading: invoiceLoading } = useInvoice(parseInt(invoiceId));
  const { process, loading: paymentLoading } = usePaymentOperations();

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    bankName: '',
    accountNumber: '',
    notes: ''
  });

  const [showSuccess, setShowSuccess] = useState(false);

  const paymentMethods = [
    {
      id: 'card',
      name: 'بطاقة ائتمان',
      icon: CreditCard,
      description: 'ادفع باستخدام بطاقة الائتمان أو الخصم'
    },
    {
      id: 'bank_transfer',
      name: 'تحويل بنكي',
      icon: Building2,
      description: 'تحويل مباشر من حسابك البنكي'
    },
    {
      id: 'cash',
      name: 'نقداً',
      icon: DollarSign,
      description: 'الدفع نقداً عند المقابلة'
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate based on payment method
    if (paymentMethod === 'card') {
      if (!paymentDetails.cardNumber || !paymentDetails.cardName || 
          !paymentDetails.expiryDate || !paymentDetails.cvv) {
        alert('يرجى ملء جميع بيانات البطاقة');
        return;
      }
    } else if (paymentMethod === 'bank_transfer') {
      if (!paymentDetails.bankName || !paymentDetails.accountNumber) {
        alert('يرجى ملء بيانات التحويل البنكي');
        return;
      }
    }

    // Process payment
    const { data, error } = await process(
      parseInt(invoiceId),
      paymentMethod,
      {
        gateway: paymentMethod === 'card' ? 'stripe' : paymentMethod,
        notes: paymentDetails.notes
      }
    );

    if (error) {
      alert('حدث خطأ أثناء معالجة الدفع. يرجى المحاولة مرة أخرى.');
      console.error(error);
      return;
    }

    // Show success message
    setShowSuccess(true);

    // Redirect after 3 seconds
    setTimeout(() => {
      navigate('/client/invoices');
    }, 3000);
  };

  if (invoiceLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">الفاتورة غير موجودة</h2>
          <button
            onClick={() => navigate('/client/invoices')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            العودة للفواتير
          </button>
        </div>
      </div>
    );
  }

  if (invoice.status === 'paid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">تم دفع هذه الفاتورة</h2>
          <p className="text-gray-600 mb-4">هذه الفاتورة مدفوعة بالفعل</p>
          <button
            onClick={() => navigate('/client/invoices')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            العودة للفواتير
          </button>
        </div>
      </div>
    );
  }

  // Success Modal
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">تم الدفع بنجاح!</h2>
          <p className="text-gray-600 mb-6">
            تم معالجة دفعتك بنجاح. سيتم إعادة توجيهك إلى صفحة الفواتير...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/client/invoices')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowRight className="w-5 h-5" />
            <span>العودة للفواتير</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">دفع الفاتورة</h1>
          <p className="text-gray-600 mt-2">أكمل عملية الدفع بشكل آمن</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Payment Method Selection */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">اختر طريقة الدفع</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-4 border-2 rounded-lg text-right transition-all ${
                        paymentMethod === method.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <method.icon className={`w-6 h-6 ${
                          paymentMethod === method.id ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{method.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">تفاصيل الدفع</h2>

                {/* Credit Card */}
                {paymentMethod === 'card' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        رقم البطاقة
                      </label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={paymentDetails.cardNumber}
                        onChange={handleInputChange}
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        اسم حامل البطاقة
                      </label>
                      <input
                        type="text"
                        name="cardName"
                        value={paymentDetails.cardName}
                        onChange={handleInputChange}
                        placeholder="الاسم كما يظهر على البطاقة"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          تاريخ الانتهاء
                        </label>
                        <input
                          type="text"
                          name="expiryDate"
                          value={paymentDetails.expiryDate}
                          onChange={handleInputChange}
                          placeholder="MM/YY"
                          maxLength="5"
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CVV
                        </label>
                        <input
                          type="text"
                          name="cvv"
                          value={paymentDetails.cvv}
                          onChange={handleInputChange}
                          placeholder="123"
                          maxLength="4"
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Bank Transfer */}
                {paymentMethod === 'bank_transfer' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        اسم البنك
                      </label>
                      <input
                        type="text"
                        name="bankName"
                        value={paymentDetails.bankName}
                        onChange={handleInputChange}
                        placeholder="البنك الأهلي الأردني"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        رقم الحساب
                      </label>
                      <input
                        type="text"
                        name="accountNumber"
                        value={paymentDetails.accountNumber}
                        onChange={handleInputChange}
                        placeholder="1234567890"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Cash */}
                {paymentMethod === 'cash' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800">
                      سيتم الدفع نقداً عند المقابلة مع المحامي. يرجى التأكد من إحضار المبلغ المطلوب.
                    </p>
                  </div>
                )}

                {/* Notes */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ملاحظات (اختياري)
                  </label>
                  <textarea
                    name="notes"
                    value={paymentDetails.notes}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="أي ملاحظات إضافية..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <Lock className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-blue-900 mb-1">دفع آمن ومشفر</h3>
                  <p className="text-sm text-blue-800">
                    جميع معلومات الدفع محمية بتشفير SSL. نحن لا نقوم بتخزين بيانات بطاقتك الائتمانية.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={paymentLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg shadow-md"
              >
                {paymentLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>جاري المعالجة...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-6 h-6" />
                    <span>تأكيد الدفع - {formatCurrency(invoice.total_amount, invoice.currency)}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Invoice Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">ملخص الفاتورة</h2>

              <div className="space-y-4">
                {/* Invoice Number */}
                <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">رقم الفاتورة</p>
                    <p className="font-medium text-gray-900">{invoice.invoice_number}</p>
                  </div>
                </div>

                {/* Lawyer */}
                <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                  <User className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">المحامي</p>
                    <p className="font-medium text-gray-900">
                      {invoice.lawyer?.first_name} {invoice.lawyer?.last_name}
                    </p>
                  </div>
                </div>

                {/* Due Date */}
                <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">تاريخ الاستحقاق</p>
                    <p className="font-medium text-gray-900">
                      {new Date(invoice.due_date).toLocaleDateString('ar-JO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        calendar: 'gregory'
                      })}
                    </p>
                  </div>
                </div>

                {/* Amount Breakdown */}
                <div className="space-y-3 pt-4">
                  <div className="flex justify-between text-gray-700">
                    <span>المجموع الفرعي</span>
                    <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                  </div>
                  
                  {invoice.tax_amount > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span>الضريبة ({invoice.tax_percentage}%)</span>
                      <span>{formatCurrency(invoice.tax_amount, invoice.currency)}</span>
                    </div>
                  )}
                  
                  {invoice.discount_amount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>الخصم</span>
                      <span>-{formatCurrency(invoice.discount_amount, invoice.currency)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-xl font-bold text-blue-600 pt-3 border-t-2 border-gray-200">
                    <span>المجموع الإجمالي</span>
                    <span>{formatCurrency(invoice.total_amount, invoice.currency)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayInvoice;
