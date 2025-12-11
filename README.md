# Matteo Bogoni - Audio Reactive Site with Sanity CMS

A Next.js application featuring audio-reactive typography that responds to audio frequencies, integrated with Sanity CMS for content management.

## Project Structure

```
matteo-bogoni/
├── nextjs-matteo-bogoni/          # Main Next.js application
│   ├── src/
│   │   ├── app/                   # Next.js app directory
│   │   │   ├── page.tsx          # Homepage with track list
│   │   │   ├── layout.tsx        # Root layout
│   │   │   └── globals.css       # Global styles
│   │   ├── components/
│   │   │   └── AudioReactive.tsx # p5.js audio reactive component
│   │   └── sanity/
│   │       └── client.ts         # Sanity client configuration
│   ├── public/
│   │   ├── audio/               # Audio files (1.mp3, 2.mp3, 3.mp3)
│   │   └── fonts/               # Custom fonts
│   ├── package.json             # Dependencies
│   ├── tailwind.config.ts       # Tailwind CSS configuration
│   └── tsconfig.json           # TypeScript configuration
├── studio/                       # Sanity Studio
│   ├── schemas/
│   │   └── index.js            # Track schema definition
│   ├── sanity.config.js        # Sanity configuration
│   └── package.json            # Studio dependencies
└── README.md                   # This file
```

## Setup Instructions

### 1. Install Next.js Dependencies

```bash
cd nextjs-matteo-bogoni
npm install
```

### 2. Start the Next.js Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 3. Sanity Studio (Optional)

To manage content via Sanity Studio:

```bash
cd studio
npm install
npm run dev
```

The studio will be available at `http://localhost:3333`

## Features

### Content Management
- **Server-Side Rendering**: Tracks are fetched from Sanity CMS on the server
- **TypeScript**: Full type safety with Sanity types
- **Real-time Updates**: Content updates automatically when changed in Sanity

### Audio-Reactive Typography
- **p5.js Integration**: Characters react to audio frequencies using FFT analysis
- **Progressive Displacement**: Effect intensity varies based on cursor position
- **Interactive Audio**: Click to start audio, tracks respond to music
- **Custom Fonts**: Uses ABCReproMonoVariable-Trial.ttf

### Visual Design
- **Tailwind CSS**: Modern, responsive styling
- **Clean Layout**: Organized sections for tracks, visualization, and content
- **Responsive Design**: Works on all screen sizes

## Technical Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **CMS**: Sanity with GROQ queries
- **Audio**: p5.js with p5.sound
- **Deployment**: Ready for Vercel deployment

## Usage

1. **Content Management**: Use Sanity Studio to add/edit tracks
2. **Audio Playback**: Click anywhere to start audio
3. **Interactive Effects**: Move cursor to see progressive displacement effects
4. **Track Selection**: Click track titles to switch audio (future feature)

## Development

### Adding New Tracks
1. Go to Sanity Studio (`http://localhost:3333`)
2. Create new track documents with title, description, and audio file
3. Tracks will automatically appear on the homepage

### Customizing Audio Effects
Edit `src/components/AudioReactive.tsx` to modify:
- Effect multiplier (`effectMultiplier`)
- Progressive radius (`progressiveRadius`)
- Text size (`textSize`)
- Color schemes

## Deployment

The Next.js application is ready for deployment on Vercel:

```bash
cd nextjs-matteo-bogoni
npm run build
```

## File Locations

- **Main App**: `/nextjs-matteo-bogoni/`
- **Sanity Studio**: `/studio/`
- **Audio Files**: `/nextjs-matteo-bogoni/public/audio/`
- **Fonts**: `/nextjs-matteo-bogoni/public/fonts/`