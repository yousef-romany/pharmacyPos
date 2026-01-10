import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to safely parse floats (used throughout the app for database values stored as strings)
export function safeParseFloat(value: string | number | null | undefined, defaultValue = 0): number {
  if (value === null || value === undefined) return defaultValue;
  const parsed = parseFloat(value.toString());
  return isNaN(parsed) ? defaultValue : parsed;
}
