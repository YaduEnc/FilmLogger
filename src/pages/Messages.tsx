import { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import { H2, H3 } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { 
  getUserConversations, 
  getConversationMessages, 
  sendMessage, 
  markMessagesAsRead 
} from '@/lib/messaging';
import { Send, ArrowLeft, Film, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      markMessagesAsRead(selectedConversation.id, user!.uid);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const data = await getUserConversations(user!.uid);
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const data = await getConversationMessages(conversationId);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    setIsSending(true);
    try {
      const otherUserId = selectedConversation.participants.find((id: string) => id !== user.uid);
      
      await sendMessage({
        conversationId: selectedConversation.id,
        senderId: user.uid,
        senderName: user.displayName || '',
        senderPhoto: user.photoURL || '',
        text: newMessage,
        recipientId: otherUserId
      });

      setNewMessage('');
      await loadMessages(selectedConversation.id);
      await loadConversations();
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const getOtherUser = (conversation: any) => {
    const otherUserId = conversation.participants.find((id: string) => id !== user?.uid);
    return {
      id: otherUserId,
      name: conversation.participantNames[otherUserId],
      photo: conversation.participantPhotos[otherUserId]
    };
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-12 text-center">
          <p className="text-muted-foreground">Please sign in to view messages</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8">
        <H2 className="mb-6">Messages</H2>

        <div className="grid md:grid-cols-[300px_1fr] gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <div className="border rounded-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-muted/30">
              <H3 className="text-lg">Conversations</H3>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs mt-2">Connect with friends to start chatting!</p>
                </div>
              ) : (
                conversations.map((conversation) => {
                  const otherUser = getOtherUser(conversation);
                  const unreadCount = conversation.unreadCount?.[user.uid] || 0;
                  
                  return (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors border-b ${
                        selectedConversation?.id === conversation.id ? 'bg-muted' : ''
                      }`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={otherUser.photo} />
                        <AvatarFallback>{otherUser.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium truncate">{otherUser.name}</p>
                          {unreadCount > 0 && (
                            <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage || 'No messages yet'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Messages Panel */}
          <div className="border rounded-lg overflow-hidden flex flex-col">
            {selectedConversation ? (
              <>
                {/* Header */}
                <div className="p-4 border-b bg-muted/30 flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={getOtherUser(selectedConversation).photo} />
                    <AvatarFallback>
                      {getOtherUser(selectedConversation).name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{getOtherUser(selectedConversation).name}</p>
                    <Link
                      to={`/profile/${getOtherUser(selectedConversation).name}`}
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => {
                    const isOwn = message.senderId === user.uid;
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.senderPhoto} />
                          <AvatarFallback>{message.senderName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className={`flex-1 ${isOwn ? 'text-right' : ''}`}>
                          <div
                            className={`inline-block max-w-[70%] p-3 rounded-lg ${
                              isOwn
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            {message.movieId && (
                              <Link
                                to={`/${message.mediaType || 'movie'}/${message.movieId}`}
                                className="flex items-center gap-2 mb-2 p-2 bg-background/10 rounded hover:bg-background/20 transition-colors"
                              >
                                {message.moviePoster && (
                                  <img
                                    src={message.moviePoster}
                                    alt={message.movieTitle}
                                    className="w-12 h-16 object-cover rounded"
                                  />
                                )}
                                <div className="text-left">
                                  <p className="text-sm font-medium">{message.movieTitle}</p>
                                  <p className="text-xs opacity-70 flex items-center gap-1">
                                    <Film className="h-3 w-3" />
                                    View Details
                                  </p>
                                </div>
                              </Link>
                            )}
                            <p className="text-sm">{message.text}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(message.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      placeholder="Type a message..."
                      disabled={isSending}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isSending}
                      size="icon"
                    >
                      {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p>Select a conversation to start messaging</p>
                  <p className="text-sm mt-2">or connect with friends to chat about movies!</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

