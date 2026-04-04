import { useRef, useEffect, useState } from 'react';
import { Camera, AlertCircle, CheckCircle2, X, RefreshCw, Loader } from 'lucide-react';

export default function NeuralViewport({ onCapture, onClose, isInspecting }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [error, setError] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null); // base64 preview of frozen frame
  const [isFlashing, setIsFlashing] = useState(false);
  const [result, setResult] = useState(null);

  // Start camera on mount
  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        streamRef.current = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError('Camera access denied. Please allow camera permissions.');
      }
    }
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current || isInspecting) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Freeze: show captured frame as image
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    setResult(null);

    // Shutter flash effect
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    // Convert to File and send to AI
    canvas.toBlob((blob) => {
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
      onCapture(file, (aiResult) => {
        setResult(aiResult);
      });
    }, 'image/jpeg', 0.9);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setResult(null);
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-12 text-center space-y-4">
        <AlertCircle className="mx-auto text-red-400" size={40} />
        <p className="text-red-800 font-medium text-sm">{error}</p>
        <button onClick={onClose} className="text-sm text-gray-500 underline">Go back</button>
      </div>
    );
  }

  const isPass = result?.status === 'pass';

  return (
    <div className="space-y-4">
      {/* Viewfinder */}
      <div className="relative rounded-xl overflow-hidden bg-black aspect-video shadow-lg border border-gray-200">

        {/* Shutter flash */}
        {isFlashing && <div className="absolute inset-0 bg-white z-20 pointer-events-none" />}

        {/* Live video feed (hidden when image captured) */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${capturedImage ? 'hidden' : 'block'}`}
        />

        {/* Frozen captured frame */}
        {capturedImage && (
          <img src={capturedImage} alt="Captured frame" className="w-full h-full object-cover" />
        )}

        {/* Corner guides (only on live feed) */}
        {!capturedImage && (
          <div className="absolute inset-[12%] pointer-events-none">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-400" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-400" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-400" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-400" />
          </div>
        )}

        {/* Processing overlay */}
        {capturedImage && isInspecting && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3 z-10">
            <Loader className="text-white animate-spin" size={36} />
            <span className="text-white font-semibold text-sm tracking-wide">Analyzing frame...</span>
          </div>
        )}

        {/* Result overlay */}
        {result && !isInspecting && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
            <div className={`px-8 py-5 rounded-2xl flex flex-col items-center gap-2 shadow-2xl border-2 ${isPass ? 'bg-green-500/90 border-green-400' : 'bg-red-500/90 border-red-400'} text-white`}>
              {isPass ? <CheckCircle2 size={44} /> : <AlertCircle size={44} />}
              <span className="text-3xl font-black uppercase tracking-tight">{result.status}</span>
              <span className="text-sm opacity-80">Anomaly Score: {result.anomalyScore || result.anomaly_score ? Number(result.anomalyScore || result.anomaly_score).toFixed(2) + '%' : '—'}</span>
            </div>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white rounded-full border border-gray-200 text-gray-600 shadow z-30"
        >
          <X size={16} />
        </button>
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {!capturedImage ? (
          <button
            onClick={handleCapture}
            disabled={isInspecting}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-full shadow-md transition-all active:scale-95"
          >
            <Camera size={18} />
            Capture & Inspect
          </button>
        ) : (
          <button
            onClick={handleRetake}
            disabled={isInspecting}
            className="flex items-center gap-2 px-8 py-3 bg-gray-700 hover:bg-gray-800 disabled:bg-gray-400 text-white font-bold rounded-full shadow-md transition-all active:scale-95"
          >
            <RefreshCw size={18} />
            Retake
          </button>
        )}
      </div>
    </div>
  );
}
