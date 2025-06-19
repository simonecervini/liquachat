"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { createStore, useStore } from "zustand";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/system/dialog";
import { Button } from "./system/button";
import { Input } from "./system/input";

type DialogData = {
  initialValue: string;
  title: string;
  description: string;
  onSubmit: (value: string) => void;
};

interface DialogStore {
  open: boolean;
  data: DialogData | undefined;
  actions: {
    open: (data: DialogData) => void;
    close: () => void;
  };
}

const dialogStore = createStore<DialogStore>((set) => ({
  open: false,
  data: undefined,
  actions: {
    open: (data) => set({ open: true, data }),
    close: () => set({ open: false }),
  },
}));

export function useRename() {
  const openAction = useStore(dialogStore, (state) => state.actions.open);
  return React.useMemo(() => {
    return {
      rename: (data: DialogData) => {
        openAction(data);
      },
    };
  }, [openAction]);
}

export function RenameDialog() {
  const open = useStore(dialogStore, (state) => state.open);
  const data = useStore(dialogStore, (state) => state.data);
  const closeAction = useStore(dialogStore, (state) => state.actions.close);
  const form = useForm({
    defaultValues: {
      value: data?.initialValue,
    },
    onSubmit: ({ value }) => {
      const newValue = value.value?.trim();
      // TODO: we could show an error if newValue is empty instead of just ignoring the submit
      if (newValue) {
        data?.onSubmit(newValue);
      }
      closeAction();
    },
  });
  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        form.reset();
        if (!newOpen) {
          closeAction();
        }
      }}
    >
      <DialogContent className="sm:max-w-[400px]" autoFocus>
        {data && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <DialogHeader>
              <DialogTitle>{data.title}</DialogTitle>
              <DialogDescription>{data.description}</DialogDescription>
            </DialogHeader>
            <div className="mt-3 mb-4 grid gap-4">
              <form.Field
                name="value"
                children={(field) => (
                  <Input
                    type="text"
                    placeholder="Enter new name"
                    value={field.state.value}
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                    }}
                    onBlur={field.handleBlur}
                  />
                )}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <form.Subscribe
                selector={(state) => [state.canSubmit]}
                children={([canSubmit]) => (
                  <Button type="submit" disabled={!canSubmit}>
                    Save changes
                  </Button>
                )}
              />
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
