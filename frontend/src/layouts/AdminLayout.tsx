import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, FileText, Zap, AlertTriangle, Search, Bell, Home } from "lucide-react";

export function AdminLayout() {
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Requests", href: "/admin/requests", icon: Users },
    { name: "Rooms", href: "/admin/rooms", icon: Home },
    { name: "Contracts", href: "/admin/contracts", icon: FileText },
    { name: "Billing", href: "/admin/billing", icon: Zap },
    { name: "Incidents", href: "/admin/incidents", icon: AlertTriangle },
  ];

  return (
    <div className="flex h-screen bg-transparent">
      {/* Glass Sidebar */}
      <aside className="w-64 glass-sidebar m-4 rounded-[2rem] flex flex-col items-center py-8 z-10 relative overflow-hidden">
        {/* Subtle glow behind sidebar */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
        
        <div className="w-full px-8 mb-10 z-10">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">CLM<span className="text-primary font-black">Admin</span></h1>
        </div>
        
        <nav className="w-full flex-1 px-4 flex flex-col gap-2 z-10">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Handle root or subroutes
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-4 px-6 py-4 rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-primary text-white shadow-lg shadow-primary/30 font-medium translate-x-1"
                    : "text-slate-500 hover:bg-white/50 hover:text-primary font-medium"
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[15px]">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-24 px-8 flex items-center justify-between z-10 pt-4">
          <div>
            <p className="text-primary font-semibold">Welcome back, Admin 👋</p>
            <h2 className="text-3xl font-bold text-slate-800 mt-1 placeholder-title">
              {navItems.find(i => i.href === location.pathname)?.name || "Dashboard"}
            </h2>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="text-slate-400 hover:text-primary transition-colors">
              <Search size={22} />
            </button>
            <button className="text-slate-400 hover:text-primary transition-colors relative">
              <Bell size={22} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-400 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 bg-white/40 glass py-2 px-4 rounded-full">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                AD
              </div>
              <span className="text-sm font-semibold text-slate-700">Admin User</span>
            </div>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto w-full p-8 pt-6 z-10 scroll-smooth">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


