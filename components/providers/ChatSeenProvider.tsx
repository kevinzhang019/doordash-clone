'use client';

import { createContext, useContext, useState } from 'react';

interface ChatSeenContextValue {
  seenCountByOrder: Record<number, number>;
  markSeen: (orderId: number, count: number) => void;
}

const ChatSeenContext = createContext<ChatSeenContextValue>({
  seenCountByOrder: {},
  markSeen: () => {},
});

export function ChatSeenProvider({ children }: { children: React.ReactNode }) {
  const [seenCountByOrder, setSeenCountByOrder] = useState<Record<number, number>>({});

  const markSeen = (orderId: number, count: number) => {
    setSeenCountByOrder(prev => {
      if ((prev[orderId] ?? 0) >= count) return prev;
      return { ...prev, [orderId]: count };
    });
  };

  return (
    <ChatSeenContext.Provider value={{ seenCountByOrder, markSeen }}>
      {children}
    </ChatSeenContext.Provider>
  );
}

export function useChatSeen() {
  return useContext(ChatSeenContext);
}
