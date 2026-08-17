import { CanvasArea } from '../components/CanvasArea';
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle, Undo, Redo, Download } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useLayoutStore } from '../store/useLayoutStore';
import { Sidebar } from '../components/Sidebar';
import { AiAssistant } from '../components/AiAssistant';
// import { CanvasArea } from '../components/CanvasArea'; // to be created next

export const EditorPage = () => {
  const { eventId } = useParams();
  const { layout, setLayout, undo, redo, historyStep, history } = useLayoutStore();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        const res = await api.get(`/layouts/${eventId}`);
        if (res.data && res.data.id) {
          setLayout(res.data);
        }
      } catch (error) {
        toast.error('Erro ao carregar layout');
      }
    };
    if (eventId) fetchLayout();
  }, [eventId, setLayout]);

  // Auto save debounce setup can be added, for now manual/button save
  const handleSave = async (showToast = true) => {
    if (!layout) return;
    setSaving(true);
    try {
      await api.put(`/layouts/${layout.id}`, {
        elements: layout.elements,
        canvasW: layout.canvasW,
        canvasH: layout.canvasH
      });
      if (showToast) toast.success('Layout salvo!');
    } catch (error) {
      toast.error('Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

    useEffect(() => {
    const timer = setTimeout(() => {
      if (!layout) return;
      handleSave(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [layout?.elements, layout?.canvasW, layout?.canvasH]);

  const handleValidate = async () => {
    if (!layout) return;
    try {
      // save first
      await api.put(`/layouts/${layout.id}`, { elements: layout.elements, canvasW: layout.canvasW, canvasH: layout.canvasH });
      const res = await api.post(`/layouts/${layout.id}/validate`);
      if (res.data.passed) {
        toast.success('Layout Válido! Nenhuma violação CSP.');
      } else {
        toast.error(`Problemas encontrados:\n${res.data.issues.join('\n')}`, { duration: 5000 });
      }
    } catch (error) {
      toast.error('Erro ao validar.');
    }
  };

  const handleExport = async () => {
     if (!layout) return;
     const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(layout, null, 2));
     const downloadAnchorNode = document.createElement('a');
     downloadAnchorNode.setAttribute("href",     dataStr);
     downloadAnchorNode.setAttribute("download", layout.name + ".json");
     document.body.appendChild(downloadAnchorNode);
     downloadAnchorNode.click();
     downloadAnchorNode.remove();
  };

  if (!layout) return <div className="flex h-screen items-center justify-center bg-background text-primary">Carregando...</div>;

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <div className="h-16 bg-sidebar border-b border-border flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-textSecondary hover:text-textPrimary transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-textPrimary">{layout.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={undo} disabled={historyStep === 0} className="p-2 text-textSecondary hover:text-textPrimary disabled:opacity-50">
            <Undo size={18} />
          </button>
          <button onClick={redo} disabled={historyStep === history.length - 1} className="p-2 text-textSecondary hover:text-textPrimary disabled:opacity-50 mr-4">
            <Redo size={18} />
          </button>

          <button onClick={handleValidate} className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded text-sm hover:border-primary transition-colors">
            <CheckCircle size={16} className="text-warning" /> Validar
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded text-sm hover:border-primary transition-colors">
            <Download size={16} /> Exportar
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-primary hover:bg-primaryHover text-white px-4 py-1.5 rounded text-sm transition-colors">
            <Save size={16} /> {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 relative overflow-auto bg-[#1a1a1f] flex items-center justify-center p-8">
           {/* We will render CanvasArea here */}
           <CanvasArea />
        </div>
        <AiAssistant eventId={eventId!} />
      </div>
    </div>
  );
};
