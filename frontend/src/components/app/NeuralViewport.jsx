import { useRef, useEffect, useState } from 'react';
import { Camera, Zap, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Button } from '../ui/Button';

export default function NeuralViewport({ onCapture, onClose, isInspecting }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isPulseActive, setIsPulseActive] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  // Initialize Camera
  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment', // Use rear camera by default
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Camera access denied:", err);
        setError("Camera Access Denied. Check permissions.");
      }
    }
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Neural Pulse Loop
  useEffect(() => {
    let pulseInterval;
    
    if (isPulseActive && stream && !isInspecting) {
      pulseInterval = setInterval(() => {
        captureFrame();
      }, 1500); // Pulse every 1.5s for stability
    }

    return () => clearInterval(pulseInterval);
  }, [isPulseActive, stream, isInspecting]);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current || isInspecting) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    // Maintain aspect ratio
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      const file = new File([blob], "neural_pulse.jpg", { type: "image/jpeg" });
      onCapture(file, (result) => {
        setLastResult(result);
      });
    }, 'image/jpeg', 0.8);
  };

  const togglePulse = () => {
    setIsPulseActive(!isPulseActive);
    if (isPulseActive) setLastResult(null);
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-lg p-12 text-center space-y-4">
        <AlertCircle className="mx-auto text-red-500" size={48} />
        <p className="text-red-900 font-medium">{error}</p>
        <Button onClick={onClose} variant="secondary">Back to Uploads</Button>
      </div>
    );
  }

  const isPass = lastResult?.status === 'pass';

  return (
    <div className="relative rounded-xl overflow-hidden bg-black aspect-video shadow-2xl border border-gray-800">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className={`w-full h-full object-cover transition-opacity duration-500 ${lastResult ? 'opacity-40' : 'opacity-100'}`}
      />
      
      {/* Hidden Canvas for Processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Real-time HUD */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Scanning Target */}
        <div className="absolute inset-[15%] border-2 border-white/20 rounded-lg">
           <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500" />
           <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500" />
           <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500" />
           <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500" />
        </div>

        {/* Status Badge */}
        {lastResult && (
          <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in duration-300">
             <div className={`px-8 py-4 rounded-2xl border-4 flex flex-col items-center gap-2 ${isPass ? 'bg-green-500/90 border-green-400 text-white' : 'bg-red-500/90 border-red-400 text-white'} shadow-2xl backdrop-blur-md`}>
                {isPass ? <CheckCircle2 size={48} /> : <AlertCircle size={48} />}
                <span className="text-3xl font-black tracking-tighter uppercase">{lastResult.status}</span>
                <span className="text-sm font-bold opacity-80">{100 - (lastResult.anomalyScore || 0)}% Match</span>
             </div>
          </div>
        )}

        {/* Pulse Indicator */}
        {isPulseActive && !lastResult && (
          <div className="absolute top-6 left-6 flex items-center gap-3 bg-blue-600/90 text-white px-4 py-2 rounded-full backdrop-blur-sm">
             <div className="w-2 h-2 bg-white rounded-full animate-ping" />
             <span className="text-xs font-black uppercase tracking-widest">Neural Pulse Active</span>
          </div>
        )}
      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 pointer-events-auto">
        <Button 
          onClick={togglePulse} 
          className={`${isPulseActive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-8 py-4 rounded-full font-bold shadow-xl flex items-center gap-3 transition-all transform active:scale-95`}
        >
          {isPulseActive ? <Zap className="animate-pulse" /> : <Camera />}
          {isPulseActive ? 'STOP AUTO-SCAN' : 'START AUTO-SCAN'}
        </Button>
        <button 
          onClick={onClose}
          className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all shadow-lg"
        >
          <X size={24} />
        </button>
      </div>
    </div>
  );
}
