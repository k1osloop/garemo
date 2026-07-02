"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";

import { ModerationThreadCenter } from "@/components/moderation/ModerationThreadCenter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/ErrorState";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ModerationThreadWithMessages } from "@/types/database";

export function AdminCasesClient() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [threads, setThreads] = useState<ModerationThreadWithMessages[]>([]);

  const loadThreads = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data: role, error: roleError } =
      await supabase.rpc("current_app_role");

    if (roleError || role !== "admin") {
      setError("Esta seccion solo esta disponible para cuentas autorizadas.");
      setIsLoading(false);
      return;
    }

    const { data, error: threadsError } = await supabase.rpc(
      "get_admin_moderation_threads",
    );

    if (threadsError) {
      setError("No pudimos cargar los casos de moderacion.");
      setIsLoading(false);
      return;
    }

    setThreads((data ?? []) as unknown as ModerationThreadWithMessages[]);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadThreads();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadThreads]);

  async function sendMessage(threadId: string, message: string) {
    setError(null);
    setStatusMessage(null);

    const { error: sendError } = await supabase.rpc(
      "admin_send_moderation_message",
      {
        thread_id: threadId,
        message,
        message_type: "message",
        metadata: {},
        internal_to_admin: false,
      },
    );

    if (sendError) {
      setError("No pudimos enviar el mensaje del caso.");
      return;
    }

    setStatusMessage("Mensaje enviado al emprendedor.");
    await loadThreads();
  }

  async function markRead(threadId: string) {
    setError(null);
    const { error: readError } = await supabase.rpc("mark_thread_read", {
      thread_id: threadId,
    });

    if (readError) {
      setError("No pudimos marcar el caso como leido.");
      return;
    }

    await loadThreads();
  }

  async function closeThread(threadId: string) {
    setError(null);
    setStatusMessage(null);
    const { error: closeError } = await supabase.rpc(
      "admin_close_moderation_thread",
      {
        thread_id: threadId,
      },
    );

    if (closeError) {
      setError("No pudimos cerrar el caso.");
      return;
    }

    setStatusMessage("Caso cerrado.");
    await loadThreads();
  }

  if (isLoading) {
    return (
      <Card>
        <p className="text-sm text-muted">Cargando casos de moderacion...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {error ? <ErrorState title="No se pudieron cargar casos" description={error} /> : null}
      {statusMessage ? (
        <Card className="border-emerald-200 bg-emerald-50 text-sm font-bold text-emerald-800">
          {statusMessage}
        </Card>
      ) : null}
      <div className="flex justify-end">
        <Button className="gap-2 rounded-2xl" onClick={() => void loadThreads()} type="button" variant="outline">
          <RefreshCw className="h-4 w-4" />
          Actualizar casos
        </Button>
      </div>
      <ModerationThreadCenter
        mode="admin"
        onCloseThread={closeThread}
        onMarkRead={markRead}
        onReply={sendMessage}
        threads={threads}
        title="Casos y mensajes internos"
      />
    </div>
  );
}
