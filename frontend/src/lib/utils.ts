import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { HttpMethod } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function methodColor(method: HttpMethod): string {
  const colors: Record<HttpMethod, string> = {
    get: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950",
    post: "text-teal-700 bg-teal-50 dark:text-teal-300 dark:bg-teal-950",
    put: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950",
    patch: "text-teal-600 bg-teal-50 dark:text-teal-400 dark:bg-teal-950",
    delete: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950",
    head: "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900",
    options: "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900",
  };
  return colors[method] ?? colors.get;
}

export function methodDot(method: HttpMethod): string {
  const colors: Record<HttpMethod, string> = {
    get: "bg-emerald-500",
    post: "bg-teal-600",
    put: "bg-amber-500",
    patch: "bg-teal-500",
    delete: "bg-red-500",
    head: "bg-gray-400",
    options: "bg-gray-400",
  };
  return colors[method] ?? "bg-gray-400";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function operationHref(api: string, version: string, tag: string, operationId: string): string {
  return `/${api}/${version}/reference/${slugify(tag)}/${operationId}`;
}

export function guideHref(api: string, version: string, slug: string): string {
  return `/${api}/${version}/guides/${slug}`;
}
