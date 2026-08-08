from sqlalchemy.orm import Session
from app.db.session import SessionLocal, Base, engine
from app.models.user import User
from app.core.security import get_password_hash

def seed_database():
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        existing_admin = db.query(User).filter(User.email == "vrajgoti07@gmail.com").first()

        if not existing_admin:
            admin_user = User(
                name="Vraj Goti",
                email="vrajgoti07@gmail.com",
                hashed_password=get_password_hash("123456789"),
                role="admin",
                plan="enterprise",
                avatar="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
            )
            db.add(admin_user)
            db.commit()
            print("Successfully seeded single admin account: vrajgoti07@gmail.com")
        else:
            print("Admin account vrajgoti07@gmail.com already present.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
