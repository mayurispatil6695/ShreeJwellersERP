import { ref, get, push, set, update, remove, query, orderByChild, equalTo } from 'firebase/database';
import { db } from './firebase';

// Generic Firebase RTDB helpers

export async function getAll<T>(path: string): Promise<(T & { id: string })[]> {
  const snapshot = await get(ref(db, path));
  if (!snapshot.exists()) return [];

  const items: (T & { id: string })[] = [];
  snapshot.forEach((child) => {
    items.push({ id: child.key!, ...child.val() });
  });
  return items;
}

export async function getById<T>(path: string, id: string): Promise<(T & { id: string }) | null> {
  const snapshot = await get(ref(db, `${path}/${id}`));
  if (!snapshot.exists()) return null;
  return { id, ...snapshot.val() };
}

export async function addItem<T extends Record<string, unknown>>(path: string, data: T): Promise<string> {
  const newRef = push(ref(db, path));
  await set(newRef, {
    ...data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  return newRef.key!;
}

export async function updateItem(path: string, id: string, data: Record<string, unknown>): Promise<void> {
  await update(ref(db, `${path}/${id}`), {
    ...data,
    updated_at: new Date().toISOString(),
  });
}

export async function deleteItem(path: string, id: string): Promise<void> {
  await remove(ref(db, `${path}/${id}`));
}

/**
 * Efficiently query items by field value (requires index in Firebase rules).
 * Example: getByField('products', 'sku', 'ABC123')
 */
export async function getByField<T>(
  path: string,
  field: string,
  value: string | number | boolean   // 👈 fixed type
): Promise<(T & { id: string })[]> {
  const collectionRef = ref(db, path);
  const q = query(collectionRef, orderByChild(field), equalTo(value));
  const snapshot = await get(q);
  if (!snapshot.exists()) return [];

  const items: (T & { id: string })[] = [];
  snapshot.forEach((child) => {
    items.push({ id: child.key!, ...child.val() });
  });
  return items;
}