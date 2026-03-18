import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Principal } from "@dfinity/principal";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetAllUsers,
  useGetCallerUserProfile,
  useGetMessages,
  useSendMessage,
} from "../hooks/useQueries";
import { formatTimestamp, getInitials } from "../utils/format";

export default function MessagesPage() {
  const { identity } = useInternetIdentity();
  const { data: allUsers = [] } = useGetAllUsers();
  const { data: myProfile } = useGetCallerUserProfile();
  const [selectedUser, setSelectedUser] = useState<Principal | null>(null);
  const [messageText, setMessageText] = useState("");
  const sendMessage = useSendMessage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentUserId = identity?.getPrincipal().toString() || "";

  const otherUsers = allUsers.filter(
    ([uid]) => uid.toString() !== currentUserId,
  );
  const selectedProfile = otherUsers.find(
    ([uid]) => uid.toString() === selectedUser?.toString(),
  )?.[1];

  const { data: messages = [], isLoading: msgsLoading } =
    useGetMessages(selectedUser);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedUser) return;
    try {
      await sendMessage.mutateAsync({
        recipient: selectedUser,
        content: messageText.trim(),
      });
      setMessageText("");
    } catch {
      toast.error("Failed to send message");
    }
  };

  const myAvatarUrl = myProfile?.avatarBlob?.getDirectURL();
  const myName = myProfile?.displayName || "You";

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6">
      <div
        className="bg-card border border-border rounded-xl shadow-card overflow-hidden flex"
        style={{ height: "calc(100vh - 140px)", minHeight: "500px" }}
      >
        {/* Left: conversation list */}
        <div className="w-72 shrink-0 border-r border-border flex flex-col">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Messages
            </h2>
          </div>
          <ScrollArea className="flex-1">
            {otherUsers.length === 0 ? (
              <div className="p-6 text-center" data-ocid="messages.empty_state">
                <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="text-xs text-muted-foreground">
                  No users to message yet
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {otherUsers.map(([uid, prof], i) => (
                  <button
                    type="button"
                    key={uid.toString()}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left ${
                      selectedUser?.toString() === uid.toString()
                        ? "bg-accent"
                        : ""
                    }`}
                    onClick={() => setSelectedUser(uid as unknown as Principal)}
                    data-ocid={`messages.item.${i + 1}`}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-9 w-9">
                        {prof.avatarBlob && (
                          <AvatarImage src={prof.avatarBlob.getDirectURL()} />
                        )}
                        <AvatarFallback className="text-xs font-semibold bg-primary/10 text-foreground">
                          {getInitials(prof.displayName)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {prof.displayName || uid.toString().slice(0, 10)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {prof.bio || "Say hello!"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right: chat thread */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedUser ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Avatar className="h-8 w-8">
                  {selectedProfile?.avatarBlob && (
                    <AvatarImage
                      src={selectedProfile.avatarBlob.getDirectURL()}
                    />
                  )}
                  <AvatarFallback className="text-xs font-semibold bg-primary/10 text-foreground">
                    {getInitials(selectedProfile?.displayName || "?")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">
                    {selectedProfile?.displayName ||
                      selectedUser.toString().slice(0, 12)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedProfile?.bio || ""}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
              >
                {msgsLoading ? (
                  <div
                    className="flex justify-center py-8"
                    data-ocid="messages.loading_state"
                  >
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center h-full py-12"
                    data-ocid="messages.thread.empty_state"
                  >
                    <MessageCircle className="h-10 w-10 text-muted-foreground opacity-30 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No messages yet
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Send a message to start the conversation
                    </p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {messages.map((msg) => {
                      const isMe = msg.sender.toString() === currentUserId;
                      return (
                        <motion.div
                          key={`${msg.timestamp}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex gap-2 ${
                            isMe ? "flex-row-reverse" : "flex-row"
                          }`}
                          data-ocid="messages.row"
                        >
                          {!isMe && (
                            <Avatar className="h-7 w-7 shrink-0 self-end">
                              {selectedProfile?.avatarBlob && (
                                <AvatarImage
                                  src={selectedProfile.avatarBlob.getDirectURL()}
                                />
                              )}
                              <AvatarFallback className="text-[9px] font-semibold bg-primary/10 text-foreground">
                                {getInitials(
                                  selectedProfile?.displayName || "?",
                                )}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={`max-w-[72%] rounded-2xl px-3.5 py-2 ${
                              isMe
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-accent text-foreground rounded-bl-sm"
                            }`}
                          >
                            <p className="text-sm leading-relaxed">
                              {msg.content}
                            </p>
                            <p
                              className={`text-[10px] mt-0.5 ${
                                isMe
                                  ? "text-primary-foreground/60"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {formatTimestamp(msg.timestamp)}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>

              {/* Input */}
              <form
                onSubmit={handleSend}
                className="flex items-center gap-2 p-3 border-t border-border"
              >
                <Avatar className="h-7 w-7 shrink-0">
                  {myAvatarUrl && <AvatarImage src={myAvatarUrl} />}
                  <AvatarFallback className="text-[9px] font-semibold bg-primary/10 text-foreground">
                    {getInitials(myName)}
                  </AvatarFallback>
                </Avatar>
                <Input
                  placeholder={`Message ${selectedProfile?.displayName || ""}`}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="rounded-full text-sm"
                  data-ocid="messages.input"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="rounded-full h-9 w-9 shrink-0"
                  disabled={sendMessage.isPending || !messageText.trim()}
                  data-ocid="messages.submit_button"
                >
                  {sendMessage.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div
              className="flex flex-col items-center justify-center h-full"
              data-ocid="messages.panel"
            >
              <MessageCircle className="h-12 w-12 text-muted-foreground opacity-25 mb-4" />
              <p className="text-sm font-medium text-muted-foreground">
                Select a conversation
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Choose someone from the left to start messaging
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
