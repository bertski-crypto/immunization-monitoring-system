"""
Flask extensions module to prevent duplicate instantiation
when app.py is executed both as __main__ and imported as a module.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from sqlalchemy import event
from sqlalchemy.engine import Engine
import sqlite3

# Extension instances
db = SQLAlchemy()
jwt = JWTManager()

# SQLite foreign key enforcement
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
