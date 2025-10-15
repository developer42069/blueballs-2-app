# Notifications System Setup

## Phase 2 Implementation Complete!

This document explains how to set up the notification system for BlueBalls.lol.

## Database Setup

### Step 1: Run SQL in Supabase

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `onigvijfusxtycronhhm`
3. Click on **SQL Editor** in the left sidebar
4. Click **New query**
5. Copy and paste the entire contents of `supabase-notifications-schema.sql`
6. Click **Run** to execute the SQL

This will create:
- `notifications` table with proper columns and indexes
- Row Level Security (RLS) policies
- Helper function `get_unread_notification_count()`

### Step 2: Verify the Setup

Run this query in the SQL Editor to verify the table was created:

```sql
SELECT * FROM notifications LIMIT 1;
```

You should see the table structure (even if empty).

## Features Implemented

### Notification Bell Icon
- Shows in header next to profile picture (logged-in users only)
- Red badge shows unread notification count (e.g., "3" or "9+" for 10+)
- Click to open notification dropdown

### Notification Dropdown
- Slides in from the right side of the screen
- Shows last 20 notifications
- Real-time updates via Supabase Realtime
- Unread notifications highlighted in blue
- "Mark all as read" button
- Click notification to navigate to related page

### Notification Types Supported
- `friend_request` - Someone sent you a friend request
- `friend_accepted` - Someone accepted your friend request
- `chat_message` - New chat message
- `level_up` - You reached a new level
- `rank_up` - You reached a new rank
- `lives_full` - Your lives are fully regenerated

### API Endpoints Created
- `/api/notifications/mark-read` - Mark single notification as read
- `/api/notifications/mark-all-read` - Mark all notifications as read

## How to Create Notifications (For Developers)

To create a notification, insert a row into the `notifications` table:

```javascript
await supabase
  .from('notifications')
  .insert({
    user_id: recipientUserId,
    type: 'friend_request',
    from_user_id: senderUserId,
    message: 'You have a new friend request from @username',
    link: '/friends',
    read: false
  });
```

## Next Steps

To fully integrate notifications throughout the app, you'll need to add notification creation to:

1. **Friend Request System** (when someone sends/accepts a friend request)
2. **Chat System** (when someone sends you a message)
3. **Game System** (when you level up or rank up)
4. **Lives System** (when your lives are fully regenerated)

Example implementations will be added to the codebase soon!

## Testing

To test the notification system:

1. Run the SQL setup in Supabase
2. Manually insert a test notification:

```sql
INSERT INTO notifications (user_id, type, message, link, read)
VALUES (
  'your-user-id-here',
  'friend_request',
  'Test notification: Someone sent you a friend request!',
  '/friends',
  false
);
```

3. Refresh your app - you should see the notification badge and the notification in the dropdown!

## Troubleshooting

**No notifications showing up?**
- Check that you ran the SQL schema in Supabase
- Check browser console for errors
- Verify RLS policies are enabled

**Badge not updating in real-time?**
- Make sure Supabase Realtime is enabled for the `notifications` table
- Check your Supabase project settings → Database → Replication

**Can't mark notifications as read?**
- Check that the user is logged in
- Verify the authorization token is being sent correctly
