import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { ImageSizeCheckerClient } from "@/components/tools/image-size-checker-client";
import { SafeAreaCheckerClient } from "@/components/tools/safe-area-checker-client";
import { SocialPostPreviewClient } from "@/components/tools/social-post-preview-client";
import { ThumbnailAnalyzerClient } from "@/components/tools/thumbnail-analyzer-client";
import { ThumbnailComparatorClient } from "@/components/tools/thumbnail-comparator-client";
import { YoutubeBannerDownloaderClient } from "@/components/tools/youtube-banner-downloader-client";
import { YoutubeBannerPreviewClient } from "@/components/tools/youtube-banner-preview-client";
import { YoutubeThumbnailDownloaderClient } from "@/components/tools/youtube-thumbnail-downloader-client";
import { YoutubeThumbnailPreviewClient } from "@/components/tools/youtube-thumbnail-preview-client";
import { getTool } from "@/config/tools";

const toolViews = {
  "youtube-thumbnail-preview": YoutubeThumbnailPreviewClient,
  "youtube-banner-preview": YoutubeBannerPreviewClient,
  "social-post-preview": SocialPostPreviewClient,
  "youtube-thumbnail-downloader": YoutubeThumbnailDownloaderClient,
  "youtube-banner-downloader": YoutubeBannerDownloaderClient,
  "image-size-checker": ImageSizeCheckerClient,
  "safe-area-checker": SafeAreaCheckerClient,
  "thumbnail-analyzer": ThumbnailAnalyzerClient,
  "thumbnail-comparator": ThumbnailComparatorClient,
} as const;

type PageProps = { params: Promise<{ tool: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const definition = getTool((await params).tool);
  return { title: definition ? `${definition.name} | Crealy` : "Herramienta | Crealy" };
}

export default async function DashboardToolPage({ params }: PageProps) {
  const slug = (await params).tool;
  const definition = getTool(slug);
  const ToolView = toolViews[slug as keyof typeof toolViews];

  if (!definition?.isEnabled || !ToolView) notFound();

  return (
    <main className="py-8 sm:py-12">
      <Container>
        <header className="mb-8 sm:mb-10">
          <Link
            href="/dashboard/tools"
            className="inline-flex min-h-11 items-center gap-2 rounded-[0.7rem] px-2 text-sm font-medium text-muted transition-colors hover:bg-white/[0.04] hover:text-foreground"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Todas las herramientas
          </Link>
          <div className="mt-5 max-w-3xl">
            <h1 className="text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">
              {definition.name}
            </h1>
            <p className="mt-3 text-pretty text-base leading-7 text-muted">
              {definition.description}
            </p>
          </div>
        </header>

        <ToolView />
      </Container>
    </main>
  );
}
