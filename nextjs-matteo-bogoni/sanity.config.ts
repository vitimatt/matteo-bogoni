import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'

import {schemaTypes} from './src/sanity/schema'

export default defineConfig({
  name: 'matteo-bogoni',
  title: 'Matteo Bogoni',
  projectId: 'ker8zst5',
  dataset: 'production',
  basePath: '/studio',
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.documentTypeListItem('track').title('Tracks'),
            S.documentTypeListItem('project').title('Projects'),
          ]),
    }),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
  },
})


