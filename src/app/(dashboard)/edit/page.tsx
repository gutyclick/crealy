import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Creaciones" };

export default function EditPage() {
  redirect("/generations");
}
