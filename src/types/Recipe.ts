export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  instructions: string[];
  cuisine: string;
  category: string;
  image_url: string;
  youtube?: string;
  source?: string;
  tags: string[];
}
