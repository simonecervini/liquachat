"use client";

import * as React from "react";
import { Zero as ZeroClient } from "@rocicorp/zero";
import { createUseZero, ZeroProvider } from "@rocicorp/zero/react";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { GithubIcon, UserIcon } from "lucide-react";
import invariant from "tiny-invariant";

import { Logo } from "~/components/logo";
import { env } from "~/env";
import { authClient } from "~/lib/auth";
import { cn } from "~/lib/cn";
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
        kvStore: env.NEXT_PUBLIC_NODE_ENV === "development" ? "mem" : "idb",
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
  const queryClient = useQueryClient();
  return (
    <div className="flex w-full grow flex-col items-center px-2 text-center">
      <Logo className="my-3" />
      <div className="my-auto flex w-full max-w-md flex-col items-center">
        <h1 className="mb-1 text-2xl font-bold">Welcome to liqua.chat</h1>
        <p className="text-muted-foreground mb-4 text-sm">
          Sign in below to get started.
        </p>
        <div className="mb-4 flex w-full flex-col gap-2">
          <LoginFormButton
            onClick={async () => {
              await authClient.signIn.social({
                provider: "github",
                callbackURL: window.location.href,
              });
            }}
          >
            <GithubIcon />
            Continue with GitHub
          </LoginFormButton>
          <LoginFormButton
            className="w-full"
            disabled={!env.NEXT_PUBLIC_BETTER_AUTH_ALLOW_ANONYMOUS}
            onClick={async () => {
              await authClient.signIn.anonymous();
              await queryClient.invalidateQueries(zeroDataQueryOptions);
            }}
          >
            <UserIcon />
            Continue as guest
          </LoginFormButton>
        </div>
        <p className="text-muted-foreground text-center text-xs">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

function LoginFormButton(props: React.ComponentProps<"button">) {
  return (
    <button
      {...props}
      className={cn(
        "flex h-12 w-full items-center justify-center gap-2 rounded-md bg-gradient-to-t from-slate-800 to-slate-700 px-2 text-sm whitespace-nowrap text-white shadow-sm outline-none not-disabled:hover:from-slate-900 not-disabled:hover:to-slate-800 focus-visible:ring-4 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 [&>svg]:size-5 [&>svg]:shrink-0",
        props.className,
      )}
    >
      {props.children}
    </button>
  );
}
