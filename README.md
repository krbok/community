# Community Chat Application

A real-time chat application built with the MERN stack (MongoDB, Express.js, React.js, Node.js).

## Features
- Real-time messaging
- User authentication
- Contact management
- Message history

## Setup Instructions

### Server Setup
1. Navigate to server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create .env file with:
```
PORT=8000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

### Client Setup
1. Navigate to client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create .env file with:
```
REACT_APP_API_URL=http://localhost:8000
```

## Running the Application

1. Start the server:
```bash
cd server
npm start
```

2. Start the client:
```bash
cd client
npm start
```

The application will be available at `http://localhost:3000`