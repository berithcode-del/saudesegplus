import { render, screen } from '@testing-library/react';
import Card from './Card';

describe('Card', () => {
  it('renders children content', () => {
    render(<Card><p>Test content</p></Card>);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<Card title="My Title"><p>Content</p></Card>);
    expect(screen.getByText('My Title')).toBeInTheDocument();
  });

  it('does not render title header when no title or icon', () => {
    const { container } = render(<Card><p>Content</p></Card>);
    const header = container.querySelector('.border-b');
    expect(header).toBeNull();
  });

  it('renders icon when provided', () => {
    const icon = <span data-testid="icon">Icon</span>;
    render(<Card icon={icon}><p>Content</p></Card>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders footer when provided', () => {
    render(<Card footer={<button>Save</button>}><p>Content</p></Card>);
    expect(screen.getByText('Save')).toBeInTheDocument();
  });
});
