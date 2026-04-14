import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Zap, Droplets, User, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import axios from "axios";

type ActiveRoom = {
  room_id: number;
  ma_phong: string;
  tenant_name: string;
  tenant_email: string;
  so_nguoi: number;
  room_price: number;
  prev_electricity: number;
  prev_water: number;
};

type RowData = {
  new_electricity: string;
  new_water: string;
  submitting: boolean;
  success: boolean;
};

const ELEC_PRICE = 3500;
const WATER_PRICE_PER_PERSON = 100000;
const N8N_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || "http://localhost:5679/webhook/chot-dien-nuoc";

export function BillingPage() {
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Record<number, RowData>>({});

  const fetchActiveRooms = async () => {
    try {
      const res = await api.get("/bills/active-rooms");
      setActiveRooms(res.data);
      
      // Initialize row states
      const initialRows: Record<number, RowData> = {};
      res.data.forEach((room: ActiveRoom) => {
        initialRows[room.room_id] = {
          new_electricity: "",
          new_water: "",
          submitting: false,
          success: false,
        };
      });
      setRows(initialRows);
    } catch (err) {
      console.error("Lỗi lấy danh sách phòng hoạt động", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveRooms();
  }, []);

  const handleInputChange = (roomId: number, field: keyof RowData, value: string) => {
    setRows(prev => ({
      ...prev,
      [roomId]: { ...prev[roomId], [field]: value, success: false }
    }));
  };

  const calculateTotal = (room: ActiveRoom) => {
    const row = rows[room.room_id];
    if (!row) return 0;

    const newElec = parseFloat(row.new_electricity) || room.prev_electricity;

    const elecBill = (newElec - room.prev_electricity) * ELEC_PRICE;
    const waterBill = room.so_nguoi * WATER_PRICE_PER_PERSON;
    
    return Math.max(0, elecBill) + waterBill + room.room_price;
  };

  const handleFinalize = async (room: ActiveRoom) => {
    const row = rows[room.room_id];
    const newElec = parseFloat(row.new_electricity);
    const newWater = parseFloat(row.new_water);

    if (isNaN(newElec) || isNaN(newWater)) {
      alert("Vui lòng nhập đầy đủ chỉ số mới.");
      return;
    }

    if (newElec < room.prev_electricity || newWater < room.prev_water) {
      alert("Chỉ số mới không được nhỏ hơn chỉ số cũ.");
      return;
    }

    setRows(prev => ({ ...prev, [room.room_id]: { ...prev[room.room_id], submitting: true } }));

    const totalAmount = calculateTotal(room);

    const payload = {
      phong: room.ma_phong,
      hoTen: room.tenant_name,
      email: room.tenant_email,
      chiSoDienCu: room.prev_electricity,
      chiSoDienMoi: newElec,
      chiSoNuocCu: room.prev_water,
      chiSoNuocMoi: newWater,
      soDien: newElec - room.prev_electricity,
      soNuoc: newWater - room.prev_water,
      tongTien: totalAmount,
      roomId: room.room_id,
      thangNam: new Date().toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })
    };

    try {
      // Gửi TRỰC TIẾP sang n8n
      await axios.post(N8N_URL, payload);
      
      setRows(prev => ({ 
        ...prev, 
        [room.room_id]: { ...prev[room.room_id], submitting: false, success: true } 
      }));
