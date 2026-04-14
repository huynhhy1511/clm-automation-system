import { useState, useEffect } from "react";
import { ArrowUpRight, Home, ArrowRight, UserCircle, Calendar as CalendarIcon, IdCard } from "lucide-react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";

export function DashboardPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await api.get("/rooms/");
        setRooms(res.data);
      } catch (err) {
        console.error("Lỗi lấy danh sách phòng", err);
      }
    };

    const fetchContracts = async () => {
      try {
        const res = await api.get("/contracts/");
        setContracts(res.data);
      } catch (err) {
        console.error("Lỗi lấy danh sách hợp đồng", err);
      }
    };

    const fetchData = async () => {
      setLoading(true);
      await Promise.allSettled([fetchRooms(), fetchContracts()]);
      setLoading(false);
    };
    
    fetchData();
  }, []);

  const totalRooms = rooms.length;
  const emptyRooms = rooms.filter(r => r.trang_thai === "Trống").length;
  const expectedRevenue = contracts
    .filter(c => c.trang_thai === "Hiệu lực")
    .reduce((sum, c) => sum + c.gia_thue_chot, 0);

  const activeContracts = contracts.filter(c => c.trang_thai === "Hiệu lực");

  return (
    <div className="w-full space-y-6">
      {/* Main Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="glass rounded-3xl p-6 group transition-transform">
            <div className="flex justify-between items-start mb-6">
               <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-orange-500 font-bold">$</span>
               </div>
               <div className="flex items-center text-emerald-500 text-sm font-bold bg-emerald-50 px-2 py-1 rounded-full">
                  <ArrowUpRight size={14} className="mr-1" />
                  Đang thu
               </div>
            </div>
            <p className="text-slate-500 font-medium text-sm mb-1 uppercase text-[11px] tracking-wider">THU DỰ KIẾN THÁNG NÀY</p>
            <h2 className="text-3xl font-bold text-slate-800">
               {loading ? "..." : `${expectedRevenue.toLocaleString()} đ`}
            </h2>
         </div>

         <div className="glass rounded-3xl p-6 group transition-transform">
            <div className="flex justify-between items-start mb-6">
               <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Home className="text-blue-500" size={20} />
               </div>
            </div>
            <p className="text-slate-500 font-medium text-sm mb-1 uppercase text-[11px] tracking-wider">PHÒNG TRỐNG</p>
            <div className="flex items-end gap-2">
               <h2 className="text-3xl font-bold text-slate-800">
                  {loading ? "..." : emptyRooms}
                  <span className="text-lg font-normal text-slate-400">/{totalRooms || 0}</span>
               </h2>
            </div>
         </div>
         
         {/* CTA Card (Setup next week) */}
         <div className="rounded-3xl p-6 bg-gradient-to-br from-primary to-emerald-600 text-white relative overflow-hidden flex flex-col justify-between group cursor-pointer shadow-lg shadow-primary/20">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
            <div>
               <p className="text-white/80 text-sm font-bold tracking-wider uppercase mb-2 text-[10px]">NHẮC NHỞ</p>
               <h3 className="text-2xl font-bold leading-tight mb-4 tracking-tight">Chốt điện nước<br/>cho tháng này</h3>
            </div>
            <Link to="/admin/billing" className="bg-white/20 hover:bg-white text-white hover:text-primary transition-colors rounded-full px-5 py-3 w-max text-sm font-bold flex items-center gap-2 backdrop-blur-md">
               Tính tiền ngay <ArrowRight size={16} />
            </Link>
         </div>
      </div>

      {/* Contracts / Handover Section */}
      <div className="glass rounded-3xl p-6 min-h-[400px]">
         <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800">Hợp đồng Khách đang thuê</h3>
            <span className="text-sm font-medium text-slate-500">{activeContracts.length} Hợp đồng</span>
         </div>

         {loading ? (
             <div className="text-center py-20 text-slate-400">Đang tải biểu mẫu...</div>
         ) : activeContracts.length === 0 ? (
             <div className="text-center py-20 text-slate-400">Chưa có hợp đồng nào đang hiệu lực.</div>
         ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeContracts.map(contract => {
                    const tenant = contract.tenant || {};
                    const room = contract.room || {};
                    return (
                        <div key={contract.id} className="bg-white border border-slate-200 rounded-3xl p-5 hover:shadow-lg transition-shadow duration-300 relative overflow-hidden group">
                           {/* Decorative background element */}
                           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                           
                           <div className="flex items-start gap-4 mb-5">
                              {tenant.anh_khuon_mat ? (
                                  <img src={tenant.anh_khuon_mat} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover shadow-sm border border-slate-100" />
                              ) : (
                                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                                      <UserCircle size={32} />
                                  </div>
                              )}
                              
                              <div className="flex-1 min-w-0">
                                 <h4 className="text-lg font-black text-slate-800 truncate">{tenant.ho_ten || 'N/A'}</h4>
                                 <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mt-1">
                                     <IdCard size={14} className="text-primary/70" /> {tenant.so_cccd || 'N/A'}
                                 </div>
                                 <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mt-1">
                                     <CalendarIcon size={14} className="text-emerald-500/70" /> {tenant.ngay_sinh || 'N/A'}
                                 </div>
                              </div>
                           </div>
                           
                           <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                              <div>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mã Phòng</p>
                                 <p className="font-black text-slate-800">{room.ma_phong || `P${contract.room_id}`}</p>
                              </div>
                              <div>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Chi phí</p>
                                 <p className="font-bold text-primary">{contract.gia_thue_chot.toLocaleString()}đ</p>
                              </div>
                           </div>
                           
                           <div className="mt-4 pt-4 border-t border-slate-100">
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Thời hạn Hợp đồng</p>
                               <div className="flex items-center justify-between text-xs font-medium text-slate-600 bg-slate-50 px-3 py-2 rounded-xl">
                                  <span>{contract.ngay_bat_dau}</span>
                                  <ArrowRight size={12} className="text-slate-400" />
                                  <span>{contract.ngay_ket_thuc}</span>
                               </div>
                           </div>
                        </div>
                    );
                })}
             </div>
         )}
      </div>
    </div>
  );
}
