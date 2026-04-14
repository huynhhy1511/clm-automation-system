import { useState, useEffect } from "react";
import axios from "axios";
import { UserCircle, ShieldCheck } from "lucide-react";

export function ClientProfilePage() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:8000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchProfile();
  }, []);

  if (!profile) return <div className="p-8 text-center text-slate-400">Đang tải hồ sơ...</div>;

  return (
    <div className="p-6 space-y-6 max-w-lg mx-auto pb-24">
       <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center">
             <UserCircle size={40} />
          </div>
          <div>
             <h2 className="text-2xl font-black text-slate-800">{profile.email}</h2>
             <span className="flex items-center gap-1 text-emerald-500 font-bold text-sm mt-1">
                 <ShieldCheck size={16} /> Đã xác thực CCCD
             </span>
          </div>
       </div>

       <div className="glass-card p-6 space-y-4">
          <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Thông tin tài khoản</h3>
          
          <div className="flex justify-between items-center py-2">
              <span className="text-slate-500 text-sm">Vai trò</span>
              <span className="font-bold text-slate-700 capitalize">{profile.role}</span>
          </div>
          <div className="flex justify-between items-center py-2">
              <span className="text-slate-500 text-sm">Email liên hệ</span>
              <span className="font-bold text-slate-700">{profile.email}</span>
          </div>
       </div>

       <div className="glass-card p-6 pb-8">
          <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Mật khẩu</h3>
          <button className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">
              Đổi mật khẩu
          </button>
       </div>
    </div>
  );
}
