import sys
with open('backend/crud.py', 'r') as f:
    in_enrich = False
    for line in f:
        if 'def _enrich_places_with_stats' in line:
            in_enrich = True
        if in_enrich:
            sys.stdout.write(line)
            if line.strip() == 'return result':
                break
