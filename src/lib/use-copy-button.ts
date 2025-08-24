import React from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

// I hereby present you the most over-engineered copy button the human race has ever seen
// If you're not using @tanstack/react-query to copy to clipboard, you're ngmi

export function useCopyButton(content: string) {
  const { mutate, status, reset } = useMutation({
    mutationFn: async () => {
      await navigator.clipboard.writeText(content);
    },
    onSuccess: () => {
      toast.success("Copied to clipboard");
    },
    onSettled: () => {
      setTimeout(() => {
        reset();
      }, 7000);
    },
  });

  return React.useMemo(
    () => ({
      buttonProps: {
        onClick: () => {
          mutate();
        },
        ...(status === "pending" && { disabled: true }),
        ...(status === "error" && { "aria-invalid": true }),
      },
      api: {
        copy: mutate,
        reset,
      },
      copied: status === "success",
    }),
    [mutate, reset, status],
  );
}
