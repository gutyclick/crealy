export type EditVersionView = {
  id: string;
  parentVersionId: string | null;
  status: string;
  imageUrl: string | null;
  width: number | null;
  height: number | null;
  instruction: string | null;
  preserveComposition: boolean;
  createdAt: string;
  isCurrent: boolean;
};

export type EditMessageView = {
  id: string;
  versionId: string | null;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
};

export type EditSessionView = {
  id: string;
  title: string;
  status: string;
  currentVersionId: string;
  versions: EditVersionView[];
  messages: EditMessageView[];
};

export type EditVersionResponse = {
  version: EditVersionView;
  assistantMessage: EditMessageView;
  creditsUsed: number;
  creditsRemaining: number;
};

export type ApiErrorResponse = {
  code: string;
  error: string;
};

export type RecentEditSession = {
  id: string;
  title: string;
  updatedAt: string;
  versionCount: number;
  latestInstruction: string | null;
  imageUrl: string | null;
};
