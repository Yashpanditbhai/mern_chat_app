# Flash Chat - Real-Time Messaging App

A full-featured real-time chat application built with the MERN stack, Socket.io, and WebRTC.

**Live Demo:** [https://mern-chat-app-7zvh.onrender.com](https://mern-chat-app-7zvh.onrender.com)

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, DaisyUI, Zustand
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Real-time:** Socket.io, WebRTC
- **AI:** Google Gemini 2.0 Flash
- **Auth:** JWT (JSON Web Tokens)

## Features

### Messaging
- Real-time text messaging with Socket.io
- File sharing — images, videos, audio, documents (up to 10MB)
- Voice messages with in-browser recording
- GIF search & send (powered by Giphy)
- Emoji picker
- Message reactions (6 quick emojis)
- Reply/quote messages
- Forward messages to multiple users
- Delete messages (for me / for everyone)
- Pin & star important messages
- Message search with keyword highlighting
- Link previews with Open Graph metadata
- Disappearing messages (auto-delete with TTL)
- Message status tracking — sent, delivered, seen (tick indicators)
- Typing indicators

### Group Chat
- Create groups with selected users
- Group admin controls — promote/demote admins
- Admin-only messaging mode
- Polls — create polls, vote, see results in real-time
- Group info panel with member list and online status

### Calls
- 1-to-1 audio & video calling (WebRTC peer-to-peer)
- Screen sharing during video calls
- Call controls — mute, camera toggle, end call
- Incoming call modal with accept/reject
- Call duration timer

### Stories
- Post 24-hour disappearing stories (text with color backgrounds or image)
- View stories with progress bar and auto-advance
- View tracking (seen/unseen indicators)

### Profile & Social
- Custom profile photo upload
- Status text (up to 150 characters)
- Last seen timestamps
- Online/offline indicators
- Block & mute users

### AI Assistant
- Built-in AI chatbot powered by Google Gemini 2.0 Flash
- Conversation memory (contextual responses per user)
- Knows all app features and can help with questions
- Fallback to pattern-matching if API key not configured

### Media & Files
- Camera capture — take photos directly from the app
- Image editor — draw, add text, color picker, brush sizes
- Drag & drop file upload with visual overlay
- Shared media panel — browse all images, videos, audio, and documents in a conversation
- Enhanced image preview — fullscreen with zoom, navigation, download

### Productivity
- Chat export — download as text (.txt) or print as PDF
- Scheduled messages — set a future date/time, auto-sends
- Starred messages panel — quick access to bookmarked messages

### Customization
- Dark / Light theme toggle
- Chat wallpapers (gradients, patterns, solid colors)
- Multi-language support — English, Hindi, Spanish

### Security
- JWT authentication & authorization
- Password hashing with bcrypt (12 salt rounds)
- Rate limiting on auth endpoints
- CORS validation
- HTTP-only cookies
- Encryption indicator in chat header

### Notifications
- Browser push notifications (Notification API) when tab is not focused
- In-app notification sounds (respects mute settings)
- Unread message count badges

## Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5001
MONGO_DB_URI=mongodb://localhost:27017/chat-app-db
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
GEMINI_API_KEY=your_google_gemini_api_key
```

- Get a free Gemini API key at [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)

### Install & Run

```bash
# Install dependencies
npm install
npm install --prefix frontend

# Run in development (backend + frontend)
npm run server          # Backend with nodemon (port 5001)
cd frontend && npm run dev  # Frontend with Vite (port 3000)

# Build for production
npm run build

# Start production server
npm start
```

### Deployment (Render)

1. Push code to GitHub
2. Create a new Web Service on [Render](https://render.com)
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Add environment variables: `MONGO_DB_URI`, `JWT_SECRET`, `NODE_ENV=production`, `CLIENT_URL`, `GEMINI_API_KEY`

## Project Structure

```
flash-chat/
├── backend/
│   ├── controllers/     # Route handlers
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routes
│   ├── middleware/       # Auth, upload, error handling
│   ├── socket/          # Socket.io setup & events
│   ├── db/              # MongoDB connection
│   ├── utils/           # Helpers (JWT, avatars)
│   └── uploads/         # Uploaded files
├── frontend/
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── context/     # React contexts (Auth, Socket, Theme, Language, Call)
│   │   ├── hooks/       # Custom hooks
│   │   ├── pages/       # Page components
│   │   ├── zustand/     # State management
│   │   ├── i18n/        # Translations
│   │   └── utils/       # Utilities
│   └── public/
├── .env
├── package.json
└── README.md
```

## Author

**Yash Dubey** — [GitHub](https://github.com/Yashpanditbhai)

## License

MIT License — see [LICENSE](LICENSE) for details.
