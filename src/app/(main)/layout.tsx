"use client";
import Header from "../../components/Header";

export default function MainLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col text-gray-800">
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  );
}
