import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

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

  const login = async (roleType, email, password) => {
    try {
      const userData = await authService.login({ email, password });
      setUser(userData);
      setRole(roleType);
      setIsAuthenticated(true);
      
      localStorage.setItem('mf_user', JSON.stringify(userData));
      localStorage.setItem('mf_role', roleType);
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (userData) => {
    try {
      const newUser = await authService.signup(userData);
      setUser(newUser);
      setRole(userData.role);
      setIsAuthenticated(true);
      
      localStorage.setItem('mf_user', JSON.stringify(newUser));
      localStorage.setItem('mf_role', userData.role);
      return newUser;
    } catch (error) {
       console.error('Signup error:', error);
       throw error;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setRole(null);
    localStorage.removeItem('mf_user');
    localStorage.removeItem('mf_role');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, role, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
