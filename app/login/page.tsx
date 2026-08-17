import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Sign in — Opaque Studio" };

export default function Login() {
  return (
    <>
      <Nav />
      <main className="min-h-[70vh] px-5">
        <AuthForm mode="login" />
      </main>
      <Footer />
    </>
  );
}
