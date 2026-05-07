import { supabase } from "@/integrations/supabase/client";

// Response shape from the employee-data edge function
interface EmployeeDataResponse<T = unknown> {
  id?: string;
  data?: T[];
  error?: string;
}

/**
 * Fetch all items from a Firebase path via Supabase edge function.
 * @param path - The Firebase path (e.g., "products")
 * @returns Array of items with an added `id` property.
 */
export async function employeeGetAll<T>(path: string): Promise<(T & { id: string })[]> {
  const { data, error } = await supabase.functions.invoke("employee-data", {
    body: { path },
    headers: { "Content-Type": "application/json" },
  });

  if (error) {
    console.error("employee-data error:", error);
    return [];
  }

  const parsed = typeof data === "string" ? (JSON.parse(data) as EmployeeDataResponse<T>) : (data as EmployeeDataResponse<T>);

  if (parsed.error) {
    console.error("Edge function error:", parsed.error);
    return [];
  }

  const items = (parsed.data as (T & { id: string })[]) ?? [];
  return items;
}

/**
 * Add a new item to a Firebase path.
 * @param path - The Firebase collection path (e.g., "sales")
 * @param itemData - The data to insert (any JSON-serializable object)
 * @returns The generated Firebase key (id).
 */
export async function employeeAddItem<T extends Record<string, unknown>>(path: string, itemData: T): Promise<string> {
  const { data, error } = await supabase.functions.invoke("employee-data", {
    body: { path, action: "add", data: itemData },
    headers: { "Content-Type": "application/json" },
  });

  if (error) {
    throw new Error(error.message || "Failed to add item");
  }

  const parsed = typeof data === "string" ? (JSON.parse(data) as EmployeeDataResponse) : (data as EmployeeDataResponse);

  if (parsed.error) {
    throw new Error(parsed.error);
  }

  if (!parsed.id) {
    throw new Error("Edge function did not return an id");
  }

  return parsed.id;
}

/**
 * Update an existing item in a Firebase path.
 * @param path - The Firebase collection path
 * @param id - The Firebase key of the item
 * @param itemData - The fields to update
 */
export async function employeeUpdateItem(path: string, id: string, itemData: Record<string, unknown>): Promise<void> {
  const { data, error } = await supabase.functions.invoke("employee-data", {
    body: { path, action: "update", id, data: itemData },
    headers: { "Content-Type": "application/json" },
  });

  if (error) {
    throw new Error(error.message || "Failed to update item");
  }

  const parsed = typeof data === "string" ? (JSON.parse(data) as EmployeeDataResponse) : (data as EmployeeDataResponse);

  if (parsed.error) {
    throw new Error(parsed.error);
  }
}