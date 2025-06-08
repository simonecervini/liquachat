"use client";

import type { Shadows, Theme } from "@mui/material";
import { alpha, createTheme } from "@mui/material";
import { green } from "@mui/material/colors";

// Required to enable css variables
import type {} from "@mui/material/themeCssVarsAugmentation";

const CONSTANTS = {
  shadows: {
    spreadFactor: 5,
    blurFactor: 3,
    shadowKeyUmbraOpacity: 0.25 * 0.2,
    shadowKeyPenumbraOpacity: 0.25 * 0.14,
    shadowAmbientOpacity: 0.25 * 0.12,
  },
};

export const theme = createTheme({
  cssVariables: true,
  typography: {
    fontFamily: "var(--font-sans)",
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 700,
    },
  },
  palette: {
    mode: "light",
    primary: {
      main: green[600],
      contrastText: "#fff",
    },
    text: {
      primary: "#262626", // neutral-800
      secondary: "#57534e", // neutral-600
    },
    background: {
      default: "#FBFEFC",
      paper: "#fff",
    },
    divider: "rgba(0,0,0,.07)",
  },
  shadows: [
    "none",
    ...Array.from({ length: 24 }, (_, index) => createShadow(index)),
  ] as Shadows,
  shape: {
    borderRadius: 12,
  },
});

theme.components = createComponents(theme);

function createComponents(theme: Theme): Theme["components"] {
  return {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          "& .MuiButton-startIcon svg, & .MuiButton-endIcon svg": {
            width: "1em",
            height: "1em",
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          "& .lucide": {
            width: "1em",
            height: "1em",
            fontSize: "1.5rem",
            marginRight: theme.spacing(1),
          },
          textTransform: "none",
          fontWeight: 700,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          "& .lucide": {
            width: "1em",
            height: "1em",
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          "& .lucide": {
            // fontSize: "1.25rem",
            width: "1em",
            height: "1em",
          },
        },
      },
    },
    MuiInputAdornment: {
      styleOverrides: {
        root: {
          "& .lucide": {
            width: "1em",
            height: "1em",
          },
        },
      },
    },
    MuiFilledInput: {
      defaultProps: {
        disableUnderline: true,
      },
      styleOverrides: {
        root: {
          // By default, only top left and right corners are rounded
          borderRadius: theme.vars.shape.borderRadius,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        slotProps: {
          inputLabel: {
            shrink: true,
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 700,
        },
      },
    },
  };
}

export function createShadow(
  index: number,
  { color = "#000" }: { color?: string } = {},
) {
  const params = [
    [0, 2, 1, -1, 0, 1, 1, 0, 0, 1, 3, 0],
    [0, 3, 1, -2, 0, 2, 2, 0, 0, 1, 5, 0],
    [0, 3, 3, -2, 0, 3, 4, 0, 0, 1, 8, 0],
    [0, 2, 4, -1, 0, 4, 5, 0, 0, 1, 10, 0],
    [0, 3, 5, -1, 0, 5, 8, 0, 0, 1, 14, 0],
    [0, 3, 5, -1, 0, 6, 10, 0, 0, 1, 18, 0],
    [0, 4, 5, -2, 0, 7, 10, 1, 0, 2, 16, 1],
    [0, 5, 5, -3, 0, 8, 10, 1, 0, 3, 14, 2],
    [0, 5, 6, -3, 0, 9, 12, 1, 0, 3, 16, 2],
    [0, 6, 6, -3, 0, 10, 14, 1, 0, 4, 18, 3],
    [0, 6, 7, -4, 0, 11, 15, 1, 0, 4, 20, 3],
    [0, 7, 8, -4, 0, 12, 17, 2, 0, 5, 22, 4],
    [0, 7, 8, -4, 0, 13, 19, 2, 0, 5, 24, 4],
    [0, 7, 9, -4, 0, 14, 21, 2, 0, 5, 26, 4],
    [0, 8, 9, -5, 0, 15, 22, 2, 0, 6, 28, 5],
    [0, 8, 10, -5, 0, 16, 24, 2, 0, 6, 30, 5],
    [0, 8, 11, -5, 0, 17, 26, 2, 0, 6, 32, 5],
    [0, 9, 11, -5, 0, 18, 28, 2, 0, 7, 34, 6],
    [0, 9, 12, -6, 0, 19, 29, 2, 0, 7, 36, 6],
    [0, 10, 13, -6, 0, 20, 31, 3, 0, 8, 38, 7],
    [0, 10, 13, -6, 0, 21, 33, 3, 0, 8, 40, 7],
    [0, 10, 14, -6, 0, 22, 35, 3, 0, 8, 42, 7],
    [0, 11, 14, -7, 0, 23, 36, 3, 0, 9, 44, 8],
    [0, 11, 15, -7, 0, 24, 38, 3, 0, 9, 46, 8],
  ] as const;

  const px = params[index] ?? params[0];

  const shadowKeyUmbra = `var(--shadow-key-umbra-color, ${alpha(
    color,
    CONSTANTS.shadows.shadowKeyUmbraOpacity,
  )})`;
  const shadowKeyPenumbra = `var(--shadow-key-penumbra-color, ${alpha(
    color,
    CONSTANTS.shadows.shadowKeyPenumbraOpacity,
  )})`;
  const shadowAmbient = `var(--shadow-ambient-color, ${alpha(
    color,
    CONSTANTS.shadows.shadowAmbientOpacity,
  )})`;

  const spread = CONSTANTS.shadows.spreadFactor;
  const blur = CONSTANTS.shadows.blurFactor;

  return [
    `${px[0]}px ${px[1]}px ${px[2] * spread}px ${px[3] * blur}px ${shadowKeyUmbra}`,
    `${px[4]}px ${px[5]}px ${px[6] * spread}px ${px[7] * blur}px ${shadowKeyPenumbra}`,
    `${px[8]}px ${px[9]}px ${px[10] * spread}px ${px[11] * blur}px ${shadowAmbient}`,
  ].join(",");
}
