import { useMutation } from "@tanstack/react-query";
import React from "react";
import { toast } from "sonner";

// @markflorkowski if you're reading this
// I know you're a click-to-copy button expert.
// I hope this solution is over-engineered enough for your standards

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
