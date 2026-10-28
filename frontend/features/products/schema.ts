import { z } from "zod";
import { parseDecimalInput } from "@/lib/format";

export const productFormSchema = z.object({
  name: z
    .string()
    .refine((value) => value.trim().length > 0, "Informe o nome do produto."),
  categoryId: z.string().min(1, "Selecione uma categoria."),
  stockQuantity: z
    .string()
    .refine(
      (value) => /^\d+$/.test(value.trim()) && Number(value) >= 0,
      "Informe um estoque inteiro maior ou igual a zero.",
    ),
  price: z.string().refine((value) => {
    const parsed = parseDecimalInput(value);
    return !Number.isNaN(parsed) && parsed >= 0.01;
  }, "Informe um preço maior ou igual a R$ 0,01."),
  costPrice: z.string().refine((value) => {
    if (!value.trim()) return true;
    const parsed = parseDecimalInput(value);
    return !Number.isNaN(parsed) && parsed >= 0;
  }, "Informe um custo maior ou igual a zero."),
  active: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const ALLOWED_FILE_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "pdf",
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function validateProductFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return "O arquivo deve ter no máximo 5 MB.";
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_FILE_EXTENSIONS.includes(extension)) {
    return "Use um arquivo PNG, JPG, GIF, WEBP ou PDF.";
  }

  if (
    file.type &&
    !file.type.startsWith("image/") &&
    file.type !== "application/pdf"
  ) {
    return "O arquivo precisa ser uma imagem ou um PDF.";
  }

  return null;
}

export function blobToFile(blob: Blob): File {
  const type = blob.type.toLowerCase();
  const extension = type.includes("pdf")
    ? "pdf"
    : type.includes("jpeg")
      ? "jpg"
      : type.includes("png")
        ? "png"
        : type.includes("gif")
          ? "gif"
          : type.includes("webp")
            ? "webp"
            : "bin";

  return new File([blob], `foto-atual.${extension}`, {
    type: blob.type || "application/octet-stream",
  });
}
