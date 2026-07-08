import { render, screen } from '@testing-library/react';
import AppointmentsTable from './AppointmentsTable';

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ data: [] }),
    })
  ) as jest.Mock;
});

describe('AppointmentsTable', () => {
  it('renders section title', () => {
    render(<AppointmentsTable />);
    expect(screen.getByText('Solicitações Recentes')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    render(<AppointmentsTable />);
    expect(screen.getByText('Paciente')).toBeInTheDocument();
    expect(screen.getByText('Tipo')).toBeInTheDocument();
    expect(screen.getByText('Data')).toBeInTheDocument();
    expect(screen.getByText('Clínica')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });
});
