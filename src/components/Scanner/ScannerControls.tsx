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
  onExchangeChange: (exchange: Exchange) => void;
  onSortChange: (sort: SortOption) => void;
  onFiltersChange: (filters: ScannerFilters) => void;
  onHideSkipChange: (hide: boolean) => void;
  onScan: () => void;
  progress: number;
  progressMessage: string;
}

export function ScannerControls({
  language,
  exchange,
  sortBy,
  filters,
  isScanning,
  hideSkip,
  onExchangeChange,
  onSortChange,
  onScan,
  onHideSkipChange,
  progress,
  progressMessage,
}: ScannerControlsProps) {
  const t = getTranslation(language);
  const exchanges = getAvailableExchanges();
  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'confidence', label: t.byConfidence },
    { value: 'priceChange', label: t.byPriceChange },
    { value: 'rsi', label: t.byRSI },
    { value: 'shortScore', label: t.byShortScore },
    { value: 'volume', label: t.byVolume },
  ];

  return (
    <div className="space-y-4">
      {/* Main Controls Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Scan Button */}
        <Button
          onClick={onScan}
          disabled={isScanning}
          className={`min-w-[140px] ${isScanning ? 'pulse-glow' : ''}`}
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

        {/* Exchange Select */}
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">{t.selectExchange}</Label>
          <Select value={exchange} onValueChange={(v) => onExchangeChange(v as Exchange)}>
            <SelectTrigger className="w-[120px]">
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
          <Label className="text-sm text-muted-foreground">{t.sortBy}</Label>
          <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
            <SelectTrigger className="w-[150px]">
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

        {/* Hide Skip Checkbox */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="hideSkip"
            checked={hideSkip}
            onCheckedChange={(checked) => onHideSkipChange(checked as boolean)}
          />
          <Label htmlFor="hideSkip" className="text-sm text-muted-foreground cursor-pointer">
            {t.hideSkipSetups}
          </Label>
        </div>
      </div>

      {/* Progress Bar */}
      {isScanning && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{progressMessage}</span>
            <span className="text-primary">{progress}%</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
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
