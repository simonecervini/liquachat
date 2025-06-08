"use client";

import { Button, Stack, Typography } from "@mui/material";

export default function Home() {
  return (
    <Stack spacing={2} alignItems="start" sx={{ p: 2 }}>
      <Typography variant="h1">H1</Typography>
      <Button variant="contained" color="primary">
        Click me
      </Button>
      <Button variant="outlined" color="primary">
        Click me
      </Button>
    </Stack>
  );
}
