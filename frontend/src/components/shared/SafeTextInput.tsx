import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import {
  applySafeTextChange,
  type SafeTextProfile,
} from "../../utils/safeTextInput";

type SafeTextInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
> & {
  value: string;
  onChange: (value: string) => void;
  profile?: SafeTextProfile;
};

type SafeTextAreaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "value" | "onChange"
> & {
  value: string;
  onChange: (value: string) => void;
  profile?: SafeTextProfile;
};

export function SafeTextInput({
  value,
  onChange,
  profile = "default",
  ...props
}: SafeTextInputProps) {
  return (
    <input
      {...props}
      value={value}
      onChange={(event) => {
        applySafeTextChange(event.target.value, onChange, profile);
      }}
    />
  );
}

export function SafeTextArea({
  value,
  onChange,
  profile = "default",
  ...props
}: SafeTextAreaProps) {
  return (
    <textarea
      {...props}
      value={value}
      onChange={(event) => {
        applySafeTextChange(event.target.value, onChange, profile);
      }}
    />
  );
}
