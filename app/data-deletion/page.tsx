import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata = { title: "Data Deletion — OAISIS Labs" };

export default function DataDeletion() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-5 py-16 leading-relaxed">
        <h1 className="text-3xl font-bold">Data Deletion</h1>
        <p className="mt-4 text-muted">
          You control your data. Three levels of deletion, all immediate to
          initiate:
        </p>
        <ol className="mt-6 list-decimal space-y-4 pl-5 text-muted">
          <li>
            <strong className="text-fg">Disconnect TikTok.</strong> Dashboard →
            TikTok connection → Disconnect. This deletes our stored access
            tokens for your TikTok account immediately. You can also revoke
            access from the TikTok app: Settings → Security &amp; permissions →
            Apps &amp; services.
          </li>
          <li>
            <strong className="text-fg">Delete content.</strong> Deleting a
            creative in your dashboard removes its video and image files from
            our storage.
          </li>
          <li>
            <strong className="text-fg">Delete your account.</strong> Email{" "}
            <a className="text-accent" href="mailto:nicolle.aurelien@gmail.com">
              nicolle.aurelien@gmail.com
            </a>{" "}
            from your registered address with the subject “Delete my account”.
            Your account, content, and all associated tokens are removed within
            30 days, and we confirm by email when done.
          </li>
        </ol>
      </main>
      <Footer />
    </>
  );
}
