# ThumbnailAI - AI-Powered Thumbnail Generator

## Overview

ThumbnailAI is a full-stack web application that generates professional thumbnails using AI models. The application intelligently analyzes user prompts and automatically selects the optimal AI model (DALL-E 3, Midjourney, or Stable Diffusion) for thumbnail generation. Built with React frontend and Express backend, the application features rate limiting, real-time generation tracking, and a modern UI with shadcn/ui components.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (August 19, 2025)

### Responsive Image Display Improvements
- Enhanced responsive grid layouts for generated images, upscaled images, and variations
- Added responsive minimum heights (200px to 400px) across different screen sizes
- Optimized button layouts with smaller, more compact design to prevent overflow
- Improved image scaling on larger screens with better column distribution
- Added maximum width constraints to center content and improve readability
- Updated button styling with consistent text-xs sizing and reduced padding for better fit

### Professional Fullscreen Gallery (August 20, 2025)
- Redesigned fullscreen view with professional landscape layout
- Main image display takes 60% of screen height for optimal viewing
- Interactive thumbnail grid at bottom showing all images (generated, upscaled, variations)
- Responsive grid showing 2-5 thumbnails per row based on screen size
- Visual feedback with purple ring highlighting currently selected image
- Removed generation time displays for cleaner interface
- Added smooth transitions and professional styling

### Enhanced Slider Design (August 20, 2025)
- Redesigned image count slider with modern Poppins font styling
- Increased maximum images from 10 to 20 for better flexibility
- Added gradient background container with purple-to-blue theme
- Large centered number display with gradient text effect
- Custom slider thumb with gradient colors and smooth animations
- Hover and active state animations with scale effects and shadow
- Professional styling with rounded corners and visual depth

### Complete Upscale Functionality Removal (August 20, 2025)
- Completely removed all upscale-related functionality from frontend and backend
- Removed upscale buttons, handlers, mutations, and interface definitions
- Removed upscale routes and ImageUpscaler service dependencies
- Updated fullscreen gallery to show only generated images and variations
- Cleaned up all upscale state management and UI components

### Variation Functionality Simplification (August 20, 2025)
- Rolled back variation functionality to simple implementation
- Removed complex content validation and filtering systems
- Variations now use original prompt without additional context processing
- Simplified server-side validation to basic requirements only
- Maintained responsive design and UI improvements for variation containers

### Request Cancellation System (August 20, 2025)
- Implemented AbortController mechanism to cancel previous image generation requests
- Automatically cancels ongoing generation when new requests are initiated
- Added user feedback notifications for cancelled requests
- Enhanced apiRequest function to support AbortSignal parameter
- Prevents resource conflicts and improves user experience with instant response

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured error handling
- **Middleware**: Custom logging, JSON parsing, and error handling middleware
- **Development**: Hot reload with Vite integration for seamless development experience

### Data Storage Solutions
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL with Neon serverless driver
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Development Storage**: In-memory storage implementation for development/testing
- **Session Storage**: connect-pg-simple for PostgreSQL session store

### Database Schema
- **thumbnail_requests**: Stores generation requests with prompt, style, aspect ratio, selected model, reasoning, generated images, and quality metrics
- **daily_usage**: Tracks IP-based rate limiting with daily generation counts
- **Shared Types**: Zod schemas for type-safe validation across frontend and backend

### Authentication and Authorization
- **Rate Limiting**: IP-based daily usage tracking (10 generations per day)
- **Session Management**: Express sessions with PostgreSQL backing
- **No Authentication**: Currently operates without user accounts for simplicity

### AI Integration Architecture
- **Model Selection**: Intelligent AI selector using GPT-4o to analyze prompts and choose optimal model
- **Supported Models**: DALL-E 3, Midjourney, and Stable Diffusion
- **Generation Pipeline**: Prompt enhancement, model-specific optimization, and quality scoring
- **OpenAI Integration**: Primary implementation using OpenAI API with DALL-E 3

## External Dependencies

### AI Services
- **OpenAI API**: Primary AI service for model selection (GPT-4o) and image generation (DALL-E 3)
- **Planned Integrations**: Midjourney API and Stable Diffusion API for complete model coverage

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Alternative Support**: Standard PostgreSQL connections via environment variables

### Development Tools
- **Replit Integration**: Custom Vite plugins for Replit environment including cartographer and runtime error overlay
- **Font Services**: Google Fonts integration for typography (Architects Daughter, DM Sans, Fira Code, Geist Mono)

### UI and Styling
- **Radix UI**: Comprehensive primitive components for accessibility and functionality
- **Tailwind CSS**: Utility-first CSS framework with PostCSS processing
- **Lucide React**: Icon library for consistent iconography
- **FontAwesome**: Additional icon support via CDN

### Build and Development
- **Vite**: Fast build tool and development server
- **ESBuild**: Backend bundling for production builds
- **TypeScript**: Type checking and compilation
- **TSX**: TypeScript execution for development server