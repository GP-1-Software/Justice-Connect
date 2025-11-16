import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, FileText, Calendar, User } from 'lucide-react';
import { formatCurrency } from '../../services/invoiceService';

/**
 * Edit Invoice Modal Component
 * Allows lawyers to edit invoice details in a popup
 */
const EditInvoiceModal = ({ 
  invoice, 
  isOpen, 
  onClose, 
  onSave,
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    invoice_number: '',
    issue_date: '',
    due_date: '',
    notes: '',
    items: []
  });

  const [errors, setErrors] = useState({});

  // Initialize form data when invoice changes
  useEffect(() => {
    if (invoice) {
      setFormData({
        invoice_number: invoice.invoice_number || '',
        issue_date: invoice.issue_date ? invoice.issue_date.split('T')[0] : '',
        due_date: invoice.due_date ? invoice.due_date.split('T')[0] : '',
        notes: invoice.notes || '',
        discount_amount: invoice.discount_amount || 0,
        tax_percentage: invoice.tax_percentage || 0,
        items: invoice.items || []
      });
    }
  }, [invoice]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Handle item changes
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    
    // Recalculate total for this item
    if (field === 'quantity' || field === 'unit_price') {
      const quantity = parseFloat(updatedItems[index].quantity) || 0;
      const unitPrice = parseFloat(updatedItems[index].unit_price) || 0;
      updatedItems[index].total_price = quantity * unitPrice;
    }
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  // Add new item
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: '',
          quantity: 1,
          unit_price: 0,
          total_price: 0
        }
      ]
    }));
  };

  // Remove item
  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Calculate total amount with tax and discount
  const calculateTotal = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (parseFloat(item.total_price) || 0), 0);
    const discountAmount = parseFloat(formData.discount_amount) || 0;
    const taxPercentage = parseFloat(formData.tax_percentage) || 0;
    
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = (afterDiscount * taxPercentage) / 100;
    const total = afterDiscount + taxAmount;
    
    return Math.max(0, total); // Ensure total is not negative
  };

  // Calculate subtotal (items only)
  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + (parseFloat(item.total_price) || 0), 0);
  };

  // Calculate tax amount
  const calculateTaxAmount = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = parseFloat(formData.discount_amount) || 0;
    const taxPercentage = parseFloat(formData.tax_percentage) || 0;
    
    const afterDiscount = subtotal - discountAmount;
    return (afterDiscount * taxPercentage) / 100;
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.invoice_number.trim()) {
      newErrors.invoice_number = 'رقم الفاتورة مطلوب';
    }
    
    if (!formData.issue_date) {
      newErrors.issue_date = 'تاريخ الإصدار مطلوب';
    }
    
    if (!formData.due_date) {
      newErrors.due_date = 'تاريخ الاستحقاق مطلوب';
    }
    
    if (formData.due_date && formData.issue_date && new Date(formData.due_date) < new Date(formData.issue_date)) {
      newErrors.due_date = 'تاريخ الاستحقاق يجب أن يكون بعد تاريخ الإصدار';
    }
    
    if (formData.items.length === 0) {
      newErrors.items = 'يجب إضافة عنصر واحد على الأقل';
    }
    
    formData.items.forEach((item, index) => {
      if (!item.description.trim()) {
        newErrors[`item_${index}_description`] = 'وصف العنصر مطلوب';
      }
      if (!item.quantity || item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'الكمية يجب أن تكون أكبر من صفر';
      }
      if (!item.unit_price || item.unit_price <= 0) {
        newErrors[`item_${index}_unit_price`] = 'السعر يجب أن يكون أكبر من صفر';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const updatedInvoice = {
      ...invoice,
      ...formData,
      total_amount: calculateTotal(),
      updated_at: new Date().toISOString()
    };
    
    onSave(updatedInvoice);
  };

  // Format date for display
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ar-JO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'gregory'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">تعديل الفاتورة</h2>
              <p className="text-sm text-gray-500">
                {invoice?.invoice_number} - {invoice?.client?.first_name} {invoice?.client?.last_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الفاتورة *
                </label>
                <input
                  type="text"
                  name="invoice_number"
                  value={formData.invoice_number}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.invoice_number ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="INV-2025-0001"
                />
                {errors.invoice_number && (
                  <p className="text-red-500 text-sm mt-1">{errors.invoice_number}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  العميل
                </label>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">
                    {invoice?.client?.first_name} {invoice?.client?.last_name}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تاريخ الإصدار *
                </label>
                <input
                  type="date"
                  name="issue_date"
                  value={formData.issue_date}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.issue_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.issue_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.issue_date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تاريخ الاستحقاق *
                </label>
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.due_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.due_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.due_date}</p>
                )}
              </div>
            </div>

            {/* Invoice Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ملاحظات الفاتورة
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="ملاحظات إضافية..."
              />
            </div>

            {/* Invoice Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">عناصر الفاتورة</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  إضافة عنصر
                </button>
              </div>

              {errors.items && (
                <p className="text-red-500 text-sm mb-4">{errors.items}</p>
              )}

              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          الوصف *
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${
                            errors[`item_${index}_description`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="وصف الخدمة أو المنتج"
                        />
                        {errors[`item_${index}_description`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_description`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          الكمية *
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${
                            errors[`item_${index}_quantity`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors[`item_${index}_quantity`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_quantity`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          السعر *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${
                            errors[`item_${index}_unit_price`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors[`item_${index}_unit_price`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_unit_price`]}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">الإجمالي:</span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(item.total_price || 0, invoice?.currency)}
                        </span>
                      </div>
                      
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          حذف
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>


            {/* Calculations Section */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">الحسابات</h4>
              
              {/* Discount and Tax Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الخصم (مبلغ ثابت)
                  </label>
                  <input
                    type="number"
                    name="discount_amount"
                    min="0"
                    step="0.01"
                    value={formData.discount_amount}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    نسبة الضريبة (%)
                  </label>
                  <input
                    type="number"
                    name="tax_percentage"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.tax_percentage}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Calculation Summary */}
              <div className="border-t border-gray-200 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">المجموع الفرعي:</span>
                  <span className="font-medium">
                    {formatCurrency(calculateSubtotal(), invoice?.currency)}
                  </span>
                </div>
                
                {parseFloat(formData.discount_amount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">الخصم:</span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(parseFloat(formData.discount_amount) || 0, invoice?.currency)}
                    </span>
                  </div>
                )}
                
                {parseFloat(formData.tax_percentage) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">الضريبة ({formData.tax_percentage}%):</span>
                    <span className="font-medium">
                      {formatCurrency(calculateTaxAmount(), invoice?.currency)}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                  <span className="text-gray-700">المبلغ الإجمالي:</span>
                  <span className="text-blue-600">
                    {formatCurrency(calculateTotal(), invoice?.currency)}
                  </span>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>حفظ التغييرات</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditInvoiceModal;
