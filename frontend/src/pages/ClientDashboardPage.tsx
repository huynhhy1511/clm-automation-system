import React, { useState, useEffect } from "react";
import { 
  AlertCircle, 
  ArrowRight, 
  Zap, 
  Droplets, 
  ShieldCheck, 
  Clock, 
  FileText, 
  Heart, 
  Trash2, 
  VolumeX, 
  ExternalLink 
} from "lucide-react";

export function ClientDashboardPage() {
  const [tenant, setTenant] = useState<any>(null);
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // Fetch Tenant Info
        const tenantRes = await fetch("http://localhost:8000/api/tenants/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const tenantData = await tenantRes.json();
        setTenant(tenantData);

        // Fetch Latest Bill
        const billsRes = await fetch("http://localhost:8000/api/bills/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const billsData = await billsRes.json();
        if (billsData.length > 0) {
          // Lấy hóa đơn mới nhất (theo ID hoặc tháng)
          setBill(billsData.sort((a: any, b: any) => b.id - a.id)[0]);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-700">
      {/* Dynamic Greeting */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            {getGreeting()}, <span className="text-indigo-600">{tenant?.ho_ten || "Khách"}</span> 👋
          </h2>
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-1">
            <Clock size={14} /> {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* Bill Highlight Section */}
      {bill && bill.trang_thai === "Chưa thanh toán" ? (
        <div className="glass-card bg-gradient-to-br from-rose-500 to-rose-600 text-white border-0 p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
             <AlertCircle size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
               <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
               <h3 className="font-bold text-rose-100 text-[11px] tracking-widest uppercase">Hóa đơn cần thanh toán</h3>
            </div>
            <p className="text-rose-50 text-sm mb-4">Kỳ hóa đơn: {bill.thang_nam}</p>
            <div className="flex items-end gap-1 mb-6">
               <h2 className="text-4xl font-bold tracking-tight">{bill.tong_tien.toLocaleString('vi-VN')}</h2>
               <span className="text-lg font-medium text-rose-200 pb-1">VNĐ</span>
            </div>
            <button 
              onClick={() => window.location.href = '#/billing'}
              className="w-full py-4 bg-white text-rose-600 font-bold rounded-2xl shadow-xl hover:bg-rose-50 flex justify-center items-center gap-2 transition-all active:scale-95 text-sm uppercase tracking-wide"
            >
               Thanh toán ngay <ArrowRight size={18} />
            </button>
          </div>
        </div>
      ) : bill ? (
        <div className="glass-card bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <ShieldCheck size={120} />
          </div>
          <div className="relative z-10 text-center py-4">
             <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
               <ShieldCheck size={32} />
             </div>
             <h3 className="text-lg font-bold">Hóa đơn đã được thanh toán</h3>
             <p className="text-indigo-100 text-sm mt-1">Cảm ơn bạn đã thanh toán đúng hạn cho kỳ {bill.thang_nam}</p>
          </div>
        </div>
      ) : (
        <div className="glass-card p-6 text-center text-slate-400">
          Chưa có hóa đơn nào được tạo.
        </div>
      )}

      {/* Consumption Grid */}
      <h3 className="font-bold text-slate-800 text-lg mt-8 mb-4">Chỉ số sử dụng</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5 hover:border-amber-200 transition-colors group">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Zap className="text-amber-500" size={24} />
          </div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Điện (kWh)</p>
          <h3 className="font-bold text-2xl text-slate-800">
            {bill ? (bill.chi_so_dien_moi - bill.chi_so_dien_cu) : 0}
            <span className="text-xs font-normal text-slate-400 ml-1">kWh</span>
          </h3>
          <p className="text-[10px] text-slate-400 mt-2">ID: {bill?.chi_so_dien_moi || 0}</p>
        </div>
        <div className="glass-card p-5 hover:border-blue-200 transition-colors group">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Droplets className="text-blue-500" size={24} />
          </div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Nước (m3)</p>
          <h3 className="font-bold text-2xl text-slate-800">
            {bill ? (bill.chi_so_nuoc_moi - bill.chi_so_nuoc_cu) : 0}
            <span className="text-xs font-normal text-slate-400 ml-1">Khối</span>
          </h3>
          <p className="text-[10px] text-slate-400 mt-2">ID: {bill?.chi_so_nuoc_moi || 0}</p>
        </div>
      </div>

      {/* Digital Contract Section */}
      <div className="glass-card p-5 mt-6 flex justify-between items-center group cursor-pointer hover:bg-slate-50 transition-all border-l-4 border-l-indigo-500">
        <div className="flex items-center gap-4">
           <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 group-hover:bg-indigo-100 transition-colors">
              <FileText className="text-indigo-600" size={26} />
           </div>
           <div>
              <h3 className="font-bold text-slate-800 text-[15px]">Hợp đồng & Tài liệu</h3>
              <p className="text-indigo-600 text-xs mt-1 font-medium flex items-center gap-1">
                Xem chi tiết <ExternalLink size={12} />
              </p>
           </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:translate-x-1 transition-transform">
           <ArrowRight className="text-slate-400" size={18} />
        </div>
      </div>

      {/* House Rules Section - Mới thêm */}
      <h3 className="font-bold text-slate-800 text-lg mt-10 mb-4">Quy định phòng trọ 📋</h3>
      <div className="grid grid-cols-1 gap-3">
        <RuleItem 
          icon={<Clock className="text-blue-500" size={18} />} 
          title="Thời gian thanh toán" 
          desc="Hợp đồng chốt từ mùng 1-5 hàng tháng." 
        />
        <RuleItem 
          icon={<VolumeX className="text-rose-500" size={18} />} 
          title="Giờ giới nghiêm" 
          desc="Vui lòng giữ yên lặng sau 23:00 hàng ngày." 
        />
        <RuleItem 
          icon={<Trash2 className="text-emerald-500" size={18} />} 
          title="Vệ sinh chung" 
          desc="Bỏ rác đúng nơi quy định, giữ sạch hành lang." 
        />
        <RuleItem 
          icon={<Heart className="text-pink-500" size={18} />} 
          title="Gìn giữ tài sản" 
          desc="Bảo vệ cơ sở vật chất và thiết bị trong phòng." 
        />
      </div>
      
      {/* Footer support */}
      <div className="py-8 text-center">
        <p className="text-slate-400 text-xs">Phát triển bởi CLM Team • Phiên bản 2.0</p>
      </div>
    </div>
  );
}

function RuleItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 items-start">
      <div className="mt-0.5">{icon}</div>
      <div>
        <h4 className="text-sm font-bold text-slate-700">{title}</h4>
        <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
