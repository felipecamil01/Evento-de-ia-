export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Event {
  id: string;
  name: string;
  type: string;
  description: string | null;
  guestCount: number;
  date: string | null;
  status: string;
  updatedAt: string;
}

export interface LayoutElement {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  layer: string;
  color: string | null;
  order: number;
}

export interface Layout {
  id: string;
  name: string;
  canvasW: number;
  canvasH: number;
  isValidated: boolean;
  eventId: string;
  elements: LayoutElement[];
}
