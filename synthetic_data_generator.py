#!/usr/bin/env python3
"""
SafetyOS Synthetic Data Generator
Generates a complete safety dataset representing 'Indoil Refinery — Vizag Unit 3'
and exports it to json seed files or pushes it directly to the running backend.
"""
import sys
import json
import argparse
import random
from datetime import datetime, timedelta

# Static definitions
EQUIPMENT_TYPES = ["pump", "compressor", "tank", "valve", "heat_exchanger", "flare_stack"]
ZONES = ["ZA", "ZB", "ZC", "ZD", "ZE", "GATE"]
RISK_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

# 1. Regulations list
REGULATIONS = [
    {
        "id": "OISD-105-4.3",
        "title": "H2S Mandatory Evacuation Threshold",
        "authority": "OISD",
        "description": "Mandatory evacuation required when H2S exceeds 25ppm in any area with active confined space permit"
    },
    {
        "id": "OISD-116-2.1",
        "title": "Hot Work LEL Requirement",
        "authority": "OISD",
        "description": "Hot work prohibited when LEL exceeds 10% in the work area or adjacent zones"
    },
    {
        "id": "OISD-118-3.2",
        "title": "Rotating Equipment Vibration Limits",
        "authority": "OISD",
        "description": "Vibration on rotating equipment in hazardous zones must not exceed 7.1mm/s RMS"
    },
    {
        "id": "FACTORY-ACT-36",
        "title": "Confined Space Entry Prohibition",
        "authority": "Factories Act 1948",
        "description": "No worker shall enter a confined space without a valid gas test within the preceding 60 minutes"
    }
]

def generate_equipment():
    equipment = []
    for i in range(1, 45):
        eq_type = random.choice(EQUIPMENT_TYPES)
        zone = random.choice(ZONES[:-1])
        equipment.append({
            "id": f"EQ-{i:03d}",
            "name": f"{eq_type.replace('_', ' ').title()} {random.choice(['A','B','C'])}-{random.randint(100,999)}",
            "type": eq_type,
            "zone": zone,
            "status": "OPERATIONAL" if random.random() > 0.1 else "MAINTENANCE",
            "last_inspection": (datetime.now() - timedelta(days=random.randint(5, 60))).isoformat()
        })
    return equipment

def generate_sensors():
    sensors = []
    # Hardcoded known sensors for dashboard compatibility
    sensors.append({"id": "H2S-ZC-01", "name": "Compressor Bay 1 H2S Gas Sensor", "type": "H2S", "unit": "ppm", "zone": "ZC", "baseline": 2.0, "warning": 10.0, "critical": 25.0, "normal": [0.0, 5.0]})
    sensors.append({"id": "H2S-ZC-02", "name": "Compressor Bay 2 H2S Gas Sensor", "type": "H2S", "unit": "ppm", "zone": "ZC", "baseline": 2.0, "warning": 10.0, "critical": 25.0, "normal": [0.0, 5.0]})
    sensors.append({"id": "VIB-C301", "name": "Compressor C-301 Shaft Vibration", "type": "vibration", "unit": "mm/s", "zone": "ZC", "baseline": 3.4, "warning": 7.1, "critical": 9.0, "normal": [1.0, 4.5]})
    sensors.append({"id": "TEMP-C301", "name": "Compressor C-301 Casing Temp", "type": "temperature", "unit": "°C", "zone": "ZC", "baseline": 95.0, "warning": 125.0, "critical": 140.0, "normal": [70.0, 105.0]})
    sensors.append({"id": "LEL-ZB-01", "name": "Process Unit East LEL Gas Sensor", "type": "LEL", "unit": "%", "zone": "ZB", "baseline": 0.0, "warning": 10.0, "critical": 20.0, "normal": [0.0, 5.0]})

    # Add remaining synthetic sensors up to 32
    sensor_types = [
        ("H2S", "ppm", 2.0, 10.0, 25.0, [0.0, 5.0]),
        ("LEL", "%", 0.0, 10.0, 20.0, [0.0, 5.0]),
        ("CO", "ppm", 5.0, 25.0, 50.0, [0.0, 15.0]),
        ("vibration", "mm/s", 2.5, 7.1, 9.0, [1.0, 4.5]),
        ("temperature", "°C", 40.0, 85.0, 110.0, [30.0, 60.0]),
        ("pressure", "bar", 12.0, 25.0, 35.0, [8.0, 15.0]),
    ]
    for i in range(len(sensors) + 1, 33):
        t, unit, base, warn, crit, norm = random.choice(sensor_types)
        zone = random.choice(ZONES[:-2]) # Skip GATE and ZE
        sensors.append({
            "id": f"{t[:3].upper()}-{zone}-{i:02d}",
            "name": f"Zone {zone} {t.title()} Sensor {i}",
            "type": t,
            "unit": unit,
            "zone": zone,
            "baseline": base,
            "warning": warn,
            "critical": crit,
            "normal": norm
        })
    return sensors

def generate_workers():
    first_names = ["Ramesh", "Aditya", "Priya", "Suresh", "Vikram", "Amit", "Rajesh", "Sunita", "Deepak", "Vijay"]
    last_names = ["Kumar", "Singh", "Sharma", "Patel", "Nair", "Verma", "Menon", "Reddy", "Gupta", "Joshi"]
    workers = []
    for i in range(1, 51):
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        workers.append({
            "id": f"EMP-{i:03d}",
            "name": name,
            "role": random.choice(["Technician", "Operator", "Safety Supervisor", "Engineer", "Control Room Specialist"]),
            "zone": random.choice(ZONES),
            "shift": random.choice(["morning", "evening", "night"]),
            "is_supervisor": random.random() > 0.8,
            "blood_group": random.choice(["A+", "O+", "B+", "AB+", "A-", "O-"]),
            "certified_confined_space": random.random() > 0.5,
            "certified_hot_work": random.random() > 0.4
        })
    return workers

def generate_incidents():
    incidents = []
    categories = ["near_miss", "equipment_failure", "process_upset", "medical_emergency"]
    for i in range(1, 53):
        days_ago = random.randint(1, 2000)
        time = datetime.now() - timedelta(days=days_ago)
        inc_type = random.choice(categories)
        sev = random.choice(RISK_LEVELS)
        incidents.append({
            "id": f"inc-{i:03d}",
            "incident_number": f"INC-{time.year}-{i:04d}",
            "title": f"Incident in Zone {random.choice(ZONES[:-2])} — {inc_type.replace('_',' ').title()}",
            "description": f"Detailed description for synthetic incident record {i:03d} involving safety thresholds.",
            "incident_type": inc_type,
            "severity": sev,
            "occurred_at": time.isoformat(),
            "zone": random.choice(ZONES[:-2]),
            "casualties": 0 if sev != "CRITICAL" else random.randint(0, 1),
            "financial_impact": random.randint(50000, 5000000),
            "root_cause": "Component failure due to fatigue or lack of preventive service",
            "ai_would_have_caught": random.random() > 0.2,
            "ai_intervention_time": f"{random.randint(10, 120)} minutes before event"
        })
    return incidents

def generate_permits(workers):
    permits = []
    types = ["confined_space", "hot_work", "maintenance", "electrical", "height_work"]
    statuses = ["active", "closed", "expired", "suspended"]
    for i in range(1, 31):
        worker = random.choice(workers)
        permits.append({
            "id": f"ptw-{i:03d}",
            "permit_number": f"PTW-2026-{i:04d}",
            "permit_type": random.choice(types),
            "description": f"Routine check and maintenance work order {i}",
            "zone": random.choice(ZONES[:-2]),
            "worker_name": worker["name"],
            "worker_id": worker["id"],
            "approved_by": "Safety Officer",
            "start_time": (datetime.now() - timedelta(hours=random.randint(1, 10))).isoformat(),
            "end_time": (datetime.now() + timedelta(hours=random.randint(1, 8))).isoformat(),
            "status": random.choice(statuses),
            "ai_risk_score": random.randint(10, 95)
        })
    return permits

def main():
    parser = argparse.ArgumentParser(description="SafetyOS Synthetic Data Generator")
    parser.add_argument("--export", action="store_true", help="Export dataset to JSON seed files")
    parser.add_argument("--push", action="store_true", help="Push dataset directly to the running backend")
    args = parser.parse_args()

    print("Generating Indoil Refinery — Vizag Unit 3 Dataset...")
    equipment = generate_equipment()
    sensors = generate_sensors()
    workers = generate_workers()
    incidents = generate_incidents()
    permits = generate_permits(workers)

    dataset = {
        "regulations": REGULATIONS,
        "equipment": equipment,
        "sensors": sensors,
        "workers": workers,
        "incidents": incidents,
        "permits": permits
    }

    print(f"Generated {len(equipment)} equipment nodes")
    print(f"Generated {len(sensors)} sensor nodes")
    print(f"Generated {len(workers)} worker profiles")
    print(f"Generated {len(incidents)} historical incidents")
    print(f"Generated {len(permits)} permit logs")

    if args.export:
        with open("synthetic_seeds.json", "w") as f:
            json.dump(dataset, f, indent=2)
        print("✓ Dataset successfully exported to synthetic_seeds.json")

    if args.push:
        import urllib.request
        try:
            req = urllib.request.Request(
                "http://localhost:8000/sensors/demo/trigger-crisis",
                method="POST"
            )
            with urllib.request.urlopen(req) as response:
                print(f"✓ Crisis triggered in running backend. Response: {response.status}")
        except Exception as e:
            print(f"✗ Failed to push demo crisis to running backend: {e}")

    if not args.export and not args.push:
        print("\nUse --export to write JSON files or --push to feed active backend simulator.")

if __name__ == "__main__":
    main()
