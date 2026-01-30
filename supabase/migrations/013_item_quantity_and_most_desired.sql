-- Migration: Add quantity and most_desired fields to items table
-- These fields were being collected in the UI but not persisted

-- Add quantity column (default 1, must be positive)
ALTER TABLE public.items
ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1
CONSTRAINT items_quantity_positive CHECK (quantity >= 1);

-- Add most_desired column (boolean flag for priority items)
ALTER TABLE public.items
ADD COLUMN most_desired BOOLEAN NOT NULL DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN public.items.quantity IS 'Number of this item wanted (default 1)';
COMMENT ON COLUMN public.items.most_desired IS 'Flag indicating high-priority/starred item';
