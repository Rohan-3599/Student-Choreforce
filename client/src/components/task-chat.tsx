import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageCircle } from "lucide-react";
import type { Message } from "@shared/schema";
import type { User } from "@shared/models/auth";
import { formatDistanceToNow } from "date-fns";

interface TaskChatProps {
  taskId: string;
  currentUserId: string;
  taskStatus: string;
}

type MessageWithSender = Message & { sender?: User | null };

export function TaskChat({ taskId, currentUserId, taskStatus }: TaskChatProps) {
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const canSend = taskStatus === "claimed" || taskStatus === "in_progress" || taskStatus === "completed";

  const { data: messages = [], isLoading } = useQuery<MessageWithSender[]>({
    queryKey: [`/api/tasks/${taskId}/messages`],
    refetchInterval: 5000,
    enabled: canSend,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/tasks/${taskId}/messages`, { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/messages`] });
      setNewMessage("");
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }, 50);
    },
  });

  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = () => {
    const trimmed = newMessage.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
  };

  if (!canSend) return null;

  return (
    <div className="border rounded-lg overflow-hidden" data-testid="section-chat">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b">
        <MessageCircle className="w-4 h-4 text-primary" />
        <span className="font-semibold text-sm" data-testid="text-chat-header">Messages</span>
        {messages.length > 0 && (
          <span className="text-xs text-muted-foreground">({messages.length})</span>
        )}
      </div>

      <div ref={scrollRef} className="h-[200px] overflow-y-auto p-3 space-y-3" data-testid="chat-messages-container">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2">
            <MessageCircle className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground" data-testid="text-no-messages">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`} data-testid={`chat-message-${msg.id}`}>
                <Avatar className="w-6 h-6 shrink-0">
                  <AvatarImage src={msg.sender?.profileImageUrl ?? undefined} />
                  <AvatarFallback className="text-[9px]">
                    {(msg.sender?.firstName?.[0] ?? "") + (msg.sender?.lastName?.[0] ?? "")}
                  </AvatarFallback>
                </Avatar>
                <div className={`max-w-[75%] ${isMe ? "text-right" : ""}`}>
                  <div className={`inline-block rounded-lg px-3 py-1.5 text-sm ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"}`} data-testid={`chat-message-content-${msg.id}`}>
                    {msg.content}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      {msg.sender?.firstName ?? "User"}
                    </span>
                    {msg.createdAt && (
                      <span className="text-[10px] text-muted-foreground">
                        · {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center gap-2 p-2 border-t bg-background">
        <Input
          ref={inputRef}
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          maxLength={1000}
          disabled={sendMutation.isPending}
          className="text-sm"
          data-testid="input-chat-message"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!newMessage.trim() || sendMutation.isPending}
          data-testid="button-send-message"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
