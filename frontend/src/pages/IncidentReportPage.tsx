import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { AlertCircle, FileText, Send, X, ShieldAlert } from "lucide-react";

type Incident = {
  id: number;
  loai_su_co: string;
  muc_do_khan_cap: string;
  mo_ta: string;
  ngay_bao_cao: string;
  trang_thai: string;
};

export function IncidentReportPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    loai_su_co: "",
    muc_do_khan_cap: "Bình thường",
    mo_ta: "",
    anh_su_co: [] as string[]
  });

  const fetchIncidents = async () => {
    try {
      const res = await api.get("/client/incidents/"); // Backend filters by current_user token
      setIncidents(res.data);
    } catch (err) {
      console.error("Lỗi lấy danh sách sự cố", err);
      // Fallback cho local testing nếu ko có JWT
      if(localStorage.getItem('token') === 'admin-dev-token') {
          setIncidents([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/client/incidents/", formData);
      setShowModal(false);
      setFormData({ loai_su_co: "", muc_do_khan_cap: "Bình thường", mo_ta: "", anh_su_co: [] });
      fetchIncidents();
      alert("Đã tiếp nhận yêu cầu hỗ trợ. Ban Quản Lý sẽ liên hệ sớm!");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || "Lỗi khi gửi báo cáo.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const remaining = 3 - formData.anh_su_co.length;
      const filesToProcess = Array.from(files).slice(0, remaining);
      
      filesToProcess.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({
            ...prev,
            anh_su_co: [...prev.anh_su_co, reader.result as string]
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      anh_su_co: prev.anh_su_co.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="p-6 max-w-xl mx-auto pb-24 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-rose-500/10 text-rose-500 flex items-center justify-center rounded-2xl">
                 <ShieldAlert size={24} />
              </div>
              <div>
                 <h2 className="text-2xl font-black text-slate-800">Hỗ trợ & Sự cố</h2>
                 <p className="text-slate-500 font-medium text-sm">Gửi yêu cầu sửa chữa, khiếu nại</p>
              </div>
          </div>
      </div>
      
      <button onClick={() => setShowModal(true)} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
         <AlertCircle size={20} /> Báo cáo sự cố mới ngay
      </button>

      {loading ? (
          <div className="text-center py-10 text-slate-400">Đang tải lịch sử...</div>
      ) : incidents.length > 0 ? (
          <div className="space-y-4 mt-6">
             <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Lịch sử sự cố đã báo</h3>
             {incidents.map((incident) => (
                <div key={incident.id} className="glass-card p-5">
                   <div className="flex justify-between items-start mb-2">
                      <span className="font-black text-slate-700">{incident.loai_su_co}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                        incident.trang_thai === "Chờ xử lý" ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                      }`}>
                         {incident.trang_thai}
                      </span>
                   </div>
                   <p className="text-sm text-slate-600 mb-3 line-clamp-2">{incident.mo_ta}</p>
                   <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                      <span>{new Date(incident.ngay_bao_cao).toLocaleDateString()}</span>
                      <span className={incident.muc_do_khan_cap === "Khẩn cấp" ? "text-rose-500" : ""}>Mức độ: {incident.muc_do_khan_cap}</span>
                   </div>
                </div>
             ))}
          </div>
      ) : (
          <div className="glass-card p-8 text-center flex flex-col items-center mt-6">
              <FileText className="text-slate-300 mb-4" size={40} />
              <p className="text-sm text-slate-500 font-medium">Bạn chưa báo cáo sự cố nào.</p>
          </div>
      )}

      {/* modal create incident */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pb-0 sm:pb-4">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
           <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-sm relative z-10 shadow-2xl p-6 sm:p-8 animate-in slide-in-from-bottom-5 max-h-[90vh] overflow-y-auto">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-slate-800">Gửi Mô Tả Sự Cố</h3>
                  <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">
                     <X size={18} />
                  </button>
               </div>
               
               <form onSubmit={handleSubmit} className="space-y-4">
                   <div className="space-y-1.5 focus-within:text-primary">
                      <label className="text-sm font-bold text-slate-700">Loại sự cố</label>
                      <select required value={formData.loai_su_co} onChange={e=>setFormData({...formData, loai_su_co: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium">
                         <option value="">-- Chọn phân loại --</option>
                         <option value="Điện">Sự cố Điện (Chập chờn, mất điện)</option>
                         <option value="Nước">Sự cố Nước (Rò rỉ, mất nước)</option>
                         <option value="Nội thất">Hư hỏng Nội thất</option>
                         <option value="Khác">Vấn đề khác</option>
                      </select>
                   </div>
                   <div className="space-y-1.5 focus-within:text-primary">
                      <label className="text-sm font-bold text-slate-700">Mức độ tình hình</label>
                      <select required value={formData.muc_do_khan_cap} onChange={e=>setFormData({...formData, muc_do_khan_cap: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium">
                         <option value="Bình thường">Bình thường (Có thể chờ đợi)</option>
                         <option value="Khẩn cấp">Rất Khẩn cấp (Cần xử lý ngay)</option>
                      </select>
                   </div>
                   <div className="space-y-1.5 focus-within:text-primary">
                      <label className="text-sm font-bold text-slate-700">Mô tả chi tiết</label>
                      <textarea required value={formData.mo_ta} onChange={e=>setFormData({...formData, mo_ta: e.target.value})} className="w-full h-24 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium resize-none" placeholder="Hãy mô tả rõ vấn đề bạn đang gặp phải..." />
                   </div>
                   
                   <div className="space-y-1.5 focus-within:text-primary">
                      <div className="flex justify-between items-center mb-1">
                          <label className="text-sm font-bold text-slate-700">Hình ảnh minh họa (tối đa 3)</label>
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                             {formData.anh_su_co.length}/3 ảnh
                          </span>
                      </div>
                      
                      {formData.anh_su_co.length < 3 && (
                        <input 
                          type="file" 
                          accept="image/*"
                          multiple
                          onChange={handleImageChange}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-sm file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-rose-50 file:text-rose-600 hover:file:bg-rose-100 cursor-pointer"
                        />
                      )}
                      
                      {formData.anh_su_co.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-2">
                           {formData.anh_su_co.map((img, idx) => (
                             <div key={idx} className="relative aspect-square">
                                <img src={img} className="w-full h-full object-cover rounded-xl border border-slate-200 shadow-inner" />
                                <button 
                                  type="button"
                                  onClick={() => removeImage(idx)}
                                  className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-md text-rose-500 hover:bg-rose-50 transition-colors border border-slate-100"
                                >
                                   <X size={12} />
                                </button>
                             </div>
                           ))}
                        </div>
                      )}
                   </div>

                   <button disabled={submitting} type="submit" className="w-full mt-2 py-3.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors flex justify-center items-center gap-2">
                       {submitting ? 'Đang gửi lên hệ thống...' : <><Send size={18} /> Gửi cho Ban Quản Lý</>}
                   </button>
               </form>
           </div>
        </div>
      )}
    </div>
  );
}
