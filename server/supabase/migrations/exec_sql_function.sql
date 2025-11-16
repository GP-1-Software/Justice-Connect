/* CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges
AS $$
DECLARE
  result JSONB;
  cleaned_query TEXT;
BEGIN
  -- Security: Remove leading/trailing whitespace
  cleaned_query := TRIM(sql_query);

  -- Security: Check that query starts with SELECT (case-insensitive)
  IF NOT (cleaned_query ~* '^SELECT') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  -- Security: Block dangerous keywords (with word boundaries to avoid false positives)
  -- Allow updated_at, created_at, etc. but block UPDATE as a statement
  IF cleaned_query ~* '\b(INSERT|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE)\b' THEN
    RAISE EXCEPTION 'Query contains forbidden keywords';
  END IF;

  -- Check for UPDATE as a statement (not as part of column name)
  IF cleaned_query ~* '\bUPDATE\s+' THEN
    RAISE EXCEPTION 'UPDATE statements are not allowed';
  END IF;

  -- Execute the query and return results as JSONB
  EXECUTE format('SELECT json_agg(row_to_json(t)) FROM (%s) t', cleaned_query) INTO result;

  -- If no results, return empty array
  IF result IS NULL THEN
    result := '[]'::JSONB;
  END IF;

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    -- Return error as JSONB
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$; */

-- New FUNCTION

CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
result JSONB;
  cleaned_query TEXT;
BEGIN
  cleaned_query := TRIM(sql_query);

  IF NOT (cleaned_query ~* '^SELECT') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
END IF;

  -- Block dangerous keywords (with word boundaries)
  IF cleaned_query ~* '\b(INSERT|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE)\b' THEN
    RAISE EXCEPTION 'Query contains forbidden keywords';
END IF;

  -- Check for UPDATE as a statement (not column name)
  IF cleaned_query ~* '\bUPDATE\s+' THEN
    RAISE EXCEPTION 'UPDATE statements are not allowed';
END IF;

EXECUTE format('SELECT json_agg(row_to_json(t)) FROM (%s) t', cleaned_query) INTO result;

IF result IS NULL THEN
    result := '[]'::JSONB;
END IF;

RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;


-- Grant execute permission to authenticated users (admins will access via service role)
-- GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO authenticated;

-- ============================================================
-- END OF MIGRATION
-- ============================================================
