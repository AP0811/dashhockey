export type Role = "participant" | "coach" | "admin";

export type AppUser = {
  id: string;
  role: Role;
  name: string;
  email: string;
};

export type ParticipantProfile = {
  id: string;
  name: string;
  participantCode: string;
  groupName: string;
};

export type DocumentRecord = {
  id: string;
  participantId: string;
  title: string;
  description: string;
  fileName: string;
  updatedAt: string;
  fileUrl: string;
};
