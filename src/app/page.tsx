'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Language, Exchange, SortOption, ScannerFilters, Candidate, ScannerResponse } from '@/types/scanner';
import { getTranslation } from '@/lib/i18n';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ScannerControls } from '@/components/Scanner/ScannerControls';
import { SetupCard } from '@/components/Scanner/SetupCard';
import { Card } from '@/components/ui/card';

export default function Home() {
  // Language state
  const [language, setLanguage] = useState<Language>('ru');
  const t = getTranslation(language);

  // Scanner state
  const [exchange, setExchange] = useState<Exchange>('bybit');
  const [sortBy, setSortBy] = useState<SortOption>('confidence');
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

  // Initialize dark theme
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = saved ? saved === 'dark' : true;
    document.documentElement.classList.toggle('dark', prefersDark);
    document.documentElement.classList.toggle('light', !prefersDark);
  }, []);

  // Scan function
  const handleScan = useCallback(async () => {
    setIsScanning(true);
    setProgress(0);
    setError(null);
    setCandidates([]);

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
        setCandidates(data.candidates);
        setLastScanTime(data.timestamp);
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
  }, [exchange, sortBy, filters, language, t]);

  // Sort candidates on client side when sortBy changes
  const sortedCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => {
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
  }, [candidates, sortBy]);

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
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">v2.0</span>
            </div>
            
            <div className="flex items-center gap-3">
              {lastScanTime && (
                <span className="text-xs text-muted-foreground hidden md:block">
                  {new Date(lastScanTime).toLocaleTimeString()}
                </span>
              )}
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
          onExchangeChange={setExchange}
          onSortChange={setSortBy}
          onFiltersChange={setFilters}
          onScan={handleScan}
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
                    : language === 'en'
                    ? 'Click "Scan" to search for SHORT setups'
                    : '点击"扫描"按钮搜索做空设置'}
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
              <span>SHORT Scanner v2.0</span>
              <span className="text-border">|</span>
              <span>{language === 'ru' ? 'Данные с бирж в реальном времени' : language === 'en' ? 'Real-time exchange data' : '实时交易所数据'}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {language === 'ru' ? 'API активно' : language === 'en' ? 'API active' : 'API 活跃'}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
