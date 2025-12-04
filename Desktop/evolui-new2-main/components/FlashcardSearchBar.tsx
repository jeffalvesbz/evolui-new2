import React, { useState, useMemo } from 'react';
import { SearchIcon, TagIcon, XIcon } from './icons';

interface FlashcardSearchBarProps {
    onSearch: (query: string) => void;
    onTagsFilter: (tags: string[]) => void;
    availableTags: string[];
}

export const FlashcardSearchBar: React.FC<FlashcardSearchBarProps> = ({
    onSearch,
    onTagsFilter,
    availableTags,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [showTagsDropdown, setShowTagsDropdown] = useState(false);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        onSearch(query);
    };

    const toggleTag = (tag: string) => {
        const newTags = selectedTags.includes(tag)
            ? selectedTags.filter(t => t !== tag)
            : [...selectedTags, tag];

        setSelectedTags(newTags);
        onTagsFilter(newTags);
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedTags([]);
        onSearch('');
        onTagsFilter([]);
    };

    const hasActiveFilters = searchQuery.length > 0 || selectedTags.length > 0;

    return (
        <div className="space-y-3">
            {/* Search Input */}
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Buscar por pergunta, resposta ou tag..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-10 py-2 bg-card/60 backdrop-blur-xl border border-white/10 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
                        title="Limpar filtros"
                    >
                        <XIcon className="w-4 h-4 text-muted-foreground" />
                    </button>
                )}
            </div>

            {/* Tags Filter */}
            {availableTags.length > 0 && (
                <div className="relative">
                    <button
                        onClick={() => setShowTagsDropdown(!showTagsDropdown)}
                        className="flex items-center gap-2 px-3 py-2 bg-card/60 backdrop-blur-xl border border-white/10 rounded-lg text-sm text-foreground hover:border-primary/50 transition-colors"
                    >
                        <TagIcon className="w-4 h-4" />
                        <span>Filtrar por tags</span>
                        {selectedTags.length > 0 && (
                            <span className="ml-1 px-2 py-0.5 bg-primary/20 text-primary rounded-full text-xs font-semibold">
                                {selectedTags.length}
                            </span>
                        )}
                    </button>

                    {showTagsDropdown && (
                        <div className="absolute top-full mt-2 w-full max-w-md bg-card border border-border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                            <div className="p-2 space-y-1">
                                {availableTags.map(tag => (
                                    <label
                                        key={tag}
                                        className="flex items-center gap-2 px-3 py-2 hover:bg-muted rounded-md cursor-pointer transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedTags.includes(tag)}
                                            onChange={() => toggleTag(tag)}
                                            className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                                        />
                                        <span className="text-sm text-foreground">{tag}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Selected Tags Display */}
            {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedTags.map(tag => (
                        <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium"
                        >
                            {tag}
                            <button
                                onClick={() => toggleTag(tag)}
                                className="hover:bg-primary/30 rounded-full p-0.5 transition-colors"
                            >
                                <XIcon className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};
