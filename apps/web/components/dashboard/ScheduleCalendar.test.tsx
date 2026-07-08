import { render, screen } from '@testing-library/react';
import ScheduleCalendar from './ScheduleCalendar';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ data: [] }),
    })
  ) as jest.Mock;
});

describe('ScheduleCalendar', () => {
  it('renders calendar title', async () => {
    render(<ScheduleCalendar />);
    expect(screen.getByText('Calendário de Agendamentos')).toBeInTheDocument();
  });

  it('renders weekday headers', async () => {
    render(<ScheduleCalendar />);
    expect(screen.getByText('Dom')).toBeInTheDocument();
    expect(screen.getByText('Seg')).toBeInTheDocument();
    expect(screen.getByText('Ter')).toBeInTheDocument();
    expect(screen.getByText('Qua')).toBeInTheDocument();
    expect(screen.getByText('Qui')).toBeInTheDocument();
    expect(screen.getByText('Sex')).toBeInTheDocument();
    expect(screen.getByText('Sáb')).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    render(<ScheduleCalendar />);
    expect(screen.getByRole('button', { name: '' })).toBeInTheDocument();
  });
});
