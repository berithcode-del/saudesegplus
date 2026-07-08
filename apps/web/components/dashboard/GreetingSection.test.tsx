import { render, screen } from '@testing-library/react';
import GreetingSection from './GreetingSection';

describe('GreetingSection', () => {
  it('renders dashboard title', () => {
    render(<GreetingSection />);
    expect(screen.getByText('Painel do Médico')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    render(<GreetingSection />);
    expect(screen.getByText('Acompanhe suas solicitações e atendimentos')).toBeInTheDocument();
  });
});
