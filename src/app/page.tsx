"use client";

import { api } from "~/lib/trpc";

export default function Home() {
  const { data } = api.post.hello.useQuery({ text: "from tRPC" });

  return <h1>{data?.greeting}</h1>;
}
