# My Household

A modern React Native app built with Expo for comprehensive household management. Track expenses, manage budgets, organize grocery lists, and keep your household finances organized.

## Features

- **📊 Dashboard** - Overview of your household finances and recent activities
- **💰 Budget Management** - Set and track budgets across different categories
- **🛒 Grocery Lists** - Organize and manage your shopping lists
- **📝 Expense Tracking** - Record and categorize household expenses
- **📱 Cross-Platform** - Runs on iOS, Android, and Web

## Tech Stack

- **React Native** 0.79.1
- **Expo** ^53.0.0
- **Expo Router** - File-based navigation
- **TypeScript** - Type safety
- **Lucide Icons** - Modern icon set
- **React Native Reanimated** - Smooth animations

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Emulator (for Android development)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd houseHold
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Run on your preferred platform:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Press `w` for web browser
   - Scan QR code with Expo Go app on your device

## Available Scripts

- `npm run dev` - Start the Expo development server
- `npm run build:web` - Build for web deployment
- `npm run lint` - Run ESLint

## Project Structure

```
├── app/                    # Main application screens
│   ├── (tabs)/            # Tab-based navigation screens
│   │   ├── index.tsx      # Dashboard/Home screen
│   │   ├── budget.tsx     # Budget management
│   │   ├── expenses.tsx   # Expense tracking
│   │   └── grocery.tsx    # Grocery list management
│   ├── _layout.tsx        # Root layout
│   └── +not-found.tsx     # 404 page
├── components/            # Reusable UI components
├── contexts/             # React context providers
├── assets/               # Images, fonts, and other assets
└── hooks/                # Custom React hooks
```

## Features Overview

### Dashboard

Central hub showing financial overview, recent transactions, and quick access to main features.

### Budget Management

- Create and manage budgets by category
- Track spending against budget limits
- Visual progress indicators
- Monthly/yearly budget planning

### Expense Tracking

- Add expenses with categories and descriptions
- Photo attachments for receipts
- Search and filter capabilities
- Export functionality

### Grocery Lists

- Create multiple shopping lists
- Check off items as you shop
- Share lists with family members
- Smart suggestions based on purchase history

## Development

### Folder Structure

- Uses Expo Router for file-based routing
- TypeScript for type safety
- Follows React Native best practices
- Modular component architecture

### Adding New Features

1. Create new screens in the `app/` directory
2. Add reusable components in `components/`
3. Use TypeScript interfaces for type safety
4. Follow the existing code style and patterns

## Deployment

### Web

```bash
npm run build:web
```

### Mobile

Use EAS Build for production builds:

```bash
npx eas build --platform all
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

Private project - All rights reserved
