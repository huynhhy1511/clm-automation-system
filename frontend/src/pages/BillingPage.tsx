import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Zap, Droplets, User, Send, CheckCircle2, AlertCircle, Loader2, FileText, Camera, PlusCircle, X } from "lucide-react";
import axios from "axios";

type ActiveRoom = {
  room_id: number;
  ma_phong: string;
  tenant_name: string;
  tenant_email: string;
  so_nguoi: number;
  room_price: number;
  prev_electricity: number;
  prev_water: number;
  is_completed: boolean;
  bill_id?: number | null;
  pdf_link?: string | null;
  current_total?: number | null;
};

type RowState = {
  new_electricity: string;
  submitting: boolean;
  showManual: boolean;
};

const ELEC_PRICE = 3500;
const N8N_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || "http://localhost:5679/webhook/chot-dien-nuoc";

export function BillingPage() {
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [rowStates, setRowStates] = useState<Record<number, RowState>>({});

  const fetchActiveRooms = async () => {
    try {
      const res = await api.get("/bills/active-rooms");
      setActiveRooms(res.data);
      
      const states: Record<number, RowState> = {};
      res.data.forEach((room: ActiveRoom) => {
        states[room.room_id] = {
          new_electricity: "",
          submitting: false,
          showManual: false,
        };
      });
      setRowStates(states);
    } catch (err) {
      console.error("Lỗi lấy danh sách phòng", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveRooms();
  }, []);

  const handleInputChange = (roomId: number, value: string) => {
    setRowStates(prev => ({
      ...prev,
      [roomId]: { ...prev[roomId], new_electricity: value }
    }));
  };

  const toggleManual = (roomId: number) => {
    setRowStates(prev => ({
      ...prev,
      [roomId]: { ...prev[roomId], showManual: !prev[roomId].showManual }
    }));
  };

  const handleFinalize = async (room: ActiveRoom) => {
    const state = rowStates[room.room_id];
    const newElec = parseFloat(state.new_electricity);

    if (isNaN(newElec)) {
      alert("Vui lòng nhập chỉ số điện mới.");
      return;
    }

    setRowStates(prev => ({ ...prev, [room.room_id]: { ...prev[room.room_id], submitting: true } }));

    const totalAmount = Math.max(0, (newElec - room.prev_electricity) * ELEC_PRICE) + room.room_price;

    const payload = {
      phong: room.ma_phong,
      hoTen: room.tenant_name,
      email: room.tenant_email,
      chiSoDienCu: room.prev_electricity,
      chiSoDienMoi: newElec,
      chiSoNuocCu: 0,
      chiSoNuocMoi: 0,
      soDien: newElec - room.prev_electricity,
      soNuoc: 0,
      tongTien: totalAmount,
      roomId: room.room_id,
      thangNam: new Date().toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })
    };

    try {
      await axios.post(N8N_URL, payload);
      // Refresh after success
      await fetchActiveRooms();
    } catch (err) {
      console.error("Lỗi gửi n8n", err);
      alert("Gửi n8n thất bại.");
      setRowStates(prev => ({ ...prev, [room.room_id]: { ...prev[room.room_id], submitting: false } }));
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-primary" size={48} /></div>;

  const completedCount = activeRooms.filter(r => r.is_completed).length;
  const pendingCount = activeRooms.length - completedCount;

  return (
    <div className="w-full h-full p-4 overflow-auto bg-slate-50/30">
      <div className="flex justify-between items-end mb-8 px-2">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Giám Sát Chốt Điện</h2>
          <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
             Hệ thống tự động đồng bộ từ Bot Telegram.
          </p>
        </div>
        <div className="flex gap-4">
           <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đã Xong</div>
              <div className="text-2xl font-black text-emerald-600">{completedCount}</div>
           </div>
           <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chờ Ảnh</div>
              <div className="text-2xl font-black text-rose-500">{pendingCount}</div>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-8 py-6 text-sm font-bold text-slate-500 uppercase tracking-wider">Phòng & Khách</th>
              <th className="px-8 py-6 text-sm font-bold text-slate-500 uppercase tracking-wider">Trạng Thái AI</th>
              <th className="px-8 py-6 text-sm font-bold text-slate-500 uppercase tracking-wider">Lịch sử cuối</th>
              <th className="px-8 py-6 text-sm font-bold text-slate-500 uppercase tracking-wider text-right">Chi tiết tháng này</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activeRooms.map((room) => {
              const state = rowStates[room.room_id] || {};
              
              return (
                <tr key={room.room_id} className="hover:bg-slate-50/20 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${room.is_completed ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-400'}`}>
                        <User size={24} />
                      </div>
                      <div>
                        <div className="font-black text-slate-800 text-lg">{room.ma_phong}</div>
                        <div className="text-slate-500 text-xs font-bold">{room.tenant_name}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-8 py-6">
                    {room.is_completed ? (
                      <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 w-fit px-4 py-2 rounded-xl border border-emerald-100">
                        <CheckCircle2 size={18} /> Đã chốt AI
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-400 font-bold bg-slate-50 w-fit px-4 py-2 rounded-xl border border-slate-100 italic">
                        <Camera size={18} /> Chờ ảnh Tele...
                      </div>
                    )}
                  </td>

                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Zap size={10} /> Số cũ: <span className="text-slate-700 font-black">{room.prev_electricity}</span></div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Droplets size={10} /> Tiền nước: <span className="text-slate-700">Gộp/Phí</span></div>
                    </div>
                  </td>

                  <td className="px-8 py-6 text-right">
                    {room.is_completed ? (
                      <div className="flex flex-col items-end gap-2">
                         <span className="text-2xl font-black text-slate-900">{room.current_total?.toLocaleString()}đ</span>
                         <a 
                           href={room.pdf_link || "#"} 
                           target="_blank" 
                           rel="noreferrer"
                           className="flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-all"
                         >
                            <FileText size={12} /> XEM HÓA ĐƠN PDF
                         </a>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end gap-3">
                        {state.showManual ? (
                          <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
                            <input 
                              type="number" 
                              placeholder="Số điện mới..."
                              value={state.new_electricity}
                              onChange={(e) => handleInputChange(room.room_id, e.target.value)}
                              className="w-28 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-bold"
                            />
                            <button 
                              onClick={() => handleFinalize(room)}
                              disabled={state.submitting || !state.new_electricity}
                              className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 transition-all disabled:opacity-20 active:scale-95"
                            >
                               {state.submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            </button>
                            <button onClick={() => toggleManual(room.room_id)} className="text-slate-400 hover:text-rose-500 transition-colors">
                               <X size={20} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => toggleManual(room.room_id)}
                            className="text-[10px] font-bold text-slate-400 hover:text-primary transition-all flex items-center gap-1 group"
                          >
                            <PlusCircle size={14} className="group-hover:rotate-90 transition-transform" /> CHỐT TAY (DỰ PHÒNG)
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {activeRooms.length === 0 && (
          <div className="py-24 text-center">
             <AlertCircle size={64} className="text-slate-200 mx-auto mb-6" />
             <p className="text-slate-400 font-bold text-xl">Hiện chưa có phòng nào đang thuê.</p>
          </div>
        )}
      </div>

      <div className="mt-8 bg-amber-50 border border-amber-100 rounded-3xl p-6 flex gap-4 items-start">
         <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
            <AlertCircle size={20} />
         </div>
         <div>
            <h4 className="font-black text-amber-800 uppercase tracking-wider text-sm mb-1">Hướng dẫn vận hành</h4>
            <p className="text-amber-700 text-sm font-medium leading-relaxed">
              Bạn chỉ cần chụp ảnh đồng hồ điện và gửi vào Telegram kèm Caption là mã phòng (VD: P101). AI sẽ tự động đọc số, tính tiền, tạo PDF hóa đơn và gửi Email cho khách hàng. Danh sách trên sẽ tự động cập nhật ngay khi AI xử lý xong.
            </p>
         </div>
      </div>
    </div>
  );
}
