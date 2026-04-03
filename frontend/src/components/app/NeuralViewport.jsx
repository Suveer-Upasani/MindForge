import { useRef, useEffect, useState } from 'react';
import { Camera, AlertCircle, CheckCircle2, X, RefreshCw, Loader, Activity } from 'lucide-react';

export default function NeuralViewport({ onCapture, onClose, isInspecting }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [error, setError] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        streamRef.current = mediaStream;
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      } catch {
        setError('Camera access denied. Please allow camera permissions.');
      }
    }
    startCamera();
    return () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); };
  }, []);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current || isInspecting) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    setCapturedImage(canvas.toDataURL('image/jpeg', 0.9));
    setResult(null);
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);
    canvas.toBlob((blob) => {
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
      onCapture(file, (aiResult) => setResult(aiResult));
    }, 'image/jpeg', 0.9);
  };

  const handleRetake = () => { setCapturedImage(null); setResult(null); };

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
  const heatmapSrc = result?.heatmap_base64
    ? `data:image/png;base64,${result.heatmap_base64}`
    : null;
  const anomalyScore = result?.anomalyScore ?? result?.anomaly_score;

  return (
    <div className="space-y-4">
      {/* Main layout: viewfinder + heatmap side by side */}
      <div className={`grid gap-4 ${result ? 'grid-cols-2' : 'grid-cols-1'}`}>

        {/* --- Viewfinder --- */}
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-black aspect-video shadow-lg border border-gray-200">
            {isFlashing && <div className="absolute inset-0 bg-white z-20 pointer-events-none" />}

            <video
              ref={videoRef} autoPlay playsInline muted
              className={`w-full h-full object-cover ${capturedImage ? 'hidden' : 'block'}`}
            />
            {capturedImage && (
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
            )}

            {/* Corner guides on live feed */}
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
                <span className="text-white font-semibold text-sm">Analyzing frame...</span>
              </div>
            )}

            {/* Pass/Fail badge on captured image */}
            {result && !isInspecting && (
              <div className={`absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow ${isPass ? 'bg-green-500' : 'bg-red-500'}`}>
                {isPass ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                {result.status?.toUpperCase()}
              </div>
            )}

            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white rounded-full border border-gray-200 text-gray-600 shadow z-30"
            >
              <X size={16} />
            </button>
          </div>

          {/* Capture / Retake controls */}
          <div className="flex justify-center">
            {!capturedImage ? (
              <button
                onClick={handleCapture}
                disabled={isInspecting}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-full shadow-md transition-all active:scale-95"
              >
                <Camera size={18} /> Capture & Inspect
              </button>
            ) : (
              <button
                onClick={handleRetake}
                disabled={isInspecting}
                className="flex items-center gap-2 px-8 py-3 bg-gray-700 hover:bg-gray-800 disabled:bg-gray-400 text-white font-bold rounded-full shadow-md transition-all active:scale-95"
              >
                <RefreshCw size={18} /> Retake
              </button>
            )}
          </div>
        </div>

        {/* --- Heatmap Panel (shown after result) --- */}
        {result && (
          <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className={`rounded-xl border-2 overflow-hidden ${isPass ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              {/* Header */}
              <div className={`px-4 py-3 flex items-center gap-2 ${isPass ? 'bg-green-100' : 'bg-red-100'}`}>
                <Activity size={16} className={isPass ? 'text-green-600' : 'text-red-600'} />
                <span className={`text-sm font-bold ${isPass ? 'text-green-800' : 'text-red-800'}`}>
                  Anomaly Heatmap
                </span>
                <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${isPass ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                  {isPass ? 'PASS' : 'FAIL'}
                </span>
              </div>

              {/* Heatmap image */}
              <div className="aspect-video bg-gray-900 flex items-center justify-center">
                {heatmapSrc ? (
                  <img src={heatmapSrc} alt="Anomaly heatmap" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center text-gray-400 text-xs space-y-2 p-6">
                    <Activity size={32} className="mx-auto opacity-40" />
                    <p>Heatmap not available</p>
                    <p className="opacity-60">Train the model for visual analysis</p>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="px-4 py-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Anomaly Score</p>
                  <p className={`text-lg font-black ${isPass ? 'text-green-700' : 'text-red-700'}`}>
                    {anomalyScore != null ? `${anomalyScore}` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Confidence</p>
                  <p className={`text-lg font-black ${isPass ? 'text-green-700' : 'text-red-700'}`}>
                    {anomalyScore != null ? `${Math.max(0, 100 - anomalyScore).toFixed(1)}%` : '—'}
                  </p>
                </div>
                {result.likelyIssue && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Likely Issue</p>
                    <p className="text-xs font-medium text-gray-700 mt-0.5">{result.likelyIssue}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
