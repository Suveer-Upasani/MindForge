import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Loader } from '../../components/ui/Loader';
import { 
  Layers, 
  Grid3X3, 
  Cpu
} from 'lucide-react';

const ICON_MAP = {
  textile: Layers,
  ceramic: Grid3X3,
  metal: Cpu
};

export default function Categories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const data = await api.getCategories();
        setCategories(data);
      } catch (err) {
        setError('Systems Connectivity Failure. Could not reach neural database.');
      } finally {
        setLoading(false);
      }
    };
    fetchCats();
  }, []);

  const handleSelect = (category) => {
    navigate(`/templates?category=${category.name}`);
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center animate-pulse">
        <Loader size="lg" message="Accessing Secure Domain Library..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
        <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 font-mono text-sm max-w-md text-center">
          {error}
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry Initialization</Button>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12 animate-in fade-in duration-500">
      <div className="border-b border-slate-800 pb-10">
        <h1 className="font-mono text-3xl font-bold text-white tracking-tight uppercase">Industry Viewports</h1>
        <p className="text-sm text-slate-500 mt-2 font-mono tracking-widest uppercase">Step 01 / <span className="text-brand-primary">Module Configuration</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories.map((cat) => {
          const Icon = ICON_MAP[cat.id] || Layers;
          return (
            <Card key={cat.id} padding={false} className="flex flex-col group hover:border-brand-primary/30 transition-all">
              <div className="p-8 border-b border-slate-700 bg-slate-800/30">
                <div className="w-12 h-12 rounded bg-slate-700 flex items-center justify-center text-slate-400 mb-6 group-hover:bg-brand-primary group-hover:text-white transition-all border border-slate-600 group-hover:border-brand-primary/50">
                  <Icon size={24} />
                </div>
                <h3 className="font-mono text-xl font-bold text-white uppercase tracking-tight">{cat.name}</h3>
                <p className="text-xs text-slate-400 mt-2 font-mono tracking-tight leading-relaxed uppercase">{cat.shortDescription}</p>
              </div>
              
              <div className="p-8 flex-1 bg-slate-800/10">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 block">Standard Diagnostic Range:</span>
                <div className="flex flex-wrap gap-2 mb-8">
                  {cat.commonDefects.map((defect) => (
                    <Badge key={defect} variant="neutral" size="sm" className="bg-slate-800/50">{defect}</Badge>
                  ))}
                </div>
                
                <Button 
                  variant="primary" 
                  fullWidth={true} 
                  className="uppercase tracking-widest font-bold shadow-xl shadow-blue-900/5"
                  onClick={() => handleSelect(cat)}
                >
                  Access Domain Library
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="bg-slate-900/50 border-dashed border-slate-700 p-8 text-center flex flex-col items-center">
         <p className="text-xs text-slate-500 font-mono uppercase tracking-[0.2em] mb-4">Laboratory Request System</p>
         <p className="text-sm text-slate-400 max-w-lg mb-6">Need defect detection for a category not listed above? Our engineers can train the core engine for custom material surfaces.</p>
         <button className="text-xs font-bold text-brand-primary hover:text-white uppercase tracking-widest transition-colors font-mono underline underline-offset-8 decoration-brand-primary/30 hover:decoration-white">Contact Systems Integration &rarr;</button>
      </Card>
    </div>
  );
}
