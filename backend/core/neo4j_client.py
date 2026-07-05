"""Neo4j knowledge graph client."""
import logging
from typing import Optional
from neo4j import AsyncGraphDatabase, AsyncDriver
from core.config import settings

logger = logging.getLogger(__name__)
_driver: Optional[AsyncDriver] = None


async def init_neo4j():
    global _driver
    try:
        _driver = AsyncGraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
        )
        await _driver.verify_connectivity()
        await _create_constraints()
        logger.info("Neo4j connected")
    except Exception as e:
        logger.warning(f"Neo4j unavailable: {e} — knowledge graph features will be limited")


def get_driver() -> Optional[AsyncDriver]:
    return _driver


async def _create_constraints():
    """Create Neo4j uniqueness constraints and indexes."""
    async with _driver.session() as session:
        constraints = [
            "CREATE CONSTRAINT IF NOT EXISTS FOR (e:Equipment) REQUIRE e.equipment_id IS UNIQUE",
            "CREATE CONSTRAINT IF NOT EXISTS FOR (z:Zone) REQUIRE z.zone_code IS UNIQUE",
            "CREATE CONSTRAINT IF NOT EXISTS FOR (i:Incident) REQUIRE i.incident_number IS UNIQUE",
            "CREATE CONSTRAINT IF NOT EXISTS FOR (r:Regulation) REQUIRE r.regulation_id IS UNIQUE",
        ]
        for c in constraints:
            try:
                await session.run(c)
            except Exception:
                pass  # Constraint may already exist


async def run_query(cypher: str, params: dict = None) -> list:
    """Run a Cypher query and return records as dicts."""
    if not _driver:
        return []
    async with _driver.session() as session:
        result = await session.run(cypher, params or {})
        records = await result.data()
        return records


async def seed_knowledge_graph():
    """Seed Neo4j with initial plant knowledge graph."""
    if not _driver:
        return

    # Zones
    zone_data = [
        {"zone_code": "ZA", "name": "Zone A — Tank Farm", "risk_level": "MEDIUM"},
        {"zone_code": "ZB", "name": "Zone B — Process Unit", "risk_level": "HIGH"},
        {"zone_code": "ZC", "name": "Zone C — Compressor Bay", "risk_level": "CRITICAL"},
        {"zone_code": "ZD", "name": "Zone D — Control Room", "risk_level": "LOW"},
        {"zone_code": "ZE", "name": "Zone E — Flare Stack", "risk_level": "HIGH"},
    ]

    equipment_data = [
        {"id": "P-101", "name": "Crude Feed Pump", "type": "pump", "zone": "ZA"},
        {"id": "P-203", "name": "High-Pressure Pump", "type": "pump", "zone": "ZB"},
        {"id": "C-301", "name": "Gas Compressor Unit 1", "type": "compressor", "zone": "ZC"},
        {"id": "C-302", "name": "Gas Compressor Unit 2", "type": "compressor", "zone": "ZC"},
        {"id": "V-401", "name": "Crude Storage Tank A", "type": "tank", "zone": "ZA"},
        {"id": "V-402", "name": "H2S Scrubber", "type": "vessel", "zone": "ZB"},
        {"id": "HX-501", "name": "Feed/Effluent Exchanger", "type": "heat_exchanger", "zone": "ZB"},
    ]

    regulation_data = [
        {"id": "OISD-105-4.3", "title": "Mandatory evacuation when H2S > 25ppm in confined space", "authority": "OISD"},
        {"id": "OISD-116-2.1", "title": "Additional gas test required for hot work near flammable area", "authority": "OISD"},
        {"id": "OISD-118-3.2", "title": "Vibration limits for rotating equipment in hazardous zones", "authority": "OISD"},
        {"id": "FACTORY-ACT-36", "title": "Prohibition of entry to confined space without gas test", "authority": "Factories Act"},
        {"id": "DGFASLI-2019-7", "title": "Permit-to-Work system requirements for hot work", "authority": "DGFASLI"},
    ]

    async with _driver.session() as session:
        # Create zones
        for z in zone_data:
            await session.run(
                "MERGE (z:Zone {zone_code: $zone_code}) SET z.name = $name, z.risk_level = $risk_level",
                z
            )
        # Create equipment and link to zones
        for eq in equipment_data:
            await session.run(
                """
                MERGE (e:Equipment {equipment_id: $id})
                SET e.name = $name, e.type = $type
                WITH e
                MATCH (z:Zone {zone_code: $zone})
                MERGE (e)-[:LOCATED_IN]->(z)
                """,
                eq
            )
        # Create regulations
        for reg in regulation_data:
            await session.run(
                "MERGE (r:Regulation {regulation_id: $id}) SET r.title = $title, r.authority = $authority",
                reg
            )
