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

export const currentStage = "ADDING FLUX";

export const role =
  "Designer / Developer at Keller Creative — Knoxville, TN — @canklefark";

export const showAvailability = false;

export const cells: Cell[] = [
  { label: "Currently Learning", value: "Kubernetes, Flux", variant: "accent" },
  { label: "Currently Building", value: "K8s cluster (adding Flux)" },
  { label: "Enrolled In", value: "KodeKloud" },
  { label: "Currently Racing", value: "HPDE / SCCA time trials → Sundae Cup" },
];

export const stack: StackItem[] = [
  { name: "Claude Code", level: "DAILY" },
  { name: "Docker", level: "DAILY" },
  { name: "Git / GitHub", level: "DAILY" },
  { name: "WordPress / Gridpane", level: "PROFICIENT" },
  { name: "Ansible", level: "FAMILIAR" },
  { name: "Kubernetes (k3s)", level: "LEARNING" },
  { name: "Bash scripting", level: "LEARNING" },
  { name: "Terraform", level: "NEXT" },
  { name: "Go", level: "NEXT" },
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
