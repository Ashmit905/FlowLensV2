# Create social assets (Reel / GIF)

This document explains how to create a short demo video or GIF from the running frontend.

Prerequisites:
- Node.js and npm installed
- `ffmpeg` installed (Homebrew: `brew install ffmpeg`)
- Frontend dev server running: `cd frontend && npm run dev` (default port shown in terminal)

1) Install Puppeteer (in the frontend folder):

```bash
cd frontend
npm install
```

2) Record demo frames (script uses Puppeteer):

```bash
cd frontend
npm run record:demo
```

Frames will be saved to `frontend/demo_frames/` as PNG files.

3) Assemble frames into a 15s mp4 (example):

```bash
# make a 15 fps mp4 (adjust fps/scale as desired)
ffmpeg -r 15 -pattern_type glob -i "frontend/demo_frames/*.png" -vf "scale=1080:1920,format=yuv420p" -c:v libx264 -pix_fmt yuv420p -crf 23 -preset veryfast reel.mp4
```

4) Create a GIF (optional):

```bash
ffmpeg -i reel.mp4 -vf "fps=15,scale=720:-1:flags=lanczos" -loop 0 demo.gif
```

5) Tips for Instagram
- Reels prefer vertical 1080x1920 MP4, H.264. Keep under 30s.
- Add captions and music in Instagram; consider uploading from your phone.
