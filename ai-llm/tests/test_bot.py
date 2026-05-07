import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from chatbot_interaktif import MekanChatbot

def test():
    bot = MekanChatbot()
    bot.search_mekan("Kadikoyde deniz manzarali, sakin bir kahve icmek istiyorum")

if __name__ == "__main__":
    test()
