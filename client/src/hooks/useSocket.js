import { useEffect, useRef } from 'react';
import { getSocket } from '../lib/socket';

/**
 * Attach Socket.IO event listeners declaratively.
 * Automatically cleans up on unmount or when eventMap changes.
 * @param {Record<string, Function>} eventMap - { eventName: handler }
 * @param {boolean} enabled - only attach when true
 */
const useSocket = (eventMap, enabled = true) => {
  const handlersRef = useRef(eventMap);
  handlersRef.current = eventMap;

  useEffect(() => {
    if (!enabled) return;
    const socket = getSocket();
    if (!socket) return;

    const entries = Object.entries(handlersRef.current);
    const wrappedHandlers = entries.map(([event, handler]) => {
      const wrapped = (...args) => handler(...args);
      socket.on(event, wrapped);
      return [event, wrapped];
    });

    return () => {
      const currentSocket = getSocket();
      if (!currentSocket) return;
      wrappedHandlers.forEach(([event, wrapped]) => {
        currentSocket.off(event, wrapped);
      });
    };
  }, [enabled]);
};

export default useSocket;
