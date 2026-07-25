// store/categoryStore.ts
//
// Frontend-only, in-memory category store shared between Category.tsx and
// Calendar.tsx (and anywhere else that needs it). No backend/API calls here —
// when the devs wire up real persistence, this file is the seam to swap out:
// keep the same `useCategories()` hook signature and replace the internals
// with fetch/useQuery/whatever, and Category.tsx / Calendar.tsx won't need
// to change.

import { useSyncExternalStore } from "react";
import type { Category } from "../types/category";

const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Product Launches", color: "#d97706", accountIds: ["acc-1", "acc-2"] },
  { id: "cat-2", name: "Behind the Scenes", color: "#059669", accountIds: ["acc-3"] },
  { id: "cat-3", name: "Client Work", color: "#a8124a", accountIds: ["acc-1", "acc-3", "acc-4"] },
];

let categories: Category[] = DEFAULT_CATEGORIES;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return categories;
}

// ---------------------------------------------------------------
// mutators — call these from Category.tsx (or anywhere)
// ---------------------------------------------------------------

export function setCategories(next: Category[] | ((prev: Category[]) => Category[])) {
  categories = typeof next === "function" ? (next as (prev: Category[]) => Category[])(categories) : next;
  emit();
}

export function saveCategory(updated: Category) {
  categories = categories.map((c) => (c.id === updated.id ? updated : c));
  emit();
}

export function deleteCategory(id: string) {
  categories = categories.filter((c) => c.id !== id);
  emit();
}

export function createCategory(newCategory: Category) {
  categories = [...categories, newCategory];
  emit();
  return newCategory;
}

// ---------------------------------------------------------------
// hook — call this from any component that needs live category data
// ---------------------------------------------------------------

export function useCategories() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
