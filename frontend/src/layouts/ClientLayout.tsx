import { Outlet, Link, useLocation } from "react-router-dom";
import { Home, AlertTriangle, FileText, User } from "lucide-react";

export function ClientLayout() {
  const location = useLocation();
  const navItems = [
    { name: "Tổng quan", href: "/client", icon: Home },
    { name: "Sự cố", href: "/client/incidents", icon: AlertTriangle },
    { name: "Hóa đơn", href: "/client/billing", icon: FileText },
    { name: "Cá nhân", href: "/client/profile", icon: User },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50 relative">
      {/* Top Header */}
      <header className="glass-header px-6 py-4 flex justify-between items-center sticky top-0 z-20">
         <div>
            <p className="text-primary text-xs font-bold uppercase tracking-wider">Phòng của bạn</p>
            <h1 className="font-bold text-slate-800 text-xl">P201</h1>
         </div>
         <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden shadow-sm">
            <img src="https://ui-avatars.com/api/?name=Nguyễn+Văn+A&background=random" alt="avatar" />
         </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto w-full p-4 pb-28 z-10 scroll-smooth">
         <Outlet />
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="glass fixed bottom-0 w-full px-6 py-4 flex justify-between items-center z-20 border-t rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center gap-1.5 transition-colors ${
                isActive ? "text-primary" : "text-slate-400 hover:text-primary/70"
              }`}
            >
              <div className={`${isActive ? "bg-primary/10 p-2.5 rounded-2xl" : "p-2.5"}`}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[11px] font-bold">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
