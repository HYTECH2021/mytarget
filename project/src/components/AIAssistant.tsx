import { useState, useEffect } from 'react';
import { Sparkles, Loader2, Lightbulb, TrendingUp, HelpCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

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
  clarification?: string;
}

interface AIQuestion {
  id: string;
  text: string;
  options: string[];
  context: 'category' | 'budget' | 'specificity' | 'type';
}

interface LearnedPattern {
  keywords: string[];
  category: string;
  avgBudget: number;
  minBudget: number;
  maxBudget: number;
  count: number;
}

export function AIAssistant({ userInput, onCategorySuggest, onBudgetSuggest }: AIAssistantProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [learnedPatterns, setLearnedPatterns] = useState<LearnedPattern[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<AIQuestion | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<Map<string, string>>(new Map());
  const [questionHistory, setQuestionHistory] = useState<string[]>([]);

  // Carica categorie disponibili dal database
  useEffect(() => {
    const loadCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('name')
        .eq('is_active', true)
        .order('request_count', { ascending: false })
        .limit(20);
      
      if (data) {
        setAvailableCategories(data.map(c => c.name));
      }
    };
    loadCategories();
  }, []);

  // Autoapprendimento: analizza target esistenti per estrarre pattern
  useEffect(() => {
    const learnFromTargets = async () => {
      try {
        // Carica gli ultimi 500 target per analisi pattern
        const { data: targets } = await supabase
          .from('targets')
          .select('title, category, budget, status')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(500);

        if (!targets || targets.length === 0) return;

        // Estrai pattern: raggruppa per categoria e analizza keywords comuni
        const patternMap = new Map<string, { keywords: Set<string>, budgets: number[], count: number }>();

        targets.forEach(target => {
          if (!target.category) return;
          
          const existing = patternMap.get(target.category) || {
            keywords: new Set<string>(),
            budgets: [] as number[],
            count: 0
          };

          // Estrai keywords dal titolo (parole significative, escludi articoli/preposizioni)
          const stopWords = ['il', 'la', 'lo', 'gli', 'le', 'un', 'una', 'di', 'da', 'in', 'per', 'con', 'su', 'a', 'e', 'o', 'cerco', 'vorrei', 'ho bisogno', 'serve'];
          const words = target.title.toLowerCase()
            .split(/\s+/)
            .filter(w => w.length > 3 && !stopWords.includes(w));
          
          words.forEach(word => existing.keywords.add(word));
          
          if (target.budget && typeof target.budget === 'number') {
            existing.budgets.push(target.budget);
          }
          existing.count++;
          patternMap.set(target.category, existing);
        });

        // Converti pattern in array per uso nell'AI
        const patterns: LearnedPattern[] = Array.from(patternMap.entries()).map(([category, data]) => {
          const budgets = data.budgets.filter(b => b > 0);
          const avgBudget = budgets.length > 0 
            ? Math.round(budgets.reduce((a, b) => a + b, 0) / budgets.length)
            : 500;
          const minBudget = budgets.length > 0 ? Math.min(...budgets) : avgBudget * 0.5;
          const maxBudget = budgets.length > 0 ? Math.max(...budgets) : avgBudget * 1.5;

          return {
            keywords: Array.from(data.keywords).slice(0, 20), // Top 20 keywords per categoria
            category,
            avgBudget,
            minBudget,
            maxBudget,
            count: data.count
          };
        });

        // Ordina per frequenza (count) e salva
        patterns.sort((a, b) => b.count - a.count);
        setLearnedPatterns(patterns);

        // Salva in localStorage per cache (aggiorna ogni ora)
        try {
          localStorage.setItem('ai_learned_patterns', JSON.stringify({
            patterns,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.warn('Could not save patterns to localStorage:', e);
        }
      } catch (error) {
        console.error('Error learning from targets:', error);
      }
    };

    // Carica da cache se disponibile e recente (< 1 ora)
    try {
      const cached = localStorage.getItem('ai_learned_patterns');
      if (cached) {
        const { patterns, timestamp } = JSON.parse(cached);
        const oneHour = 60 * 60 * 1000;
        if (Date.now() - timestamp < oneHour) {
          setLearnedPatterns(patterns);
          return;
        }
      }
    } catch (e) {
      // Ignora errori cache
    }

    // Carica pattern dal database
    learnFromTargets();
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      // Attendi almeno 3 caratteri
      if (!userInput || userInput.trim().length < 3) {
        setSuggestions(null);
        return;
      }

      // Debounce: aspetta 1000ms dopo l'ultimo input
      const timeoutId = setTimeout(async () => {
        setLoading(true);
        setError(null);

        try {
          const apiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_GROK_API_KEY;
          
          // Usa sempre fallback migliorato con pattern appresi
          const fallbackSuggestions = getSmartSuggestions(userInput, availableCategories, learnedPatterns, answeredQuestions);
          
          // Determina se serve fare domande (match debole o ricerca vaga)
          const needsClarification = shouldAskQuestion(userInput, fallbackSuggestions, learnedPatterns);
          
          // Se serve chiarimento e non abbiamo ancora fatto domande, mostra domanda
          if (needsClarification && currentQuestion === null && questionHistory.length < 2) {
            const question = generateQuestion(userInput, fallbackSuggestions, availableCategories, answeredQuestions);
            if (question) {
              setCurrentQuestion(question);
              setLoading(false);
              return;
            }
          }
          
          if (!apiKey) {
            setSuggestions(fallbackSuggestions);
            setLoading(false);
            return;
          }

          // Costruisci contesto con pattern appresi per migliorare il prompt
          const learnedContext = learnedPatterns.length > 0
            ? `\n\nPATTERN APPRESI DALLE RICERCHE ESISTENTI:\n` +
              learnedPatterns.slice(0, 5).map(p => 
                `- Categoria "${p.category}": keyword comuni (${p.keywords.slice(0, 5).join(', ')}), budget medio €${p.avgBudget} (range: €${p.minBudget}-€${p.maxBudget}), ${p.count} ricerche`
              ).join('\n')
            : '';

          const categoryContext = availableCategories.length > 0 
            ? `Categorie disponibili nella piattaforma: ${availableCategories.slice(0, 15).join(', ')}`
            : '';

          const prompt = `Sei un assistente AI per un marketplace B2B. Un utente cerca: "${userInput}"

${categoryContext}
${learnedContext}

Analizza la richiesta usando questi dati:

1. Se la richiesta è VAGA o GENERICA (es: "qualcosa per casa", "ho bisogno di aiuto"):
   - Usa i pattern appresi per suggerire categorie PROBABILI
   - Suggerisci budget basati su ricerche simili già create
   - Aggiungi una nota per chiarire meglio la ricerca

2. Se la richiesta è SPECIFICA (es: "iPhone 15", "divano blu"):
   - Cerca keyword nei pattern appresi per match più precisi
   - Se trovi pattern simili, usa i loro budget come riferimento
   - Proponi categorie corrispondenti ai pattern trovati

3. Se trovi keyword nei pattern appresi, PRIORITIZZA quelle categorie e budget.

Rispondi SOLO in formato JSON:
{
  "categories": ["categoria1", "categoria2"],
  "budgetRange": "400-900€",
  "budgetMin": 400,
  "budgetMax": 900,
  "clarification": "Suggerimento se vaga, altrimenti null"
}

IMPORTANTE: 
- Preferisci sempre categorie che esistono nella lista
- Usa budget dei pattern appresi se il match è buono (>70% keyword match)
- Se non trovi match, usa budget di mercato generico`;

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
              max_tokens: 350,
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
            
            // Match le categorie con quelle disponibili
            const matchedCategories = parsed.categories?.map((cat: string) => {
              if (availableCategories.length > 0) {
                const exactMatch = availableCategories.find(ac => 
                  ac.toLowerCase() === cat.toLowerCase()
                );
                if (exactMatch) return exactMatch;
                
                const partialMatch = availableCategories.find(ac => 
                  ac.toLowerCase().includes(cat.toLowerCase()) || 
                  cat.toLowerCase().includes(ac.toLowerCase().split(' ')[0])
                );
                if (partialMatch) return partialMatch;
              }
              return cat;
            }).filter((c: string | undefined) => c) || [];

            setSuggestions({
              categories: matchedCategories.length > 0 ? matchedCategories : fallbackSuggestions.categories,
              budgetRange: parsed.budgetRange || fallbackSuggestions.budgetRange,
              budgetMin: parsed.budgetMin || fallbackSuggestions.budgetMin,
              budgetMax: parsed.budgetMax || fallbackSuggestions.budgetMax,
              clarification: parsed.clarification || fallbackSuggestions.clarification,
            });
          } else {
            throw new Error('Formato risposta non valido');
          }
        } catch (err) {
          console.error('AI suggestion error:', err);
          // Fallback con pattern appresi
          const fallbackSuggestions = getSmartSuggestions(userInput, availableCategories, learnedPatterns);
          setSuggestions(fallbackSuggestions);
        } finally {
          setLoading(false);
        }
      }, 1000);

      return () => clearTimeout(timeoutId);
    };

    fetchSuggestions();
  }, [userInput, availableCategories, learnedPatterns]);

  const getSmartSuggestions = (
    input: string, 
    availableCats: string[], 
    patterns: LearnedPattern[],
    answered?: Map<string, string>
  ): AISuggestion => {
    const lowerInput = input.toLowerCase().trim();
    const suggestions: AISuggestion = {
      categories: [],
      budgetRange: '',
      clarification: undefined,
    };

    // Usa risposte alle domande per migliorare match
    if (answered && answered.size > 0) {
      const categoryAnswer = Array.from(answered.values()).find(a => 
        availableCats.some(cat => a.toLowerCase().includes(cat.toLowerCase()))
      );
      if (categoryAnswer) {
        const matchedCategory = availableCats.find(cat => 
          categoryAnswer.toLowerCase().includes(cat.toLowerCase())
        );
        if (matchedCategory) {
          suggestions.categories = [matchedCategory];
          // Trova pattern per questa categoria
          const categoryPattern = patterns.find(p => p.category === matchedCategory);
          if (categoryPattern) {
            suggestions.budgetRange = `${categoryPattern.minBudget}-${categoryPattern.maxBudget}€`;
            suggestions.budgetMin = categoryPattern.minBudget;
            suggestions.budgetMax = categoryPattern.maxBudget;
          }
          return suggestions;
        }
      }

      const budgetAnswer = Array.from(answered.values()).find(a => 
        a.includes('€') || a.includes('budget')
      );
      if (budgetAnswer) {
        const budgetMatch = budgetAnswer.match(/(\d+)-(\d+)/);
        if (budgetMatch) {
          suggestions.budgetMin = parseInt(budgetMatch[1]);
          suggestions.budgetMax = parseInt(budgetMatch[2]);
          suggestions.budgetRange = `${budgetMatch[1]}-${budgetMatch[2]}€`;
        }
      }
    }

    // 1. Cerca pattern appresi per match migliore
    if (patterns.length > 0) {
      const inputWords = lowerInput.split(/\s+/).filter(w => w.length > 3);
      
      // Calcola score per ogni pattern basato su keyword match
      const patternScores = patterns.map(pattern => {
        const matchedKeywords = inputWords.filter(word => 
          pattern.keywords.some(kw => kw.includes(word) || word.includes(kw))
        );
        const matchScore = matchedKeywords.length / Math.max(inputWords.length, pattern.keywords.length);
        return { pattern, matchScore, matchedKeywords };
      });

      // Ordina per score e prendi i migliori
      patternScores.sort((a, b) => b.matchScore - a.matchScore);
      const topPatterns = patternScores.filter(ps => ps.matchScore > 0.3).slice(0, 3);

      if (topPatterns.length > 0) {
        const bestPattern = topPatterns[0].pattern;
        suggestions.categories = [bestPattern.category];
        
        // Aggiungi categorie correlate dai pattern
        if (topPatterns.length > 1) {
          suggestions.categories.push(...topPatterns.slice(1).map(p => p.pattern.category));
        }

        // Match con categorie disponibili
        suggestions.categories = suggestions.categories.map(cat => {
          const match = availableCats.find(ac => 
            ac.toLowerCase().includes(cat.toLowerCase()) ||
            cat.toLowerCase().includes(ac.toLowerCase().split(' ')[0])
          );
          return match || cat;
        }).filter((c, i, arr) => arr.indexOf(c) === i); // Rimuovi duplicati

        suggestions.budgetRange = `${bestPattern.minBudget}-${bestPattern.maxBudget}€`;
        suggestions.budgetMin = bestPattern.minBudget;
        suggestions.budgetMax = bestPattern.maxBudget;

        // Se match debole, aggiungi chiarimento
        if (topPatterns[0].matchScore < 0.6) {
          suggestions.clarification = `💡 Basato su ${bestPattern.count} ricerche simili in "${bestPattern.category}". Potresti essere più specifico per suggerimenti migliori?`;
        }

        return suggestions;
      }
    }

    // 2. Fallback: rileva ricerche vaghe
    const vagueKeywords = ['qualcosa', 'aiuto', 'cerco', 'vorrei', 'ho bisogno', 'serve', 'cercando', 'aiutami', 'consigli'];
    const isVague = vagueKeywords.some(keyword => lowerInput.includes(keyword)) || lowerInput.length < 10;

    if (isVague) {
      // Usa categorie più popolari dai pattern o disponibili
      const popularCategories = patterns.length > 0
        ? patterns.slice(0, 3).map(p => p.category)
        : (availableCats.length > 0 ? availableCats.slice(0, 3) : ['Casa e Giardino', 'Servizi Professionali', 'Altro']);

      suggestions.categories = popularCategories;
      suggestions.budgetRange = '100-1000€';
      suggestions.budgetMin = 100;
      suggestions.budgetMax = 1000;
      suggestions.clarification = '💡 Per aiutarti meglio, potresti specificare: tipo di prodotto/servizio, budget indicativo, o settore di interesse?';
      return suggestions;
    }

    // 3. Fallback: mappatura keyword hardcoded (usata solo se nessun pattern matcha)
    const keywordMappings: Array<{ keywords: string[]; category: string; budget: { min: number; max: number } }> = [
      { keywords: ['divano', 'tavolo', 'sedia', 'mobile', 'arredamento', 'mobili', 'poltrona', 'libreria', 'armadio', 'cucina'], 
        category: 'Casa e Giardino', budget: { min: 400, max: 1500 } },
      { keywords: ['iphone', 'samsung', 'tablet', 'laptop', 'pc', 'computer', 'smartphone', 'telefono', 'notebook', 'monitor', 'stampante', 'cuffie'], 
        category: 'Elettronica', budget: { min: 200, max: 2000 } },
      { keywords: ['auto', 'macchina', 'moto', 'veicolo', 'scooter', 'bicicletta', 'bici', 'furgone'], 
        category: 'Auto e Moto', budget: { min: 2000, max: 30000 } },
      { keywords: ['vestito', 'abito', 'scarpe', 'borsa', 'moda', 'cappello', 'giacca', 'pantaloni', 'camicia'], 
        category: 'Moda e Abbigliamento', budget: { min: 50, max: 500 } },
      { keywords: ['software', 'app', 'sito', 'web', 'ecommerce', 'sistema', 'programma', 'sviluppo', 'digitale', 'tech', 'tecnologia'], 
        category: 'Servizi Professionali', budget: { min: 500, max: 5000 } },
      { keywords: ['casa', 'appartamento', 'immobile', 'terreno', 'ufficio', 'negozio', 'locale'], 
        category: 'Immobiliare', budget: { min: 50000, max: 500000 } },
      { keywords: ['palestra', 'fitness', 'sport', 'attrezzatura', 'bicicletta sport', 'piscina'], 
        category: 'Sport e Tempo Libero', budget: { min: 100, max: 2000 } },
      { keywords: ['lavoro', 'impiego', 'posizione', 'carriera', 'cv', 'colloquio'], 
        category: 'Lavoro', budget: { min: 0, max: 0 } },
    ];

    let bestMatch = null;
    for (const mapping of keywordMappings) {
      if (mapping.keywords.some(kw => lowerInput.includes(kw))) {
        bestMatch = mapping;
        break;
      }
    }

    if (bestMatch) {
      const categoryName = availableCats.find(ac => 
        ac.toLowerCase().includes(bestMatch!.category.toLowerCase().split(' ')[0])
      ) || bestMatch.category;

      suggestions.categories = [categoryName];
      if (availableCats.length > 0) {
        const related = availableCats.filter(ac => 
          ac !== categoryName && 
          (ac.toLowerCase().includes(bestMatch!.category.toLowerCase().split(' ')[0]) ||
           bestMatch!.category.toLowerCase().includes(ac.toLowerCase().split(' ')[0]))
        ).slice(0, 2);
        suggestions.categories = [categoryName, ...related];
      }
      suggestions.budgetRange = `${bestMatch.budget.min}-${bestMatch.budget.max}€`;
      suggestions.budgetMin = bestMatch.budget.min;
      suggestions.budgetMax = bestMatch.budget.max;
    } else {
      // Default
      suggestions.categories = availableCats.length > 0 
        ? [availableCats[0], availableCats[1] || 'Altro']
        : ['Altro'];
      suggestions.budgetRange = '100-1000€';
      suggestions.budgetMin = 100;
      suggestions.budgetMax = 1000;
      suggestions.clarification = '💡 Potresti essere più specifico? Questo aiuterà i fornitori a capire meglio la tua esigenza.';
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

  const handleQuestionAnswer = (answer: string) => {
    if (!currentQuestion) return;

    // Salva la risposta
    setAnsweredQuestions(prev => {
      const newMap = new Map(prev);
      newMap.set(currentQuestion!.id, answer);
      return newMap;
    });

    setQuestionHistory(prev => [...prev, currentQuestion!.id]);

    // Se risposta è "non saprei", usa suggerimenti generici
    if (answer.toLowerCase().includes('non saprei') || answer.toLowerCase().includes('non lo so')) {
      setCurrentQuestion(null);
      const fallbackSuggestions = getSmartSuggestions(userInput, availableCategories, learnedPatterns);
      setSuggestions(fallbackSuggestions);
      return;
    }

    // Usa la risposta per raffinare i suggerimenti
    const refinedInput = refineInputFromAnswer(userInput, currentQuestion, answer);
    
    // Reset domanda corrente e rigenera suggerimenti
    setCurrentQuestion(null);
    
    // Rigenera suggerimenti con input raffinato
    setTimeout(() => {
      const refinedSuggestions = getSmartSuggestions(
        refinedInput || userInput, 
        availableCategories, 
        learnedPatterns,
        answeredQuestions
      );
      setSuggestions(refinedSuggestions);
    }, 300);
  };

  // Determina se serve fare una domanda
  const shouldAskQuestion = (
    input: string, 
    suggestions: AISuggestion, 
    patterns: LearnedPattern[]
  ): boolean => {
    const lowerInput = input.toLowerCase().trim();
    
    // Se ricerca molto vaga (< 10 caratteri o solo parole comuni)
    const vagueWords = ['qualcosa', 'aiuto', 'cerco', 'vorrei', 'serve', 'aiutami'];
    const isVague = lowerInput.length < 10 || vagueWords.some(word => lowerInput.includes(word));
    
    // Se non ci sono categorie suggerite o troppo generiche
    const hasGenericCategories = suggestions.categories.length === 0 || 
      suggestions.categories.some(cat => cat === 'Altro' || cat === 'Servizi Professionali');
    
    // Se match pattern è debole (< 0.3)
    const inputWords = lowerInput.split(/\s+/).filter(w => w.length > 3);
    const hasWeakMatch = patterns.length > 0 && 
      patterns.every(pattern => {
        const matchedKeywords = inputWords.filter(word => 
          pattern.keywords.some(kw => kw.includes(word) || word.includes(kw))
        );
        return matchedKeywords.length / Math.max(inputWords.length, pattern.keywords.length) < 0.3;
      });
    
    return isVague || (hasGenericCategories && hasWeakMatch);
  };

  // Genera domanda contestuale
  const generateQuestion = (
    input: string,
    suggestions: AISuggestion,
    availableCats: string[],
    answered: Map<string, string>
  ): AIQuestion | null => {
    const lowerInput = input.toLowerCase();
    
    // Evita domande duplicate
    const answeredContexts = Array.from(answered.values());
    
    // Determina tipo di domanda necessaria
    let questionType: 'category' | 'budget' | 'specificity' | 'type' = 'specificity';
    
    if (!answeredContexts.some(a => a.includes('categoria'))) {
      questionType = 'category';
    } else if (!answeredContexts.some(a => a.includes('budget'))) {
      questionType = 'budget';
    } else if (!answeredContexts.some(a => a.includes('specifico'))) {
      questionType = 'specificity';
    } else {
      questionType = 'type';
    }

    // Genera domande in base al tipo
    switch (questionType) {
      case 'category':
        const popularCategories = availableCats.slice(0, 4);
        if (popularCategories.length === 0) return null;
        
        return {
          id: `category_${Date.now()}`,
          text: 'In quale categoria rientra la tua ricerca?',
          options: [...popularCategories, 'Non saprei'],
          context: 'category'
        };

      case 'budget':
        return {
          id: `budget_${Date.now()}`,
          text: 'Hai un budget indicativo in mente?',
          options: ['Sotto i 500€', '500-1000€', '1000-5000€', 'Oltre 5000€', 'Non saprei'],
          context: 'budget'
        };

      case 'specificity':
        return {
          id: `specificity_${Date.now()}`,
          text: 'Puoi essere più specifico? Cosa stai cercando esattamente?',
          options: ['Un prodotto fisico', 'Un servizio', 'Consulenza professionale', 'Non saprei'],
          context: 'specificity'
        };

      case 'type':
        return {
          id: `type_${Date.now()}`,
          text: 'Che tipo di soluzione stai cercando?',
          options: ['Qualcosa di nuovo', 'Usato/ricondizionato', 'Noleggio/affitto', 'Non saprei'],
          context: 'type'
        };

      default:
        return null;
    }
  };

  // Raffina input in base alla risposta
  const refineInputFromAnswer = (
    input: string,
    question: AIQuestion,
    answer: string
  ): string | null => {
    if (answer.toLowerCase().includes('non saprei')) {
      return null;
    }

    // Aggiungi contesto alla ricerca in base alla risposta
    switch (question.context) {
      case 'category':
        return `${input} ${answer}`;
      
      case 'budget':
        // Estrai range budget dalla risposta
        const budgetMatch = answer.match(/(\d+)-(\d+)/);
        if (budgetMatch) {
          return `${input} budget ${budgetMatch[0]}`;
        }
        return `${input} ${answer.toLowerCase()}`;
      
      case 'specificity':
      case 'type':
        return `${input} ${answer.toLowerCase()}`;
      
      default:
        return input;
    }
  };

  if (!userInput || userInput.trim().length < 3) return null;

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
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Suggerimenti AI</span>
            {learnedPatterns.length > 0 && (
              <span className="text-xs text-slate-500 flex items-center gap-1" title={`Basato su ${learnedPatterns.reduce((sum, p) => sum + p.count, 0)} ricerche esistenti`}>
                <TrendingUp className="w-3 h-3 text-green-400" />
                <span className="text-green-400">Autoapprendimento attivo</span>
              </span>
            )}
          </div>
          
          {loading ? (
            <div className="text-sm text-slate-300">Analizzando la tua richiesta...</div>
          ) : currentQuestion ? (
            /* Domanda interattiva */
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-600/20 border border-blue-600/30">
                <HelpCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-200 flex-1">{currentQuestion.text}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentQuestion.options.map((option, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuestionAnswer(option)}
                    className={`px-4 py-2 text-xs rounded-xl border transition-all ${
                      option.toLowerCase().includes('non saprei') || option.toLowerCase().includes('non lo so')
                        ? 'bg-slate-700/50 text-slate-300 border-slate-600/50 hover:bg-slate-700 hover:border-slate-600'
                        : 'bg-blue-600/20 text-blue-300 border-blue-600/30 hover:bg-blue-600/30 hover:border-blue-600/50'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ) : suggestions ? (
            <>
              {/* Nota per ricerche vaghe */}
              {suggestions.clarification && (
                <div className="p-3 rounded-xl bg-orange-600/10 border border-orange-600/30">
                  <p className="text-xs text-orange-300 leading-relaxed">{suggestions.clarification}</p>
                </div>
              )}

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
