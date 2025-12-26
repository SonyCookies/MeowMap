# Function Cards Implementation Plan

## Overview
This document outlines the implementation plan for the remaining function cards in the HomeScreen's FunctionCards component. Currently, only "Map View" is fully functional.

## Current Status

### ✅ Implemented
- **Map View** - Fully functional, navigates to `MapViewScreen`

### ❌ Not Implemented
- **My Sightings** - No functionality
- **Community** - No functionality (has notification badge showing "2")
- **Statistics** - No functionality

---

## Implementation Plan

### 1. My Sightings Card

#### Purpose
Display a list of all cat sightings reported by the current user, allowing them to view, edit, or delete their own sightings.

#### Features to Implement
- **Screen**: `MySightingsScreen.js`
  - List view of user's sightings (similar to UpdatesListScreen)
  - Filter options (by date, urgency level, location)
  - Search functionality
  - Sort options (newest first, oldest first, by location)
  
- **Components Needed**:
  - `components/sightings/SightingListItem.js` - Individual sighting item in list
  - `components/sightings/SightingFilters.js` - Filter controls
  - `components/sightings/SightingSearchBar.js` - Search input
  
- **Services**:
  - Update `services/sightingService.js`:
    - Add `getUserSightings(userId, options)` - Fetch sightings by user ID
    - Add `updateSighting(sightingId, data)` - Update existing sighting
    - Add `deleteSighting(sightingId)` - Delete a sighting
  
- **Navigation Flow**:
  ```
  HomeScreen → MySightingsScreen → SightingDetailModal (edit/delete)
  ```

- **Data Requirements**:
  - Fetch sightings where `user_id = current_user.id`
  - Display: cat name, photo thumbnail, location, date, urgency level
  - Show empty state if no sightings

- **Actions Available**:
  - View details (opens SightingDetailModal)
  - Edit sighting (if within 24 hours of creation)
  - Delete sighting (with confirmation)
  - Share sighting (optional)

#### Implementation Steps
1. Create `screens/MySightingsScreen.js`
2. Create `components/sightings/SightingListItem.js`
3. Create `components/sightings/SightingFilters.js`
4. Update `services/sightingService.js` with user-specific queries
5. Add navigation in `HomeScreen.js`:
   ```javascript
   const [showMySightingsScreen, setShowMySightingsScreen] = useState(false);
   ```
6. Update `FunctionCards.js` to accept `onMySightingsPress` prop
7. Update `StatsBanner.js` to pass the handler

#### Estimated Complexity: Medium
- Database queries: Simple (filter by user_id)
- UI: Medium (list, filters, search)
- State management: Medium (filters, search, pagination)

---

### 2. Community Card

#### Purpose
Show community features including:
- Community members/contributors
- Community events/meetups
- Community discussions/forums
- Leaderboards
- Community guidelines

#### Features to Implement
- **Screen**: `CommunityScreen.js`
  - Tab navigation or sectioned view:
    - **Members** - List of active community members
    - **Events** - Upcoming community meetups/events
    - **Discussions** - Community forum/chat (optional)
    - **Leaderboard** - Top contributors, most sightings, etc.
    - **Guidelines** - Community rules and best practices

- **Components Needed**:
  - `components/community/MemberCard.js` - Community member profile card
  - `components/community/EventCard.js` - Event/meetup card
  - `components/community/LeaderboardItem.js` - Leaderboard entry
  - `components/community/GuidelinesModal.js` - Community guidelines modal

- **Services**:
  - Create `services/communityService.js`:
    - `getCommunityMembers(options)` - Get active members
    - `getCommunityEvents(options)` - Get upcoming events
    - `getLeaderboard(type, period)` - Get leaderboard data
    - `joinEvent(eventId)` - Join a community event
    - `leaveEvent(eventId)` - Leave an event

- **Database Tables Needed** (if not exist):
  - `community_events` - Store community meetups/events
  - `community_members` - Track active community members (or use profiles)
  - `leaderboard_stats` - Aggregated stats for leaderboard (or calculate on-the-fly)

- **Navigation Flow**:
  ```
  HomeScreen → CommunityScreen → [EventDetailScreen | MemberProfileScreen | LeaderboardScreen]
  ```

- **Notification Badge**:
  - Show count of:
    - New community events
    - Unread community messages (if forum exists)
    - New leaderboard updates
  - Update badge count from `NotificationContext` or dedicated service

#### Implementation Steps
1. Create `screens/CommunityScreen.js` with tab/section navigation
2. Create `components/community/` folder and components
3. Create `services/communityService.js`
4. Design database schema for community features (if needed)
5. Add navigation in `HomeScreen.js`
6. Update `FunctionCards.js` to accept `onCommunityPress` prop
7. Implement notification badge logic
8. Update `StatsBanner.js` to pass the handler

#### Estimated Complexity: High
- Database: Medium-High (may need new tables)
- UI: High (multiple sections, navigation, real-time updates)
- State management: High (events, members, leaderboard, notifications)

---

### 3. Statistics Card

#### Purpose
Display detailed statistics and analytics about:
- User's personal statistics
- Community-wide statistics
- Trends and insights
- Charts and visualizations

#### Features to Implement
- **Screen**: `StatisticsScreen.js`
  - Personal Stats Section:
    - Total sightings over time (line chart)
    - Sightings by urgency level (pie chart)
    - Sightings by location (heatmap or list)
    - Sightings by month/week (bar chart)
    - Average sightings per week/month
    - Streak counter (consecutive days with sightings)
  
  - Community Stats Section:
    - Total community sightings
    - Most active areas
    - Most common cat types/colors
    - Community growth over time
    - Top contributors
  
  - Insights Section:
    - Personalized insights ("You've spotted 5 cats this week!")
    - Recommendations ("Try exploring the park area")
    - Achievements/Badges (optional)

- **Components Needed**:
  - `components/statistics/StatCard.js` - Individual stat display card
  - `components/statistics/ChartCard.js` - Chart wrapper component
  - `components/statistics/InsightCard.js` - Insight/recommendation card
  - `components/statistics/AchievementBadge.js` - Achievement display (optional)
  
  - Chart Libraries (choose one):
    - `react-native-chart-kit` - Simple charts
    - `victory-native` - More advanced charts
    - `react-native-svg` + custom charts - Full control

- **Services**:
  - Create `services/statisticsService.js`:
    - `getUserStatistics(userId, period)` - Get user stats
    - `getCommunityStatistics(period)` - Get community stats
    - `getSightingTrends(userId, period)` - Get trend data
    - `getPersonalInsights(userId)` - Generate insights
    - `getAchievements(userId)` - Get user achievements (optional)

- **Data Aggregation**:
  - Calculate stats from existing `cat_sightings` table
  - May need database views or stored procedures for performance
  - Consider caching for frequently accessed stats

- **Navigation Flow**:
  ```
  HomeScreen → StatisticsScreen → [ChartDetailScreen | AchievementDetailScreen]
  ```

#### Implementation Steps
1. Choose and install chart library
2. Create `screens/StatisticsScreen.js`
3. Create `components/statistics/` folder and components
4. Create `services/statisticsService.js`
5. Design database queries/views for statistics
6. Implement chart components
7. Add navigation in `HomeScreen.js`
8. Update `FunctionCards.js` to accept `onStatisticsPress` prop
9. Update `StatsBanner.js` to pass the handler

#### Estimated Complexity: Medium-High
- Database: Medium (aggregation queries, may need optimization)
- UI: Medium-High (charts, visualizations)
- State management: Medium (data fetching, chart state)
- Performance: Medium (may need caching for large datasets)

---

## Implementation Priority

### Phase 1: My Sightings (High Priority)
**Why**: Core functionality that users expect - ability to see their own contributions
**Estimated Time**: 2-3 days
**Dependencies**: None (uses existing sightingService)

### Phase 2: Statistics (Medium Priority)
**Why**: Provides value and engagement through data visualization
**Estimated Time**: 3-4 days
**Dependencies**: Chart library installation

### Phase 3: Community (Lower Priority)
**Why**: More complex, requires additional database tables and features
**Estimated Time**: 5-7 days
**Dependencies**: Database schema design, community features planning

---

## Technical Considerations

### State Management
- Use existing `useAuth()` context for user data
- Consider creating `useSightings()` hook for sightings state
- Use `useState` and `useEffect` for screen-level state
- Consider `useMemo` for expensive calculations (statistics)

### Performance
- Implement pagination for large lists (My Sightings)
- Cache statistics data to avoid repeated calculations
- Use `FlatList` for efficient list rendering
- Consider lazy loading for community members/events

### Database Optimization
- Add indexes on frequently queried fields:
  - `cat_sightings.user_id` (for My Sightings)
  - `cat_sightings.created_at` (for statistics)
- Consider materialized views for complex statistics
- Use database aggregation functions where possible

### Error Handling
- Handle empty states gracefully
- Show loading indicators during data fetch
- Display error messages with retry options
- Handle network failures appropriately

### User Experience
- Add pull-to-refresh for lists
- Implement search with debouncing
- Show skeleton loaders during data fetch
- Provide clear empty states with helpful messages

---

## File Structure After Implementation

```
screens/
├── MySightingsScreen.js
├── CommunityScreen.js
└── StatisticsScreen.js

components/
├── sightings/
│   ├── SightingListItem.js
│   ├── SightingFilters.js
│   └── SightingSearchBar.js
├── community/
│   ├── MemberCard.js
│   ├── EventCard.js
│   ├── LeaderboardItem.js
│   └── GuidelinesModal.js
└── statistics/
    ├── StatCard.js
    ├── ChartCard.js
    ├── InsightCard.js
    └── AchievementBadge.js

services/
├── communityService.js
└── statisticsService.js
```

---

## Testing Checklist

### My Sightings
- [ ] Display all user sightings correctly
- [ ] Filter by date works
- [ ] Filter by urgency level works
- [ ] Search functionality works
- [ ] Edit sighting works (within time limit)
- [ ] Delete sighting works with confirmation
- [ ] Empty state displays correctly
- [ ] Loading state displays correctly
- [ ] Error handling works

### Community
- [ ] Community members list displays
- [ ] Events list displays
- [ ] Leaderboard displays correctly
- [ ] Join/leave event works
- [ ] Notification badge updates correctly
- [ ] Guidelines modal displays
- [ ] Navigation to detail screens works

### Statistics
- [ ] Personal stats calculate correctly
- [ ] Community stats calculate correctly
- [ ] Charts render correctly
- [ ] Insights generate appropriately
- [ ] Data updates when new sightings added
- [ ] Performance is acceptable with large datasets

---

## Notes

- All new screens should follow the same import pattern as existing screens
- Use existing theme constants from `constants/theme.js`
- Follow component extraction rules from PROJECT_STRUCTURE.md
- Keep screens under 500 lines when possible
- Extract complex logic into hooks or services
- Document complex calculations and algorithms

---

**Last Updated**: [Current Date]
**Status**: Planning Phase


