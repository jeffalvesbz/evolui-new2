import React from 'react';
import { useEditalStore } from '../stores/useEditalStore';
import { ChevronDownIcon } from './icons';

const EditalSelector: React.FC<{ className?: string }> = ({ className }) => {
  const { editais, editalAtivo, setEditalAtivo } = useEditalStore();

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedEdital = editais.find(ed => ed.id === selectedId) || null;
    setEditalAtivo(selectedEdital);
  };

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