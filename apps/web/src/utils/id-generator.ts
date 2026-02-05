/**
 * Generates unique IDs for messages to prevent collisions
 * Uses timestamp + counter + random string for uniqueness
 */

let messageCounter = 0;

export const generateMessageId = (): string => {
  return `msg-${Date.now()}-${++messageCounter}-${Math.random().toString(36).substr(2, 9)}`;
};

export const generateSessionId = (): string => {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
