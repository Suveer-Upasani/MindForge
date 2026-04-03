import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(null); // 'company' | 'user'

  // Load from session if needed (simulated)
  useEffect(() => {
    const storedUser = localStorage.getItem('mf_user');
    const storedRole = localStorage.getItem('mf_role');
    if (storedUser && storedRole) {
      setUser(JSON.parse(storedUser));
      setRole(storedRole);
      setIsAuthenticated(true);
    }
  }, []);

  const login = (roleType, password) => {
    // Simulated strong authentication
    // In a real app, this would be a POST /api/login
    
    let userData = {};
    if (roleType === 'company') {
      userData = {
        name: 'Enterprise Admin',
        company: 'MindForge Global',
        role: 'Administrator',
        clearance: 'L5'
      };
    } else {
      userData = {
        name: 'Operator 04',
        workstation: 'Line-8A',
        role: 'Technician',
        clearance: 'L2'
      };
    }

    setUser(userData);
    setRole(roleType);
    setIsAuthenticated(true);
    
    localStorage.setItem('mf_user', JSON.stringify(userData));
    localStorage.setItem('mf_role', roleType);

    return Promise.resolve();
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setRole(null);
    localStorage.removeItem('mf_user');
    localStorage.removeItem('mf_role');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
