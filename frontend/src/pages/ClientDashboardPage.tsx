import { AlertCircle, ArrowRight, Zap, Droplets, ShieldCheck } from "lucide-react";

export function ClientDashboardPage() {
  return (
    <div className="w-full space-y-6 animate-in fade-in zoom-in-95 duration-500">
       {/* Greeting */}
       <div>
          <h2 className="text-2xl font-bold text-slate-800">Xin chào, Văn A 👋</h2>
          <p className="text-slate-500 text-sm mt-1">Chúc bạn một ngày tốt lành tại CLM.</p>
       </div>

       {/* Billing Alert Card */}
       <div className="glass-card bg-gradient-to-br from-rose-50 to-white/80 border-rose-100 p-6 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 p-4 opacity-5">
             <AlertCircle size={100} className="text-rose-500" />
          </div>
          <div className="flex items-center gap-2 mb-2">
             <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
             <h3 className="font-bold text-rose-600 text-[11px] tracking-widest uppercase">Cần thanh toán</h3>
          </div>
          <p className="text-slate-600 text-sm mb-4">Hóa đơn tháng 4/2026 đã chốt.</p>
          <div className="flex items-end gap-2 mb-6">
             <h2 className="text-4xl font-bold text-slate-800 tracking-tight">5,850<span className="text-2xl font-normal text-slate-400">K</span></h2>
          </div>
          <button className="w-full py-4 bg-rose-500 text-white font-bold rounded-2xl shadow-xl shadow-rose-500/30 hover:bg-rose-600 flex justify-center items-center gap-2 transition-transform active:scale-95 text-sm uppercase tracking-wide">
             Thanh toán ngay <ArrowRight size={18} />
          </button>
       </div>

       {/* Utility Indexes */}
       <h3 className="font-bold text-slate-800 text-lg mt-8 mb-4">Chỉ số sử dụng</h3>
       <div className="grid grid-cols-2 gap-4">
          <div className="glass-card p-5">
             <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
                <Zap className="text-amber-500" size={24} />
             </div>
             <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Điện năng</p>
             <h3 className="font-bold text-2xl text-slate-800">120 <span className="text-sm font-normal text-slate-400">kWh</span></h3>
          </div>
          <div className="glass-card p-5">
             <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                <Droplets className="text-blue-500" size={24} />
             </div>
             <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Nước sinh hoạt</p>
             <h3 className="font-bold text-2xl text-slate-800">15 <span className="text-sm font-normal text-slate-400">Khối</span></h3>
          </div>
       </div>

       {/* Quick Actions */}
       <div className="glass-card p-5 mt-6 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                <ShieldCheck className="text-emerald-500" size={26} />
             </div>
             <div>
                <h3 className="font-bold text-slate-800 text-[15px]">Hợp đồng điện tử</h3>
                <p className="text-slate-400 text-xs mt-1 font-medium">Còn hạn tới 12/2026</p>
             </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
             <ArrowRight className="text-slate-400" size={18} />
          </div>
       </div>
    </div>
  );
}
