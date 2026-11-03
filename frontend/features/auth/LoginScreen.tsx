"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/Button";
import { InputField } from "@/components/FormField";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ApiError } from "@/lib/api/client";
import { authApi } from "@/lib/api/auth";
import { useSession } from "./SessionProvider";

const loginSchema = z.object({
  username: z
    .string()
    .refine((value) => value.trim().length > 0, "Informe o usuário."),
  password: z
    .string()
    .refine((value) => value.trim().length > 0, "Informe a senha."),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginScreen({ from }: { from: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { signIn } = useSession();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setFormError(null);

    try {
      const response = await authApi.login({
        username: values.username.trim(),
        password: values.password,
      });
      queryClient.clear();
      signIn(response.username);
      router.replace(from);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          setFormError("Usuário ou senha incorretos.");
          return;
        }
        if (error.status === 400) {
          setFormError("Verifique os dados informados.");
          return;
        }
      }
      setFormError("Não foi possível entrar. Tente novamente.");
    }
  }

  return (
    <main className="grid min-h-screen grid-cols-1 bg-ground lg:grid-cols-2">
      <section className="on-dark relative flex min-h-[280px] flex-col justify-between overflow-hidden bg-ink p-8 text-white sm:p-12">
        <div
          className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(91,61,245,0.72), transparent 68%)",
          }}
          aria-hidden="true"
        />
        <Link
          href="/"
          className="relative font-display text-2xl font-extrabold text-lime"
        >
          Catapult
        </Link>
        <div className="relative mt-16 max-w-lg lg:mt-0">
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] sm:text-[52px]">
            Painel do administrador
          </h1>
          <p className="mt-5 max-w-md text-base text-white/75">
            Gerencie o catálogo, acompanhe os indicadores e mantenha o estoque
            em dia.
          </p>
        </div>
      </section>

      <section className="relative flex items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-[380px] rounded-[20px] border border-line bg-surface p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-3xl font-extrabold text-ink">
              Entrar
            </h2>
            <ThemeToggle />
          </div>
          <p className="mt-1 text-[13px] text-muted">
            Use suas credenciais para acessar o painel.
          </p>

          <form
            className="mt-6 flex flex-col gap-4"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            {formError ? (
              <p
                role="alert"
                className="rounded-xl bg-error px-3.5 py-3 text-[13px] font-bold text-error-ink"
              >
                {formError}
              </p>
            ) : null}

            <InputField
              label="Usuário"
              autoComplete="username"
              autoFocus
              error={errors.username?.message}
              {...register("username")}
            />
            <InputField
              label="Senha"
              type="password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register("password")}
            />

            <Button
              type="submit"
              loading={isSubmitting}
              className="mt-2 w-full"
            >
              Entrar
            </Button>
          </form>

          <Link
            href="/"
            className="mt-6 inline-flex min-h-11 items-center text-[13px] font-bold text-violet hover:underline"
          >
            Voltar à vitrine pública
          </Link>
        </div>
      </section>
    </main>
  );
}
