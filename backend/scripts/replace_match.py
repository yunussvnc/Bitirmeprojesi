import os

def replace_in_file(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r') as f:
        content = f.read()
    
    new_content = content.replace("MatchConversation", "Conversation")
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
files_to_update = [
    "app/routers/messages.py",
    "app/routers/stories.py",
    "app/routers/auth.py",
    "app/services/feed_scorer.py",
    "tests/conftest.py",
    "seed_db.py",
    "query_db_conv.py"
]

for file in files_to_update:
    replace_in_file(os.path.join(base_dir, file))

