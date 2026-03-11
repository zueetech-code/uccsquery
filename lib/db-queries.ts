import { query, queryOne } from './db-client';

// Client queries
export async function getClientByClientId(clientId: string) {
  return queryOne('SELECT * FROM clients WHERE client_id = $1', [clientId]);
}

export async function getAllClients() {
  return query('SELECT * FROM clients');
}

export async function createClient(data: {
  client_id: string;
  client_name: string;
  user_id?: number;
  status?: string;
  online_status?: string;
  data?: any;
}) {
  return queryOne(
    `INSERT INTO clients (client_id, client_name, user_id, status, online_status, data) 
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      data.client_id,
      data.client_name,
      data.user_id,
      data.status || 'active',
      data.online_status || 'offline',
      JSON.stringify(data.data || {}),
    ]
  );
}

export async function updateClientStatus(clientId: string, status: string) {
  return queryOne(
    `UPDATE clients SET status = $1, updated_at = NOW() WHERE client_id = $2 RETURNING *`,
    [status, clientId]
  );
}

export async function updateClientOnlineStatus(clientId: string, onlineStatus: string) {
  return queryOne(
    `UPDATE clients SET online_status = $1, last_heartbeat = NOW(), updated_at = NOW() WHERE client_id = $2 RETURNING *`,
    [onlineStatus, clientId]
  );
}

// Query/Command queries
export async function getCommandsByClientId(clientId: string) {
  return query(
    `SELECT c.* FROM commands c 
     JOIN clients cl ON c.client_id = cl.id 
     WHERE cl.client_id = $1 
     ORDER BY c.created_at DESC`,
    [clientId]
  );
}

export async function getCommandsCreatedToday(queryId: string, clientId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return query(
    `SELECT c.* FROM commands c 
     JOIN clients cl ON c.client_id = cl.id
     WHERE cl.client_id = $1 AND c.command_type = $2 AND c.created_at >= $3`,
    [clientId, queryId, today.toISOString()]
  );
}

export async function createCommand(data: {
  client_id: string;
  command_type: string;
  command_data?: any;
  status?: string;
}) {
  const client = await getClientByClientId(data.client_id);
  if (!client) {
    throw new Error('Client not found');
  }

  return queryOne(
    `INSERT INTO commands (client_id, command_type, command_data, status) 
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [client.id, data.command_type, JSON.stringify(data.command_data || {}), data.status || 'pending']
  );
}

// Report queries
export async function getReportByClientIdAndDate(clientId: string, date: string) {
  return queryOne(
    `SELECT r.* FROM reports r 
     JOIN clients c ON r.client_id = c.id
     WHERE c.client_id = $1 AND DATE(r.created_at) = $2`,
    [clientId, date]
  );
}

export async function getLatestReportByClientId(clientId: string) {
  return queryOne(
    `SELECT r.* FROM reports r 
     JOIN clients c ON r.client_id = c.id
     WHERE c.client_id = $1 
     ORDER BY r.created_at DESC LIMIT 1`,
    [clientId]
  );
}

export async function createReport(data: {
  client_id: string;
  report_type: string;
  report_data?: any;
}) {
  const client = await getClientByClientId(data.client_id);
  if (!client) {
    throw new Error('Client not found');
  }

  return queryOne(
    `INSERT INTO reports (report_id, client_id, report_type, report_data) 
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [
      `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      client.id,
      data.report_type,
      JSON.stringify(data.report_data || {}),
    ]
  );
}

// Agent queries
export async function getAllAgents() {
  return query('SELECT * FROM agents WHERE status = $1', ['active']);
}

export async function getAgentByAgentId(agentId: string) {
  return queryOne('SELECT * FROM agents WHERE agent_id = $1', [agentId])
}

export async function getClientsByIds(clientIds: string[]) {
  if (clientIds.length === 0) return []
  const placeholders = clientIds.map((_, i) => `$${i + 1}`).join(',')
  return query(`SELECT * FROM clients WHERE client_id IN (${placeholders})`, clientIds)
}

export async function getOnlineHeartbeats() {
  return query(
    `SELECT DISTINCT h.client_id, c.client_id 
     FROM agent_heartbeats h
     JOIN clients c ON h.client_id = c.id
     WHERE h.status = $1 AND h.created_at > NOW() - INTERVAL '1 hour'`,
    ['online']
  )
}

export async function getLatestSuccessfulCommands(clientId: string, commandType: string, limit: number = 1) {
  return query(
    `SELECT c.* FROM commands c
     JOIN clients cl ON c.client_id = cl.id
     WHERE cl.client_id = $1 AND c.command_type = $2 AND c.status = $3
     ORDER BY c.created_at DESC LIMIT $4`,
    [clientId, commandType, 'success', limit]
  )
}

export async function getReportByClientNameAndDate(clientName: string, date: string) {
  return queryOne(
    `SELECT r.* FROM reports r
     JOIN clients c ON r.client_id = c.id
     WHERE c.client_name = $1 AND DATE(r.created_at) = $2`,
    [clientName, date]
  )
};
}
