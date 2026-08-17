import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useEventStore } from '../store/useEventStore';
import { useAuthStore } from '../store/useAuthStore';
import { PlusCircle, LogOut } from 'lucide-react';

export const DashboardPage = () => {
  const { events, setEvents } = useEventStore();
  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/events');
        setEvents(res.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchEvents();
  }, [setEvents]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Meus Eventos</h1>
          <div className="flex gap-4">
            <Link to="/new" className="flex items-center gap-2 bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded">
              <PlusCircle size={20} /> Novo Evento
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-2 bg-sidebar border border-border px-4 py-2 rounded hover:bg-border transition-colors">
              <LogOut size={20} /> Sair
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Link key={event.id} to={`/editor/${event.id}`} className="block">
              <div className="bg-sidebar p-6 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer">
                <h3 className="text-xl font-semibold mb-2">{event.name}</h3>
                <p className="text-textSecondary text-sm mb-4">{event.type} • {event.guestCount} convidados</p>
                <div className="flex justify-between items-center">
                  <span className={`text-xs px-2 py-1 rounded ${event.status === 'COMPLETED' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                    {event.status}
                  </span>
                  <span className="text-xs text-textSecondary">
                    Atualizado em {new Date(event.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {events.length === 0 && (
             <div className="col-span-full text-center text-textSecondary py-12">
               Nenhum evento encontrado. Crie seu primeiro evento!
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
