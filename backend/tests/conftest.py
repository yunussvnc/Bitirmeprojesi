import os
import sys

# Add the 'backend' folder to sys.path to resolve imports like 'main' and 'database'
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
