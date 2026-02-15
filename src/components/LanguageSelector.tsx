'use client';

import { Language } from '@/types/scanner';
import { getTranslation } from '@/lib/i18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LanguageSelectorProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

const languages: { value: Language; label: string; flag: string }[] = [
  { value: 'ru', label: 'Русский', flag: '🇷🇺' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'zn', label: '中文', flag: '🇨🇳' },
];

export function LanguageSelector({ language, onLanguageChange }: LanguageSelectorProps) {
  const t = getTranslation(language);

  return (
    <Select value={language} onValueChange={(v) => onLanguageChange(v as Language)}>
      <SelectTrigger className="w-[130px] bg-secondary border-0">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.value} value={lang.value}>
            <span className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
