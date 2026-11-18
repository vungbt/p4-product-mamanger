'use strict';
/**
 * Infrastructure tables used by @p4/server-core: audit log, outbox, idempotency and rate limit.
 * Same columns as P4 (apps/api/src/sequelize/migrations).
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        CREATE TABLE audit_logs (
          id uuid PRIMARY KEY,
          actor_id uuid,
          action varchar(255) NOT NULL,
          resource_type varchar(255) NOT NULL,
          resource_id varchar(255) NOT NULL,
          outcome varchar(16) NOT NULL CHECK (outcome IN ('success', 'failure')),
          changes jsonb NOT NULL,
          request_id varchar(255),
          reason text,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE INDEX audit_logs_resource_idx ON audit_logs (resource_type, resource_id, created_at);
        CREATE INDEX audit_logs_actor_idx ON audit_logs (actor_id, created_at);

        CREATE TABLE domain_events (
          id uuid PRIMARY KEY,
          type varchar(255) NOT NULL,
          aggregate_type varchar(255) NOT NULL,
          aggregate_id varchar(255) NOT NULL,
          payload jsonb NOT NULL,
          status varchar(32) NOT NULL,
          attempts integer NOT NULL DEFAULT 0,
          available_at timestamptz NOT NULL,
          lease_until timestamptz,
          lease_token uuid,
          last_error_code varchar(255),
          dedupe_key varchar(255) UNIQUE,
          delivered_at timestamptz,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE INDEX domain_events_status_idx ON domain_events (status, available_at);

        CREATE TABLE idempotency_records (
          id uuid PRIMARY KEY,
          scope varchar(255) NOT NULL,
          actor_id uuid NOT NULL,
          key varchar(255) NOT NULL,
          request_hash varchar(255) NOT NULL,
          result jsonb NOT NULL,
          expires_at timestamptz NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          UNIQUE (scope, actor_id, key)
        );

        CREATE TABLE rate_limit_buckets (
          key varchar(255) PRIMARY KEY,
          count integer NOT NULL,
          reset_at timestamptz NOT NULL
        );
        CREATE INDEX rate_limit_buckets_reset_idx ON rate_limit_buckets (reset_at);
      `,
        { transaction },
      );
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'DROP TABLE rate_limit_buckets, idempotency_records, domain_events, audit_logs;',
    );
  },
};
