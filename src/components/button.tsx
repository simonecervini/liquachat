import { type TwcComponentProps } from "react-twc";
import { twx } from "~/lib/cn";

type ButtonProps = TwcComponentProps<"button"> & { $icon?: boolean };

export const ContainedButton = twx.button<ButtonProps>((props) => [
  "outline-none focus-visible:border-primary focus-visible:ring-primary/50 focus-visible:ring-[3px] bg-gradient-to-t text-sm from-blue-500 to-blue-400 shrink-0 disabled:pointer-events-none disabled:opacity-50 shadow-sm rounded-xl text-white flex items-center gap-2 justify-center hover:from-blue-600 hover:to-blue-500 transition-colors [&>svg]:size-4",
  props.$icon ? "size-10 [&>svg]:size-6" : "h-10",
]);
