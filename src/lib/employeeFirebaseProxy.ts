import { supabase } from "@/integrations/supabase/client";

// Helper to fetch Firebase data via edge function (for employee pages without Firebase Auth)
export async function employeeGetAll<T>(path: string): Promise<(T & { id: string })[]> {
  const { data, error } = await supabase.functions.invoke("employee-data", {
    body: { path },
    headers: { "Content-Type": "application/json" },
  });

  if (error) {
    console.error("employee-data error:", error);
    return [];
  }

  const parsed = typeof data === "string" ? JSON.parse(data) : data;
  return Array.isArray(parsed) ? parsed : [];
}

export async function employeeAddItem<T extends Record<string, any>>(path: string, itemData: T): Promise<string> {
  const { data, error } = await supabase.functions.invoke("employee-data", {
    body: { path, action: "add", data: itemData },
    headers: { "Content-Type": "application/json" },
  });

  if (error) throw new Error(error.message || "Failed to add item");
  const parsed = typeof data === "string" ? JSON.parse(data) : data;
  return parsed.id;
}

export async function employeeUpdateItem(path: string, id: string, itemData: Record<string, any>): Promise<void> {
  const { data, error } = await supabase.functions.invoke("employee-data", {
    body: { path, action: "update", id, data: itemData },
    headers: { "Content-Type": "application/json" },
  });

  if (error) throw new Error(error.message || "Failed to update item");
}
