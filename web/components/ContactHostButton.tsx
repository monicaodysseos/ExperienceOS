"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Send } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface ContactHostButtonProps {
  providerUserId: number | undefined;
  experienceId: number;
  experienceSlug: string;
  providerName: string;
}

export function ContactHostButton({
  providerUserId,
  experienceId,
  experienceSlug,
  providerName,
}: ContactHostButtonProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/experiences/${experienceSlug}`);
      return;
    }
    setModalOpen(true);
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    if (!providerUserId) {
      setError("Unable to contact host — please try refreshing the page.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      await api.createConversation({
        other_user_id: providerUserId,
        experience_id: experienceId,
        message: message.trim(),
      });
      setModalOpen(false);
      setMessage("");
      router.push("/dashboard/messages");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-800"
      >
        <MessageSquare className="h-4 w-4" />
        Contact Host
      </button>

      <Modal open={modalOpen} onOpenChange={(o) => { if (!o) { setModalOpen(false); setMessage(""); setError(null); } }}>
        <ModalContent
          title={`Message ${providerName}`}
          description="Send a message about this experience. They'll reply in your inbox."
        >
          <div className="space-y-4">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi, I'm interested in booking this experience…"
              rows={4}
              className="w-full rounded-xl border border-navy-200 px-3 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 resize-none"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSend}
                loading={sending}
                disabled={!message.trim()}
              >
                <Send className="h-4 w-4" /> Send Message
              </Button>
            </div>
          </div>
        </ModalContent>
      </Modal>
    </>
  );
}
