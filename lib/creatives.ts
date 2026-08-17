// Firestore data layer for the creative queue: users/{uid}/creatives/{id}.
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { db, storage } from "./firebase";

export type Creative = {
  id: string;
  name: string;
  caption: string;
  videoUrl: string;
  storagePath: string;
  status: "draft" | "posted";
  postedAt?: number;
  createdAt?: unknown;
};

export function watchCreatives(
  uid: string,
  cb: (items: Creative[]) => void,
): () => void {
  const q = query(
    collection(db, "users", uid, "creatives"),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Creative),
    );
  });
}

// Uploads a video to Storage and creates its queue doc.
export async function addCreative(
  uid: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<void> {
  const stem = file.name.replace(/\.[^.]+$/, "");
  const path = `users/${uid}/creatives/${Date.now()}_${file.name}`;
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
  await addDoc(collection(db, "users", uid, "creatives"), {
    name: stem,
    caption: "",
    videoUrl,
    storagePath: path,
    status: "draft",
    createdAt: serverTimestamp(),
  });
}

export async function updateCreative(
  uid: string,
  id: string,
  fields: Partial<Creative>,
) {
  await updateDoc(doc(db, "users", uid, "creatives", id), fields);
}

export async function deleteCreative(uid: string, c: Creative) {
  try {
    await deleteObject(ref(storage, c.storagePath));
  } catch {
    // already gone — the doc removal below is what matters
  }
  await deleteDoc(doc(db, "users", uid, "creatives", c.id));
}
