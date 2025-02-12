# Interactive Story Explorer

An interactive story exploration application built with React, TypeScript, and Vite. This application allows users to navigate through branching narrative stories with multiple paths and endings.

## Features

- Multiple interactive stories with branching narratives
- Dynamic story progression based on user choices
- Multiple unique endings for each story
- Modern, responsive UI built with React and TailwindCSS
- Emotion detection capabilities using face-api.js

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn package manager

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

### Running the Application

To start the development server:
```bash
npm run dev
```

To build for production:
```bash
npm run build
```

To preview the production build:
```bash
npm run preview
```

## Adding New Stories

Stories are stored as JSON files in the `src/stories` directory. To add a new story:

1. Create a new JSON file in the `src/stories` directory (e.g., `mystory.json`)
2. Follow the story structure format below
3. Import and add your story to the stories collection in `src/stories.ts`

### Story JSON Structure

```json
{
  "title": "Your Story Title",
  "description": "A brief description of your story",
  "nodes": {
    "start": {
      "id": "start",
      "text": "The opening text of your story...",
      "choices": ["1", "2", "3", "4"]
    },
    "1": {
      "id": "1",
      "text": "Text for choice 1",
      "choices": ["1A", "1B", "1C", "1D"]
    },
    "1A": {
      "id": "1A",
      "text": "Ending text",
      "is_ending": true,
      "ending": "Description of the ending"
    }
    // ... additional nodes
  }
}
```

### Story Structure Guidelines

1. Each story must have a `start` node as the entry point
2. Each node should have:
   - `id`: Unique identifier for the node
   - `text`: The story text for this node
   - `choices`: Array of node IDs that can be chosen next (optional for ending nodes)
   - `is_ending`: Boolean indicating if this is an ending node (optional)
   - `ending`: Description of the ending (required if is_ending is true)

3. Maintain a logical flow:
   - Non-ending nodes should have valid choices that lead to other nodes
   - Ending nodes should have `is_ending: true` and an `ending` description
   - All node IDs referenced in choices must exist in the nodes object

## Development

- The application is built with Vite for fast development and optimal production builds
- TypeScript is used for type safety
- TailwindCSS is used for styling
- ESLint is configured for code quality

## Deployment

### GitHub Pages Deployment

To deploy this application to GitHub Pages:

1. First, add the following to your `vite.config.ts`:
```ts
export default defineConfig({
  base: '/your-repo-name/',  // Replace with your repository name
  // ... rest of your config
})
```

2. Install the gh-pages package:
```bash
npm install gh-pages --save-dev
```

3. Add these scripts to your `package.json`:
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

4. Deploy your application:
```bash
npm run deploy
```

5. On GitHub:
   - Go to your repository settings
   - Navigate to "Pages"
   - Select "gh-pages" branch as the source
   - Save the changes

Your application will be available at: `https://your-username.github.io/your-repo-name/`

### Alternative Hosting Options

You can also deploy this application on:

1. **Vercel**:
   - Import your GitHub repository
   - Vercel will automatically detect Vite configuration
   - No additional setup required

2. **Netlify**:
   - Connect your GitHub repository
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Firebase Hosting**:
   - Install Firebase CLI: `npm install -g firebase-tools`
   - Initialize: `firebase init hosting`
   - Deploy: `firebase deploy`

All these platforms offer free tiers suitable for personal projects.