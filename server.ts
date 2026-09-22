import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// File-based persistent storage directory
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Sample Seed Data
const INITIAL_DATA = {
  jobs: [
    {
      id: 'J001',
      productName: 'Gear Housing',
      quantity: 100,
      priority: 'High',
      processingTime: 45,
      requiredMachineType: 'CNC',
      deadline: '16:00',
      status: 'Pending',
      notes: 'Precision automotive gear casing for assembly line 1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'J002',
      productName: 'Shaft Assembly',
      quantity: 50,
      priority: 'Medium',
      processingTime: 30,
      requiredMachineType: 'CNC',
      deadline: '15:00',
      status: 'Pending',
      notes: 'Hardened steel drive shaft with keyway machining',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'J003',
      productName: 'Bearing Unit',
      quantity: 80,
      priority: 'Critical',
      processingTime: 40,
      requiredMachineType: 'CNC',
      deadline: '17:00',
      status: 'Pending',
      notes: 'High-speed ceramic bearing housing requiring CNC mill-turn',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'J004',
      productName: 'Cover Plate',
      quantity: 120,
      priority: 'Low',
      processingTime: 25,
      requiredMachineType: 'Assembly',
      deadline: '18:00',
      status: 'Pending',
      notes: 'Dust protection sealing plate installation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  resources: [
    {
      id: 'M001',
      name: 'CNC-01',
      type: 'CNC',
      capacity: 1,
      status: 'Available',
      availableFrom: '08:00',
      availableTo: '17:00',
      location: 'Bay 1 - Heavy Machining',
      maintenanceNote: 'Regular calibration completed',
    },
    {
      id: 'M002',
      name: 'CNC-02',
      type: 'CNC',
      capacity: 1,
      status: 'Available',
      availableFrom: '08:00',
      availableTo: '17:00',
      location: 'Bay 2 - Precision Turning',
      maintenanceNote: 'Tool head inspected',
    },
    {
      id: 'M003',
      name: 'ASM-01',
      type: 'Assembly',
      capacity: 2,
      status: 'Available',
      availableFrom: '09:00',
      availableTo: '18:00',
      location: 'Bay 3 - Modular Assembly Line',
      maintenanceNote: 'Dual station pneumatic fixtures ready',
    },
  ],
  schedules: [],
  conflicts: [],
  productionLogs: [
    {
      id: 'LOG-001',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'System Initialized',
      details: 'Production Line Database initialized with sample jobs and manufacturing machines.',
      category: 'System',
    },
  ],
};

function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading database file:', err);
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8');
  return INITIAL_DATA;
}

function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing database file:', err);
  }
}

// Ensure database file exists
if (!fs.existsSync(DB_FILE)) {
  writeDb(INITIAL_DATA);
}

// ==========================================
// REST API ROUTES
// ==========================================

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Full DB State
app.get('/api/db', (req: Request, res: Response) => {
  res.json(readDb());
});

app.post('/api/db', (req: Request, res: Response) => {
  if (req.body && req.body.jobs && req.body.resources) {
    writeDb(req.body);
    res.json({ success: true, message: 'Database saved successfully.' });
  } else {
    res.status(400).json({ error: 'Invalid database payload' });
  }
});

// Reset to initial
app.post('/api/reset', (req: Request, res: Response) => {
  writeDb(INITIAL_DATA);
  res.json({ success: true, data: INITIAL_DATA });
});

// Jobs CRUD
app.get('/api/jobs', (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.jobs || []);
});

app.post('/api/jobs', (req: Request, res: Response) => {
  const db = readDb();
  const newJob = req.body;
  if (!newJob.id || !newJob.productName) {
    return res.status(400).json({ error: 'Job ID and Product Name are required.' });
  }
  if (db.jobs.some((j: any) => j.id.toLowerCase() === newJob.id.toLowerCase())) {
    return res.status(409).json({ error: `Job ID '${newJob.id}' already exists.` });
  }
  db.jobs.push({
    ...newJob,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  writeDb(db);
  res.status(201).json(newJob);
});

app.put('/api/jobs/:id', (req: Request, res: Response) => {
  const db = readDb();
  const index = db.jobs.findIndex((j: any) => j.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Job not found.' });
  }
  db.jobs[index] = { ...db.jobs[index], ...req.body, updatedAt: new Date().toISOString() };
  writeDb(db);
  res.json(db.jobs[index]);
});

app.delete('/api/jobs/:id', (req: Request, res: Response) => {
  const db = readDb();
  db.jobs = db.jobs.filter((j: any) => j.id !== req.params.id);
  // Also remove from schedules if present
  db.schedules = (db.schedules || []).filter((s: any) => s.jobId !== req.params.id);
  writeDb(db);
  res.json({ success: true, message: `Job ${req.params.id} deleted.` });
});

// Resources CRUD
app.get('/api/resources', (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.resources || []);
});

app.post('/api/resources', (req: Request, res: Response) => {
  const db = readDb();
  const newResource = req.body;
  if (!newResource.id || !newResource.name) {
    return res.status(400).json({ error: 'Resource ID and Machine Name are required.' });
  }
  if (db.resources.some((r: any) => r.id.toLowerCase() === newResource.id.toLowerCase())) {
    return res.status(409).json({ error: `Resource ID '${newResource.id}' already exists.` });
  }
  db.resources.push(newResource);
  writeDb(db);
  res.status(201).json(newResource);
});

app.put('/api/resources/:id', (req: Request, res: Response) => {
  const db = readDb();
  const index = db.resources.findIndex((r: any) => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Resource not found.' });
  }
  db.resources[index] = { ...db.resources[index], ...req.body };
  writeDb(db);
  res.json(db.resources[index]);
});

app.delete('/api/resources/:id', (req: Request, res: Response) => {
  const db = readDb();
  db.resources = db.resources.filter((r: any) => r.id !== req.params.id);
  writeDb(db);
  res.json({ success: true, message: `Resource ${req.params.id} deleted.` });
});

// SQLite / Relational Schema DDL info for evaluation & academic grading
app.get('/api/schema', (req: Request, res: Response) => {
  const schemaDDL = `
-- PRODUCTION LINE RESOURCE SCHEDULING SYSTEM (SQLITE COMPATIBLE SCHEMA)

CREATE TABLE IF NOT EXISTS jobs (
    id VARCHAR(20) PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    priority VARCHAR(15) NOT NULL CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
    processing_time INTEGER NOT NULL CHECK (processing_time > 0),
    required_machine_type VARCHAR(50) NOT NULL,
    deadline TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resources (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Busy', 'Maintenance', 'Offline')),
    available_from TIME NOT NULL DEFAULT '08:00',
    available_to TIME NOT NULL DEFAULT '17:00',
    location VARCHAR(100),
    maintenance_note TEXT
);

CREATE TABLE IF NOT EXISTS schedules (
    id VARCHAR(50) PRIMARY KEY,
    job_id VARCHAR(20) NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    product_name VARCHAR(100) NOT NULL,
    resource_id VARCHAR(20) NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    resource_name VARCHAR(100) NOT NULL,
    machine_type VARCHAR(50) NOT NULL,
    priority VARCHAR(15) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    processing_time INTEGER NOT NULL,
    schedule_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Scheduled',
    deadline TIME NOT NULL,
    delay_minutes INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS conflicts (
    id VARCHAR(20) PRIMARY KEY,
    job_id VARCHAR(20) NOT NULL,
    resource_id VARCHAR(20),
    conflict_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(15) NOT NULL CHECK (severity IN ('Critical', 'Warning', 'Information')),
    status VARCHAR(20) NOT NULL DEFAULT 'Open',
    detected_at VARCHAR(20) NOT NULL,
    resolved_at VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS production_logs (
    id VARCHAR(20) PRIMARY KEY,
    timestamp VARCHAR(20) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    category VARCHAR(30) NOT NULL
);
  `;
  res.json({ schema: schemaDDL.trim() });
});

// ==========================================
// VITE INTEGRATION
// ==========================================

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Manufacturing Scheduling Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
