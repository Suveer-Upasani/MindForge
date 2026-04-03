import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Boxes, Zap, HardDrive } from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login('user');
      setLoading(false);
      navigate('/');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative overflow-hidden font-sans text-gray-900">
      
      <div className="w-full max-w-lg relative z-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded bg-blue-600 flex items-center justify-center shadow-lg transform rotate-45">
            <Boxes size={32} className="text-white -rotate-45" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sign Up</h1>
            <p className="text-gray-500 mt-2">Create your MindForge account</p>
          </div>
        </div>

        <Card className="border border-gray-200 shadow-xl bg-white p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Input label="Email Address" type="email" placeholder="john@acme.com" required className="bg-white border-gray-300 focus:border-blue-500 text-gray-900" />
               <Input label="Full Name" placeholder="John Doe" required className="bg-white border-gray-300 focus:border-blue-500 text-gray-900" />
               <Input label="Password" type="password" placeholder="••••••••" required className="bg-white border-gray-300 focus:border-blue-500 text-gray-900" />
               <Input label="Company Size" type="number" placeholder="Number of employees" required className="bg-white border-gray-300 focus:border-blue-500 text-gray-900" />
               <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 px-1">Category</label>
                  <select className="bg-white border border-gray-300 rounded-md px-4 py-3 text-sm text-gray-900 focus:border-blue-500 outline-none hover:border-blue-400 transition-colors">
                     <option>Textile</option>
                     <option>Ceramic</option>
                     <option>Metal</option>
                  </select>
               </div>
            </div>

            <div className="space-y-4 pt-4">
               <Button variant="primary" fullWidth={true} loading={loading} className="py-4 font-bold text-lg shadow-md bg-blue-600 hover:bg-blue-700">
                Create Account
              </Button>
              <p className="text-center text-sm text-gray-500">
                Already have an account? <Link to="/login" className="text-blue-600 hover:underline font-medium">Log in</Link>
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
