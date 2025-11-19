# Recipe Finder 🍽️

A modern React TypeScript application for discovering and managing recipes from around the world. Features user authentication, personalized favorites, and a comprehensive recipe database with Nepali, Indian, and international cuisine.

## ✨ Features

### 🔍 Recipe Discovery

- **Browse by Category**: Vegetarian, Chicken, Mutton, Beef, Pork, Seafood, Dessert, Breakfast, Snacks, and more
- **Smart Search**: Find recipes by name, ingredients, or cuisine
- **Detailed Views**: Complete ingredient lists, step-by-step instructions, and cooking tips
- **Rich Media**: High-quality recipe images and optional YouTube video links

### 👤 User Management

- **Secure Authentication**: Email/password registration and login
- **User Profiles**: Manage personal information (name, email, gender, address)
- **Persistent Favorites**: Save and organize favorite recipes with database storage
- **Responsive Dashboard**: Clean, intuitive interface for all user activities

### 🛠️ Admin Features

- **Recipe Management**: Full CRUD operations for recipes
- **Content Control**: Add, edit, and delete recipes through admin dashboard
- **User Management**: View and manage registered users

### 🎨 Modern UI/UX

- **Material-UI Design**: Clean, responsive interface
- **Mobile-First**: Optimized for all device sizes
- **Fast Performance**: Built with Vite for lightning-fast development and builds
- **TypeScript**: Full type safety and better developer experience

## 🚀 Tech Stack

### Frontend

- **React 19** with TypeScript
- **Vite** - Next-generation build tool
- **Material-UI (MUI)** - React component library
- **React Router** - Client-side routing
- **Axios** - HTTP client for API requests

### Backend

- **Node.js** with Express.js
- **MySQL** database with connection pooling
- **CORS** enabled for cross-origin requests
- **dotenv** for environment configuration

### Development Tools

- **ESLint** - Code linting
- **TypeScript** - Static type checking
- **Hot Module Replacement** - Instant updates during development

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher)
- **MySQL** (v8.0.0 or higher)

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "Recipe Finder"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=recipe_finder
DB_PORT=3306

# Server Configuration
PORT=3001
```

### 4. Database Setup

```bash
# Create database and tables
npm run create-db

# Test database connection
npm run test-db
```

### 5. Start the Application

**Backend Server:**

```bash
npm run server
```

The API server will start on `http://localhost:3001`

**Frontend Development Server:**

```bash
npm run dev
```

The application will open on `http://localhost:5173`

## 📁 Project Structure

```
├── server.js                 # Express.js backend server
├── package.json              # Dependencies and scripts
├── .env                      # Environment variables
├── public/                   # Static assets
└── src/
    ├── components/           # React components
    │   ├── auth/            # Login & Register components
    │   ├── admin/           # Admin dashboard components
    │   ├── Home.tsx         # Main recipe browsing
    │   ├── Favorites.tsx    # User favorites management
    │   ├── Navbar.tsx       # Navigation component
    │   └── ...
    ├── contexts/            # React Context providers
    │   └── AuthContext.ts   # Authentication context
    ├── hooks/               # Custom React hooks
    │   ├── useAuth.tsx      # Authentication provider
    │   ├── useAuthHook.ts   # Authentication hook
    │   └── useRecipes.ts    # Recipe data management
    ├── pages/               # Page-level components
    │   ├── Profile.tsx      # User profile management
    │   └── AdminDashboard.tsx
    ├── services/            # API service layer
    │   └── api.ts           # Axios API client
    ├── types/               # TypeScript definitions
    │   ├── Recipe.ts        # Recipe interface
    │   └── User.ts          # User interface
    ├── constants/           # Application constants
    │   └── categories.ts    # Recipe categories
    ├── scripts/             # Database utilities
    │   ├── createDb.js      # Database initialization
    │   ├── testConnection.js # Connection testing
    │   └── testServer.js    # Server testing
    └── assets/              # Recipe images and static files
        └── recipes/         # Recipe image collection
```

## 🗄️ Database Schema

### Recipes Table

- **id** (VARCHAR) - Unique recipe identifier
- **name** (VARCHAR) - Recipe name
- **cuisine** (VARCHAR) - Cuisine type (Nepali, Indian, International)
- **category** (VARCHAR) - Recipe category
- **ingredients** (TEXT) - Comma-separated ingredients list
- **instructions** (TEXT) - Comma-separated cooking steps
- **tags** (TEXT) - Recipe tags for search
- **image_url** (VARCHAR) - Recipe image path
- **youtube** (VARCHAR) - Optional YouTube video link
- **source** (VARCHAR) - Recipe source attribution

### Users Table

- **id** (INT) - Auto-increment primary key
- **name** (VARCHAR) - User's full name
- **email** (VARCHAR) - Email address (unique)
- **password** (VARCHAR) - User password
- **gender** (VARCHAR) - Optional gender
- **age** (INT) - Optional age
- **address** (TEXT) - Optional address
- **favorite_recipes** (TEXT) - Comma-separated favorite recipe IDs
- **created_at** (TIMESTAMP) - Account creation time
- **updated_at** (TIMESTAMP) - Last profile update

## 📜 Available Scripts

| Script                | Description                              |
| --------------------- | ---------------------------------------- |
| `npm run dev`         | Start development server with hot reload |
| `npm run build`       | Build optimized production bundle        |
| `npm run preview`     | Preview production build locally         |
| `npm run server`      | Start Express.js backend server          |
| `npm run start`       | Start production server                  |
| `npm run lint`        | Run ESLint code analysis                 |
| `npm run create-db`   | Initialize database and tables           |
| `npm run test-db`     | Test database connectivity               |
| `npm run test-server` | Test server endpoints                    |

## 🔐 Authentication System

The application uses a simple token-based authentication system:

### Registration Flow

1. User submits registration form
2. Server validates data and creates user account
3. Mock JWT token generated and returned
4. User automatically logged in

### Login Flow

1. User provides email/password credentials
2. Server validates against database
3. Mock JWT token generated for session
4. User data and token stored in localStorage

### Protected Routes

- `/favorites` - User's favorite recipes
- `/profile` - User profile management
- `/admin` - Admin dashboard (role-based access)

## 🎯 API Endpoints

### Public Endpoints

- `GET /api/recipes` - Get all recipes (with filtering)
- `GET /api/recipes/:id` - Get single recipe
- `GET /api/cuisines` - Get available cuisines
- `GET /api/categories` - Get recipe categories
- `GET /api/health` - Health check endpoint

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Protected Endpoints (require authentication)

- `GET /api/favorites` - Get user's favorite recipes
- `POST /api/favorites/:recipeId` - Add recipe to favorites
- `DELETE /api/favorites/:recipeId` - Remove from favorites
- `PUT /api/auth/profile` - Update user profile

### Admin Endpoints

- `POST /api/recipes` - Create new recipe
- `PUT /api/recipes/:id` - Update existing recipe
- `DELETE /api/recipes/:id` - Delete recipe

## 🌟 Usage Examples

### Adding a Recipe to Favorites

```javascript
// Using the API service
import { api } from "./services/api";

const addToFavorites = async (recipeId) => {
  try {
    await api.addToFavorites(recipeId);
    console.log("Recipe added to favorites!");
  } catch (error) {
    console.error("Failed to add to favorites:", error);
  }
};
```

### Searching Recipes

```javascript
// Search by cuisine and category
const searchRecipes = async () => {
  const recipes = await api.getRecipes({
    cuisine: "Nepali",
    category: "Vegetarian",
    search: "dal",
  });
  return recipes;
};
```

## 🚀 Deployment

### Production Build

```bash
npm run build
```

### Environment Variables for Production

```env
DB_HOST=your_production_db_host
DB_USER=your_production_db_user
DB_PASSWORD=your_secure_password
DB_NAME=recipe_finder
PORT=3001
NODE_ENV=production
```

## 🔧 Development

### Adding New Features

1. Create feature branch: `git checkout -b feature/new-feature`
2. Implement changes with TypeScript support
3. Add tests if applicable
4. Update documentation
5. Submit pull request

### Code Quality

- ESLint configured for TypeScript and React
- Consistent code formatting
- Type safety enforced throughout
- Component-based architecture

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure all tests pass
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Recipe data curated from various authentic sources
- Images sourced from recipe contributors
- Built with love for food enthusiasts worldwide

---

**Happy Cooking! 👨‍🍳👩‍🍳**
