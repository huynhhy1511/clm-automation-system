import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Zap, Droplets, User, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
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
};

type RowData = {
  new_electricity: string;
  new_water: string;
  submitting: boolean;
  success: boolean;
};

const ELEC_PRICE = 3500;
const WATER_PRICE_PER_PERSON = 100000;
const N8N_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || "http://localhost:5679/webhook/chot-dien-nuoc";

export function BillingPage() {
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Record<number, RowData>>({});

  const fetchActiveRooms = async () => {
    try {
      const res = await api.get("/bills/active-rooms");
      setActiveRooms(res.data);
      
      // Initialize row states
      const initialRows: Record<number, RowData> = {};
      res.data.forEach((room: ActiveRoom) => {
        initialRows[room.room_id] = {
          new_electricity: "",
          new_water: "",
          submitting: false,
          success: false,
        };
      });
      setRows(initialRows);
    } catch (err) {
      console.error("Lỗi lấy danh sách phòng hoạt động", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveRooms();
  }, []);

  const handleInputChange = (roomId: number, field: keyof RowData, value: string) => {
    setRows(prev => ({
      ...prev,
      [roomId]: { ...prev[roomId], [field]: value, success: false }
    }));
  };

  const calculateTotal = (room: ActiveRoom) => {
    const row = rows[room.room_id];
    if (!row) return 0;

    const newElec = parseFloat(row.new_electricity) || room.prev_electricity;

    const elecBill = (newElec - room.prev_electricity) * ELEC_PRICE;
    const waterBill = room.so_nguoi * WATER_PRICE_PER_PERSON;
    
    return Math.max(0, elecBill) + waterBill + room.room_price;
  };

  const handleFinalize = async (room: ActiveRoom) => {
    const row = rows[room.room_id];
    const newElec = parseFloat(row.new_electricity);
    const newWater = parseFloat(row.new_water);

    if (isNaN(newElec) || isNaN(newWater)) {
      alert("Vui lòng nhập đầy đủ chỉ số mới.");
      return;
    }

    if (newElec < room.prev_electricity || newWater < room.prev_water) {
      alert("Chỉ số mới không được nhỏ hơn chỉ số cũ.");
      return;
    }

    setRows(prev => ({ ...prev, [room.room_id]: { ...prev[room.room_id], submitting: true } }));

    const totalAmount = calculateTotal(room);

    const payload = {
      phong: room.ma_phong,
      hoTen: room.tenant_name,
      email: room.tenant_email,
      chiSoDienCu: room.prev_electricity,
      chiSoDienMoi: newElec,
      chiSoNuocCu: room.prev_water,
      chiSoNuocMoi: newWater,
      soDien: newElec - room.prev_electricity,
      soNuoc: newWater - room.prev_water,
      tongTien: totalAmount,
      roomId: room.room_id,
      thangNam: new Date().toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })
    };

    try {
      // Gửi TRỰC TIẾP sang n8n
      await axios.post(N8N_URL, payload);
      
      setRows(prev => ({ 
        ...prev, 
        [room.room_id]: { ...prev[room.room_id], submitting: false, success: true } 
      }));
    } catch (err) {
      console.error("Lỗi gửi n8n", err);
      alert("Gửi n8n thất bại. Vui lòng kiểm tra cấu hình Webhook.");
      setRows(prev => ({ ...prev, [room.room_id]: { ...prev[room.room_id], submitting: false } }));
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-primary" size={48} /></div>;

  return (
    <div className="w-full h-full p-4 overflow-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Chốt Điện Nước Hàng Tháng</h2>
          <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-500" /> Dashboard quản lý và gửi hóa đơn tự động qua n8n.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-bottom border-slate-100">
              <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">Phòng & Khách</th>
              <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">Chỉ số Điện (kWh)</th>
              <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">Chỉ số Nước (m3)</th>
              <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">Số người & Giá phòng</th>
              <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider text-right">Dự tính Tổng</th>
              <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activeRooms.map((room) => {
              const row = rows[room.room_id] || {};
              const total = calculateTotal(room);
              const isInvalid = (parseFloat(row.new_electricity) < room.prev_electricity) || (parseFloat(row.new_water) < room.prev_water);

              return (
                <tr key={room.room_id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <User size={24} />
                      </div>
                      <div>
                        <div className="font-black text-slate-800 text-lg">{room.ma_phong}</div>
                        <div className="text-slate-500 text-sm font-medium">{room.tenant_name}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-6">
                    <div className="flex flex-col gap-2">
                      <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-widest"><Zap size={10} /> Cũ: <span className="text-slate-600 font-black">{room.prev_electricity}</span></div>
                      <input 
                        type="number" 
                        placeholder="Số mới..."
                        value={row.new_electricity}
                        onChange={(e) => handleInputChange(room.room_id, 'new_electricity', e.target.value)}
                        className={`w-32 px-3 py-2 bg-slate-50 border rounded-xl focus:outline-none focus:ring-4 transition-all font-bold text-slate-700 ${isInvalid && parseFloat(row.new_electricity) < room.prev_electricity ? 'border-rose-300 ring-rose-100' : 'border-slate-200 focus:ring-primary/10 focus:border-primary'}`}
                      />
                    </div>
                  </td>

                  <td className="px-6 py-6">
                    <div className="flex flex-col gap-2">
                      <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-widest"><Droplets size={10} /> Cũ: <span className="text-slate-600 font-black">{room.prev_water}</span></div>
                      <input 
                        type="number" 
                        placeholder="Số mới..."
                        value={row.new_water}
                        onChange={(e) => handleInputChange(room.room_id, 'new_water', e.target.value)}
                        className={`w-32 px-3 py-2 bg-slate-50 border rounded-xl focus:outline-none focus:ring-4 transition-all font-bold text-slate-700 ${isInvalid && parseFloat(row.new_water) < room.prev_water ? 'border-rose-300 ring-rose-100' : 'border-slate-200 focus:ring-primary/10 focus:border-primary'}`}
                      />
                    </div>
                  </td>

                  <td className="px-6 py-6">
                    <div className="flex flex-col gap-1">
                      <div className="text-sm font-bold text-slate-700">{room.so_nguoi} người</div>
                      <div className="text-xs text-slate-500 font-medium">{room.room_price.toLocaleString()}đ base</div>
                    </div>
                  </td>

                  <td className="px-6 py-6 text-right">
                    <div className="flex flex-col">
                       <span className="text-2xl font-black text-slate-900">{total.toLocaleString()}đ</span>
                       <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 self-end px-2 py-0.5 rounded-full mt-1 uppercase tracking-tighter">Tính theo người</span>
                    </div>
                  </td>

                  <td className="px-6 py-6">
                    <div className="flex justify-center">
                      {row.success ? (
                        <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 animate-in zoom-in-75 duration-300">
                          <CheckCircle2 size={20} /> Đã gửi n8n
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleFinalize(room)}
                          disabled={row.submitting || isInvalid || !row.new_electricity || !row.new_water}
                          className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-95"
                        >
                          {row.submitting ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18} /> Chốt & Gửi</>}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {activeRooms.length === 0 && (
          <div className="py-20 text-center">
             <AlertCircle size={48} className="text-slate-200 mx-auto mb-4" />
             <p className="text-slate-400 font-bold">Không tìm thấy phòng nào đang thuê để chốt hóa đơn.</p>
          </div>
        )}
      </div>
    </div>
  );
}
