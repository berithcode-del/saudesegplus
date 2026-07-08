import { render, screen } from '@testing-library/react';
import Header from './Header';

describe('Header', () => {
  it('renders search input', () => {
    render(<Header />);
    expect(screen.getByPlaceholderText('Search appointments...')).toBeInTheDocument();
  });

  it('renders breadcrumb text', () => {
    render(<Header />);
    expect(screen.getByText('Appointment History')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders doctor name', () => {
    render(<Header />);
    expect(screen.getByText('Karen Smith')).toBeInTheDocument();
  });

  it('renders avatar image', () => {
    render(<Header />);
    const img = screen.getByAltText('Dr. Karen Smith');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/avatar.svg');
  });

  it('renders bell icon button', () => {
    render(<Header />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });
});
