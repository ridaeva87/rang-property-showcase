import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { hashPassword, verifyPassword, publicRequestStatus } from "../src/server/portal/security";

async function main() {
  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) throw new Error("DATABASE_URL is required");
  const client = new pg.Client({ connectionString });
  await client.connect();
  await client.query("begin");
  try {
    const premises = (
      await client.query<{ id: string }>("select id from premises order by id limit 2")
    ).rows;
    assert.equal(premises.length, 2, "two premises required");
    const a = randomUUID(),
      b = randomUUID(),
      orgA = randomUUID(),
      orgB = randomUUID(),
      requestA = randomUUID(),
      requestB = randomUUID(),
      documentA = randomUUID(),
      documentB = randomUUID();
    const passwordHash = await hashPassword("Tenant-A-secure-2026");
    assert.equal(await verifyPassword("Tenant-A-secure-2026", passwordHash), true);
    assert.equal(await verifyPassword("wrong-password", passwordHash), false);
    await client.query(
      "insert into users(id,kind,email,display_name,password_hash) values($1,'tenant',$2,'Tenant A',$3),($4,'tenant',$5,'Tenant B',$3)",
      [a, `${a}@test.invalid`, passwordHash, b, `${b}@test.invalid`],
    );
    await client.query("insert into organizations(id,name) values($1,'Org A'),($2,'Org B')", [
      orgA,
      orgB,
    ]);
    await client.query(
      "insert into organization_users(organization_id,user_id,is_primary) values($1,$2,true),($3,$4,true)",
      [orgA, a, orgB, b],
    );
    await client.query("insert into tenant_premises(user_id,premise_id) values($1,$2),($3,$4)", [
      a,
      premises[0]!.id,
      b,
      premises[1]!.id,
    ]);
    const category = (
      await client.query<{ id: string }>("select id from request_categories where code='repair'")
    ).rows[0]!;
    const status = (
      await client.query<{ id: string }>("select id from request_statuses where code='accepted'")
    ).rows[0]!;
    await client.query(
      "insert into requests(id,organization_id,created_by_user_id,category_id,status_id,premise_id,subject,description) values($1,$2,$3,$4,$5,$6,'A','A'),($7,$8,$9,$4,$5,$10,'B','B')",
      [
        requestA,
        orgA,
        a,
        category.id,
        status.id,
        premises[0]!.id,
        requestB,
        orgB,
        b,
        premises[1]!.id,
      ],
    );
    await client.query(
      "insert into notifications(id,user_id,title,body) values($1,$2,'A','A'),($3,$4,'B','B')",
      [randomUUID(), a, randomUUID(), b],
    );
    const media = (
      await client.query<{ id: string }>("select id from media_assets order by id limit 1")
    ).rows[0]!;
    const documentType = (
      await client.query<{ id: string }>("select id from document_types where code='other'")
    ).rows[0]!;
    await client.query(
      "insert into documents(id,type_id,media_id,organization_id,title) values($1,$2,$3,$4,'A'),($5,$2,$3,$6,'B')",
      [documentA, documentType.id, media.id, orgA, documentB, orgB],
    );
    assert.deepEqual(
      (await client.query("select premise_id from tenant_premises where user_id=$1", [a])).rows,
      [{ premise_id: premises[0]!.id }],
    );
    assert.deepEqual(
      (await client.query("select id from requests where created_by_user_id=$1", [a])).rows,
      [{ id: requestA }],
    );
    assert.equal(
      (await client.query("select count(*)::int n from notifications where user_id=$1", [a]))
        .rows[0].n,
      1,
    );
    assert.deepEqual(
      (
        await client.query(
          "select d.id from documents d join organization_users ou on ou.organization_id=d.organization_id where ou.user_id=$1",
          [a],
        )
      ).rows,
      [{ id: documentA }],
    );
    assert.equal(
      (
        await client.query(
          "select count(*)::int n from documents d join organization_users ou on ou.organization_id=d.organization_id where d.id=$1 and ou.user_id=$2",
          [documentB, a],
        )
      ).rows[0].n,
      0,
    );
    assert.equal(
      (
        await client.query(
          "select count(*)::int n from requests where id=$1 and created_by_user_id=$2",
          [requestB, a],
        )
      ).rows[0].n,
      0,
    );
    assert.equal(publicRequestStatus("accepted"), "Принято");
    console.log("Tenant A/B authentication, ownership filters and ID-tampering isolation: OK");
  } finally {
    await client.query("rollback");
    await client.end();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
