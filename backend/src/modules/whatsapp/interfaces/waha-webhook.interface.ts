import type {
  SessionStatusPayload,
  MessagePayload,
  MessageReactionPayload,
  MessageAckPayload,
  MessageEditedPayload,
  MessageRevokedPayload,
  ChatArchivePayload,
  GroupJoinPayload,
  GroupLeavePayload,
  GroupParticipantsPayload,
  GroupUpdatePayload,
  PresenceUpdatePayload,
  PollVotePayload,
  LabelPayload,
  LabelChatPayload,
  CallPayload,
  EventResponsePayload,
  WAHAContact,
  WAHAEnvironment,
} from './waha-events.interface';

// Base webhook event structure
export interface WAHAWebhookEventBase<T = any> {
  id: string; // ULID
  timestamp: number; // Unix timestamp in milliseconds
  event: string;
  session: string;
  metadata?: Record<string, any>; // Custom metadata from session config
  me?: WAHAContact;
  payload: T;
  environment?: WAHAEnvironment;
  engine?: string;
}

// Typed webhook events
export type SessionStatusEvent = WAHAWebhookEventBase<SessionStatusPayload> & {
  event: 'session.status';
};

export type MessageEvent = WAHAWebhookEventBase<MessagePayload> & {
  event: 'message';
};

export type MessageAnyEvent = WAHAWebhookEventBase<MessagePayload> & {
  event: 'message.any';
};

export type MessageReactionEvent =
  WAHAWebhookEventBase<MessageReactionPayload> & {
    event: 'message.reaction';
  };

export type MessageAckEvent = WAHAWebhookEventBase<MessageAckPayload> & {
  event: 'message.ack';
};

export type MessageWaitingEvent = WAHAWebhookEventBase<MessagePayload> & {
  event: 'message.waiting';
};

export type MessageEditedEvent = WAHAWebhookEventBase<MessageEditedPayload> & {
  event: 'message.edited';
};

export type MessageRevokedEvent =
  WAHAWebhookEventBase<MessageRevokedPayload> & {
    event: 'message.revoked';
  };

export type ChatArchiveEvent = WAHAWebhookEventBase<ChatArchivePayload> & {
  event: 'chat.archive';
};

export type GroupJoinEvent = WAHAWebhookEventBase<GroupJoinPayload> & {
  event: 'group.v2.join';
};

export type GroupLeaveEvent = WAHAWebhookEventBase<GroupLeavePayload> & {
  event: 'group.v2.leave';
};

export type GroupParticipantsEvent =
  WAHAWebhookEventBase<GroupParticipantsPayload> & {
    event: 'group.v2.participants';
  };

export type GroupUpdateEvent = WAHAWebhookEventBase<GroupUpdatePayload> & {
  event: 'group.v2.update';
};

export type PresenceUpdateEvent =
  WAHAWebhookEventBase<PresenceUpdatePayload> & {
    event: 'presence.update';
  };

export type PollVoteEvent = WAHAWebhookEventBase<PollVotePayload> & {
  event: 'poll.vote';
};

export type PollVoteFailedEvent = WAHAWebhookEventBase<PollVotePayload> & {
  event: 'poll.vote.failed';
};

export type LabelUpsertEvent = WAHAWebhookEventBase<LabelPayload> & {
  event: 'label.upsert';
};

export type LabelDeletedEvent = WAHAWebhookEventBase<LabelPayload> & {
  event: 'label.deleted';
};

export type LabelChatAddedEvent = WAHAWebhookEventBase<LabelChatPayload> & {
  event: 'label.chat.added';
};

export type LabelChatDeletedEvent = WAHAWebhookEventBase<LabelChatPayload> & {
  event: 'label.chat.deleted';
};

export type CallReceivedEvent = WAHAWebhookEventBase<CallPayload> & {
  event: 'call.received';
};

export type CallAcceptedEvent = WAHAWebhookEventBase<CallPayload> & {
  event: 'call.accepted';
};

export type CallRejectedEvent = WAHAWebhookEventBase<CallPayload> & {
  event: 'call.rejected';
};

export type EventResponseEvent =
  WAHAWebhookEventBase<EventResponsePayload> & {
    event: 'event.response';
  };

export type EventResponseFailedEvent =
  WAHAWebhookEventBase<EventResponsePayload> & {
    event: 'event.response.failed';
  };

// Union type for all webhook events
export type WAHAWebhookEvent =
  | SessionStatusEvent
  | MessageEvent
  | MessageAnyEvent
  | MessageReactionEvent
  | MessageAckEvent
  | MessageWaitingEvent
  | MessageEditedEvent
  | MessageRevokedEvent
  | ChatArchiveEvent
  | GroupJoinEvent
  | GroupLeaveEvent
  | GroupParticipantsEvent
  | GroupUpdateEvent
  | PresenceUpdateEvent
  | PollVoteEvent
  | PollVoteFailedEvent
  | LabelUpsertEvent
  | LabelDeletedEvent
  | LabelChatAddedEvent
  | LabelChatDeletedEvent
  | CallReceivedEvent
  | CallAcceptedEvent
  | CallRejectedEvent
  | EventResponseEvent
  | EventResponseFailedEvent;

// Legacy types for backward compatibility
export interface WahaWebhookPayload {
  id?: string;
  [key: string]: unknown;
}

export interface WahaWebhookEvent {
  event: string;
  session: string;
  engine?: string;
  environment?: Record<string, unknown>;
  payload: WahaWebhookPayload;
  me?: Record<string, unknown>;
}

export interface WahaWebhookHeaders {
  requestId?: string;
  timestamp?: string;
  signature?: string;
  algorithm?: string;
}
