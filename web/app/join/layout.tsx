import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20">{children}</main>
      <Footer />
    </>
  );
}
