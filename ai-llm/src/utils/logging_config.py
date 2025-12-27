"""
Logging konfigürasyonu
"""

import logging
import sys

def setup_logging(level: str = "INFO"):
    """Logging'i yapılandır"""
    logging.basicConfig(
        level=getattr(logging, level.upper()),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    return logging.getLogger(__name__)

