"""
SafetyOS — Synthetic Data Generator
Generates realistic industrial machine + sensor data and pushes it
to your SafetyOS backend via REST API.

Usage:
    python synthetic_data_generator.py              # Generate + print JSON
    python synthetic_data_generator.py --push       # Push to running backend
    python synthetic_data_generator.py --export     # Save all files to ./seed_data/
"""

import json
import random
import argparse
import os
from datetime import datetime, timedelta
from faker import Faker

fake = Faker("en_IN")
random.seed(42)

BASE_URL = "http://localhost:8000"

# ─── PLANT LAYOUT ────────────────────────────────────────────────────────────
ZONES = [
    {"id": "ZA", "name": "Zone A — Tank Farm",         "area_sqm": 4200, "max_workers": 12, "hazard_class": "HIGH"},
    {"id": "ZB", "name": "Zone B — Processing Unit",   "area_sqm": 3100, "max_workers": 20, "hazard_class": "MEDIUM"},
    {"id": "ZC", "name": "Zone C — Coke Battery",      "area_sqm": 2800, "max_workers": 8,  "hazard_class": "CRITICAL"},
    {"id": "ZD", "name": "Zone D — Control Room",      "area_sqm": 600,  "max_workers": 6,  "hazard_class": "LOW"},
    {"id": "ZE", "name": "Zone E — Utilities Block",   "area_sqm": 1900, "max_workers": 10, "hazard_class": "MEDIUM"},
    {"id": "ZF", "name": "Zone F — Flare Stack Area",  "area_sqm": 900,  "max_workers": 4,  "hazard_class": "HIGH"},
]

EQUIPMENT_TEMPLATES = [
    {"type": "Centrifugal Pump",     "prefix": "P",   "count": 8,  "zone": "ZB"},
    {"type": "Reciprocating Compressor","prefix":"C",  "count": 4,  "zone": "ZA"},
    {"type": "Storage Tank",         "prefix": "T",   "count": 6,  "zone": "ZA"},
    {"type": "Heat Exchanger",       "prefix": "HE",  "count": 5,  "zone": "ZB"},
    {"type": "Pressure Vessel",      "prefix": "V",   "count": 4,  "zone": "ZC"},
    {"type": "Control Valve",        "prefix": "CV",  "count": 12, "zone": "ZB"},
    {"type": "Gas Flare",            "prefix": "FL",  "count": 2,  "zone": "ZF"},
    {"type": "Cooling Tower",        "prefix": "CT",  "count": 3,  "zone": "ZE"},
]

SENSOR_TYPES = [
    {"type": "H2S Gas",         "unit": "ppm",   "normal": (0, 8),    "warn": 10,  "critical": 25},
    {"type": "CO Gas",          "unit": "ppm",   "normal": (0, 20),   "warn": 25,  "critical": 50},
    {"type": "LEL",             "unit": "%LEL",  "normal": (0, 5),    "warn": 10,  "critical": 25},
    {"type": "Temperature",     "unit": "°C",    "normal": (55, 85),  "warn": 95,  "critical": 110},
    {"type": "Pressure",        "unit": "bar",   "normal": (2.8, 5.5),"warn": 6.2, "critical": 7.5},
    {"type": "Vibration",       "unit": "mm/s",  "normal": (0, 4.5),  "warn": 7.0, "critical": 11.2},
    {"type": "Humidity",        "unit": "%RH",   "normal": (35, 70),  "warn": 80,  "critical": 90},
    {"type": "Flow Rate",       "unit": "m³/h",  "normal": (10, 45),  "warn": 50,  "critical": 58},
    {"type": "O2 Level",        "unit": "%",     "normal": (19.5,21), "warn": 19,  "critical": 17},
    {"type": "Noise Level",     "unit": "dB",    "normal": (65, 85),  "warn": 95,  "critical": 110},
]

CERTIFICATIONS = [
    "NEBOSH IGC", "First Aid Level 2", "Confined Space Entry",
    "Hot Work Supervisor", "H2S Awareness", "Fire Warden",
    "Scaffold Inspector", "Electrical Safety"
]

INCIDENT_TYPES = [
    "Gas Leak — H2S",
    "Gas Leak — CO",
    "Confined Space Emergency",
    "Pump Seal Failure",
    "Pressure Relief Valve Activation",
    "Electrical Fault",
    "Fire — Small (Contained)",
    "Near-Miss — Slip/Trip",
    "Chemical Spill — Minor",
    "Equipment Failure — Compressor",
    "Hot Work Incident",
    "Permit Violation",
    "Worker Injury — Minor",
    "Instrument Malfunction",
    "Valve Failure — Stuck Open",
]

PERMIT_TYPES = [
    "Hot Work Permit",
    "Confined Space Entry Permit",
    "Electrical Isolation Permit",
    "Cold Work Permit",
    "Height Work Permit",
    "Excavation Permit",
    "Radiography Permit",
]

REGULATIONS = [
    {"id": "OISD-105-4.3", "title": "Confined Space Entry Requirements", "authority": "OISD"},
    {"id": "OISD-116-2.1", "title": "Hot Work Permit in Hazardous Areas", "authority": "OISD"},
    {"id": "OISD-118-3.5", "title": "Gas Detection System Maintenance", "authority": "OISD"},
    {"id": "OISD-137-1.2", "title": "Personal Protective Equipment", "authority": "OISD"},
    {"id": "FA-36-1948",   "title": "Factories Act — Dangerous Operations", "authority": "Govt of India"},
    {"id": "FA-41-1948",   "title": "Factories Act — Precautions Against Fire", "authority": "Govt of India"},
    {"id": "DGFASLI-7",    "title": "Dock Workers Safety Standards", "authority": "DGFASLI"},
    {"id": "DGMS-14",      "title": "Mines Safety Regulation 14", "authority": "DGMS"},
    {"id": "EPA-HW-2016",  "title": "Hazardous Waste Management Rules", "authority": "MoEFCC"},
    {"id": "PESO-GC-3",    "title": "Gas Cylinder Rules — Storage Limits", "authority": "PESO"},
]


# ─── GENERATORS ─────────────────────────────────────────────────────────────
def gen_equipment():
    equipment = []
    eq_id = 100
    for tmpl in EQUIPMENT_TEMPLATES:
        for i in range(1, tmpl["count"] + 1):
            tag = f"{tmpl['prefix']}-{eq_id}"
            eq_id += 1
            install_date = fake.date_between(start_date="-12y", end_date="-1y")
            last_maint   = fake.date_between(start_date="-180d", end_date="today")
            next_maint   = last_maint + timedelta(days=random.randint(30, 180))
            equipment.append({
                "id":                tag,
                "name":              f"{tmpl['type']} {tag}",
                "type":              tmpl["type"],
                "zone_id":           tmpl["zone"],
                "manufacturer":      random.choice(["Flowserve", "KSB", "Sulzer", "Grundfos", "Siemens", "ABB", "Emerson"]),
                "model":             f"Model-{random.randint(1000,9999)}",
                "serial_number":     fake.bothify(text="??-######"),
                "installation_date": str(install_date),
                "last_maintenance":  str(last_maint),
                "next_maintenance":  str(next_maint),
                "status":            random.choices(
                                         ["RUNNING", "RUNNING", "RUNNING", "STANDBY", "MAINTENANCE", "FAULTY"],
                                         weights=[60, 60, 60, 15, 10, 5])[0],
                "criticality":       random.choice(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
                "maintenance_cost_inr": random.randint(15000, 450000),
                "replacement_cost_inr": random.randint(200000, 8500000),
                "hours_since_overhaul": random.randint(200, 8760),
                "design_life_years": random.randint(15, 30),
            })
    return equipment


def gen_sensors(equipment):
    sensors = []
    sensor_id = 1
    zone_sensor_counts = {z["id"]: 0 for z in ZONES}

    for zone in ZONES:
        # 3–6 sensors per zone
        zone_sensor_types = random.sample(SENSOR_TYPES, k=random.randint(3, 6))
        for st in zone_sensor_types:
            lo, hi = st["normal"]
            current_val = round(random.uniform(lo, hi), 2)
            sensors.append({
                "id":           f"SEN-{sensor_id:03d}",
                "tag":          f"{st['type'][:3].upper()}-{zone['id']}-{sensor_id:02d}",
                "name":         f"{st['type']} Sensor — {zone['name']}",
                "type":         st["type"],
                "unit":         st["unit"],
                "zone_id":      zone["id"],
                "normal_min":   lo,
                "normal_max":   hi,
                "warning_threshold":  st["warn"],
                "critical_threshold": st["critical"],
                "current_value":      current_val,
                "status":        "NORMAL" if lo <= current_val <= hi else "WARNING",
                "last_calibration":   str(fake.date_between(start_date="-365d", end_date="-30d")),
                "calibration_due":    str(fake.date_between(start_date="+30d",  end_date="+365d")),
                "manufacturer":       random.choice(["Honeywell", "MSA Safety", "Dräger", "Emerson", "ABB"]),
                "model":              f"GD-{random.randint(100,999)}",
                "installed_year":     random.randint(2015, 2023),
            })
            sensor_id += 1

    # Attach a few sensors directly to equipment
    for eq in random.sample(equipment, k=min(8, len(equipment))):
        st = random.choice(SENSOR_TYPES[:6])
        lo, hi = st["normal"]
        sensors.append({
            "id":           f"SEN-{sensor_id:03d}",
            "tag":          f"{st['type'][:3].upper()}-{eq['id']}-{sensor_id:02d}",
            "name":         f"{st['type']} — {eq['name']}",
            "type":         st["type"],
            "unit":         st["unit"],
            "zone_id":      eq["zone_id"],
            "equipment_id": eq["id"],
            "normal_min":   lo,
            "normal_max":   hi,
            "warning_threshold":  st["warn"],
            "critical_threshold": st["critical"],
            "current_value":      round(random.uniform(lo, hi), 2),
            "status":        "NORMAL",
            "last_calibration":   str(fake.date_between(start_date="-365d", end_date="-30d")),
            "calibration_due":    str(fake.date_between(start_date="+30d",  end_date="+365d")),
            "manufacturer":       random.choice(["Honeywell", "MSA Safety", "Dräger", "Emerson", "ABB"]),
            "model":              f"GD-{random.randint(100,999)}",
            "installed_year":     random.randint(2015, 2023),
        })
        sensor_id += 1

    return sensors


def gen_workers():
    workers = []
    for i in range(1, 51):
        zone = random.choice(ZONES)
        shift = random.choice(["MORNING (06:00–14:00)", "AFTERNOON (14:00–22:00)", "NIGHT (22:00–06:00)"])
        certs = random.sample(CERTIFICATIONS, k=random.randint(2, 5))
        workers.append({
            "id":              f"W-{i:03d}",
            "name":            fake.name(),
            "employee_id":     fake.bothify(text="EMP-#####"),
            "role":            random.choice(["Safety Officer", "Maintenance Engineer", "Process Operator",
                                              "Shift Supervisor", "Instrument Technician", "Electrical Engineer",
                                              "Chemical Engineer", "HSE Manager"]),
            "department":      random.choice(["Operations", "Maintenance", "HSE", "Instrumentation", "Electrical"]),
            "current_zone":    zone["id"],
            "shift":           shift,
            "phone":           fake.phone_number(),
            "email":           fake.company_email(),
            "certifications":  certs,
            "cert_expiry":     str(fake.date_between(start_date="+30d", end_date="+730d")),
            "emergency_contact": fake.name(),
            "blood_group":     random.choice(["A+", "B+", "O+", "AB+", "A-", "O-"]),
            "years_experience": random.randint(1, 28),
            "last_safety_training": str(fake.date_between(start_date="-365d", end_date="-7d")),
        })
    return workers


def gen_incidents(workers):
    incidents = []
    base_date = datetime.now() - timedelta(days=365 * 7)  # 7 years back

    for i in range(1, 53):
        incident_date = base_date + timedelta(days=random.randint(0, 365 * 7))
        zone = random.choice(ZONES)
        involved = random.sample(workers, k=random.randint(1, 3))
        itype = random.choice(INCIDENT_TYPES)

        severity = random.choices(
            ["MINOR", "MODERATE", "SERIOUS", "CRITICAL"],
            weights=[45, 30, 15, 10]
        )[0]

        incidents.append({
            "id":               f"INC-{i:04d}",
            "type":             itype,
            "date":             incident_date.strftime("%Y-%m-%d"),
            "time":             f"{random.randint(0,23):02d}:{random.randint(0,59):02d}",
            "zone_id":          zone["id"],
            "zone_name":        zone["name"],
            "severity":         severity,
            "injuries":         random.randint(0, 3) if severity in ["SERIOUS","CRITICAL"] else 0,
            "fatalities":       random.choices([0, 1], weights=[95, 5])[0] if severity == "CRITICAL" else 0,
            "property_damage_inr": random.randint(0, 5000000) if severity != "MINOR" else 0,
            "production_loss_hrs": round(random.uniform(0, 48), 1),
            "root_cause":       random.choice([
                "Inadequate pre-job hazard assessment",
                "Failure to follow procedure",
                "Equipment failure — maintenance overdue",
                "Permit system breakdown",
                "Inadequate supervision",
                "Environmental conditions",
                "Communication failure between shifts",
                "Sensor malfunction — undetected",
            ]),
            "contributing_factors": random.sample([
                "Overdue inspection", "Understaffing", "Time pressure",
                "Inadequate training", "Worn PPE", "Weather conditions",
                "Simultaneous operations", "Recent procedure change"
            ], k=random.randint(1, 3)),
            "involved_workers": [w["id"] for w in involved],
            "preventable":      random.choice([True, True, True, False]),
            "reported_to":      random.choice(["Factory Inspector", "DGFASLI", "Internal Only", "OISD Board"]),
            "corrective_actions": random.sample([
                "Revised permit-to-work procedure",
                "Additional gas detector installed",
                "Mandatory refresher training conducted",
                "Shutdown procedure updated",
                "Equipment replaced",
                "New SOP drafted and approved",
                "Safety audit conducted",
            ], k=random.randint(2, 4)),
            "lessons_learned":  f"Incident highlighted the need for {random.choice(['better cross-team communication','more frequent sensor calibration','stricter permit enforcement','improved PPE compliance monitoring'])}.",
            "regulatory_report_filed": severity in ["SERIOUS", "CRITICAL"],
        })

    return sorted(incidents, key=lambda x: x["date"])


def gen_permits(workers, equipment):
    permits = []
    now = datetime.now()

    for i in range(1, 31):
        ptype = random.choice(PERMIT_TYPES)
        issued = fake.date_time_between(start_date="-10d", end_date="now")
        duration_hrs = random.randint(2, 12)
        expiry = issued + timedelta(hours=duration_hrs)
        zone = random.choice(ZONES)
        issuer = random.choice(workers)
        holder = random.choice(workers)

        status = "ACTIVE" if expiry > now else "EXPIRED"
        if random.random() < 0.2:
            status = "CLOSED"

        eq = random.choice(equipment) if random.random() > 0.3 else None

        permits.append({
            "id":               f"PTW-{2024}-{i:04d}",
            "type":             ptype,
            "zone_id":          zone["id"],
            "zone_name":        zone["name"],
            "equipment_id":     eq["id"] if eq else None,
            "equipment_name":   eq["name"] if eq else None,
            "issued_by":        issuer["id"],
            "issued_by_name":   issuer["name"],
            "permit_holder":    holder["id"],
            "permit_holder_name": holder["name"],
            "issued_at":        issued.strftime("%Y-%m-%dT%H:%M:%S"),
            "expires_at":       expiry.strftime("%Y-%m-%dT%H:%M:%S"),
            "status":           status,
            "work_description": f"{ptype.replace(' Permit','')} work on {eq['name'] if eq else zone['name']}",
            "precautions":      random.sample([
                "Gas test every 30 minutes",
                "Continuous gas monitor required",
                "Fire extinguisher on standby",
                "Rescue team on alert",
                "Continuous supervision required",
                "Area barricaded",
                "Emergency contact established",
            ], k=random.randint(2, 4)),
            "ai_risk_score":    random.randint(10, 95),
            "ai_conflicts":     [] if random.random() > 0.3 else [
                f"Adjacent permit {random.choice(['PTW-2024-0021','PTW-2024-0014'])} — potential overlap"
            ],
        })

    return permits


def gen_sensor_history(sensors, days_back=7):
    """Generate time-series readings for the last N days."""
    history = []
    now = datetime.now()

    for sensor in sensors[:15]:  # First 15 sensors — enough for demo
        lo, hi = sensor["normal_min"], sensor["normal_max"]
        current = random.uniform(lo, hi)

        for hours_back in range(days_back * 24, 0, -1):
            ts = now - timedelta(hours=hours_back)

            # Random walk with occasional spikes
            drift = random.gauss(0, (hi - lo) * 0.03)
            current = max(lo * 0.5, min(hi * 1.4, current + drift))

            # Inject anomaly spike 2% of the time
            if random.random() < 0.02:
                current = random.uniform(sensor["warning_threshold"], sensor["critical_threshold"])

            history.append({
                "sensor_id": sensor["id"],
                "sensor_tag": sensor["tag"],
                "timestamp":  ts.strftime("%Y-%m-%dT%H:%M:%S"),
                "value":      round(current, 3),
                "unit":       sensor["unit"],
                "status":     ("CRITICAL" if current >= sensor["critical_threshold"]
                               else "WARNING" if current >= sensor["warning_threshold"]
                               else "NORMAL"),
            })

    return history


def gen_maintenance_records(equipment, workers):
    records = []
    for i in range(1, 121):
        eq = random.choice(equipment)
        maint_date = fake.date_between(start_date="-3y", end_date="today")
        tech = random.choice(workers)
        records.append({
            "id":               f"MR-{i:04d}",
            "equipment_id":     eq["id"],
            "equipment_name":   eq["name"],
            "maintenance_type": random.choice(["Preventive", "Corrective", "Predictive", "Condition-Based"]),
            "date":             str(maint_date),
            "duration_hrs":     round(random.uniform(1, 16), 1),
            "technician_id":    tech["id"],
            "technician_name":  tech["name"],
            "work_performed":   random.choice([
                "Bearing replacement", "Seal replacement", "Lubrication",
                "Alignment check", "Vibration analysis", "Pressure test",
                "Electrical insulation check", "Thermocouple replacement",
                "Control valve calibration", "Safety valve testing"
            ]),
            "parts_replaced":   random.sample([
                "Mechanical seal", "Ball bearing 6205", "O-ring set",
                "Coupling insert", "Impeller", "Shaft sleeve", "Gasket set"
            ], k=random.randint(0, 2)),
            "cost_inr":         random.randint(2000, 180000),
            "downtime_hrs":     round(random.uniform(0.5, 12), 1),
            "findings":         random.choice([
                "Normal wear — no issues", "Bearing wear detected — replaced",
                "Minor corrosion — cleaned", "Vibration elevated — balanced",
                "Seal leaking — replaced", "Alignment off — corrected"
            ]),
            "next_due":         str(maint_date + timedelta(days=random.randint(30,180))),
        })
    return records


def push_to_api(endpoint, data_list, label):
    """POST each record to the backend API."""
    try:
        import requests as req
        success, fail = 0, 0
        for item in data_list:
            r = req.post(f"{BASE_URL}/{endpoint}/", json=item, timeout=10)
            if r.status_code in (200, 201):
                success += 1
            else:
                fail += 1
        print(f"  → {label}: {success} pushed, {fail} failed")
    except Exception as e:
        print(f"  ✗ {label}: {e}")


def export_to_files(output_dir, all_data):
    os.makedirs(output_dir, exist_ok=True)
    for name, data in all_data.items():
        path = os.path.join(output_dir, f"{name}.json")
        with open(path, "w") as f:
            json.dump(data, f, indent=2, default=str)
        print(f"  → Saved {len(data):>4} records → {path}")


# ─── MAIN ────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SafetyOS Synthetic Data Generator")
    parser.add_argument("--push",   action="store_true", help="Push data to running backend")
    parser.add_argument("--export", action="store_true", help="Export JSON files to ./seed_data/")
    args = parser.parse_args()

    print("╔══════════════════════════════════════════════════════╗")
    print("║   SafetyOS — Synthetic Data Generator               ║")
    print("║   Indoil Refinery — Vizag Unit 3 (Synthetic)        ║")
    print("╚══════════════════════════════════════════════════════╝\n")

    print("Generating data...")
    equipment   = gen_equipment()
    sensors     = gen_sensors(equipment)
    workers     = gen_workers()
    incidents   = gen_incidents(workers)
    permits     = gen_permits(workers, equipment)
    history     = gen_sensor_history(sensors, days_back=7)
    maintenance = gen_maintenance_records(equipment, workers)

    all_data = {
        "zones":               ZONES,
        "equipment":           equipment,
        "sensors":             sensors,
        "workers":             workers,
        "incidents":           incidents,
        "permits":             permits,
        "sensor_history":      history,
        "maintenance_records": maintenance,
        "regulations":         REGULATIONS,
    }

    print(f"\n  ✅ Generated:")
    for name, data in all_data.items():
        print(f"     {len(data):>4} {name.replace('_',' ')}")

    if args.export:
        print("\n📁 Exporting to ./seed_data/ ...")
        export_to_files("./seed_data", all_data)
        print("  Done!")

    if args.push:
        print(f"\n📡 Pushing to {BASE_URL} ...")
        push_to_api("zones",      ZONES,      "Zones")
        push_to_api("equipment",  equipment,  "Equipment")
        push_to_api("sensors",    sensors,    "Sensors")
        push_to_api("workers",    workers,    "Workers")
        push_to_api("incidents",  incidents,  "Incidents")
        push_to_api("permits",    permits,    "Permits")
        print("  Done!")

    if not args.push and not args.export:
        print("\n📄 Preview (first record of each):")
        for name, data in all_data.items():
            if data:
                print(f"\n  [{name}] sample:")
                sample = json.dumps(data[0], indent=4, default=str)
                for line in sample.split("\n")[:8]:
                    print(f"    {line}")
                if len(sample.split("\n")) > 8:
                    print("    ...")

        print("\n💡 Usage:")
        print("   python synthetic_data_generator.py --export   # save JSON files")
        print("   python synthetic_data_generator.py --push     # push to backend API")
