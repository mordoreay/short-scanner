'use client';

import { Exchange, SortOption, ScannerFilters, Language } from '@/types/scanner';
import { getTranslation } from '@/lib/i18n';
import { getExchangeName, getAvailableExchanges } from '@/lib/exchanges';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface ScannerControlsProps {
  language: Language;
  exchange: Exchange;
  sortBy: SortOption;
  filters: ScannerFilters;
  isScanning: boolean;
  hideSkip: boolean;
  hideWait: boolean;
  autoInterval: number | null;
  cacheStatus: 'live' | 'cached' | 'unknown';
  cacheAge: number | null; // seconds since last fresh data
  onExchangeChange: (exchange: Exchange) => void;
  onSortChange: (sort: SortOption) => void;
  onFiltersChange: (filters: ScannerFilters) => void;
  onHideSkipChange: (hide: boolean) => void;
  onHideWaitChange: (hide: boolean) => void;
  onAutoIntervalChange: (interval: number | null) => void;
  onScan: () => void;
  onClearCache: () => void;
  progress: number;
  progressMessage: string;
}

const AUTO_INTERVALS = [
  { value: 1, label: '1м' },
  { value: 2, label: '2м' },
  { value: 5, label: '5м' },
  { value: 10, label: '10м' },
];

export function ScannerControls({
  language,
  exchange,
  sortBy,
  filters,
  isScanning,
  hideSkip,
  hideWait,
  autoInterval,
  cacheStatus,
  cacheAge,
  onExchangeChange,
  onSortChange,
  onScan,
  onClearCache,
  onHideSkipChange,
  onHideWaitChange,
  onAutoIntervalChange,
  progress,
  progressMessage,
}: ScannerControlsProps) {
  const t = getTranslation(language);
  const exchanges = getAvailableExchanges();
  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'shortScore', label: t.byShortScore },
    { value: 'priceChange', label: t.byPriceChange },
    { value: 'rsi', label: t.byRSI },
    { value: 'volume', label: t.byVolume },
  ];

  // Format cache age
  const formatCacheAge = (seconds: number): string => {
    if (seconds < 60) return `${seconds}с`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}м ${secs}с`;
  };

  return (
    <div className="space-y-3">
      {/* Row 1: Actions - Scan + Auto-scan + Cache Status */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Scan Button */}
        <Button
          onClick={onScan}
          disabled={isScanning}
          className={`min-w-[130px] ${isScanning ? 'pulse-glow' : ''}`}
          size="lg"
        >
          {isScanning ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {t.scanning}
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {t.scan}
            </>
          )}
        </Button>

        {/* Cache Status */}
        <div className="flex items-center gap-2 ml-2 px-3 py-1.5 bg-secondary/50 rounded-lg">
          {cacheStatus === 'live' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-400 font-medium">
                {language === 'ru' ? 'Live' : 'Live'}
              </span>
            </>
          ) : cacheStatus === 'cached' && cacheAge !== null ? (
            <>
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-xs text-yellow-400 font-medium">
                {language === 'ru' ? 'Кэш' : 'Cache'}: {formatCacheAge(cacheAge)}
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-gray-500" />
              <span className="text-xs text-muted-foreground">
                {language === 'ru' ? 'Нет данных' : 'No data'}
              </span>
            </>
          )}
          
          {/* Clear Cache Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
            onClick={onClearCache}
            disabled={isScanning}
          >
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {language === 'ru' ? 'Сброс' : 'Reset'}
          </Button>
        </div>

        {/* Auto-scan */}
        <div className="flex items-center gap-1.5 ml-2">
          <span className="text-xs text-muted-foreground">
            {language === 'ru' ? 'Авто:' : 'Auto:'}
          </span>
          {AUTO_INTERVALS.map(interval => (
            <Button
              key={interval.value}
              variant={autoInterval === interval.value ? 'default' : 'outline'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onAutoIntervalChange(autoInterval === interval.value ? null : interval.value)}
            >
              {interval.label}
            </Button>
          ))}
          {autoInterval && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-red-400 hover:text-red-300"
              onClick={() => onAutoIntervalChange(null)}
            >
              {language === 'ru' ? 'Стоп' : 'Stop'}
            </Button>
          )}
        </div>
      </div>

      {/* Row 2: Settings - Exchange, Sort, Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Exchange Select */}
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">{t.selectExchange}</Label>
          <Select value={exchange} onValueChange={(v) => onExchangeChange(v as Exchange)}>
            <SelectTrigger className="w-[100px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {exchanges.map((ex) => (
                <SelectItem key={ex} value={ex}>
                  {getExchangeName(ex)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">{t.sortBy}</Label>
          <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-border" />

        {/* Filter Checkboxes */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Checkbox
              id="hideSkip"
              checked={hideSkip}
              onCheckedChange={(checked) => onHideSkipChange(checked as boolean)}
              className="h-4 w-4"
            />
            <Label htmlFor="hideSkip" className="text-xs text-muted-foreground cursor-pointer">
              {t.hideSkipSetups}
            </Label>
          </div>

          <div className="flex items-center gap-1.5">
            <Checkbox
              id="hideWait"
              checked={hideWait}
              onCheckedChange={(checked) => onHideWaitChange(checked as boolean)}
              className="h-4 w-4"
            />
            <Label htmlFor="hideWait" className="text-xs text-muted-foreground cursor-pointer">
              {t.hideWaitSetups}
            </Label>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {isScanning && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{progressMessage}</span>
            <span className="text-primary">{progress}%</span>
          </div>
          <div className="h-1 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
