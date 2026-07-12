"""Connectivity API routes — simple endpoints to manage data sources (demo mode).
"""
from fastapi import APIRouter, HTTPException
from typing import List

from backend.integrations.connectivity_manager import manager, DataSource, ProtocolType
from fastapi import BackgroundTasks


def _src_to_dict(s: DataSource):
    return {
        'id': s.id,
        'name': s.name,
        'protocol': s.protocol.value,
        'host': s.host,
        'port': s.port,
        'status': s.status,
        'last_seen': s.last_seen.isoformat() if s.last_seen else None,
        'error_message': s.error_message,
    }

router = APIRouter()


@router.get("/sources", response_model=List[dict])
async def list_sources():
    return [s.__dict__ for s in manager.list_sources()]


@router.post("/sources")
async def add_source(payload: dict):
    try:
        src = DataSource(
            id=payload["id"],
            name=payload.get("name", payload["id"]),
            protocol=ProtocolType(payload.get("protocol", "simulated")),
            host=payload.get("host", "localhost"),
            port=int(payload.get("port", 0)),
            config=payload.get("config", {}),
        )
        await manager.add_source(src)
        return {"status": "ok", "id": src.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post('/start_demo')
async def start_demo():
    """Register a few simulated sources and start the connectivity manager in demo mode."""
    demo_sources = [
        {
            'id': 'sim-plant-mqtt',
            'name': 'Simulated MQTT Broker',
            'protocol': 'simulated',
            'host': 'localhost',
            'port': 1883,
            'config': {'interval': 2}
        }
    ]
    try:
        for s in demo_sources:
            src = DataSource(
                id=s['id'],
                name=s['name'],
                protocol=ProtocolType(s['protocol']),
                host=s['host'],
                port=s['port'],
                config=s.get('config', {})
            )
            await manager.add_source(src)

        # Start all connectors
        await manager.connect_all()
        return {'status': 'ok', 'message': 'Demo connectivity started', 'sources': [x.id for x in manager.list_sources()]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete('/sources/{source_id}')
async def delete_source(source_id: str):
    """Stop and remove a source."""
    ok = await manager.remove_source(source_id)
    if not ok:
        raise HTTPException(status_code=404, detail='Source not found')
    return {'status': 'ok', 'id': source_id}


@router.post('/sources/{source_id}/start')
async def start_source(source_id: str):
    ok = await manager.start_source(source_id)
    if not ok:
        raise HTTPException(status_code=404, detail='Source not running or not found')
    return {'status': 'ok', 'id': source_id}


@router.post('/sources/{source_id}/stop')
async def stop_source(source_id: str):
    ok = await manager.stop_source(source_id)
    if not ok:
        raise HTTPException(status_code=404, detail='Source not running or not found')
    return {'status': 'ok', 'id': source_id}


@router.get('/metrics')
async def metrics():
    return manager.metrics
