import { randomUUID } from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { pool } from "../db.js";

const auditTableName = process.env.AUDIT_DYNAMODB_TABLE?.trim();
const documentClient = auditTableName ? DynamoDBDocumentClient.from(new DynamoDBClient({})) : null;
const auditPartitionKey = "AUDIT";

export const getAuditActor = (req) => {
  return req.headers["x-staff-name"] || req.headers["x-staff-username"] || req.headers["x-staff-role"] || "system";
};

const mapAuditRow = (row) => ({
  id: row.id,
  action: row.action,
  entity_type: row.entity_type,
  entity_id: row.entity_id,
  entity_name: row.entity_name,
  actor: row.actor,
  metadata: row.metadata || {},
  created_at: row.created_at,
});

const mapAuditItem = (item) => ({
  id: item.id,
  action: item.action,
  entity_type: item.entityType,
  entity_id: item.entityId,
  entity_name: item.entityName ?? null,
  actor: item.actor,
  metadata: item.metadata || {},
  created_at: item.createdAt,
});

export const fetchRecentAuditLogs = async (limit = 25) => {
  if (documentClient) {
    const result = await documentClient.send(
      new QueryCommand({
        TableName: auditTableName,
        KeyConditionExpression: "pk = :pk",
        ExpressionAttributeValues: {
          ":pk": auditPartitionKey,
        },
        ScanIndexForward: false,
        Limit: limit,
      })
    );

    return (result.Items || []).map(mapAuditItem);
  }

  const result = await pool.query(
    `SELECT id, action, entity_type, entity_id, entity_name, actor, metadata, created_at
     FROM audit_logs
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows.map(mapAuditRow);
};

export const recordAudit = async ({
  action,
  entityType,
  entityId,
  entityName = null,
  actor = "system",
  metadata = {},
}) => {
  const createdAt = new Date().toISOString();

  try {
    await pool.query(
      `INSERT INTO audit_logs (action, entity_type, entity_id, entity_name, actor, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [action, entityType, String(entityId), entityName, actor, JSON.stringify(metadata)]
    );
  } catch (error) {
    console.error("Error writing audit log:", error);
  }

  if (!documentClient) {
    return;
  }

  try {
    await documentClient.send(
      new PutCommand({
        TableName: auditTableName,
        Item: {
          pk: auditPartitionKey,
          sk: `${createdAt}#${randomUUID()}`,
          id: randomUUID(),
          action,
          entityType,
          entityId: String(entityId),
          entityName,
          actor,
          metadata,
          createdAt,
        },
      })
    );
  } catch (error) {
    console.error("Error writing DynamoDB audit log:", error);
  }
};