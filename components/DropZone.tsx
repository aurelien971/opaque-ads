"use client";
// A permanent drop target. Always visible, always open — you drag onto it, or
// click it to browse. Folders are welcome: what each one becomes is the parent's
// business, this just reports the groups it found.
import { useRef, useState } from "react";
import { groupsFromDrop, groupsFromInput, type FileGroup } from "@/lib/dropfiles";

export default function DropZone({
  title,
  hint,
  accept,
  directory = false,
  busy,
  onGroups,
}: {
  title: string;
  hint: string;
  accept: string;
  /** Ask the file picker for a folder rather than files. */
  directory?: boolean;
  /** Non-null while an upload is running; shown in place of the hint. */
  busy?: string | null;
  onGroups: (groups: FileGroup[]) => void;
}) {
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={async (e) => {
        e.preventDefault();
        setOver(false);
        onGroups(await groupsFromDrop(e.dataTransfer));
      }}
      onClick={() => !busy && input.current?.click()}
      className={`flex min-h-[132px] cursor-pointer flex-col items-center justify-center rounded-[20px] border border-dashed p-5 text-center transition ${
        over ? "border-accent bg-surface" : "border-[rgba(22,21,15,0.22)] hover:border-fg"
      } ${busy ? "pointer-events-none opacity-70" : ""}`}
    >
      <input
        ref={input}
        type="file"
        accept={accept}
        multiple
        hidden
        // webkitdirectory isn't in React's typings; it's how you ask for a folder.
        {...(directory ? ({ webkitdirectory: "", directory: "" } as Record<string, string>) : {})}
        onChange={(e) => {
          onGroups(groupsFromInput(e.target.files));
          e.target.value = "";
        }}
      />
      <span className="text-[15px] font-medium">{title}</span>
      <span className="mt-1.5 max-w-[260px] text-[12.5px] leading-snug text-faint">
        {busy ?? (over ? "Drop them" : hint)}
      </span>
    </div>
  );
}
