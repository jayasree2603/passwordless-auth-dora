# Dora's Adventure Auth - Passwordless Authentication

## 🎯 What Is This?

A fun, gamified authentication system where instead of typing passwords, you:
1. **Select 3 items** from Dora's Backpack (visual pattern)
2. **Type a secret chant** (memorable phrase)

Think of it as a combination lock + passphrase, wrapped in a Dora the Explorer game!

## 🔐 The Authentication Method

### How It Works

**Registration:**
- Pick 3 items from 8 options (Star, Compass, Rope, etc.)
- Create a memorable "secret chant" (like "Swiper no swiping!")
- Order matters: Star → Compass → Rope ≠ Rope → Star → Compass

**Login (Gamified as "Stopping Swiper"):**
1. Enter your explorer name
2. Swiper appears! 🦊
3. Quick! Select your 3 items from Backpack
4. Shout your secret chant (you have 15 seconds!)
5. Success = You stopped Swiper! 🎉

### Why This Method?

✅ **More memorable** than random passwords  
✅ **Fun & engaging** - reduces authentication fatigue  
✅ **Educational** - demonstrates alternative authentication  
✅ **No password reuse** - each user creates unique combinations  

⚠️ **Note:** This is a demo/educational project. For production, you'd need server-side validation, encryption, and more security measures.

## 🚀 Quick Start

### 1. Run Locally

```bash
# Clone the repo
git clone https://github.com/jayasree2603/passwordless-auth-dora.git
cd passwordless-auth-dora

# Open in browser (choose one):

# Option A: Just double-click index.html

# Option B: Python server
python -m http.server 8000
# Visit: http://localhost:8000

# Option C: Node.js server
npx http-server -p 8000
# Visit: http://localhost:8000
```

### 2. Deploy to GitHub Pages

1. Push your code to GitHub
2. Go to **Settings** → **Pages**
3. Select **Source**: Branch `main`, Folder `/ (root)`
4. Your site will be live at: `https://YOUR_USERNAME.github.io/passwordless-auth-dora/`

**Alternative:** Deploy to [Netlify](https://netlify.com) or [Vercel](https://vercel.com) by dragging your folder.

## 📁 Project Structure

```
passwordless-auth-dora/
├── index.html       # Main page structure
├── styles.css       # All styling & animations
├── app.js           # Authentication logic & game flow
├── characters.js    # SVG graphics for characters & items
└── README.md        # This file
```

**Total Size:** ~88KB (no dependencies!)

## 🎮 Features

- ✨ Sparkle mouse trail effect
- 🎨 Colorful, animated UI
- 🔊 Sound effects (Web Audio API)
- ⏱️ 15-second timer challenge
- 🎉 Confetti celebration on success
- � Mobile responsive
- � Account lockout after 5 failed attempts

## 🛠️ Tech Stack

- **Pure HTML/CSS/JavaScript** (no frameworks!)
- **Web Audio API** for sounds
- **Canvas API** for sparkle effects
- **LocalStorage** for data (client-side only)
- **SVG** for graphics

## 📖 Documentation

### Your Unique Authentication Method

**What:** Visual pattern (3 items) + Secret chant (passphrase)

**How It Works:**
```javascript
// Stored in localStorage:
{
  username: "explorer123",
  items: ["star", "compass", "rope"],  // Order matters!
  chant: "Swiper, no swiping!",        // Case-insensitive
  email: "explorer@adventure.com"
}

// Login validation:
✓ Items must match exactly (same order)
✓ Chant must match (case-insensitive)
✓ Both must be correct to authenticate
```

**Why I Chose This:**
1. **Memorability:** Visual patterns are easier to remember than "P@ssw0rd123"
2. **Engagement:** Gamification makes authentication fun, not a chore
3. **Security:** Combines two factors (visual + verbal)
4. **Innovation:** Demonstrates alternative to traditional passwords

**Security Notes:**
- 336 possible item combinations (8 choose 3, ordered)
- Chant adds significant entropy (depends on length/complexity)
- 5-attempt lockout prevents brute force
- Client-side only (demo purposes - production needs server validation)

### Setup Instructions

**Local Development:**
1. Clone repo
2. Open `index.html` in browser (or use local server)
3. Register an account
4. Try logging in!

**Demo Credentials:**
Since there's no backend, you need to register yourself. Try:
- Username: `demo_user`
- Items: Star → Magnifier → Rope
- Chant: `We did it!`


