import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Clock, TrendingUp, Package } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Product } from '../../shared/types';
import { productsApi } from '../services/api';
import Badge from './Badge';

interface SearchComponentProps {
  onSearchChange?: (term: string) => void;
  placeholder?: string;
  showSuggestions?: boolean;
  className?: string;
  autoFocus?: boolean;
  onClose?: () => void;
}

interface SearchResult {
  id: string;
  name: string;
  description: string;
  category: string;
  image: string;
  isEcological: boolean;
  featured: boolean;
}

const SearchComponent: React.FC<SearchComponentProps> = ({
  onSearchChange,
  placeholder = "Buscar produtos...",
  showSuggestions = true,
  className = "",
  autoFocus = false,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches] = useState<string[]>([
    'caneta ecológica',
    'caderno reciclado',
    'squeeze personalizada',
    'mouse pad sustentável',
    'agenda corporativa'
  ]);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const debounceRef = useRef<NodeJS.Timeout>();

  // Carregar buscas recentes do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Salvar busca recente
  const saveRecentSearch = (term: string) => {
    if (term.trim().length < 2) return;
    
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Buscar produtos com debounce
  const searchProducts = async (term: string) => {
    if (term.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await productsApi.getProducts({ search: term, limit: 8 });
      
      if (response.success) {
        let products: Product[] = [];
        
        if (Array.isArray(response.data)) {
          products = response.data;
        } else if (response.data && typeof response.data === 'object') {
          const data = response.data as any;
          products = data.products || data.data || [];
        }
        
        const searchResults: SearchResult[] = products.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description,
          category: product.category,
          image: product.images[0] || '',
          isEcological: product.isEcological || false,
          featured: product.featured || false
        }));
        
        setResults(searchResults);
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change com debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowResults(true);
    
    if (onSearchChange) {
      onSearchChange(value);
    }

    // Debounce da busca
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      if (showSuggestions) {
        searchProducts(value);
      }
    }, 300);
  };

  // Handle search submit
  const handleSearch = (term?: string) => {
    const finalTerm = term || searchTerm;
    if (finalTerm.trim()) {
      saveRecentSearch(finalTerm);
      setShowResults(false);
      navigate(`/catalogo?search=${encodeURIComponent(finalTerm)}`);
      if (onClose) onClose();
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowResults(false);
      if (onClose) onClose();
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setResults([]);
    setShowResults(false);
    if (onSearchChange) {
      onSearchChange('');
    }
    inputRef.current?.focus();
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Highlight matching text
  const highlightMatch = (text: string, term: string) => {
    if (!term.trim()) return text;
    
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-gray-900 rounded px-1">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onFocus={() => setShowResults(true)}
          autoFocus={autoFocus}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        />
        
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showSuggestions && showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {loading && (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Buscando...</p>
            </div>
          )}

          {!loading && searchTerm.trim().length >= 2 && results.length > 0 && (
            <div>
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Produtos encontrados ({results.length})
                </p>
              </div>
              {results.map((result) => (
                <Link
                  key={result.id}
                  to={`/produto/${result.id}`}
                  onClick={() => {
                    saveRecentSearch(searchTerm);
                    setShowResults(false);
                    if (onClose) onClose();
                  }}
                  className="flex items-center p-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 mr-3">
                    <img
                      src={result.image}
                      alt={result.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAzMkMyOC40MTgzIDMyIDMyIDI4LjQxODMgMzIgMjRDMzIgMTkuNTgxNyAyOC40MTgzIDE2IDI0IDE2QzE5LjU4MTcgMTYgMTYgMTkuNTgxNyAxNiAyNEMxNiAyOC40MTgzIDE5LjU4MTcgMzIgMjQgMzJaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {highlightMatch(result.name, searchTerm)}
                      </h4>
                      {result.isEcological && (
                        <Badge variant="success" size="sm">Eco</Badge>
                      )}
                      {result.featured && (
                        <Badge variant="primary" size="sm">Destaque</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {highlightMatch(result.description, searchTerm)}
                    </p>
                  </div>
                  <Package className="w-4 h-4 text-gray-400 ml-2" />
                </Link>
              ))}
              
              {results.length >= 8 && (
                <div className="p-3 border-t border-gray-100">
                  <button
                    onClick={() => handleSearch()}
                    className="w-full text-center text-sm text-primary hover:text-primary-dark font-medium"
                  >
                    Ver todos os resultados para "{searchTerm}"
                  </button>
                </div>
              )}
            </div>
          )}

          {!loading && searchTerm.trim().length >= 2 && results.length === 0 && (
            <div className="p-4 text-center">
              <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Nenhum produto encontrado</p>
              <p className="text-xs text-gray-400 mt-1">Tente termos diferentes</p>
            </div>
          )}

          {!loading && searchTerm.trim().length < 2 && (
            <div>
              {recentSearches.length > 0 && (
                <div>
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Buscas recentes
                    </p>
                  </div>
                  {recentSearches.map((term, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchTerm(term);
                        handleSearch(term);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{term}</span>
                    </button>
                  ))}
                </div>
              )}
              
              <div>
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Buscas populares
                  </p>
                </div>
                {popularSearches.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchTerm(term);
                      handleSearch(term);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{term}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchComponent;