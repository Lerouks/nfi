import { createContext, useContext, useState } from "react";
import type { Article } from "../app/data/mockData";

const STORAGE_KEY = "nfi_saved_v1";

function load(): Article[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Article[]) : [];
  } catch {
    return [];
  }
}

function persist(articles: Article[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
  } catch {}
}

interface SavedCtx {
  savedArticles: Article[];
  isSaved: (slug: string) => boolean;
  toggle: (article: Article) => void;
}

const SavedCtx = createContext<SavedCtx>({
  savedArticles: [],
  isSaved: () => false,
  toggle: () => {},
});

export function SavedArticlesProvider({ children }: { children: React.ReactNode }) {
  const [savedArticles, setSavedArticles] = useState<Article[]>(load);

  const isSaved = (slug: string) => savedArticles.some((a) => a.slug === slug);

  const toggle = (article: Article) => {
    setSavedArticles((prev) => {
      const next = prev.some((a) => a.slug === article.slug)
        ? prev.filter((a) => a.slug !== article.slug)
        : [...prev, article];
      persist(next);
      return next;
    });
  };

  return (
    <SavedCtx.Provider value={{ savedArticles, isSaved, toggle }}>
      {children}
    </SavedCtx.Provider>
  );
}

export function useSavedArticles() {
  return useContext(SavedCtx);
}
