import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // 1. ADIM: Başlangıçta localStorage'ı anında (senkron) okuyarak gecikmeyi önlüyoruz
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('app_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('app_user');
  });

  // Artık anında okunduğu için yükleme (loading) durumlarına gerek yok, false/true başlatıyoruz.
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [authChecked, setAuthChecked] = useState(true);
  
  // Mevcut yapınızı bozmamak için tuttuğumuz diğer state'ler
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState({ id: 'local', public_settings: {} });

  // 2. ADIM: Eksik olan login fonksiyonunu ekliyoruz
  const login = (userData) => {
    localStorage.setItem('app_user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = (shouldRedirect = true) => {
    localStorage.removeItem('app_user');
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);

    if (shouldRedirect) {
      window.location.href = '/login';
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  // Eski kodlarınızın hata vermemesi için uyumluluk fonksiyonları
  const checkUserAuth = async () => {
    const stored = localStorage.getItem('app_user');
    if (stored) {
      setUser(JSON.parse(stored));
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    setAuthChecked(true);
  };

  const checkAppState = async () => {
    await checkUserAuth();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      login, // <-- Login sayfasında kullanılacak fonksiyon
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};