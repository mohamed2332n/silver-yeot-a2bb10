import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

type RequestBody = {
  mode: "coach" | "trainee";
  targetTraineeId?: string;
  messages: ChatMessage[];
  attachmentFileIds?: string[];
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-4o-mini";
const CONTEXT_DAYS = 60;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function daysAgoISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

async function buildTraineeContext(
  supabase: ReturnType<typeof createClient>,
  traineeId: string,
) {
  const since = daysAgoISO(CONTEXT_DAYS);

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, created_at")
    .eq("id", traineeId)
    .maybeSingle();

  const { data: assignment } = await supabase
    .from("trainee_programs")
    .select("start_date, program:programs(name, description, program_days(day_index, title, program_exercises(position, target_sets, target_reps, target_weight, rest_seconds, exercise:exercises(name_ar, name_en, muscle_group))))")
    .eq("trainee_id", traineeId)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("session_date, overall_feeling, pain_flag, notes, set_logs(weight, reps, rest_taken, condition)")
    .eq("trainee_id", traineeId)
    .gte("session_date", since)
    .order("session_date", { ascending: false })
    .limit(30);

  const { data: metrics } = await supabase
    .from("body_metrics")
    .select("recorded_at, body_weight, notes")
    .eq("trainee_id", traineeId)
    .gte("recorded_at", since)
    .order("recorded_at", { ascending: true });

  const { data: files } = await supabase
    .from("player_files")
    .select("id, file_name, kind, description, mime_type, created_at")
    .eq("trainee_id", traineeId)
    .order("created_at", { ascending: false });

  return {
    profile,
    program: assignment?.program ?? null,
    programStart: assignment?.start_date ?? null,
    sessions: sessions ?? [],
    bodyMetrics: metrics ?? [],
    files: files ?? [],
  };
}

function buildSystemPrompt(
  mode: "coach" | "trainee",
  context: Awaited<ReturnType<typeof buildTraineeContext>>,
  locale: string,
) {
  const isAr = locale === "ar";
  const ctxJson = JSON.stringify(context, null, 2);

  if (mode === "coach") {
    return isAr
      ? `أنت مساعد تحليلي ذكي لمدرب لياقة بدنية. مهمتك تحليل بيانات المتدرب ومساعدة المدرب في اتخاذ قرارات تدريبية مدروسة.

البيانات المتاحة (JSON):
${ctxJson}

تعليمات:
- حلّل الأداء والتقدم والألم والالتزام
- اقترح تعديلات على البرنامج (أوزان، تمارين بديلة، أيام راحة)
- لاحظ أي أنماط خطيرة (ألم متكرر، تراجع في الأداء)
- كن مختصراً وعملياً
- أجب بالعربية إلا إذا طُلب غير ذلك`
      : `You are an AI analysis assistant for a fitness coach. Analyze the trainee data and help the coach make informed training decisions.

Available data (JSON):
${ctxJson}

Instructions:
- Analyze performance, progress, pain patterns, and compliance
- Suggest program adjustments (weights, alternatives, rest days)
- Flag risky patterns (recurring pain, performance decline)
- Be concise and actionable`;
  }

  return isAr
    ? `أنت مساعد تدريبي ذكي للمتدرب. تساعده بناءً على بياناته الشخصية فقط.

بيانات المتدرب (JSON):
${ctxJson}

تعليمات:
- أجب على أسئلته عن تمرينه وتقدمه
- قدّم نصائح آمنة ومشجعة
- لا تخترع بيانات غير موجودة
- إذا سُئلت عن شيء خارج بياناته، وضّح ذلك
- أجب بالعربية إلا إذا طُلب غير ذلك`
    : `You are a smart training assistant for the trainee. Help based on their personal data only.

Trainee data (JSON):
${ctxJson}

Instructions:
- Answer questions about their training and progress
- Give safe, encouraging advice
- Do not invent data not in the context
- If asked about something outside their data, clarify that
- Respond in the user's language`;
}

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "file"; file: { filename: string; file_data: string } };

async function buildAttachmentParts(
  supabase: ReturnType<typeof createClient>,
  traineeId: string,
  fileIds: string[],
): Promise<ContentPart[]> {
  if (!fileIds.length) return [];

  const { data: files } = await supabase
    .from("player_files")
    .select("id, file_name, file_path, mime_type, trainee_id")
    .in("id", fileIds)
    .eq("trainee_id", traineeId);

  if (!files?.length) return [];

  const parts: ContentPart[] = [];

  for (const file of files) {
    const { data: signed, error } = await supabase.storage
      .from("player-files")
      .createSignedUrl(file.file_path, 3600);

    if (error || !signed?.signedUrl) continue;

    if (file.mime_type.startsWith("image/")) {
      parts.push({
        type: "image_url",
        image_url: { url: signed.signedUrl },
      });
    } else if (file.mime_type === "application/pdf") {
      parts.push({
        type: "file",
        file: {
          filename: file.file_name,
          file_data: signed.signedUrl,
        },
      });
    }
  }

  return parts;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) {
      return jsonResponse(
        { error: "OPENROUTER_API_KEY not configured. Set it in Supabase Edge Function secrets." },
        503,
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body: RequestBody = await req.json();
    const { mode, messages, attachmentFileIds = [] } = body;

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role, locale, full_name")
      .eq("id", user.id)
      .single();

    if (!callerProfile) {
      return jsonResponse({ error: "Profile not found" }, 404);
    }

    let targetTraineeId: string;
    if (mode === "trainee") {
      if (callerProfile.role !== "trainee") {
        return jsonResponse({ error: "Trainee mode requires trainee role" }, 403);
      }
      targetTraineeId = user.id;
    } else {
      if (callerProfile.role !== "coach") {
        return jsonResponse({ error: "Coach mode requires coach role" }, 403);
      }
      if (!body.targetTraineeId) {
        return jsonResponse({ error: "targetTraineeId required for coach mode" }, 400);
      }
      targetTraineeId = body.targetTraineeId;

      const { data: trainee } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", targetTraineeId)
        .maybeSingle();

      if (!trainee) {
        return jsonResponse({ error: "Trainee not found or not authorized" }, 403);
      }
    }

    const context = await buildTraineeContext(supabase, targetTraineeId);
    const systemPrompt = buildSystemPrompt(mode, context, callerProfile.locale ?? "ar");
    const model = Deno.env.get("OPENROUTER_MODEL") ?? DEFAULT_MODEL;

    const attachmentParts = await buildAttachmentParts(
      supabase,
      targetTraineeId,
      attachmentFileIds,
    );

    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    const userContent: string | ContentPart[] = attachmentParts.length > 0
      ? [
        { type: "text", text: lastUserMsg?.content ?? "" },
        ...attachmentParts,
      ]
      : (lastUserMsg?.content ?? "");

    const openRouterMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: userContent },
    ];

    const hasPdf = attachmentParts.some((p) => p.type === "file");

    const orResponse = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": supabaseUrl,
        "X-Title": "Gym Coaching PWA",
      },
      body: JSON.stringify({
        model,
        messages: openRouterMessages,
        ...(hasPdf
          ? { plugins: [{ id: "file-parser", pdf: { engine: "pdf-text" } }] }
          : {}),
        max_tokens: 2048,
      }),
    });

    if (!orResponse.ok) {
      const errText = await orResponse.text();
      console.error("OpenRouter error:", errText);
      return jsonResponse({ error: "AI service error", details: errText }, 502);
    }

    const orData = await orResponse.json();
    const assistantContent =
      orData.choices?.[0]?.message?.content ?? "No response from AI.";

    const userMessage = lastUserMsg?.content ?? "";
    await supabase.from("ai_messages").insert([
      {
        user_id: user.id,
        subject_trainee_id: targetTraineeId,
        role: "user",
        content: userMessage,
      },
      {
        user_id: user.id,
        subject_trainee_id: targetTraineeId,
        role: "assistant",
        content: assistantContent,
      },
    ]);

    return jsonResponse({ content: assistantContent, model });
  } catch (err) {
    console.error("ai-chat error:", err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Internal error" },
      500,
    );
  }
});
