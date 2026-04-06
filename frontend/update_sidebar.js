const fs = require('fs');
let content = fs.readFileSync('src/components/Sidebar.jsx', 'utf8');

if (!content.includes('const prefix = userRole')) {
    content = content.replace(
      'const userRole = localStorage.getItem("role");',
      `const userRole = localStorage.getItem("role");\n  const prefix = userRole === "SUPER_ADMIN" ? "/superadmin" : (userRole === "ADMIN" ? "/admin" : (userRole === "HR" ? "/hr" : ""));`
    );

    content = content.replace(/path:\s*\"\/superadmin(\/[a-zA-Z0-9-]+)\"/g, 'path: `${prefix}$1`');
    content = content.replace(/navigate\(\"\/superadmin(\/[a-zA-Z0-9-]+)\"\)/g, 'navigate(`${prefix}$1`)');

    content = content.replace(/path:\s*\"\/admin(\/[a-zA-Z0-9-]+)\"/g, 'path: `${prefix}$1`');
    content = content.replace(/navigate\(\"\/admin(\/[a-zA-Z0-9-]+)\"\)/g, 'navigate(`${prefix}$1`)');

    content = content.replace(/isActive\(\"\/superadmin(\/[a-zA-Z0-9-]+)\"\)/g, 'isActive(`${prefix}$1`)');
    content = content.replace(/isActive\(\"\/admin(\/[a-zA-Z0-9-]+)\"\)/g, 'isActive(`${prefix}$1`)');

    content = content.replace(/navigate\(\"\/superadmin\"\)/g, 'navigate(`${prefix}`)');
    content = content.replace(/navigate\(\"\/admin\"\)/g, 'navigate(`${prefix}`)');
    content = content.replace(/isActive\(\"\/superadmin\"\)/g, 'isActive(`${prefix}`)');
    
    // Also the manual logic checks
    content = content.replace(/location\.pathname === \"\/superadmin\"/g, 'location.pathname === `${prefix}`');
    content = content.replace(/location\.pathname === \"\/admin\"/g, 'location.pathname === `${prefix}`');
    
    
    // There is one tricky line for navigation click in Sidebar.jsx around line 111:
    // if (role === "SUPER_ADMIN" || role === "ADMIN") navigate("/superadmin");
    // else if (role === "HR") navigate("/admin");
    // This will become:
    // if (role === "SUPER_ADMIN" || role === "ADMIN") navigate(prefix);
    // else if (role === "HR") navigate(prefix); // which is basically exactly the prefix!
    
    // I will let it be replaced by navigate(`${prefix}`) which works fine.
    
    fs.writeFileSync('src/components/Sidebar.jsx', content);
    console.log('Sidebar updated');
} else {
    console.log('Sidebar already updated');
}
