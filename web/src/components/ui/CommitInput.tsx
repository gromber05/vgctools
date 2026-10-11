import { useState, type InputHTMLAttributes } from 'react';

type CommitInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: string;
  onCommit: (value: string) => void;
  options?: string[];
};

export function CommitInput({ value, onCommit, options, ...rest }: CommitInputProps) {
  const [draft, setDraft] = useState(value);
  const commit = (v: string) => {
    if (v.trim() !== value) onCommit(v.trim());
  };
  return (
    <input
      {...rest}
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        if (options?.includes(e.target.value)) commit(e.target.value);
      }}
      onBlur={() => commit(draft)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit(draft);
      }}
    />
  );
}
