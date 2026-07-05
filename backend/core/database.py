"""SQLAlchemy async database setup + all ORM models."""
import uuid
from datetime import datetime
from typing import AsyncGenerator

from sqlalchemy import (
    Column, String, Float, Integer, Boolean, DateTime,
    ForeignKey, Text, JSON, Enum as SAEnum
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, relationship
import enum

from core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False, pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


# ─── Enums ───────────────────────────────────────────────────────────────────
class RiskLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class SensorType(str, enum.Enum):
    GAS = "gas"
    TEMPERATURE = "temperature"
    PRESSURE = "pressure"
    VIBRATION = "vibration"
    HUMIDITY = "humidity"
    FLOW = "flow"
    LEVEL = "level"
    CURRENT = "current"


class PermitType(str, enum.Enum):
    HOT_WORK = "hot_work"
    CONFINED_SPACE = "confined_space"
    ELECTRICAL = "electrical"
    HEIGHT_WORK = "height_work"
    CHEMICAL = "chemical"
    EXCAVATION = "excavation"
    RADIATION = "radiation"


class AlertStatus(str, enum.Enum):
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"


# ─── Models ──────────────────────────────────────────────────────────────────
class Plant(Base):
    __tablename__ = "plants"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    location = Column(String(200))
    plant_type = Column(String(100), default="petrochemical")
    risk_score = Column(Float, default=0.0)
    latitude = Column(Float)
    longitude = Column(Float)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    zones = relationship("Zone", back_populates="plant")


class Zone(Base):
    __tablename__ = "zones"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plant_id = Column(UUID(as_uuid=True), ForeignKey("plants.id"))
    name = Column(String(100), nullable=False)
    zone_code = Column(String(20), nullable=False)
    description = Column(Text)
    risk_score = Column(Float, default=0.0)
    risk_level = Column(SAEnum(RiskLevel), default=RiskLevel.LOW)
    max_workers = Column(Integer, default=10)
    is_restricted = Column(Boolean, default=False)
    svg_path = Column(Text)  # SVG path for plant map
    created_at = Column(DateTime, default=datetime.utcnow)
    plant = relationship("Plant", back_populates="zones")
    sensors = relationship("Sensor", back_populates="zone")
    workers = relationship("Worker", back_populates="zone")


class Equipment(Base):
    __tablename__ = "equipment"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plant_id = Column(UUID(as_uuid=True), ForeignKey("plants.id"))
    zone_id = Column(UUID(as_uuid=True), ForeignKey("zones.id"))
    equipment_id = Column(String(50), unique=True, nullable=False)  # e.g., P-203
    name = Column(String(200), nullable=False)
    equipment_type = Column(String(100))  # pump, compressor, valve, tank
    manufacturer = Column(String(100))
    model = Column(String(100))
    installation_date = Column(DateTime)
    last_maintenance = Column(DateTime)
    next_maintenance_due = Column(DateTime)
    maintenance_interval_days = Column(Integer, default=30)
    health_score = Column(Float, default=100.0)
    is_critical = Column(Boolean, default=False)
    status = Column(String(50), default="operational")  # operational, maintenance, fault
    metadata = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)


class Sensor(Base):
    __tablename__ = "sensors"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    zone_id = Column(UUID(as_uuid=True), ForeignKey("zones.id"))
    equipment_id = Column(UUID(as_uuid=True), ForeignKey("equipment.id"), nullable=True)
    sensor_id = Column(String(50), unique=True, nullable=False)  # e.g., H2S-ZC-01
    name = Column(String(200), nullable=False)
    sensor_type = Column(SAEnum(SensorType))
    unit = Column(String(20))
    current_value = Column(Float, default=0.0)
    min_normal = Column(Float)
    max_normal = Column(Float)
    warning_threshold = Column(Float)
    critical_threshold = Column(Float)
    is_online = Column(Boolean, default=True)
    last_reading_at = Column(DateTime, default=datetime.utcnow)
    mqtt_topic = Column(String(200))
    created_at = Column(DateTime, default=datetime.utcnow)
    zone = relationship("Zone", back_populates="sensors")
    readings = relationship("SensorReading", back_populates="sensor", cascade="all, delete")


class SensorReading(Base):
    __tablename__ = "sensor_readings"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sensor_id = Column(UUID(as_uuid=True), ForeignKey("sensors.id"))
    value = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    is_anomaly = Column(Boolean, default=False)
    sensor = relationship("Sensor", back_populates="readings")


class Worker(Base):
    __tablename__ = "workers"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plant_id = Column(UUID(as_uuid=True), ForeignKey("plants.id"))
    zone_id = Column(UUID(as_uuid=True), ForeignKey("zones.id"), nullable=True)
    employee_id = Column(String(50), unique=True)
    name = Column(String(200), nullable=False)
    role = Column(String(100))
    department = Column(String(100))
    shift = Column(String(20))  # morning, afternoon, night
    phone = Column(String(20))
    fcm_token = Column(String(200))
    certifications = Column(JSON, default=[])
    is_supervisor = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    zone = relationship("Zone", back_populates="workers")


class Permit(Base):
    __tablename__ = "permits"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plant_id = Column(UUID(as_uuid=True), ForeignKey("plants.id"))
    zone_id = Column(UUID(as_uuid=True), ForeignKey("zones.id"))
    permit_number = Column(String(50), unique=True)
    permit_type = Column(SAEnum(PermitType))
    description = Column(Text)
    worker_id = Column(UUID(as_uuid=True), ForeignKey("workers.id"))
    approved_by = Column(String(200))
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    status = Column(String(50), default="active")  # active, expired, closed, suspended
    ai_risk_score = Column(Float)
    ai_assessment = Column(JSON)
    conditions = Column(JSON, default=[])
    created_at = Column(DateTime, default=datetime.utcnow)


class Incident(Base):
    __tablename__ = "incidents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plant_id = Column(UUID(as_uuid=True), ForeignKey("plants.id"))
    zone_id = Column(UUID(as_uuid=True), ForeignKey("zones.id"), nullable=True)
    incident_number = Column(String(50), unique=True)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    incident_type = Column(String(100))  # near_miss, minor, major, fatality
    severity = Column(SAEnum(RiskLevel))
    occurred_at = Column(DateTime, nullable=False)
    reported_at = Column(DateTime, default=datetime.utcnow)
    root_cause = Column(Text)
    contributing_factors = Column(JSON, default=[])
    casualties = Column(Integer, default=0)
    financial_impact = Column(Float)
    timeline_data = Column(JSON, default=[])  # Array of timestamped events for replay
    sensor_snapshot = Column(JSON)  # Sensor values at time of incident
    permit_snapshot = Column(JSON)  # Active permits at time
    rca_report = Column(JSON)
    regulatory_report_url = Column(String(500))
    status = Column(String(50), default="open")  # open, investigating, closed
    created_at = Column(DateTime, default=datetime.utcnow)


class Alert(Base):
    __tablename__ = "alerts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plant_id = Column(UUID(as_uuid=True), ForeignKey("plants.id"))
    zone_id = Column(UUID(as_uuid=True), ForeignKey("zones.id"), nullable=True)
    sensor_id = Column(UUID(as_uuid=True), ForeignKey("sensors.id"), nullable=True)
    alert_type = Column(String(100))  # sensor_anomaly, compound_risk, permit_conflict, etc.
    title = Column(String(500), nullable=False)
    description = Column(Text)
    severity = Column(SAEnum(RiskLevel), default=RiskLevel.MEDIUM)
    status = Column(AlertStatus, default=AlertStatus.ACTIVE)
    risk_score = Column(Float)
    compound_factors = Column(JSON, default=[])  # For compound risk alerts
    ai_explanation = Column(Text)
    recommended_action = Column(Text)
    acknowledged_by = Column(String(200))
    acknowledged_at = Column(DateTime)
    resolved_at = Column(DateTime)
    is_compound = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class AgentSession(Base):
    __tablename__ = "agent_sessions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trigger_alert_id = Column(UUID(as_uuid=True), ForeignKey("alerts.id"), nullable=True)
    trigger_type = Column(String(100))  # risk_detected, manual, emergency
    context = Column(JSON)
    debate_transcript = Column(JSON, default=[])  # [{agent, message, timestamp}]
    final_decision = Column(Text)
    final_action = Column(String(100))
    status = Column(String(50), default="pending")  # pending, running, completed
    created_at = Column(DateTime, default=datetime.utcnow)


class ComplianceCheck(Base):
    __tablename__ = "compliance_checks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plant_id = Column(UUID(as_uuid=True), ForeignKey("plants.id"))
    regulation_id = Column(String(100))
    regulation_name = Column(String(500))
    is_compliant = Column(Boolean, nullable=False)
    violation_details = Column(Text)
    recommended_action = Column(Text)
    checked_at = Column(DateTime, default=datetime.utcnow)


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    equipment_id = Column(UUID(as_uuid=True), ForeignKey("equipment.id"))
    maintenance_type = Column(String(100))
    description = Column(Text)
    performed_by = Column(String(200))
    performed_at = Column(DateTime)
    next_due = Column(DateTime)
    cost = Column(Float)
    findings = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class ShiftLog(Base):
    __tablename__ = "shift_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plant_id = Column(UUID(as_uuid=True), ForeignKey("plants.id"))
    shift_name = Column(String(100))  # morning, afternoon, night
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    supervisor_id = Column(UUID(as_uuid=True), ForeignKey("workers.id"), nullable=True)
    handover_report = Column(JSON)
    plant_risk_score_start = Column(Float)
    plant_risk_score_end = Column(Float)
    incidents_count = Column(Integer, default=0)
    alerts_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class LLMConfig(Base):
    __tablename__ = "llm_configs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider = Column(String(50), nullable=False)  # gemini, openrouter, anthropic, ollama
    model = Column(String(100), nullable=False)
    api_key_encrypted = Column(String(500))
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)
    display_name = Column(String(200))
    config = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)


# ─── DB Init ─────────────────────────────────────────────────────────────────
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed initial data if empty
    from data.seed_runner import run_seeds
    await run_seeds()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
