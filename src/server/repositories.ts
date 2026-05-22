import type { DocumentRecord, ParticipantProfile } from "@/types/domain";

export interface ParticipantRepository {
  listByGroup(groupName: string): Promise<ParticipantProfile[]>;
  findById(participantId: string): Promise<ParticipantProfile | null>;
}

export interface DocumentRepository {
  listByParticipant(participantId: string): Promise<DocumentRecord[]>;
  createForParticipant(participantId: string, payload: Omit<DocumentRecord, "id" | "participantId">): Promise<DocumentRecord>;
}
