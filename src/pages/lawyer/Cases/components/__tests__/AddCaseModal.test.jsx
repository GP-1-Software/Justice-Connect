import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AddCaseModal from '../AddCaseModal';

// Mock the hooks and Supabase
vi.mock('../../../../../hooks/useLawyerAuth', () => ({
  useLawyerAuth: () => ({
    lawyer: {
      lawyer_id: 1,
      first_name: 'Test',
      last_name: 'Lawyer'
    }
  })
}));

vi.mock('../../../../../supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { case_id: 1, case_title: 'Test Case' },
            error: null
          }))
        }))
      }))
    }))
  }
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      language: 'ar'
    }
  })
}));

describe('AddCaseModal', () => {
  const mockClose = vi.fn();
  const mockOnCaseAdded = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal when isOpen is true', () => {
    render(
      <AddCaseModal 
        isOpen={true} 
        onClose={mockClose}
        onCaseAdded={mockOnCaseAdded}
      />
    );
    
    expect(screen.getByText('cases.addNewCase')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <AddCaseModal 
        isOpen={false} 
        onClose={mockClose}
        onCaseAdded={mockOnCaseAdded}
      />
    );
    
    expect(screen.queryByText('cases.addNewCase')).not.toBeInTheDocument();
  });

  it('has all required form fields', () => {
    const { container } = render(
      <AddCaseModal 
        isOpen={true} 
        onClose={mockClose}
        onCaseAdded={mockOnCaseAdded}
      />
    );
    
    // Query by name attribute
    expect(container.querySelector('input[name="case_title"]')).toBeInTheDocument();
    expect(container.querySelector('select[name="case_type"]')).toBeInTheDocument();
    expect(container.querySelector('select[name="priority"]')).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', () => {
    render(
      <AddCaseModal 
        isOpen={true} 
        onClose={mockClose}
        onCaseAdded={mockOnCaseAdded}
      />
    );
    
    const cancelButton = screen.getByText('actions.cancel');
    fireEvent.click(cancelButton);
    
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('requires case title to be filled', () => {
    const { container } = render(
      <AddCaseModal 
        isOpen={true} 
        onClose={mockClose}
        onCaseAdded={mockOnCaseAdded}
      />
    );
    
    const titleInput = container.querySelector('input[name="case_title"]');
    expect(titleInput).toHaveAttribute('required');
  });
});
