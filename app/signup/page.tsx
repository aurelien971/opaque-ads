import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Create account — Opaque Studio" };

export default function Signup() {
  return (
    <>
      <Nav />
      <main className="min-h-[70vh] px-5">
        <AuthForm mode="signup" />
      </main>
      <Footer />
    </>
  );
}
