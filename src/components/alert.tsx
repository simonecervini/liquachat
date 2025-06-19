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
        <DialogContent autoFocus>
          <DialogHeader>
            <DialogTitle>{alertData.title}</DialogTitle>
            <DialogDescription>{alertData.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter
            className="sm:flex-row-reverse sm:justify-start" // This hack is required to auto focus the correct (confirm) button
          >
            <Button
              onClick={async () => {
                await alertData.onConfirm?.();
                setOpen(false);
              }}
            >
              {alertData.confirmLabel ?? "Confirm"}
            </Button>
            <Button
              variant="ghost"
              onClick={async () => {
                await alertData.onCancel?.();
                setOpen(false);
              }}
            >
              {alertData.cancelLabel ?? "Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
