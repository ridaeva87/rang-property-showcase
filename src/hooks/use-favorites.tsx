import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "rang-favorite-property-ids";

type FavoritesContextValue = {
  favoriteIds: string[];
  hydrated: boolean;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed)) {
        setFavoriteIds(parsed.filter((id): id is string => typeof id === "string"));
      }
    } catch {
      setFavoriteIds([]);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds));
    } catch {
      // The UI remains usable when storage is unavailable or blocked.
    }
  }, [favoriteIds, hydrated]);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favoriteIds,
      hydrated,
      isFavorite: (id) => favoriteIds.includes(id),
      toggleFavorite: (id) =>
        setFavoriteIds((current) =>
          current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
        ),
    }),
    [favoriteIds, hydrated],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites must be used inside FavoritesProvider");
  return context;
}
