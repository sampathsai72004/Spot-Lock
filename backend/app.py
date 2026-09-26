from flask import Flask
from backend.config import LocalDevelopmentConfig
from backend.extensions import db, cache, mail
from backend.models.models import User, Role

from flask_security import Security, SQLAlchemyUserDatastore
from flask_cors import CORS
from flask_migrate import Migrate

from backend.routes.routes_user import user_bp
from backend.routes.routes import bp as main_bp
from backend.routes.routes_admin import admin_bp

def create_app():
    app = Flask(__name__, static_folder='../frontend', static_url_path='/')
    app.config.from_object(LocalDevelopmentConfig)

    app.config['CACHE_TYPE'] = 'SimpleCache'
    app.config['CACHE_DEFAULT_TIMEOUT'] = 300
    db.init_app(app)
    cache.init_app(app)
    mail.init_app(app)
    Migrate(app, db)
    
    datastore = SQLAlchemyUserDatastore(db, User, Role)
    app.security = Security(app, datastore=datastore, register_blueprint=False)
    CORS(app, supports_credentials=True)

    app.register_blueprint(main_bp)
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(user_bp)

    return app

app = create_app()

from backend import create_initial_data
with app.app_context():
    create_initial_data.create_initial_data(app)

if __name__ == '__main__':
    app.run(debug=True, port=5003)
