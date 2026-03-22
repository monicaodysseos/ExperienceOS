"""
Add search_vector tsvector column to experiences with a GIN index.
The column is populated by a DB trigger so it stays in sync on insert/update.
Skipped on SQLite (only runs on PostgreSQL).
"""
from django.db import migrations


def noop(apps, schema_editor):
    pass


def apply_search_vector(apps, schema_editor):
    if schema_editor.connection.vendor != 'postgresql':
        return
    schema_editor.execute("""
        ALTER TABLE experiences
        ADD COLUMN IF NOT EXISTS search_vector tsvector;
    """)
    schema_editor.execute("""
        UPDATE experiences
        SET search_vector =
            setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
            setweight(to_tsvector('english', coalesce(city, '')), 'B') ||
            setweight(to_tsvector('english', coalesce(description, '')), 'C') ||
            setweight(to_tsvector('english', coalesce(what_included, '')), 'D');
    """)
    schema_editor.execute("""
        CREATE INDEX IF NOT EXISTS experiences_search_vector_gin
        ON experiences USING gin(search_vector);
    """)
    schema_editor.execute("""
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
    """)


def reverse_search_vector(apps, schema_editor):
    if schema_editor.connection.vendor != 'postgresql':
        return
    schema_editor.execute("DROP TRIGGER IF EXISTS experiences_search_vector_trigger ON experiences;")
    schema_editor.execute("DROP FUNCTION IF EXISTS experiences_search_vector_update();")
    schema_editor.execute("DROP INDEX IF EXISTS experiences_search_vector_gin;")
    schema_editor.execute("ALTER TABLE experiences DROP COLUMN IF EXISTS search_vector;")


class Migration(migrations.Migration):

    dependencies = [
        ("experiences", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(apply_search_vector, reverse_search_vector),
    ]
