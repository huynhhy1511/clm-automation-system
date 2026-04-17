import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { AlertTriangle, Clock, Trash2, CheckCircle } from "lucide-react";

type Incident = {
  id: number;
  room_id: number;
  loai_su_co: string;
  muc_do_khan_cap: string;
  mo_ta: string;
  ngay_bao_cao: string;
  trang_thai: string;
  anh_su_co?: string[];
};

export function AdminIncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIncidents = async () => {
    try {
      const res = await api.get("/client/incidents/"); // Backend filters correctly
      setIncidents(res.data);
    } catch (err) {
      console.error("Lỗi lấy sự cố", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleStatusUpdate = async (id: number) => {
    try {
      await api.patch(`/client/incidents/${id}/status`);
      fetchIncidents();
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái", err);
      alert("Không thể cập nhật trạng thái.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa báo cáo sự cố này?")) return;
    try {
      await api.delete(`/client/incidents/${id}`);
      fetchIncidents();
    } catch (err) {
      console.error("Lỗi xóa sự cố", err);
      alert("Không thể xóa sự cố.");
    }
  };

  return (
    <div className="w-full relative h-full">
      <div className="flex justify-between items-center mb-8">
         <h2 className="text-3xl font-black text-slate-800">Quản lý Báo Cáo Sự Cố</h2>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Đang tải danh sách...</div>
      ) : incidents.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center">
            <AlertTriangle className="text-slate-300 mb-4" size={48} />
            <h3 className="text-xl font-bold text-slate-700 mb-2">Không có sự cố nào</h3>
            <p className="text-slate-500 mb-6">Mọi thứ đang hoạt động rất tốt.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {incidents.map((incident) => (
            <div key={incident.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
               <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center">
                         <AlertTriangle className="text-rose-500" size={24} />
                     </div>
                     <div>
                        <h3 className="text-xl font-black text-slate-800">Sự cố Phòng {incident.room_id}</h3>
                        <p className="text-slate-500 font-medium text-sm flex items-center gap-1">
                           <Clock size={14} /> Báo cáo: {new Date(incident.ngay_bao_cao).toLocaleDateString()}
                        </p>
                     </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    incident.muc_do_khan_cap === "Khẩn cấp" ? "text-rose-600 bg-rose-50 border-rose-200" :
                    "text-amber-600 bg-amber-50 border-amber-200"
                  }`}>
                    {incident.muc_do_khan_cap}
                  </span>
               </div>
               
               <div className="bg-slate-50 rounded-2xl p-4 mt-6 border border-slate-100">
                  <div className="mb-2">
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phân loại</span>
                     <p className="font-bold text-slate-700">{incident.loai_su_co}</p>
                  </div>
                  <div>
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mô tả</span>
                     <p className="text-sm font-medium text-slate-600">{incident.mo_ta}</p>
                  </div>
                  {incident.anh_su_co && incident.anh_su_co.length > 0 && (
                    <div className="mt-4">
                       <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hình ảnh hiện trường ({incident.anh_su_co.length})</span>
                       <div className="grid grid-cols-3 gap-2 mt-2">
                          {incident.anh_su_co.map((img, idx) => (
                            <img 
                              key={idx}
                              src={img} 
                              alt={`Sự cố ${idx + 1}`} 
                              className="aspect-square w-full object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(img, '_blank')}
                            />
                          ))}
                       </div>
                    </div>
                  )}
               </div>

               <div className="mt-4 flex justify-between items-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    incident.trang_thai === "Đã xử lý" ? "text-emerald-600 bg-emerald-50 border-emerald-200" :
                    "text-slate-500 bg-slate-100 border-slate-300"
                  }`}>
                    {incident.trang_thai}
                  </span>
                  <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleStatusUpdate(incident.id)}
                        className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${
                          incident.trang_thai === "Đã tiếp nhận" 
                          ? "bg-slate-900 text-white hover:bg-slate-800" 
                          : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        }`}
                      >
                         <CheckCircle size={16} />
                         {incident.trang_thai === "Đã tiếp nhận" ? "Xử lý ngay" : "Đã xong"}
                      </button>
                      <button 
                        onClick={() => handleDelete(incident.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        title="Xóa sự cố"
                      >
                          <Trash2 size={20} />
                      </button>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
