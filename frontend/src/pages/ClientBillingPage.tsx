import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Zap, Droplets, Banknote, Download, Receipt, AlertTriangle, X } from "lucide-react";

type Bill = {
  id: number;
  room_id: number;
  thang_nam: string;
  tong_tien: number;
  trang_thai: string;
  chi_so_dien_cu: number;
  chi_so_dien_moi: number;
  chi_so_nuoc_cu: number;
  chi_so_nuoc_moi: number;
  pdf_link: string | null;
  qr_url: string | null;
  so_nguoi: number;
};

export function ClientBillingPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [paymentLinkLoading, setPaymentLinkLoading] = useState<number | null>(null);
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const res = await api.get("/bills/");
        setBills(res.data);
      } catch (err) {
        console.error("Lỗi lấy danh sách hoá đơn", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBills();
  }, []);

  if (loading) return <div className="text-center py-20 text-slate-400">Đang tải hoá đơn...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto pb-24 space-y-8">
      <div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Hóa Đơn Của Bạn</h2>
        <p className="text-slate-500 font-medium">Theo dõi chi tiêu điện nước và thanh toán hàng tháng.</p>
      </div>

      {bills.length === 0 ? (
        <div className="bg-slate-50 rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-200">
            <Receipt className="text-slate-200 mb-4 mx-auto" size={64} />
            <h3 className="font-black text-slate-700 text-xl mb-1">Chưa có hoá đơn nào</h3>
            <p className="text-slate-400 font-medium">Hóa đơn mới sẽ xuất hiện ở đây vào chu kỳ chốt tiếp theo.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {bills.map((bill) => {
            const isUnpaid = bill.trang_thai !== "Đã thanh toán";

            return (
              <div key={bill.id} className={`bg-white rounded-[2rem] border-2 transition-all p-7 shadow-xl shadow-slate-200/50 ${isUnpaid ? 'border-primary/20' : 'border-slate-100'}`}>
                {isUnpaid && (
                  <div className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl mb-6 flex items-center gap-2 text-sm font-bold border border-rose-100 animate-pulse">
                    <AlertTriangle size={18} /> Hóa đơn tháng {bill.thang_nam} đã chốt. Vui lòng thanh toán.
                  </div>
                )}

                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-3">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isUnpaid ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                       <Receipt size={28} />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-slate-800">Tháng {bill.thang_nam}</div>
                      <div className={`text-sm font-bold px-2 py-0.5 rounded-md inline-block mt-1 ${isUnpaid ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {bill.trang_thai}
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-black text-3xl text-slate-900 leading-none">
                    {bill.tong_tien.toLocaleString()}đ
                  </div>
                </div>

                <div className="flex gap-3">
                  {isUnpaid && (
                    <button 
                      onClick={async () => {
                        try {
                          setPaymentLinkLoading(bill.id);
                          const res = await api.post(`/bills/${bill.id}/create-payment-link`);
                          
                          // Tuyệt đối không dùng window.location.href hay window.open()
                          if (res.data && res.data.qrCode) {
                            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(res.data.qrCode)}`;
                            setGeneratedQR(qrUrl);
                          } else {
                            // Cố tình log lại nếu PayOS không sinh ra QR (Do thiếu key hoặc sai cấu hình)
                            setGeneratedQR(null);
                            console.warn("Lệnh đã được tạo nhưng Payload không chứa mã QR String", res.data);
                          }
                          
                          // Mở popup
                          setSelectedBill(bill);
                        } catch (err) {
                          console.error(err);
                          alert("Lỗi kết nối PayOS, vui lòng thử lại.");
                        } finally {
                          setPaymentLinkLoading(null);
                        }
                      }} 
                      disabled={paymentLinkLoading === bill.id}
                      className={`flex-1 py-4 font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${paymentLinkLoading === bill.id ? 'bg-slate-700 text-slate-300 cursor-not-allowed shadow-none' : 'bg-slate-900 text-white shadow-slate-900/20 hover:bg-slate-800'}`}
                    >
                      {paymentLinkLoading === bill.id ? (
                        <div className="w-5 h-5 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <Banknote size={20} />
                      )}
                      {paymentLinkLoading === bill.id ? "Đang xử lý..." : "Thanh toán ngay"}
                    </button>
                  )}
                  {bill.pdf_link && (
                    <a href={bill.pdf_link} target="_blank" rel="noreferrer" className="flex-1 py-4 bg-slate-100 text-slate-700 font-black rounded-2xl border border-slate-200 flex items-center justify-center gap-2 hover:bg-slate-200 transition-all active:scale-95">
                      <Download size={20} /> Tải PDF
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedBill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => { setSelectedBill(null); setGeneratedQR(null); }}></div>
             <div className="bg-white rounded-[2.5rem] w-full max-w-sm relative z-10 shadow-2xl p-8 overflow-hidden">
                 <button onClick={() => { setSelectedBill(null); setGeneratedQR(null); }} className="absolute top-6 right-6 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200">
                    <X size={20} />
                 </button>

                 <h3 className="text-2xl font-black text-slate-900 mb-8 text-center pt-2">Mã VietQR</h3>
                 
                 <div className="mb-8 flex justify-center scale-110">
                    {generatedQR ? (
                      <img src={generatedQR} alt="VietQR" className="rounded-2xl border-4 border-slate-50" />
                    ) : selectedBill.qr_url ? (
                      <img src={selectedBill.qr_url} alt="VietQR" className="rounded-2xl border-4 border-slate-50" />
                    ) : (
                      <div className="w-64 h-64 bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200">
                         <AlertTriangle size={32} className="mb-2" />
                         <span className="text-xs font-bold text-center px-4">Lỗi kết nối: Không thể tạo QR</span>
                      </div>
                    )}
                 </div>

                 <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Số tiền cần quét</p>
                    <p className="text-2xl font-black text-emerald-700">{selectedBill.tong_tien.toLocaleString()}đ</p>
                 </div>

                 <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-6">Vui lòng kiểm tra kỹ số tiền khi quét</p>
             </div>
          </div>
      )}
    </div>
  );
}
