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
            "Account data: your email address and authentication credentials (managed by Firebase Authentication). Content you provide: photos you upload, creatives you generate, captions, and audio files. TikTok connection data: when you connect a TikTok account we receive, via TikTok's official API and with your explicit consent, your TikTok open ID, display name, avatar, and access tokens scoped to the permissions you approved (basic profile, video upload, video publish). Usage data: standard logs (IP address, browser type, pages visited) for security and debugging.",
          ],
          [
            "What we use it for",
            "To operate the Service: rendering your creatives, storing your queue, and publishing content to your TikTok account when you request it. Access tokens are used exclusively to perform the actions you initiate — checking creator info before a post, uploading, and publishing. We do not read your TikTok inbox, followers, or any data beyond the scopes you approved.",
          ],
          [
            "What we never do",
            "We do not sell your data. We do not share your data with advertisers. We do not post to your accounts without an explicit instruction from you. We do not use your photos or creatives to train models or for any purpose other than providing the Service to you.",
          ],
          [
            "Where your data lives",
            "Data is stored in Google Firebase (Authentication, Cloud Firestore, Cloud Storage) in Google Cloud data centers. TikTok access tokens are stored encrypted at rest and are accessible only to the Service acting on your behalf.",
          ],
          [
            "Retention and deletion",
            "Your data is retained while your account is active. Deleting a creative removes its files from storage. Disconnecting TikTok deletes the associated tokens immediately. Deleting your account removes your account data, content, and tokens within 30 days — see our Data Deletion page for the exact steps. You may also revoke Opaque Studio's access directly in TikTok's app settings at any time.",
          ],
          [
            "Third-party services",
            "Firebase / Google Cloud (infrastructure and authentication), TikTok (publishing, under your consent), and AI inference providers used solely to process the images you submit for generation. Each processes data only as needed to provide their function.",
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
