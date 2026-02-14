// ============================================================
// NAVIGATION CONFIG
// Defines the nav items for normal and super user modes.
// Modify this file to add/remove/reorder navigation links.
// ============================================================

export interface NavItem {
  label: string;
  href: string;
}

export const normalNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Wallets", href: "/wallets" },
  { label: "AI Assistant", href: "/ai-assistant" },
  { label: "Upload Data", href: "/upload-data" },
  { label: "Insights", href: "/insights" },
];

export const superNavItems: NavItem[] = [
  { label: "Dashboard", href: "/advanced" },
  { label: "Wallets", href: "/wallets" },
  { label: "AI Assistant", href: "/ai-assistant" },
  { label: "Upload Data", href: "/upload-data" },
  { label: "Insights", href: "/insights" },
  { label: "Investments", href: "/investments" },
];

