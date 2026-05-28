"use client";

import { useRouter } from "next/navigation";

type ParticipantOption = {
  id: string;
  fullName: string;
  documentCount: number;
};

type CoachParticipantSelectorProps = {
  participants: ParticipantOption[];
  selectedParticipantId: string;
};

export default function CoachParticipantSelector({ participants, selectedParticipantId }: CoachParticipantSelectorProps) {
  const router = useRouter();

  const handleChange = (participantId: string) => {
    if (!participantId) {
      return;
    }

    const params = new URLSearchParams();
    params.set("participantId", participantId);
    router.push(`/coach?${params.toString()}`);
  };

  return (
    <select
      id="participantId"
      name="participantId"
      value={selectedParticipantId}
      onChange={(event) => handleChange(event.target.value)}
      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
    >
      {participants.length ? (
        participants.map((participant) => (
          <option key={participant.id} value={participant.id}>
            {participant.fullName} ({participant.documentCount} document{participant.documentCount > 1 ? "s" : ""})
          </option>
        ))
      ) : (
        <option value="">Aucun athlète disponible</option>
      )}
    </select>
  );
}
