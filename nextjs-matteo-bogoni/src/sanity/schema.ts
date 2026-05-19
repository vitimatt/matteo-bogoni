import {defineType, defineField} from 'sanity'

export const track = defineType({
  name: 'track',
  title: 'Track',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
    defineField({
      name: 'audioFile',
      title: 'Audio File',
      type: 'file',
      options: {
        accept: 'audio/*',
      },
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'description',
    },
  },
})

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'media',
      title: 'Media',
      type: 'object',
      description: 'Upload a photo or a video for this project.',
      fields: [
        defineField({
          name: 'mediaType',
          title: 'Media type',
          type: 'string',
          options: {
            list: [
              {title: 'Photo', value: 'image'},
              {title: 'Video', value: 'video'},
            ],
            layout: 'radio',
          },
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'image',
          title: 'Photo',
          type: 'image',
          options: {hotspot: true},
          hidden: ({parent}) => parent?.mediaType !== 'image',
        }),
        defineField({
          name: 'video',
          title: 'Video',
          type: 'file',
          options: {
            accept: 'video/*',
          },
          hidden: ({parent}) => parent?.mediaType !== 'video',
        }),
      ],
      validation: (Rule) =>
        Rule.custom((value) => {
          if (!value?.mediaType) {
            return 'Select photo or video'
          }
          if (value.mediaType === 'image' && !value.image) {
            return 'Photo is required'
          }
          if (value.mediaType === 'video' && !value.video) {
            return 'Video is required'
          }
          return true
        }),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      mediaType: 'media.mediaType',
      image: 'media.image',
    },
    prepare({title, mediaType, image}) {
      return {
        title: title || 'Untitled project',
        subtitle: mediaType === 'video' ? 'Video' : mediaType === 'image' ? 'Photo' : 'No media',
        media: image,
      }
    },
  },
})

export const schemaTypes = [track, project]
