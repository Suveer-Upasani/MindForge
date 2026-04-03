import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemplates } from '../../context/TemplateContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ArrowLeft, Save, Upload, Images, CheckCircle2 } from 'lucide-react';
import { Loader } from '../../components/ui/Loader';

const MOCK_CALIBRATION_TIME = 2500; // Fast for demo purposes

export default function AddProduct() {
  const navigate = useNavigate();
  const { addTemplate } = useTemplates();
  const fileInputRef = useRef();
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'Textile',
  });
  
  const [images, setImages] = useState([]);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationComplete, setCalibrationComplete] = useState(false);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    // Create local object URLs for display
    const newImages = files.map(file => URL.createObjectURL(file));
    setImages(prev => [...prev, ...newImages].slice(0, 20)); // Max 20
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || images.length === 0) return;
    
    setIsCalibrating(true);
    
    // Simulate Calibration Engine (ViT / ConvNeXt features, PatchCore/PaDiM fit under 20 seconds)
    setTimeout(() => {
      setIsCalibrating(false);
      setCalibrationComplete(true);
      
      // Save product to dashboard
      addTemplate({
        name: formData.name,
        category: formData.category,
        description: `Model trained on ${images.length} images.`,
        tolerance: 'Medium'
      });
      
      setTimeout(() => {
         navigate('/');
      }, 1500); // Redirect after showing success
    }, MOCK_CALIBRATION_TIME);
  };

  if (isCalibrating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <Loader />
        <h2 className="text-2xl font-bold text-gray-900">Calibration Engine Running</h2>
        <p className="text-gray-500 max-w-md text-center">
          Extracting features and fitting anomaly model. This typically takes under 20 seconds...
        </p>
      </div>
    );
  }

  if (calibrationComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <CheckCircle2 size={64} className="text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Custom Model Saved!</h2>
        <p className="text-gray-500">Product registered successfully. Returning to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 border-b border-gray-200 pb-8">
        <button 
          onClick={() => navigate('/')}
          className="p-2 text-gray-400 hover:text-gray-900 transition-colors border border-gray-200 rounded-md hover:bg-gray-50"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-sm text-gray-500 mt-1">Upload 10-20 images to calibrate a custom anomaly model.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="bg-white border text-gray-900 border-gray-200 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Input 
              label="Product Name" 
              placeholder="e.g. Denim Weave" 
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-white border-gray-300 focus:border-blue-500 text-gray-900"
            />
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Category</label>
              <select 
                className="bg-white border border-gray-300 rounded-md px-4 py-3 text-sm text-gray-900 focus:border-blue-500 outline-none"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Textile">Textile</option>
                <option value="Ceramic">Ceramic</option>
                <option value="Metal">Metal</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
             <label className="text-sm font-medium text-gray-700">Reference Images (10-20 required)</label>
             <div 
               className="border-2 border-dashed border-gray-300 rounded-lg p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors"
               onClick={() => fileInputRef.current?.click()}
             >
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                />
                <Images size={32} className="text-gray-400 mb-4" />
                <p className="text-sm font-medium text-gray-700 mb-1">Click to upload images</p>
                <p className="text-xs text-gray-500">Supports JPG, PNG (Max 5MB each)</p>
             </div>

             {images.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-4">
                   {images.map((src, idx) => (
                     <div key={idx} className="w-16 h-16 rounded overflow-hidden shadow-sm border border-gray-200">
                        <img src={src} alt="Uploaded preview" className="w-full h-full object-cover" />
                     </div>
                   ))}
                </div>
             )}
          </div>
        </Card>

        <div className="flex items-center justify-end gap-4 pt-4">
          <Button 
            variant="secondary" 
            type="button" 
            onClick={() => navigate('/')}
            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8"
            disabled={!formData.name || images.length === 0}
          >
            <Save size={18} className="mr-2" />
            Calibrate Model
          </Button>
        </div>
      </form>
    </div>
  );
}
