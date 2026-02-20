'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Language, Exchange, SortOption, ScannerFilters, Candidate, ScannerResponse } from '@/types/scanner';
import { getTranslation } from '@/lib/i18n';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ScannerControls } from '@/components/Scanner/ScannerControls';
import { SetupCard } from '@/components/Scanner/SetupCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function Home() {
  // Language state
  const [language, setLanguage] = useState<Language>('ru');
  const t = getTranslation(language);

  // Scanner state
  const [exchange, setExchange] = useState<Exchange>('bybit');
  const [sortBy, setSortBy] = useState<SortOption>('shortScore');
  const [hideSkip, setHideSkip] = useState(true);
  const [hideWait, setHideWait] = useState(false);
  const [filters, setFilters] = useState<ScannerFilters>({
    minConfidence: 0,
    minPriceChange: 15,
    onlyRsiDivergence: false,
    hideFakePump: false,
  });

  // Scan state
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cache state
  const [cacheStatus, setCacheStatus] = useState<'live' | 'cached' | 'unknown'>('unknown');
  const [cacheAge, setCacheAge] = useState<number | null>(null);
  const lastFreshDataTime = useRef<number | null>(null);
  const cacheAgeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-rescan state
  const [autoInterval, setAutoInterval] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const autoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Sound state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play sound function
  const playSound = useCallback((type: 'alert' | 'complete') => {
    if (!soundEnabled) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      if (type === 'alert') {
        // Two ascending beeps for high score
        oscillator.frequency.value = 600;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.15);

        setTimeout(() => {
          if (!audioContextRef.current) return;
          const osc2 = audioContextRef.current.createOscillator();
          const gain2 = audioContextRef.current.createGain();
          osc2.connect(gain2);
          gain2.connect(audioContextRef.current.destination);
          osc2.frequency.value = 800;
          osc2.type = 'sine';
          gain2.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.2);
          osc2.start(audioContextRef.current.currentTime);
          osc2.stop(audioContextRef.current.currentTime + 0.2);
        }, 150);
      } else {
        // Single beep for scan complete
        oscillator.frequency.value = 500;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.1);
      }
    } catch (e) {
      console.warn('Sound playback failed:', e);
    }
  }, [soundEnabled]);

  // Initialize dark theme
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = saved ? saved === 'dark' : true;
    document.documentElement.classList.toggle('dark', prefersDark);
    document.documentElement.classList.toggle('light', !prefersDark);
  }, []);

  // Previous high scores ref for detecting new high-score setups
  const prevHighScoresRef = useRef<Set<string>>(new Set());

  // Scan function
  const handleScan = useCallback(async () => {
    setIsScanning(true);
    setProgress(0);
    setError(null);

    try {
      // Progress simulation
      setProgressMessage(t.fetchingData);
      setProgress(10);

      const params = new URLSearchParams({
        exchange,
        minChange: '15',
        sortBy,
        language,
        minConfidence: filters.minConfidence.toString(),
        minPriceChange: filters.minPriceChange.toString(),
        onlyRsiDivergence: filters.onlyRsiDivergence.toString(),
        hideFakePump: filters.hideFakePump.toString(),
      });

      setProgressMessage(t.calculatingIndicators);
      setProgress(30);

      const response = await fetch(`/api/scanner?${params}`);
      
      setProgressMessage(t.findingSetups);
      setProgress(70);

      const data: ScannerResponse = await response.json();

      setProgressMessage(t.complete);
      setProgress(100);

      if (data.success) {
        const newCandidates = data.candidates;
        setCandidates(newCandidates);
        setLastScanTime(data.timestamp);

        // Check for new high-score setups (score >= 70)
        const currentHighScores = new Set(
          newCandidates
            .filter(c => c.shortScore.total >= 70)
            .map(c => c.symbol)
        );

        // Find new high-score setups that weren't there before
        const newHighScores = [...currentHighScores].filter(
          symbol => !prevHighScoresRef.current.has(symbol)
        );

        if (newHighScores.length > 0 && prevHighScoresRef.current.size > 0) {
          playSound('alert');
          console.log(`🔔 New high-score setups: ${newHighScores.join(', ')}`);
        }

        prevHighScoresRef.current = currentHighScores;

        // Play completion sound
        if (newCandidates.some(c => c.shortScore.total >= 70)) {
          // Already played alert sound
        } else {
          playSound('complete');
        }

        // Mark data as fresh (live)
        lastFreshDataTime.current = Date.now();
        setCacheStatus('live');
        setCacheAge(0);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.scanError);
    } finally {
      setTimeout(() => {
        setIsScanning(false);
        setProgress(0);
        setProgressMessage('');
      }, 500);
    }
  }, [exchange, sortBy, filters, language, t, playSound]);

  // Auto-rescan effect
  useEffect(() => {
    // Clear existing intervals
    if (autoIntervalRef.current) {
      clearInterval(autoIntervalRef.current);
      autoIntervalRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    if (autoInterval && !isScanning) {
      setCountdown(autoInterval * 60);

      // Countdown timer
      countdownRef.current = setInterval(() => {
        setCountdown(prev => Math.max(0, prev - 1));
      }, 1000);

      // Auto-scan timer
      autoIntervalRef.current = setInterval(() => {
        if (!isScanning) {
          handleScan();
        }
      }, autoInterval * 60 * 1000);
    }

    return () => {
      if (autoIntervalRef.current) clearInterval(autoIntervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [autoInterval, isScanning, handleScan]);

  // Cache age tracking effect
  useEffect(() => {
    // Update cache age every second
    cacheAgeIntervalRef.current = setInterval(() => {
      if (lastFreshDataTime.current) {
        const age = Math.floor((Date.now() - lastFreshDataTime.current) / 1000);
        setCacheAge(age);

        // After 30 seconds, consider data cached
        if (age >= 30) {
          setCacheStatus('cached');
        }
      }
    }, 1000);

    return () => {
      if (cacheAgeIntervalRef.current) clearInterval(cacheAgeIntervalRef.current);
    };
  }, []);

  // Clear cache function
  const handleClearCache = useCallback(async () => {
    try {
      const response = await fetch('/api/cache', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        // Reset cache state
        lastFreshDataTime.current = null;
        setCacheStatus('unknown');
        setCacheAge(null);
        console.log('Cache cleared');
      }
    } catch (err) {
      console.error('Failed to clear cache:', err);
    }
  }, []);

  // Format countdown
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Sort and filter candidates
  const sortedCandidates = useMemo(() => {
    let filtered = [...candidates];
    
    // Filter out skip recommendations if enabled
    if (hideSkip) {
      filtered = filtered.filter(c => c.recommendation !== 'skip');
    }
    
    // Filter out wait recommendations if enabled
    if (hideWait) {
      filtered = filtered.filter(c => c.recommendation !== 'wait');
    }
    
    // Sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'confidence':
          return b.setup.confidence - a.setup.confidence;
        case 'priceChange':
          return b.priceChange24h - a.priceChange24h;
        case 'rsi':
          return b.setup.indicators.rsi.value - a.setup.indicators.rsi.value;
        case 'shortScore':
          return b.shortScore.total - a.shortScore.total;
        case 'volume':
          return b.volume - a.volume;
        default:
          return b.shortScore.total - a.shortScore.total;
      }
    });
  }, [candidates, sortBy, hideSkip, hideWait]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">{t.title}</h1>
                <p className="text-xs text-muted-foreground">{t.subtitle}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Auto-rescan indicator */}
              {autoInterval && (
                <div className="flex items-center gap-2 px-2 py-1 bg-green-500/20 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-green-400 font-medium">
                    AUTO {formatCountdown(countdown)}
                  </span>
                </div>
              )}
              
              {/* Sound toggle */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                    >
                      {soundEnabled ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </svg>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{soundEnabled ? 'Sound ON' : 'Sound OFF'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                {lastScanTime && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-muted-foreground hidden md:block">
                        {new Date(lastScanTime).toLocaleTimeString()}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">{t.lastScanTime}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
              <LanguageSelector language={language} onLanguageChange={setLanguage} />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Scanner Controls */}
        <ScannerControls
          language={language}
          exchange={exchange}
          sortBy={sortBy}
          filters={filters}
          isScanning={isScanning}
          hideSkip={hideSkip}
          hideWait={hideWait}
          autoInterval={autoInterval}
          cacheStatus={cacheStatus}
          cacheAge={cacheAge}
          onExchangeChange={setExchange}
          onSortChange={setSortBy}
          onFiltersChange={setFilters}
          onHideSkipChange={setHideSkip}
          onHideWaitChange={setHideWait}
          onAutoIntervalChange={setAutoInterval}
          onScan={handleScan}
          onClearCache={handleClearCache}
          progress={progress}
          progressMessage={progressMessage}
        />

        {/* Error Message */}
        {error && (
          <Card className="mt-4 p-4 bg-red-500/10 border-red-500/50">
            <div className="flex items-center gap-2 text-red-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </Card>
        )}

        {/* Results Section */}
        <div className="mt-6">
          {/* Results Header */}
          {sortedCandidates.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {t.analyzing}: {sortedCandidates.length} {sortedCandidates.length === 1 ? 'сетап' : sortedCandidates.length < 5 ? 'сетапа' : 'сетапов'}
              </h2>
            </div>
          )}

          {/* Empty State */}
          {sortedCandidates.length === 0 && !isScanning && !error && (
            <Card className="p-12 bg-secondary/20 border-dashed">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">{t.noResults}</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {language === 'ru' 
                    ? 'Нажмите "Сканировать" для поиска SHORT сетапов' 
                    : 'Click "Scan" to search for SHORT setups'}
                </p>
                <button
                  onClick={handleScan}
                  className="text-primary hover:underline text-sm"
                >
                  {t.scan} →
                </button>
              </div>
            </Card>
          )}

          {/* Candidates List */}
          <div className="flex flex-col gap-4">
            {sortedCandidates.map((candidate, index) => (
              <SetupCard key={`${candidate.symbol}-${index}`} candidate={candidate} language={language} />
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>SHORT Scanner</span>
              <span className="text-border">|</span>
              <span>{language === 'ru' ? 'Данные с бирж в реальном времени' : 'Real-time exchange data'}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {language === 'ru' ? 'API активно' : 'API active'}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
