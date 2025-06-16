"use client";

import * as React from "react";
import { Zero as ZeroClient } from "@rocicorp/zero";
import { createUseZero, ZeroProvider } from "@rocicorp/zero/react";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { GithubIcon, UserIcon } from "lucide-react";
import invariant from "tiny-invariant";

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
    <div className="flex w-full grow flex-col items-center justify-center">
      <div className="flex w-full max-w-md flex-col items-center">
        <h1 className="mb-1 text-2xl font-bold">Welcome to liqua.chat</h1>
        <p className="text-muted-foreground mb-4 text-sm">
          Sign in below to get started.
        </p>
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
        <p className="text-muted-foreground text-center text-xs">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
        {env.NEXT_PUBLIC_NODE_ENV === "development" && (
          <div className="mt-6 w-full rounded-lg border border-slate-300 bg-white/50 px-3 pt-3 pb-1 text-center text-xs">
            <h3 className="mb-0.5 text-lg font-bold">Dev mode only</h3>
            <p className="text-muted-foreground mb-2.5">
              This option is visibile only in dev mode to facilitate testing.
            </p>
            <LoginFormButton
              className="w-full"
              onClick={async () => {
                await authClient.signIn.anonymous();
                await queryClient.invalidateQueries(zeroDataQueryOptions);
              }}
            >
              <UserIcon />
              Login anonymously
            </LoginFormButton>
          </div>
        )}
      </div>
    </div>
  );
}

function LoginFormButton(props: React.ComponentProps<"button">) {
  return (
    <button
      {...props}
      className={cn(
        "mb-2 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-gradient-to-t from-slate-800 to-slate-700 text-sm text-white shadow-sm hover:from-slate-900 hover:to-slate-800 [&>svg]:size-5",
        props.className,
      )}
    >
      {props.children}
    </button>
  );
}
