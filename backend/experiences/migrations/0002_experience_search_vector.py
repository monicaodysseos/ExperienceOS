"""
Add search_vector tsvector column to experiences with a GIN index.
The column is populated by a DB trigger so it stays in sync on insert/update.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("experiences", "0001_initial"),
    ]

    operations = [
        # 1. Add the tsvector column (nullable so existing rows are fine)
        migrations.RunSQL(
            sql="""
            ALTER TABLE experiences
            ADD COLUMN IF NOT EXISTS search_vector tsvector;
            """,
            reverse_sql="""
            ALTER TABLE experiences DROP COLUMN IF EXISTS search_vector;
            """,
        ),
        # 2. Populate existing rows
        migrations.RunSQL(
            sql="""
            UPDATE experiences
            SET search_vector =
                setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
                setweight(to_tsvector('english', coalesce(city, '')), 'B') ||
                setweight(to_tsvector('english', coalesce(description, '')), 'C') ||
                setweight(to_tsvector('english', coalesce(what_included, '')), 'D');
            """,
            reverse_sql="",
        ),
        # 3. GIN index for fast full-text queries
        migrations.RunSQL(
            sql="""
            CREATE INDEX IF NOT EXISTS experiences_search_vector_gin
            ON experiences USING gin(search_vector);
            """,
            reverse_sql="""
            DROP INDEX IF EXISTS experiences_search_vector_gin;
            """,
        ),
        # 4. Trigger function to keep search_vector up to date on every upsert
        migrations.RunSQL(
            sql="""
            CREATE OR REPLACE FUNCTION experiences_search_vector_update()
            RETURNS trigger AS $$
            BEGIN
                NEW.search_vector :=
                    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
                    setweight(to_tsvector('english', coalesce(NEW.city, '')), 'B') ||
                    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C') ||
                    setweight(to_tsvector('english', coalesce(NEW.what_included, '')), 'D');
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS experiences_search_vector_trigger ON experiences;

            CREATE TRIGGER experiences_search_vector_trigger
            BEFORE INSERT OR UPDATE OF title, city, description, what_included
            ON experiences
            FOR EACH ROW EXECUTE FUNCTION experiences_search_vector_update();
            """,
            reverse_sql="""
            DROP TRIGGER IF EXISTS experiences_search_vector_trigger ON experiences;
            DROP FUNCTION IF EXISTS experiences_search_vector_update();
            """,
        ),
    ]
