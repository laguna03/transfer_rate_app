# Transfer Rate Application

A FastAPI-based web application for tracking and monitoring call transfer rates, built to help analyze call center performance and sales conversion metrics.

## Features

- 📊 **Call Logging**: Track calls with various types (AOD, Appointment, T2, HPA, etc.)
- 📈 **Transfer Rate Calculation**: Automatically calculate transfer rates based on call types
- 🗂️ **Multiple Log Lists**: Organize calls into different lists for better management
- 📱 **Responsive Web Interface**: Modern, mobile-friendly dashboard
- 🔍 **Real-time Analytics**: View call statistics and transfer rates instantly
- 🗑️ **Data Management**: Add, edit, and delete call logs and lists

## Tech Stack

- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Server**: Uvicorn ASGI server

## Prerequisites

- Python 3.8 or higher
- PostgreSQL database
- Git

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/laguna03/transfer_rate_app.git
cd transfer_rate_app
```

### 2. Set Up Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

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
