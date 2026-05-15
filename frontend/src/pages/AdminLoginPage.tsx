import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";

// =====================================================
// THAY ĐỔI EMAIL VÀ MẬT KHẨU ADMIN TẠI ĐÂY
const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "1231234567";
// =====================================================

export function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    setTimeout(() => {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedAdminEmail = ADMIN_EMAIL.trim().toLowerCase();

      if (normalizedEmail === normalizedAdminEmail && password === ADMIN_PASSWORD) {
        localStorage.setItem("isAdmin", "true");
        navigate("/admin");
      } else {
        setError("Email hoặc mật khẩu admin không đúng.");
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-100/60 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-primary/20 shadow-sm">
            <ShieldCheck className="text-primary" size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Admin Portal</h1>
          <p className="text-slate-500 mt-2 text-sm">Khu vực dành riêng cho quản trị viên</p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleLogin}
          className="bg-white border border-slate-200 rounded-3xl p-8 space-y-5 shadow-xl shadow-slate-200/60"
        >
          {error && (
            <div className="p-3 bg-rose-50 text-rose-500 text-sm font-medium rounded-xl border border-rose-100">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Email Admin
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium text-slate-800 placeholder-slate-400"
                placeholder="admin@gmail.com"
              />
            </div>
          </div>

          <div className="space-y-1.5 pb-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium text-slate-800 placeholder-slate-400"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-2xl shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              "Đang xác thực..."
            ) : (
              <>
                Đăng nhập Admin <ArrowRight size={18} />
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-400 font-medium pt-1">
            Trang này chỉ dành cho quản trị viên được uỷ quyền.
          </p>
        </form>
      </div>
    </div>
  );
}
