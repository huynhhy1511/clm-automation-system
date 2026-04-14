import { useState } from "react";
import { ArrowRight, Lock, Mail } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    // Convert to application/x-www-form-urlencoded
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);

    try {
      const res = await axios.post("http://localhost:8000/api/auth/login", params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      localStorage.setItem("token", res.data.access_token);
      navigate("/client");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Email hoặc mật khẩu không đúng.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
       <div className="w-full max-w-sm">
          <div className="text-center mb-10">
             <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Lock className="text-primary" size={32} />
             </div>
             <h1 className="text-3xl font-black text-slate-800 tracking-tight">Đăng nhập</h1>
             <p className="text-slate-500 mt-2">Dành cho Khách thuê CLM System</p>
          </div>

          <form onSubmit={handleLogin} className="glass-card p-6 md:p-8 space-y-5 animate-in slide-in-from-bottom-5 duration-500">
             {error && <div className="p-3 bg-rose-50 text-rose-500 text-sm font-medium rounded-xl border border-rose-100">{error}</div>}
             
             <div className="space-y-1.5 focus-within:text-primary">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Email</label>
                <div className="relative">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium" placeholder="Tài khoản Email" />
                </div>
             </div>

             <div className="space-y-1.5 focus-within:text-primary pb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Mật khẩu</label>
                <div className="relative">
                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input required type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium" placeholder="••••••••" />
                </div>
             </div>

             <button disabled={loading} type="submit" className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                {loading ? 'Đang xác thực...' : <>Vào hệ thống <ArrowRight size={18} /></>}
             </button>
             
             <p className="text-center text-xs text-slate-400 font-medium pt-2">Nếu bạn chưa có tài khoản, vui lòng Đăng ký thuê phòng tại trang chủ. Mật khẩu sẽ được cấp sau khi Duyệt.</p>
          </form>
       </div>
    </div>
  );
}
