import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // The Firebase file is about 550 kB (Auth + Firestore) and cannot be made smaller
    // from our side. The limit is raised just above it so new warnings still stand out.
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        // Keep Firebase and React in their own files so browsers can cache them
        // separately from the app code, which changes more often.
        codeSplitting: {
          groups: [
            { name: 'firebase', test: /node_modules[\\/](firebase|@firebase)[\\/]/ },
            { name: 'react', test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/ },
          ],
        },
      },
    },
  },
})
