# SpaceSkribble – NASA Sky Challenge

A multiplayer astronomy drawing and guessing game. Players take turns sketching planets, galaxies, nebulae, constellations and meteor showers. Everyone else guesses in the chat, and a NASA information card appears after each round. The repo also includes `/showcase.html`, an iOS app showcase with two animated device frames.

**Tech:** plain HTML, CSS and JavaScript, the Canvas API, and Node.js + Socket.IO for real multiplayer.

## Install & run
```bash
npm install
npm start          # http://localhost:3000
```
- **With the Node server:** online multiplayer across devices. Socket.IO syncs rooms, drawing, chat, the timer and scores.
- **Static hosting (Netlify):** the game runs in local mode. You can play against Space Bots, or with friends in other tabs of the same browser.

## Playing
- **Create a room:** enter a name, pick an avatar, then click **Create Room**. Share the 5-letter code or the invite link.
- **Join a room:** enter the code and click **Join Room**.
- **How a game works:** in the lobby, players mark themselves ready and the host clicks **Start Game**. Each turn, the drawer picks one of 3 objects and has 60 s to draw it.
  - Clues unlock as time passes: the category, a physics fact (gravity compared with Earth's 9.8 m/s²), a blurred real image, and then letters of the answer.
  - A correct guess earns +50, plus up to +50 for guessing fast. The drawer gets +20 for each correct guesser.
  - The game ends with a leaderboard, a winner animation and a Play Again button.
- **Extra sections on the home page:** a Gravity Lab where you drop a ball on 8 worlds, and a cosmic distance ladder that shows distances in km, light-travel time or road-trip time.

## Add astronomy objects
Copy an entry in `public/data/spaceObjects.js` and change these fields:
- `id`, `name`, `aliases`, `category`, `difficulty`
- `description`, `interestingFacts`, `observationGuide`, `stats`, `clues`
- `images`, with an image credit for each one
- `nasaReference`, `sketch`

Put image files in `public/assets/img/`.

## Live NASA imagery
The home page includes a live photo explorer powered by the official NASA Image and Video Library search API (`images-api.nasa.gov`). Visitors can search NASA images, use the topic shortcuts, and page through results. Opening an object card or finishing a game round also looks for a matching NASA image; the result is cached for that session.

This image search endpoint is public and supports browser requests, so no NASA API key, backend, or Netlify Function is required. Each live result links to its NASA record and shows the creator/center and date when NASA provides them. The explorer filters out records explicitly identified as illustrations, artist concepts, renderings, simulations, diagrams, or graphics. NASA metadata is not perfectly consistent, so an item without a clear non-photographic label may still appear. If NASA or the network is unavailable, the game and its saved reference images continue to work.

## Deploy to Netlify
The site is static and `netlify.toml` sets the publish directory to `public`. Import the GitHub repository into Netlify, leave the build command empty, and use `public` as the publish directory. No environment variables or API credentials are needed for the NASA image explorer.

## Roadmap
- Host Socket.IO on a persistent Node host so the deployed site supports multiplayer across devices.
