import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemplates } from '../../context/TemplateContext';
import { useInspection } from '../../context/InspectionContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Loader } from '../../components/ui/Loader';
import { 
  Camera, 
  Monitor, 
  Upload, 
  Cpu, 
  Zap, 
  ArrowRight,
  Info
} from 'lucide-react';

import { api } from '../../services/api';

export default function Inspection() {
  const navigate = useNavigate();
  const { templates } = useTemplates();
  const { addInspection } = useInspection();

  const [selectedTemplateId, setSelectedTemplateId] = useState(templates.filter(t => t.status === 'ready')[0]?.id || '');
  const [image, setImage] = useState(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [error, setError] = useState(null);

  const activeTemplates = templates.filter(t => t.status === 'ready');

  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.target.files?.[0] || e.dataTransfer.files?.[0];
    if (file) {
      setError(null);
      setImage(file);
    }
  };

  const handleRunInspection = async () => {
    if (!image || !selectedTemplateId) return;
    
    setIsInspecting(true);
    setError(null);
    const template = templates.find(t => t.id === selectedTemplateId);
    
    try {
      // Real API Upload
      const response = await api.uploadInference(template.category, [image]);
      
      const inference = response.inference;
      
      const result = addInspection({
        templateId: selectedTemplateId,
        templateName: template.name,
        category: template.category,
        status: inference.status,
        anomalyScore: inference.anomalyScore,
        severity: inference.severity,
        likelyIssue: inference.likelyIssue,
        serverRef: response.files[0]
      });

      navigate('/results');
    } catch (err) {
      setError('Neural Link Severed. Failed to upload sample to inference engine.');
    } finally {
      setIsInspecting(false);
    }
  };

  return (
    <div className="space-y-10 pb-12 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inspect Product</h1>
          <p className="text-sm text-gray-500 mt-2">
            Upload an image to test against a registered product model.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-green-600">
           <Zap size={14} className="fill-green-600" />
           System Ready
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Console: Template & Inputs */}
        <div className="lg:col-span-8 space-y-8">
           <Card className="bg-white border-gray-200">
              <div className="flex flex-col md:flex-row gap-8">
                 <div className="flex-1 space-y-6">
                    <div className="flex flex-col gap-1.5">
                       <label className="text-sm font-medium text-gray-700">Select Product Model</label>
                       <select 
                          className="w-full bg-white border border-gray-300 rounded-md px-4 py-3 text-sm text-gray-900 focus:border-blue-500 outline-none"
                          value={selectedTemplateId}
                          onChange={(e) => setSelectedTemplateId(e.target.value)}
                       >
                          {activeTemplates.map(t => (
                             <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                          {activeTemplates.length === 0 && <option value="">No models registered yet</option>}
                       </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 bg-gray-50 border border-gray-200 rounded-md flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 transition-all border-dashed">
                          <Camera size={24} className="text-gray-500" />
                          <span className="text-xs font-medium text-gray-600">Use Webcam</span>
                       </div>
                       <div className="p-4 bg-gray-50 border border-gray-200 rounded-md flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 transition-all border-dashed">
                          <Monitor size={24} className="text-gray-500" />
                          <span className="text-xs font-medium text-gray-600">Stream Feed</span>
                       </div>
                    </div>
                 </div>

                 <div className="hidden md:block w-px bg-gray-200" />

                 <div className="w-full md:w-1/3 flex flex-col justify-center gap-4">
                    <div className="flex items-center justify-between text-sm">
                       <span className="text-gray-500">Inference Mode</span>
                       <span className="text-blue-600 font-medium">Standard</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                       <span className="text-gray-500">Speed</span>
                       <span className="text-gray-900 font-medium">Real-time</span>
                    </div>
                 </div>
              </div>
           </Card>

           {!image ? (
              <Card padding={false} className="overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50">
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      setError(null);
                      setImage(file);
                    }
                  }}
                  onClick={() => document.getElementById('sample-upload').click()}
                  className="p-20 text-center flex flex-col items-center group cursor-pointer"
                >
                   <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-gray-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all border border-gray-200 group-hover:border-blue-200 mb-6 shadow-sm">
                      <Upload size={32} />
                   </div>
                   <h3 className="text-lg font-bold text-gray-900 mb-2">Upload File</h3>
                   <p className="text-sm text-gray-500 mb-8">Drop image or click below to select a local file</p>
                   <input type="file" id="sample-upload" className="hidden" onChange={handleFileDrop} />
                   <Button 
                     type="button"
                     variant="secondary" 
                     className="px-10 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                     onClick={(e) => {
                       e.stopPropagation();
                       document.getElementById('sample-upload').click();
                     }}
                   >
                     Select Image
                   </Button>
                </div>
              </Card>
           ) : (
              <div className="space-y-6">
                 <div className="aspect-video w-full rounded-lg border border-gray-200 bg-gray-50 overflow-hidden relative group shadow-sm">
                    <img src={URL.createObjectURL(image)} alt="Preview" className="w-full h-full object-contain p-4 transition-transform duration-700" />
                    <div className="absolute top-4 left-4 p-2 bg-white/90 backdrop-blur border border-gray-200 rounded text-xs text-gray-600 shadow-sm">
                       {image.name}
                    </div>
                    <button 
                       onClick={() => setImage(null)}
                       className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur border border-gray-200 rounded text-red-500 hover:text-red-700 transition-all text-xs font-semibold shadow-sm"
                    >
                       Remove
                    </button>
                 </div>

                 <Button 
                    variant="primary" 
                    fullWidth={true} 
                    className="py-4 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                    loading={isInspecting}
                    onClick={handleRunInspection}
                 >
                    <Cpu size={20} className="mr-3" />
                    Inspect Image
                 </Button>
              </div>
           )}
        </div>

        {/* Right Info: Protocol Specs */}
        <div className="lg:col-span-4 space-y-6">
           <Card className="bg-white border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                 <Info size={18} className="text-blue-600" />
                 Model Details
              </h4>
              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between mb-2">
                       <span className="text-sm text-gray-500">Expected Accuracy</span>
                       <span className="text-sm text-gray-900 font-medium">98.4%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                       <div className="w-[98.4%] h-full bg-green-500" />
                    </div>
                 </div>
                 
                 <div className="space-y-3">
                    <p className="text-sm text-gray-500 leading-relaxed">
                      The system compares uploaded images against the registered baseline product images. If the deviation is above your set tolerance, the system flags it as defective.
                    </p>
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
