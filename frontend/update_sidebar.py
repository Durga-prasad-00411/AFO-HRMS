import re

with open('src/components/Sidebar.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the role check to define `prefix`
if 'const prefix = userRole' not in content:
    content = content.replace(
        'const userRole = localStorage.getItem("role");',
        'const userRole = localStorage.getItem("role");\n  const prefix = userRole === "SUPER_ADMIN" ? "/superadmin" : (userRole === "ADMIN" ? "/admin" : (userRole === "HR" ? "/hr" : ""));'
    )

    # Replace /superadmin/ literally inside path mappings and navigate
    content = re.sub(r'path:\s*\"/superadmin(/.*?)\"', r'path: `${prefix}\1`', content)
    content = re.sub(r'navigate\(\"/superadmin(/.*?)\"\)', r'navigate(`${prefix}\1`)', content)
    content = re.sub(r'isActive\(\"/superadmin(/.*?)\"\)', r'isActive(`${prefix}\1`)', content)
    
    # Replace /admin/ literally inside path mappings (for HR)
    content = re.sub(r'path:\s*\"/admin(/.*?)\"', r'path: `${prefix}\1`', content)
    content = re.sub(r'navigate\(\"/admin(/.*?)\"\)', r'navigate(`${prefix}\1`)', content)
    content = re.sub(r'isActive\(\"/admin(/.*?)\"\)', r'isActive(`${prefix}\1`)', content)

    # Replace absolute /superadmin and /admin
    content = re.sub(r'navigate\(\"/superadmin\"\)', r'navigate(`${prefix}`)', content)
    content = re.sub(r'navigate\(\"/admin\"\)', r'navigate(`${prefix}`)', content)
    content = re.sub(r'isActive\(\"/superadmin\"\)', r'isActive(`${prefix}`)', content)
    content = re.sub(r'isActive\(\"/admin\"\)', r'isActive(`${prefix}`)', content)
    
    content = re.sub(r'location\.pathname === \"/superadmin\"', r'location.pathname === `${prefix}`', content)
    content = re.sub(r'location\.pathname === \"/admin\"', r'location.pathname === `${prefix}`', content)

with open('src/components/Sidebar.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("done")
