import React, { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, CheckCircle2, AlertCircle, Upload, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface FaceVerificationProps {
  onVerified: (cccdImage: string, faceImage: string, ocrData?: any) => void;
}

export function FaceVerification({ onVerified }: FaceVerificationProps) {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingText, setLoadingText] = useState('Đang tải mô hình AI...');
  const [step, setStep] = useState<'upload_cccd' | 'liveness' | 'success'>('upload_cccd');
  const [cccdImage, setCccdImage] = useState<string | null>(null);
  const [cccdCroppedFace, setCccdCroppedFace] = useState<string | null>(null);
  const [cccdDescriptor, setCccdDescriptor] = useState<Float32Array | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error('Lỗi tải mô hình:', err);
        setError('Không thể tải mô hình AI. Vui lòng tải lại trang.');
      }
    };
    loadModels();
    
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Lỗi truy cập camera:', err);
      setError('Không thể truy cập Camera. Vui lòng cấp quyền.');
    }
  };

  useEffect(() => {
    if (step === 'liveness') {
      startCamera();
    } else {
      stopCamera();
    }
  }, [step]);

  const handleCccdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsProcessing(true);
    setLoadingText('Đang phân tích CCCD...');

    try {
      const img = await faceapi.bufferToImage(file);
      
      // Draw to canvas to resize/compress if needed, or just use img directly
      const canvas = document.createElement('canvas');
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
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      // Load compressed image back for detection to speed up
      const compressedImg = await faceapi.fetchImage(dataUrl);

      const detection = await faceapi.detectSingleFace(compressedImg, new faceapi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setError('Ảnh không rõ nét hoặc không tìm thấy khuôn mặt, vui lòng chọn ảnh khác.');
      } else {
        // Cắt (crop) khuôn mặt từ thẻ
        const box = detection.detection.box;
        const faceCanvas = document.createElement('canvas');
        faceCanvas.width = box.width;
        faceCanvas.height = box.height;
        const faceCtx = faceCanvas.getContext('2d');
        faceCtx?.drawImage(
          canvas, 
          box.x, box.y, box.width, box.height, 
          0, 0, box.width, box.height
        );
        const croppedFaceUrl = faceCanvas.toDataURL('image/jpeg', 0.9);

        setCccdImage(dataUrl); // Lưu ảnh gốc để gửi lên server
        setCccdCroppedFace(croppedFaceUrl);
        setCccdDescriptor(detection.descriptor);
        setStep('liveness');
      }
    } catch (err) {
      console.error(err);
      setError('Đã xảy ra lỗi khi xử lý ảnh.');
    } finally {
      setIsProcessing(false);
    }
  };

  const captureAndCompare = async () => {
    if (!videoRef.current || !cccdDescriptor) return;

    setError(null);
    setIsProcessing(true);
    setLoadingText('Đang xác thực khuôn mặt...');

    try {
      const videoEl = videoRef.current;
      const detection = await faceapi.detectSingleFace(videoEl, new faceapi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setError('Không tìm thấy khuôn mặt trong Camera. Vui lòng nhìn thẳng.');
        setIsProcessing(false);
        return;
      }

      const distance = faceapi.euclideanDistance(cccdDescriptor, detection.descriptor);
      console.log('Khoảng cách khuôn mặt:', distance);

      // distance < 0.4 is usually considered a match, user wants > 80% (distance < 0.4 ~ 0.45 threshold)
      // Since face-api.js euclidean distance <= 0.4 is a good match.
      if (distance < 0.45) {
        // Capture frame for form
        const canvas = document.createElement('canvas');
        canvas.width = videoEl.videoWidth;
        canvas.height = videoEl.videoHeight;
        canvas.getContext('2d')?.drawImage(videoEl, 0, 0);
        const faceImage = canvas.toDataURL('image/jpeg', 0.8);

        setLoadingText('Đang trích xuất thông tin chữ (OCR)...');
        let ocrData = null;
        try {
          const res = await api.post('/booking-requests/ocr-cccd', {
            base64_image: cccdImage
          });
          if (res.data.success) {
            ocrData = res.data.data;
          }
        } catch (err) {
          console.error("Lỗi OCR:", err);
          // Vẫn cho qua nếu OCR lỗi, khách tự điền
        }

        setStep('success');
        stopCamera();
        onVerified(cccdImage!, faceImage, ocrData);
      } else {
        setError('Khuôn mặt không khớp với CCCD. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi khi so sánh khuôn mặt.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!modelsLoaded) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl border border-slate-200">
        <Loader2 className="animate-spin text-primary mb-2" size={32} />
        <p className="text-slate-500 font-medium">{loadingText}</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
      <h4 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
        <Camera className="text-primary" /> Xác thực Danh tính (AI)
      </h4>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl flex items-start gap-2 text-sm font-medium border border-red-100 animate-in fade-in">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {step === 'upload_cccd' && (
        <div className="space-y-4 animate-in fade-in">
          <p className="text-sm text-slate-600">Bước 1: Tải lên mặt trước thẻ Căn cước công dân của bạn.</p>
          <label className={`border-2 border-dashed ${isProcessing ? 'border-slate-300 bg-slate-100' : 'border-primary/50 bg-primary/5 hover:bg-primary/10'} rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden`}>
            {isProcessing ? (
              <div className="flex flex-col items-center">
                <Loader2 className="animate-spin text-primary mb-2" size={24} />
                <span className="text-sm font-bold text-slate-500">{loadingText}</span>
              </div>
            ) : (
              <>
                <Upload className="text-primary mb-2" size={28} />
                <span className="text-sm font-bold text-primary">Tải lên CCCD</span>
                <span className="text-xs text-slate-500 mt-1">Hỗ trợ JPG, PNG</span>
                <input type="file" accept="image/*" onChange={handleCccdUpload} className="hidden" disabled={isProcessing} />
              </>
            )}
          </label>
        </div>
      )}

      {step === 'liveness' && (
        <div className="space-y-4 animate-in slide-in-from-right-4">
          <p className="text-sm text-slate-600">Bước 2: Chụp ảnh khuôn mặt thực tế. Vui lòng nhìn thẳng vào camera.</p>
          
          <div className="flex gap-4">
            {/* Cropped Face from CCCD */}
            {cccdCroppedFace && (
              <div className="w-1/3 flex flex-col items-center justify-center bg-slate-100 rounded-2xl p-2 border border-slate-200">
                <p className="text-xs font-bold text-slate-500 mb-2">Ảnh trên CCCD</p>
                <img src={cccdCroppedFace} className="w-full aspect-square object-cover rounded-xl shadow-inner" />
              </div>
            )}
            
            <div className="w-2/3 relative rounded-2xl overflow-hidden bg-slate-900 aspect-square flex items-center justify-center">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center z-10">
                  <Loader2 className="animate-spin text-white mb-2" size={32} />
                  <span className="text-white font-medium text-sm text-center px-2">{loadingText}</span>
                </div>
              )}
            </div>
          </div>

          <button 
            type="button"
            onClick={captureAndCompare} 
            disabled={isProcessing}
            className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            Chụp & Xác thực
          </button>
          
          <button 
            type="button"
            onClick={() => setStep('upload_cccd')} 
            disabled={isProcessing}
            className="w-full py-2 text-slate-500 font-medium hover:text-slate-700 text-sm"
          >
            Quay lại bước CCCD
          </button>
        </div>
      )}

      {step === 'success' && (
        <div className="flex flex-col items-center py-6 animate-in zoom-in-95">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h5 className="text-lg font-black text-slate-800 mb-1">Xác thực thành công</h5>
          <p className="text-sm text-slate-500 text-center mb-6">Khuôn mặt khớp với thẻ CCCD. Bạn có thể tiếp tục đăng ký.</p>
          
          <div className="flex gap-4">
            {cccdImage && <img src={cccdImage} className="w-20 h-20 object-cover rounded-xl border-2 border-emerald-100" />}
          </div>
        </div>
      )}
    </div>
  );
}
