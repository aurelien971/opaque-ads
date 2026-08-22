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
  privacy?: string;
  dueAt?: Timestamp | null;
  postedAt?: Timestamp;
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
    privacy: "SELF_ONLY",
    dueAt: null,
    createdAt: serverTimestamp(),
  });
}

export const updatePost = (id: string, fields: Partial<Post>) =>
  updateDoc(doc(db, "posts", id), fields);

export async function deletePost(p: Post) {
  try {
    await deleteObject(ref(storage, p.storagePath));
  } catch {
    /* file already gone */
  }
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
