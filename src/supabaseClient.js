import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ozbfraqipowmxbfwgnfx.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96YmZyYXFpcG93bXhiZndnbmZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1ODI3MDksImV4cCI6MjA3ODE1ODcwOX0.sZNFS-x6Q7hfNEYToTve8zNoQnroWjDVmAnLiqcHqn0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
