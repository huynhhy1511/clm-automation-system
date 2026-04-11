import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { FileText, Calendar, Trash2, CheckCircle } from "lucide-react";

type Contract = {
  id: number;
  tenant_id: number;
  room_id: number;
  gia_thue_chot: number;
  tien_coc: number;
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  trang_thai: string;
};

export function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [handingOver, setHandingOver] = useState<number | null>(null);

  const fetchContracts = async () => {
    try {
      const res = await api.get("/contracts/");
      setContracts(res.data);
    } catch (err) {
      console.error("Lỗi lấy danh sách hợp đồng", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm(`Xóa Hợp Đồng #${id}?\n\n⚠️ Phòng sẽ được đặt lại về trạng thái Trống. Hành động không thể hoàn tác.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/contracts/${id}`);
      fetchContracts();
    } catch (error: any) {
      alert(error.response?.data?.detail || "Xóa thất bại.");
    } finally {
      setDeleting(null);
    }
  };

  const handleHandover = async (contract: Contract) => {
    if (!window.confirm(`Xác nhận bàn giao phòng cho Hợp Đồng #${contract.id}?\n\nHệ thống sẽ:\n- Tạo tài khoản đăng nhập cho khách\n- Gửi thông báo Telegram\n- Gửi email tài khoản cho khách`)) return;
    setHandingOver(contract.id);
    try {
      await api.post(`/rooms/${contract.room_id}/handover`);
      alert("✅ Bàn giao thành công! Đã gửi thông báo Telegram và email cho khách.");
      fetchContracts();
    } catch (error: any) {
      alert(error.response?.data?.detail || "Bàn giao thất bại.");
    } finally {
      setHandingOver(null);
    }
  };

  return (
    <div className="w-full relative h-full">
      <div className="flex justify-between items-center mb-8">
         <h2 className="text-3xl font-black text-slate-800">Quản lý Hợp Đồng</h2>
         <span className="text-sm text-slate-400">{contracts.length} hợp đồng</span>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Đang tải danh sách...</div>
      ) : contracts.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center">
            <FileText className="text-slate-300 mb-4" size={48} />
            <h3 className="text-xl font-bold text-slate-700 mb-2">Chưa có hợp đồng nào</h3>
            <p className="text-slate-500 mb-6">Bạn sẽ thấy hợp đồng mới ở đây ngay khi yêu cầu duyệt phòng hoàn tất.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {contracts.map((contract) => (
            <div key={contract.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
               <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                         <FileText className="text-primary" size={24} />
                     </div>
                     <div>
                        <h3 className="text-xl font-black text-slate-800">Hợp Đồng #{contract.id}</h3>
                        <p className="text-slate-500 font-medium text-sm flex items-center gap-1">
                           <Calendar size={14} /> Từ {contract.ngay_bat_dau} đến {contract.ngay_ket_thuc}
                        </p>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      contract.trang_thai === "Hiệu lực" ? "text-emerald-600 bg-emerald-50 border-emerald-200" :
                      contract.trang_thai === "Chờ bàn giao" ? "text-amber-600 bg-amber-50 border-amber-200" :
                      "text-slate-500 bg-slate-50 border-slate-200"
                    }`}>
                      {contract.trang_thai}
                    </span>
                    {contract.trang_thai === "Chờ bàn giao" && (
                      <button
                        disabled={handingOver === contract.id}
                        onClick={() => handleHandover(contract)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                        title="Bàn giao phòng"
                      >
                        {handingOver === contract.id ? 'Đang xử lý...' : <><CheckCircle size={14} /> Bàn giao</>}
                      </button>
                    )}
                    <button
                      disabled={deleting === contract.id}
                      onClick={() => handleDelete(contract.id)}
                      className="p-2 rounded-xl bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-100 transition-colors"
                      title="Xóa hợp đồng"
                    >
                      {deleting === contract.id ? '...' : <Trash2 size={16} />}
                    </button>
                  </div>
               </div>
               
               <div className="grid grid-cols-3 gap-3 mt-4">
                 <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex flex-col items-center justify-center">
                    <span className="text-slate-400 text-xs font-bold uppercase mb-1">Phòng</span>
                    <span className="font-black text-lg text-slate-800">#{contract.room_id}</span>
                 </div>
                 <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex flex-col items-center justify-center">
                    <span className="text-slate-400 text-xs font-bold uppercase mb-1">Giá Thuê</span>
                    <span className="font-black text-lg text-primary">{contract.gia_thue_chot.toLocaleString()}đ</span>
                 </div>
                 <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex flex-col items-center justify-center">
                    <span className="text-slate-400 text-xs font-bold uppercase mb-1">Tiền Cọc</span>
                    <span className="font-black text-lg text-green-600">{contract.tien_coc.toLocaleString()}đ</span>
                 </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
