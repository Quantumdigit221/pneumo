import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Get Hostinger configuration variables safely
const dbHost = process.env.HOSTINGER_DB_HOST;
const dbUser = process.env.HOSTINGER_DB_USER;
const dbPassword = process.env.HOSTINGER_DB_PASSWORD;
const dbName = process.env.HOSTINGER_DB_NAME;
const dbPort = process.env.HOSTINGER_DB_PORT ? parseInt(process.env.HOSTINGER_DB_PORT, 10) : 3306;

let pool: mysql.Pool | null = null;
let isConfigured = false;
let lastError: string | null = null;

export function isMysqlConfigured(): boolean {
  return !!(process.env.HOSTINGER_DB_HOST && process.env.HOSTINGER_DB_USER && process.env.HOSTINGER_DB_NAME && process.env.HOSTINGER_DB_PASSWORD);
}

// Lazy initialization of MySQL client pool to avoid crash at startup
export async function getMysqlPool(): Promise<mysql.Pool | null> {
  if (!isMysqlConfigured()) {
    lastError = "Identifiants Hostinger MySQL manquants dans .env";
    return null;
  }
  
  if (!pool) {
    try {
      pool = mysql.createPool({
        host: process.env.HOSTINGER_DB_HOST,
        user: process.env.HOSTINGER_DB_USER,
        password: process.env.HOSTINGER_DB_PASSWORD,
        database: process.env.HOSTINGER_DB_NAME,
        port: process.env.HOSTINGER_DB_PORT ? parseInt(process.env.HOSTINGER_DB_PORT, 10) : 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 7000 // 7 seconds timeout for reliable cloud DB handshake
      });
      console.log("[Hostinger MySQL] Pool de connexion créé avec succès.");
    } catch (err: any) {
      console.error("[Hostinger MySQL] Échec d'initialisation du pool:", err);
      lastError = err.message || String(err);
      pool = null;
    }
  }
  return pool;
}

// Check database connection connection state with fast-fail timeout
export async function checkConnection(): Promise<{ connected: boolean; error: string | null; dbInfo: any }> {
  const dbInfo = {
    host: process.env.HOSTINGER_DB_HOST || 'Non configuré',
    database: process.env.HOSTINGER_DB_NAME || 'Non configuré',
    port: process.env.HOSTINGER_DB_PORT || '3306',
    configured: isMysqlConfigured()
  };

  if (!dbInfo.configured) {
    const missing = [];
    if (!process.env.HOSTINGER_DB_HOST) missing.push("Hôte");
    if (!process.env.HOSTINGER_DB_NAME) missing.push("Nom de la base");
    if (!process.env.HOSTINGER_DB_USER) missing.push("Nom d'utilisateur");
    if (!process.env.HOSTINGER_DB_PASSWORD) missing.push("Mot de passe");
    return {
      connected: false,
      error: `Configuration incomplète. Paramètre(s) manquant(s) : ${missing.join(', ')}.`,
      dbInfo
    };
  }

  let connection: any = null;
  try {
    const activePool = await getMysqlPool();
    if (!activePool) {
      return { connected: false, error: lastError || "Impossible d'initialiser le pool MySQL.", dbInfo };
    }
    
    // Fast ping with 7s timeout promise race
    const pingTask = async () => {
      connection = await activePool.getConnection();
      await connection.ping();
    };

    const timeoutTask = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Délai de connexion Hostinger MySQL dépassé (7s)")), 7000)
    );

    await Promise.race([pingTask(), timeoutTask]);
    return { connected: true, error: null, dbInfo };
  } catch (err: any) {
    console.warn("[Hostinger MySQL] Échec ou timeout du test de connexion ping:", err?.message || err);
    return { connected: false, error: err.message || String(err), dbInfo };
  } finally {
    if (connection) {
      try { connection.release(); } catch (_) {}
    }
  }
}

let tablesEnsured = false;
let tablesEnsuringPromise: Promise<void> | null = null;

// Automate creation of tables matching our types
export async function ensureTablesExist(force: boolean = false) {
  if (tablesEnsured && !force) return;
  if (tablesEnsuringPromise && !force) return tablesEnsuringPromise;

  tablesEnsuringPromise = (async () => {
    const activePool = await getMysqlPool();
    if (!activePool) return;

    let connection;
    try {
      connection = await activePool.getConnection();
      console.log("[Hostinger MySQL] Vérification et migration automatique des tables...");

    // 1. Centers Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS centers (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        phone VARCHAR(50),
        email VARCHAR(100),
        directorName VARCHAR(100),
        rnis VARCHAR(100),
        capacity INT,
        pispialias VARCHAR(100),
        isActive TINYINT(1) DEFAULT 1
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    try {
      await connection.query(`ALTER TABLE centers ADD COLUMN subscriptionPlan VARCHAR(50) NULL`);
    } catch (_) {}
    try {
      await connection.query(`ALTER TABLE centers ADD COLUMN subscriptionStatus VARCHAR(50) NULL`);
    } catch (_) {}

    // 2. Users Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        centerId VARCHAR(50),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(100) NOT NULL,
        role VARCHAR(50) NOT NULL,
        specialty VARCHAR(100),
        phone VARCHAR(50),
        avatarUrl TEXT,
        password VARCHAR(100) NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    try {
      await connection.query(`ALTER TABLE users ADD COLUMN password VARCHAR(100) NULL`);
    } catch (_) {}
    try {
      await connection.query(`ALTER TABLE users ADD COLUMN specialty VARCHAR(100) NULL`);
    } catch (_) {}
    try {
      await connection.query(`ALTER TABLE users ADD COLUMN phone VARCHAR(50) NULL`);
    } catch (_) {}
    try {
      await connection.query(`ALTER TABLE users ADD COLUMN avatarUrl TEXT NULL`);
    } catch (_) {}
    try {
      await connection.query(`ALTER TABLE users ADD COLUMN centerId VARCHAR(50) NULL`);
    } catch (_) {}

    // 3. Patients Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id VARCHAR(50) PRIMARY KEY,
        centerId VARCHAR(50) NOT NULL,
        code VARCHAR(50) NOT NULL,
        firstName VARCHAR(100) NOT NULL,
        lastName VARCHAR(100) NOT NULL,
        birthDate VARCHAR(50) NOT NULL,
        age INT NOT NULL,
        gender VARCHAR(10) NOT NULL,
        phone VARCHAR(50),
        address TEXT,
        email VARCHAR(100),
        bloodGroup VARCHAR(10),
        allergies TEXT,
        emergencyContact TEXT,
        createdAt VARCHAR(100)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    try {
      await connection.query(`ALTER TABLE patients ADD COLUMN email VARCHAR(100) NULL`);
    } catch (_) {}
    try {
      await connection.query(`ALTER TABLE patients ADD COLUMN bloodGroup VARCHAR(10) NULL`);
    } catch (_) {}
    try {
      await connection.query(`ALTER TABLE patients ADD COLUMN allergies TEXT NULL`);
    } catch (_) {}
    try {
      await connection.query(`ALTER TABLE patients ADD COLUMN emergencyContact TEXT NULL`);
    } catch (_) {}
    try {
      await connection.query(`ALTER TABLE patients ADD COLUMN hospitalNumber VARCHAR(100) NULL`);
    } catch (_) {}
    try {
      await connection.query(`ALTER TABLE patients ADD COLUMN profession VARCHAR(255) NULL`);
    } catch (_) {}
    try {
      await connection.query(`ALTER TABLE patients ADD COLUMN emergencyPhone VARCHAR(50) NULL`);
    } catch (_) {}
    try {
      await connection.query(`ALTER TABLE patients ADD COLUMN maritalStatus VARCHAR(60) NULL`);
    } catch (_) {}
    try {
      await connection.query(`ALTER TABLE patients ADD COLUMN educationLevel VARCHAR(60) NULL`);
    } catch (_) {}
    try {
      await connection.query(`ALTER TABLE patients ADD COLUMN chronicConditions TEXT NULL`);
    } catch (_) {}
    try {
      await connection.query(`ALTER TABLE patients ADD COLUMN smokingHistory LONGTEXT NULL`);
    } catch (_) {}
    try {
      await connection.query(`ALTER TABLE patients ADD COLUMN dpiDetails LONGTEXT NULL`);
    } catch (_) {}

    // 4. Tickets Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id VARCHAR(50) PRIMARY KEY,
        centerId VARCHAR(50) NOT NULL,
        ticketNumber VARCHAR(100) NOT NULL,
        patientId VARCHAR(50),
        patientName VARCHAR(255) NOT NULL,
        patientAge INT NOT NULL,
        patientGender VARCHAR(10) NOT NULL,
        patientPhone VARCHAR(50),
        patientAddress TEXT,
        serviceId VARCHAR(50) NOT NULL,
        serviceName VARCHAR(255) NOT NULL,
        serviceCategory VARCHAR(100),
        amount DECIMAL(10, 2) NOT NULL,
        paymentMethod VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        doctorId VARCHAR(50),
        insuranceId VARCHAR(100) NULL,
        insuranceCoverage INT NULL,
        createdAt VARCHAR(100) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Dynamic schema alteration check for existing environments
    try {
      await connection.query(`ALTER TABLE tickets ADD COLUMN insuranceId VARCHAR(100) NULL`);
    } catch (_) {}
    try {
      await connection.query(`ALTER TABLE tickets ADD COLUMN insuranceCoverage INT NULL`);
    } catch (_) {}

    // 5. Services Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS services (
        id VARCHAR(50) PRIMARY KEY,
        centerId VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL DEFAULT 0,
        emergencyPrice DECIMAL(10, 2) NOT NULL DEFAULT 0,
        ipmPrice DECIMAL(10, 2) NOT NULL DEFAULT 0,
        insurancePrice DECIMAL(10, 2) NOT NULL DEFAULT 0,
        durationMinutes INT DEFAULT 15,
        isActive TINYINT(1) DEFAULT 1
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure columns exist and have DEFAULT 0 on existing tables to avoid ER_BAD_NULL_ERROR
    try {
      await connection.query(`ALTER TABLE services ADD COLUMN IF NOT EXISTS emergencyPrice DECIMAL(10, 2) NOT NULL DEFAULT 0;`);
    } catch (_) {
      try {
        await connection.query(`ALTER TABLE services ADD COLUMN emergencyPrice DECIMAL(10, 2) NOT NULL DEFAULT 0;`);
      } catch (_) {}
    }

    try {
      await connection.query(`UPDATE services SET emergencyPrice = 0 WHERE emergencyPrice IS NULL;`);
    } catch (_) {}

    try {
      await connection.query(`ALTER TABLE services MODIFY COLUMN emergencyPrice DECIMAL(10, 2) NOT NULL DEFAULT 0;`);
    } catch (_) {
      try {
        await connection.query(`ALTER TABLE services MODIFY COLUMN emergencyPrice DECIMAL(10, 2) DEFAULT 0;`);
      } catch (_) {}
    }

    try {
      await connection.query(`UPDATE services SET price = 0 WHERE price IS NULL;`);
    } catch (_) {}

    try {
      await connection.query(`ALTER TABLE services MODIFY COLUMN price DECIMAL(10, 2) NOT NULL DEFAULT 0;`);
    } catch (_) {}

    // Ensure ipmPrice and insurancePrice columns exist in services table for existing databases
    try {
      await connection.query(`
        ALTER TABLE services ADD COLUMN IF NOT EXISTS ipmPrice DECIMAL(10, 2) NOT NULL DEFAULT 0;
      `);
    } catch (_) {
      try {
        await connection.query(`
          ALTER TABLE services ADD COLUMN ipmPrice DECIMAL(10, 2) NOT NULL DEFAULT 0;
        `);
      } catch (_) {}
    }

    try {
      await connection.query(`UPDATE services SET ipmPrice = 0 WHERE ipmPrice IS NULL;`);
    } catch (_) {}

    try {
      await connection.query(`ALTER TABLE services MODIFY COLUMN ipmPrice DECIMAL(10, 2) NOT NULL DEFAULT 0;`);
    } catch (_) {}

    try {
      await connection.query(`
        ALTER TABLE services ADD COLUMN IF NOT EXISTS insurancePrice DECIMAL(10, 2) NOT NULL DEFAULT 0;
      `);
    } catch (_) {
      try {
        await connection.query(`
          ALTER TABLE services ADD COLUMN insurancePrice DECIMAL(10, 2) NOT NULL DEFAULT 0;
        `);
      } catch (_) {}
    }

    try {
      await connection.query(`UPDATE services SET insurancePrice = 0 WHERE insurancePrice IS NULL;`);
    } catch (_) {}

    try {
      await connection.query(`ALTER TABLE services MODIFY COLUMN insurancePrice DECIMAL(10, 2) NOT NULL DEFAULT 0;`);
    } catch (_) {}

    // 6. Medicines Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS medicines (
        id VARCHAR(50) PRIMARY KEY,
        centerId VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        dci VARCHAR(255) NOT NULL,
        stock INT NOT NULL,
        minStock INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        expiryDate VARCHAR(50),
        category VARCHAR(100),
        batchNumber VARCHAR(100),
        form VARCHAR(100)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 7. Sales Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id VARCHAR(50) PRIMARY KEY,
        centerId VARCHAR(50) NOT NULL,
        ticketId VARCHAR(50),
        patientName VARCHAR(255),
        items LONGTEXT,
        totalAmount DECIMAL(10, 2) NOT NULL,
        paymentMethod VARCHAR(50) NOT NULL,
        createdAt VARCHAR(100) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 8. Consultations Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS consultations (
        id VARCHAR(50) PRIMARY KEY,
        centerId VARCHAR(50) NOT NULL,
        ticketId VARCHAR(50) NOT NULL,
        patientId VARCHAR(50) NOT NULL,
        doctorId VARCHAR(50) NOT NULL,
        patientName VARCHAR(255),
        doctorName VARCHAR(255),
        serviceName VARCHAR(255),
        date VARCHAR(100),
        weight DECIMAL(6, 2),
        temperature DECIMAL(5, 2),
        bloodPressure VARCHAR(50),
        symptoms TEXT,
        diagnosis TEXT,
        prescription TEXT,
        prescriptionItems TEXT,
        status VARCHAR(50) NOT NULL,
        createdAt VARCHAR(100) NOT NULL,
        updatedAt VARCHAR(100)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    try {
      await connection.query(`ALTER TABLE consultations ADD COLUMN chiefComplaint TEXT NULL`);
    } catch (_) {}
    try {
      await connection.query(`ALTER TABLE consultations ADD COLUMN twelveSteps LONGTEXT NULL`);
    } catch (_) {}
    try {
      await connection.query(`ALTER TABLE consultations ADD COLUMN aiAssistance LONGTEXT NULL`);
    } catch (_) {}

    // 9. Lab Results Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS lab_results (
        id VARCHAR(50) PRIMARY KEY,
        centerId VARCHAR(50) NOT NULL,
        patientId VARCHAR(50) NOT NULL,
        patientName VARCHAR(255) NOT NULL,
        testName VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL,
        value VARCHAR(255),
        unit VARCHAR(50),
        referenceRange VARCHAR(100),
        notes TEXT,
        authorizedBy VARCHAR(100),
        createdAt VARCHAR(100) NOT NULL,
        updatedAt VARCHAR(100)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 10. Appointments Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id VARCHAR(50) PRIMARY KEY,
        centerId VARCHAR(50) NOT NULL,
        patientId VARCHAR(50) NOT NULL,
        patientName VARCHAR(255) NOT NULL,
        patientPhone VARCHAR(50) NOT NULL,
        appointmentDate VARCHAR(50) NOT NULL,
        appointmentTime VARCHAR(20) NOT NULL,
        reason TEXT,
        status VARCHAR(50) NOT NULL,
        smsSent TINYINT(1) DEFAULT 0,
        reminderSent TINYINT(1) DEFAULT 0,
        doctorId VARCHAR(50),
        doctorName VARCHAR(255),
        createdAt VARCHAR(100) NOT NULL,
        updatedAt VARCHAR(100)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 11. Beds Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS beds (
        id VARCHAR(50) PRIMARY KEY,
        centerId VARCHAR(50) NOT NULL,
        roomNumber VARCHAR(50) NOT NULL,
        serviceCategory VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'available',
        patientId VARCHAR(50) NULL,
        pricePerDay INT NOT NULL DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 12. Hospitalizations Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS hospitalizations (
        id VARCHAR(50) PRIMARY KEY,
        centerId VARCHAR(50) NOT NULL,
        patientId VARCHAR(50) NOT NULL,
        patientName VARCHAR(255) NOT NULL,
        patientGender VARCHAR(10) NOT NULL,
        patientAge INT NOT NULL,
        bedId VARCHAR(50) NOT NULL,
        roomNumber VARCHAR(50) NOT NULL,
        doctorName VARCHAR(255) NULL,
        reason TEXT NOT NULL,
        admissionDate VARCHAR(100) NOT NULL,
        estimatedDischargeDate VARCHAR(100) NULL,
        actualDischargeDate VARCHAR(100) NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        totalCost INT DEFAULT 0,
        dailyNotes TEXT NULL,
        medications TEXT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 13. Mutuals Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS mutuals (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(100) NOT NULL,
        coveragePercent INT NOT NULL,
        unsettledAmount DECIMAL(12, 2) NOT NULL DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 14. Expenses Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(50) PRIMARY KEY,
        centerId VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
        date VARCHAR(100) NOT NULL,
        description TEXT NULL,
        paymentMethod VARCHAR(100) NOT NULL,
        createdBy VARCHAR(255) NOT NULL,
        createdAt VARCHAR(100) NOT NULL,
        receiptName VARCHAR(255) NULL,
        receiptData LONGTEXT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Migration: ensure columns receiptName and receiptData exist if table was previously created without them
    try {
      await connection.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receiptName VARCHAR(255) NULL;`);
      await connection.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receiptData LONGTEXT NULL;`);
    } catch {
      // Fallback for MySQL versions that don't support IF NOT EXISTS on ALTER TABLE
      try {
        const [cols]: any = await connection.query(`DESCRIBE expenses`);
        const existingCols = Array.isArray(cols) ? cols.map((c: any) => c.Field) : [];
        if (!existingCols.includes('receiptName')) {
          await connection.query(`ALTER TABLE expenses ADD COLUMN receiptName VARCHAR(255) NULL;`);
        }
        if (!existingCols.includes('receiptData')) {
          await connection.query(`ALTER TABLE expenses ADD COLUMN receiptData LONGTEXT NULL;`);
        }
      } catch {
        // Silently ignore if already exists
      }
    }

    // 15. Bank Transfers Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bank_transfers (
        id VARCHAR(50) PRIMARY KEY,
        centerId VARCHAR(50) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        method VARCHAR(50) NOT NULL,
        bankName VARCHAR(255) NOT NULL,
        accountNumber VARCHAR(50),
        referenceNumber VARCHAR(100) NOT NULL,
        date VARCHAR(100) NOT NULL,
        notes TEXT NULL,
        receiptName VARCHAR(255) NULL,
        receiptData LONGTEXT NULL,
        createdBy VARCHAR(255) NOT NULL,
        createdAt VARCHAR(100) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 16. Specialized Pneumo Records Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS specialized_pneumo (
        id VARCHAR(50) PRIMARY KEY,
        centerId VARCHAR(50) NOT NULL,
        patientId VARCHAR(50) NOT NULL,
        doctorId VARCHAR(50) NOT NULL,
        doctorName VARCHAR(255) NOT NULL,
        formType VARCHAR(100) NOT NULL,
        date VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        data LONGTEXT NULL,
        createdAt VARCHAR(100) NOT NULL,
        updatedAt VARCHAR(100)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    tablesEnsured = true;
    console.log("[Hostinger MySQL] Toutes les tables requises ont été vérifiées/créées avec succès.");
  } catch (err) {
    console.error("[Hostinger MySQL] Erreur lors de la vérification/création des tables:", err);
  } finally {
    if (connection) connection.release();
    tablesEnsuringPromise = null;
  }
  })();

  return tablesEnsuringPromise;
}

// Helper to sanitize and select columns list based on tableName dynamically
function getTableColumns(tableName: string): string[] {
  switch (tableName) {
    case 'centers':
      return ['id', 'name', 'address', 'phone', 'email', 'directorName', 'rnis', 'capacity', 'pispialias', 'isActive', 'subscriptionPlan', 'subscriptionStatus'];
    case 'users':
      return ['id', 'centerId', 'name', 'email', 'role', 'specialty', 'phone', 'avatarUrl', 'password'];
    case 'patients':
      return ['id', 'centerId', 'code', 'hospitalNumber', 'firstName', 'lastName', 'birthDate', 'age', 'gender', 'phone', 'address', 'email', 'bloodGroup', 'allergies', 'emergencyContact', 'emergencyPhone', 'profession', 'maritalStatus', 'educationLevel', 'chronicConditions', 'smokingHistory', 'dpiDetails', 'createdAt'];
    case 'tickets':
      return ['id', 'centerId', 'ticketNumber', 'patientId', 'patientName', 'patientAge', 'patientGender', 'patientPhone', 'patientAddress', 'serviceId', 'serviceName', 'serviceCategory', 'amount', 'paymentMethod', 'status', 'doctorId', 'insuranceId', 'insuranceCoverage', 'createdAt'];
    case 'services':
      return ['id', 'centerId', 'name', 'category', 'price', 'emergencyPrice', 'ipmPrice', 'insurancePrice', 'durationMinutes', 'isActive'];
    case 'medicines':
      return ['id', 'centerId', 'name', 'dci', 'stock', 'minStock', 'price', 'expiryDate', 'category', 'batchNumber', 'form'];
    case 'sales':
      return ['id', 'centerId', 'ticketId', 'patientName', 'items', 'totalAmount', 'paymentMethod', 'createdAt'];
    case 'consultations':
      return ['id', 'centerId', 'ticketId', 'patientId', 'doctorId', 'patientName', 'doctorName', 'serviceName', 'date', 'weight', 'temperature', 'bloodPressure', 'chiefComplaint', 'symptoms', 'diagnosis', 'prescription', 'prescriptionItems', 'twelveSteps', 'aiAssistance', 'status', 'createdAt', 'updatedAt'];
    case 'lab_results':
      return ['id', 'centerId', 'patientId', 'patientName', 'testName', 'category', 'status', 'value', 'unit', 'referenceRange', 'notes', 'authorizedBy', 'createdAt', 'updatedAt'];
    case 'appointments':
      return ['id', 'centerId', 'patientId', 'patientName', 'patientPhone', 'appointmentDate', 'appointmentTime', 'reason', 'status', 'smsSent', 'reminderSent', 'doctorId', 'doctorName', 'createdAt', 'updatedAt'];
    case 'beds':
      return ['id', 'centerId', 'roomNumber', 'serviceCategory', 'status', 'patientId', 'pricePerDay'];
    case 'hospitalizations':
      return ['id', 'centerId', 'patientId', 'patientName', 'patientGender', 'patientAge', 'bedId', 'roomNumber', 'doctorName', 'reason', 'admissionDate', 'estimatedDischargeDate', 'actualDischargeDate', 'status', 'totalCost', 'dailyNotes', 'medications'];
    case 'mutuals':
      return ['id', 'name', 'code', 'coveragePercent', 'unsettledAmount'];
    case 'expenses':
      return ['id', 'centerId', 'title', 'category', 'amount', 'date', 'description', 'paymentMethod', 'createdBy', 'createdAt', 'receiptName', 'receiptData'];
    case 'bank_transfers':
      return ['id', 'centerId', 'amount', 'method', 'bankName', 'accountNumber', 'referenceNumber', 'date', 'notes', 'receiptName', 'receiptData', 'createdBy', 'createdAt'];
    case 'specialized_pneumo':
      return ['id', 'centerId', 'patientId', 'doctorId', 'doctorName', 'formType', 'date', 'title', 'data', 'createdAt', 'updatedAt'];
    default:
      return [];
  }
}

// GET all items from a table
export async function queryAll(tableName: string): Promise<any[]> {
  const activePool = await getMysqlPool();
  if (!activePool) return [];

  // Allowed tables whitelist for security
  const whitelist = ['centers', 'users', 'patients', 'tickets', 'services', 'medicines', 'sales', 'consultations', 'lab_results', 'appointments', 'beds', 'hospitalizations', 'mutuals', 'expenses', 'bank_transfers', 'specialized_pneumo'];
  if (!whitelist.includes(tableName)) {
    throw new Error(`Table non autorisée : ${tableName}`);
  }

  try {
    const [rows]: any = await activePool.query(`SELECT * FROM \`${tableName}\``);
    
    // Parse JSON or deserialize special fields depending on table
    return rows.map((row: any) => {
      // Decode text fields that are stored serialized
      if (tableName === 'sales' && row.items && typeof row.items === 'string') {
        try {
          row.items = JSON.parse(row.items);
        } catch (e) {
          row.items = [];
        }
      }
      if (tableName === 'patients') {
        if (row.smokingHistory && typeof row.smokingHistory === 'string') {
          try {
            row.smokingHistory = JSON.parse(row.smokingHistory);
          } catch (e) {
            row.smokingHistory = undefined;
          }
        }
        if (row.dpiDetails && typeof row.dpiDetails === 'string') {
          try {
            const parsedDpi = JSON.parse(row.dpiDetails);
            if (parsedDpi && typeof parsedDpi === 'object') {
              Object.assign(row, parsedDpi);
            }
          } catch (e) {}
          delete row.dpiDetails;
        }
      }
      if (tableName === 'consultations') {
        if (row.prescriptionItems && typeof row.prescriptionItems === 'string') {
          try {
            row.prescriptionItems = JSON.parse(row.prescriptionItems);
          } catch (e) {
            row.prescriptionItems = [];
          }
        }
        if (row.twelveSteps && typeof row.twelveSteps === 'string') {
          try {
            row.twelveSteps = JSON.parse(row.twelveSteps);
          } catch (e) {
            row.twelveSteps = undefined;
          }
        }
        if (row.aiAssistance && typeof row.aiAssistance === 'string') {
          try {
            row.aiAssistance = JSON.parse(row.aiAssistance);
          } catch (e) {
            row.aiAssistance = undefined;
          }
        }
      }
      if (tableName === 'hospitalizations') {
        if (row.dailyNotes && typeof row.dailyNotes === 'string') {
          try {
            row.dailyNotes = JSON.parse(row.dailyNotes);
          } catch (e) {
            row.dailyNotes = [];
          }
        }
        if (row.medications && typeof row.medications === 'string') {
          try {
            row.medications = JSON.parse(row.medications);
          } catch (e) {
            row.medications = [];
          }
        }
      }

      if (tableName === 'specialized_pneumo') {
        if (row.data && typeof row.data === 'string') {
          try {
            row.data = JSON.parse(row.data);
          } catch (e) {
            row.data = {};
          }
        }
      }
      
      // Convert tinyint to boolean active states
      if (row.isActive !== undefined) {
        row.isActive = Boolean(row.isActive);
      }
      if (row.smsSent !== undefined) {
        row.smsSent = Boolean(row.smsSent);
      }
      if (row.reminderSent !== undefined) {
        row.reminderSent = Boolean(row.reminderSent);
      }
      // Ensure numeric datatypes are strictly numbers, preventing string concatenation from MySQL DECIMAL fields
      if (row.price !== undefined && row.price !== null) row.price = Number(row.price);
      if (row.emergencyPrice !== undefined && row.emergencyPrice !== null) row.emergencyPrice = Number(row.emergencyPrice);
      if (row.ipmPrice !== undefined && row.ipmPrice !== null) row.ipmPrice = Number(row.ipmPrice);
      if (row.insurancePrice !== undefined && row.insurancePrice !== null) row.insurancePrice = Number(row.insurancePrice);
      if (row.durationMinutes !== undefined && row.durationMinutes !== null) row.durationMinutes = Number(row.durationMinutes);
      if (row.amount !== undefined && row.amount !== null) row.amount = Number(row.amount);
      if (row.totalAmount !== undefined && row.totalAmount !== null) row.totalAmount = Number(row.totalAmount);
      if (row.insuranceCoverage !== undefined && row.insuranceCoverage !== null) row.insuranceCoverage = Number(row.insuranceCoverage);
      if (row.coveragePercent !== undefined && row.coveragePercent !== null) row.coveragePercent = Number(row.coveragePercent);
      if (row.unsettledAmount !== undefined && row.unsettledAmount !== null) row.unsettledAmount = Number(row.unsettledAmount);
      if (row.pricePerDay !== undefined && row.pricePerDay !== null) row.pricePerDay = Number(row.pricePerDay);
      if (row.totalCost !== undefined && row.totalCost !== null) row.totalCost = Number(row.totalCost);
      if (row.weight !== undefined && row.weight !== null) row.weight = Number(row.weight);
      if (row.temperature !== undefined && row.temperature !== null) row.temperature = Number(row.temperature);
      if (row.age !== undefined && row.age !== null) row.age = Number(row.age);
      if (row.patientAge !== undefined && row.patientAge !== null) row.patientAge = Number(row.patientAge);
      if (row.stock !== undefined && row.stock !== null) row.stock = Number(row.stock);
      if (row.minStock !== undefined && row.minStock !== null) row.minStock = Number(row.minStock);

      return row;
    });
  } catch (err) {
    console.error(`[Hostinger MySQL] Erreur SELECT sur ${tableName}:`, err);
    throw err;
  }
}

// SAVE (insert or update via REPLACE INTO equivalent or duplication logic) an item
export async function saveItem(tableName: string, item: any): Promise<boolean> {
  const activePool = await getMysqlPool();
  if (!activePool) return false;

  const whitelist = ['centers', 'users', 'patients', 'tickets', 'services', 'medicines', 'sales', 'consultations', 'lab_results', 'appointments', 'beds', 'hospitalizations', 'mutuals', 'expenses', 'bank_transfers', 'specialized_pneumo'];
  if (!whitelist.includes(tableName)) {
    throw new Error(`Table non autorisée : ${tableName}`);
  }

  try {
    const columns = getTableColumns(tableName);
    if (columns.length === 0) return false;

    // Prepare values matching schema columns
    const recordValues: any[] = [];
    const placeholders: string[] = [];
    const updates: string[] = [];

    // Deal with serialization and object unwrapping
    const rawData = item && item.data && typeof item.data === 'object' && tableName !== 'specialized_pneumo' ? { ...item.data, id: item.id || item.data.id } : item;
    const preparedItem = { ...rawData };
    if (tableName === 'specialized_pneumo') {
      if (preparedItem.data && typeof preparedItem.data !== 'string') {
        preparedItem.data = JSON.stringify(preparedItem.data);
      }
    }
    if (tableName === 'sales' && preparedItem.items && typeof preparedItem.items !== 'string') {
      preparedItem.items = JSON.stringify(preparedItem.items);
    }
    if (tableName === 'patients') {
      const dpiPayload: Record<string, any> = {};
      if (preparedItem.medicalAntecedents !== undefined) dpiPayload.medicalAntecedents = preparedItem.medicalAntecedents;
      if (preparedItem.consumptions !== undefined) dpiPayload.consumptions = preparedItem.consumptions;
      if (preparedItem.occupationalExposures !== undefined) dpiPayload.occupationalExposures = preparedItem.occupationalExposures;
      if (preparedItem.surgicalHistory !== undefined) dpiPayload.surgicalHistory = preparedItem.surgicalHistory;
      if (preparedItem.obgynHistory !== undefined) dpiPayload.obgynHistory = preparedItem.obgynHistory;
      if (preparedItem.district !== undefined) dpiPayload.district = preparedItem.district;
      if (preparedItem.region !== undefined) dpiPayload.region = preparedItem.region;
      if (preparedItem.notes !== undefined) dpiPayload.notes = preparedItem.notes;
      preparedItem.dpiDetails = Object.keys(dpiPayload).length > 0 ? JSON.stringify(dpiPayload) : null;
      if (preparedItem.smokingHistory && typeof preparedItem.smokingHistory !== 'string') {
        preparedItem.smokingHistory = JSON.stringify(preparedItem.smokingHistory);
      }
    }
    if (tableName === 'consultations') {
      if (preparedItem.prescriptionItems && typeof preparedItem.prescriptionItems !== 'string') {
        preparedItem.prescriptionItems = JSON.stringify(preparedItem.prescriptionItems);
      }
      if (preparedItem.twelveSteps && typeof preparedItem.twelveSteps !== 'string') {
        preparedItem.twelveSteps = JSON.stringify(preparedItem.twelveSteps);
      }
      if (preparedItem.aiAssistance && typeof preparedItem.aiAssistance !== 'string') {
        preparedItem.aiAssistance = JSON.stringify(preparedItem.aiAssistance);
      }
    }
    if (tableName === 'hospitalizations') {
      if (preparedItem.dailyNotes && typeof preparedItem.dailyNotes !== 'string') {
        preparedItem.dailyNotes = JSON.stringify(preparedItem.dailyNotes);
      }
      if (preparedItem.medications && typeof preparedItem.medications !== 'string') {
        preparedItem.medications = JSON.stringify(preparedItem.medications);
      }
    }

    // Convert booleans for tinyint storage
    if (preparedItem.isActive !== undefined) {
      preparedItem.isActive = preparedItem.isActive ? 1 : 0;
    }
    if (preparedItem.smsSent !== undefined) {
      preparedItem.smsSent = preparedItem.smsSent ? 1 : 0;
    }
    if (preparedItem.reminderSent !== undefined) {
      preparedItem.reminderSent = preparedItem.reminderSent ? 1 : 0;
    }

    for (const col of columns) {
      // Put default value or correct placeholder
      let val = preparedItem[col];
      if (col === 'centerId' && (val === undefined || val === null || val === '')) {
        // Safe fallback to prevent ER_BAD_NULL_ERROR
        val = 'center-1';
      } else if (tableName === 'services') {
        if (col === 'emergencyPrice' || col === 'ipmPrice' || col === 'insurancePrice') {
          val = (val !== undefined && val !== null && val !== '') 
            ? Number(val) 
            : (preparedItem.price !== undefined && preparedItem.price !== null && preparedItem.price !== '' ? Number(preparedItem.price) : 0);
        } else if (col === 'price') {
          val = (val !== undefined && val !== null && val !== '') ? Number(val) : 0;
        } else if (col === 'durationMinutes') {
          val = (val !== undefined && val !== null && val !== '') ? Number(val) : 15;
        } else if (col === 'isActive') {
          val = (val !== undefined && val !== null) ? (val ? 1 : 0) : 1;
        } else if (val === undefined) {
          val = null;
        }
      } else if (tableName === 'medicines') {
        if (col === 'price' || col === 'stock' || col === 'minStock') {
          val = (val !== undefined && val !== null && val !== '') ? Number(val) : 0;
        } else if (val === undefined) {
          val = null;
        }
      } else if (tableName === 'tickets') {
        if (col === 'amount') {
          val = (val !== undefined && val !== null && val !== '') ? Number(val) : 0;
        } else if (col === 'patientAge') {
          val = (val !== undefined && val !== null && val !== '') ? Number(val) : 0;
        } else if (val === undefined) {
          val = null;
        }
      } else if ((col === 'ticketId' || col === 'patientId' || col === 'doctorId') && tableName === 'consultations' && (val === undefined || val === null)) {
        val = '';
      } else if (val === undefined) {
        val = null;
      }
      recordValues.push(val);
      placeholders.push('?');
      updates.push(`\`${col}\` = VALUES(\`${col}\`)`);
    }

    const query = `
      INSERT INTO \`${tableName}\` (${columns.map(c => `\`${c}\``).join(', ')})
      VALUES (${placeholders.join(', ')})
      ON DUPLICATE KEY UPDATE ${updates.join(', ')};
    `;

    await activePool.execute(query, recordValues);
    return true;
  } catch (err) {
    console.error(`[Hostinger MySQL] Erreur de sauvegarde sur ${tableName}:`, err);
    throw err;
  }
}

// DELETE an item
export async function deleteItem(tableName: string, id: string): Promise<boolean> {
  const activePool = await getMysqlPool();
  if (!activePool) return false;

  const whitelist = ['centers', 'users', 'patients', 'tickets', 'services', 'medicines', 'sales', 'consultations', 'lab_results', 'appointments', 'beds', 'hospitalizations', 'mutuals', 'expenses', 'bank_transfers', 'specialized_pneumo'];
  if (!whitelist.includes(tableName)) {
    throw new Error(`Table non autorisée : ${tableName}`);
  }

  try {
    const query = `DELETE FROM \`${tableName}\` WHERE \`id\` = ?`;
    await activePool.execute(query, [id]);
    return true;
  } catch (err) {
    console.error(`[Hostinger MySQL] Erreur d'effacement sur ${tableName}:`, err);
    throw err;
  }
}

// SEED list of items securely
export async function seedTable(tableName: string, items: any[]): Promise<number> {
  const activePool = await getMysqlPool();
  if (!activePool || !items || items.length === 0) return 0;

  try {
    // Check if empty
    const [rows]: any = await activePool.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
    if (rows[0].count > 0) {
      return 0; // Don't overwrite existing tables
    }

    console.log(`[Hostinger MySQL] Insertion automatique de démarrage pour : ${tableName} (${items.length} items)...`);
    let count = 0;
    for (const item of items) {
      const ok = await saveItem(tableName, item);
      if (ok) count++;
    }
    return count;
  } catch (err) {
    console.error(`[Hostinger MySQL] Échec d'amorçage de la table ${tableName}:`, err);
    return 0;
  }
}

// BATCH SAVE multiple items in a single server call
export async function batchSaveItems(tableName: string, items: any[]): Promise<number> {
  const activePool = await getMysqlPool();
  if (!activePool || !items || items.length === 0) return 0;

  const whitelist = ['centers', 'users', 'patients', 'tickets', 'services', 'medicines', 'sales', 'consultations', 'lab_results', 'appointments', 'beds', 'hospitalizations', 'mutuals', 'expenses', 'bank_transfers', 'specialized_pneumo'];
  if (!whitelist.includes(tableName)) {
    throw new Error(`Table non autorisée : ${tableName}`);
  }

  let count = 0;
  // Process in chunks of 50 for optimal performance
  const CHUNK_SIZE = 50;
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    await Promise.all(chunk.map(async (item) => {
      try {
        const ok = await saveItem(tableName, item);
        if (ok) count++;
      } catch (err) {
        console.warn(`[Hostinger MySQL] Erreur saveItem batch sur ${tableName} id ${item.id}:`, err);
      }
    }));
  }
  return count;
}

// Bulk Truncate table elements to delete simulated/mock data
export async function truncateTables(tableNames: string[]): Promise<boolean> {
  const activePool = await getMysqlPool();
  if (!activePool) return false;

  const whitelist = ['centers', 'users', 'patients', 'tickets', 'services', 'medicines', 'sales', 'consultations', 'lab_results', 'appointments', 'beds', 'hospitalizations', 'mutuals', 'expenses', 'bank_transfers', 'specialized_pneumo'];
  const targets = tableNames.filter(name => whitelist.includes(name));
  if (targets.length === 0) return true;

  let connection;
  try {
    connection = await activePool.getConnection();
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of targets) {
      console.log(`[Hostinger MySQL] Purging table: ${table}`);
      await connection.query(`TRUNCATE TABLE \`${table}\``);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    return true;
  } catch (err) {
    console.error("[Hostinger MySQL] Erreur lors de la troncature en lot :", err);
    throw err;
  } finally {
    if (connection) connection.release();
  }
}
