import os
from flask_migrate import upgrade
from app import create_app, db
from app.models import User, Role


def deploy():
    """Run deployment tasks."""
    app = create_app(os.getenv('FLASK_ENV', 'production'))
    
    with app.app_context():
        # Create database tables
        db.create_all()
        
        # Migrate database to latest revision
        upgrade()
        
        # Create default roles
        create_default_roles()
        
        # Create default admin user
        create_default_admin()


def create_default_roles():
    """Create default roles if they don't exist"""
    roles = ['admin', 'user', 'moderator']
    
    for role_name in roles:
        role = Role.query.filter_by(name=role_name).first()
        if not role:
            role = Role(name=role_name, description=f'Default {role_name} role')
            db.session.add(role)
    
    db.session.commit()
    print("Default roles created successfully")


def create_default_admin():
    """Create default admin user if it doesn't exist"""
    admin_email = os.getenv('ADMIN_EMAIL', 'admin@example.com')
    admin_username = os.getenv('ADMIN_USERNAME', 'admin')
    admin_password = os.getenv('ADMIN_PASSWORD', 'AdminPassword123!')
    
    admin_user = User.query.filter_by(email=admin_email).first()
    
    if not admin_user:
        admin_user = User(
            email=admin_email,
            username=admin_username,
            first_name='System',
            last_name='Administrator',
            is_active=True,
            is_verified=True
        )
        admin_user.set_password(admin_password)
        
        # Add admin role
        admin_role = Role.query.filter_by(name='admin').first()
        if admin_role:
            admin_user.roles.append(admin_role)
        
        db.session.add(admin_user)
        db.session.commit()
        
        print(f"Default admin user created: {admin_email}")
    else:
        print("Admin user already exists")


if __name__ == '__main__':
    deploy()