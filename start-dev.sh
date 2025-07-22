#!/bin/bash

# Young Ellens Chatbot Development Startup Script

echo "🎤 Starting Young Ellens Chatbot Development Environment..."
echo ""

# Function to kill existing processes
cleanup() {
    echo "🧹 Cleaning up existing processes..."
    pkill -f "node.*3001" 2>/dev/null || true
    pkill -f "react-scripts" 2>/dev/null || true
    sleep 2
}

# Function to start backend
start_backend() {
    echo "🚀 Starting backend server..."
    cd backend
    npm run dev &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to start
    echo "⏳ Waiting for backend to initialize..."
    sleep 5
    
    # Test if backend is running
    if curl -s http://localhost:3001/api/health >/dev/null 2>&1; then
        echo "✅ Backend server running on http://localhost:3001"
    else
        echo "⚠️ Backend may still be starting up (database fallback mode)"
    fi
}

# Function to start frontend
start_frontend() {
    echo "🌐 Starting frontend server..."
    cd frontend
    npm start &
    FRONTEND_PID=$!
    cd ..
    
    echo "⏳ Waiting for frontend to initialize..."
    sleep 3
    echo "✅ Frontend server should be running on http://localhost:3000"
}

# Trap to cleanup on script exit
trap cleanup EXIT

# Main execution
cleanup
echo "📦 Installing dependencies if needed..."
(cd backend && npm install --silent) &
(cd frontend && npm install --silent) &
wait

echo ""
start_backend
sleep 2
start_frontend

echo ""
echo "🎉 Young Ellens Chatbot is ready!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:3001"
echo ""
echo "💬 Features available:"
echo "   - Real-time chat with Young Ellens personality"
echo "   - Dutch street language and slang from Amsterdam (020)"
echo "   - Drug denial responses: 'alleen me wietje en me henny'"
echo "   - Signature ad-libs: B-Negar, OWO, B, B, Pa"
echo "   - Mood swings and chaotic behavior"
echo "   - Random interruptions"
echo ""
echo "🔥 Ready to chat with Mr. Cocaine from Amsterdam (but he'll deny it)!"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID