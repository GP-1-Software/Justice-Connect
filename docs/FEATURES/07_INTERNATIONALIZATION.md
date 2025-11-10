# Internationalization (i18n) Feature

## Overview
Full bilingual support for Arabic and English languages with RTL (Right-to-Left) layout support for Arabic.

## Features

### Supported Languages
- **Arabic (ar)**: Primary language with RTL support
- **English (en)**: Secondary language with LTR layout

### Language Switching
- Language switcher in navigation
- Persistent language preference
- Automatic browser language detection
- Manual language selection

### RTL Support
- Full RTL layout for Arabic
- Text alignment (right for Arabic, left for English)
- Layout mirroring
- Icon positioning
- Navigation direction
- Form field alignment

## Implementation

### i18next Configuration
- **Location**: `src/i18n/index.js`
- **Library**: `i18next` with `react-i18next`
- **Detector**: `i18next-browser-languagedetector`

### Translation Files
- **Arabic**: `src/i18n/ar.json`
- **English**: `src/i18n/en.json`
- Structure: Key-value pairs for all translatable strings

### Usage in Components

#### Basic Translation
```javascript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return <h1>{t('welcome.title')}</h1>;
}
```

#### Language Detection
```javascript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      {t('common.greeting')}
    </div>
  );
}
```

#### Language Switching
```javascript
import { useTranslation } from 'react-i18next';

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  
  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };
  
  return (
    <div>
      <button onClick={() => changeLanguage('ar')}>العربية</button>
      <button onClick={() => changeLanguage('en')}>English</button>
    </div>
  );
}
```

## Translation Keys Structure

### Common Keys
```json
{
  "common": {
    "save": "حفظ",
    "cancel": "إلغاء",
    "delete": "حذف",
    "edit": "تعديل",
    "search": "بحث",
    "filter": "تصفية",
    "loading": "جاري التحميل..."
  }
}
```

### Feature-Specific Keys
- `dashboard.*`: Dashboard translations
- `cases.*`: Case management translations
- `appointments.*`: Appointment translations
- `profile.*`: Profile translations
- `auth.*`: Authentication translations
- `errors.*`: Error messages

## RTL Layout Implementation

### CSS Classes
- Tailwind RTL utilities
- Custom RTL classes where needed
- Direction-aware spacing

### Component Structure
```javascript
function RTLComponent() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  return (
    <div className={isRTL ? 'rtl' : 'ltr'}>
      <div className={isRTL ? 'text-right' : 'text-left'}>
        {/* Content */}
      </div>
    </div>
  );
}
```

### Tailwind RTL
- Using Tailwind's RTL mode
- Direction-aware utilities
- Automatic mirroring

## Font Support

### Arabic Fonts
- **Cairo**: Primary Arabic font
- Location: `/public/fonts/Cairo-Regular.ttf`
- Used in PDF generation and UI

### English Fonts
- System fonts (Arial, Helvetica)
- Roboto for PDFs

## PDF Generation

### Arabic PDF Support
- Full RTL support in PDFs
- Cairo font for Arabic text
- Proper text direction
- Right-aligned content
- See [PDF Reports Feature](./05_PDF_REPORTS.md) for details

## Browser Language Detection

### Automatic Detection
- Detects browser language on first visit
- Sets default language
- User can override manually

### Persistence
- Language preference saved
- Persists across sessions
- LocalStorage or cookies

## Date and Number Formatting

### Date Formatting
- Arabic: Hijri calendar option (future)
- English: Gregorian calendar
- Format based on locale

### Number Formatting
- Arabic numerals
- Proper thousand separators
- Currency formatting (if applicable)

## Form Validation Messages

### Translated Errors
- All validation messages translated
- Field labels translated
- Error messages in user's language

## Related Files
- `src/i18n/index.js`
- `src/i18n/ar.json`
- `src/i18n/en.json`
- `src/components/Navbar.jsx` (language switcher)
- `src/components/client/ClientNavbar.jsx`
- `src/components/lawyer/LawyerNavbar.jsx`

## Best Practices

### Translation Keys
- Use descriptive keys
- Group by feature
- Avoid nested keys when possible
- Keep keys consistent

### Text Content
- Always use translation keys
- Never hardcode text
- Provide context for translators
- Keep strings concise

### RTL Considerations
- Test layouts in both directions
- Ensure icons position correctly
- Check form layouts
- Verify navigation flow

## Future Enhancements

### Planned Features
- Additional languages support
- Date/time localization
- Currency formatting
- Regional variations
- Translation management system





