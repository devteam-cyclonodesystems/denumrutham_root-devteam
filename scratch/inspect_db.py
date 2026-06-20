import sqlite3
import json

db_path = "backend/tms.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def print_table_data(table_name):
    print(f"=== {table_name} ===")
    try:
        cursor.execute(f"SELECT * FROM {table_name}")
        columns = [description[0] for description in cursor.description]
        rows = cursor.fetchall()
        for row in rows[:5]: # Print first 5 rows
            row_dict = dict(zip(columns, row))
            # Format JSON fields for readability
            for k, v in row_dict.items():
                if isinstance(v, str) and (v.startswith('{') or v.startswith('[')):
                    try:
                        row_dict[k] = json.loads(v)
                    except:
                        pass
            print(json.dumps(row_dict, indent=2, default=str))
            print("-" * 40)
    except Exception as e:
        print(f"Error reading {table_name}: {e}")

print_table_data("temples")
print_table_data("temple_profiles")
print_table_data("temple_images")
print_table_data("temple_website_settings_live")

conn.close()
