import { ref, get, push, set, update, remove, query, orderByChild, DataSnapshot } from 'firebase/database';
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

export async function addItem<T extends Record<string, any>>(path: string, data: T): Promise<string> {
  const newRef = push(ref(db, path));
  await set(newRef, { ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  return newRef.key!;
}

export async function updateItem(path: string, id: string, data: Record<string, any>): Promise<void> {
  await update(ref(db, `${path}/${id}`), { ...data, updated_at: new Date().toISOString() });
}

export async function deleteItem(path: string, id: string): Promise<void> {
  await remove(ref(db, `${path}/${id}`));
}

export async function getByField<T>(path: string, field: string, value: any): Promise<(T & { id: string })[]> {
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
}
