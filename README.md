# Transfer Rate App

A comprehensive web application for tracking call transfer rates with user management and role-based access control.

## Features

### User Management

- **Two-role system**: Administrator and User
- **Administrator capabilities**:
  - Create, edit, and deactivate user accounts
  - Access all log lists and call data
  - Reset user passwords
  - Full administrative dashboard
- **User capabilities**:
  - Access only their own log lists
  - Create and manage personal call logs
  - View transfer rate statistics

### Authentication & Security

- JWT-based authentication with cookie support
- Secure password hashing using bcrypt
- Role-based access control
- Session management

### Call Tracking

- Multiple call types (AOD, APPOINTMENT, T2, HPA, etc.)
- Transfer rate calculation
- Real-time call logging
- Call history and analytics

## Setup Instructions

### Prerequisites

- Python 3.12+
- PostgreSQL database
- Virtual environment support

### Installation

1. **Clone and setup environment**:

   ```bash
   cd transfer_rate_app
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:

   ```bash
   pip install -r requirements.txt
   ```

3. **Environment setup**:

   ```bash
   # Copy the example environment file
   cp .env.example .env

   # Edit .env with your PostgreSQL credentials
   nano .env  # or your preferred editor
   ```

   Make sure to update the DATABASE_URL in `.env`:

   ```env
   DATABASE_URL=postgresql://your_username:your_password@localhost:5432/transfer_db
   ```

4. **Database setup**:

   ```bash
   # Make sure PostgreSQL is running
   # On macOS: brew services start postgresql
   # On Linux: sudo systemctl start postgresql

   # Run the database setup script
   python setup_db.py

   # This script will:
   # - Check if PostgreSQL is running
   # - Create the transfer_db database if it doesn't exist
   # - Test the connection
   ```

5. **Start the application**:
   ```bash
   chmod +x run.sh
   ./run.sh
   ```
   Or manually:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Initial Setup

1. **First-time access**:

   - Navigate to `http://localhost:8000`
   - You'll be redirected to `/init` to create the first administrator user
   - Fill in the administrator credentials

2. **Administrator login**:

   - After creating the administrator user, login at `/login`
   - Access the administrator dashboard at `/admin/dashboard`

3. **User management**:
   - Administrators can create user accounts from the administrator dashboard
   - New users receive temporary passwords that should be shared securely
   - Users must use these credentials to login

## API Endpoints

### Authentication

- `GET /login` - Login page
- `POST /login` - Submit login form
- `POST /token` - API token authentication
- `GET /logout` - Logout

### User Management (Administrator only)

- `GET /admin/dashboard` - Administrator dashboard
- `GET /admin/users` - List all users
- `POST /admin/users` - Create new user
- `PUT /admin/users/{id}` - Update user
- `POST /admin/users/{id}/activate` - Activate user
- `POST /admin/users/{id}/deactivate` - Deactivate user
- `POST /admin/users/{id}/reset-password` - Reset user password

### Application

- `GET /` - Main dashboard
- `GET /log-lists/` - Get accessible log lists
- `POST /log-lists/` - Create new log list
- `DELETE /log-lists/{id}` - Delete log list
- `POST /calls/` - Log new call
- `DELETE /calls/{id}` - Delete call

## Security Features

### Password Security

- Bcrypt hashing for all passwords
- Temporary password generation for new users
- Secure password reset functionality

### Access Control

- JWT tokens with configurable expiration
- Cookie-based authentication for web interface
- Role-based endpoint protection
- User data isolation (users can only access their own data)

### Data Protection

- SQL injection protection via SQLAlchemy ORM
- CSRF protection for forms
- Secure cookie handling

## Database Schema

### Users Table

- `id` - Primary key
- `username` - Unique username
- `email` - Unique email address
- `hashed_password` - Bcrypt hashed password
- `role` - ADMIN or USER
- `is_active` - Account status
- `created_at` - Timestamp
- `created_by_id` - Reference to creating administrator

### Log Lists Table

- `id` - Primary key
- `name` - List name
- `owner_id` - Foreign key to users table

### Call Logs Table

- `id` - Primary key
- `call_type` - Type of call (AOD, APPOINTMENT, etc.)
- `timestamp` - When call was logged
- `log_list_id` - Foreign key to log_lists table

## Technology Stack

- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT + python-jose
- **Password Hashing**: passlib + bcrypt
- **Frontend**: HTML5 + Bootstrap 5 + Vanilla JavaScript
- **Templating**: Jinja2

## Configuration

### Environment Variables

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/transfer_db
SECRET_KEY=your-secret-key-here  # Auto-generated if not set
```

### Security Configuration

- Token expiration: 30 minutes (configurable)
- Password complexity: Automatically generated 12-character passwords
- Session management: HTTP-only cookies

## Troubleshooting

### Common Issues

1. **Database connection errors**: Verify PostgreSQL is running and connection string is correct
2. **Permission denied**: Ensure proper file permissions on `run.sh`
3. **Token errors**: Clear browser cookies and re-login
4. **Import errors**: Ensure virtual environment is activated and dependencies are installed

### Development Mode

- Run with `--reload` flag for auto-restart on code changes
- Debug mode provides detailed error messages
- Check logs for authentication and database issues

## Production Deployment

For production deployment:

1. Set strong `SECRET_KEY` environment variable
2. Use production database with proper credentials
3. Configure HTTPS/SSL
4. Set up proper logging
5. Use production WSGI server (gunicorn, etc.)
6. Implement proper backup strategy
7. Set up monitoring and alerts
   git clone https://github.com/laguna03/transfer_rate_app.git
   cd transfer_rate_app

````

### 2. Set Up Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
````

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Database Setup

#### PostgreSQL Installation

If you don't have PostgreSQL installed:

**macOS (using Homebrew):**

```bash
brew install postgresql
brew services start postgresql
```

**Ubuntu/Debian:**

```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Create Database

```bash
# Access PostgreSQL
psql postgres

# Create database and user
CREATE DATABASE transfer_db;
CREATE USER pedrolaguna WITH ENCRYPTED PASSWORD 'mypassword';
GRANT ALL PRIVILEGES ON DATABASE transfer_db TO pedrolaguna;
\q
```

### 5. Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your database credentials
# DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

**Important**: Never commit your `.env` file to version control as it contains sensitive credentials.

## Running the Application

### Development Mode

```bash
# Make sure your virtual environment is activated
source venv/bin/activate  # On macOS/Linux
# or
venv\Scripts\activate     # On Windows

# Start the development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The application will be available at: http://localhost:8000

### Production Mode

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Usage Guide

### Dashboard Overview

The main dashboard displays:

- **Current Log List**: Switch between different call log lists
- **Call Statistics**: Total calls, transfers, and transfer rate percentage
- **Call Log Table**: Detailed view of all calls with timestamps
- **Add Call Form**: Quick form to log new calls

### Adding Calls

1. Select the call type from the dropdown:

   - **AOD**: Potential sale call type
   - **APPOINTMENT**: Potential sale call type
   - **T2**: Potential sale call type
   - **HPA**: Potential sale call type
   - **AFCT2**: Potential sale call type
   - **AFCAPPOINTMENT**: Potential sale call type
   - **NON-MED**: Potential sale call type
   - **Other types**: Non-potential sale calls

2. Click "Add Call" to log the entry
3. The transfer rate updates automatically based on potential sale calls

### Managing Log Lists

- **Create New List**: Use the "New Log" button to create additional log lists
- **Switch Lists**: Use the dropdown to switch between different log lists
- **Delete Lists**: Use the dropdown menu to delete lists (cannot delete the last remaining list)

### Call Management

- **View Calls**: All calls are displayed in a table with timestamps
- **Delete Calls**: Click the delete button (🗑️) next to any call to remove it
- **Real-time Updates**: Transfer rates and statistics update automatically

## API Endpoints

The application provides a REST API with the following endpoints:

### Call Logs

- `GET /` - Dashboard page
- `POST /calls` - Create a new call log
- `DELETE /calls/{call_id}` - Delete a call log

### Log Lists

- `POST /log-lists` - Create a new log list
- `DELETE /log-lists/{log_list_id}` - Delete a log list

### API Documentation

FastAPI provides automatic API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Testing

### Manual Testing

1. **Start the application** following the setup instructions
2. **Test call logging**:

   - Add calls of different types
   - Verify transfer rate calculations
   - Check that potential sale calls (AOD, APPOINTMENT, T2, HPA, AFCT2, AFCAPPOINTMENT, NON-MED) are counted correctly

3. **Test log list management**:

   - Create new log lists
   - Switch between lists
   - Delete lists (ensure you can't delete the last one)

4. **Test data persistence**:
   - Restart the application
   - Verify that data persists across restarts

### Database Testing

```bash
# Connect to your database to verify data
psql postgresql://pedrolaguna:mypassword@localhost:5432/transfer_db

# Check tables
\dt

# View call logs
SELECT * FROM call_logs;

# View log lists
SELECT * FROM log_lists;
```

### API Testing with curl

```bash
# Test creating a call
curl -X POST "http://localhost:8000/calls" \
     -H "Content-Type: application/json" \
     -d '{"call_type": "AOD", "log_list_id": 1}'

# Test creating a log list
curl -X POST "http://localhost:8000/log-lists" \
     -H "Content-Type: application/json" \
     -d '{"name": "Test List"}'
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**

   - Verify PostgreSQL is running: `brew services list | grep postgresql` (macOS)
   - Check database credentials in `.env` file
   - Ensure database exists: `psql -l`

2. **Module Import Errors**

   - Ensure virtual environment is activated
   - Verify all dependencies are installed: `pip list`

3. **Port Already in Use**

   - Change the port: `uvicorn app.main:app --reload --port 8001`
   - Kill existing process: `lsof -ti:8000 | xargs kill -9`

4. **Static Files Not Loading**
   - Verify file structure: `app/static/css/style.css` and `app/static/js/main.js`
   - Check browser console for errors

### Logs and Debugging

- Enable debug mode by setting `--log-level debug` when starting uvicorn
- Check browser developer tools for frontend errors
- Review terminal output for backend errors

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## Security Notes

- Never commit `.env` files containing sensitive credentials
- Use environment variables for all configuration
- Regularly update dependencies to patch security vulnerabilities
- Consider implementing authentication for production use

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues and questions:

1. Check the troubleshooting section above
2. Review the API documentation at `/docs`
3. Create an issue on GitHub

---

**Note**: This application is designed for development and testing purposes. For production deployment, consider implementing proper authentication, input validation, and security measures.
