-- JT-Mobamba Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users extended profile
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users PRIMARY KEY,
    username TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'user',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspaces/Projects
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID REFERENCES profiles(id),
    storage_used BIGINT DEFAULT 0,
    storage_limit BIGINT DEFAULT 8589934592, -- 8GB in bytes
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace members
CREATE TABLE IF NOT EXISTS workspace_members (
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    PRIMARY KEY (workspace_id, user_id)
);

-- File metadata
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    path TEXT NOT NULL DEFAULT '/',
    size BIGINT NOT NULL,
    mime_type TEXT,
    storage_path TEXT NOT NULL,
    sync_status TEXT DEFAULT 'synced',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics snapshots
CREATE TABLE IF NOT EXISTS analytics_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    total_storage_used BIGINT,
    file_count INTEGER,
    snapshot_date DATE DEFAULT CURRENT_DATE,
    file_type_distribution JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync events log
CREATE TABLE IF NOT EXISTS sync_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_files_workspace_id ON files(workspace_id);
CREATE INDEX IF NOT EXISTS idx_files_path ON files(path);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_workspace_date ON analytics_snapshots(workspace_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_sync_events_file_id ON sync_events(file_id);
CREATE INDEX IF NOT EXISTS idx_sync_events_created_at ON sync_events(created_at);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for workspaces
CREATE POLICY "Users can view workspaces they are members of" ON workspaces
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = workspaces.id
            AND workspace_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create workspaces" ON workspaces
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Workspace owners can update their workspaces" ON workspaces
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Workspace owners can delete their workspaces" ON workspaces
    FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for workspace_members
CREATE POLICY "Members can view workspace members" ON workspace_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_members wm
            WHERE wm.workspace_id = workspace_members.workspace_id
            AND wm.user_id = auth.uid()
        )
    );

CREATE POLICY "Workspace owners/admins can manage members" ON workspace_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM workspace_members wm
            WHERE wm.workspace_id = workspace_members.workspace_id
            AND wm.user_id = auth.uid()
            AND wm.role IN ('owner', 'admin')
        )
    );

-- RLS Policies for files
CREATE POLICY "Users can view files in their workspaces" ON files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = files.workspace_id
            AND workspace_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert files in their workspaces" ON files
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = files.workspace_id
            AND workspace_members.user_id = auth.uid()
            AND workspace_members.role IN ('owner', 'admin', 'member')
        )
    );

CREATE POLICY "Users can update files in their workspaces" ON files
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = files.workspace_id
            AND workspace_members.user_id = auth.uid()
            AND workspace_members.role IN ('owner', 'admin', 'member')
        )
    );

CREATE POLICY "Users can delete files in their workspaces" ON files
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = files.workspace_id
            AND workspace_members.user_id = auth.uid()
            AND workspace_members.role IN ('owner', 'admin', 'member')
        )
    );

-- RLS Policies for analytics_snapshots
CREATE POLICY "Users can view analytics for their workspaces" ON analytics_snapshots
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = analytics_snapshots.workspace_id
            AND workspace_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert analytics for their workspaces" ON analytics_snapshots
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = analytics_snapshots.workspace_id
            AND workspace_members.user_id = auth.uid()
        )
    );

-- RLS Policies for sync_events
CREATE POLICY "Users can view sync events for their files" ON sync_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM files
            JOIN workspace_members ON workspace_members.workspace_id = files.workspace_id
            WHERE files.id = sync_events.file_id
            AND workspace_members.user_id = auth.uid()
        )
        OR sync_events.file_id IS NULL
    );

CREATE POLICY "Users can insert sync events" ON sync_events
    FOR INSERT WITH CHECK (true);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, username, role, onboarding_completed)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        split_part(new.email, '@', 1),
        'user',
        false
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get table names (for database browser)
CREATE OR REPLACE FUNCTION public.get_tables()
RETURNS TABLE (table_name text) AS $$
BEGIN
    RETURN QUERY
    SELECT tablename::text
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
    ORDER BY tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Storage bucket setup (run in Storage section of Supabase)
-- 1. Create a bucket named "files"
-- 2. Set it to private (not public)
-- 3. Add the following RLS policies:

/*
Storage Policies to add in Supabase Dashboard:

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'files');

-- Allow users to read files from their workspaces
CREATE POLICY "Users can read files from their workspaces" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'files');

-- Allow users to delete their files
CREATE POLICY "Users can delete their files" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'files');
*/

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
