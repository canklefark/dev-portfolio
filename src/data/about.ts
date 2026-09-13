export type StackLevel =
  | "DAILY"
  | "PROFICIENT"
  | "FAMILIAR"
  | "LEARNING"
  | "NEXT";
export type ContactIcon = "email" | "github" | "linkedin";

export interface Cell {
  label: string;
  value: string;
  variant?: "accent" | "green";
}

export interface StackItem {
  name: string;
  level: StackLevel;
}

export interface Contact {
  icon: ContactIcon;
  label: string;
  href: string;
}

export const role =
  "Head of Platform and MarTech at Keller Creative · Knoxville, TN";

export const showAvailability = false;

export const cells: Cell[] = [
  {
    label: "Currently Learning",
    value: "Kubernetes (CKA track)",
    variant: "accent",
  },
  { label: "Currently Building", value: "Internal platform consolidation" },
  { label: "Enrolled In", value: "KodeKloud" },
  { label: "Currently Paddling", value: "Whitewater kayaking" },
];

export const stack: StackItem[] = [
  { name: "SvelteKit", level: "DAILY" },
  { name: "TypeScript", level: "DAILY" },
  { name: "PostgreSQL / Drizzle", level: "DAILY" },
  { name: "Claude Code (agents & plugins)", level: "DAILY" },
  { name: "Docker / Dokploy", level: "DAILY" },
  { name: "MCP (Model Context Protocol)", level: "PROFICIENT" },
  { name: "Cloudflare Pages / Workers", level: "PROFICIENT" },
  { name: "Kubernetes (k3s)", level: "LEARNING" },
  { name: "Bash scripting", level: "FAMILIAR" },
  { name: "Terraform", level: "NEXT" },
];

export const contacts: Contact[] = [
  {
    icon: "email",
    label: "hey@zeikcookson.com",
    href: "mailto:hey@zeikcookson.com",
  },
  {
    icon: "github",
    label: "github.com/canklefark",
    href: "https://github.com/canklefark",
  },
  {
    icon: "linkedin",
    label: "linkedin.com/in/zeikcookson",
    href: "https://linkedin.com/in/zeikcookson",
  },
];
