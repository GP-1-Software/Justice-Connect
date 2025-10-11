import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CTA from '../CTA';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'ar' }
  })
}));

// Wrapper for components that need Router
const RouterWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('CTA Component', () => {
  it('renders without crashing', () => {
    const { container } = render(<CTA />, { wrapper: RouterWrapper });
    expect(container).toBeTruthy();
  });

  it('displays CTA component', () => {
    const { container } = render(<CTA />, { wrapper: RouterWrapper });
    expect(container.firstChild).toBeInTheDocument();
  });
});
