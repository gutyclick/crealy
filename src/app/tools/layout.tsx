import type { ReactNode } from "react";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ToolAnalytics } from "@/components/tools/tool-analytics";
import { FeedbackWidget } from "@/components/feedback/feedback-widget";

export default function ToolsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <ToolAnalytics />
      <main className="flex-1">{children}</main>
      <FeedbackWidget />
      <Footer />
    </>
  );
}
