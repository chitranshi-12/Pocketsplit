# Pocketsplit – Expense Sharing Application

## About the Project

**Pocketsplit** is a web-based expense-sharing application designed to make managing shared expenses simple, transparent, and hassle-free. It helps friends, roommates, students, and groups keep track of shared spending without the confusion of manual calculations.



## Key Objectives

- Simplify the process of splitting expenses among multiple people.
- Maintain organized records of shared spending.
- Provide a clear overview of balances and pending payments.
- Make group expense management convenient and accessible.
- Reduce manual calculations and confusion between group members.
- Offer a user-friendly interface for tracking expenses.

## Folder Structure

The folder structure may vary depending on the implementation. A typical structure could look like this:

```text
Pocketsplit/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── firebase/
│   ├── App.jsx
│   └── main.jsx
├── .env
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## Requirements

Before installing the project, make sure you have the following:

- **Node.js** – to run the development environment.
- **npm** – to install and manage dependencies.
- **Git** – to clone and manage the repository.
- **Firebase account** – if Firebase services are used for authentication or database storage.
- **Code editor** – such as Visual Studio Code.
- A modern web browser.

## Installation & Setup

### 1. Firebase Setup

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Create a new Firebase project.
3. Register a web application in the project.
4. Copy the Firebase configuration values.
5. Enable the Firebase services required by the application, such as Authentication and Cloud Firestore.
6. Configure the appropriate security rules for your database.

### 2. Frontend Setup

Clone the repository and navigate to the project directory:

```bash
git clone <your-repository-url>
cd Pocketsplit
```

Install the project dependencies:

```bash
npm install
```

Configure the required environment variables in the `.env` file according to your project's setup.

### 3. Running the Application

Start the local development server:

```bash
npm run dev
```

Open the local URL displayed in your terminal to access the application.

**Note:** The commands above assume the project uses a development setup such as Vite. Use the scripts defined in your `package.json` if they differ.

## Environment Variables

Environment variables allow configuration values to be managed separately from the source code.

### Firebase Configuration

If the project uses Vite, the Firebase configuration may be stored in a `.env` file using the appropriate variable names:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Use the variable names expected by your Firebase initialization code. Never commit private credentials or server-side secrets to GitHub. Client-side environment variables are included in the frontend bundle, so they must not be treated as secret storage.

### Gemini API Configuration (Optional)

If an AI-powered feature is implemented using the Gemini API, configure it according to the project's integration.

```env
VITE_GEMINI_API_KEY=your_api_key
```

**Security note:** A Gemini API key exposed in frontend code can be extracted by users. For production applications, use a secure backend or serverless function to handle API requests and protect the key.

## Application Features

### 1. User Authentication

Authentication helps users access their accounts securely.

- User registration and sign-in, if implemented.
- Authentication-based access to personal information.
- Account-specific expense management.
- Sign-out functionality, if available.

### 2. Groups & Friends

This module helps users organize expenses shared with other people.

- Create or manage expense groups, if implemented.
- Organize expenses by trips, roommates, events, or daily activities.
- Associate expenses with the relevant group members.
- Maintain a clear view of shared financial activities.

### 3. Expense Management

The expense management module allows users to maintain records of shared spending.

- Add expenses with details such as amount, description, date, and payer.
- Associate an expense with a group or relevant participants.
- Record each participant's share.
- View previously recorded expenses.
- Edit or delete expenses, if supported.

### 4. Balances & Settlements

This module helps users understand their financial position within a group.

- Track how much each participant has paid.
- Calculate how expenses are divided among participants.
- Identify outstanding amounts between members.
- Record settlements when participants pay each other.
- Update balances after recorded payments.

### 5. Dashboard & Analytics

The dashboard provides an overview of expense-related information in one place.

- Display relevant expense and balance summaries.
- Show total spending and individual contributions, where supported.
- Help users review group expenses.
- Present spending patterns through charts or visual summaries, if implemented.
- Make important financial information easier to understand.

### 6. Activity Tracking

Activity tracking helps users review changes and transactions related to shared expenses.

- Review recent expense entries.
- Track recorded settlements.
- View relevant group activity, if supported.
- Maintain better visibility into shared financial records.

### 7. User Profile & Settings

The profile and settings section allows users to manage their account information.

- View and update profile details, if supported.
- Manage account-related preferences.
- Access available application settings.
- Sign out of the application.

## Database Structure

If Firebase Cloud Firestore is used, the database can organize information into collections such as:

- **Users:** User profile and account-related information.
- **Groups:** Group names, members, and related metadata.
- **Expenses:** Expense amounts, descriptions, payers, participants, and split details.
- **Settlements:** Payment records between participants.
- **Activity Logs:** Records of relevant expense or settlement activities, if implemented.

The exact collection names and fields should match the database structure used in the actual project.

## Security Considerations

- Use Firebase Authentication if account-based access is required.
- Configure Firestore Security Rules to restrict access to authorized users.
- Validate expense amounts and participant data.
- Avoid storing private server credentials in frontend code.
- Keep `.env` files out of version control when they contain configuration values that should not be published.
- Test database access rules before deploying the application.

## UI/UX Design

Pocketsplit aims to provide a clear and accessible interface that makes expense management easy to understand.

- Simple navigation between major sections.
- Organized presentation of expenses and balances.
- Clear labels for payments and outstanding amounts.
- Responsive layouts for different screen sizes, where supported.
- Consistent design elements for a smooth user experience.

## Production Deployment

### 1. Frontend Deployment

The frontend can be deployed using a hosting platform such as:

- [Vercel](https://vercel.com/)
- [Netlify](https://www.netlify.com/)

General deployment steps:

1. Push the project code to GitHub.
2. Import the repository into the selected hosting platform.
3. Configure the required environment variables.
4. Set the appropriate build command and output directory according to the project.
5. Deploy the application and test the live website.

### 2. Firebase Configuration

If Firebase is used in production:

1. Confirm that the application uses the correct Firebase project.
2. Configure Authentication and database services.
3. Review Firestore Security Rules.
4. Add the deployed website's domain to the authorized domains when required.
5. Test login, expense operations, and data access on the deployed website.

## Future Enhancements

Potential improvements for future versions include:

- Recurring expense support.
- Receipt scanning and expense extraction.
- Expense export to CSV or PDF.
- Notifications for pending settlements.
- More detailed spending analytics.
- Multiple expense-splitting methods.
- AI-based spending insights, if appropriate for the application.
- Progressive Web App (PWA) support.

