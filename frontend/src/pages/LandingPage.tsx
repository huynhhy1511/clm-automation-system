import { useState, useEffect } from "react";
import { ArrowRight, CheckCircle2, Home, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";

export function LandingPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    ho_ten: '',
    ngay_sinh: '',
    so_cccd: '',
    thuong_tru: '',
    ngay_cap: '',
    noi_cap: '',
    sdt: '',
    email: '',
    anh_khuon_mat: '',
    cccd_truoc: '',
    cccd_sau: '',
    ngay_bat_dau: '',
    so_thang_thue: '12'
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/rooms/");
        setRooms(res.data.filter((r: any) => r.trang_thai === "Trống"));
      } catch (error) {
        console.error("Error fetching rooms", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const handleFileChange = (e: any, field: string) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.7 quality
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          setFormData(prev => ({ ...prev, [field]: dataUrl }));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post("http://localhost:8000/api/booking-requests/", {
        ...formData,
        room_id: selectedRoom.id,
        so_thang_thue: parseInt(formData.so_thang_thue),
      });
      setSuccess(true);
    } catch (error) {
      console.error("Error submitting", error);
      alert("Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="glass-header px-8 py-5 flex justify-between items-center fixed top-0 w-full z-50">
         <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
               <Home className="text-primary font-bold" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-800">CLM<span className="text-primary">System</span></h1>
         </div>
         <Link to="/login" className="px-5 py-2.5 rounded-full bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors">
            Khách thuê đăng nhập
         </Link>
      </header>

      {/* Hero */}
      <main className="pt-32 px-8 max-w-6xl mx-auto pb-24">
         <div className="text-center mb-16 animate-in slide-in-from-bottom-5 duration-700">
            <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase mb-4 inline-block">Sẵn sàng dọn vào</span>
            <h2 className="text-5xl font-black text-slate-900 tracking-tight mb-6">Trải nghiệm không gian sống<br/>với hệ thống quản lý chuẩn Mỹ.</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">Hệ thống hỗ trợ làm Hợp đồng điện tử, nhận tài khoản tự động và xử lý mọi sự cố chỉ qua 1 màn hình cảm ứng.</p>
         </div>

         {/* Room List */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
                <div className="col-span-3 text-center py-20 text-slate-400">Đang tải biểu giá phòng...</div>
            ) : rooms.map(room => (
               <div key={room.id} className="glass-card p-6 flex flex-col hover:-translate-y-1 transition-transform duration-300">
                  <div className="flex justify-between items-start mb-6">
                     <h3 className="text-2xl font-black text-slate-800">{room.ma_phong}</h3>
                     <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100">Phòng trống</span>
                  </div>
                  <div className="flex items-end gap-1 mb-8">
                     <span className="text-3xl font-black text-primary">{room.gia_thue.toLocaleString()}đ</span>
                     <span className="text-slate-400 font-medium pb-1">/tháng</span>
                  </div>
                  <button 
                     onClick={() => { setSelectedRoom(room); setShowModal(true); }}
                     className="mt-auto w-full py-3.5 bg-slate-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors group"
                  >
                     Đăng ký thuê ngay <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
               </div>
            ))}
            {rooms.length === 0 && !loading && (
                <div className="col-span-3 text-center py-20 text-slate-400 glass-card">Hiện không còn phòng trống. Vui lòng quay lại sau!</div>
            )}
         </div>
      </main>

      {/* Booking Modal */}
      {showModal && selectedRoom && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
           <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl animate-in zoom-in-95 duration-300">
               {success ? (
                   <div className="p-12 text-center flex flex-col items-center">
                       <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                          <CheckCircle2 size={40} />
                       </div>
                       <h3 className="text-2xl font-black text-slate-800 mb-2">Gửi yêu cầu thành công!</h3>
                       <p className="text-slate-500 mb-8">Chủ quản lý sẽ duyệt yêu cầu của bạn. Ngay sau khi duyệt, bạn sẽ nhận được Email chứa Hợp đồng PDF và Tài khoản đăng nhập nội bộ.</p>
                       <button onClick={() => { setShowModal(false); setSuccess(false); }} className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800">Đóng lại</button>
                   </div>
               ) : (
                <div className="p-8">
                    <h3 className="text-2xl font-black text-slate-800 mb-2">Đăng ký Thuê - {selectedRoom.ma_phong}</h3>
                    <p className="text-slate-500 mb-8 text-sm">Vui lòng điền thông tin chính xác để hệ thống n8n tự động tạo Hợp đồng điện tử cho bạn vào bước sau.</p>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                       
                       <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5 focus-within:text-primary list-none">
                              <label className="text-sm font-bold text-slate-700">Họ và Tên</label>
                              <input required type="text" onChange={e=>setFormData({...formData, ho_ten: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" placeholder="Nguyễn Văn A" />
                           </div>
                           <div className="space-y-1.5 focus-within:text-primary">
                              <label className="text-sm font-bold text-slate-700">Ngày sinh</label>
                              <input required type="date" onChange={e=>setFormData({...formData, ngay_sinh: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" />
                           </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5 focus-within:text-primary">
                              <label className="text-sm font-bold text-slate-700">Số điện thoại</label>
                              <input required type="text" onChange={e=>setFormData({...formData, sdt: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" placeholder="0987xxx" />
                           </div>
                           <div className="space-y-1.5 focus-within:text-primary">
                              <label className="text-sm font-bold text-slate-700">Số CCCD</label>
                              <input required type="text" onChange={e=>setFormData({...formData, so_cccd: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" placeholder="07920xxxxx" />
                           </div>
                       </div>
                       
                       <div className="space-y-1.5 focus-within:text-primary">
                          <label className="text-sm font-bold text-slate-700">Thường trú (Hộ khẩu)</label>
                          <input required type="text" onChange={e=>setFormData({...formData, thuong_tru: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" placeholder="VD: Phường X, Quận Y, TP Z" />
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5 focus-within:text-primary">
                              <label className="text-sm font-bold text-slate-700">Ngày cấp CCCD</label>
                              <input required type="date" onChange={e=>setFormData({...formData, ngay_cap: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" />
                           </div>
                           <div className="space-y-1.5 focus-within:text-primary">
                              <label className="text-sm font-bold text-slate-700">Nơi cấp</label>
                              <input required type="text" onChange={e=>setFormData({...formData, noi_cap: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" placeholder="Cục Cảnh Sát QLHC..." />
                           </div>
                       </div>
                       
                       <div className="space-y-1.5 focus-within:text-primary">
                          <label className="text-sm font-bold text-slate-700">Email (Để nhận Hợp đồng & Tài khoản)</label>
                          <input required type="email" onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" placeholder="email@gmail.com" />
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5 focus-within:text-primary">
                              <label className="text-sm font-bold text-slate-700">Ngày bắt đầu thuê</label>
                              <input required type="date" min={new Date().toISOString().split('T')[0]} value={formData.ngay_bat_dau} onChange={e=>setFormData({...formData, ngay_bat_dau: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" />
                           </div>
                           <div className="space-y-1.5 focus-within:text-primary">
                              <label className="text-sm font-bold text-slate-700">Thời gian thuê</label>
                              <select value={formData.so_thang_thue} onChange={e=>setFormData({...formData, so_thang_thue: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium">
                                 <option value="3">3 tháng</option>
                                 <option value="6">6 tháng</option>
                                 <option value="12">12 tháng (1 năm)</option>
                                 <option value="24">24 tháng (2 năm)</option>
                              </select>
                           </div>
                       </div>

                       {/* Image Upload Area */}
                       <div className="pt-2">
                          <div className="space-y-2 mb-4">
                            <label className="text-sm font-bold text-slate-700 block">Ảnh Khuôn Mặt Khách Thuê (Bắt buộc)</label>
                            <label className={`border-2 border-dashed ${formData.anh_khuon_mat ? 'border-primary bg-primary/5' : 'border-slate-200'} rounded-xl h-24 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-colors relative overflow-hidden`}>
                                {formData.anh_khuon_mat && <img src={formData.anh_khuon_mat} className="absolute inset-0 w-full h-full object-cover opacity-30" />}
                                <PlusIcon isUploaded={!!formData.anh_khuon_mat} />
                                <span className="text-xs font-bold text-slate-500 mt-1 z-10">{formData.anh_khuon_mat ? 'Đã tải lên Ảnh Mặt' : 'Chọn tỷ lệ 1:1 rõ mặt'}</span>
                                <input required type="file" accept="image/*" onChange={e=>handleFileChange(e, 'anh_khuon_mat')} className="hidden" />
                            </label>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                  <label className="text-sm font-bold text-slate-700 block">Ảnh CCCD Mặt Trước</label>
                                  <label className={`border-2 border-dashed ${formData.cccd_truoc ? 'border-emerald-400 bg-emerald-50/50' : 'border-slate-200'} rounded-xl h-20 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-colors`}>
                                    <PlusIcon isUploaded={!!formData.cccd_truoc} />
                                    <input required type="file" accept="image/*" onChange={e=>handleFileChange(e, 'cccd_truoc')} className="hidden" />
                                  </label>
                              </div>
                              <div className="space-y-2">
                                  <label className="text-sm font-bold text-slate-700 block">Ảnh CCCD Mặt Sau</label>
                                  <label className={`border-2 border-dashed ${formData.cccd_sau ? 'border-emerald-400 bg-emerald-50/50' : 'border-slate-200'} rounded-xl h-20 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-colors`}>
                                    <PlusIcon isUploaded={!!formData.cccd_sau} />
                                    <input required type="file" accept="image/*" onChange={e=>handleFileChange(e, 'cccd_sau')} className="hidden" />
                                  </label>
                              </div>
                          </div>
                       </div>

                       <div className="pt-6 flex justify-end gap-3">
                          <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Hủy</button>
                          <button disabled={submitting} type="submit" className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all flex items-center gap-2">
                             {submitting ? 'Đang nén & Gửi...' : 'Gửi Yêu Cầu Thuê'}
                          </button>
                       </div>
                    </form>
                </div>
               )}
           </div>
        </div>
      )}
    </div>
  );
}

const PlusIcon = ({isUploaded}: {isUploaded: boolean}) => (
    isUploaded ? <CheckCircle2 className="text-emerald-500 mb-1" /> : <Upload className="text-slate-400 mb-1" size={20} />
);
