import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

export const NewEventPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    type: 'WEDDING',
    guestCount: 100,
    date: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/events', {
        ...formData,
        guestCount: parseInt(formData.guestCount.toString(), 10)
      });
      // create default layout
      await api.post('/layouts', { eventId: res.data.id, canvasW: 1200, canvasH: 700 });
      toast.success('Evento criado!');
      navigate(`/editor/${res.data.id}`);
    } catch (error) {
      toast.error('Erro ao criar evento.');
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="flex items-center gap-2 text-textSecondary hover:text-textPrimary mb-6">
          <ArrowLeft size={20} /> Voltar
        </Link>
        <div className="bg-sidebar p-8 rounded-lg border border-border">
          <h2 className="text-2xl font-bold mb-6 text-primary">Novo Evento</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-textSecondary mb-1">Nome do Evento</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-background border border-border p-2 rounded text-textPrimary focus:outline-none focus:border-primary"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-textSecondary mb-1">Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full bg-background border border-border p-2 rounded text-textPrimary focus:outline-none focus:border-primary"
                >
                  <option value="WEDDING">Casamento</option>
                  <option value="CORPORATE">Corporativo</option>
                  <option value="BIRTHDAY">Aniversário</option>
                  <option value="DINNER">Jantar</option>
                  <option value="SHOW">Show</option>
                  <option value="OTHER">Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-textSecondary mb-1">Convidados</label>
                <input
                  type="number"
                  value={formData.guestCount}
                  onChange={(e) => setFormData({...formData, guestCount: parseInt(e.target.value) || 0})}
                  className="w-full bg-background border border-border p-2 rounded text-textPrimary focus:outline-none focus:border-primary"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-textSecondary mb-1">Data (opcional)</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full bg-background border border-border p-2 rounded text-textPrimary focus:outline-none focus:border-primary"
              />
            </div>
            <button type="submit" className="w-full bg-primary hover:bg-primaryHover text-white p-2 rounded transition-colors mt-6">
              Criar e Ir para Editor
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
