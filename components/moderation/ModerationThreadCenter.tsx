"use client";

import { useState } from "react";
import { CheckCheck, MessageSquareText, Send, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import type { ModerationThreadWithMessages } from "@/types/database";

type Mode = "owner" | "admin";

type Props = {
  mode: Mode;
  onCloseThread?: (threadId: string) => Promise<void> | void;
  onMarkRead: (threadId: string) => Promise<void> | void;
  onReply: (threadId: string, message: string) => Promise<void> | void;
  threads: ModerationThreadWithMessages[];
  title?: string;
};

const threadTypeLabels: Record<string, string> = {
  general: "Mensaje",
  needs_changes: "Correcciones",
  reactivation: "Reactivacion",
  rejection: "Correcciones",
  report: "Reporte",
  suspension: "En revision",
  verification: "Verificacion",
};

const statusLabels: Record<string, string> = {
  closed: "Cerrado",
  open: "Abierto",
  resolved: "Resuelto",
  waiting_admin: "Esperando admin",
  waiting_owner: "Accion requerida",
};

function priorityClass(priority: string) {
  if (priority === "critical") return "bg-red-50 text-red-700 ring-red-100";
  if (priority === "high") return "bg-orange-50 text-orange-700 ring-orange-100";
  if (priority === "low") return "bg-slate-100 text-slate-600 ring-slate-200";
  return "bg-brand/10 text-brand ring-brand/20";
}

function senderLabel(senderRole: string) {
  if (senderRole === "admin") return "Equipo Garemo";
  if (senderRole === "owner") return "Emprendedor";
  return "Sistema Garemo";
}

export function ModerationThreadCenter({
  mode,
  onCloseThread,
  onMarkRead,
  onReply,
  threads,
  title = "Centro de revision",
}: Props) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busyThreadId, setBusyThreadId] = useState<string | null>(null);

  async function submitReply(threadId: string) {
    const message = (drafts[threadId] ?? "").trim();

    if (message.length < 3) {
      return;
    }

    setBusyThreadId(threadId);
    await onReply(threadId, message);
    setDrafts((current) => ({ ...current, [threadId]: "" }));
    setBusyThreadId(null);
  }

  async function markRead(threadId: string) {
    setBusyThreadId(threadId);
    await onMarkRead(threadId);
    setBusyThreadId(null);
  }

  async function closeThread(threadId: string) {
    if (!onCloseThread) return;
    setBusyThreadId(threadId);
    await onCloseThread(threadId);
    setBusyThreadId(null);
  }

  return (
    <Card className="space-y-5 rounded-3xl bg-white shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <MessageSquareText className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-black text-slate-900">{title}</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Mensajes internos de revision, reportes y seguimiento operativo.
            </p>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
          {threads.length} caso{threads.length === 1 ? "" : "s"}
        </span>
      </div>

      {threads.length === 0 ? (
        <EmptyState
          title="No tienes casos de revision abiertos"
          description={
            mode === "admin"
              ? "Cuando se devuelva una verificacion o se revise un reporte, el caso aparecera aqui."
              : "Si Garemo necesita que corrijas algo, veras el seguimiento en esta bandeja."
          }
        />
      ) : (
        <div className="grid gap-4">
          {threads.map((thread) => {
            const latestMessage = thread.messages[thread.messages.length - 1];
            const canReply = thread.status !== "closed" && thread.status !== "resolved";

            return (
              <article
                className={cn(
                  "rounded-3xl border p-4",
                  thread.unread_count > 0
                    ? "border-brand/20 bg-brand/5"
                    : "border-slate-100 bg-slate-50",
                )}
                key={thread.id}
              >
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200">
                          {threadTypeLabels[thread.type] ?? "Caso"}
                        </span>
                        <span className={cn("rounded-full px-3 py-1 text-xs font-black ring-1", priorityClass(thread.priority))}>
                          {thread.priority === "critical" ? "Critico" : thread.priority === "high" ? "Alta prioridad" : "Prioridad normal"}
                        </span>
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white">
                          {statusLabels[thread.status] ?? "Abierto"}
                        </span>
                        {thread.unread_count > 0 ? (
                          <span className="rounded-full bg-brand px-3 py-1 text-xs font-black text-brand-foreground">
                            Nueva
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-600">
                            Leida
                          </span>
                        )}
                      </div>
                      <h3 className="break-words text-lg font-black text-slate-900">
                        {thread.subject}
                      </h3>
                      <p className="text-sm font-semibold text-slate-600">
                        {thread.business_name ?? "Negocio no disponible"}
                      </p>
                      {mode === "admin" && thread.owner_email ? (
                        <p className="text-xs font-semibold text-slate-400">
                          Emprendedor: {thread.owner_email}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        className="gap-2 rounded-2xl"
                        disabled={busyThreadId === thread.id}
                        onClick={() => void markRead(thread.id)}
                        type="button"
                        variant="outline"
                      >
                        <CheckCheck className="h-4 w-4" />
                        Marcar leido
                      </Button>
                      {mode === "admin" && onCloseThread && thread.status !== "closed" ? (
                        <Button
                          className="gap-2 rounded-2xl"
                          disabled={busyThreadId === thread.id}
                          onClick={() => void closeThread(thread.id)}
                          type="button"
                          variant="outline"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Cerrar caso
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {thread.messages.map((message) => (
                      <div
                        className={cn(
                          "rounded-2xl border p-3",
                          message.sender_role === "owner"
                            ? "border-brand/10 bg-white"
                            : "border-slate-100 bg-slate-100/70",
                        )}
                        key={message.id}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                            {senderLabel(message.sender_role)}
                          </p>
                          <p className="text-xs font-semibold text-slate-400">
                            {new Date(message.created_at).toLocaleString("es-BO")}
                          </p>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {message.message}
                        </p>
                      </div>
                    ))}
                  </div>

                  {latestMessage ? (
                    <p className="text-xs font-semibold text-slate-400">
                      Ultima actividad: {new Date(thread.last_message_at).toLocaleString("es-BO")}
                    </p>
                  ) : null}

                  {canReply ? (
                    <div className="grid gap-2">
                      <textarea
                        className="min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                        maxLength={1200}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [thread.id]: event.target.value,
                          }))
                        }
                        placeholder={
                          mode === "admin"
                            ? "Escribe un mensaje claro para el emprendedor."
                            : "Responde al equipo de Garemo con la correccion o contexto."
                        }
                        value={drafts[thread.id] ?? ""}
                      />
                      <Button
                        className="justify-self-start gap-2 rounded-2xl"
                        disabled={busyThreadId === thread.id || (drafts[thread.id] ?? "").trim().length < 3}
                        onClick={() => void submitReply(thread.id)}
                        type="button"
                      >
                        <Send className="h-4 w-4" />
                        Responder
                      </Button>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Card>
  );
}
