import type { QueryClient } from "@tanstack/react-query";

export async function refreshCategoryData(client: QueryClient) {
  await Promise.all(
    ["categories", "category", "products", "product", "dashboard"].map((key) =>
      client.invalidateQueries({ queryKey: [key] }),
    ),
  );
}
