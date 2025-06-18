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
import { api } from "~/lib/trpc";
import { createMutators } from ".";
import { schema, type Schema } from "./schema";

export const useZero = createUseZero<
  Schema,
  ReturnType<typeof createMutators>
>();

export type Zero = ReturnType<typeof useZero>;

const zeroDataQueryOptions = queryOptions({
  queryKey: ["zero"],
  staleTime: 0,
  queryFn: async () => {
    let jwt: string | undefined;
    const { data: sessionData } = await authClient.getSession({
      fetchOptions: {
        onSuccess: (ctx) => {
          jwt = ctx.response.headers.get("set-auth-jwt") ?? undefined;
        },
      },
    });
    const user = sessionData?.user;
    if (!user) {
      return {
        user: null,
        zero: null,
      };
    }
    invariant(jwt, "Found session but no JWT");
    return {
      user,
      zero: new ZeroClient({
        userID: user.id,
        auth: jwt,
        server: env.NEXT_PUBLIC_ZERO_SERVER_URL,
        schema,
        kvStore: env.NEXT_PUBLIC_NODE_ENV === "development" ? "mem" : "idb",
        mutators: createMutators(user),
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
    return null;
  } else if (!data.user) {
    return <LoginForm />;
  }

  return <ZeroProvider zero={data.zero}>{children}</ZeroProvider>;
}

function LoginForm() {
  const queryClient = useQueryClient();
  const { data: config } = api.utils.getLiquaConfig.useQuery();
  return (
    <div className="flex w-full grow flex-col items-center px-2 text-center">
      <Logo className="my-3" />
      {config && (
        <div className="animate-in fade-in slide-in-from-bottom-5 my-auto flex w-full max-w-md flex-col items-center duration-200">
          <h1 className="mb-1 text-2xl font-bold">Welcome to liqua.chat</h1>
          <p className="text-muted-foreground mb-4 text-sm">
            Sign in below to get started.
          </p>
          <div className="mb-4 flex w-full flex-col gap-2">
            {config.auth.socialProviders?.includes("github") && (
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
            )}
            {config.auth.socialProviders?.includes("google") && (
              <LoginFormButton
                onClick={async () => {
                  await authClient.signIn.social({
                    provider: "google",
                    callbackURL: window.location.href,
                  });
                }}
              >
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 210 210"
                  xmlSpace="preserve"
                  className="size-4 fill-white"
                >
                  <path d="M0,105C0,47.103,47.103,0,105,0c23.383,0,45.515,7.523,64.004,21.756l-24.4,31.696C133.172,44.652,119.477,40,105,40c-35.841,0-65,29.159-65,65s29.159,65,65,65c28.867,0,53.398-18.913,61.852-45H105V85h105v20c0,57.897-47.103,105-105,105S0,162.897,0,105z" />
                </svg>
                Continue with Google
              </LoginFormButton>
            )}
            <LoginFormButton
              className="w-full"
              disabled={!config.auth.allowGuests}
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
      )}
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
