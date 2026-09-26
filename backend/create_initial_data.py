from backend.models.models import db
from flask_security.utils import hash_password

def create_initial_data(app):
   
    with app.app_context():
        db.create_all()

        userdatastore = app.security.datastore

        roles_to_create = [
            {"name": "admin", "description": "Superuser"},
            {"name": "user", "description": "General user"},
        ]

        for role_data in roles_to_create:
            if not userdatastore.find_role(role_data["name"]):
                userdatastore.create_role(**role_data)

        admin_email = "spotlock.noreply@gmail.com"
        if not userdatastore.find_user(email=admin_email):
            userdatastore.create_user(
                email=admin_email,
                password=hash_password("pass"),
                fs_uniquifier="admin-uniquifier",
                roles=["admin"],
                active=True
            )

        user_email = "user01@study.iitm.ac.in"
        if not userdatastore.find_user(email=user_email):
            userdatastore.create_user(
                email=user_email,
                password=hash_password("pass"),
                fs_uniquifier="user-uniquifier",
                roles=["user"],
                active=True
            )


        db.session.commit()
        print("Database initialized successfully with default data.")
