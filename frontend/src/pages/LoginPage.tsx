import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';
import toast from 'react-hot-toast';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      setAuth(res.data.token, res.data.user);
      toast.success('Login bem-sucedido!');
      navigate('/');
    } catch (error) {
      toast.error('Erro ao fazer login. Verifique suas credenciais.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-sidebar p-8 rounded-lg shadow-lg w-96 border border-border">
        <h2 className="text-2xl font-bold mb-6 text-center text-primary">EventIA</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-textSecondary mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background border border-border p-2 rounded text-textPrimary focus:outline-none focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-textSecondary mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-border p-2 rounded text-textPrimary focus:outline-none focus:border-primary"
              required
            />
          </div>
          <button type="submit" className="w-full bg-primary hover:bg-primaryHover text-white p-2 rounded transition-colors">
            Entrar
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-textSecondary">
          Não tem uma conta? <Link to="/register" className="text-primary hover:underline">Registre-se</Link>
        </p>
      </div>
    </div>
  );
};
