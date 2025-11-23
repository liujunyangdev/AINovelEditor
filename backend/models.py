from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)

    characters = relationship("Character", back_populates="project")
    story_outline = relationship("StoryOutline", uselist=False, back_populates="project")
    chapters = relationship("Chapter", back_populates="project")


class Character(Base):
    __tablename__ = "characters"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    
    # The generated character data
    data = Column(JSON)

    project = relationship("Project", back_populates="characters")


class StoryOutline(Base):
    __tablename__ = "story_outlines"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), unique=True)

    # The generated outline data
    data = Column(JSON)

    project = relationship("Project", back_populates="story_outline")


class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    chapter_index = Column(Integer)

    # The generated chapter plan data
    plan_data = Column(JSON)
    
    # The expanded chapter text
    content = Column(Text, nullable=True)

    project = relationship("Project", back_populates="chapters")
