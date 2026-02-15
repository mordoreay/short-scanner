import { Language, TranslationKeys } from '@/types/scanner';
import { ru } from './ru';
import { en } from './en';

const translations: Record<Language, TranslationKeys> = {
  ru,
  en,
};

export function getTranslation(lang: Language): TranslationKeys {
  return translations[lang] || translations.en;
}

export { ru, en };
