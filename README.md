# nearby-cabs
Nearby cab search with RethinkDB geo-queries and changefeeds. Think Uber.

This is meant to be a demo of some capabilities of RethinkDB:

- Live changefeeds
- Geo-spatial queries

# Running the app

1. Clone and `npm install`.
2. Install RethinkDB with `brew install rethinkdb`.
3. Run the following commands in the project folder in separate terminal windows.
  - `rethinkdb`
  - `npm start`
  - `node db/moveMarkers.js`
4. Open `http://localhost:3000` in Chrome.

# Tools

- RethinkDB
- socket.io
- React.js
