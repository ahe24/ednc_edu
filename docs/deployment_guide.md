# 🚀 ED&C Education System - Deployment Guide

This guide explains how to deploy the ED&C Education System to another Rocky Linux 9 server with a different IP address.

## 📋 Prerequisites

### System Requirements
- Rocky Linux 9 (or compatible RHEL-based distribution)
- Minimum 2GB RAM
- 10GB available disk space
- Network access for package installation

### Required Software
- Node.js (LTS version)
- npm
- Git
- SQLite3
- PM2 (for production deployment)

## 🔧 Step 1: Install Required Software

```bash
# Update system
sudo dnf update -y

# Install Node.js and npm (using NodeSource repository for latest LTS)
curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
sudo dnf install -y nodejs

# Install Git (if not already installed)
sudo dnf install -y git

# Install SQLite3 (for database)
sudo dnf install -y sqlite

# Install PM2 globally for production deployment
sudo npm install -g pm2

# Install serve for frontend production serving
sudo npm install -g serve

# Verify installations
node --version
npm --version
git --version
sqlite3 --version
pm2 --version
```

## 📁 Step 2: Transfer Code to New Server

### Option A: Using Git (Recommended)
```bash
# On new server
cd /home/[username]
git clone [your-repository-url]
cd ednc_edu
```

### Option B: Using SCP from Current Server
```bash
# From current server, copy to new server
scp -r /home/csjo/a2_cursor/ednc_edu username@NEW_IP_ADDRESS:/home/username/
```

### Option C: Using rsync
```bash
# From current server
rsync -avz --exclude node_modules --exclude dist --exclude build \
  /home/csjo/a2_cursor/ednc_edu/ username@NEW_IP_ADDRESS:/home/username/ednc_edu/
```

## ⚙️ Step 3: Configure Environment Variables

### Backend Configuration
Create the backend environment file:

```bash
# On new server
cd /home/[username]/ednc_edu/backend
cat > .env << 'EOF'
PORT=5000
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret-change-this-now
CORS_ORIGIN=http://NEW_SERVER_IP:3000
DB_PATH=./database/ednc_edu.db
EOF
```

### Frontend Configuration
Create the frontend environment file:

```bash
# Create frontend/.env file
cd /home/[username]/ednc_edu/frontend
cat > .env << 'EOF'
REACT_APP_API_URL=http://NEW_SERVER_IP:5000/api
EOF
```

**⚠️ Important:** Replace `NEW_SERVER_IP` with your actual server IP address and generate a secure JWT secret.

## 📦 Step 4: Install Dependencies and Build

### Backend Setup
```bash
cd /home/[username]/ednc_edu/backend

# Install dependencies
npm install

# Build TypeScript
npm run build

# Create database directory if it doesn't exist
mkdir -p database
```

### Frontend Setup
```bash
cd /home/[username]/ednc_edu/frontend

# Install dependencies
npm install

# Build for production
npm run build
```

## 💾 Step 5: Database Setup

### Option A: Copy Existing Database
```bash
# Copy database from old server
scp username@OLD_SERVER_IP:/home/csjo/a2_cursor/ednc_edu/backend/database/ednc_edu.db \
  /home/[username]/ednc_edu/backend/database/
```

### Option B: Start with Fresh Database
The database will be created automatically when the server starts for the first time. SQLite will initialize the required tables based on the schema defined in the application.

## 🔥 Step 6: Configure Firewall

```bash
# Open required ports
sudo firewall-cmd --zone=public --add-port=3000/tcp --permanent  # Frontend
sudo firewall-cmd --zone=public --add-port=5000/tcp --permanent  # Backend API
sudo firewall-cmd --reload

# Verify ports are open
sudo firewall-cmd --list-ports
```

## 🚀 Step 7: Production Deployment with PM2

### Create PM2 Ecosystem Configuration
```bash
cd /home/[username]/ednc_edu
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'ednc-backend',
      script: './backend/dist/server.js',
      cwd: './backend',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log'
    },
    {
      name: 'ednc-frontend',
      script: 'serve',
      args: '-s build -l 3000',
      cwd: './frontend',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log'
    }
  ]
};
EOF

# Create logs directory
mkdir -p logs

# Start applications with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions provided by the pm2 startup command
```

## 🧪 Step 8: Testing and Verification

### Check Service Status
```bash
# Check PM2 status
pm2 status

# Check process details
pm2 show ednc-backend
pm2 show ednc-frontend
```

### Test Backend API
```bash
# Test health endpoint
curl http://NEW_SERVER_IP:5000/health

# Expected response:
# {"status":"OK","message":"ED&C 교육 수강 정보 시스템 서버가 정상 작동 중입니다"}

# Test a student endpoint (should return 404 for non-existent email)
curl http://NEW_SERVER_IP:5000/api/students/courses/test@example.com
```

### Test Frontend
```bash
# Test frontend is serving
curl http://NEW_SERVER_IP:3000

# You should see HTML content of the React application
```

### Access via Browser
1. **Frontend Application:** `http://NEW_SERVER_IP:3000`
2. **Backend API:** `http://NEW_SERVER_IP:5000/health`

## 📊 Step 9: Monitoring and Logs

### PM2 Commands
```bash
# View real-time logs
pm2 logs

# View logs for specific app
pm2 logs ednc-backend
pm2 logs ednc-frontend

# Monitor system resources
pm2 monit

# Restart applications
pm2 restart ednc-backend
pm2 restart ednc-frontend

# Stop applications
pm2 stop all

# Delete applications from PM2
pm2 delete all
```

### Log Files Location
- Backend logs: `./logs/backend-*.log`
- Frontend logs: `./logs/frontend-*.log`

## 🤖 Step 10: Automated Deployment Script

Create a deployment script for easy setup:

```bash
cat > deploy.sh << 'EOF'
#!/bin/bash

# Variables - CHANGE THESE!
NEW_SERVER_IP="YOUR_NEW_SERVER_IP"
USERNAME="your_username"

echo "🚀 Deploying ED&C Education System..."

# Check if required tools are installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Installing PM2..."
    sudo npm install -g pm2
fi

# Install dependencies and build
echo "📦 Installing dependencies..."
cd backend && npm install && npm run build && cd ..
cd frontend && npm install && npm run build && cd ..

# Create environment files
echo "⚙️ Setting up configuration..."
cat > backend/.env << EOL
PORT=5000
NODE_ENV=production
JWT_SECRET=$(openssl rand -base64 32)
CORS_ORIGIN=http://${NEW_SERVER_IP}:3000
DB_PATH=./database/ednc_edu.db
EOL

cat > frontend/.env << EOL
REACT_APP_API_URL=http://${NEW_SERVER_IP}:5000/api
EOL

# Create logs directory
mkdir -p logs

# Start services
echo "🔄 Starting services..."
pm2 start ecosystem.config.js
pm2 save

echo "✅ Deployment complete!"
echo "🌐 Frontend: http://${NEW_SERVER_IP}:3000"
echo "🔧 Backend API: http://${NEW_SERVER_IP}:5000"
echo "📊 PM2 Status: pm2 status"
echo "📝 Logs: pm2 logs"
EOF

chmod +x deploy.sh
```

### Using the Deployment Script
```bash
# Edit the script with your server IP
nano deploy.sh
# Change NEW_SERVER_IP to your actual IP address

# Run the deployment
./deploy.sh
```

## 🔒 Security Considerations

### 1. JWT Secret
Always generate a secure JWT secret:
```bash
# Generate a secure random secret
openssl rand -base64 32
```

### 2. Environment Variables
- Never commit `.env` files to version control
- Use strong, unique secrets for production
- Limit CORS origins to specific domains in production

### 3. Database Security
- Set appropriate file permissions on the database file
- Consider regular database backups
- Implement database encryption for sensitive data

### 4. Network Security
- Use HTTPS in production (consider setting up Nginx reverse proxy)
- Implement rate limiting
- Use a firewall to restrict access to necessary ports only

## 🔄 Maintenance and Updates

### Updating the Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
cd backend && npm run build && cd ..
cd frontend && npm run build && cd ..

# Restart PM2 processes
pm2 restart all
```

### Database Backup
```bash
# Create backup
cp backend/database/ednc_edu.db backend/database/ednc_edu_backup_$(date +%Y%m%d_%H%M%S).db

# Automated daily backup (add to crontab)
0 2 * * * cp /home/[username]/ednc_edu/backend/database/ednc_edu.db /home/[username]/backups/ednc_edu_$(date +\%Y\%m\%d).db
```

## 🆘 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port 5000
sudo lsof -i :5000

# Kill process if needed
sudo kill -9 [PID]
```

#### Permission Issues
```bash
# Fix file permissions
chmod +x deploy.sh
chown -R [username]:[username] /home/[username]/ednc_edu
```

#### PM2 Not Starting on Boot
```bash
# Reconfigure PM2 startup
pm2 unstartup
pm2 startup
pm2 save
```

#### Database Connection Issues
- Check database file permissions
- Verify database path in environment variables
- Check SQLite installation

### Checking System Resources
```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top
```

## 📞 Support

For issues related to:
- **Application bugs:** Check application logs with `pm2 logs`
- **System issues:** Check system logs with `journalctl -f`
- **Network issues:** Verify firewall and network configuration

---

**Note:** Remember to replace all placeholder values (NEW_SERVER_IP, username, etc.) with your actual values before deployment. 