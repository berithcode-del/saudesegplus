"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartBarSquareIcon,
  BuildingOffice2Icon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  ArrowRightOnRectangleIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  BeakerIcon,
} from "@heroicons/react/24/outline";
import SandboxSidebarBadge from "../../components/SandboxSidebarBadge";

const navItems = [
  { href: "/admin", icon: ChartBarSquareIcon, label: "Dashboard" },
  { href: "/admin/empresas", icon: BuildingOffice2Icon, label: "Empresas" },
  { href: "/admin/clinicas", icon: BuildingStorefrontIcon, label: "Clínicas" },
  { href: "/admin/medicos", icon: UserGroupIcon, label: "Médicos" },
  { href: "/admin/sandbox", icon: BeakerIcon, label: "Sandbox" },
  {
    href: "/admin/protocolos",
    icon: ClipboardDocumentListIcon,
    label: "Protocolos",
  },
  { href: "/admin/suporte", icon: ChatBubbleLeftRightIcon, label: "Suporte" },
  { href: "/admin/financeiro", icon: CurrencyDollarIcon, label: "Financeiro" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">
            <img src="/LogoWhite.svg" alt="SaudeSeg+" />
          </div>
        </div>
        <SandboxSidebarBadge visible={pathname.startsWith("/admin/sandbox")} />
        <nav className="nav-section">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? "active" : ""}`}
              >
                <item.icon className="icon nav-icon" />
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <Link href="/">
            <ArrowRightOnRectangleIcon className="icon" />
          </Link>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
