// Reading a drag-and-drop that may contain folders.
//
// The browser only exposes folder structure through webkitGetAsEntry(), and the
// DataTransfer's items are torn down the moment the drop handler returns — so
// the entries have to be grabbed synchronously first and read afterwards.
//
// A "group" is one folder's worth of files. The dashboard turns each group into
// one carousel; loose files dropped outside any folder become a single group.

export type FileGroup = { name: string; files: File[] };

const IMAGE = /^image\//;
const VIDEO = /^video\//;

/** Sorts by filename the way a person expects: photo2 before photo10. */
const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });

export const isImage = (f: File) => IMAGE.test(f.type) || /\.(jpe?g|png|webp|heic)$/i.test(f.name);
export const isVideo = (f: File) => VIDEO.test(f.type) || /\.(mp4|mov|m4v)$/i.test(f.name);

/**
 * Every file in a drop, grouped by the folder it came from.
 *
 * A folder holding files is one group. A folder holding only other folders is
 * unwrapped — drop one parent containing seven subfolders and you get seven
 * groups, not one — because that's what someone dragging a batch in means.
 */
export async function groupsFromDrop(dt: DataTransfer): Promise<FileGroup[]> {
  // Snapshot synchronously: after the first await, dt.items is empty.
  const entries: FileSystemEntry[] = [];
  const plain: File[] = [];
  const items = Array.from(dt.items ?? []);
  for (const item of items) {
    if (item.kind !== "file") continue;
    const entry = item.webkitGetAsEntry?.();
    if (entry) entries.push(entry);
  }
  // Browsers without the entries API (or a drop that carried no entries) still
  // give us a flat file list.
  if (!entries.length) plain.push(...Array.from(dt.files ?? []));

  const groups: FileGroup[] = [];
  const loose: File[] = [...plain];

  for (const entry of entries) {
    if (entry.isFile) {
      const f = await fileOf(entry as FileSystemFileEntry).catch(() => null);
      if (f) loose.push(f);
    } else if (entry.isDirectory) {
      groups.push(...(await groupsOfDirectory(entry as FileSystemDirectoryEntry)));
    }
  }

  groups.sort(byName);
  for (const g of groups) g.files.sort(byName);
  if (loose.length) groups.push({ name: "", files: loose.sort(byName) });
  return groups.filter((g) => g.files.length);
}

async function groupsOfDirectory(dir: FileSystemDirectoryEntry): Promise<FileGroup[]> {
  const children = await readAll(dir);
  const fileEntries = children.filter((e) => e.isFile) as FileSystemFileEntry[];
  const dirEntries = children.filter((e) => e.isDirectory) as FileSystemDirectoryEntry[];

  // Holds files → it's one group (any subfolders fold into it).
  if (fileEntries.length) {
    const files = (await Promise.all(fileEntries.map((e) => fileOf(e).catch(() => null)))).filter(
      (f): f is File => !!f,
    );
    for (const sub of dirEntries) {
      for (const g of await groupsOfDirectory(sub)) files.push(...g.files);
    }
    return [{ name: dir.name, files }];
  }
  // Only folders inside → each one is its own group.
  const nested: FileGroup[] = [];
  for (const sub of dirEntries) nested.push(...(await groupsOfDirectory(sub)));
  return nested;
}

/** readEntries hands back at most 100 at a time, so keep asking until it's dry. */
function readAll(dir: FileSystemDirectoryEntry): Promise<FileSystemEntry[]> {
  const reader = dir.createReader();
  const out: FileSystemEntry[] = [];
  return new Promise((resolve, reject) => {
    const next = () =>
      reader.readEntries((batch) => {
        if (!batch.length) return resolve(out);
        out.push(...batch);
        next();
      }, reject);
    next();
  });
}

const fileOf = (entry: FileSystemFileEntry) =>
  new Promise<File>((resolve, reject) => entry.file(resolve, reject));

/**
 * The same grouping for a folder picked through <input webkitdirectory>, where
 * structure arrives as a relative path on each file instead of as entries.
 */
export function groupsFromInput(files: FileList | null): FileGroup[] {
  const list = Array.from(files ?? []);
  if (!list.length) return [];
  const map = new Map<string, File[]>();
  for (const f of list) {
    const rel = (f as File & { webkitRelativePath?: string }).webkitRelativePath ?? "";
    const parts = rel.split("/").filter(Boolean);
    // "shoot-a/img1.jpg" → group "shoot-a"; a bare filename → the loose group.
    const key = parts.length > 1 ? parts[parts.length - 2] : "";
    map.set(key, [...(map.get(key) ?? []), f]);
  }
  return [...map.entries()]
    .map(([name, files]) => ({ name, files: files.sort(byName) }))
    .sort(byName);
}
