import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Plus, Home, Tag, Check, X, ImagePlus, Trash2, Edit2 } from "lucide-react";

type Room = {
  id: number;
  ma_phong: string;
  gia_thue: number;
  trang_thai: string;
  mo_ta?: string;
  anh_phong?: string[];
};

export function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ ma_phong: "", gia_thue: "", mo_ta: "", anh_phong: [] as string[] });
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchRooms = async () => {
    try {
      const res = await api.get("/rooms/");
      setRooms(res.data);
    } catch (err) {
      console.error("Error fetching rooms", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ma_phong: formData.ma_phong,
        gia_thue: parseFloat(formData.gia_thue),
        mo_ta: formData.mo_ta,
        anh_phong: formData.anh_phong
      };

      if (editingRoomId) {
        await api.put(`/rooms/${editingRoomId}`, payload);
      } else {
        await api.post("/rooms/", { ...payload, trang_thai: "Trống" });
      }
      
      setShowModal(false);
      setFormData({ ma_phong: "", gia_thue: "", mo_ta: "", anh_phong: [] });
      setEditingRoomId(null);
      fetchRooms();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || "Đã xảy ra lỗi.");
    } finally {
      setSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setEditingRoomId(null);
    setFormData({ ma_phong: "", gia_thue: "", mo_ta: "", anh_phong: [] });
    setShowModal(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoomId(room.id);
    setFormData({
      ma_phong: room.ma_phong,
      gia_thue: room.gia_thue.toString(),
      mo_ta: room.mo_ta || "",
      anh_phong: room.anh_phong || []
    });
    setShowModal(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    if (formData.anh_phong.length + files.length > 6) {
      alert("Chỉ được tải lên tối đa 6 ảnh.");
      return;
    }

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData(prev => ({
            ...prev,
            anh_phong: [...prev.anh_phong, event.target!.result as string]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };
  
  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      anh_phong: prev.anh_phong.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="w-full relative h-full">
      <div className="flex justify-between items-center mb-8">
         <h2 className="text-3xl font-black text-slate-800">Quản lý Phòng</h2>
         <button onClick={openCreateModal} className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2">
            <Plus size={20} /> Thêm Phòng
         </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Đang tải danh sách...</div>
      ) : rooms.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center">
            <Home className="text-slate-300 mb-4" size={48} />
            <h3 className="text-xl font-bold text-slate-700 mb-2">Chưa có phòng nào</h3>
            <p className="text-slate-500 mb-6">Thêm phòng mới để khách hàng có thể đặt trên ứng dụng.</p>
            <button onClick={openCreateModal} className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
                Tạo phòng đầu tiên
            </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-2 gap-6">
          {rooms.map((room) => (
            <div key={room.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
               <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                         <Home className="text-primary" size={24} />
                     </div>
                     <div>
                        <h3 className="text-xl font-black text-slate-800">{room.ma_phong}</h3>
                        <p className="text-slate-500 font-medium text-sm">Cơ sở chính</p>
                     </div>
                  </div>
                  <div className="flex gap-2 items-center">
                     <button onClick={() => openEditModal(room)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-full transition-colors" title="Chỉnh sửa phòng">
                        <Edit2 size={16} />
                     </button>
                     <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                       room.trang_thai === "Trống" ? "text-emerald-600 bg-emerald-50 border-emerald-200" :
                       room.trang_thai === "Đang thuê" ? "text-primary bg-primary/10 border-primary/20" :
                       "text-amber-600 bg-amber-50 border-amber-200"
                     }`}>
                       {room.trang_thai}
                     </span>
                  </div>
               </div>
               
               <div className="bg-slate-50 rounded-2xl p-4 flex justify-between items-center mt-6 border border-slate-100">
                  <span className="text-slate-500 text-sm font-medium flex items-center gap-2"><Tag size={16} /> Giá thuê:</span>
                  <span className="font-black text-lg text-slate-800">{room.gia_thue.toLocaleString()}đ</span>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* modal create room */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
           <div className="bg-white rounded-3xl w-full max-w-lg relative z-10 shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-black text-slate-800">{editingRoomId ? "Cập Nhật Phòng" : "Tạo Phòng Mới"}</h3>
                  <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">
                     <X size={18} />
                  </button>
               </div>
               
               <form onSubmit={handleSubmit} className="space-y-5">
                   <div className="space-y-1.5 focus-within:text-primary">
                      <label className="text-sm font-bold text-slate-700">Mã phòng / Tên phòng</label>
                      <input required autoFocus type="text" value={formData.ma_phong} onChange={e=>setFormData({...formData, ma_phong: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium" placeholder="P01, VIP-102..." />
                   </div>
                   <div className="space-y-1.5 focus-within:text-primary">
                      <label className="text-sm font-bold text-slate-700">Giá thuê cơ bản (VNĐ)</label>
                      <input required type="number" min="0" step="1000" value={formData.gia_thue} onChange={e=>setFormData({...formData, gia_thue: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium" placeholder="3000000" />
                   </div>
                   
                   <div className="space-y-1.5 focus-within:text-primary">
                      <label className="text-sm font-bold text-slate-700">Mô tả phòng</label>
                      <textarea value={formData.mo_ta} onChange={e=>setFormData({...formData, mo_ta: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium min-h-[80px]" placeholder="Phòng có cửa sổ, full nội thất..." />
                   </div>
                   
                   <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 flex justify-between">
                         <span>Ảnh phòng (Tối đa 6 ảnh)</span>
                         <span className="text-slate-400 font-normal">{formData.anh_phong.length}/6</span>
                      </label>
                      <div className="flex flex-wrap gap-3">
                         {formData.anh_phong.map((img, i) => (
                             <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 group">
                                <img src={img} className="w-full h-full object-cover" />
                                <button type="button" onClick={() => removeImage(i)} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                                    <Trash2 size={16} />
                                </button>
                             </div>
                         ))}
                         {formData.anh_phong.length < 6 && (
                            <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-primary hover:text-primary transition-all cursor-pointer">
                                <ImagePlus size={20} />
                                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                            </label>
                         )}
                      </div>
                   </div>

                   <button disabled={submitting} type="submit" className="w-full mt-4 py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors flex justify-center items-center gap-2">
                       {submitting ? 'Đang xử lý...' : <><Check size={18} /> {editingRoomId ? "Lưu Thay Đổi" : "Xác Nhận Mở Phòng"}</>}
                   </button>
               </form>
           </div>
        </div>
      )}
    </div>
  );
}
