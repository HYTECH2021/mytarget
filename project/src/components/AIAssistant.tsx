import { useState, useEffect } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface AIAssistantProps {
  userInput: string;
  onCategorySuggest?: (category: string) => void;
  onBudgetSuggest?: (budget: string) => void;
}

interface AISuggestion {
  categories: string[];
  budgetRange: string;
  budgetMin?: number;
  budgetMax?: number;
}

export function AIAssistant({ userInput, onCategorySuggest, onBudgetSuggest }: AIAssistantProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      // Attendi almeno 2 caratteri prima di chiamare l'API
      if (!userInput || userInput.trim().length < 2) {
        setSuggestions(null);
        return;
      }

      // Debounce: aspetta 800ms dopo l'ultimo input
      const timeoutId = setTimeout(async () => {
        setLoading(true);
        setError(null);

        try {
          const apiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_GROK_API_KEY;
          
          if (!apiKey) {
            // Fallback a suggerimenti basati su regole se non c'è API key
            const fallbackSuggestions = getFallbackSuggestions(userInput);
            setSuggestions(fallbackSuggestions);
            setLoading(false);
            return;
          }

          const prompt = `Suggerisci categorie e budget per: "${userInput}"

Rispondi SOLO in formato JSON valido con questa struttura esatta:
{
  "categories": ["categoria1", "categoria2"],
  "budgetRange": "400-900€",
  "budgetMin": 400,
  "budgetMax": 900
}

Suggerisci 2-3 categorie rilevanti e un budget medio basato su statistiche di mercato.`;

          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: 'gpt-3.5-turbo',
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.7,
              max_tokens: 200,
            }),
          });

          if (!response.ok) {
            throw new Error('Errore nella chiamata API');
          }

          const data = await response.json();
          const content = data.choices[0]?.message?.content || '';
          
          // Estrai JSON dalla risposta
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            setSuggestions({
              categories: parsed.categories || [],
              budgetRange: parsed.budgetRange || '',
              budgetMin: parsed.budgetMin,
              budgetMax: parsed.budgetMax,
            });
          } else {
            throw new Error('Formato risposta non valido');
          }
        } catch (err) {
          console.error('AI suggestion error:', err);
          // Fallback a suggerimenti basati su regole
          const fallbackSuggestions = getFallbackSuggestions(userInput);
          setSuggestions(fallbackSuggestions);
        } finally {
          setLoading(false);
        }
      }, 800);

      return () => clearTimeout(timeoutId);
    };

    fetchSuggestions();
  }, [userInput]);

  const getFallbackSuggestions = (input: string): AISuggestion => {
    const lowerInput = input.toLowerCase();
    const suggestions: AISuggestion = {
      categories: [],
      budgetRange: '',
    };

    // Mappatura categorie basata su parole chiave
    if (lowerInput.includes('divano') || lowerInput.includes('tavolo') || lowerInput.includes('mobile') || lowerInput.includes('arredamento')) {
      suggestions.categories = ['Casa e Giardino', 'Arredamento', 'Mobili su misura'];
      suggestions.budgetRange = '400-900€';
      suggestions.budgetMin = 400;
      suggestions.budgetMax = 900;
    } else if (lowerInput.includes('iphone') || lowerInput.includes('samsung') || lowerInput.includes('tablet') || lowerInput.includes('laptop')) {
      suggestions.categories = ['Elettronica', 'Smartphone e Telefonia', 'Computer e Accessori'];
      suggestions.budgetRange = '300-1200€';
      suggestions.budgetMin = 300;
      suggestions.budgetMax = 1200;
    } else if (lowerInput.includes('auto') || lowerInput.includes('moto') || lowerInput.includes('veicolo')) {
      suggestions.categories = ['Auto e Moto', 'Veicoli Usati'];
      suggestions.budgetRange = '5000-25000€';
      suggestions.budgetMin = 5000;
      suggestions.budgetMax = 25000;
    } else if (lowerInput.includes('vestito') || lowerInput.includes('scarpe') || lowerInput.includes('borsa') || lowerInput.includes('moda')) {
      suggestions.categories = ['Moda e Abbigliamento', 'Accessori Moda'];
      suggestions.budgetRange = '50-300€';
      suggestions.budgetMin = 50;
      suggestions.budgetMax = 300;
    } else {
      suggestions.categories = ['Altro'];
      suggestions.budgetRange = '100-500€';
      suggestions.budgetMin = 100;
      suggestions.budgetMax = 500;
    }

    return suggestions;
  };

  const handleCategoryClick = (category: string) => {
    if (onCategorySuggest) {
      onCategorySuggest(category);
    }
  };

  const handleBudgetClick = () => {
    if (suggestions?.budgetMin && onBudgetSuggest) {
      const avgBudget = Math.round((suggestions.budgetMin + (suggestions.budgetMax || suggestions.budgetMin)) / 2);
      onBudgetSuggest(avgBudget.toString());
    }
  };

  if (!userInput || userInput.trim().length < 2) return null;

  return (
    <div className="mt-3 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-orange-600/20 flex items-center justify-center flex-shrink-0">
          {loading ? (
            <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 text-orange-500" />
          )}
        </div>
        <div className="flex-1 space-y-3">
          <div className="text-xs text-slate-400">Suggerimenti AI</div>
          
          {loading ? (
            <div className="text-sm text-slate-300">Analizzando la tua richiesta...</div>
          ) : suggestions ? (
            <>
              {suggestions.categories.length > 0 && (
                <div>
                  <div className="text-xs text-slate-400 mb-2">Categorie suggerite:</div>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.categories.map((cat, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleCategoryClick(cat)}
                        className="px-3 py-1.5 text-xs rounded-xl bg-orange-600/20 text-orange-400 border border-orange-600/30 hover:bg-orange-600/30 hover:border-orange-600/50 transition-all"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {suggestions.budgetRange && (
                <div>
                  <div className="text-xs text-slate-400 mb-2">Budget suggerito:</div>
                  <button
                    type="button"
                    onClick={handleBudgetClick}
                    className="px-3 py-1.5 text-xs rounded-xl bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-green-600/30 hover:border-green-600/50 transition-all"
                  >
                    {suggestions.budgetRange} (media: €{Math.round((suggestions.budgetMin || 0) + ((suggestions.budgetMax || suggestions.budgetMin || 0) - (suggestions.budgetMin || 0)) / 2)})
                  </button>
                </div>
              )}
            </>
          ) : error ? (
            <div className="text-sm text-red-400">{error}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
