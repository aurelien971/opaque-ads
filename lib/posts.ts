// Client data layer: the `posts` collection (one doc per uploaded video).
//   status: draft → scheduled → posted | failed
//   dueAt is set only while scheduled (the server queries on it).
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { db, storage } from "./firebase";

export type Post = {
  id: string;
  uid: string;
  name: string;
  caption: string;
  videoUrl: string;
  storagePath: string;
  status: "draft" | "scheduled" | "posted" | "failed";
  // Slideshows: mediaType "PHOTO" + the slides. photoPaths are storage paths —
  // the server turns them into URLs on the verified domain for TikTok to pull.
  mediaType?: "VIDEO" | "PHOTO";
  photoUrls?: string[];
  photoPaths?: string[];
  autoAddMusic?: boolean;
  /** Declare the media as AI-generated (TikTok's AIGC label). Defaults to on. */
  aigc?: boolean;
  // Where the creative came from ("opaque-ads" = pushed by the Mac generator)
  // and which template made it — so results can be scored per template.
  source?: string;
  template?: string;
  hashtags?: string;
  privacy?: string;
  allowComments?: boolean;
  allowDuet?: boolean;
  allowStitch?: boolean;
  commercial?: boolean;
  yourBrand?: boolean;
  brandedContent?: boolean;
  dueAt?: Timestamp | null;
  postedAt?: Timestamp;
  deliveredAt?: Timestamp;
  processing?: string;
  createdAt?: Timestamp;
  mode?: "inbox" | "direct";
  error?: string;
  stats?: { views: number; likes: number; comments: number; shares: number };
};

export type Cadence = {
  days: number[]; // 0 = Sunday … 6 = Saturday
  hour: number; // 0–23 local
  minute: number;
  startFrom: Date;
  perDay: number; // posts per posting day
};

export function watchPosts(uid: string, cb: (items: Post[]) => void): () => void {
  const q = query(collection(db, "posts"), where("uid", "==", uid));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Post);
    items.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
    cb(items);
  });
}

export async function uploadPost(uid: string, file: File, onProgress: (pct: number) => void) {
  const path = `users/${uid}/videos/${Date.now()}_${file.name}`;
  const task = uploadBytesResumable(ref(storage, path), file, {
    contentType: file.type || "video/mp4",
  });
  await new Promise<void>((resolve, reject) => {
    task.on(
      "state_changed",
      (s) => onProgress(Math.round((s.bytesTransferred / s.totalBytes) * 100)),
      reject,
      () => resolve(),
    );
  });
  const videoUrl = await getDownloadURL(task.snapshot.ref);
  await addDoc(collection(db, "posts"), {
    uid,
    name: file.name.replace(/\.[^.]+$/, ""),
    caption: "",
    videoUrl,
    storagePath: path,
    status: "draft",
    privacy: "PUBLIC_TO_EVERYONE",
    dueAt: null,
    createdAt: serverTimestamp(),
  });
}

/**
 * A slideshow: several images become one PHOTO post.
 *
 * TikTok pulls photo slides from a URL rather than accepting an upload, and the
 * prefix has to be a domain verified in the developer portal — so we keep the
 * storage *paths* and let the server turn them into /api/media URLs at publish
 * time. photoUrls are the Storage download links, used only for previews here.
 *
 * autoAddMusic is on by default: TikTok picks a track from its own licensed
 * library, exactly like the in-app slideshow editor. It's honoured on direct
 * posts only — an inbox draft lets the account choose its own sound.
 */
export async function uploadSlideshow(
  uid: string,
  files: File[],
  onProgress: (done: number, pct: number) => void,
  /** The folder it came from, if any — it names the draft. */
  label?: string,
) {
  if (!files.length) throw new Error("A slideshow needs at least one image.");
  if (files.length > 35) throw new Error("TikTok allows at most 35 slides.");

  const stamp = Date.now();
  const photoPaths: string[] = [];
  const photoUrls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    // Zero-padded so the slides sort in the order they were chosen.
    const path = `users/${uid}/photos/${stamp}_${String(i).padStart(2, "0")}_${file.name}`;
    const task = uploadBytesResumable(ref(storage, path), file, {
      contentType: file.type || "image/jpeg",
    });
    await new Promise<void>((resolve, reject) => {
      task.on(
        "state_changed",
        (s) => onProgress(i, Math.round((s.bytesTransferred / s.totalBytes) * 100)),
        reject,
        () => resolve(),
      );
    });
    photoPaths.push(path);
    photoUrls.push(await getDownloadURL(task.snapshot.ref));
  }

  await addDoc(collection(db, "posts"), {
    uid,
    name: label ? `${label} · ${files.length} slides` : `Slideshow · ${files.length} slides`,
    caption: "",
    mediaType: "PHOTO",
    photoPaths,
    photoUrls,
    autoAddMusic: true,
    // Kept so the shared Post shape stays valid; unused for photo posts.
    videoUrl: "",
    storagePath: photoPaths[0],
    status: "draft",
    privacy: "PUBLIC_TO_EVERYONE",
    dueAt: null,
    createdAt: serverTimestamp(),
  });
}

export const updatePost = (id: string, fields: Partial<Post>) =>
  updateDoc(doc(db, "posts", id), fields);

export async function deletePost(p: Post) {
  // A slideshow owns every slide, not just the cover.
  const paths = p.mediaType === "PHOTO" ? (p.photoPaths ?? []) : [p.storagePath];
  await Promise.all(
    paths.filter(Boolean).map(async (path) => {
      try {
        await deleteObject(ref(storage, path));
      } catch {
        /* file already gone */
      }
    }),
  );
  await deleteDoc(doc(db, "posts", p.id));
}

export const unschedule = (id: string) =>
  updateDoc(doc(db, "posts", id), { status: "draft", dueAt: null });

// Lays the drafts out on the calendar: next matching day/hour, `perDay` per
// posting day, never in the past. Returns how many were scheduled.
export async function autoSchedule(drafts: Post[], c: Cadence): Promise<number> {
  if (!drafts.length || !c.days.length) return 0;
  const batch = writeBatch(db);
  const cursor = new Date(c.startFrom);
  cursor.setHours(c.hour, c.minute, 0, 0);
  if (cursor.getTime() < Date.now()) cursor.setDate(cursor.getDate() + 1);
  let i = 0;
  let guard = 0;
  while (i < drafts.length && guard++ < 400) {
    if (c.days.includes(cursor.getDay())) {
      for (let k = 0; k < c.perDay && i < drafts.length; k++, i++) {
        const when = new Date(cursor);
        // Spread same-day posts 90 minutes apart.
        when.setMinutes(when.getMinutes() + k * 90);
        batch.update(doc(db, "posts", drafts[i].id), {
          status: "scheduled",
          dueAt: Timestamp.fromDate(when),
        });
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  await batch.commit();
  return i;
}

// Schedules every draft starting at `when` (local time), `gapMinutes` apart.
// The quick-test path: "+15 minutes" or an exact date/time.
export async function scheduleAt(drafts: Post[], when: Date, gapMinutes = 2): Promise<number> {
  if (!drafts.length) return 0;
  const batch = writeBatch(db);
  drafts.forEach((p, i) => {
    const t = new Date(when.getTime() + i * gapMinutes * 60_000);
    batch.update(doc(db, "posts", p.id), { status: "scheduled", dueAt: Timestamp.fromDate(t) });
  });
  await batch.commit();
  return drafts.length;
}

// Smart schedule: lays drafts onto the account's best slots (day + hour),
// walking forward from tomorrow, one draft per slot occurrence.
export async function smartSchedule(drafts: Post[], slots: { day: number; hour: number }[]): Promise<Date[]> {
  if (!drafts.length || !slots.length) return [];
  const batch = writeBatch(db);
  const times: Date[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  let i = 0;
  let guard = 0;
  while (i < drafts.length && guard++ < 400) {
    for (const s of slots.filter((s) => s.day === cursor.getDay()).sort((a, b) => a.hour - b.hour)) {
      if (i >= drafts.length) break;
      const when = new Date(cursor);
      when.setHours(s.hour, 0, 0, 0);
      if (when.getTime() < Date.now() + 10 * 60_000) continue;
      batch.update(doc(db, "posts", drafts[i].id), { status: "scheduled", dueAt: Timestamp.fromDate(when) });
      times.push(when);
      i++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  await batch.commit();
  return times;
}
