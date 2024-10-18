![image](https://github.com/mariangle/.taskify/assets/124585244/d4130585-5ea5-4f34-bfaf-ea8daf5cc7a0)

<p align="center">
  <a href="https://dottaskify.vercel.app/" target="_blank"></a>
    <h1 align="center">Taskify</h1>
  </a>
</p>

<p align="center">
  Task Manager app with modern features.
</p>

<p align="center">
  <a href="https://www.linkedin.com/in/maria-nguyen-le">
    <img src="https://img.shields.io/badge/-MariaLe-blue?style=plastic-square&logo=Linkedin&logoColor=white&link=https://www.linkedin.com/in/maria-nguyen-le/" alt="LinkedIn" />
  </a>
</p>
<br/>

### APP Features
- AI Generated tasks
- Natural Language Processing (NLP)
- Mention-driven task assignments via @ or #
- Keyboard Shortcuts
- Lists and labels
- Speech Recognition
- Subtasks
- Drag and drop
- Reccuring tasks
- Filtering tasks
- Multiple views
- Dark and light mode
- Layout customization
- Native drawers for smaller devices
- Loading skeleton states for everything

### Landing page
- Docs page
- Pure CSS animations and fade in animations 
- Interactive preview components
- Just overall sleek and modern designed

### Libraries and technologies
- .NET Web API
- C# and Typescript
- Next.js14
- TailwindCSS
- Vercel
- PostgreSQL
- Prisma
- Zustand (state management)
- SWR (stale-while-revalidate strategy)
- zod
- react-speech-recognition
- reusable components
- dnd-kit (drag and drop)
- openai API (AI)
- date-fns

## Local Development Setup

### Prerequisites
- .NET 8.0 SDK
- Node.js and npm
- PostgreSQL

### Backend Setup
1. Navigate to the server directory:
   ```
   cd /Users/bryanmcafee/taskyai/server
   ```

2. Update the connection string in `appsettings.json`:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Host=localhost;Database=TaskifyDB;Username=your_username;Password=your_password"
   }
   ```

3. Install dependencies:
   ```
   dotnet restore
   ```

4. Apply database migrations:
   ```
   dotnet ef database update
   ```

5. Run the backend server:
   ```
   dotnet run
   ```

   The API will be available at https://localhost:7232 and http://localhost:5152

### Frontend Setup
1. Navigate to the client directory:
   ```
   cd /Users/bryanmcafee/taskyai/client
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm run dev
   ```

   The frontend will be available at http://localhost:3000

### Testing
- Use Swagger UI at http://localhost:5152/swagger to test API endpoints
- Access the frontend at http://localhost:3000 to test the full application

### Deployment
- Update CI/CD pipelines to use PostgreSQL
- Ensure all environment variables are correctly set in your deployment environment