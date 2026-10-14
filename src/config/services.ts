import type { CollaborationType } from "@/lib/enums";

/**
 * The collaboration offer, in one place.
 *
 * /collaborate, the contact form and the ProfessionalService JSON-LD all read
 * from here. Only the names for now: descriptions of the work are left out
 * until the owner writes them.
 */

export type Service = {
  /** Matches the contact form's collaboration type. */
  type: CollaborationType;
  title: string;
};

export const services: Service[] = [
  { type: "COACHING_INDIVIDUAL", title: "گفت‌وگوی فردی" },
  { type: "COACHING_TEAM", title: "گفت‌وگوی گروهی" },
  { type: "WORKSHOP", title: "کارگاه" },
  { type: "SPEAKING", title: "سخنرانی" },
];

/** The options of the contact form: the offer above, plus «not sure yet». */
export const collaborationChoices: CollaborationType[] = [...services.map((service) => service.type), "OTHER"];
