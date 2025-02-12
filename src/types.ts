export interface StoryNode {
  id: string;
  text: string;
  choices?: string[];
  is_ending?: boolean;
  ending?: string;
}

export interface Story {
  title: string;
  description: string;
  nodes: Record<string, StoryNode>;
}