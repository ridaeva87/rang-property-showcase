import {
  boolean,
  date,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const publicationStatus = pgEnum("publication_status", ["draft", "published", "archived"]);
export const offerType = pgEnum("offer_type", ["rent", "sale"]);
export const userKind = pgEnum("user_kind", ["tenant", "employee"]);
export const mediaKind = pgEnum("media_kind", ["image", "video", "document"]);
export const recipientKind = pgEnum("recipient_kind", ["user", "organization", "role", "all"]);
export const deliveryChannel = pgEnum("delivery_channel", ["in_app", "email", "telegram", "sms"]);
export const interestKind = pgEnum("interest_kind", [
  "viewing",
  "application",
  "release_waitlist",
  "details",
]);
export const contractStatus = pgEnum("contract_status", [
  "draft",
  "active",
  "suspended",
  "ended",
  "cancelled",
]);
export const requestVisibility = pgEnum("request_visibility", ["public", "internal"]);
export const meterReadingSource = pgEnum("meter_reading_source", [
  "tenant",
  "employee",
  "import",
  "integration",
]);
export const integrationSystem = pgEnum("integration_system", ["1c", "excel", "manual", "other"]);

export const propertyObjects = pgTable(
  "property_objects",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    address: text("address").notNull(),
    description: text("description"),
    latitude: decimal("latitude", { precision: 9, scale: 6 }),
    longitude: decimal("longitude", { precision: 9, scale: 6 }),
    parking: text("parking"),
    accessMode: text("access_mode"),
    territoryFeatures: jsonb("territory_features").$type<string[]>().default([]).notNull(),
    publicationStatus: publicationStatus("publication_status").default("draft").notNull(),
    sourceSystem: integrationSystem("source_system").default("manual").notNull(),
    externalId: text("external_id"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("property_objects_slug_uq").on(table.slug),
    index("property_objects_publication_idx").on(table.publicationStatus),
  ],
);

export const premiseTypes = pgTable(
  "premise_types",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("premise_types_code_uq").on(table.code)],
);

export const premiseStatuses = pgTable(
  "premise_statuses",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    isAvailable: boolean("is_available").default(false).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("premise_statuses_code_uq").on(table.code)],
);

export const premises = pgTable(
  "premises",
  {
    id: text("id").primaryKey(),
    objectId: text("object_id")
      .notNull()
      .references(() => propertyObjects.id, { onDelete: "restrict" }),
    typeId: text("type_id")
      .notNull()
      .references(() => premiseTypes.id, { onDelete: "restrict" }),
    statusId: text("status_id").references(() => premiseStatuses.id, { onDelete: "restrict" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    areaSqm: decimal("area_sqm", { precision: 12, scale: 2 }),
    usableAreaSqm: decimal("usable_area_sqm", { precision: 12, scale: 2 }),
    expectedReleaseOn: date("expected_release_on"),
    expectedReleaseLabel: text("expected_release_label"),
    publicationStatus: publicationStatus("publication_status").default("draft").notNull(),
    sourceSystem: integrationSystem("source_system").default("manual").notNull(),
    externalId: text("external_id"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("premises_slug_uq").on(table.slug),
    index("premises_object_idx").on(table.objectId),
    index("premises_catalog_idx").on(table.publicationStatus, table.statusId),
  ],
);

export const premiseCharacteristics = pgTable(
  "premise_characteristics",
  {
    id: text("id").primaryKey(),
    premiseId: text("premise_id")
      .notNull()
      .references(() => premises.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    label: text("label").notNull(),
    valueText: text("value_text"),
    valueNumber: decimal("value_number", { precision: 14, scale: 4 }),
    unit: text("unit"),
    groupName: text("group_name"),
    sortOrder: integer("sort_order").default(0).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("premise_characteristics_key_uq").on(table.premiseId, table.key),
    index("premise_characteristics_premise_idx").on(table.premiseId),
  ],
);

export const premisePurposes = pgTable(
  "premise_purposes",
  {
    premiseId: text("premise_id")
      .notNull()
      .references(() => premises.id, { onDelete: "cascade" }),
    purpose: text("purpose").notNull(),
  },
  (table) => [primaryKey({ columns: [table.premiseId, table.purpose] })],
);

export const propertyOffers = pgTable(
  "property_offers",
  {
    id: text("id").primaryKey(),
    premiseId: text("premise_id")
      .notNull()
      .references(() => premises.id, { onDelete: "cascade" }),
    type: offerType("type").notNull(),
    status: text("status"),
    rentPricePerSqm: decimal("rent_price_per_sqm", { precision: 14, scale: 2 }),
    totalMonthlyRent: decimal("total_monthly_rent", { precision: 14, scale: 2 }),
    salePrice: decimal("sale_price", { precision: 16, scale: 2 }),
    purchaseTerms: text("purchase_terms"),
    utilityCosts: text("utility_costs"),
    publicationStatus: publicationStatus("publication_status").default("draft").notNull(),
    validFrom: date("valid_from"),
    validTo: date("valid_to"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("property_offers_active_kind_uq").on(table.premiseId, table.type),
    index("property_offers_catalog_idx").on(table.type, table.publicationStatus),
  ],
);

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: text("id").primaryKey(),
    kind: mediaKind("kind").notNull(),
    storageKey: text("storage_key").notNull(),
    publicUrl: text("public_url"),
    title: text("title"),
    description: text("description"),
    altText: text("alt_text"),
    mimeType: text("mime_type"),
    byteSize: integer("byte_size"),
    width: integer("width"),
    height: integer("height"),
    durationSeconds: integer("duration_seconds"),
    checksumSha256: text("checksum_sha256"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("media_assets_storage_key_uq").on(table.storageKey)],
);

export const objectMedia = pgTable(
  "object_media",
  {
    objectId: text("object_id")
      .notNull()
      .references(() => propertyObjects.id, { onDelete: "cascade" }),
    mediaId: text("media_id")
      .notNull()
      .references(() => mediaAssets.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => [primaryKey({ columns: [table.objectId, table.mediaId] })],
);

export const premiseMedia = pgTable(
  "premise_media",
  {
    premiseId: text("premise_id")
      .notNull()
      .references(() => premises.id, { onDelete: "cascade" }),
    mediaId: text("media_id")
      .notNull()
      .references(() => mediaAssets.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => [primaryKey({ columns: [table.premiseId, table.mediaId] })],
);

export const organizations = pgTable(
  "organizations",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    legalName: text("legal_name"),
    taxId: text("tax_id"),
    registrationNumber: text("registration_number"),
    sourceSystem: integrationSystem("source_system").default("manual").notNull(),
    externalId: text("external_id"),
    ...timestamps,
  },
  (table) => [index("organizations_tax_id_idx").on(table.taxId)],
);

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    kind: userKind("kind").notNull(),
    email: text("email"),
    phone: text("phone"),
    displayName: text("display_name").notNull(),
    passwordHash: text("password_hash"),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_email_uq").on(table.email),
    uniqueIndex("users_phone_uq").on(table.phone),
  ],
);

export const organizationUsers = pgTable(
  "organization_users",
  {
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    isPrimary: boolean("is_primary").default(false).notNull(),
    ...timestamps,
  },
  (table) => [primaryKey({ columns: [table.organizationId, table.userId] })],
);

export const employees = pgTable(
  "employees",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    jobTitle: text("job_title"),
    ...timestamps,
  },
  (table) => [uniqueIndex("employees_user_uq").on(table.userId)],
);

export const roles = pgTable(
  "roles",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("roles_code_uq").on(table.code)],
);

export const permissions = pgTable(
  "permissions",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("permissions_code_uq").on(table.code)],
);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })],
);

export const userRoles = pgTable(
  "user_roles",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.userId, table.roleId] })],
);

export const leaseContracts = pgTable(
  "lease_contracts",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    number: text("number").notNull(),
    status: contractStatus("status").default("draft").notNull(),
    startsOn: date("starts_on").notNull(),
    endsOn: date("ends_on"),
    sourceSystem: integrationSystem("source_system").default("manual").notNull(),
    externalId: text("external_id"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("lease_contracts_number_uq").on(table.number),
    index("lease_contracts_org_idx").on(table.organizationId),
  ],
);

export const leasePremises = pgTable(
  "lease_premises",
  {
    contractId: text("contract_id")
      .notNull()
      .references(() => leaseContracts.id, { onDelete: "cascade" }),
    premiseId: text("premise_id")
      .notNull()
      .references(() => premises.id, { onDelete: "restrict" }),
    startsOn: date("starts_on").notNull(),
    endsOn: date("ends_on"),
  },
  (table) => [
    primaryKey({ columns: [table.contractId, table.premiseId, table.startsOn] }),
    index("lease_premises_premise_idx").on(table.premiseId),
  ],
);

export const requestCategories = pgTable(
  "request_categories",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("request_categories_code_uq").on(table.code)],
);
export const requestStatuses = pgTable(
  "request_statuses",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    isClosed: boolean("is_closed").default(false).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("request_statuses_code_uq").on(table.code)],
);

export const serviceCategories = pgTable(
  "service_categories",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("service_categories_code_uq").on(table.code)],
);
export const additionalServices = pgTable("additional_services", {
  id: text("id").primaryKey(),
  categoryId: text("category_id").references(() => serviceCategories.id, { onDelete: "restrict" }),
  title: text("title").notNull(),
  description: text("description"),
  priceDescription: text("price_description"),
  terms: text("terms"),
  publicationStatus: publicationStatus("publication_status").default("draft").notNull(),
  ...timestamps,
});

export const requests = pgTable(
  "requests",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").references(() => organizations.id, {
      onDelete: "restrict",
    }),
    createdByUserId: text("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    categoryId: text("category_id")
      .notNull()
      .references(() => requestCategories.id, { onDelete: "restrict" }),
    statusId: text("status_id")
      .notNull()
      .references(() => requestStatuses.id, { onDelete: "restrict" }),
    assigneeEmployeeId: text("assignee_employee_id").references(() => employees.id, {
      onDelete: "set null",
    }),
    premiseId: text("premise_id").references(() => premises.id, { onDelete: "set null" }),
    serviceId: text("service_id").references(() => additionalServices.id, { onDelete: "set null" }),
    subject: text("subject").notNull(),
    description: text("description").notNull(),
    ...timestamps,
  },
  (table) => [
    index("requests_org_idx").on(table.organizationId),
    index("requests_assignee_status_idx").on(table.assigneeEmployeeId, table.statusId),
  ],
);

export const requestComments = pgTable(
  "request_comments",
  {
    id: text("id").primaryKey(),
    requestId: text("request_id")
      .notNull()
      .references(() => requests.id, { onDelete: "cascade" }),
    authorUserId: text("author_user_id").references(() => users.id, { onDelete: "set null" }),
    visibility: requestVisibility("visibility").default("public").notNull(),
    body: text("body").notNull(),
    ...timestamps,
  },
  (table) => [index("request_comments_request_idx").on(table.requestId)],
);
export const requestStatusHistory = pgTable(
  "request_status_history",
  {
    id: text("id").primaryKey(),
    requestId: text("request_id")
      .notNull()
      .references(() => requests.id, { onDelete: "cascade" }),
    fromStatusId: text("from_status_id").references(() => requestStatuses.id, {
      onDelete: "restrict",
    }),
    toStatusId: text("to_status_id")
      .notNull()
      .references(() => requestStatuses.id, { onDelete: "restrict" }),
    changedByUserId: text("changed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    changedAt: timestamp("changed_at", { withTimezone: true }).defaultNow().notNull(),
    note: text("note"),
  },
  (table) => [index("request_status_history_request_idx").on(table.requestId)],
);

export const documentTypes = pgTable(
  "document_types",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("document_types_code_uq").on(table.code)],
);
export const documents = pgTable(
  "documents",
  {
    id: text("id").primaryKey(),
    typeId: text("type_id")
      .notNull()
      .references(() => documentTypes.id, { onDelete: "restrict" }),
    mediaId: text("media_id")
      .notNull()
      .references(() => mediaAssets.id, { onDelete: "restrict" }),
    organizationId: text("organization_id").references(() => organizations.id, {
      onDelete: "restrict",
    }),
    contractId: text("contract_id").references(() => leaseContracts.id, { onDelete: "restrict" }),
    premiseId: text("premise_id").references(() => premises.id, { onDelete: "restrict" }),
    objectId: text("object_id").references(() => propertyObjects.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    documentDate: date("document_date"),
    ...timestamps,
  },
  (table) => [
    index("documents_org_idx").on(table.organizationId),
    index("documents_contract_idx").on(table.contractId),
  ],
);

export const announcements = pgTable("announcements", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  ...timestamps,
});
export const announcementRecipients = pgTable(
  "announcement_recipients",
  {
    id: text("id").primaryKey(),
    announcementId: text("announcement_id")
      .notNull()
      .references(() => announcements.id, { onDelete: "cascade" }),
    kind: recipientKind("kind").notNull(),
    recipientId: text("recipient_id"),
    ...timestamps,
  },
  (table) => [index("announcement_recipients_announcement_idx").on(table.announcementId)],
);
export const notifications = pgTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    announcementId: text("announcement_id").references(() => announcements.id, {
      onDelete: "set null",
    }),
    channel: deliveryChannel("channel").default("in_app").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("notifications_user_read_idx").on(table.userId, table.readAt)],
);

export const favorites = pgTable(
  "favorites",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    premiseId: text("premise_id")
      .notNull()
      .references(() => premises.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.premiseId] })],
);
export const propertyInterests = pgTable(
  "property_interests",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    premiseId: text("premise_id")
      .notNull()
      .references(() => premises.id, { onDelete: "cascade" }),
    kind: interestKind("kind").notNull(),
    contactName: text("contact_name"),
    contactPhone: text("contact_phone"),
    contactEmail: text("contact_email"),
    note: text("note"),
    ...timestamps,
  },
  (table) => [index("property_interests_premise_idx").on(table.premiseId)],
);

export const adPlacements = pgTable(
  "ad_placements",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    offerText: text("offer_text"),
    promoCode: text("promo_code"),
    discountDescription: text("discount_description"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    publicationStatus: publicationStatus("publication_status").default("draft").notNull(),
    ...timestamps,
  },
  (table) => [index("ad_placements_org_idx").on(table.organizationId)],
);
export const adLeads = pgTable(
  "ad_leads",
  {
    id: text("id").primaryKey(),
    placementId: text("placement_id")
      .notNull()
      .references(() => adPlacements.id, { onDelete: "cascade" }),
    source: text("source"),
    contactName: text("contact_name"),
    contactPhone: text("contact_phone"),
    contactEmail: text("contact_email"),
    promoApplied: text("promo_applied"),
    ...timestamps,
  },
  (table) => [index("ad_leads_placement_idx").on(table.placementId)],
);

export const meterTypes = pgTable(
  "meter_types",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    unit: text("unit").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("meter_types_code_uq").on(table.code)],
);
export const meters = pgTable(
  "meters",
  {
    id: text("id").primaryKey(),
    premiseId: text("premise_id")
      .notNull()
      .references(() => premises.id, { onDelete: "restrict" }),
    typeId: text("type_id")
      .notNull()
      .references(() => meterTypes.id, { onDelete: "restrict" }),
    serialNumber: text("serial_number"),
    installedOn: date("installed_on"),
    removedOn: date("removed_on"),
    ...timestamps,
  },
  (table) => [index("meters_premise_idx").on(table.premiseId)],
);
export const meterReadings = pgTable(
  "meter_readings",
  {
    id: text("id").primaryKey(),
    meterId: text("meter_id")
      .notNull()
      .references(() => meters.id, { onDelete: "restrict" }),
    value: decimal("value", { precision: 16, scale: 4 }).notNull(),
    readingAt: timestamp("reading_at", { withTimezone: true }).notNull(),
    submittedByUserId: text("submitted_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    source: meterReadingSource("source").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("meter_readings_meter_time_uq").on(table.meterId, table.readingAt)],
);

export const expenseCategories = pgTable(
  "expense_categories",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("expense_categories_code_uq").on(table.code)],
);
export const accountingPeriods = pgTable(
  "accounting_periods",
  {
    id: text("id").primaryKey(),
    startsOn: date("starts_on").notNull(),
    endsOn: date("ends_on").notNull(),
    label: text("label").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("accounting_periods_dates_uq").on(table.startsOn, table.endsOn)],
);
export const accruals = pgTable(
  "accruals",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    contractId: text("contract_id").references(() => leaseContracts.id, { onDelete: "restrict" }),
    periodId: text("period_id")
      .notNull()
      .references(() => accountingPeriods.id, { onDelete: "restrict" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => expenseCategories.id, { onDelete: "restrict" }),
    amount: decimal("amount", { precision: 16, scale: 2 }).notNull(),
    currency: text("currency").default("RUB").notNull(),
    sourceSystem: integrationSystem("source_system").default("manual").notNull(),
    externalId: text("external_id"),
    ...timestamps,
  },
  (table) => [index("accruals_org_period_idx").on(table.organizationId, table.periodId)],
);
export const expenses = pgTable(
  "expenses",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    periodId: text("period_id")
      .notNull()
      .references(() => accountingPeriods.id, { onDelete: "restrict" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => expenseCategories.id, { onDelete: "restrict" }),
    amount: decimal("amount", { precision: 16, scale: 2 }).notNull(),
    currency: text("currency").default("RUB").notNull(),
    note: text("note"),
    ...timestamps,
  },
  (table) => [index("expenses_org_period_idx").on(table.organizationId, table.periodId)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    before: jsonb("before"),
    after: jsonb("after"),
    requestId: text("request_id"),
    ipHash: text("ip_hash"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
    index("audit_logs_actor_idx").on(table.actorUserId),
  ],
);

export const integrationMappings = pgTable(
  "integration_mappings",
  {
    id: text("id").primaryKey(),
    system: integrationSystem("system").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    externalId: text("external_id").notNull(),
    payloadHash: text("payload_hash"),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("integration_mappings_external_uq").on(
      table.system,
      table.entityType,
      table.externalId,
    ),
    index("integration_mappings_entity_idx").on(table.entityType, table.entityId),
  ],
);
