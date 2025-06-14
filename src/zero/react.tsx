"use client";

import { useState } from "react";
import { Zero as ZeroClient } from "@rocicorp/zero";
import { createUseZero, ZeroProvider } from "@rocicorp/zero/react";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { GithubIcon } from "lucide-react";
import invariant from "tiny-invariant";

import { env } from "~/env";
import { authClient } from "~/lib/auth";
import { createMutators } from ".";
import { schema, type AuthData, type Schema } from "./schema";

export const useZero = createUseZero<
  Schema,
  ReturnType<typeof createMutators>
>();

export type Zero = ReturnType<typeof useZero>;

const zeroDataQueryOptions = queryOptions({
  queryKey: ["zero"],
  staleTime: 0,
  queryFn: async (): Promise<
    { authData: null; zero: null } | { authData: AuthData; zero: Zero }
  > => {
    let jwt: string | undefined;
    const { data: authData } = await authClient.getSession({
      fetchOptions: {
        onSuccess: (ctx) => {
          jwt = ctx.response.headers.get("set-auth-jwt") ?? undefined;
        },
      },
    });
    if (!authData) {
      return {
        authData: null,
        zero: null,
      };
    }
    invariant(jwt, "Found session but no JWT");
    return {
      authData,
      zero: new ZeroClient({
        userID: authData.user.id,
        auth: jwt,
        server: env.NEXT_PUBLIC_ZERO_SERVER_URL,
        schema,
        kvStore: env.NEXT_PUBLIC_ZERO_SERVER_URL.includes("localhost")
          ? "mem"
          : "idb",
        mutators: createMutators(authData),
      }),
    };
  },
});

export function ZeroAuthenticatedProvider(props: {
  children: React.ReactNode;
}) {
  const { children } = props;
  const { data } = useQuery(zeroDataQueryOptions);

  if (!data) {
    return "loading...";
  } else if (!data.authData) {
    return <LoginForm />;
  }

  return <ZeroProvider zero={data.zero}>{children}</ZeroProvider>;
}

function LoginForm() {
  return (
    <div className="flex w-full grow flex-col items-center justify-center">
      <div className="flex w-full max-w-md flex-col items-center">
        <h1 className="mb-1 text-2xl font-bold">Welcome to liqua.chat</h1>
        <p className="text-muted-foreground mb-4 text-sm">
          Sign in below to get started.
        </p>
        <button
          onClick={async () => {
            await authClient.signIn.social({
              provider: "github",
              callbackURL: window.location.href,
            });
          }}
          className="mb-2 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-gradient-to-t from-slate-800 to-slate-700 text-sm text-white shadow-sm hover:from-slate-900 hover:to-slate-800"
        >
          <GithubIcon className="size-5" />
          Continue with GitHub
        </button>
        <p className="text-muted-foreground text-center text-xs">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
        {env.NEXT_PUBLIC_ZERO_SERVER_URL.includes("localhost") && (
          <LoginFormDevOnly />
        )}
      </div>
    </div>
  );
}

function LoginFormDevOnly() {
  const [email, setEmail] = useState("");
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    void authClient.signIn.magicLink({
      email,
      callbackURL: window.location.href,
    });
  };
  return (
    <div className="mt-4 flex w-full flex-col items-center rounded-md border border-slate-300 bg-white/50 p-4 text-sm">
      Visible only in dev mode
      <form
        onSubmit={handleSubmit}
        className="mt-1 mb-2 flex w-full max-w-md justify-center gap-2"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-sm border border-slate-300 p-2 text-sm"
          placeholder="Email"
        />
        <button
          type="submit"
          className="bg-primary text-primary-foreground rounded-sm px-2 text-sm"
        >
          Login
        </button>
      </form>
      <p className="text-muted-foreground text-center text-xs">
        You will receive the magic link in your dev console.
      </p>
    </div>
  );
}
