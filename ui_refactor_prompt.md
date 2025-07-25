# UI Refactor Requirements: Headspace-Inspired Document Management App

## Context
Reference the provided screenshots showing the current app interface (Image 1) and the wireframe sketches for the desired new layout (Image 2). Transform the current document management app to match the wireframe design while embodying a calm, Headspace-inspired aesthetic.

## Overall Visual Design
- Adopt Headspace's visual language: soft gradients, generous white space, rounded corners (12-16px radius), and calming color palette
- Replace current purple theme with Headspace-inspired colors: warm oranges (#FF6B35, #FFA726), soft blues (#42A5F5, #81C784), gentle pastels, and plenty of white space
- Use friendly, approachable typography with proper hierarchy
- Implement subtle shadows and gentle transitions throughout
- Create a sense of calm and simplicity in every interaction

## Navigation Structure (as shown in wireframe)
- Remove all screen headers/titles
- Implement sticky search bar at the top of all screens
- Bottom navigation with only 3 buttons: "Library", "+" (add), and "Profile"
- Use rounded, pill-shaped navigation elements
- Highlight active states with soft color fills rather than harsh borders

## Landing Page (Library Screen - follow wireframe layout)
- Clean, minimal layout with sticky search bar at top
- Show gentle "Welcome!" message below search bar for all users (both new and existing)
- Display documents in adaptive grid: 1 column on small screens, 2-3 columns on larger screens (as shown in wireframe)
- Use card-based design with subtle shadows and rounded corners
- Generous spacing between elements

## Upload Modal (+ Button - as depicted in rightmost wireframe)
- Bottom sheet modal that slides up smoothly when "+" is pressed
- Include upload options exactly as shown in wireframe: "Take Photo or Video", "Photo Library", "Scan Document", "Scan Text", "Attach File"
- Each option should have friendly icons and clear descriptions
- Tapping outside modal or swipe down gesture closes it
- No confirmation popups after upload - just smooth transitions back to library
- Use the same rounded, card-based design language

## Technical Requirements
- Maintain responsive design principles
- Implement smooth animations (300ms ease-in-out transitions)
- Ensure accessibility with proper contrast ratios and touch targets (44px minimum)
- Search bar should remain functional and sticky during scroll
- All interactions should feel fluid and calming, never jarring

## Key Principle
Every element should contribute to a stress-free, pleasant document management experience that feels more like a wellness app than a utility tool, following the simplified layout structure shown in the wireframe sketches.