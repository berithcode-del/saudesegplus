'use client';
import { HomeIcon, UsersIcon, CalendarIcon, ChartBarIcon, CogIcon, UserCircleIcon } from '@heroicons/react/24/outline';

const navItems = [
  { name: 'Dashboard', icon: HomeIcon, href: '/medico' },
  { name: 'Patients', icon: UsersIcon, href: '/medico/pacientes' },
  { name: 'Calendar', icon: CalendarIcon, href: '/medico/agenda' },
  { name: 'Reports', icon: ChartBarIcon, href: '/medico/relatorios' },
  { name: 'Configurações', icon: CogIcon, href: '/medico/configuracoes' },
];

export default function Sidebar() {
  return (
    <div className="hidden md:flex flex-col w-64 bg-indigo-700 text-white h-screen fixed">
      {/* Logo + Doctor Info */}
      <div className="p-4 border-b border-indigo-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center">
            <span className="text-indigo-700 font-bold text-lg">SS</span>
          </div>
          <div>
            <div className="font-semibold">SaudeSeg+</div>
            <div className="text-xs text-indigo-200">Dr. Karen Smith</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <a
                href={item.href}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-indigo-600 transition-colors"
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}