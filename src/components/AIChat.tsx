import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthProvider";
import {
  useAiHistory,
  useSendAiMessage,
  type AiChatMode,
  type ChatMessage,
} from "@/hooks/useAiChat";
import { usePlayerFiles } from "@/hooks/usePlayerFiles";
import { Spinner } from "@/components/ui/Spinner";

const SUGGESTIONS_COACH_AR = [
  "حلّل أداءه آخر أسبوعين",
  "هل فيه أنماط ألم تحتاج انتباه؟",
  "اقترح تعديلات على البرنامج",
];
const SUGGESTIONS_COACH_EN = [
  "Analyze their last 2 weeks",
  "Any pain patterns to watch?",
  "Suggest program adjustments",
];
const SUGGESTIONS_TRAINEE_AR = [
  "كيف كان أدائي الأسبوع ده؟",
  "إيه التمرين اللي محتاج أركز عليه؟",
  "نصيحة للتعافي بعد التمرين",
];
const SUGGESTIONS_TRAINEE_EN = [
  "How was my performance this week?",
  "Which exercise should I focus on?",
  "Recovery tips after training",
];

export function AIChat({
  mode,
  targetTraineeId,
}: {
  mode: AiChatMode;
  targetTraineeId: string;
}) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const subjectId = targetTraineeId;

  const { data: history, isLoading: historyLoading } = useAiHistory(user?.id, subjectId);
  const send = useSendAiMessage(mode, subjectId, user?.id);
  const { data: files } = usePlayerFiles(subjectId);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (history?.length) {
      setMessages(
        history.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      );
    }
  }, [history]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, send.isPending]);

  const suggestions =
    mode === "coach"
      ? i18n.language === "ar"
        ? SUGGESTIONS_COACH_AR
        : SUGGESTIONS_COACH_EN
      : i18n.language === "ar"
        ? SUGGESTIONS_TRAINEE_AR
        : SUGGESTIONS_TRAINEE_EN;

  const submit = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || send.isPending) return;
    setError(null);

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(nextMessages);
    setInput("");

    try {
      const res = await send.mutateAsync({
        messages: nextMessages,
        attachmentFileIds: selectedFiles.length ? selectedFiles : undefined,
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res.content }]);
      setSelectedFiles([]);
    } catch (err) {
      setMessages(messages);
      setInput(trimmed);
      setError(err instanceof Error ? err.message : t("ai.error"));
    }
  };

  const toggleFile = (id: string) => {
    setSelectedFiles((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const imageFiles = (files ?? []).filter(
    (f) => f.mime_type.startsWith("image/") || f.mime_type === "application/pdf",
  );

  return (
    <div className="card flex flex-col overflow-hidden">
      <div className="border-b border-border bg-surface-2 px-4 py-3">
        <p className="text-sm font-semibold text-text">
          {mode === "coach" ? t("ai.coachTitle") : t("ai.traineeTitle")}
        </p>
        <p className="text-xs text-muted">{t("ai.subtitle")}</p>
      </div>

      <div className="flex max-h-[420px] min-h-[280px] flex-1 flex-col overflow-y-auto p-4">
        {historyLoading && messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-primary">
            <Spinner className="h-6 w-6" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-muted">{t("ai.empty")}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => submit(s)}
                  className="rounded-full bg-surface-2 px-3 py-1.5 text-xs font-medium text-text transition hover:bg-primary/10 hover:text-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-fg"
                      : "bg-surface-2 text-text"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}
            {send.isPending && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-surface-2 px-4 py-3">
                  <Spinner className="h-4 w-4 text-primary" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {error && (
        <p className="border-t border-border px-4 py-2 text-xs text-danger">{error}</p>
      )}

      {imageFiles.length > 0 && (
        <div className="border-t border-border px-4 py-2">
          <p className="mb-1.5 text-xs text-muted">{t("ai.attachFiles")}</p>
          <div className="flex flex-wrap gap-1.5">
            {imageFiles.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => toggleFile(f.id)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                  selectedFiles.includes(f.id)
                    ? "bg-primary text-primary-fg"
                    : "bg-surface-2 text-muted hover:text-text"
                }`}
              >
                {f.file_name}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        className="flex gap-2 border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(input);
        }}
      >
        <input
          className="input flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("ai.placeholder")}
          disabled={send.isPending}
        />
        <button
          type="submit"
          className="btn-primary shrink-0 px-4"
          disabled={send.isPending || !input.trim()}
        >
          {send.isPending ? <Spinner /> : t("ai.send")}
        </button>
      </form>
    </div>
  );
}
