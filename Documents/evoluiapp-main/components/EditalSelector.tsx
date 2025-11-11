import React from 'react';
import { useEditalStore } from '../stores/useEditalStore';
import { useModalStore } from '../stores/useModalStore';
import { ChevronDownIcon, PlusIcon } from './icons';

const EditalSelector: React.FC<{ className?: string }> = ({ className }) => {
  const { editais, editalAtivo, setEditalAtivo } = useEditalStore();
  const { openEditalModal } = useModalStore();

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedEdital = editais.find(ed => ed.id === selectedId) || null;
    setEditalAtivo(selectedEdital);
  };

  const handleCreateFirst = () => {
    openEditalModal();
    // O modal será aberto e o usuário pode clicar em "Novo Edital"
  };

  // Se não há editais, mostrar botão ao invés de select
  if (editais.length === 0) {
    return (
      <button
        onClick={handleCreateFirst}
        className={`w-full flex items-center justify-center gap-2 rounded-md border-2 border-dashed border-primary/50 bg-primary/10 py-2.5 px-4 text-sm font-semibold text-primary hover:bg-primary/20 hover:border-primary transition-colors ${className || ''}`}
        data-tutorial="edital-selector"
      >
        <PlusIcon className="w-4 h-4" />
        Criar primeiro plano de estudos
      </button>
    );
  }

  return (
    <div data-tutorial="edital-selector" className={`relative ${className || ''}`}>
      <select
        value={editalAtivo?.id || ''}
        onChange={handleSelect}
        className="w-full appearance-none rounded-md border border-border bg-background py-2 pl-3 pr-8 text-sm font-semibold text-foreground shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        {editais.map(edital => (
          <option key={edital.id} value={edital.id}>
            {edital.nome}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
    </div>
  );
};

export default EditalSelector;