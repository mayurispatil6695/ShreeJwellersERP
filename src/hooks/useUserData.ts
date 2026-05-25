import { useAuth } from "@/contexts/AuthContext";
import { useCallback } from "react";
import { ref, get, push, set, update, remove } from "firebase/database";
import { db } from "@/lib/firebase";

/**
 * Hook that provides Firebase RTDB helpers.
 * - Shared collections (e.g., products) are stored at root: `collection`
 * - User-specific collections are stored under `users/{uid}/{collection}`
 */
export function useUserData() {
  const { user } = useAuth();

  const getPath = useCallback(
    (collection: string, shared: boolean = false) => {
      if (!shared && !user?.uid) throw new Error("User not authenticated");
      return shared ? collection : `users/${user!.uid}/${collection}`;
    },
    [user?.uid]
  );

  const getAll = useCallback(
    async <T>(collection: string, shared: boolean = false): Promise<(T & { id: string })[]> => {
      const path = getPath(collection, shared);
      const snapshot = await get(ref(db, path));
      if (!snapshot.exists()) return [];
      const items: (T & { id: string })[] = [];
      snapshot.forEach((child) => {
        items.push({ id: child.key!, ...child.val() });
      });
      return items;
    },
    [getPath]
  );

  const getById = useCallback(
    async <T>(collection: string, id: string, shared: boolean = false): Promise<(T & { id: string }) | null> => {
      const path = getPath(collection, shared);
      const snapshot = await get(ref(db, `${path}/${id}`));
      if (!snapshot.exists()) return null;
      return { id, ...snapshot.val() };
    },
    [getPath]
  );

  const addItem = useCallback(
    async <T extends Record<string, unknown>>(
      collection: string,
      data: T,
      shared: boolean = false
    ): Promise<string> => {
      const path = getPath(collection, shared);
      const newRef = push(ref(db, path));
      await set(newRef, {
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return newRef.key!;
    },
    [getPath]
  );

  const updateItem = useCallback(
    async (
      collection: string,
      id: string,
      data: Record<string, unknown>,
      shared: boolean = false
    ): Promise<void> => {
      const path = getPath(collection, shared);
      await update(ref(db, `${path}/${id}`), {
        ...data,
        updated_at: new Date().toISOString(),
      });
    },
    [getPath]
  );

  const deleteItem = useCallback(
    async (collection: string, id: string, shared: boolean = false): Promise<void> => {
      const path = getPath(collection, shared);
      await remove(ref(db, `${path}/${id}`));
    },
    [getPath]
  );

  const getByField = useCallback(
    async <T>(
      collection: string,
      field: string,
      value: unknown,
      shared: boolean = false
    ): Promise<(T & { id: string })[]> => {
      const path = getPath(collection, shared);
      const snapshot = await get(ref(db, path));
      if (!snapshot.exists()) return [];
      const items: (T & { id: string })[] = [];
      snapshot.forEach((child) => {
        const data = child.val();
        if (data[field] === value) {
          items.push({ id: child.key!, ...data });
        }
      });
      return items;
    },
    [getPath]
  );

  return {
    getAll,
    getById,
    addItem,
    updateItem,
    deleteItem,
    getByField,
    userId: user?.uid,
  };
}