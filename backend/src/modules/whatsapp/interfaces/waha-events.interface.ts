/**
 * WAHA Webhook Event Types
 * Based on WAHA documentation: https://waha.devlike.pro/docs/how-to/events/
 */

// ==================
// ===== Common =====
// ==================

export interface WAHAContact {
  id: string;
  pushName?: string;
  [key: string]: any; // Allow additional fields
}

export interface WAHAEnvironment {
  tier: string;
  version: string;
  [key: string]: any; // Allow additional fields
}

// ==================
// ===== Session =====
// ==================

export type SessionStatus =
  | 'STOPPED'
  | 'STARTING'
  | 'SCAN_QR_CODE'
  | 'WORKING'
  | 'FAILED';

export interface SessionStatusHistory {
  status: SessionStatus;
  timestamp: number;
}

export interface SessionStatusPayload {
  status: SessionStatus;
  statuses: SessionStatusHistory[];
  [key: string]: any; // Allow additional fields
}

// ==================
// ===== Message =====
// ==================

export interface MessageMedia {
  url: string;
  mimetype: string;
  filename: string | null;
  error: string | null;
}

export interface MessageReaction {
  text: string; // emoji or empty string if removed
  messageId: string;
}

export interface MessageBase {
  id: string;
  timestamp: number;
  from: string;
  fromMe: boolean;
  to: string;
  body?: string;
  hasMedia: boolean;
  media?: MessageMedia;
  ack?: number;
  ackName?: 'ERROR' | 'PENDING' | 'SERVER' | 'DEVICE' | 'READ' | 'PLAYED';
  vCards?: any[];
  source?: 'app' | 'api';
  participant?: string; // For group messages
  replyTo?: string; // ID of message being replied to
  _data?: any; // Engine-specific data
  [key: string]: any; // Allow additional fields
}

export interface MessagePayload extends MessageBase {}

export interface MessageReactionPayload {
  id: string;
  from: string;
  fromMe: boolean;
  participant: string;
  to: string;
  timestamp: number;
  reaction: MessageReaction;
}

export interface MessageAckPayload {
  id: string;
  from: string;
  participant: string | null;
  fromMe: boolean;
  ack: number;
  ackName: 'ERROR' | 'PENDING' | 'SERVER' | 'DEVICE' | 'READ' | 'PLAYED';
}

export interface MessageEditedPayload extends MessageBase {
  editedMessageId: string;
}

export interface MessageRevokedPayload {
  after: MessageBase;
  revokedMessageId: string;
  before: MessageBase | null;
}

// ==================
// ===== Chat =====
// ==================

export interface ChatArchivePayload {
  id: string;
  archived: boolean;
  timestamp: number;
}

// ==================
// ===== Group =====
// ==================

export interface GroupParticipant {
  id: string;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
}

export interface GroupJoinPayload {
  chatId: string;
  participants: GroupParticipant[];
  timestamp: number;
}

export interface GroupLeavePayload {
  chatId: string;
  participants: GroupParticipant[];
  timestamp: number;
}

export interface GroupParticipantsPayload {
  chatId: string;
  action: 'add' | 'remove' | 'promote' | 'demote';
  participants: GroupParticipant[];
  timestamp: number;
}

export interface GroupUpdatePayload {
  chatId: string;
  action: 'subject' | 'description' | 'picture' | 'settings';
  newValue?: any;
  timestamp: number;
}

// ==================
// ===== Presence =====
// ==================

export interface PresenceUpdatePayload {
  id: string;
  participant?: string;
  state: 'typing' | 'recording' | 'online' | 'offline';
  timestamp: number;
}

// ==================
// ===== Poll =====
// ==================

export interface PollVotePayload {
  vote: {
    id: string;
    to: string;
    from: string;
    fromMe: boolean;
    selectedOptions: string[];
    timestamp: number;
  };
  poll: {
    id: string;
    to: string;
    from: string;
    fromMe: boolean;
  };
}

// ==================
// ===== Label =====
// ==================

export interface LabelPayload {
  id: string;
  name: string;
  color: number;
  colorHex: string;
}

export interface LabelChatPayload {
  labelId: string;
  chatId: string;
  label: LabelPayload | null;
}

// ==================
// ===== Call =====
// ==================

export interface CallPayload {
  id: string;
  from: string;
  timestamp: number;
  isVideo: boolean;
  isGroup: boolean;
}

// ==================
// ===== Event Message =====
// ==================

export interface EventResponsePayload {
  eventId: string;
  participantId: string;
  response: 'GOING' | 'NOT_GOING' | 'MAYBE';
  timestamp: number;
}
