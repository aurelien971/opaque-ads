import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata = { title: "Privacy Policy — Opaque Studio" };

export default function Privacy() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-5 py-16 leading-relaxed">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="mt-3 text-muted">Opaque Studio is operated by OAISIS Labs (“we”, “us”). This policy explains what we collect and why.</p>
        <p className="mt-2 text-sm text-muted">Last updated: August 17, 2026</p>

        {[
          [
            "What we collect",
            "Account data: your email address and authentication credentials (managed by Firebase Authentication). Content you provide: the videos you upload and their captions. TikTok connection data: when you connect a TikTok account we receive, via TikTok's official API and with your explicit consent, your TikTok open ID, display name, avatar, and access tokens scoped to the permissions you approved (basic profile, video upload, video publish, and reading the performance of videos you published through us). Usage data: standard logs (IP address, browser type, pages visited) for security and debugging.",
          ],
          [
            "What we use it for",
            "To operate the Service: storing your queue, publishing content to your TikTok account at the times you scheduled, and reading view, like, comment, and share counts for the videos we published so we can show you how they did. Access tokens are used exclusively for these actions. We do not read your TikTok inbox, followers, or any data beyond the scopes you approved.",
          ],
          [
            "What we never do",
            "We do not sell your data. We do not share your data with advertisers. We do not post to your accounts without an explicit instruction from you. We do not use your videos for any purpose other than providing the Service to you.",
          ],
          [
            "Where your data lives",
            "Data is stored in Google Firebase (Authentication, Cloud Firestore, Cloud Storage) in Google Cloud data centers. TikTok access tokens are stored encrypted at rest and are accessible only to the Service acting on your behalf.",
          ],
          [
            "Retention and deletion",
            "Your data is retained while your account is active. Deleting a video removes its file from storage. Disconnecting TikTok deletes the associated tokens immediately. Deleting your account removes your account data, content, and tokens within 30 days — see our Data Deletion page for the exact steps. You may also revoke Opaque Studio's access directly in TikTok's app settings at any time.",
          ],
          [
            "Third-party services",
            "Firebase / Google Cloud (infrastructure and authentication), TikTok (publishing, under your consent). Each processes data only as needed to provide their function.",
          ],
          [
            "Your rights",
            "You can access, correct, export, or delete your data at any time. EU/EEA and UK users have the rights provided by the GDPR, including complaint to a supervisory authority; California users have the rights provided by the CCPA. Contact us to exercise any right.",
          ],
          [
            "Contact",
            "Privacy questions or requests: nicolle.aurelien@gmail.com.",
          ],
        ].map(([h, b]) => (
          <section key={h} className="mt-8">
            <h2 className="text-lg font-semibold">{h}</h2>
            <p className="mt-2 text-muted">{b}</p>
          </section>
        ))}
      </main>
      <Footer />
    </>
  );
}
