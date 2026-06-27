# ADRTA - E-Commerce Platform

A full-stack e-commerce web application built with Flask (Python) backend and vanilla JavaScript frontend.

## Features

- User authentication and authorization
- Product catalog with variants
- Shopping cart functionality
- Order management system
- Coupon/discount system
- Partner/affiliate program
- Admin dashboard
- Team portal
- Newsletter subscription
- OTP verification
- Razorpay payment integration
- Email notifications (Brevo/Sendinblue)
- SMS notifications (Fast2SMS)
- Rate limiting and security features

## Tech Stack

### Backend
- **Framework:** Flask 3.1.3
- **Database:** SQLAlchemy (SQLite/PostgreSQL)
- **Authentication:** Flask-Login
- **Security:** bcrypt, Flask-Limiter
- **Payments:** Razorpay
- **Email:** Brevo (Sendinblue) API
- **SMS:** Fast2SMS API

### Frontend
- **HTML5/CSS3/JavaScript (ES6+)**
- **Responsive Design**
- **No frameworks** - Vanilla JS for optimal performance

## Local Development

### Prerequisites
- Python 3.8+
- pip

### Installation

1. Clone the repository:
```bash
git clone https://github.com/scts599-source/adrta.git
cd adrta
```

2. Create a virtual environment:
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

5. Edit `.env` and fill in your configuration values:
```env
SECRET_KEY=your-secret-key-here
TEAM_PORTAL_USER=admin
TEAM_PORTAL_PASSWORD=your-secure-password
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
BREVO_API_KEY=your-brevo-api-key
FAST2SMS_API_KEY=your-fast2sms-api-key
```

6. Run the application:
```bash
python app.py
```

7. Open your browser and navigate to:
```
http://localhost:5000
```

## Production Deployment

### Deploy to Render.com

**⚠️ IMPORTANT: You MUST set all required environment variables before deploying, or the app will crash on startup.**

1. **Push to GitHub** (already done):
   - Repository: https://github.com/scts599-source/adrta

2. **Create a Web Service on Render:**
   - Go to https://render.com and sign up/login
   - Click "New" → "Web Service"
   - Connect your GitHub repository: `scts599-source/adrta`
   - Select the branch: `master`

3. **Configure Build & Start Settings:**
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn wsgi:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120`
   - **Environment:** Python 3
   - **Plan:** Free or paid (free tier available)

4. **Add Environment Variables (REQUIRED):**
   In the Render dashboard, before clicking "Create Web Service", expand the "Advanced" section and add these environment variables:
   
   **Critical (App will crash without these):**
   - `SECRET_KEY` - Generate a random 32+ character string (e.g., use: `openssl rand -hex 32`)
   - `TEAM_PORTAL_USER` - Choose a username for team portal (e.g., `admin`)
   - `TEAM_PORTAL_PASSWORD` - Choose a strong password for team portal
   - `RAZORPAY_KEY_ID` - Get from https://dashboard.razorpay.com/app/keys
   - `RAZORPAY_KEY_SECRET` - Get from https://dashboard.razorpay.com/app/keys
   - `BREVO_API_KEY` - Get from https://app.brevo.com/settings/keys/api
   - `FAST2SMS_API_KEY` - Get from https://www.fast2sms.com/
   
   **Optional but Recommended:**
   - `DATABASE_URL` - Leave empty, Render will provide PostgreSQL automatically
   - `CORS_ORIGINS` - Your domain (e.g., `https://your-app.onrender.com`)
   - `ENVIRONMENT` - Set to `production`
   - `FLASK_DEBUG` - Set to `0`
   - `REDIS_URL` - Leave empty (optional, for rate limiting)

5. **Deploy:**
   - Click "Create Web Service"
   - Wait 2-3 minutes for build and deployment
   - Your app will be available at `https://your-app-name.onrender.com`

**If deployment fails:**
- Check the "Logs" tab in Render dashboard for error messages
- Ensure all required environment variables are set
- Make sure `SECRET_KEY` is at least 32 characters long
- Verify Razorpay and Brevo API keys are correct

### Quick Environment Variables Setup

Copy these values and replace with your actual credentials:

```env
# Generate with: openssl rand -hex 32
SECRET_KEY=your-generated-secret-key-here

TEAM_PORTAL_USER=admin
TEAM_PORTAL_PASSWORD=YourSecurePassword123!

# Get from Razorpay Dashboard
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx

# Get from Brevo (Sendinblue)
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Get from Fast2SMS
FAST2SMS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional
ENVIRONMENT=production
FLASK_DEBUG=0
CORS_ORIGINS=https://your-app.onrender.com
```

### Deploy to Other Platforms

#### Heroku
```bash
# Install Heroku CLI, then:
heroku create your-app-name
heroku config:set SECRET_KEY=your-secret-key
heroku config:set RAZORPAY_KEY_ID=your-key
# ... set other env vars
git push heroku master
```

#### DigitalOcean App Platform
- Connect GitHub repository
- Configure environment variables
- Deploy

#### VPS (Ubuntu/CentOS)
```bash
# Install dependencies
sudo apt update
sudo apt install python3-pip python3-venv nginx

# Clone and setup
git clone https://github.com/scts599-source/adrta.git
cd adrta
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure environment variables in .env file

# Run with Gunicorn
pip install gunicorn
gunicorn -w 4 wsgi:app

# Or use systemd for production
# See deployment documentation for details
```

## Environment Variables

See `.env.example` for all available configuration options.

### Required for Production
- `SECRET_KEY` - Flask secret key for session encryption
- `TEAM_PORTAL_USER` - Team portal admin username
- `TEAM_PORTAL_PASSWORD` - Team portal admin password
- `RAZORPAY_KEY_ID` - Razorpay payment gateway key
- `RAZORPAY_KEY_SECRET` - Razorpay payment gateway secret
- `BREVO_API_KEY` - Email service API key
- `FAST2SMS_API_KEY` - SMS service API key

### Optional
- `DATABASE_URL` - PostgreSQL database URL (Render provides this)
- `CORS_ORIGINS` - Allowed CORS origins
- `REDIS_URL` - Redis URL for rate limiting
- `ENVIRONMENT` - Set to `production` for production
- `FLASK_DEBUG` - Enable debug mode (0 or 1)

## Project Structure

```
adrta/
├── app.py                 # Main Flask application
├── wsgi.py               # WSGI entry point
├── config/
│   └── settings.py       # Configuration settings
├── models/               # SQLAlchemy models
│   ├── user.py
│   ├── product.py
│   ├── order.py
│   ├── cart_item.py
│   └── ...
├── routes/               # API routes/blueprints
│   ├── auth.py
│   ├── product.py
│   ├── cart.py
│   ├── order.py
│   └── ...
├── utils/                # Utility functions
│   ├── security.py
│   ├── mailer.py
│   └── validation.py
├── static/               # Static files
│   ├── css/
│   ├── js/
│   └── images/
├── templates/
│   └── index.html        # Main HTML file
├── requirements.txt      # Python dependencies
├── .env.example          # Environment variables template
└── .gitignore           # Git ignore file
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/verify-otp` - OTP verification

### Products
- `GET /api/products` - Get all products
- `GET /api/products/<id>` - Get product details
- `POST /api/products` - Create product (admin)
- `PUT /api/products/<id>` - Update product (admin)
- `DELETE /api/products/<id>` - Delete product (admin)

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update` - Update cart item quantity
- `DELETE /api/cart/remove` - Remove item from cart

### Orders
- `GET /api/orders` - Get user's orders
- `POST /api/orders` - Create new order
- `GET /api/orders/<id>` - Get order details

### Coupons
- `POST /api/coupons/validate` - Validate coupon code
- `POST /api/coupons/apply` - Apply coupon to cart

### Partners
- `GET /api/partners` - Get partner information
- `POST /api/partners/register` - Register as partner

## Security Features

- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS protection
- Session security (HTTPOnly, Secure, SameSite)
- SQL injection prevention (SQLAlchemy ORM)
- XSS protection
- CSRF protection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is private and proprietary.

## Support

For issues or questions, please contact the development team.

## Live Demo

Once deployed, your application will be available at your deployment URL.

**GitHub Repository:** https://github.com/scts599-source/adrta