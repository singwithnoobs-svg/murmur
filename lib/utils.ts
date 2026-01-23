import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Ensure 'export' is here!
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}