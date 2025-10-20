import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import CasesList from '../../pages/lawyer/Cases/CasesList';

// Mock Supabase
const mockCases = [
  {
    case_id: 1,
    case_title: 'Test Case 1',
    case_type: 'civil',
    status: 'active',
    priority: 'high',
    assigned_lawyer_id: 1
  }
];

vi.mock('../../supabaseClient', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'cases') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({
                data: mockCases,
                error: null
              }))
            }))
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: {
                  case_id: 2,
                  case_title: 'New Case',
                  case_type: 'criminal',
                  status: 'active',
                  priority: 'medium'
                },
                error: null
              }))
            }))
          }))
        };
      }
      return {
        insert: vi.fn(() => Promise.resolve({ data: null, error: null }))
      };
    }),
    channel: vi.fn(() => {
      const channel = {
        on: vi.fn(() => channel),
        subscribe: vi.fn(() => channel),
        unsubscribe: vi.fn()
      };
      return channel;
    })
  }
}));

// Mock hooks
vi.mock('../../hooks/useLawyerAuth', () => ({
  useLawyerAuth: () => ({
    lawyer: {
      lawyer_id: 1,
      first_name: 'Ahmad',
      last_name: 'Ali'
    }
  })
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'ar' }
  })
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({
      pathname: '/lawyer/cases',
      search: '',
      hash: '',
      state: null
    })
  };
});

const RouterWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Add Case Integration Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders cases list page', async () => {
    render(<CasesList />, { wrapper: RouterWrapper });

    // Check that page header is rendered
    expect(screen.getByText('cases.myCases')).toBeInTheDocument();
    
    // Check that add button exists
    expect(screen.getByText('cases.addCase')).toBeInTheDocument();
    
    // Initially shows loading state
    expect(screen.getByText('common.loading')).toBeInTheDocument();
  });

  it('can open add case modal', async () => {
    const user = userEvent.setup();
    
    render(<CasesList />, { wrapper: RouterWrapper });

    // Click "Add Case" button
    const addButton = screen.getByText('cases.addCase');
    await user.click(addButton);

    // Modal should open
    await waitFor(() => {
      expect(screen.getByText('cases.addNewCase')).toBeInTheDocument();
    });
  });
});
