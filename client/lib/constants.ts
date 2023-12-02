import { TaskStatus, TaskPriority } from "@/types";

export const dashboardLinks = [
  { label: 'Dashboard', href: '/dashboard'},
  { label: 'Tasks', href: '/tasks'},
]

export type Mode = {
    label: string,
    value: string
}

export const modes: Mode[] = [
  {
    label: 'Automatic',
    value: 'auto',
  },
  {
    label: 'Manual',
    value: 'manual',
  },
  {
    label: 'Hold-to-talk',
    value: 'hold',
  },
];

export const statuses = [
  {
    id: 1, value: 'Incomplete', label: 'Incomplete',
  }, 
  {
    id: 2, value: 'InProgress', label: 'In Progress',
  }, 
  {
    id: 3, value: 'Completed', label: 'Complete',
  }
]

export const priorities = [
  { id: 1, value: 'Low', label: 'Low'}, 
  { id: 2, value: 'Medium', label: 'Medium'}, 
  { id: 3, value: 'High', label: 'High'}, 
]

export const danishPhoneNumberRegex = /\+45\s\d{8}/g;
export const defaultEmoji =  "🌟";

