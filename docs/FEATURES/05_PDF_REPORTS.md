# PDF Report Generation Feature

## Overview
Generate comprehensive, professional PDF reports for legal cases with full Arabic language support, including RTL layout and proper Arabic font rendering.

## Features

### Report Generation
- **Location**: Case Details page
- **Button**: "توليد تقرير القضية" (Generate Case Report)
- **Output**: Professional PDF document
- **Language Support**: Full Arabic (RTL) and English support

### Report Contents

#### 1. Cover Page
- Platform logo/header
- Report title: "تقرير القضية" (Case Report)
- Case number
- Generation date
- Professional formatting

#### 2. Case Information Section
- **Case Details**:
  - Case number
  - Case title
  - Case type
  - Status
  - Priority
  - Description
  - Court name (if applicable)
  - Filing date
  - Next hearing date
  - Created date
  - Last updated date

#### 3. Client Information
- Full name
- Email
- Phone number
- ID number
- City

#### 4. Lawyer Information
- Full name
- Email
- Phone number
- Specialization
- License number
- Profile image (if available)

#### 5. Timeline Section
- Complete chronological timeline
- All events with:
  - Event title
  - Description
  - Author (client/lawyer)
  - Date and time
  - Event type
- Events sorted by date (newest first)

#### 6. Tasks Section
- All case tasks
- Task information:
  - Title
  - Description
  - Status
  - Priority
  - Due date
  - Created date
- Status badges (pending, in progress, completed)

#### 7. Notes Section
- **Shared Notes Only** (visible to client)
- Note details:
  - Content
  - Author (lawyer name)
  - Date created
  - Last updated

#### 8. Files Section
- List of all uploaded files
- File information:
  - File name
  - File type
  - File size
  - Upload date
  - Uploader
- Note: Files are listed, not embedded in PDF

## Arabic Support

### Font Configuration
- **Primary Font**: Cairo (for Arabic text)
  - Location: `/public/fonts/Cairo-Regular.ttf`
  - Registered with `@react-pdf/renderer`
  - Full UTF-8 support
- **English Font**: Roboto (for English text)
  - Loaded from Google Fonts CDN
  - Normal and bold weights

### RTL Layout
- **Direction**: Right-to-Left (RTL) for Arabic content
- **Text Alignment**: Right-aligned Arabic text
- **Border Accents**: Right-side borders for section headers
- **Table Layout**: RTL table structure

### Styling
- Proper Arabic text rendering
- Correct character spacing
- Line height optimized for Arabic
- RTL-aware margins and padding

## Implementation

### Hook: `useCaseReport`
- **Location**: `src/hooks/useCaseReport.jsx`
- **Purpose**: Handle PDF generation workflow

#### Functions
1. **`fetchCaseData(caseId)`**: 
   - Fetches all case-related data
   - Progress tracking (0-90%)
   - Returns complete case data object

2. **`generatePDF(reportData)`**:
   - Creates PDF blob using `@react-pdf/renderer`
   - Progress tracking (92-95%)
   - Returns PDF blob

3. **`uploadPDFToStorage(blob, caseId)`**:
   - Uploads PDF to Supabase Storage
   - Saves reference to database
   - Progress tracking (95-100%)

4. **`generateCaseReport(caseId, userProfile)`**:
   - Main function orchestrating the process
   - Combines all steps
   - Error handling
   - Progress updates

### Component: `CaseReportPDF`
- **Location**: `src/components/client/case-details/CaseReportPDF.jsx`
- **Purpose**: PDF document structure and layout
- **Library**: `@react-pdf/renderer`

#### Structure
```jsx
<Document>
  <Page>
    {/* Cover Page */}
  </Page>
  <Page>
    {/* Case Information */}
  </Page>
  <Page>
    {/* Timeline */}
  </Page>
  {/* Additional pages as needed */}
</Document>
```

### Data Fetching Process

1. **Case Data** (10% progress)
   - Fetch case with client and lawyer info
   - Single query with joins

2. **Timeline Events** (30% progress)
   - Fetch all timeline events
   - Ordered by date (newest first)

3. **Tasks** (50% progress)
   - Fetch all case tasks
   - Ordered by creation date

4. **Notes** (70% progress)
   - Fetch shared notes only
   - Include lawyer information

5. **Files** (80% progress)
   - Fetch all case files
   - File metadata

6. **Appointments** (90% progress)
   - Fetch related appointments (optional)

## Usage

### Generating a Report

#### From Case Details Page
```javascript
import { useCaseReport } from '../hooks/useCaseReport';

function CaseDetails() {
  const { generateCaseReport, isGenerating, progress } = useCaseReport();
  
  const handleGenerate = async () => {
    const result = await generateCaseReport(caseId, userProfile);
    if (result.success) {
      alert('✅ تم توليد التقرير بنجاح!');
    }
  };
  
  return (
    <button onClick={handleGenerate} disabled={isGenerating}>
      {isGenerating ? `جاري التوليد... ${progress}%` : 'توليد تقرير'}
    </button>
  );
}
```

### Report Storage
- PDFs are stored in Supabase Storage
- Bucket: `case-reports` (or configured bucket)
- Path: `case-reports/{caseId}/{timestamp}.pdf`
- Database record in `case_reports` table (if implemented)

## Styling Details

### Color Scheme
- **Primary Blue**: `#0A3D91`
- **Secondary Blue**: `#0056B3`
- **Background**: `#F8F9FB`
- **Text**: `#222` (dark gray)
- **Borders**: `#D4D4D4` (light gray)

### Status Badges
- **Active**: Green (`#10B981`)
- **Pending**: Orange (`#F59E0B`)
- **Closed**: Gray (`#6B7280`)
- **High Priority**: Red (`#EF4444`)
- **Medium Priority**: Orange (`#F59E0B`)
- **Low Priority**: Blue (`#3B82F6`)

### Typography
- **Cover Title**: 28px, Cairo, Bold
- **Section Titles**: 18px, Cairo, Bold
- **Body Text**: 11px, Cairo, Regular
- **Table Headers**: 10px, Cairo, Bold
- **Table Cells**: 10px, Cairo, Regular

## Error Handling

### Common Errors
1. **Case Not Found**: Error message displayed
2. **Data Fetch Error**: Retry option
3. **PDF Generation Error**: Error logged, user notified
4. **Upload Error**: Error message, PDF may still be downloadable

### Error Messages
- Displayed in Arabic
- User-friendly messages
- Actionable suggestions

## Performance Considerations

### Optimization
- Progress tracking for user feedback
- Efficient data fetching (parallel where possible)
- PDF generation happens client-side
- Large files handled with streaming

### File Size
- Typical report size: 200KB - 2MB
- Depends on:
  - Number of timeline events
  - Number of tasks
  - Number of notes
  - Amount of text content

## Future Enhancements

### Planned Features
- Custom report templates
- Report scheduling (automatic generation)
- Email report delivery
- Report customization options
- Multiple language templates
- Watermarking
- Digital signatures

## Related Files
- `src/hooks/useCaseReport.jsx`
- `src/components/client/case-details/CaseReportPDF.jsx`
- `src/components/client/case-details/TestPDFArabic.jsx`
- `src/pages/client/CaseDetails.jsx`
- `docs/CASE_REPORT_GUIDE.md`
- `docs/PDF_REPORT_ARABIC_SUPPORT.md`
- `docs/QUICK_START_PDF_ARABIC.md`

## Additional Documentation
- See `docs/CASE_REPORT_GUIDE.md` for detailed usage guide
- See `docs/PDF_REPORT_ARABIC_SUPPORT.md` for Arabic implementation details
- See `docs/QUICK_START_PDF_ARABIC.md` for quick start guide





