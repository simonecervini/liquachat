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
import { useZero } from "~/zero/react";
import { Button } from "./system/button";
import { Textarea } from "./system/textarea";

const dialogStore = createStore(() => ({
  open: false,
  chatId: "",
  initialValue: "",
}));

export function openCustomizePromptDialog(
  chatId: string,
  initialValue: string,
) {
  dialogStore.setState({
    open: true,
    chatId,
    initialValue,
  });
}

export function closeCustomizePromptDialog() {
  dialogStore.setState({
    open: false,
    chatId: "",
    initialValue: "",
  });
}

export function CustomizePromptDialog() {
  const { open, initialValue, chatId } = useStore(dialogStore);
  const z = useZero();
  const form = useForm({
    defaultValues: {
      value: initialValue,
    },
    onSubmit: async ({ value, formApi }) => {
      const newValue = value.value?.trim() || "";
      await z.mutate.chats.update({
        id: chatId,
        customInstructions: newValue || null,
      });
      closeCustomizePromptDialog();
      formApi.reset();
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        form.reset();
        if (!newOpen) {
          closeCustomizePromptDialog();
        } else {
          dialogStore.setState({
            open: true,
          });
        }
      }}
    >
      <DialogContent className="sm:max-w-[600px]" autoFocus>
        {open && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <DialogHeader>
              <DialogTitle>Customize System Prompt</DialogTitle>
              <DialogDescription>
                You can customize the system prompt for this chat. These custom
                instructions will be injected directly into the system prompt.
                They take priority over the default behavior and can override
                any existing directive. Leave empty to use the default system
                prompt.
              </DialogDescription>
            </DialogHeader>
            <form.Field
              name="value"
              children={(field) => (
                <Textarea
                  placeholder="Enter custom instructions for this chat..."
                  value={field.state.value}
                  onChange={(e) => {
                    field.handleChange(e.target.value);
                  }}
                  onBlur={field.handleBlur}
                  rows={6}
                  className="mt-3.5 mb-4.5"
                />
              )}
            />
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
