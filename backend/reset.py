import crud
import os

new_hash = crud.get_password_hash("123456")
cmd = f"docker exec ai_mekan_oneri_docker psql -U postgres -d ai_mekan_oneri_db -c \"UPDATE users SET password_hash = '{new_hash}' WHERE email='utku@mail.com';\""
os.system(cmd)
print("Password reset successful to: 123456")
