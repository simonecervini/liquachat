"use client";

import * as React from "react";
import { createStore, useStore } from "zustand";

import { Button } from "./system/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./system/dialog";

export interface Alert {
  title: string;
  message: string;
  autoFocus?: "confirm" | "cancel";
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: (() => void) | (() => Promise<void>);
  onCancel?: (() => void) | (() => Promise<void>);
}

interface AlertStore {
  open: boolean;
  alertData: Alert | undefined;
  setOpen: (input: false | Alert) => void;
}

export const alertStore = createStore<AlertStore>((set) => ({
  open: false,
  alertData: undefined,
  setOpen: (input) => {
    if (input === false) {
      // Do not update alertData to avoid content flashing
      set({ open: false });
    } else {
      set({ open: true, alertData: input });
    }
  },
}));

export function useAlertDialog() {
  const setOpen = useStore(alertStore, (state) => state.setOpen);

  return React.useMemo(
    () => ({
      openAlert: setOpen,
    }),
    [setOpen],
  );
}

export function AlertEmitter() {
  const { open, alertData, setOpen } = useStore(alertStore);

  const autoFocus = alertData?.autoFocus ?? "confirm";

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          setOpen(false);
        }
      }}
    >
      {alertData && (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{alertData.title}</DialogTitle>
            <DialogDescription>{alertData.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={async () => {
                await alertData.onCancel?.();
                setOpen(false);
              }}
              {...(autoFocus === "cancel" && {
                autoFocus: true,
              })}
            >
              {alertData.cancelLabel ?? "Cancel"}
            </Button>
            <Button
              onClick={async () => {
                await alertData.onConfirm?.();
                setOpen(false);
              }}
              {...(autoFocus === "confirm" && {
                autoFocus: true,
              })}
            >
              {alertData.confirmLabel ?? "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
