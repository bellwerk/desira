-- ============================================================================
-- M6 Notifications v1: In-app Notifications Table
-- ============================================================================
-- Simple in-app notification system. Users receive notifications for key
-- events on their lists (new items, reservations, contributions).
-- ============================================================================

-- Notification types (for reference):
-- item.added         - New item added to a list you're a member of
-- item.reserved      - An item on your list was reserved
-- contribution.received - A contribution was made to an item on your list

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient (which user should see this notification)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification type (e.g., 'item.added', 'item.reserved', 'contribution.received')
  type TEXT NOT NULL,
  
  -- Display content
  title TEXT NOT NULL,
  body TEXT,
  
  -- Link to navigate to when clicked (optional)
  link TEXT,
  
  -- Read state
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Additional metadata (flexible JSON for context like item_id, list_id, etc.)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  read_at TIMESTAMPTZ
);

-- Index for fetching user's notifications (most common query)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- Index for filtering unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;

-- Index for ordering by created_at
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- ============================================================================
-- RLS Policies
-- ============================================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
CREATE POLICY "Users can read own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only update their own notifications (for marking as read)
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notifications (for dismissing)
CREATE POLICY "Users can delete own notifications"
  ON public.notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Insert is done via service role (supabaseAdmin) from server code
-- No insert policy for regular users - only system can create notifications

COMMENT ON TABLE public.notifications IS 'In-app notifications for users (M6)';






