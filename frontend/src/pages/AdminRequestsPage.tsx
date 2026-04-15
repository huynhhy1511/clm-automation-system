import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { FileText, UserPlus, Trash2 } from "lucide-react";

export function AdminRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get("/booking-requests/");
      setRequests(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!window.confirm("Bấm OK để duyệt. Hệ thống sẽ tự động gửi Email n8n cho khách hàng này!")) return;
    setActionLoading(id);
    try {
      await api.post(`/booking-requests/${id}/approve`);
      alert("Đã duyệt thành công! Hợp đồng, Webhook và Tài khoản đã xong.");
      fetchRequests();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.detail || "Duyệt thất bại.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Xóa yêu cầu này? Hành động không thể hoàn tác.")) return;
    setActionLoading(id);
    try {
      await api.delete(`/booking-requests/${id}`);
      fetchRequests();
    } catch (error: any) {
      alert(error.response?.data?.detail || "Xóa thất bại.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="w-full relative h-full">
      <div className="flex justify-between items-center mb-8">
         <h2 className="text-3xl font-black text-slate-800">Yêu cầu đặt phòng</h2>
         <span className="text-sm text-slate-400">{requests.length} yêu cầu</span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
           <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-sm uppercase">
              <tr>
                 <th className="px-6 py-4 tracking-wider">Khách hàng</th>
                 <th className="px-6 py-4 tracking-wider">Phòng / Email</th>
                 <th className="px-6 py-4 tracking-wider">Thời hạn</th>
                 <th className="px-6 py-4 tracking-wider">Hồ sơ CCCD</th>
                 <th className="px-6 py-4 tracking-wider">Trạng thái</th>
                 <th className="px-6 py-4 tracking-wider text-right">Thao tác</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">Đang tải...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">Không có yêu cầu thuê nào.</td></tr>
              ) : requests.map(req => (
                 <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                       <div className="font-bold text-slate-800">{req.ho_ten}</div>
                       <div className="text-slate-500 text-sm">{req.sdt}</div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="font-bold text-primary">Phòng #{req.room_id}</div>
                       <div className="text-slate-500 text-sm">{req.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                       {req.ngay_bat_dau ? (
                         <div>
                           <div>Từ: <b>{req.ngay_bat_dau}</b></div>
                           <div>{req.so_thang_thue} tháng</div>
                         </div>
                       ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                        <div className="flex items-center gap-2">
                           {req.cccd_truoc && req.cccd_sau ? <span className="flex items-center text-emerald-500 font-medium gap-1"><FileText size={16}/> Đã đính kèm</span> : <span className="text-rose-400">Thiếu ảnh</span>}
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            req.trang_thai === 'Chờ duyệt' ? 'text-amber-500 bg-amber-50 border-amber-200' :
                            'text-emerald-500 bg-emerald-50 border-emerald-200'
                        }`}>{req.trang_thai}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-2">
                          {req.trang_thai === 'Chờ duyệt' && (
                              <button 
                               disabled={actionLoading === req.id}
                               onClick={() => handleApprove(req.id)}
                               className="px-4 py-2 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2"
                               >
                                 {actionLoading === req.id ? 'Đang xử lý...' : <><UserPlus size={16} /> Bàn giao</>}
                              </button>
                          )}
                          <button 
                           disabled={actionLoading === req.id}
                           onClick={() => handleDelete(req.id)}
                           className="px-3 py-2 bg-rose-50 text-rose-500 border border-rose-200 font-bold text-sm rounded-xl hover:bg-rose-100 transition-colors flex items-center gap-1"
                           >
                             <Trash2 size={15} />
                          </button>
                       </div>
                    </td>
                 </tr>
              ))}
           </tbody>
        </table>
      </div>
    </div>
  );
}
