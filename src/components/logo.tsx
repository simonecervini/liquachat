import { Box, Typography, type TypographyProps } from "@mui/material";
import { LeafIcon } from "lucide-react";

export function Logo(props: TypographyProps) {
  return (
    <Typography fontWeight={700} {...props}>
      <Box
        component={LeafIcon}
        size="1em"
        sx={{
          display: "inline-block",
          verticalAlign: "middle",
          mr: "0.35em",
          color: "primary.main",
        }}
      />
      Algachat
    </Typography>
  );
}
