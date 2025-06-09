"use client";

import * as React from "react";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
} from "@mui/material";
import { PanelLeftIcon, SearchIcon } from "lucide-react";
import { useState } from "react";
import { useQuery, ZeroProvider } from "@rocicorp/zero/react";
import { Logo } from "~/components/logo";
import { schema, type AuthData } from "~/zero/schema";
import { Zero } from "@rocicorp/zero";
import { createMutators } from "~/zero";
import { env } from "~/env";
import { useRouter } from "next/navigation";
import { useZero } from "~/zero/react";
import Link from "next/link";

// TODO: this is for testing purposes
const authData: AuthData = {
  sub: "a167ca4e-8edb-4f24-a453-24d53be7179c",
};
const zero = new Zero({
  userID: authData.sub,
  server: env.NEXT_PUBLIC_ZERO_SERVER_URL,
  schema,
  kvStore: "mem",
  mutators: createMutators(authData),
});

export default function Layout(props: { children: React.ReactNode }) {
  const { children } = props;
  return (
    <ZeroProvider zero={zero}>
      <Box
        sx={{
          display: "flex",
          flex: 1,
        }}
      >
        <Sidebar />
        <Box
          sx={{
            display: "flex",
            flex: 1,
            position: "relative",
            height: "100vh",
          }}
        >
          {children}
        </Box>
      </Box>
    </ZeroProvider>
  );
}

function Sidebar() {
  const [open, setOpen] = useState(false); // TODO: implement this
  const router = useRouter();
  const z = useZero();
  const [chats] = useQuery(z.query.chats.where("userId", "=", authData.sub));
  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          justifyContent: "space-between",
          minWidth: 220,
        }}
      >
        <IconButton
          size="small"
          color="primary"
          onClick={() => setOpen((prev) => !prev)}
        >
          <PanelLeftIcon />
        </IconButton>
        <Logo />
        <Box
          sx={{
            width: (theme) => theme.spacing(3), // TODO: adjust this
          }}
        />
      </Box>
      <Button
        variant="contained"
        onClick={async () => {
          const chatId = crypto.randomUUID();
          await zero.mutate.chats.new({ id: chatId, timestamp: Date.now() })
            .client;
          router.push(`/chat/${chatId}`);
        }}
      >
        New Chat
      </Button>
      <TextField
        variant="standard"
        placeholder="Search your threads..."
        size="small"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            sx: {
              typography: "body2",
              "&:before": {
                borderBottomColor: "rgba(0, 0, 0, 0.12)",
              },
            },
          },
        }}
      />
      <Stack spacing={1}>
        {chats.map((chat) => (
          <Button href={`/chat/${chat.id}`} key={chat.id} LinkComponent={Link}>
            {chat.title ?? "Untitled"}
          </Button>
        ))}
      </Stack>
    </Stack>
  );
}
