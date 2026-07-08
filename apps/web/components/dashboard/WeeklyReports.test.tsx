import { render, screen } from '@testing-library/react';
import WeeklyReports from './WeeklyReports';

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ data: [] }),
    })
  ) as jest.Mock;
});

describe('WeeklyReports', () => {
  it('renders metric cards with labels', async () => {
    render(<WeeklyReports />);
    expect(screen.getByText('Total Solicitações')).toBeInTheDocument();
    expect(screen.getByText('Em Atendimento')).toBeInTheDocument();
    expect(screen.getByText('Concluídos')).toBeInTheDocument();
    expect(screen.getByText('Na Fila')).toBeInTheDocument();
  });
});
