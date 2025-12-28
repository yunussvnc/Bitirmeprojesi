export type Place = {
  id: number | string;
  name: string;
  subtitle?: string;      // "Sessiz, çalışma dostu"
  description?: string;   // detay açıklama
  tags?: string[];        // ["quiet","work","cheap"]
  imageUrl?: string;
  rating?: number;
};
