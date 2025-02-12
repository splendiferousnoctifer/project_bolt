import type { Story } from './types';

// Use Vite's glob import feature to dynamically load all JSON files
const storyModules = import.meta.glob<Story>('./stories/*.json', { eager: true });

// Convert the modules object into our stories record
export const stories: Record<string, Story> = Object.entries(storyModules).reduce((acc, [path, story]) => {
  // Extract the story ID from the file path (e.g., './stories/clockmaker.json' -> 'clockmaker')
  const storyId = path.split('/').pop()?.replace('.json', '') || '';
  return {
    ...acc,
    [storyId]: story
  };
}, {});